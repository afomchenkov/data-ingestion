# Specify the AWS provider
provider "aws" {
  region = "us-east-1"
}

# Create a DynamoDB table
resource "aws_dynamodb_table" "example" {
  name           = "example-table"
  billing_mode   = "PROVISIONED"   # or "PAY_PER_REQUEST"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "UserId"
  range_key      = "Timestamp"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }

  tags = {
    Environment = "dev"
    Project     = "demo"
  }
}
