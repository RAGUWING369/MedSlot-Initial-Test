#!/usr/bin/env node
/**
 * bin/infra.ts — MedSlot CDK Application Entry Point (TASK-006)
 *
 * Stack dependency order (CDK handles inter-stack CloudFormation exports):
 *   VpcStack  → prerequisite for all — VPC ID, subnet IDs, security group IDs
 *   S3Stack   → independent — S3 buckets + Secrets Manager (no VPC dependency)
 *   RdsStack  → requires VpcStack (VPC, isolated subnets, RDS security group)
 *   EcsStack  → requires VpcStack + RdsStack + S3Stack (all cross-stack references)
 *
 * Deployment target: ap-south-1 (Mumbai) — 2-AZ (ap-south-1a, ap-south-1b)
 * Account/region resolved at deploy time via CDK_DEFAULT_ACCOUNT/CDK_DEFAULT_REGION
 * or explicit --profile flag. Defaults to ap-south-1 if region env var is unset.
 *
 * Usage:
 *   cdk synth                                         # validate CloudFormation output
 *   cdk deploy --all --profile medslot-staging        # deploy all stacks
 *   cdk deploy MedSlotEcsStack --parameters \         # update ECS stack with cert ARN
 *     MedSlotEcsStack:AcmCertArn=arn:aws:acm:...
 */

import * as cdk from 'aws-cdk-lib/core';

import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from '../lib/rds-stack';
import { S3Stack } from '../lib/s3-stack';
import { EcsStack } from '../lib/ecs-stack';

const app = new cdk.App();

// Resolve account/region from CDK environment variables.
// In CI/CD (TASK-005): CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION are set from
// GitHub Actions role assumption. Locally: set via `aws configure` or --profile.
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'ap-south-1',
};

// Common tags applied to every resource in every stack
const commonTags: Record<string, string> = {
  Project: 'MedSlot',
  ManagedBy: 'CDK',
  Environment: app.node.tryGetContext('environment') ?? 'staging',
};

// ── Stack instantiation ────────────────────────────────────────────────────────

const vpcStack = new VpcStack(app, 'MedSlotVpcStack', {
  env,
  description: 'MedSlot VPC — 3-tier subnets, NAT Gateways, security groups',
  tags: commonTags,
});

// S3 is independent of VPC (S3 is a global AWS service, accessed via VPC endpoints
// or NAT for now; VPC endpoints for S3 are added in Phase 13 cost optimisation).
const s3Stack = new S3Stack(app, 'MedSlotS3Stack', {
  env,
  description: 'MedSlot S3 buckets (records, prescriptions, credentials) + Secrets Manager',
  tags: commonTags,
});

const rdsStack = new RdsStack(app, 'MedSlotRdsStack', {
  env,
  vpcStack,
  description: 'MedSlot RDS PostgreSQL 16 — Multi-AZ, KMS encryption, PITR',
  tags: commonTags,
});

const ecsStack = new EcsStack(app, 'MedSlotEcsStack', {
  env,
  vpcStack,
  rdsStack,
  s3Stack,
  description:
    'MedSlot ECS Fargate cluster — API, frontend, worker, beat services + ALB + ElastiCache Redis',
  tags: commonTags,
});

// Explicit dependency declarations so CDK deploys stacks in the correct order.
// CDK infers most dependencies from cross-stack token references, but explicit
// addDependency() is belt-and-braces for parallel deploy scenarios.
rdsStack.addDependency(vpcStack);
ecsStack.addDependency(vpcStack);
ecsStack.addDependency(rdsStack);
ecsStack.addDependency(s3Stack);
