variable "hcloud_token" {
  sensitive = true
}

variable "datacenter" {
  type    = string
  default = "nbg1-dc3"
}

variable "ssh_keys" {
  type = list(string)
}

variable "name" {
  type = string
}

variable "master" {
  type = object({
    enabled = bool
  })
  default = {
    enabled = false
  }
}

variable "server" {
  type = object({
    enabled = bool
    region  = string
    name    = string
  })
  default = {
    enabled = false
    region  = "Undefined"
    name    = "Undefined"
  }
}