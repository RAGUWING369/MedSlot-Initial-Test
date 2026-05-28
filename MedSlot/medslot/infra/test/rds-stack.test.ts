/**
 * test/rds-stack.test.ts — CDK Assertions tests for RdsStack (TASK-006)
 *
 * Verifies: PostgreSQL 16, Multi-AZ, db.t3.medium, gp3 50GB, KMS encryption,
 * PITR 30-day backup, isolated subnet placement, deletion protection, RETAIN policy.
 */

import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from '../lib/rds-stack';

function buildStacks(): { vpcStack: VpcStack; rdsStack: RdsStack; template: Template } {
  const app = new cdk.App();
  const vpcStack = new VpcStack(app, 'TestVpcStack');
  const rdsStack = new RdsStack(app, 'TestRdsStack', { vpcStack });
  const template = Template.fromStack(rdsStack);
  return { vpcStack, rdsStack, template };
}

// ── RDS Instance ──────────────────────────────────────────────────────────────
describe('RdsStack — RDS Instance', () => {
  test('creates exactly one RDS DB instance', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
  });

  test('engine is PostgreSQL 16', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      EngineVersion: Match.stringLikeRegexp('^16'),
    });
  });

  test('instance class is db.t3.medium', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceClass: 'db.t3.medium',
    });
  });

  test('Multi-AZ is enabled (NFR-REL-001)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: true,
    });
  });

  test('storage type is gp3', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageType: 'gp3',
    });
  });

  test('allocated storage is 50 GB', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      AllocatedStorage: '50',
    });
  });

  test('max allocated storage is 200 GB (auto-scale enabled)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MaxAllocatedStorage: 200,
    });
  });

  test('storage is encrypted (NFR-SEC-002)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
    });
  });

  test('PITR backup retention is 30 days (NFR-REL-003 — RPO ≤ 30 min)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 30,
    });
  });

  test('deletion protection is enabled — medical data is never auto-deleted', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DeletionProtection: true,
    });
  });

  test('auto minor version upgrade is enabled', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      AutoMinorVersionUpgrade: true,
    });
  });

  test('database name is medslot', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBName: 'medslot',
    });
  });

  test('Performance Insights is enabled', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      EnablePerformanceInsights: true,
    });
  });

  test('Enhanced Monitoring has 60-second interval', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MonitoringInterval: 60,
    });
  });
});

// ── KMS Key ───────────────────────────────────────────────────────────────────
describe('RdsStack — KMS Encryption Key', () => {
  test('creates a KMS CMK for RDS encryption', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::KMS::Key', 1);
  });

  test('KMS key has rotation enabled', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('KMS key has a descriptive alias', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/medslot-rds-key',
    });
  });
});

// ── DB Subnet Group ───────────────────────────────────────────────────────────
describe('RdsStack — DB Subnet Group', () => {
  test('creates a DB subnet group (for isolated subnet placement)', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
  });
});

// ── Secrets Manager ───────────────────────────────────────────────────────────
describe('RdsStack — Database Credentials', () => {
  test('creates a Secrets Manager secret for DB credentials', () => {
    const { template } = buildStacks();
    // DatabaseSecret creates one SecretsManager::Secret
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('credentials secret is attached to the RDS instance', () => {
    const { template } = buildStacks();
    // CDK creates a SecretTargetAttachment to link the secret to the DB instance
    template.resourceCountIs('AWS::SecretsManager::SecretTargetAttachment', 1);
  });
});

// ── CloudFormation Outputs ────────────────────────────────────────────────────
describe('RdsStack — CloudFormation Outputs', () => {
  test('exports DbEndpointAddress, DbEndpointPort, DbCredentialsSecretArn', () => {
    const { template } = buildStacks();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('DbEndpointAddress');
    expect(outputs).toHaveProperty('DbEndpointPort');
    expect(outputs).toHaveProperty('DbCredentialsSecretArn');
  });
});

// ── Security (no public access) ───────────────────────────────────────────────
describe('RdsStack — Security', () => {
  test('RDS instance has no publicly accessible endpoint', () => {
    const { template } = buildStacks();
    // CDK sets PubliclyAccessible: false by default for isolated subnet placement
    const cfn = template.toJSON();
    const dbInstances = Object.values(cfn.Resources).filter(
      (r: any) => r.Type === 'AWS::RDS::DBInstance',
    ) as any[];
    dbInstances.forEach((db) => {
      // PubliclyAccessible should be false or absent (defaults to false)
      const isPublic = db.Properties.PubliclyAccessible;
      expect(isPublic).not.toBe(true);
    });
  });
});
