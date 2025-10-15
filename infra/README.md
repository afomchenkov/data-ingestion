# Infra

## High-level architecture

Uploader/Parser MS (HTTP(s) behind ALB/Ingress).

> Uploader MS:

- Auth & basic validation.
- Upload file to S3 (pre-signed PUT / direct multipart upload).
- Persist upload metadata to RDS / Dynamo.
- Emit an event for processing:
  - Put message in SQS
  - Produce event to Confluent Kafka topic (for streaming / audit / downstream consumers).

> Parser MS:

- Consumes messages (SQS consumer / Kafka consumer).
- Fetch file from S3,
  - parse (CSV/NDJSON/JSON),
  - validate with Ajv,
  - transform, and upsert into Postgres (RDS), use staging table + bulk merge for performance.
- Emits processing results/events to Kafka and updates ingestion_jobs table in RDS.
- Postgres (RDS) stores canonical data and metadata.
- Monitoring: Prometheus exporters + CloudWatch; logs to CloudWatch / Loki.
- CI/CD builds Docker images, pushes to ECR, deploys to EKS (Helm or kubectl manifests).
- Terraform provisions infra.
