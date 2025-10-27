global_secondary_index {
  name               = "EmailIndex"
  hash_key           = "Email"
  projection_type    = "ALL"
  read_capacity      = 5
  write_capacity     = 5
}

attribute {
  name = "Email"
  type = "S"
}
