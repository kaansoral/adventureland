module "master" {
  name         = "master"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  master = {
    enabled = true
  }
}

module "eu_1_server" {
  name         = "EU-I"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "I"
  }
}

module "us_1_server" {
  name         = "US-I"
  source       = "./modules/al_server"
  datacenter   = "hil-dc1"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "US"
    name    = "I"
  }
}

data "hcloud_ssh_keys" "admin" {
  with_selector = "role=admin"
}

resource "local_file" "remote_state" {
  content  = templatefile("./templates/inventory.tpl", {
    base_url = local.secrets.base_url
    keyword = local.secrets.keyword
    master = local.secrets.master
    bot_key = local.secrets.bot_key
    master_server = module.master
    game_servers = local.servers
  })
  filename = "inventory.yml"
}

locals {
  secrets = {
    base_url      = var.base_url
    keyword       = random_password.keyword.result
    master        = random_password.master.result
    bot_key       = random_password.bot_key.result
  }
  servers = [
    module.us_1_server.details,
    module.eu_1_server.details,
  ]
}