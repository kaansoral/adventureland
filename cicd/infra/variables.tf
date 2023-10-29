variable "hcloud_token" {
  sensitive = true
}

variable "datacenter" {
  type    = string
  default = "nbg1-dc3"
}
