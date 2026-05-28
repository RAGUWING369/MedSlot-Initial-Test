/**
 * test/s3-stack.test.ts — CDK Assertions tests for S3Stack (TASK-006)
 *
 * Verifies: 3 private buckets, SSE-S3 encryption, Block Public Access on all,
 * CORS only on records bucket, enforceSSL bucket policy, Secrets Manager entries.
 */

import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { S3Stack } from '../lib/s3-stack';

function buildStack(): { stack: S3Stack; template: Template } {
  const app = new cdk.App();
  const stack = new S3Stack(app, 'TestS3Stack');
  const template = Template.fromStack(stack);
  return { stack, template };
}

// ── S3 Buckets ────────────────────────────────────────────────────────────────
describe('S3Stack — S3 Buckets', () => {
  test('creates exactly 3 S3 buckets', () => {
    const { template } = buildStack();
    template.resourceCountIs('AWS::S3::Bucket', 3);
  });

  test('all buckets have SSE-S3 default encryption enabled (NFR-SEC-003)', () => {
    const { template } = buildStack();
    // SSE-S3 = AES256 server-side encryption
    const buckets = template.findResources('AWS::S3::Bucket', {
      Properties: {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      },
    });
    expect(Object.keys(buckets).length).toBe(3);
  });

  test('all buckets have Block Public Access on ALL settings (NFR-SEC-008)', () => {
    const { template } = buildStack();
    const buckets = template.findResources('AWS::S3::Bucket', {
      Properties: {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      },
    });
    expect(Object.keys(buckets).length).toBe(3);
  });

  test('all buckets have bucket policies denying HTTP (non-SSL) access (NFR-SEC-001)', () => {
    const { template } = buildStack();
    // enforceSSL: true generates a bucket policy with a Deny on aws:SecureTransport: false
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy', {
      Properties: {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      },
    });
    expect(Object.keys(bucketPolicies).length).toBe(3);
  });
});

// ── Records Bucket CORS ───────────────────────────────────────────────────────
describe('S3Stack — Health Records Bucket CORS', () => {
  test('records bucket has a CORS rule allowing PUT method', () => {
    const { template } = buildStack();
    // Records bucket is the only one with CORS (for presigned PUT from browser)
    const bucketsWithCors = template.findResources('AWS::S3::Bucket', {
      Properties: {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['PUT']),
            }),
          ]),
        },
      },
    });
    expect(Object.keys(bucketsWithCors).length).toBe(1);
  });

  test('CORS rule on records bucket exposes ETag header (for multipart upload verification)', () => {
    const { template } = buildStack();
    const bucketsWithCors = template.findResources('AWS::S3::Bucket', {
      Properties: {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              ExposedHeaders: Match.arrayWith(['ETag']),
            }),
          ]),
        },
      },
    });
    expect(Object.keys(bucketsWithCors).length).toBe(1);
  });

  test('prescriptions and credentials buckets have NO CORS (server-side only)', () => {
    const { template } = buildStack();
    const cfn = template.toJSON();
    const bucketsWithoutCors = Object.values(cfn.Resources).filter(
      (r: any) =>
        r.Type === 'AWS::S3::Bucket' &&
        r.Properties.CorsConfiguration === undefined,
    );
    // 3 total buckets, 1 has CORS → 2 have no CORS
    expect(bucketsWithoutCors.length).toBe(2);
  });
});

// ── Secrets Manager ───────────────────────────────────────────────────────────
describe('S3Stack — Secrets Manager', () => {
  test('creates exactly 5 secrets (jwt, otp-pepper, msg91, sendgrid, razorpay)', () => {
    const { template } = buildStack();
    template.resourceCountIs('AWS::SecretsManager::Secret', 5);
  });

  test('JWT secret has a secret name of medslot/jwt/secret', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'medslot/jwt/secret',
    });
  });

  test('OTP pepper secret has a secret name of medslot/otp/pepper', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'medslot/otp/pepper',
    });
  });

  test('MSG91 secret has correct name', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'medslot/msg91/api-key',
    });
  });

  test('SendGrid secret has correct name', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'medslot/sendgrid/api-key',
    });
  });

  test('Razorpay secret has correct name', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'medslot/razorpay/keys',
    });
  });

  test('JWT and OTP pepper secrets have auto-generated 64-char values', () => {
    const { template } = buildStack();
    // Secrets with GenerateSecretString have this CFn property
    const secrets = template.findResources('AWS::SecretsManager::Secret', {
      Properties: {
        GenerateSecretString: {
          PasswordLength: 64,
        },
      },
    });
    // jwt/secret and otp/pepper both use generateSecretString
    expect(Object.keys(secrets).length).toBe(2);
  });
});

// ── CloudFormation Outputs ────────────────────────────────────────────────────
describe('S3Stack — CloudFormation Outputs', () => {
  test('exports RecordsBucketName, PrescriptionsBucketName, CredentialsBucketName, JwtSecretArn', () => {
    const { template } = buildStack();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('RecordsBucketName');
    expect(outputs).toHaveProperty('PrescriptionsBucketName');
    expect(outputs).toHaveProperty('CredentialsBucketName');
    expect(outputs).toHaveProperty('JwtSecretArn');
  });
});
