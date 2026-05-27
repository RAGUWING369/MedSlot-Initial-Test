# Market Sizing — MedSlot

**Phase:** 1 — Ideation
**Version:** 1.0
**Date:** 2026-05-25
**Method:** Bottom-up (unit count × willingness-to-pay), not top-down percentage

---

## Market Definition

MedSlot's monetisation is a **doctor-side SaaS subscription**. Market sizing is therefore anchored on the number of doctors who are viable paying subscribers — not on patient-side revenue (patients use the platform free).

Patient volume is a network effect input that determines doctor value — it is sized separately as a demand proxy, not a revenue source.

---

## TAM — Total Addressable Market

**Definition:** Every independent doctor in India who manages their own appointment calendar and could benefit from a digital appointment + consultation workflow tool.

| Input | Value | Source |
|-------|-------|--------|
| Registered allopathic doctors in India | ~1,300,000 | National Medical Commission (NMC) — published registry data; [Inferred: using 2024 NMC figures as best available estimate] |
| % in private independent practice (sole proprietor clinics or small practices) | ~70% | [Industry benchmark — not project-specific. Confirm with your team.] |
| Doctors in private independent practice | ~910,000 | Calculated: 1,300,000 × 70% |
| Annual subscription per doctor (base estimate) | ₹12,000/year (₹1,000/month) | [Inferred: based on Practo Pro historical pricing benchmarks for Indian independent doctors — must be validated via pricing interviews before Phase 7] |
| **TAM** | **~₹10.9 billion/year** (~$131M USD at ₹83/$) | 910,000 × ₹12,000 |

---

## SAM — Serviceable Addressable Market

**Definition:** TAM filtered to doctors in urban and semi-urban India who are reachable with a web-first product — meaning they have consistent internet access, use smartphones, and are in locations where digital-first patient behaviour is emerging.

| Input | Value | Source |
|-------|-------|--------|
| % of independent doctors in Tier 1 + Tier 2 urban areas with consistent web connectivity | ~40% | [Industry benchmark — not project-specific. Reflects digital infrastructure penetration in Indian urban/semi-urban areas as of 2025.] |
| Reachable doctor population | ~364,000 | 910,000 × 40% |
| Annual subscription per doctor | ₹12,000/year | Same as TAM |
| **SAM** | **~₹4.37 billion/year** (~$53M USD) | 364,000 × ₹12,000 |

---

## SOM — Serviceable Obtainable Market

**Definition:** Realistic share of SAM capturable within 12–36 months given a 3-person team, a $2,000/month cloud budget, no existing brand, and an initial geographic focus on 2–3 Indian cities.

| Input | Value | Basis |
|-------|-------|-------|
| Target cities for initial GTM | 2–3 (e.g., Bengaluru, Hyderabad, Pune) | [Inferred: Tier 1 tech-literate cities with high independent-doctor density and digital-first patient behaviour — to be confirmed in Phase 3 PRD] |
| Estimated independent doctors per target city | ~15,000–25,000 | [Industry benchmark — approximate; varies by city size] |
| Total addressable doctors in 3 target cities | ~60,000 | Conservative estimate |
| Realistic capture rate (year 1–2 with bootstrapped GTM) | 0.5%–2.5% | [Inferred: based on comparable Indian B2B SaaS adoption curves for healthcare tools — no project-specific data] |

### SOM Scenarios

| Scenario | Capture Rate | Paying Doctors | Annual Revenue | Monthly Revenue | vs. $2K AWS Cost |
|----------|-------------|---------------|---------------|-----------------|------------------|
| **Worst Case** | 0.5% of 60,000 | 300 | ₹3.6M (~$43K) | ₹300,000 (~$3,600) | Break-even on infra |
| **Base Case** | 1.5% of 60,000 | 900 | ₹10.8M (~$130K) | ₹900,000 (~$10,800) | 5× infra coverage |
| **Best Case** | 2.5% of 60,000 | 1,500 | ₹18M (~$217K) | ₹1,500,000 (~$18,000) | 9× infra coverage |

**12-month milestone target (from SUCCESS-METRICS.md):** 170 paying doctors = ₹2.04M/year (~$24.5K) — covers AWS infrastructure at minimum viable economics.

---

## Patient-Side Demand Sizing (Network Effect Proxy)

Patients are free users — no direct revenue. Patient volume is sized to validate that there is sufficient demand to make the doctor subscription valuable.

| Input | Value | Source |
|-------|-------|--------|
| Urban Indian adults aged 22–55 in 3 target cities | ~8–12 million | [Industry benchmark — approximate urban demographics] |
| % who visit a doctor 2+ times per year | ~60% | [Industry benchmark — approximate; Indian healthcare utilisation data] |
| % comfortable booking appointments online | ~35–45% (and growing post-COVID) | [Industry benchmark — approximate] |
| Target patient addressable market (3 cities) | ~2–3 million | Conservative |
| Year 1 realistic patient registrations (0.05% of TAP) | 1,000–1,500 registered patients | [Inferred: comparable to early Practo adoption curves in individual cities] |

**Minimum viable patient volume per doctor:** 5–10 patient bookings/month per doctor account to demonstrate subscription value. At 170 paying doctors, the platform needs ~850–1,700 monthly bookings = a reasonable outcome at 1,000–1,500 registered patients making 1–2 bookings each per month.

---

## Key Assumptions and Risk Flags

| Assumption | Confidence | Risk Level | Validation Required |
|------------|-----------|------------|-------------------|
| 1.3M registered allopathic doctors in India | Medium — NMC data | Low | Verify with latest NMC registry count before Phase 3 |
| 70% in private independent practice | Low-Medium | Medium | This is the most impactful assumption for TAM; validate with primary research if possible |
| ₹1,000/month subscription price point | Low | **HIGH** | **Must be validated via doctor pricing interviews before Phase 7 begins** |
| 40% urban connectivity penetration for SAM filter | Low | Medium | Used as a conservative filter; actual reachable market may be larger |
| 0.5%–2.5% capture rate in 3 cities (SOM) | Low | High | Dependent on GTM strategy not yet defined; must be revisited in Phase 3 (PRD) with channel strategy |
| Patient booking rate of 1–2/month per registered patient | Low | Medium | Depends on doctor density and booking UX quality; revisit in Phase 5 (UX Design) |

---

## Summary

| Market | Definition | Estimated Size (INR) | Estimated Size (USD) | Paying Doctor Units |
|--------|-----------|----------------------|----------------------|---------------------|
| TAM | All independent private-practice doctors in India | ₹10.9B/year | ~$131M/year | 910,000 |
| SAM | Urban/semi-urban independent doctors with web access | ₹4.37B/year | ~$53M/year | 364,000 |
| SOM (Base) | 1.5% capture in 3 target cities, 12–36 months | ₹10.8M/year | ~$130K/year | 900 doctors |
| SOM (Min Viable) | Cover AWS infrastructure cost | ₹2.04M/year | ~$24.5K/year | 170 doctors |

The market is large enough to support this business. The primary risk is not market size — it is the willingness-to-pay validation and GTM execution to reach 170+ paying doctors within 12 months of launch.
