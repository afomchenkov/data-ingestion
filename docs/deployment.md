# Deployment

## Rationale

- S3 for object storage (durable, versioning, lifecycle). Uploader uses pre-signed URLs to offload large uploads.
- SQS for reliable job queue with visibility-timeout and dead-letter queue. Use for simple worker scaling.
- Confluent Kafka for events streaming, replayability, fan-out, integration with other teams. Use alongside SQS (SQS for jobs, Kafka for event stream).
- EKS for microservices, autoscaling, and control over networking.
- Terraform for reproducible infra.
- RDS (Postgres) for canonical relational storage; enable Multi-AZ for HA.
- Secrets Manager / SSM Parameter Store for credentials (Kafka API key, DB password).
- CI/CD: Github Actions building images -> ECR -> Kubernetes manifests/Helm.


## Terraform modules

- terraform-aws-modules/vpc/aws
- terraform-aws-modules/eks/aws
- aws_s3_bucket
- aws_sqs_queue
- aws_db_instance (or aws_rds_cluster for Aurora)
- aws_secretsmanager_secret
- aws_iam_role + aws_iam_policy for service accounts & EKS IRSA


## CI/CD & deployment strategy

Build & push images to ECR:

- GitHub Actions workflow triggers on PR/merge, builds Docker images, pushes to ECR, creates image tag, and updates Helm chart values or K8s manifests in the Git repo.

Deploy to EKS:
- Use kubectl apply or Helm. Use Helm for parameterized deployments.

Deployment patterns:
- Rolling update by default.
- Optionally Blue/Green or Canary (use Argo Rollouts) for safer upgrades.


## GitHub Actions pipeline steps:

- Lint & unit tests
- Build Docker image
- Push to ECR
- Run DB migrations (Flyway or TypeORM migrations) against staging
- Deploy to EKS (helm upgrade --install)
- Run integration tests on staging


## Backups, DR, and retention

- S3: enable versioning and lifecycle (move to Glacier after 30/90 days).
- RDS: automated backups + manual snapshots before schema migrations. Point-in-time recovery enabled.
- Kafka (Confluent): retention policy & replication factor; snapshot/backup if necessary via Confluent tooling.
- Disaster recovery: document process to restore RDS from snapshot in another region; cross-region replication for S3 if needed.

## Deployment plan

> Prep & infra (Terraform)

1. Create AWS account/teams and set up Terraform backend (S3 bucket + DynamoDB lock).
2. Provision VPC and subnets with terraform apply for vpc module.
3. Provision EKS cluster with terraform apply for eks module (node groups).
4. Create S3 bucket, SQS queue + DLQ, RDS instance, Secrets Manager secrets, and necessary IAM roles.
5. Configure IRSA mappings (create IAM role for service account with S3/SQS/SecretsManager policies; annotate k8s service accounts).


> Image & registry

6. Build Docker images for uploader & parser, push to ECR (CI pipeline).


> K8s deploy

7. Apply k8s Namespace, RBAC, ServiceAccounts (with IRSA annotations).
8. Deploy ConfigMaps & Secrets (prefer mounted secrets via CSI/ExternalSecrets).
9. Deploy Uploader service + ALB ingress (test pre-signed URL flow).
10. Deploy Parser service (ensure it can read queue & S3).
11. Smoke tests: upload a small file, verify SQS message, Parser logs process, data in RDS.


> Observability

12. Install Prometheus/Grafana (Helm), Fluent Bit for logging, OTel collectors as DaemonSet.
13. Configure dashboards and alerts.
