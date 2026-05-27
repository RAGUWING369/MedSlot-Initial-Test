/**
 * ECS Stack — MedSlot
 *
 * Defines:
 *   - ECS Fargate cluster in ap-south-1 (2 AZ)
 *   - 4 services: medslot-api, medslot-frontend, medslot-worker, medslot-beat
 *   - API service: min=2, max=8 tasks; auto-scale at 60% CPU
 *   - ALB with HTTPS listener (ACM certificate) and path routing
 *   - CloudWatch log groups per service
 *
 * Full implementation is delivered in TASK-006 (AWS CDK Infrastructure Stack).
 * This file is the scaffold stub created in TASK-001.
 */

import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export interface EcsStackProps extends cdk.StackProps {
  /** VPC to place the ECS cluster in */
  // vpc: ec2.Vpc; — wired up in TASK-006
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: EcsStackProps) {
    super(scope, id, props);

    // Full ECS implementation in TASK-006.
  }
}
