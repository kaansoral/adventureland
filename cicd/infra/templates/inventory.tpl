master-servers:
  vars:
    ansible_user: root
  hosts:
    master:
      ansible_host: 157.90.225.102
      ansible_ssh_common_args: '-o StrictHostKeyChecking=no'
      region: EU
      name: Master
      master: ${master}
      bot_key: ${bot_key}
      keyword: ${keyword}
      base_url: ${base_url}
      mount_point: "/opt/storage"
      volume_id: "100034037"
game-servers:
  vars:
    ansible_user: root
  hosts:
%{ for server in game_servers ~}
    ${server.region}_${server.name}:
      ansible_host: ${server.ip}
      ansible_ssh_common_args: '-o StrictHostKeyChecking=no'
      region: ${server.region}
      name: ${server.name}
      master: ${master}
      bot_key: ${bot_key}
      keyword: ${keyword}
      base_url: ${base_url}
      excluded_paths:
      - /.github
      - /cicd
%{ endfor ~}