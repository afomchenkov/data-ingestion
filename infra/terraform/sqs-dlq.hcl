resource "aws_sqs_queue" "dlq" {
  name = "ingest-dlq-${var.env}"
}

resource "aws_sqs_queue" "ingest" {
  name = "ingest-queue-${var.env}"

  visibility_timeout_seconds = 300
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 5
  })
}
