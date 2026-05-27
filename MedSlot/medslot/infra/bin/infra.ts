#!/usr/bin/env node
/**
 * MedSlot CDK Application Entry Point
 *
 * Instantiates all infrastructure stacks for the MedSlot platform.
 * Deployment target: AWS ap-south-1 (Mumbai) — 2 AZ configuration.
 *
 * Stack dependency order:
 *   VpcStack → RdsStack, EcsStack, S3Stack (all depend on VPC)
 *
 * Full stack wiring (cross-stack references, env config, account/region) is
 * delivered in TASK-006 (AWS CDK Infrastructure Stack).
 */

import * as cdk from 'aws-cdk-lib/core';
import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from '../lib/rds-stack';
import { EcsStack } from '../lib/ecs-stack';
import { S3Stack } from '../lib/s3-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'ap-south-1',
};

// VPC — prerequisite for all other stacks
new VpcStack(app, 'MedSlotVpcStack', { env });

// Data stores (full VPC cross-reference wired in TASK-006)
new RdsStack(app, 'MedSlotRdsStack', { env });
new S3Stack(app, 'MedSlotS3Stack', { env });

// Compute (full VPC cross-reference wired in TASK-006)
new EcsStack(app, 'MedSlotEcsStack', { env });
