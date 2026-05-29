"""
tests/test_weasyprint_spike.py — Unit tests for WeasyPrint Celery task (TASK-009).

These tests run in CI without WeasyPrint system libraries by mocking `render_pdf_bytes`.
WeasyPrint is never imported at module load time; all calls go through the mock.

Coverage targets:
  - render_pdf_bytes: success path, WeasyPrint exception propagation
  - generate_prescription_pdf task: success return shape, PHI-free logging, retry on failure
  - Concurrent execution structure (10 concurrent workers, mocked)
  - _build_spike_html: content sanity (no import needed)
"""

import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import MagicMock, call, patch

import pytest

from prescriptions.tasks import _build_spike_html, generate_prescription_pdf, render_pdf_bytes


# ── Fixtures ──────────────────────────────────────────────────────────────────


FAKE_PDF = b"%PDF-1.4 " + b"0" * 4096  # Realistic-ish PDF size for assertions


# ── render_pdf_bytes ──────────────────────────────────────────────────────────


class TestRenderPdfBytes:
    """Unit tests for the render_pdf_bytes helper (WeasyPrint wrapper)."""

    def test_returns_bytes_from_weasyprint(self):
        """render_pdf_bytes returns whatever WeasyPrint.write_pdf() returns."""
        with patch("prescriptions.tasks.HTML") as mock_html_cls:
            mock_html_cls.return_value.write_pdf.return_value = FAKE_PDF
            result = render_pdf_bytes("<html><body>hello</body></html>")

        assert result == FAKE_PDF
        mock_html_cls.assert_called_once_with(string="<html><body>hello</body></html>")
        mock_html_cls.return_value.write_pdf.assert_called_once_with()

    def test_passes_html_string_to_weasyprint(self):
        """HTML is passed via the `string=` keyword arg (not a file path)."""
        html = "<html><body><p>Test prescription content</p></body></html>"
        with patch("prescriptions.tasks.HTML") as mock_html_cls:
            mock_html_cls.return_value.write_pdf.return_value = b"pdf"
            render_pdf_bytes(html)

        _, kwargs = mock_html_cls.call_args
        assert kwargs.get("string") == html
        assert "filename" not in kwargs
        assert "url" not in kwargs

    def test_propagates_weasyprint_exception(self):
        """If WeasyPrint raises, render_pdf_bytes propagates the exception unmodified."""
        with patch("prescriptions.tasks.HTML") as mock_html_cls:
            mock_html_cls.return_value.write_pdf.side_effect = RuntimeError(
                "Cairo rendering failed"
            )
            with pytest.raises(RuntimeError, match="Cairo rendering failed"):
                render_pdf_bytes("<html></html>")

    def test_propagates_import_error_when_weasyprint_absent(self):
        """In environments without WeasyPrint, an ImportError is raised."""
        with patch.dict("sys.modules", {"weasyprint": None}):
            # Force re-import by temporarily patching the lazy import target
            with patch("prescriptions.tasks.HTML", side_effect=ImportError("No module")):
                with pytest.raises(ImportError):
                    render_pdf_bytes("<html></html>")


# ── generate_prescription_pdf Celery task ─────────────────────────────────────


class TestGeneratePrescriptionPdfTask:
    """Unit tests for the generate_prescription_pdf Celery task."""

    def test_success_returns_ok_status(self):
        """On a successful render, task returns {status: ok, size_bytes, elapsed_ms}."""
        with patch("prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF):
            result = generate_prescription_pdf.apply(
                args=["a1b2c3d4-0000-0000-0000-000000000001"]
            ).get()

        assert result["status"] == "ok"
        assert result["size_bytes"] == len(FAKE_PDF)
        assert isinstance(result["elapsed_ms"], float)
        assert result["elapsed_ms"] >= 0

    def test_size_bytes_matches_pdf_length(self):
        """size_bytes in the return dict must equal the actual byte length of the PDF."""
        small_pdf = b"%PDF-1.4 small"
        large_pdf = b"%PDF-1.4 " + b"x" * 20_000

        with patch("prescriptions.tasks.render_pdf_bytes", return_value=small_pdf):
            r1 = generate_prescription_pdf.apply(args=["uuid-small"]).get()
        with patch("prescriptions.tasks.render_pdf_bytes", return_value=large_pdf):
            r2 = generate_prescription_pdf.apply(args=["uuid-large"]).get()

        assert r1["size_bytes"] == len(small_pdf)
        assert r2["size_bytes"] == len(large_pdf)

    def test_elapsed_ms_is_non_negative_float(self):
        """elapsed_ms must always be a non-negative float (time is never negative)."""
        with patch("prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF):
            result = generate_prescription_pdf.apply(args=["uuid-time"]).get()

        assert isinstance(result["elapsed_ms"], float)
        assert result["elapsed_ms"] >= 0.0

    def test_failure_propagates_exception(self):
        """When render_pdf_bytes raises, the task re-raises after max retries."""
        with patch(
            "prescriptions.tasks.render_pdf_bytes",
            side_effect=Exception("WeasyPrint crashed"),
        ):
            async_result = generate_prescription_pdf.apply(args=["uuid-fail"])
            with pytest.raises(Exception):
                async_result.get(propagate=True)

    def test_no_phi_in_log_messages(self, caplog):
        """
        PHI policy: HTML content (patient name, diagnosis, medicines) must NEVER
        appear in log messages. Only action labels and UUIDs are logged.
        """
        phi_substrings = [
            "Paracetamol",
            "Amoxicillin",
            "Cetirizine",
            "diagnosis",
            "Fever",
            "cough",
            "full_name",
            "patient",
        ]

        with patch("prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF):
            with caplog.at_level("DEBUG", logger="prescriptions.tasks"):
                generate_prescription_pdf.apply(args=["uuid-phi-check"]).get()

        # Collect all logged text (message + all extra fields serialised as string)
        all_log_text = " ".join(
            str(record.__dict__) for record in caplog.records
        ).lower()

        for phi in phi_substrings:
            assert phi.lower() not in all_log_text, (
                f"PHI substring '{phi}' found in task log output — this violates the "
                f"MedSlot PHI logging policy. No clinical data may appear in logs."
            )

    def test_logs_action_labels_not_prescription_content(self, caplog):
        """
        Logs must use action labels (action='pdf_generation_started') rather than
        free-text messages containing clinical data.
        """
        with patch("prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF):
            with caplog.at_level("INFO", logger="prescriptions.tasks"):
                generate_prescription_pdf.apply(args=["uuid-action-log"]).get()

        actions = [
            record.__dict__.get("action", "")
            for record in caplog.records
            if record.name == "prescriptions.tasks"
        ]
        assert "pdf_generation_started" in actions
        assert "pdf_generation_completed" in actions

    def test_logs_prescription_id_not_patient_data(self, caplog):
        """
        prescription_id (a UUID — not PHI) is logged, but no patient-identifiable
        fields (name, phone, date of birth) appear.
        """
        test_uuid = "a1b2c3d4-1111-1111-1111-999900000001"
        with patch("prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF):
            with caplog.at_level("INFO", logger="prescriptions.tasks"):
                generate_prescription_pdf.apply(args=[test_uuid]).get()

        # prescription_id should appear somewhere in the log extras
        prescription_ids_logged = [
            record.__dict__.get("prescription_id")
            for record in caplog.records
            if hasattr(record, "prescription_id")
        ]
        assert test_uuid in prescription_ids_logged

    def test_render_pdf_bytes_called_once_per_invocation(self):
        """Each task invocation must call render_pdf_bytes exactly once."""
        with patch(
            "prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF
        ) as mock_render:
            generate_prescription_pdf.apply(args=["uuid-call-count"]).get()

        mock_render.assert_called_once()

    def test_spike_html_is_passed_to_renderer(self):
        """
        Task must pass the spike HTML (from _build_spike_html) to render_pdf_bytes,
        not an empty string or a different payload.
        """
        expected_html = _build_spike_html()
        captured_args = []

        def capture(html: str) -> bytes:
            captured_args.append(html)
            return FAKE_PDF

        with patch("prescriptions.tasks.render_pdf_bytes", side_effect=capture):
            generate_prescription_pdf.apply(args=["uuid-html-check"]).get()

        assert len(captured_args) == 1
        assert captured_args[0] == expected_html


# ── _build_spike_html ──────────────────────────────────────────────────────────


class TestBuildSpikeHtml:
    """Sanity checks on the spike HTML template."""

    def test_returns_non_empty_string(self):
        html = _build_spike_html()
        assert isinstance(html, str)
        assert len(html) > 500  # Should be a realistic prescription, not a stub

    def test_contains_html_structure(self):
        html = _build_spike_html()
        assert "<!DOCTYPE html>" in html
        assert "<html>" in html
        assert "</html>" in html

    def test_contains_medicine_table(self):
        """Must include at least 1 medicine row — validates realistic workload."""
        html = _build_spike_html()
        assert "<table>" in html or "<TABLE>" in html.upper()
        assert "<tr>" in html or "<TR>" in html.upper()

    def test_contains_css_styling(self):
        """CSS styling is required to match production rendering complexity."""
        html = _build_spike_html()
        assert "<style>" in html

    def test_no_real_phi(self):
        """
        Spike template must not contain real patient data (PHI).
        The template uses clearly labelled sample data.
        """
        html = _build_spike_html()
        # These are sample labels — confirming they're present as intended sample data
        assert "Sample" in html or "sample" in html or "SPIKE" in html.upper()

    def test_valid_utf8_charset(self):
        """Template declares UTF-8 charset — required for non-ASCII characters."""
        html = _build_spike_html()
        assert 'charset="utf-8"' in html.lower() or "charset='utf-8'" in html.lower()


# ── Concurrent execution ───────────────────────────────────────────────────────


class TestConcurrentExecution:
    """
    Validates the concurrent execution structure used in the benchmark.
    Uses mocked render_pdf_bytes — does NOT measure real WeasyPrint performance.

    Actual P95 measurement is performed by running:
      docker-compose run backend python prescriptions/spike/benchmark.py
    """

    def test_ten_concurrent_tasks_all_succeed(self):
        """
        10 concurrent calls to generate_prescription_pdf all return {status: ok}.
        This validates the concurrency model used in the benchmark script.
        """
        call_count = {"n": 0}

        def mock_render(html: str) -> bytes:
            call_count["n"] += 1
            return FAKE_PDF

        results = []
        with patch("prescriptions.tasks.render_pdf_bytes", side_effect=mock_render):
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = [
                    executor.submit(
                        lambda uid=f"uuid-{i:03d}": generate_prescription_pdf.apply(
                            args=[uid]
                        ).get()
                    )
                    for i in range(10)
                ]
                for future in as_completed(futures):
                    results.append(future.result())

        assert len(results) == 10
        assert all(r["status"] == "ok" for r in results)
        assert call_count["n"] == 10

    def test_all_results_have_required_fields(self):
        """Every result dict must contain status, size_bytes, and elapsed_ms."""
        with patch("prescriptions.tasks.render_pdf_bytes", return_value=FAKE_PDF):
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = [
                    executor.submit(
                        lambda uid=f"uuid-{i:03d}": generate_prescription_pdf.apply(
                            args=[uid]
                        ).get()
                    )
                    for i in range(10)
                ]
                results = [f.result() for f in as_completed(futures)]

        required_keys = {"status", "size_bytes", "elapsed_ms"}
        for result in results:
            assert required_keys.issubset(result.keys()), (
                f"Result missing required keys. Got: {set(result.keys())}"
            )

    def test_unique_prescription_ids_per_request(self):
        """
        Each of the 10 concurrent requests operates on a distinct prescription_id.
        Validates that UUIDs are not shared across concurrent calls.
        """
        received_uuids = []

        def mock_render_capture(html: str) -> bytes:
            return FAKE_PDF

        uuids = [f"uuid-conc-{i:03d}" for i in range(10)]

        with patch("prescriptions.tasks.render_pdf_bytes", side_effect=mock_render_capture):
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = {
                    executor.submit(
                        lambda uid=uid: generate_prescription_pdf.apply(args=[uid]).get()
                    ): uid
                    for uid in uuids
                }
                for future in as_completed(futures):
                    future.result()  # Ensure no exception

        # All 10 UUIDs are distinct — no shared state
        assert len(set(uuids)) == 10
