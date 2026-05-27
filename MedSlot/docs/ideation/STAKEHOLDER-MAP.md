# Stakeholder Map — MedSlot

**Phase:** 1 — Ideation
**Version:** 1.0
**Date:** 2026-05-25
**Framework:** BABOK v3, Section 3.2 — Plan Stakeholder Engagement

---

## Stakeholder Registry

| Stakeholder | Type | Primary Job / Interest | Influence | Impact if Not Engaged | Engagement Strategy | Review Cadence |
|-------------|------|----------------------|-----------|----------------------|--------------------|----|
| **Patient** (Urban Indian adult, 22–55) | Primary User | Book appointments without phone calls; access prescription history; avoid waiting room uncertainty | High — adoption volume drives platform value for doctors | Low patient adoption → doctors see no value → doctors cancel subscriptions → platform fails | Usability testing from Phase 5 (UX Design); onboarding OTP flow must be < 2 minutes; confirmation emails build trust | Each sprint demo; usability feedback post Phase 5 |
| **Doctor** (Independent MBBS+, solo/small clinic) | Primary User + Economic Buyer | Fast appointment management; structured consultation workflow; digital prescription delivery; own their patient data | High — paying subscriber; retention drives MRR | Doctors don't subscribe or churn → no revenue → unsustainable platform | Pricing interviews before Phase 7; free trial to reduce activation friction; dedicated doctor onboarding flow | Phase 6 sprint planning; pricing validation before Phase 7 |
| **MedSlot Ops/Admin Team** | Operator | Verify doctor credentials; manage doctor approval queue; handle platform support escalations | Medium — controls doctor supply pipeline; quality of verification affects trust | Unverified doctors approved → trust failures; verification backlog → doctor supply shortage | Define verification checklist and SLA before Phase 7; build admin panel as priority in Sprint 1; document support escalation paths | Weekly during implementation; monthly post-launch |
| **MedSlot Product & Dev Team** (3 developers) | Builder | Deliver platform on scope and on schedule; make architecture decisions | High — all implementation decisions flow through them | Scope creep, architecture drift, or missed deadlines | Phase gates enforce scope discipline; RULE-EXECUTION.md governs all phase transitions; weekly sprint reviews | Each sprint (every 2 weeks in Phase 7) |
| **Medical Council of India (MCI) / State Medical Councils** | Regulator (Indirect) | Ensure only licensed, registered practitioners offer medical services | Medium — platform must align with practitioner verification requirements | Unregistered practitioners on platform → regulatory risk; reputational damage; potential forced shutdown | Design doctor registration to require MCI registration number; manual admin verification cross-checks against council records; legal review of verification workflow before launch | Phase 4 (Architecture) — compliance review of doctor verification data model |
| **MSG91** | Third-Party Infrastructure | OTP delivery for authentication; service reliability | Medium — OTP delivery failure = authentication failure for all users | MSG91 downtime or rate-limiting → patients and doctors cannot log in | Provision production account early (Phase 6); define retry logic and fallback SMS provider; monitor delivery rates post-launch | Phase 6 — account provisioning; Phase 7 — integration testing |
| **SendGrid** | Third-Party Infrastructure | Transactional email delivery: booking confirmations, prescription PDFs, reminders | Medium — email delivery failure = patients don't receive prescriptions; appointments not confirmed | Email failures → patient complaints; prescription delivery failures → safety risk perception | Provision production account and verify sending domain during Phase 6; configure bounce/complaint handling from day one | Phase 6 — account provisioning; Phase 7 — integration testing |
| **AWS** (ECS, RDS, S3, CloudFront) | Third-Party Infrastructure | Compute, database, storage, and CDN; uptime and data durability | High — all platform data and compute lives here | AWS regional outage → platform offline; S3 unavailable → prescription PDFs inaccessible | Architect for AWS ap-south-1 (Mumbai) as primary region (latency for Indian users); define S3 versioning and backup for health records and prescriptions | Phase 4 (Architecture) — infrastructure design; ongoing post-launch |
| **Patients' Family Members / Caregivers** | Indirect User | Accompanying family members booking appointments for elderly relatives; viewing shared prescriptions | Low | Not directly impacted in v1 scope | Out of scope for v1 — single-patient account; multi-beneficiary is a post-v1 feature | Post-launch feedback review |

---

## Stakeholder Coverage Checklist

| Category | Covered By | Notes |
|----------|-----------|-------|
| End Users | Patient, Doctor | Both primary user types represented |
| Economic Buyer | Doctor | Paying subscriber; primary revenue stakeholder |
| Operators / Admins | MedSlot Ops/Admin Team | Doctor verification and platform operations |
| Builders | MedSlot Product & Dev Team | Internal — all engineering decisions |
| Regulators | MCI / State Medical Councils | Indirect; relevant to doctor credential verification |
| Third-Party Dependencies | MSG91, SendGrid, AWS | Infrastructure and communications providers |

---

## Stakeholder Influence / Impact Matrix

```
HIGH INFLUENCE
│
│  ● MedSlot Dev Team          ● Doctor (Economic Buyer)
│  ● AWS (Infrastructure)
│
│                    ● Patient (Primary User)
│  ● MSG91
│  ● SendGrid
│
│              ● MCI / Regulators
│                                   ● Family / Caregivers
│
LOW INFLUENCE ──────────────────────────────────────────
             LOW IMPACT              HIGH IMPACT ON PRODUCT SUCCESS
```

**Quadrant Summary:**
- **High Influence / High Impact** (manage closely): MedSlot Dev Team, Doctor, AWS
- **High Influence / Medium Impact** (keep satisfied): MSG91, SendGrid
- **Medium Influence / High Impact** (keep informed): Patient, MedSlot Ops Team
- **Low Influence / Medium Impact** (monitor): MCI/Regulators
- **Low Influence / Low Impact** (watch): Family/Caregivers

---

## Key Engagement Actions by Phase

| Phase | Stakeholder | Required Action |
|-------|------------|----------------|
| Phase 4 — Architecture | MCI / Regulators (Internal Review) | Legal review of doctor verification data model and credential storage |
| Phase 4 — Architecture | AWS | Confirm ap-south-1 as primary region; define S3 retention and backup policy |
| Phase 5 — UX Design | Patient | Usability review of booking flow wireframes; validate < 2 minute booking target |
| Phase 5 — UX Design | Doctor | Review consultation workflow wireframes; validate minimal-click prescription flow |
| Phase 6 — Task Breakdown | MedSlot Dev Team | Scope lock and sprint allocation |
| Before Phase 7 — Implementation | Doctor | 5-doctor pricing interview to validate ₹1,000/month subscription willingness-to-pay |
| Phase 6 — Task Breakdown | MSG91, SendGrid | Begin production account provisioning and domain verification |
| Phase 7 — Implementation | MedSlot Ops/Admin Team | Define and document doctor verification checklist and SLA before Sprint 1 completes |
