/**
 * ecs-stack.ts — MedSlot ECS Fargate Cluster + ALB + ElastiCache Redis (TASK-006)
 *
 * Provisions:
 *   ECS Fargate cluster (ap-south-1, 2 AZs) with 4 service definitions:
 *     medslot-api      — Django Gunicorn on port 8000 (0.5 vCPU / 1 GB, 2→8 tasks)
 *     medslot-frontend — Next.js on port 3000           (0.5 vCPU / 1 GB, 2→4 tasks)
 *     medslot-worker   — Celery worker                  (0.5 vCPU / 2 GB, 1→4 tasks)
 *     medslot-beat     — Celery beat (singleton)        (0.25 vCPU / 0.5 GB, 1 task)
 *
 *   ALB (internet-facing, public subnets):
 *     HTTPS 443 → /api/* and /admin/* and /webhooks/* → API target group
 *     HTTPS 443 → /* → Frontend target group
 *     HTTP  80  → redirect to HTTPS 443
 *     ACM certificate: CloudFormation parameter (ACME_CERT_ARN)
 *
 *   ElastiCache Redis 7 (cache.t3.micro, Multi-AZ, private subnets):
 *     Primary + replica in separate AZs (NFR-REL-001)
 *     In-transit encryption enabled
 *
 *   ECR Repositories (one per image):
 *     medslot-backend, medslot-frontend
 *
 *   IAM task roles:
 *     ECS task execution role — ECR pull + CloudWatch logs
 *     ECS task role (API + Worker) — S3 + Secrets Manager + CloudWatch
 *
 * Container images:
 *   Initial task definitions reference placeholder images from ECR repos defined here.
 *   The CD pipeline (TASK-005) will push real images and update the service on each
 *   deployment. Services are created with desiredCount: 0 so they don't attempt to
 *   start with placeholder images until the first real deployment.
 *
 * ADR references: ADR-005 (ECS Fargate + auto-scaling), ADR-006 (async Celery worker)
 * NFR references: NFR-PE-001, NFR-PE-003, NFR-PE-004, NFR-PE-006, NFR-REL-001
 */

import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { RdsStack } from './rds-stack';
import { S3Stack } from './s3-stack';

export interface EcsStackProps extends cdk.StackProps {
  readonly vpcStack: VpcStack;
  readonly rdsStack: RdsStack;
  readonly s3Stack: S3Stack;
}

export class EcsStack extends cdk.Stack {
  /** ALB DNS name — referenced by CloudFront in Phase 13 monitoring setup */
  public readonly albDnsName: string;

  /** ECR repositories — used by TASK-005 (CD pipeline) to push images */
  public readonly backendRepo: ecr.Repository;
  public readonly frontendRepo: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const { vpc, albSg, ecsApiSg, ecsFeSg, ecsWorkerSg, redisSg } = props.vpcStack;
    const { dbInstance, dbCredentialsSecret } = props.rdsStack;
    const {
      recordsBucket,
      prescriptionsBucket,
      credentialsBucket,
      jwtSecret,
      otpPepperSecret,
      msg91Secret,
      sendgridSecret,
      razorpaySecret,
    } = props.s3Stack;

    // ── ACM Certificate Parameter ──────────────────────────────────────────────
    // Placeholder for *.medslot.in ACM certificate.
    // Provide the real ARN via: cdk deploy --parameters EcsStack:AcmCertArn=arn:...
    const acmCertArn = new cdk.CfnParameter(this, 'AcmCertArn', {
      type: 'String',
      description:
        'ACM certificate ARN for *.medslot.in — required for HTTPS ALB listener. ' +
        'Generate via: aws acm request-certificate --domain-name medslot.in --validation-method DNS',
      default: 'arn:aws:acm:ap-south-1:123456789012:certificate/placeholder-replace-before-deploy',
    });

    // ── ECR Repositories ───────────────────────────────────────────────────────
    // Image tag immutability: once a tag is pushed it cannot be overwritten.
    // CD pipeline tags images with the Git commit SHA (unique, immutable).
    // imageScanOnPush: vulnerability scanning on every push — alerts go to CloudWatch.
    this.backendRepo = new ecr.Repository(this, 'BackendRepo', {
      repositoryName: 'medslot-backend',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.frontendRepo = new ecr.Repository(this, 'FrontendRepo', {
      repositoryName: 'medslot-frontend',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.IMMUTABLE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── ElastiCache Redis 7 ────────────────────────────────────────────────────
    // Subnet group: private subnets (ECS tasks and Redis share the same tier)
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'MedSlot Redis subnet group — private subnets across 2 AZs',
      subnetIds: vpc.privateSubnets.map((s) => s.subnetId),
      cacheSubnetGroupName: 'medslot-redis-subnet-group',
    });

    // Redis 7 replication group: primary + 1 read replica in separate AZs.
    // automaticFailoverEnabled: automatic promotion of replica on primary failure → NFR-REL-001.
    // transitEncryptionEnabled: TLS in transit between ECS tasks and Redis → NFR-SEC-001.
    const redisReplicationGroup = new elasticache.CfnReplicationGroup(
      this,
      'MedSlotRedis',
      {
        replicationGroupDescription:
          'MedSlot Redis 7 — Celery broker, OTP rate limiting, slot availability cache',
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        numCacheClusters: 2, // primary + 1 replica
        cacheNodeType: 'cache.t3.micro',
        engine: 'redis',
        engineVersion: '7.1',
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        cacheSubnetGroupName: redisSubnetGroup.ref,
        securityGroupIds: [redisSg.securityGroupId],
        snapshotRetentionLimit: 1, // 1-day snapshot for Redis (ephemeral — cache data is transient)
        preferredMaintenanceWindow: 'sun:20:00-sun:21:00', // 01:30–02:30 IST Sunday
      },
    );
    redisReplicationGroup.addDependency(redisSubnetGroup);

    // ── ECS Cluster ────────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'MedSlotCluster', {
      vpc,
      clusterName: 'medslot',
      // containerInsights deprecated in aws-cdk-lib 2.257+; containerInsightsV2 produces
      // identical CloudFormation: { ClusterSettings: [{ Name: 'containerInsights', Value: 'enabled' }] }
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // ── IAM Roles ──────────────────────────────────────────────────────────────

    // Execution role: allows ECS agent to pull ECR images and send logs to CloudWatch
    const executionRole = new iam.Role(this, 'EcsExecutionRole', {
      roleName: 'medslot-ecs-execution-role',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    // Task role: permissions the application code needs at runtime
    // API + Worker tasks share this role; Beat task uses the same (minimal footprint).
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      roleName: 'medslot-ecs-task-role',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // S3 — API reads/writes all three buckets (health records, prescriptions, credentials)
    recordsBucket.grantReadWrite(taskRole);
    prescriptionsBucket.grantReadWrite(taskRole);
    credentialsBucket.grantReadWrite(taskRole);

    // Secrets Manager — read all application secrets at runtime.
    // S3Stack secrets: grantRead() is safe — adds identity policy on taskRole only (no reverse edge).
    for (const secret of [jwtSecret, otpPepperSecret, msg91Secret, sendgridSecret, razorpaySecret]) {
      secret.grantRead(taskRole);
    }
    // RDS credentials secret: cannot use grantRead() across stacks — CDK adds a resource policy
    // to the secret (in RdsStack) referencing the task role ARN (in EcsStack), creating a
    // RdsStack → EcsStack reverse edge that cycles with EcsStack → RdsStack.
    // Use a direct IAM policy with an ARN pattern instead to avoid the cross-stack cycle.
    taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [
          `arn:${this.partition}:secretsmanager:${this.region}:${this.account}:secret:medslot/rds*`,
        ],
      }),
    );

    // CloudWatch — structured JSON logs from all services
    taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      }),
    );

    // ── Log Groups ─────────────────────────────────────────────────────────────
    // One log group per service, 3-month retention (balances cost vs audit needs).
    const makeLogGroup = (name: string): logs.LogGroup =>
      new logs.LogGroup(this, `${name}LogGroup`, {
        logGroupName: `/medslot/ecs/${name}`,
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

    const apiLogGroup = makeLogGroup('api');
    const frontendLogGroup = makeLogGroup('frontend');
    const workerLogGroup = makeLogGroup('worker');
    const beatLogGroup = makeLogGroup('beat');

    // ── Common environment variables ───────────────────────────────────────────
    // Secrets are injected via ECS secrets (fetched from Secrets Manager at task start).
    // Non-secret config is in environment variables.
    const dbEndpoint = dbInstance.dbInstanceEndpointAddress;
    const dbPort = dbInstance.dbInstanceEndpointPort;

    const redisHost = redisReplicationGroup.attrPrimaryEndPointAddress;
    const redisPort = redisReplicationGroup.attrPrimaryEndPointPort;

    const commonEnv: { [key: string]: string } = {
      DJANGO_SETTINGS_MODULE: 'medslot.settings.production',
      DATABASE_HOST: dbEndpoint,
      DATABASE_PORT: dbPort,
      DATABASE_NAME: 'medslot',
      REDIS_HOST: redisHost,
      REDIS_PORT: redisPort,
      AWS_REGION: this.region,
      S3_RECORDS_BUCKET: recordsBucket.bucketName,
      S3_PRESCRIPTIONS_BUCKET: prescriptionsBucket.bucketName,
      S3_CREDENTIALS_BUCKET: credentialsBucket.bucketName,
    };

    // Import the RDS secret by its complete ARN instead of using the CDK managed object
    // directly. When fromSecretCompleteArn() is used, CDK calls addToPrincipal() (identity
    // policy on the role) rather than addToPrincipalOrResource() (resource policy on the
    // secret). This prevents CDK from writing a resource policy in RdsStack that would
    // reference the EcsExecutionRole ARN from EcsStack — which would create a circular
    // cross-stack dependency (RdsStack → EcsStack while EcsStack → RdsStack already exists).
    const dbCredSecretImported = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'DbCredSecretImported',
      dbCredentialsSecret.secretArn,
    );

    // Secrets injected as ECS task secrets (fetched at container start, never in image)
    const makeSecrets = (): { [key: string]: ecs.Secret } => ({
      SECRET_KEY: ecs.Secret.fromSecretsManager(jwtSecret, 'value'),
      JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, 'value'),
      OTP_PEPPER: ecs.Secret.fromSecretsManager(otpPepperSecret, 'value'),
      MSG91_API_KEY: ecs.Secret.fromSecretsManager(msg91Secret),
      SENDGRID_API_KEY: ecs.Secret.fromSecretsManager(sendgridSecret),
      DATABASE_USER: ecs.Secret.fromSecretsManager(dbCredSecretImported, 'username'),
      DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbCredSecretImported, 'password'),
    });

    // ── ALB ────────────────────────────────────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, 'MedSlotAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      loadBalancerName: 'medslot-alb',
    });
    this.albDnsName = alb.loadBalancerDnsName;

    // HTTP → HTTPS redirect listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS listener with ACM certificate
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        elbv2.ListenerCertificate.fromArn(acmCertArn.valueAsString),
      ],
      sslPolicy: elbv2.SslPolicy.TLS12_EXT, // TLS 1.2+ minimum (NFR-SEC-001)
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'application/json',
        messageBody: '{"error":"not found"}',
      }),
    });

    // ── API Service (medslot-api) ──────────────────────────────────────────────
    const apiTaskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: 'medslot-api',
      cpu: 512,   // 0.5 vCPU
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
    });
    apiTaskDef.addContainer('api', {
      // Placeholder image — CD pipeline (TASK-005) replaces on first deploy
      image: ecs.ContainerImage.fromEcrRepository(this.backendRepo, 'latest'),
      command: [
        'gunicorn',
        'medslot.wsgi',
        '--bind', '0.0.0.0:8000',
        '--workers', '4',
        '--timeout', '30',
        '--log-file', '-',
      ],
      portMappings: [{ containerPort: 8000 }],
      environment: commonEnv,
      secrets: makeSecrets(),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup: apiLogGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8000/api/v1/health/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const apiService = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition: apiTaskDef,
      serviceName: 'medslot-api',
      desiredCount: 0, // CD pipeline sets to 2 on first deploy (avoids startup failure with placeholder image)
      securityGroups: [ecsApiSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true }, // auto-rollback on failed deployment
      enableECSManagedTags: true,
      // Zero-downtime rolling deploy: keep all tasks running while new tasks spin up (NFR-REL-001)
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    // API target group: /api/*, /admin/*, /webhooks/*
    const apiTargetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      vpc,
      port: 8000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targetGroupName: 'medslot-api-tg',
      healthCheck: {
        path: '/api/v1/health/',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(5),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });
    apiService.attachToApplicationTargetGroup(apiTargetGroup);

    // Path rules for API traffic
    for (const pathPattern of ['/api/*', '/admin/*', '/webhooks/*', '/api/schema/*', '/api/docs/*']) {
      httpsListener.addAction(`ApiRoute-${pathPattern.replace(/[^a-zA-Z]/g, '')}`, {
        priority: 10 + ['/api/*', '/admin/*', '/webhooks/*', '/api/schema/*', '/api/docs/*'].indexOf(pathPattern),
        conditions: [elbv2.ListenerCondition.pathPatterns([pathPattern])],
        action: elbv2.ListenerAction.forward([apiTargetGroup]),
      });
    }

    // API auto-scaling: CPU ≥ 60% for 2 min → scale out (NFR-PE-001 / ADR-005)
    const apiScaling = apiService.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 8 });
    apiScaling.scaleOnCpuUtilization('ApiCpuScaleOut', {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(3),
    });

    // ── Frontend Service (medslot-frontend) ────────────────────────────────────
    const feTaskDef = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      family: 'medslot-frontend',
      cpu: 512,   // 0.5 vCPU
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
    });
    feTaskDef.addContainer('frontend', {
      image: ecs.ContainerImage.fromEcrRepository(this.frontendRepo, 'latest'),
      command: ['node', 'server.js'],
      portMappings: [{ containerPort: 3000 }],
      environment: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: `https://${alb.loadBalancerDnsName}`,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'frontend',
        logGroup: frontendLogGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const feService = new ecs.FargateService(this, 'FrontendService', {
      cluster,
      taskDefinition: feTaskDef,
      serviceName: 'medslot-frontend',
      desiredCount: 0,
      securityGroups: [ecsFeSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      enableECSManagedTags: true,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    // Frontend target group: /* (catch-all, lowest priority)
    const feTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontendTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targetGroupName: 'medslot-frontend-tg',
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(5),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });
    feService.attachToApplicationTargetGroup(feTargetGroup);

    // /* catch-all — highest priority number (lowest priority)
    httpsListener.addAction('FrontendRoute', {
      priority: 100,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      action: elbv2.ListenerAction.forward([feTargetGroup]),
    });

    // Frontend auto-scaling
    const feScaling = feService.autoScaleTaskCount({ minCapacity: 2, maxCapacity: 4 });
    feScaling.scaleOnCpuUtilization('FrontendCpuScaleOut', {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(3),
    });

    // ── Worker Service (medslot-worker) ────────────────────────────────────────
    // Celery worker: handles PDF generation, email, SMS.
    // 2 GB RAM — WeasyPrint requires headroom during PDF rendering (ADR-006).
    const workerTaskDef = new ecs.FargateTaskDefinition(this, 'WorkerTaskDef', {
      family: 'medslot-worker',
      cpu: 512,    // 0.5 vCPU
      memoryLimitMiB: 2048, // 2 GB — WeasyPrint PDF rendering requirement (ADR-006)
      executionRole,
      taskRole,
    });
    workerTaskDef.addContainer('worker', {
      image: ecs.ContainerImage.fromEcrRepository(this.backendRepo, 'latest'),
      command: [
        'celery',
        '-A', 'medslot',
        'worker',
        '--loglevel=info',
        '--concurrency=2',
        '-Q', 'celery,prescriptions',
      ],
      environment: commonEnv,
      secrets: makeSecrets(),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'worker',
        logGroup: workerLogGroup,
      }),
    });

    const workerService = new ecs.FargateService(this, 'WorkerService', {
      cluster,
      taskDefinition: workerTaskDef,
      serviceName: 'medslot-worker',
      desiredCount: 0,
      securityGroups: [ecsWorkerSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      enableECSManagedTags: true,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    // Worker auto-scaling is queue-depth based (configured via CloudWatch alarm in Phase 13).
    // Min/max bounds declared here.
    workerService.autoScaleTaskCount({ minCapacity: 1, maxCapacity: 4 });

    // ── Beat Service (medslot-beat) ────────────────────────────────────────────
    // Celery Beat: cron scheduler — singleton (maxCapacity: 1).
    // Running two Beat instances simultaneously causes duplicate task submissions.
    const beatTaskDef = new ecs.FargateTaskDefinition(this, 'BeatTaskDef', {
      family: 'medslot-beat',
      cpu: 256,    // 0.25 vCPU
      memoryLimitMiB: 512, // 0.5 GB
      executionRole,
      taskRole,
    });
    beatTaskDef.addContainer('beat', {
      image: ecs.ContainerImage.fromEcrRepository(this.backendRepo, 'latest'),
      command: [
        'celery',
        '-A', 'medslot',
        'beat',
        '--loglevel=info',
        '--scheduler', 'django_celery_beat.schedulers:DatabaseScheduler',
      ],
      environment: commonEnv,
      secrets: makeSecrets(),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'beat',
        logGroup: beatLogGroup,
      }),
    });

    new ecs.FargateService(this, 'BeatService', {
      cluster,
      taskDefinition: beatTaskDef,
      serviceName: 'medslot-beat',
      desiredCount: 0,
      securityGroups: [ecsWorkerSg], // Beat uses the same SG as Worker
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      enableECSManagedTags: true,
      // Beat is a singleton — 0→1 swap (no parallel tasks); 200% allows brief overlap
      minHealthyPercent: 0,
      maxHealthyPercent: 200,
    });
    // Note: no auto-scaling for Beat — it is a singleton by design.

    // ── CloudFormation Outputs ─────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS name — point medslot.in CNAME here',
      exportName: `${this.stackName}-AlbDnsName`,
    });
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS cluster name',
      exportName: `${this.stackName}-ClusterName`,
    });
    new cdk.CfnOutput(this, 'BackendEcrUri', {
      value: this.backendRepo.repositoryUri,
      description: 'Backend ECR repository URI (used by CD pipeline)',
      exportName: `${this.stackName}-BackendEcrUri`,
    });
    new cdk.CfnOutput(this, 'FrontendEcrUri', {
      value: this.frontendRepo.repositoryUri,
      description: 'Frontend ECR repository URI (used by CD pipeline)',
      exportName: `${this.stackName}-FrontendEcrUri`,
    });
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisReplicationGroup.attrPrimaryEndPointAddress,
      description: 'ElastiCache Redis primary endpoint',
      exportName: `${this.stackName}-RedisEndpoint`,
    });
  }
}
