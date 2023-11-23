resource "random_password" "bot_key" {
  length  = 32
  special = false
}

resource "random_password" "server_master" {
  length  = 32
  special = false
}

resource "random_password" "master" {
  length  = 32
  special = false
}

resource "random_password" "keyword" {
  length  = 32
  special = false
}
