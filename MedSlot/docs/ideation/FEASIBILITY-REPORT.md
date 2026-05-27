# Feasibility Report — MedSlot

**Phase:** 1 — Ideation
**Version:** 1.0
**Date:** 2026-05-25
**Assessed By:** Ideation Agent — Phase 1

---

## Feasibility Matrix

### Dimension 1: Technical Feasibility — GREEN ✅

**Verdict:** The declared stack is production-proven, the team capability matches the scope, and no novel or unproven technology is required.

| Assessment Item | Finding |
|----------------|---------|
| Frontend stack | Next.js 14 (App Router) + TypeScript 5 + Tailwind CSS 3 — stable, well-documented, large community |
| Backend stack | Django 5.x + DRF 3.15 + PostgreSQL 16 — enterprise-proven combination; well-understood by the Python ecosystem |
| PDF generation | WeasyPrint 60.x for server-side HTML-to-PDF — mature library, well-matched to structured prescription templates rendered from Django |
| Object storage | AWS S3 + pre-signed URLs for prescription delivery — solved, widely-used pattern |
| Authentication | SMS OTP via MSG91 — no OAuth or social login complexity; well-tested pattern for Indian consumer apps |
| Email delivery | SendGrid — standard API, reliable deliverability, established SDK |
| State management | Zustand 4.x — lightweight and well-suited to the three stateful flows (auth, booking, consultation session) |
| Cache | Redis 7.x for sessions and slot availability cache — standard use case, no exotic patterns required |
| Compute | AWS ECS Fargate — managed container orchestration; removes EC2 instance management overhead from a 3-person team |
| Real-time requirements | **None** — video, WebSockets, and chat are explicitly out of scope; this removes the highest-complexity technical requirements from the v1 build |

**Key Risks:**
- WeasyPrint can be memory-intensive under load; PDF generation should run in a dedicated ECS task with defined memory limits, not on the request-response thread
- MSG91 OTP delivery success rates may degrade in low-signal areas; targeting is intentionally limited to urban Tier 1/2 cities where mobile connectivity is reliable

**Mitigations:**
- Allocate a dedicated ECS task for PDF generation with a defined memory ceiling (suggest: 512MB–1GB); queue-based rather than synchronous
- Document MSG91 as a tier-1 dependency; evaluate a secondary SMS provider as fallback before production launch
- Begin third-party account setup (MSG91, SendGrid, AWS production accounts) during Phase 6 (Task Breakdown), not Phase 7 — integration delays commonly consume 2–3 weeks

---

### Dimension 2: Economic Feasibility — YELLOW ⚠️

**Verdict:** The market is large enough to support this business. The subscription revenue model is viable but price-sensitivity among independent Indian doctors must be validated before implementation begins. The platform will be cash-flow negative during the early adoption period.

| Assessment Item | Finding |
|----------------|---------|
| Market headroom | SAM ~$79M USD (see MARKET-SIZING.md) — sufficient headroom for a focused subscription business targeting independent practitioners |
| Revenue model | Doctor SaaS subscription — monthly or annual fee per doctor account; no transaction fees |
| No payment processing | Removing consultation fee processing (Razorpay) eliminates transaction complexity, PCI-adjacent risk surface, and a significant ops burden — improves unit economics clarity |
| Unit economics at launch | At 200–800 active users (mix of doctors and patients), assume 10–20% are paying doctors: 20–160 doctors × ₹1,000/month = ₹20,000–₹160,000/month (~$240–$1,925/month) vs. AWS infrastructure cost of ~$2,000/month — cash-flow negative at the lower end |
| Path to sustainability | ~170 paying doctors at ₹1,000/month covers AWS infrastructure alone. Achievable by month 12–18 with focused GTM in 2–3 target cities |
| Differentiation vs. free tier | Practo offers a basic free tier for doctors; MedSlot must clearly demonstrate that the consultation workflow (structured notes + PDF prescription delivery) delivers daily value that Practo's free tier does not |

**Key Risks:**
- Doctor subscription willingness: Indian independent doctors are cost-conscious and have been trained by Practo's free tier to expect zero subscription cost for basic appointment tools
- Cash-flow negative period: The team requires funding runway to sustain $2,000/month cloud costs plus development costs before subscription revenue is sufficient
- Price point: ₹1,000/month is an assumption; actual willingness-to-pay must be validated with target doctors before implementation begins

**Mitigations:**
- Run a minimum 5-doctor pricing interview before Phase 7 (Implementation) begins — validate willingness-to-pay and feature-to-value mapping
- Offer a 30–60 day free trial to allow new doctors to build appointment volume before the subscription fee activates
- Design a freemium tier (appointment management only, free) with a paid upgrade (+ consultation notes + prescription generation) to lower the initial acquisition barrier
- Explicitly position against Practo: MedSlot is a consultation workflow tool that also does appointments — not an appointment tool only

---

### Dimension 3: Operational Feasibility — GREEN ✅

**Verdict:** A 3-person team can operate this platform at 200–800 user scale using AWS managed services. One specific risk — manual doctor verification — requires a defined SLA and lightweight internal tooling from day one.

| Assessment Item | Finding |
|----------------|---------|
| Team capacity | 3 developers can manage a platform at this scale using ECS Fargate + managed RDS + CloudFront — minimal infrastructure ops overhead |
| Doctor verification (admin approval) | Creates a recurring manual ops task: reviewing submitted credentials (MCI registration number, ID, speciality proof) and approving/rejecting accounts |
| Verification SLA | Must be defined before launch: suggest 48 business-hour turnaround; this is achievable at early volumes (5–20 applications/week) |
| Support model | Email/web-based support is sufficient at launch scale; no 24/7 on-call required for 200–800 users |
| Data privacy | Patient health data requires encryption at rest (AWS RDS encryption + S3 SSE) and in transit (TLS 1.2+); foundational practices defined in CLAUDE.md; no full HIPAA or DISHA compliance required for v1, but these practices are non-negotiable from day one |
| Prescription PDF delivery | AWS S3 pre-signed URLs with TTL — low-ops, auditable, no direct server streaming |
| Monitoring | AWS CloudWatch + structured application logs; no exotic observability stack needed at this scale |

**Key Risks:**
- Doctor verification becomes a growth bottleneck if volume exceeds manual capacity (>20 applications/week with the current team)
- Mitigation: Build the verification queue as a thin Django admin view from day one (not a manual email workflow); define a checklist that allows non-technical staff to execute verifications; plan for an automated credential cross-check (MCI registry API, if available) post-v1

---

### Dimension 4: Schedule Feasibility — YELLOW ⚠️

**Verdict:** The timeline is achievable but tight. Scope discipline is the single most important risk mitigation. A cut-scope protocol must be defined and triggered at week 9 if velocity is behind.

| Assessment Item | Finding |
|----------------|---------|
| Available time | 2026-05-25 → 2026-10-31 = approximately 22 weeks (~5.5 months) |
| Defined scope | Core patient booking flow + doctor consultation + prescription generation (CLAUDE.md Application Scope) |
| Team size | 3 developers: 1 full-stack lead, 1 frontend, 1 backend |
| Comparable project timeline | A two-sided marketplace MVP (dual user roles, calendar management, OTP auth, PDF generation, email notifications) typically requires 6–9 months with a 3-person team |
| Risk multiplier | No existing codebase — greenfield from Phase 7 |

**Key Risks:**
- 22 weeks is at the aggressive end for this scope with a 3-person team
- Third-party integration delays (MSG91 production approval, SendGrid domain verification, AWS account setup) routinely consume 2–3 weeks if not started early
- The admin doctor verification panel is frequently underestimated; it must be included in sprint planning
- Any scope addition after Phase 6 approval will push past the October deadline

**Mitigations:**
- Enforce scope freeze at Phase 6 (Task Breakdown) approval — no new features added to v1 sprint backlog without explicit human gate
- Begin all third-party account setups during Phase 6 planning (before implementation starts)
- Build the admin panel as a thin Django admin view — not a custom-built interface — to save frontend budget
- Define cut-scope protocol now: if velocity is behind at Sprint 3 review (~week 9), health record upload is the designated first deferral without breaking core booking + prescription flow

---

## Go / No-Go Recommendation

### RECOMMENDATION: GO — with active monitoring on Economic and Schedule dimensions

| Dimension | Rating | Contribution |
|-----------|--------|-------------|
| Technical | GREEN ✅ | Full GO — stack is proven, team capability matches scope, no novel technology required |
| Economic | YELLOW ⚠️ | Conditional GO — validate doctor subscription willingness-to-pay before Phase 7 begins |
| Operational | GREEN ✅ | Full GO — manageable at target scale; define doctor verification SLA before launch |
| Schedule | YELLOW ⚠️ | Conditional GO — scope freeze mandatory; cut-scope protocol triggered at week 9 if needed |

### Conditions for YELLOW → GREEN

1. **Economic:** Conduct a minimum 5-doctor pricing interview before Phase 7 (Implementation) begins. Confirm ₹1,000/month (or equivalent annual) willingness-to-pay and identify which features drive the buy decision.

2. **Schedule:** At Sprint 3 review (~week 9 of implementation), compare actual velocity against plan. If more than 15% behind, invoke the cut-scope protocol: defer health record upload to v1.1 to protect the core booking + consultation + prescription flow.

### Conditions That Would Trigger a Pivot (RED)

- If doctor pricing interviews reveal willingness-to-pay below ₹500/month or zero — the subscription model requires fundamental revision before proceeding
- If technical evaluation of WeasyPrint reveals PDF generation time > 10s under realistic load — the prescription delivery architecture requires rethinking
- If MSG91 or SendGrid cannot be provisioned for production use within the first 4 weeks of Phase 7 — third-party provider strategy must be revised
