const path = require("node:path");

module.exports = {
  cfunctions_path: path.resolve(__dirname, "../js/common_functions.js"),
  functions_path: path.resolve(__dirname, "server_functions.js"),
  worker_path: path.resolve(__dirname, "server_worker.js"),
  data_path: path.resolve(__dirname, "data.js"),
  keyword: "123",
  access_master: "123",
  bot_key: "123",
  discord_token: "NDXXXXXXXXXXX...",
  apple_token: "acXXXXXXXX...",
  steam_key: "8aXXXXXXXXX...",
  steam_web_key: "B4XXXXXXX...",
  steam_partner_key: "F9XXXXXXX...",
  is_sdk: 1,
  close_timeout: 4000,
  ip_limit: 3,
  character_limit: 3,
  fast_sdk: 0,
  base_url: "http://appserver:8080", // Base server url. Location of the dev appserver. This is defined in the dockerFile or defined how you manually start the dev appserver # Default "http://thegame.com"
};
