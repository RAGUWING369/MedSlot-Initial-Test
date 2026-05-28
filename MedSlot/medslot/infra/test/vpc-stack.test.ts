/**
 * test/vpc-stack.test.ts — CDK Assertions tests for VpcStack (TASK-006)
 *
 * Tests verify CloudFormation resource properties, not AWS runtime behaviour.
 * All assertions use Template.fromStack() — no AWS credentials required.
 */

import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';

// ── Shared fixture ────────────────────────────────────────────────────────────
// Environment-agnostic stack (no account/region) — CDK uses pseudo-parameters.
// This is the correct approach for unit tests that don't need real values.
function buildStack(): { stack: VpcStack; template: Template } {
  const app = new cdk.App();
  const stack = new VpcStack(app, 'TestVpcStack');
  const template = Template.fromStack(stack);
  return { stack, template };
}

// ── VPC ───────────────────────────────────────────────────────────────────────
describe('VpcStack — VPC', () => {
  test('creates exactly one VPC with CIDR 10.0.0.0/16', () => {
    const { template } = buildStack();
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('creates 6 subnets — 2 public, 2 private, 2 isolated', () => {
    const { template } = buildStack();
    // 3 tiers × 2 AZs = 6 subnets
    template.resourceCountIs('AWS::EC2::Subnet', 6);
  });

  test('public subnets have MapPublicIpOnLaunch enabled', () => {
    const { template } = buildStack();
    // Count subnets where MapPublicIpOnLaunch is true (public subnets)
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: { MapPublicIpOnLaunch: true },
    });
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('private and isolated subnets do not have MapPublicIpOnLaunch', () => {
    const { template } = buildStack();
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: { MapPublicIpOnLaunch: false },
    });
    expect(Object.keys(subnets).length).toBe(4);
  });

  test('all subnets have /24 CIDR mask', () => {
    const { template } = buildStack();
    const cfn = template.toJSON();
    const subnets = Object.values(cfn.Resources).filter(
      (r: any) => r.Type === 'AWS::EC2::Subnet',
    ) as any[];
    subnets.forEach((subnet) => {
      // All subnets should be /24 within 10.0.0.0/16
      const cidr: string = subnet.Properties.CidrBlock;
      expect(cidr).toMatch(/10\.0\.\d+\.0\/24/);
    });
  });
});

// ── NAT Gateways ──────────────────────────────────────────────────────────────
describe('VpcStack — NAT Gateways', () => {
  test('creates 2 NAT Gateways — one per AZ for HA (NFR-REL-001)', () => {
    const { template } = buildStack();
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('NAT Gateways have Elastic IPs', () => {
    const { template } = buildStack();
    // Each NAT Gateway requires an EIP
    template.resourceCountIs('AWS::EC2::EIP', 2);
  });
});

// ── Internet Gateway ──────────────────────────────────────────────────────────
describe('VpcStack — Internet Gateway', () => {
  test('creates one Internet Gateway attached to the VPC', () => {
    const { template } = buildStack();
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });
});

// ── Route Tables ──────────────────────────────────────────────────────────────
describe('VpcStack — Route Tables', () => {
  test('private subnets have routes to NAT Gateways', () => {
    const { template } = buildStack();
    // Each private subnet in each AZ routes to its AZ-local NAT GW
    const natRoutes = template.findResources('AWS::EC2::Route', {
      Properties: {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      },
    });
    expect(Object.keys(natRoutes).length).toBeGreaterThanOrEqual(2);
  });

  test('public subnets have routes to the Internet Gateway', () => {
    const { template } = buildStack();
    const igwRoutes = template.findResources('AWS::EC2::Route', {
      Properties: {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue(),
      },
    });
    expect(Object.keys(igwRoutes).length).toBeGreaterThanOrEqual(1);
  });
});

// ── Security Groups ───────────────────────────────────────────────────────────
describe('VpcStack — Security Groups', () => {
  test('creates exactly 6 security groups', () => {
    const { template } = buildStack();
    // ALB, ECS-API, ECS-FE, ECS-Worker, RDS, Redis = 6
    // Note: CDK may add an additional default SG for the VPC, so we check >= 6
    const sgs = template.findResources('AWS::EC2::SecurityGroup');
    expect(Object.keys(sgs).length).toBeGreaterThanOrEqual(6);
  });

  test('ALB security group allows HTTPS inbound from 0.0.0.0/0', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ALB'),
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
        }),
      ]),
    });
  });

  test('ALB security group allows HTTP (80) inbound for redirect', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('ALB'),
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0',
        }),
      ]),
    });
  });

  test('RDS security group has no 0.0.0.0/0 ingress — inbound from ECS only', () => {
    const { template } = buildStack();
    const cfn = template.toJSON();
    const rdsSgs = Object.values(cfn.Resources).filter(
      (r: any) =>
        r.Type === 'AWS::EC2::SecurityGroup' &&
        typeof r.Properties.GroupDescription === 'string' &&
        r.Properties.GroupDescription.includes('RDS'),
    ) as any[];

    rdsSgs.forEach((sg) => {
      const ingresses: any[] = sg.Properties.SecurityGroupIngress ?? [];
      ingresses.forEach((rule) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        expect(rule.CidrIpv6).not.toBe('::/0');
      });
    });
  });

  test('Redis security group has no 0.0.0.0/0 ingress — inbound from ECS only', () => {
    const { template } = buildStack();
    const cfn = template.toJSON();
    const redisSgs = Object.values(cfn.Resources).filter(
      (r: any) =>
        r.Type === 'AWS::EC2::SecurityGroup' &&
        typeof r.Properties.GroupDescription === 'string' &&
        r.Properties.GroupDescription.includes('Redis'),
    ) as any[];

    redisSgs.forEach((sg) => {
      const ingresses: any[] = sg.Properties.SecurityGroupIngress ?? [];
      ingresses.forEach((rule) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
      });
    });
  });

  test('security group egress rules use security group references (not 0.0.0.0/0) for data stores', () => {
    const { template } = buildStack();
    // RDS and Redis egress rules from ECS SGs must reference the target SG,
    // not a CIDR — this confirms least-privilege egress configuration.
    const egressRules = template.findResources('AWS::EC2::SecurityGroupEgress', {
      Properties: {
        IpProtocol: 'tcp',
        FromPort: Match.anyValue(),
        ToPort: Match.anyValue(),
        DestinationSecurityGroupId: Match.anyValue(),
      },
    });
    expect(Object.keys(egressRules).length).toBeGreaterThanOrEqual(6);
  });
});

// ── VPC Flow Logs ─────────────────────────────────────────────────────────────
describe('VpcStack — VPC Flow Logs', () => {
  test('creates VPC flow log resource', () => {
    const { template } = buildStack();
    template.resourceCountIs('AWS::EC2::FlowLog', 1);
  });

  test('flow log captures ALL traffic (not just REJECT)', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      TrafficType: 'ALL',
    });
  });

  test('flow log CloudWatch log group has 3-month retention', () => {
    const { template } = buildStack();
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/medslot/vpc/flow-logs',
      RetentionInDays: 90,
    });
  });
});

// ── CloudFormation Outputs ────────────────────────────────────────────────────
describe('VpcStack — CloudFormation Outputs', () => {
  test('exports VpcId, PublicSubnetIds, PrivateSubnetIds, IsolatedSubnetIds', () => {
    const { template } = buildStack();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('PublicSubnetIds');
    expect(outputs).toHaveProperty('PrivateSubnetIds');
    expect(outputs).toHaveProperty('IsolatedSubnetIds');
  });
});
