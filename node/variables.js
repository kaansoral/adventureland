const path = require("path")

module.exports={
	"cfunctions_path":path.resolve(__dirname, "../js/common_functions.js"),
	"functions_path":path.resolve(__dirname, "server_functions.js"),
	"worker_path":path.resolve(__dirname, "server_worker.js"),
	"data_path":path.resolve(__dirname, "data.js"),
	"base_url":"${base_url}",
	"keyword":"${keyword}",
	"master":"${master}",
	"server_master":"${server_master}",
	"bot_key":"${bot_key}",
	"discord_token":"NDXXXXXXXXXXX...",
	"apple_token":"acXXXXXXXX...",
	"steam_key":"8aXXXXXXXXX...",
	"steam_web_key":"B4XXXXXXX...",
	"steam_partner_key":"F9XXXXXXX...",
	"is_sdk":0,
	"close_timeout":4000,
	"ip_limit":3,
	"character_limit":3,
	"fast_sdk":0,
}
