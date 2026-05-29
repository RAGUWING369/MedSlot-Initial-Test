/**
 * rds-stack.ts — MedSlot RDS PostgreSQL 16 (TASK-006)
 *
 * Provisions:
 *   - PostgreSQL 16 on db.t3.medium (Multi-AZ)
 *   - 50 GB gp3 storage, auto-scale to 200 GB
 *   - AES-256 encryption via KMS customer-managed key (CMK)
 *   - Automated PITR with 30-day backup retention → meets RPO ≤ 30 min (NFR-REL-003)
 *   - Placed in isolated subnets (no internet route)
 *   - Credentials auto-generated and stored in Secrets Manager
 *   - Deletion protection + RETAIN policy — medical data is never auto-deleted
 *   - Performance Insights enabled for query-level monitoring
 *
 * ADR references: ADR-003 (RDS encryption + PITR), ADR-005 (Multi-AZ deployment)
 * NFR references: NFR-REL-002 (RTO ≤ 1h), NFR-REL-003 (RPO ≤ 30 min), NFR-SEC-002 (AES-256 at rest)
 */

import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

export interface RdsStackProps extends cdk.StackProps {
  /** VpcStack providing the VPC and RDS security group */
  readonly vpcStack: VpcStack;
}

export class RdsStack extends cdk.Stack {
  /** The RDS instance — endpoint exported for ECS task environment variables */
  public readonly dbInstance: rds.DatabaseInstance;

  /** Credentials secret — ECS task IAM role is granted read access in EcsStack */
  public readonly dbCredentialsSecret: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { vpc, rdsSg } = props.vpcStack;

    // ── KMS Customer-Managed Key ──────────────────────────────────────────────
    // Separate CMK for RDS (vs AWS-managed key) enables:
    //   - Key rotation enforcement
    //   - Cross-account access control if needed
    //   - Independent key deletion / audit trail
    // removalPolicy: RETAIN — deleting the key makes the encrypted data unreadable;
    // never auto-delete in production.
    const rdsKmsKey = new kms.Key(this, 'RdsKmsKey', {
      description: 'MedSlot RDS AES-256 CMK — encrypts all PostgreSQL data at rest',
      enableKeyRotation: true,
      alias: 'medslot-rds-key',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Database Credentials → Secrets Manager ────────────────────────────────
    // Auto-generated password stored in Secrets Manager.
    // ECS task role is granted secretsmanager:GetSecretValue in EcsStack.
    // No static credentials in environment variables or Docker images.
    this.dbCredentialsSecret = new rds.DatabaseSecret(this, 'DbCredentials', {
      username: 'medslot_admin',
      secretName: 'medslot/rds/credentials',
      encryptionKey: rdsKmsKey,
    });

    // ── RDS PostgreSQL 16 Instance ────────────────────────────────────────────
    this.dbInstance = new rds.DatabaseInstance(this, 'MedSlotPostgres', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [rdsSg],

      // Credentials from Secrets Manager — no username/password in CDK code
      credentials: rds.Credentials.fromSecret(this.dbCredentialsSecret),
      databaseName: 'medslot',

      // Storage: gp3 is lower cost and better throughput than gp2 for this workload
      storageType: rds.StorageType.GP3,
      allocatedStorage: 50,
      maxAllocatedStorage: 200, // auto-scale storage (prevents alerts at 80% full)

      // Encryption at rest (NFR-SEC-002)
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,

      // Multi-AZ for automatic failover (NFR-REL-001, NFR-REL-002)
      multiAz: true,

      // PITR: 30-day backup retention → RPO ≤ 30 min (NFR-REL-003)
      backupRetention: cdk.Duration.days(30),
      preferredBackupWindow: '18:30-19:00', // 00:00–00:30 IST (low-traffic window)

      // Observability
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: rdsKmsKey,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT, // 7 days free tier
      monitoringInterval: cdk.Duration.seconds(60), // Enhanced Monitoring (1-min granularity)

      // Maintenance
      autoMinorVersionUpgrade: true,
      preferredMaintenanceWindow: 'sun:19:00-sun:20:00', // 00:30–01:30 IST Sunday

      // Protection: never auto-delete RDS or allow inadvertent removal
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── CloudFormation Outputs ────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'DbEndpointAddress', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint address (host)',
      exportName: `${this.stackName}-DbEndpointAddress`,
    });
    new cdk.CfnOutput(this, 'DbEndpointPort', {
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'RDS PostgreSQL endpoint port',
      exportName: `${this.stackName}-DbEndpointPort`,
    });
    new cdk.CfnOutput(this, 'DbCredentialsSecretArn', {
      value: this.dbCredentialsSecret.secretArn,
      description: 'Secrets Manager ARN for RDS credentials (read by ECS task role)',
      exportName: `${this.stackName}-DbCredentialsSecretArn`,
    });
  }
}
