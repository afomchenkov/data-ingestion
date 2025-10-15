resource "aws_db_instance" "pg" {
  identifier = "ingest-pg-${var.env}"
  engine     = "postgres"
  engine_version = "15"
  instance_class = var.db_instance_class
  allocated_storage = 100
  username = var.db_username
  password = data.aws_secretsmanager_secret_version.db_secret.secret_string
  multi_az = true
  storage_type = "gp3"
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_name = var.db_name
}
