/**
 * RDS Stack — MedSlot
 *
 * Defines:
 *   - PostgreSQL 16 on db.t3.medium, Multi-AZ
 *   - 50 GB gp3 storage with AES-256 KMS encryption
 *   - Automated PITR (30-min RPO)
 *   - Placed in isolated subnets (no internet access)
 *   - Credentials managed via AWS Secrets Manager
 *
 * Full implementation is delivered in TASK-006 (AWS CDK Infrastructure Stack).
 * This file is the scaffold stub created in TASK-001.
 */

import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export interface RdsStackProps extends cdk.StackProps {
  /** VPC to place the RDS instance in */
  // vpc: ec2.Vpc; — wired up in TASK-006
}

export class RdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: RdsStackProps) {
    super(scope, id, props);

    // Full RDS implementation in TASK-006.
  }
}
