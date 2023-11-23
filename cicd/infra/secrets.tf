resource "random_password" "bot_key" {
  length  = 33
  special = false
}

resource "random_password" "server_master" {
  length  = 33
  special = false
}

resource "random_password" "master" {
  length  = 33
  special = false
}

resource "random_password" "keyword" {
  length  = 33
  special = false
}
