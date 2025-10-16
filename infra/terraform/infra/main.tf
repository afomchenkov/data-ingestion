# --- VPC (using terraform-aws-modules/vpc)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = ">= 3.0"

  name = "${var.env}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  public_subnets  = ["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"]
  private_subnets = ["10.0.101.0/24","10.0.102.0/24","10.0.103.0/24"]

  enable_nat_gateway = true
  tags = { "Environment" = var.env }
}

data "aws_availability_zones" "available" {}

# --- ECR repos
resource "aws_ecr_repository" "app_parser" {
  name = "${var.env}-app-parser"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "app_uploader" {
  name = "${var.env}-app-uploader"
  image_scanning_configuration { scan_on_push = true }
}

# --- S3 bucket
resource "aws_s3_bucket" "app_bucket" {
  bucket = "${var.env}-app-bucket-${random_id.bucket_suffix.hex}"
  acl    = "private"

  versioning { enabled = true }

  tags = { Environment = var.env }
}
resource "random_id" "bucket_suffix" { byte_length = 4 }

# --- SQS queue (standard)
resource "aws_sqs_queue" "app_queue" {
  name                       = "${var.env}-app-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 1209600
  tags = { Environment = var.env }
}

# --- RDS PostgreSQL (private subnet)
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = ">= 6.0"

  identifier = "${var.env}-pg"
  engine     = "postgres"
  engine_version = "15.3"
  allocated_storage = 20

  name     = "data-ingestion"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  subnet_ids             = module.vpc.private_subnets

  publicly_accessible = false
  skip_final_snapshot = true
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.env}-rds-sg"
  description = "allow intra-vpc access to rds"
  vpc_id      = module.vpc.vpc_id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
  egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

# --- EKS cluster
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = ">= 19.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.27"
  subnets         = module.vpc.private_subnets
  vpc_id          = module.vpc.vpc_id

  node_groups = {
    ng_default = {
      desired_capacity = 2
      max_capacity     = 5
      min_capacity     = 1
      instance_type    = "t3.medium"
    }
  }

  manage_aws_auth = true
  tags = { Environment = var.env }
}

# Outputs for use
output "kubeconfig" {
  value = module.eks.kubeconfig
  sensitive = true
}
output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "region" { value = var.aws_region }
output "ecr_app_parser_url" { value = aws_ecr_repository.app_parser.repository_url }
output "ecr_app_uploader_url" { value = aws_ecr_repository.app_uploader.repository_url }
output "s3_bucket" { value = aws_s3_bucket.app_bucket.bucket }
output "sqs_url" { value = aws_sqs_queue.app_queue.id }
output "rds_endpoint" { value = module.rds.this_db_instance_address }
