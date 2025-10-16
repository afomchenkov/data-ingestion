variable "aws_region" { default = "eu-west-1" }
variable "cluster_name" { default = "my-eks-cluster" }
variable "env" { default = "dev" }
variable "vpc_cidr" { default = "10.0.0.0/16" }
variable "db_password" { description = "RDS master password" }
variable "db_username" { default = "pgadmin" }
