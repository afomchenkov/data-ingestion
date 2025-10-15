module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  name    = "ingest-vpc-${var.env}"
  cidr    = "10.0.0.0/16"
  azs     = slice(data.aws_availability_zones.available.names, 0, 3)
  public_subnets  = ["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24","10.0.12.0/24","10.0.13.0/24"]
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  cluster_name = "ingest-eks-${var.env}"
  cluster_version = "1.28"
  subnets = module.vpc.private_subnets
  vpc_id  = module.vpc.vpc_id
  node_groups = {
    default = {
      desired_capacity = 3
      instance_type = "t3.medium"
    }
  }
  manage_aws_auth = true
}
