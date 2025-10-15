resource "aws_s3_bucket" "uploads" {
  bucket = "data-ingest-uploads-${var.env}"
  acl    = "private"
  
  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "expire-temp"
    enabled = true
    expiration {
      days = 365
    }
  }
}
