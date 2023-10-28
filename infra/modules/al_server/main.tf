resource "hcloud_server" "server" {
  name        = var.name
  image       = "debian-11"
  server_type = "cpx21"
  datacenter  = var.datacenter
  user_data   = data.cloudinit_config.master.rendered
  ssh_keys    = var.ssh_keys
  public_net {
    ipv4         = hcloud_primary_ip.ip.id
    ipv6_enabled = true
  }
}

resource "hcloud_primary_ip" "ip" {
  name              = "${var.name}-ip"
  type              = "ipv4"
  datacenter        = var.datacenter
  assignee_type     = "server"
  auto_delete       = false
  delete_protection = true
}

resource "hcloud_volume" "storage" {
  count             = var.master.enabled ? 1 : 0
  name              = "${var.name}-storage"
  size              = 40
  server_id         = hcloud_server.server.id
  automount         = true
  format            = "ext4"
  delete_protection = true
}