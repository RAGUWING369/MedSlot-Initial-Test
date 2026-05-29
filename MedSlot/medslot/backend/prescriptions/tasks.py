"""
prescriptions/tasks.py — Celery tasks for prescription PDF generation.

Spike deliverable for TASK-009: validates WeasyPrint + Celery integration and
establishes the task structure reused in full implementation (TASK-075).

PHI policy:
  - HTML content (medicines, diagnosis, patient name) is NEVER logged.
  - Only action labels, prescription_id (UUID), and timing metrics are logged.
"""

import logging
import time

from celery import shared_task

logger = logging.getLogger(__name__)


def render_pdf_bytes(html_content: str) -> bytes:
    """
    Render an HTML string to PDF bytes using WeasyPrint.

    Isolated into a standalone function for:
      - Testability (patch this function; avoid importing WeasyPrint in CI)
      - Reuse from both the Celery task and the spike benchmark script
      - Lazy WeasyPrint import (system libraries required; not available in all envs)
    """
    from weasyprint import HTML  # noqa: PLC0415 — lazy import; WeasyPrint requires system deps

    return HTML(string=html_content).write_pdf()


@shared_task(
    bind=True,
    max_retries=1,
    default_retry_delay=30,
    name="prescriptions.generate_prescription_pdf",
)
def generate_prescription_pdf(self, prescription_id: str) -> dict:
    """
    Generate a prescription PDF and return generation metrics.

    Spike version (TASK-009): renders the spike HTML template to validate that
    WeasyPrint meets the NFR-PE-004 target (P95 < 4s for concurrent PDF requests).

    Full implementation (TASK-075) will:
      - Load Prescription record from PostgreSQL
      - Render the full prescription_template.html with real patient/doctor data
      - Upload the resulting PDF to S3
      - Trigger the send_prescription_email task

    Args:
        prescription_id: UUID of the Prescription record (used for logging only at this stage).

    Returns:
        dict: {"status": "ok", "size_bytes": int, "elapsed_ms": float}

    Raises:
        Retry: On first failure; propagates as exception after max_retries exhausted.
    """
    start = time.monotonic()
    logger.info(
        "pdf_generation_started",
        extra={"action": "pdf_generation_started", "prescription_id": prescription_id},
    )

    try:
        html_content = _build_spike_html()
        pdf_bytes = render_pdf_bytes(html_content)
        elapsed_ms = (time.monotonic() - start) * 1000

        logger.info(
            "pdf_generation_completed",
            extra={
                "action": "pdf_generation_completed",
                "prescription_id": prescription_id,
                "size_bytes": len(pdf_bytes),
                "elapsed_ms": round(elapsed_ms, 1),
            },
        )
        return {
            "status": "ok",
            "size_bytes": len(pdf_bytes),
            "elapsed_ms": round(elapsed_ms, 1),
        }

    except Exception as exc:
        logger.error(
            "pdf_generation_failed",
            extra={
                "action": "pdf_generation_failed",
                "prescription_id": prescription_id,
            },
        )
        raise self.retry(exc=exc)


def _build_spike_html() -> str:
    """
    Minimal prescription HTML for spike validation.

    Matches realistic prescription complexity (1 page, 3 medicines, styled table)
    so benchmark results reflect actual production workload characteristics.
    No real PHI — all sample data.
    """
    return """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    font-family: DejaVu Sans, Arial, sans-serif;
    font-size: 12pt;
    margin: 2cm;
    color: #111827;
  }
  .header {
    border-bottom: 2px solid #1a56db;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .clinic-name { font-size: 18pt; font-weight: bold; color: #1a56db; }
  .doctor-meta { font-size: 10pt; color: #374151; margin-top: 4px; }
  .section-label { font-weight: bold; margin-top: 14pt; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10pt;
    font-size: 11pt;
  }
  th {
    background: #f3f4f6;
    text-align: left;
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    font-weight: bold;
  }
  td { padding: 6px 10px; border: 1px solid #d1d5db; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer {
    margin-top: 30pt;
    font-size: 9pt;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
  }
</style>
</head>
<body>
<div class="header">
  <div class="clinic-name">MedSlot Clinic</div>
  <div class="doctor-meta">
    Dr. Sample Doctor &mdash; MBBS, MD (Internal Medicine)<br>
    Reg. No: MCI-SPIKE-001 &nbsp;|&nbsp; Phone: +91 99999 00000
  </div>
</div>

<p>
  <strong>Patient:</strong> Sample Patient &nbsp;&nbsp;
  <strong>Age:</strong> 35 &nbsp;&nbsp;
  <strong>Date:</strong> 2026-05-28 &nbsp;&nbsp;
  <strong>Appointment ID:</strong> SPK-0001
</p>

<p class="section-label">Chief Complaint</p>
<p>Fever and productive cough for 3 days, mild throat pain.</p>

<p class="section-label">Diagnosis</p>
<p>Viral upper respiratory tract infection with secondary bacterial component.</p>

<p class="section-label">Prescription</p>
<table>
  <tr>
    <th>Medicine</th>
    <th>Dosage</th>
    <th>Frequency</th>
    <th>Duration</th>
  </tr>
  <tr>
    <td>Paracetamol 500mg</td>
    <td>1 tablet</td>
    <td>Twice daily (after meals)</td>
    <td>5 days</td>
  </tr>
  <tr>
    <td>Cetirizine 10mg</td>
    <td>1 tablet</td>
    <td>Once at bedtime</td>
    <td>3 days</td>
  </tr>
  <tr>
    <td>Amoxicillin 500mg</td>
    <td>1 capsule</td>
    <td>Thrice daily (after meals)</td>
    <td>7 days</td>
  </tr>
</table>

<p class="section-label">Instructions</p>
<p>
  Take all medicines with food. Complete the full course of Amoxicillin even if
  symptoms improve. Drink at least 2–3 litres of water daily. Rest adequately.
  Avoid cold drinks and ice cream until symptoms resolve.
</p>

<p class="section-label">Follow-up</p>
<p>Return in 7 days, or earlier if fever exceeds 39°C or breathing difficulty develops.</p>

<div class="footer">
  Generated by MedSlot &mdash; medslot.in &nbsp;|&nbsp;
  This is a digitally generated prescription. &nbsp;|&nbsp;
  Generated: 2026-05-28 &nbsp;|&nbsp;
  This document is valid for 30 days from the date of issue.
</div>
</body>
</html>"""
