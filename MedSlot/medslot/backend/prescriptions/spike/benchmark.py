"""
WeasyPrint Spike Benchmark — TASK-009
======================================
Measures P95 PDF generation time for 10 concurrent requests.

Acceptance criterion (NFR-PE-004): P95 < 4000ms
  → PASS: Proceed with WeasyPrint (document result in 06-task-breakdown-assumptions.md)
  → FAIL: Escalate as Tier 1 gap before TASK-075 is scheduled

Usage (inside Docker):
  docker-compose run backend python prescriptions/spike/benchmark.py

Usage (local, if WeasyPrint system deps available):
  cd medslot/backend
  DJANGO_SETTINGS_MODULE=medslot.settings.local python prescriptions/spike/benchmark.py

Notes:
  - WeasyPrint loads fonts on first call (warm-up run is included to isolate this)
  - Benchmark simulates production-equivalent HTML (1 page, 3 medicines, CSS table)
  - ThreadPoolExecutor concurrency=10 matches the "10 concurrent PDF generation requests"
    scenario from TASK-009 acceptance criteria
"""

import os
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Environment setup ────────────────────────────────────────────────────────
# Add the backend root (medslot/backend/) to sys.path so we can import prescriptions.*
_backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medslot.settings.local")

try:
    import django

    django.setup()
except Exception as exc:  # noqa: BLE001
    # Django setup can fail in minimal environments — not required for the PDF benchmark
    print(f"⚠️  Django setup skipped ({exc}). Benchmark will still run.")

# ── WeasyPrint import ─────────────────────────────────────────────────────────
try:
    from weasyprint import HTML  # noqa: F401 — import-check only; render_pdf_bytes handles the call
except ImportError:
    print(
        "ERROR: WeasyPrint is not importable.\n"
        "Inside Docker: WeasyPrint system libraries should be present.\n"
        "Locally: Run `pip install WeasyPrint==60.2` and install OS dependencies.\n"
        "  Ubuntu/Debian: sudo apt-get install -y libpango-1.0-0 libpangocairo-1.0-0 libcairo2\n"
        "  macOS:          brew install pango cairo"
    )
    sys.exit(1)

from prescriptions.tasks import _build_spike_html, render_pdf_bytes  # noqa: E402

# ── Benchmark helpers ─────────────────────────────────────────────────────────
_HTML_CONTENT = _build_spike_html()


def _generate_one() -> float:
    """Generate one PDF and return elapsed time in milliseconds."""
    start = time.monotonic()
    render_pdf_bytes(_HTML_CONTENT)
    return (time.monotonic() - start) * 1000


def percentile(sorted_values: list, pct: float) -> float:
    """Return the p-th percentile of a pre-sorted list."""
    if not sorted_values:
        return 0.0
    idx = max(0, int(len(sorted_values) * pct / 100) - 1)
    return sorted_values[idx]


def run_benchmark(n_requests: int = 10) -> dict:
    """
    Submit n_requests concurrent PDF generation tasks and return timing statistics.

    Returns:
        dict with keys: n, min_ms, p50_ms, p95_ms, max_ms, mean_ms, all_ms
    """
    times_ms: list[float] = []
    with ThreadPoolExecutor(max_workers=n_requests) as executor:
        futures = [executor.submit(_generate_one) for _ in range(n_requests)]
        for future in as_completed(futures):
            try:
                times_ms.append(future.result())
            except Exception as exc:  # noqa: BLE001
                print(f"  ⚠️  One request failed: {exc}")

    if not times_ms:
        return {}

    times_ms.sort()
    return {
        "n": len(times_ms),
        "min_ms": round(min(times_ms), 1),
        "mean_ms": round(statistics.mean(times_ms), 1),
        "p50_ms": round(statistics.median(times_ms), 1),
        "p95_ms": round(percentile(times_ms, 95), 1),
        "max_ms": round(max(times_ms), 1),
        "all_ms": [round(t, 1) for t in times_ms],
    }


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    THRESHOLD_MS = 4000  # NFR-PE-004: P95 < 4s
    N_CONCURRENT = 10

    print("=" * 64)
    print("WeasyPrint Spike Benchmark — TASK-009 (MedSlot)")
    print("=" * 64)
    print(f"Target:      P95 < {THRESHOLD_MS}ms  (NFR-PE-004)")
    print(f"Requests:    {N_CONCURRENT} concurrent")
    print()

    # Warm-up run: WeasyPrint loads font caches on first call;
    # warm-up isolates this one-time cost from the benchmark measurement.
    print("Warm-up run (font cache initialisation) …")
    _warmup_start = time.monotonic()
    render_pdf_bytes(_HTML_CONTENT)
    _warmup_ms = (time.monotonic() - _warmup_start) * 1000
    print(f"  Warm-up: {round(_warmup_ms, 1)}ms  (excluded from benchmark)")
    print()

    print(f"Running {N_CONCURRENT} concurrent PDF generations …")
    results = run_benchmark(N_CONCURRENT)

    if not results:
        print("❌  All requests failed. Check WeasyPrint installation.")
        sys.exit(1)

    print()
    print("Results:")
    print(f"  Requests completed : {results['n']}")
    print(f"  Min                : {results['min_ms']} ms")
    print(f"  Mean               : {results['mean_ms']} ms")
    print(f"  P50 (median)       : {results['p50_ms']} ms")
    print(f"  P95                : {results['p95_ms']} ms  ← key metric")
    print(f"  Max                : {results['max_ms']} ms")
    print(f"  All (sorted)       : {results['all_ms']}")
    print()

    if results["p95_ms"] < THRESHOLD_MS:
        print(
            f"✅  SPIKE PASSED\n"
            f"   P95 {results['p95_ms']}ms is below the {THRESHOLD_MS}ms threshold.\n"
            f"   Decision: Proceed with WeasyPrint for prescription PDF generation.\n"
            f"   Record this result in docs/assumptions/06-task-breakdown-assumptions.md."
        )
        sys.exit(0)
    else:
        print(
            f"❌  SPIKE FAILED\n"
            f"   P95 {results['p95_ms']}ms is at or above the {THRESHOLD_MS}ms threshold.\n"
            f"   Action required: Escalate as Tier 1 gap before TASK-075 is scheduled.\n"
            f"   Consider: wkhtmltopdf, Puppeteer/Chromium, or a dedicated PDF microservice."
        )
        sys.exit(1)
