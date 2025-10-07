#!/bin/sh
set -e  # Exit on first error

echo "Initializing localstack S3 and SQS"

echo "Create S3 buckets"

awslocal s3 mb s3://test-bucket || true
awslocal s3 mb s3://raw-data-ingestion-bucket || true
awslocal s3 mb s3://processed-data-ingestion-bucket || true
# TODO: for safety, upload files to this bucket when file type is not valid
awslocal s3 mb s3://quarantine-data-ingestion-bucket || true

echo "Enabling bucket versioning"
for BUCKET in raw-data-ingestion-bucket processed-data-ingestion-bucket; do
  awslocal s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --versioning-configuration Status=Enabled
done

echo "List S3 buckets"
awslocal s3 ls

echo "Create SQS queue"
awslocal sqs create-queue --queue-name raw-data-ingestion-queue || true

QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/raw-data-ingestion-queue \
  --attribute-names QueueArn --query "Attributes.QueueArn" --output text)

echo "Configure S3 bucket notification to SQS"
cat > /tmp/notification.json <<EOF
{
  "QueueConfigurations": [
    {
      "Id": "S3EventToSQS",
      "QueueArn": "${QUEUE_ARN}",
      "Events": ["s3:ObjectCreated:*"]
    }
  ]
}
EOF

awslocal s3api put-bucket-notification-configuration \
  --bucket raw-data-ingestion-bucket \
  --notification-configuration file:///tmp/notification.json

echo "Localstack S3 and SQS setup complete."
