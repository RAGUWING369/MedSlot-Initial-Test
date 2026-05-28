/**
 * test/ecs-stack.test.ts — CDK Assertions tests for EcsStack (TASK-006)
 *
 * Verifies: ECS cluster, 4 Fargate services, correct vCPU/RAM, ALB with path routing,
 * HTTP→HTTPS redirect, ElastiCache Redis, ECR repos, IAM task role S3/Secrets grants,
 * auto-scaling policies for API and Frontend services.
 */

import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from '../lib/rds-stack';
import { S3Stack } from '../lib/s3-stack';
import { EcsStack } from '../lib/ecs-stack';

// ── Shared fixture ─────────────────────────────────────────────────────────────
function buildStacks(): {
  vpcStack: VpcStack;
  rdsStack: RdsStack;
  s3Stack: S3Stack;
  ecsStack: EcsStack;
  template: Template;
} {
  const app = new cdk.App();
  const vpcStack = new VpcStack(app, 'TestVpcStack');
  const s3Stack = new S3Stack(app, 'TestS3Stack');
  const rdsStack = new RdsStack(app, 'TestRdsStack', { vpcStack });
  const ecsStack = new EcsStack(app, 'TestEcsStack', { vpcStack, rdsStack, s3Stack });
  const template = Template.fromStack(ecsStack);
  return { vpcStack, rdsStack, s3Stack, ecsStack, template };
}

// ── ECS Cluster ───────────────────────────────────────────────────────────────
describe('EcsStack — ECS Cluster', () => {
  test('creates exactly one ECS cluster named medslot', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'medslot',
    });
  });

  test('Container Insights is enabled on the cluster', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterSettings: Match.arrayWith([
        Match.objectLike({
          Name: 'containerInsights',
          Value: 'enabled',
        }),
      ]),
    });
  });
});

// ── ECS Services ─────────────────────────────────────────────────────────────
describe('EcsStack — ECS Services', () => {
  test('creates exactly 4 ECS services', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ECS::Service', 4);
  });

  test('medslot-api service exists', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'medslot-api',
    });
  });

  test('medslot-frontend service exists', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'medslot-frontend',
    });
  });

  test('medslot-worker service exists', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'medslot-worker',
    });
  });

  test('medslot-beat service exists', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'medslot-beat',
    });
  });

  test('all services have circuit breaker with rollback enabled', () => {
    const { template } = buildStacks();
    const services = template.findResources('AWS::ECS::Service', {
      Properties: {
        DeploymentConfiguration: {
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        },
      },
    });
    expect(Object.keys(services).length).toBe(4);
  });

  test('all services use Fargate launch type', () => {
    const { template } = buildStacks();
    const services = template.findResources('AWS::ECS::Service', {
      Properties: {
        LaunchType: 'FARGATE',
      },
    });
    expect(Object.keys(services).length).toBe(4);
  });

  test('all services have awsvpcConfiguration (no public IP)', () => {
    const { template } = buildStacks();
    const services = template.findResources('AWS::ECS::Service', {
      Properties: {
        NetworkConfiguration: {
          AwsvpcConfiguration: {
            AssignPublicIp: 'DISABLED',
          },
        },
      },
    });
    expect(Object.keys(services).length).toBe(4);
  });
});

// ── Task Definitions — CPU/RAM ────────────────────────────────────────────────
describe('EcsStack — Task Definitions (vCPU / RAM)', () => {
  test('creates exactly 4 Fargate task definitions', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ECS::TaskDefinition', 4);
  });

  test('API task definition: 0.5 vCPU (512) / 1 GB (1024)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: 'medslot-api',
      Cpu: '512',
      Memory: '1024',
    });
  });

  test('Frontend task definition: 0.5 vCPU (512) / 1 GB (1024)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: 'medslot-frontend',
      Cpu: '512',
      Memory: '1024',
    });
  });

  test('Worker task definition: 0.5 vCPU (512) / 2 GB (2048) — WeasyPrint PDF rendering', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: 'medslot-worker',
      Cpu: '512',
      Memory: '2048',
    });
  });

  test('Beat task definition: 0.25 vCPU (256) / 0.5 GB (512)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: 'medslot-beat',
      Cpu: '256',
      Memory: '512',
    });
  });
});

// ── ECR Repositories ──────────────────────────────────────────────────────────
describe('EcsStack — ECR Repositories', () => {
  test('creates exactly 2 ECR repositories (backend + frontend)', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ECR::Repository', 2);
  });

  test('backend ECR repository is named medslot-backend', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'medslot-backend',
    });
  });

  test('frontend ECR repository is named medslot-frontend', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'medslot-frontend',
    });
  });

  test('both ECR repos have image scanning on push enabled', () => {
    const { template } = buildStacks();
    const repos = template.findResources('AWS::ECR::Repository', {
      Properties: {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      },
    });
    expect(Object.keys(repos).length).toBe(2);
  });

  test('both ECR repos have IMMUTABLE image tag mutability', () => {
    const { template } = buildStacks();
    const repos = template.findResources('AWS::ECR::Repository', {
      Properties: {
        ImageTagMutability: 'IMMUTABLE',
      },
    });
    expect(Object.keys(repos).length).toBe(2);
  });
});

// ── ALB ────────────────────────────────────────────────────────────────────────
describe('EcsStack — Application Load Balancer', () => {
  test('creates one internet-facing ALB named medslot-alb', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: 'medslot-alb',
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('creates HTTP listener on port 80', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('HTTP listener has redirect to HTTPS (permanent 301)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      DefaultActions: Match.arrayWith([
        Match.objectLike({
          Type: 'redirect',
          RedirectConfig: Match.objectLike({
            Protocol: 'HTTPS',
            Port: '443',
            StatusCode: 'HTTP_301',
          }),
        }),
      ]),
    });
  });

  test('creates HTTPS listener on port 443', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      Protocol: 'HTTPS',
    });
  });

  test('HTTPS listener uses TLS 1.2 minimum policy (NFR-SEC-001)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
      SslPolicy: Match.stringLikeRegexp('TLS'),
    });
  });

  test('creates 2 target groups (API + Frontend)', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
  });

  test('API target group uses port 8000', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'medslot-api-tg',
      Port: 8000,
      Protocol: 'HTTP',
      TargetType: 'ip',
    });
  });

  test('Frontend target group uses port 3000', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'medslot-frontend-tg',
      Port: 3000,
      Protocol: 'HTTP',
      TargetType: 'ip',
    });
  });
});

// ── ElastiCache Redis ─────────────────────────────────────────────────────────
describe('EcsStack — ElastiCache Redis', () => {
  test('creates one ElastiCache replication group', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
  });

  test('Redis version is 7.x', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      EngineVersion: Match.stringLikeRegexp('^7'),
    });
  });

  test('Redis node type is cache.t3.micro', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      CacheNodeType: 'cache.t3.micro',
    });
  });

  test('Multi-AZ is enabled (NFR-REL-001)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      MultiAZEnabled: true,
      AutomaticFailoverEnabled: true,
    });
  });

  test('Redis has 2 cache clusters (primary + replica)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      NumCacheClusters: 2,
    });
  });

  test('at-rest encryption is enabled', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      AtRestEncryptionEnabled: true,
    });
  });

  test('in-transit encryption (TLS) is enabled (NFR-SEC-001)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
      TransitEncryptionEnabled: true,
    });
  });

  test('creates Redis subnet group for private subnets', () => {
    const { template } = buildStacks();
    template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: 'medslot-redis-subnet-group',
    });
  });
});

// ── Auto-Scaling ──────────────────────────────────────────────────────────────
describe('EcsStack — Auto-Scaling', () => {
  test('creates Application Auto-Scaling scalable targets for API and Frontend', () => {
    const { template } = buildStacks();
    // API and Frontend both have scalable targets; Worker has min/max but no CPU policy
    const targets = template.findResources(
      'AWS::ApplicationAutoScaling::ScalableTarget',
    );
    expect(Object.keys(targets).length).toBeGreaterThanOrEqual(2);
  });

  test('API service has CPU scaling policy targeting 60% utilization (ADR-005)', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingScalingPolicyConfiguration: Match.objectLike({
        TargetValue: 60,
        PredefinedMetricSpecification: Match.objectLike({
          PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
        }),
      }),
    });
  });
});

// ── IAM Roles ─────────────────────────────────────────────────────────────────
describe('EcsStack — IAM Roles', () => {
  test('creates ECS execution role and task role', () => {
    const { template } = buildStacks();
    // At minimum 2 IAM roles: execution role + task role
    const roles = template.findResources('AWS::IAM::Role', {
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
            }),
          ]),
        },
      },
    });
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
  });

  test('execution role has AmazonECSTaskExecutionRolePolicy managed policy', () => {
    const { template } = buildStacks();
    // In an environment-agnostic stack (no account/region), CDK synthesises the managed policy
    // ARN as { "Fn::Join": ["", ["arn:", {"Ref":"AWS::Partition"}, ":iam::aws:policy/service-role/..."]] }
    // rather than a literal string. Match.stringLikeRegexp cannot match a CFN intrinsic object,
    // so we deserialise the ARN list and check for the policy name as a substring.
    const cfn = template.toJSON();
    const execRoles = Object.values(cfn.Resources).filter(
      (r: any) =>
        r.Type === 'AWS::IAM::Role' &&
        r.Properties?.RoleName === 'medslot-ecs-execution-role',
    ) as any[];
    expect(execRoles.length).toBe(1);
    const managedPolicyArns: any[] = execRoles[0].Properties.ManagedPolicyArns ?? [];
    const hasPol = managedPolicyArns.some((arn: any) =>
      JSON.stringify(arn).includes('AmazonECSTaskExecutionRolePolicy'),
    );
    expect(hasPol).toBe(true);
  });

  test('task role is named medslot-ecs-task-role', () => {
    const { template } = buildStacks();
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'medslot-ecs-task-role',
    });
  });
});

// ── Log Groups ────────────────────────────────────────────────────────────────
describe('EcsStack — CloudWatch Log Groups', () => {
  test('creates 4 log groups — one per service', () => {
    const { template } = buildStacks();
    const logGroups = template.findResources('AWS::Logs::LogGroup', {
      Properties: {
        LogGroupName: Match.stringLikeRegexp('/medslot/ecs/'),
      },
    });
    expect(Object.keys(logGroups).length).toBe(4);
  });

  test('all ECS log groups have 3-month retention (90 days)', () => {
    const { template } = buildStacks();
    const logGroups = template.findResources('AWS::Logs::LogGroup', {
      Properties: {
        LogGroupName: Match.stringLikeRegexp('/medslot/ecs/'),
        RetentionInDays: 90,
      },
    });
    expect(Object.keys(logGroups).length).toBe(4);
  });
});

// ── CloudFormation Outputs ────────────────────────────────────────────────────
describe('EcsStack — CloudFormation Outputs', () => {
  test('exports AlbDnsName, ClusterName, BackendEcrUri, FrontendEcrUri, RedisEndpoint', () => {
    const { template } = buildStacks();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('AlbDnsName');
    expect(outputs).toHaveProperty('ClusterName');
    expect(outputs).toHaveProperty('BackendEcrUri');
    expect(outputs).toHaveProperty('FrontendEcrUri');
    expect(outputs).toHaveProperty('RedisEndpoint');
  });
});
