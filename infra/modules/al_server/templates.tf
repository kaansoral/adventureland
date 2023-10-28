data "template_file" "variables_js" {
  template = file("${path.module}/templates/variables.js")
  vars = {
    base_url : var.secrets.base_url,
    keyword : var.secrets.keyword,
    master : var.secrets.master,
    server_master :  var.secrets.server_master,
    bot_key : var.secrets.bot_key,
  }
}

data "template_file" "secrets_py" {
  template = file("${path.module}/templates/secrets.py")
  vars = {
    keyword : var.secrets.keyword,
    master : var.secrets.master,
    server_master :  var.secrets.server_master,
    bot_key : var.secrets.bot_key,
  }
}

data "template_file" "install_sh" {
  template = file("${path.module}/templates/install.sh")
}

data "template_file" "run_master_sh" {
  template = file("${path.module}/templates/run-master.sh")
}

data "template_file" "run_server_sh" {
  template = file("${path.module}/templates/run-server.sh")
}

data "template_file" "master_service" {
  template = file("${path.module}/templates/service.service")
  vars = {
    command_start : "sh /opt/run-master.sh"
    description : "Adventureland master server"
  }
}

data "template_file" "server_service" {
  template = file("${path.module}/templates/service.service")
  vars = {
    command_start : "sh /opt/run-server.sh"
    description : "Adventureland node server"
  }
}

data "template_file" "cloud_init" {
  template = file("${path.module}/templates/cloud-init.yaml")
  vars = {
    install_sh : indent(4, data.template_file.install_sh.rendered)
    run_server_sh : indent(4, data.template_file.run_server_sh.rendered)
    run_server : var.server.enabled,
    run_master_sh : indent(4, data.template_file.run_master_sh.rendered)
    run_master : var.master.enabled,
    master_service : indent(4, data.template_file.master_service.rendered)
    server_service : indent(4, data.template_file.server_service.rendered)
    secrets_py: indent(4, data.template_file.secrets_py.rendered)
    variables_js: indent(4, data.template_file.variables_js.rendered)
    volume_id: contains(hcloud_volume.storage,0)?hcloud_volume.storage[0].id:0
  }
}

data "cloudinit_config" "master" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = data.template_file.cloud_init.rendered
    filename     = "cloud-init.yaml"
  }
}
