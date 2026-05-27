---
name: project-medslot-phase1
description: MedSlot Phase 1 Ideation completed and approved. Key decisions confirmed: no payment processing, doctor SaaS subscription model, mandatory OTP registration, self-registration + admin approval for doctors.
metadata:
  type: project
---

Phase 1 — Ideation completed and approved on 2026-05-25.

Key decisions locked in Phase 1:
- MedSlot does NOT process consultation fees — no Razorpay, no payment gateway; doctor manages fees with patient offline
- Revenue model: Doctor SaaS subscription (monthly/annual per-seat fee)
- Patient booking: Mandatory OTP registration — no guest flow
- Doctor onboarding: Self-registration + manual admin approval before account goes live
- Multi-doctor per clinic: Out of scope for v1 (single-doctor accounts only)

**Why:** These were open questions in CLAUDE.md confirmed during Phase 1 gap scan. Locking them prevents re-opening in downstream phases.

**How to apply:** All subsequent phase agents must treat these as settled decisions — do not re-ask, do not contradict. The Razorpay discrepancy in the original CLAUDE.md has been resolved and corrected.

Open items carried forward:
- Doctor subscription price validation (₹1,000/month assumed — must interview 5 doctors before Phase 7)
- GTM launch cities (Bengaluru, Hyderabad, Pune inferred — confirm in Phase 3 PRD)

All artifacts at: docs/ideation/
Assumption log at: docs/assumptions/01-ideation-assumptions.md
