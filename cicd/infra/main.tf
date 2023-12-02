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

module "eu_2_server" {
  name         = "EU-II"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "II"
  }
}

module "eu_3_server" {
  name         = "EU-III"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "III"
  }
}
module "eu_4_server" {
  name         = "EU-IIII"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "IIII"
  }
}
module "eu_5_server" {
  name         = "EU-IIIII"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "IIIII"
  }
}
module "eu_6_server" {
  name         = "EU-IIIIII"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "IIIIII"
  }
}
module "eu_7_server" {
  name         = "EU-IIIIIII"
  source       = "./modules/al_server"
  datacenter   = "nbg1-dc3"
  hcloud_token = var.hcloud_token
  ssh_keys     = data.hcloud_ssh_keys.admin.ssh_keys.*.name
  server = {
    enabled = true
    region  = "EU"
    name    = "IIIIIII"
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

resource "local_file" "inventory" {
  content  = templatefile("./templates/inventory.tpl", {
    base_url = local.secrets.base_url
    keyword = local.secrets.keyword
    master = local.secrets.master
    bot_key = local.secrets.bot_key
    master_server = module.master
    game_servers = local.servers
  })
  filename = "../setup/inventory.yml"
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
    module.eu_2_server.details,
    module.eu_3_server.details,
    module.eu_4_server.details,
    module.eu_5_server.details,
    module.eu_6_server.details,
    module.eu_7_server.details,
    module.eu_8_server.details,
    module.eu_9_server.details,
    module.eu_10_server.details,

  ]
}