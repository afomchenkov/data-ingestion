resource "aws_secretsmanager_secret" "db" {
  name = "ingest/db/${var.env}"
}

resource "aws_secretsmanager_secret_version" "db_version" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = aws_db_instance.pg.address
    port     = aws_db_instance.pg.port
    dbname   = var.db_name
  })
}
