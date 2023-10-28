resource "random_string" "bot_key" {
  length  = 32
  special = false
}

resource "random_string" "server_master" {
  length  = 32
  special = false
}

resource "random_string" "master" {
  length  = 32
  special = false
}

resource "random_string" "keyword" {
  length  = 32
  special = false
}
