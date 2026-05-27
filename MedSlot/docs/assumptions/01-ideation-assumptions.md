# Ideation — Assumption Log

**Phase:** 01 — Ideation
**Agent:** 01_ideation_agent.md
**Generated:** 2026-05-25
**Session:** MedSlot Phase 1 — initial ideation execution; greenfield project; no prior artifacts

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-01-001 | India has ~1.3 million registered allopathic doctors | National Medical Commission (NMC) published registry — 2024 figures used as best available estimate | Medium | Phase 3 (PRD) — market sizing refresh |
| A-01-002 | ~70% of Indian registered doctors work in private independent or small-clinic settings (not hospitals) | Industry benchmark — Indian healthcare sector analysis; not project-specific | Medium-Low | Phase 3 (PRD) — validate with primary research if market sizing is load-bearing for funding decisions |
| A-01-003 | Monthly subscription price point of ₹1,000/month (₹12,000/year) used as base estimate for all market sizing calculations | Inferred from Practo Pro historical pricing benchmarks for Indian independent doctors and comparable Indian B2B SaaS tools | Low | **Before Phase 7 (Implementation)** — mandatory 5-doctor pricing interview; this is the highest-risk assumption in market sizing |
| A-01-004 | USD/INR exchange rate of ₹83 per USD used for all USD market size conversions | Approximate market rate as of mid-2025; used for comparative context only | Medium | Not load-bearing — USD figures are illustrative only; all operational decisions use INR |
| A-01-005 | Urban + semi-urban connectivity penetration used to filter SAM at ~40% of independent doctors | Industry benchmark for digital infrastructure penetration in Indian urban/semi-urban areas; not project-specific | Low-Medium | Phase 3 (PRD) |
| A-01-006 | Initial GTM target cities: Bengaluru, Hyderabad, Pune | Inferred from CLAUDE.md target user description ("urban Indian adults") and Tier 1 city tech-literate doctor density | Medium | Phase 3 (PRD) — product owner must confirm target launch geography |
| A-01-007 | Consultation workflow completion rate baseline is "unknown" — no comparable in-house data | No existing platform; baseline must be established from first production cohort | High | Phase 9 (Testing) — define measurement from day one of Phase 7 |
| A-01-008 | Doctor pricing interviews can be conducted with 5 representative doctors before Phase 7 begins | Inferred from feasibility of reaching independent doctors in Tier 1 cities; assumes team has existing medical contacts or can reach doctors via professional networks | Medium | Before Phase 7 — if no doctor contacts exist, identify recruitment channel during Phase 6 |
| A-01-009 | Patient booking rate of 1–2 appointments/month per registered patient used for demand-side sizing | Inferred from general Indian outpatient healthcare utilisation data; not MedSlot-specific | Low | Phase 5 (UX Design) — validate with user research |
| A-01-010 | "Do nothing / phone call / walk-in" is included as a competitor in the competitive matrix | Standard product strategy practice — the status quo is always a competitor; no user confirmation required for this inclusion | High | Not applicable — methodological convention |

---

## Open Flags (Tier 2 — Confirmed Suggestions)

| Flag ID | Suggestion Made | User Response | Status |
|---------|----------------|---------------|--------|
| F-01-001 | Multi-doctor per clinic: out of scope for v1 — each doctor account is independent | Confirmed: YES | ✅ Resolved — out of scope for v1 |
| F-01-002 | Primary competitive set: Practo, 1mg/Tata Health, Apollo 247, Lybrate, Do Nothing | Confirmed: YES | ✅ Resolved — confirmed competitive matrix |

---

## Critical Discrepancy Flagged

**CLAUDE.md Discrepancy — Razorpay Payment Integration:**

CLAUDE.md (Technology Stack section) lists: *"Payment: Razorpay for consultation fee collection (India-focused)"*

During the Phase 1 Context Gap Scan, the user explicitly clarified (Q4 answer: option d):
> "Only appointment happens in MedSlot. Doctor will take care of consultation fee."

**Resolution:** MedSlot does NOT process consultation fees. There is no Razorpay integration in v1. Fee arrangements between doctor and patient are entirely outside the platform scope.

**Action taken:** CLAUDE.md Technology Stack updated in Post-Phase Writes to remove Razorpay from the stack. Razorpay is added to Out of Scope in PROJECT-CONCEPT.md.

This discrepancy must be carried forward and confirmed in Phase 2 (Requirements) and Phase 3 (PRD) to ensure no Razorpay-related requirements are introduced.

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| F-01-001 | Multi-doctor per clinic scope was ambiguous in CLAUDE.md Open Questions | Out of scope for v1 — confirmed by product owner | User (Phase 1 gap scan) | 2026-05-25 |
| F-01-002 | Competitive set to analyze was unconfirmed | Practo, 1mg/Tata Health, Apollo 247, Lybrate, Do Nothing — confirmed | User (Phase 1 gap scan) | 2026-05-25 |
| — | Razorpay in CLAUDE.md tech stack vs. "no fee processing" | MedSlot does not process fees; Razorpay removed from scope | User (Phase 1 gap scan, Q4) | 2026-05-25 |
