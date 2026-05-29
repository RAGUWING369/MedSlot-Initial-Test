/**
 * vpc-stack.ts — MedSlot VPC & Security Groups (TASK-006)
 *
 * 3-tier subnet architecture across 2 AZs in ap-south-1:
 *   Public (10.0.0.x/24)   — ALB, NAT Gateways
 *   Private (10.0.2.x/24)  — ECS Fargate tasks, ElastiCache Redis
 *   Isolated (10.0.4.x/24) — RDS PostgreSQL (no internet route)
 *
 * Note: CDK allocates /24 subnets sequentially from the /16 CIDR.
 * The ARCHITECTURE.md CIDRs (10.0.0.x, 10.0.10.x, 10.0.20.x) are design-intent
 * with expansion gaps; CDK managed allocation (sequential /24 assignment) achieves
 * identical security posture. See 07-implementation-assumptions.md A-07-001.
 *
 * NAT Gateways: 2 (one per AZ) for HA — private tasks survive a single-AZ NAT
 * failure. Required for 99.9% SLA target (NFR-REL-001 / ADR-005).
 *
 * ADR reference: ADR-005 (ECS Fargate + RDS Multi-AZ)
 */

import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  /** Shared VPC — consumed by RdsStack and EcsStack as a cross-stack reference */
  public readonly vpc: ec2.Vpc;

  // Security groups exported so dependent stacks can reference SG IDs without
  // hardcoding — this is the CDK-recommended cross-stack SG pattern.
  public readonly albSg: ec2.SecurityGroup;
  public readonly ecsApiSg: ec2.SecurityGroup;
  public readonly ecsFeSg: ec2.SecurityGroup;
  public readonly ecsWorkerSg: ec2.SecurityGroup;
  public readonly rdsSg: ec2.SecurityGroup;
  public readonly redisSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── VPC ──────────────────────────────────────────────────────────────────
    this.vpc = new ec2.Vpc(this, 'MedSlotVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: 'Private',
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          name: 'Isolated',
          cidrMask: 24,
        },
      ],
    });

    // VPC Flow Logs — all traffic to CloudWatch for security auditing.
    // Required evidence for any future compliance review.
    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: '/medslot/vpc/flow-logs',
      retention: logs.RetentionDays.THREE_MONTHS,
      // RETAIN: VPC flow logs are compliance audit evidence — they must survive
      // stack teardown. DESTROY would permanently delete network security logs.
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // ── Security Groups ───────────────────────────────────────────────────────
    // allowAllOutbound: false on every SG — all egress is explicit.
    // Principle: least-privilege network access.

    // ALB: internet-facing ingress on 443 and 80 (80 redirected to 443 by listener)
    this.albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      description: 'MedSlot ALB — HTTPS/HTTP inbound from internet',
      allowAllOutbound: false,
      securityGroupName: 'medslot-alb-sg',
    });
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS from internet');
    this.albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP from internet (ALB listener redirects to HTTPS)',
    );

    // ECS API: Django Gunicorn port 8000
    this.ecsApiSg = new ec2.SecurityGroup(this, 'EcsApiSg', {
      vpc: this.vpc,
      description: 'MedSlot ECS API — port 8000 from ALB',
      allowAllOutbound: false,
      securityGroupName: 'medslot-ecs-api-sg',
    });
    this.ecsApiSg.addIngressRule(this.albSg, ec2.Port.tcp(8000), 'Gunicorn from ALB');

    // ECS Frontend: Next.js port 3000
    this.ecsFeSg = new ec2.SecurityGroup(this, 'EcsFeSg', {
      vpc: this.vpc,
      description: 'MedSlot ECS Frontend — port 3000 from ALB',
      allowAllOutbound: false,
      securityGroupName: 'medslot-ecs-frontend-sg',
    });
    this.ecsFeSg.addIngressRule(this.albSg, ec2.Port.tcp(3000), 'Next.js from ALB');

    // ECS Worker + Beat: Celery — no inbound (pulls from Redis broker)
    this.ecsWorkerSg = new ec2.SecurityGroup(this, 'EcsWorkerSg', {
      vpc: this.vpc,
      description: 'MedSlot ECS Worker/Beat — no inbound; egress to RDS/Redis/internet',
      allowAllOutbound: false,
      securityGroupName: 'medslot-ecs-worker-sg',
    });

    // RDS: PostgreSQL 5432 — inbound from ECS only, no internet route
    this.rdsSg = new ec2.SecurityGroup(this, 'RdsSg', {
      vpc: this.vpc,
      description: 'MedSlot RDS — port 5432 from ECS API and Worker only',
      allowAllOutbound: false,
      securityGroupName: 'medslot-rds-sg',
    });
    this.rdsSg.addIngressRule(this.ecsApiSg, ec2.Port.tcp(5432), 'PostgreSQL from ECS API');
    this.rdsSg.addIngressRule(
      this.ecsWorkerSg,
      ec2.Port.tcp(5432),
      'PostgreSQL from ECS Worker/Beat',
    );

    // ElastiCache Redis: 6379 — inbound from ECS only
    this.redisSg = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc: this.vpc,
      description: 'MedSlot Redis — port 6379 from ECS API and Worker only',
      allowAllOutbound: false,
      securityGroupName: 'medslot-redis-sg',
    });
    this.redisSg.addIngressRule(this.ecsApiSg, ec2.Port.tcp(6379), 'Redis from ECS API');
    this.redisSg.addIngressRule(
      this.ecsWorkerSg,
      ec2.Port.tcp(6379),
      'Redis from ECS Worker/Beat',
    );

    // ── Egress rules (defined after all SGs exist for cross-SG references) ────

    // ALB → ECS services only
    this.albSg.addEgressRule(this.ecsApiSg, ec2.Port.tcp(8000), 'To ECS API');
    this.albSg.addEgressRule(this.ecsFeSg, ec2.Port.tcp(3000), 'To ECS Frontend');

    // ECS API → RDS + Redis + internet HTTPS (MSG91, SendGrid, Razorpay, S3, SecretsManager)
    this.ecsApiSg.addEgressRule(this.rdsSg, ec2.Port.tcp(5432), 'To RDS');
    this.ecsApiSg.addEgressRule(this.redisSg, ec2.Port.tcp(6379), 'To Redis');
    this.ecsApiSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Outbound HTTPS via NAT (external APIs + AWS services)',
    );

    // ECS Frontend → internet HTTPS (Next.js SSR upstream API calls)
    this.ecsFeSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Outbound HTTPS via NAT',
    );

    // ECS Worker → RDS + Redis + internet HTTPS (S3 PDF upload, SendGrid, MSG91)
    this.ecsWorkerSg.addEgressRule(this.rdsSg, ec2.Port.tcp(5432), 'To RDS');
    this.ecsWorkerSg.addEgressRule(this.redisSg, ec2.Port.tcp(6379), 'To Redis');
    this.ecsWorkerSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Outbound HTTPS via NAT (S3, SendGrid, MSG91)',
    );

    // ── CloudFormation Outputs ────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'MedSlot VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map((s) => s.subnetId).join(','),
      description: 'Public subnet IDs (ALB, NAT)',
      exportName: `${this.stackName}-PublicSubnetIds`,
    });
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map((s) => s.subnetId).join(','),
      description: 'Private subnet IDs (ECS, ElastiCache)',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });
    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: this.vpc.isolatedSubnets.map((s) => s.subnetId).join(','),
      description: 'Isolated subnet IDs (RDS)',
      exportName: `${this.stackName}-IsolatedSubnetIds`,
    });
  }
}
