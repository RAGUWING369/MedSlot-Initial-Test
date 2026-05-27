/**
 * VPC Stack — MedSlot
 *
 * Defines the VPC with:
 *   - CIDR: 10.0.0.0/16
 *   - Public subnets (ALB) in ap-south-1a and ap-south-1b
 *   - Private subnets (ECS tasks, ElastiCache) in ap-south-1a and ap-south-1b
 *   - Isolated subnets (RDS) in ap-south-1a and ap-south-1b
 *   - NAT Gateway in each AZ for outbound traffic from private/isolated subnets
 *   - Security Groups per ARCHITECTURE.md spec
 *
 * Full implementation is delivered in TASK-006 (AWS CDK Infrastructure Stack).
 * This file is the scaffold stub created in TASK-001.
 */

import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  /** The VPC shared by all MedSlot stacks */
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Full VPC implementation in TASK-006.
    // Placeholder VPC to allow `cdk synth` to succeed during scaffold.
    this.vpc = new ec2.Vpc(this, 'MedSlotVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
