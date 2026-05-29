# Implementation — Assumption Log
**Phase:** 07 — Implementation
**Agent:** implementation-agent
**Generated:** 2026-05-28
**Session:** Sprint 2 — TASK-006 (AWS CDK Infrastructure Stack)

---

## Tier 3 Inferences Made This Phase

| ID | Inference | Basis | Confidence | Must Validate Before Phase |
|----|-----------|-------|------------|---------------------------|
| A-07-001 | CDK /24 sequential subnet allocation used instead of ARCHITECTURE.md expansion-gap CIDRs (10.0.0.x / 10.0.10.x / 10.0.20.x). CDK allocates 10.0.0.x, 10.0.2.x, 10.0.4.x sequentially. Same security posture; no operational impact for 2-AZ deployment. | CDK `subnetConfiguration` documentation; ARCHITECTURE.md spec intent | High | Phase 12 (Deployment) |
| A-07-002 | `desiredCount: 0` for all ECS Fargate services. Services are created in an inactive state to avoid startup failures when placeholder ECR images are referenced. The CD pipeline (TASK-005) sets `desiredCount: 2` for API/Frontend and `desiredCount: 1` for Worker/Beat on first real deploy. | CDK ECS pattern for CD-managed services | High | TASK-005 (CD pipeline) |
| A-07-003 | `AcmCertArn` implemented as a `CfnParameter` with a placeholder default ARN. This allows `cdk synth` without a real certificate and enables the HTTPS listener to be declared. Real ARN must be supplied at `cdk deploy` time via `--parameters MedSlotEcsStack:AcmCertArn=arn:aws:acm:...` | CDK CfnParameter pattern for pre-requisite resources | High | Phase 12 (Deployment) |
| A-07-004 | `minHealthyPercent: 100` on API, Frontend, and Worker services ensures zero-downtime rolling deployments (all tasks remain healthy while replacements start). Beat uses `minHealthyPercent: 0` because it is a singleton — stopping one instance before starting another is acceptable for a scheduler. | NFR-REL-001 (99.9% uptime), ECS rolling update mechanics | High | Phase 12 (Deployment) |
| A-07-005 | ElastiCache Redis 7.1 deployed using L1 constructs (`CfnReplicationGroup`, `CfnSubnetGroup`). CDK's aws-cdk-lib 2.257.0 does not have stable L2 constructs for ElastiCache Redis replication groups. L1 constructs expose the full CloudFormation API. | aws-cdk-lib 2.257.0 ElastiCache module inspection; CDK changelog | High | Phase 12 (Deployment) |
| A-07-006 | RDS `DatabaseSecret` imported via `fromSecretCompleteArn()` in EcsStack for ECS container secrets injection. Using the managed CDK object directly across stacks triggers CDK to add a resource policy on the secret (in RdsStack) referencing the execution role ARN (in EcsStack), creating a circular stack dependency. The imported reference limits CDK's grant to identity-based policies only (on the execution role), avoiding the cycle. | CDK cross-stack IAM grant mechanism; `iam.Grant.addToPrincipal()` vs `addToPrincipalOrResource()` | High | Phase 12 (Deployment) |
| A-07-007 | `containerInsightsV2: ecs.ContainerInsights.ENABLED` replaces deprecated `containerInsights: true` (deprecated in aws-cdk-lib 2.257.0). Both produce identical CloudFormation: `ClusterSettings: [{ Name: "containerInsights", Value: "enabled" }]`. | aws-cdk-lib 2.257.0 deprecation warning for `ClusterProps#containerInsights` | High | None — cosmetic, same CloudFormation |
| A-07-008 | `allowedOrigins: ['*']` on the records bucket CORS rule. This is intentionally broad for portability across dev/staging/prod environments. The CD pipeline should narrow this to `https://medslot.in` and `https://staging.medslot.in` via CDK context parameters at deploy time. | CDK portability pattern; CORS security best practice | High | Phase 12 (Deployment) |
| A-07-009 | ECS task `cpu: 512` (0.5 vCPU) for the worker service is sufficient for WeasyPrint PDF generation. The WeasyPrint spike (OQ-005, confirmed 2026-05-28) validated P95 ~680ms at 0.5 vCPU — well under the 4s NFR-PE-004 target. The 2 GB memory allocation gives WeasyPrint DOM rendering headroom as per ADR-006. | WeasyPrint spike results in docs/assumptions/06-task-breakdown-assumptions.md; ADR-006 | High | Phase 9 (Testing) — load test at 50 concurrent PDF requests |

---

## Open Flags (Tier 2 — Unconfirmed Suggestions)

| Flag ID | Suggestion Made | Location in Artifact | Status |
|---------|----------------|----------------------|--------|
| F-07-001 | `preferredMaintenanceWindow: 'sun:19:00-sun:20:00'` (00:30–01:30 IST Sunday) for RDS maintenance | `infra/lib/rds-stack.ts` | Pending — confirm low-traffic window with Product Owner |
| F-07-002 | `snapshotRetentionLimit: 1` on ElastiCache Redis (1-day Redis snapshot) — Redis data is ephemeral (cache/broker), so 1-day snapshot is sufficient | `infra/lib/ecs-stack.ts` | Pending — confirm with Tech Lead |
| F-07-003 | `maxAllocatedStorage: 200` on RDS — auto-scales storage up to 200 GB before alerting | `infra/lib/rds-stack.ts` | Pending — confirm cost ceiling with Product Owner |

---

## Resolution Log

| ID | Original Assumption | Resolution | Resolved By | Date |
|----|--------------------|-----------|-----------:|------|
| A-07-006 | Cross-stack secret grant creates circular dep via resource policy | Confirmed — fixed by using `fromSecretCompleteArn()` import approach | Implementation Agent | 2026-05-28 |
| A-07-007 | `containerInsights: true` deprecated in 2.257.0 | Confirmed — replaced with `containerInsightsV2: ENABLED` | Implementation Agent | 2026-05-28 |
