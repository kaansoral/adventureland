const path = require("node:path");

module.exports = {
	cfunctions_path: path.resolve(__dirname, "../js/common_functions.js"),
	functions_path: path.resolve(__dirname, "server_functions.js"),
	worker_path: path.resolve(__dirname, "server_worker.js"),
	data_path: path.resolve(__dirname, "data.js"),
	base_url: "http://thegame.com",
	keyword: "123",
	access_master: "123",
	bot_key: "123",
	apple_token: "acXXXXXXXX...",
	steam_key: "8aXXXXXXXXX...",
	steam_web_key: "B4XXXXXXX...",
	steam_partner_key: "F9XXXXXXX...",
	is_sdk: 1,
	close_timeout: 4000,
	ip_limit: 3,
	character_limit: 3,
	fast_sdk: 0,
	DISCORD: {
		ENABLED: false,
		TOKEN: "NDXXXXXXXXXXX", // Your discord applications bot token
		EVENT_CHANNELS: {
			DEFAULT: "https://discordapp.com/api/channels/404333059018719233/messages", // #game_events
			NEW_PLAYER: "https://discordapp.com/api/channels/839163123499794481/messages", // #new_players
		},
	},

	// mode variable in server.js can be overridden here
	MODE: {
		drm_check: 0, // Enable steam/mac DRM check, prevents authfail debuff being added if disabled
		notverified_debuff: 0, // disables the debuff for not being verified
	},
};
