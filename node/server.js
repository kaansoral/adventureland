var is_game = 0;
var is_server = 1;
var is_code = 0;
var is_pvp = false;
var server = {
	started: false,
	live: false,
	last_update: false,
	shutdown: false, // shutdown start
	stopped: false, // shutdown end
	s: {},
};
var variables = require("./variables");
var is_sdk = variables.is_sdk;
var app = require("http").createServer(http_handler);
//var io=require('socket.io')(app,{pingInterval:2400,pingTimeout:6000});
var io = require("socket.io")(app, {
	pingInterval: 4000,
	pingTimeout: 12000,
	cors: {
		origin: false,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	},
}); // default is 25000 to 60000
var fs = require("fs");
var url = require("url");
var { Worker, SHARE_ENV } = require("worker_threads");
var workers = [];
var wlast = 0;
eval("" + fs.readFileSync(variables.cfunctions_path));
eval("" + fs.readFileSync(variables.functions_path));
eval("" + fs.readFileSync(variables.data_path));
var base_url = variables.base_url;
var server_id = "1";
var server_auth = "123456";
var server_name = "";
var players = {};
var dc_players = {};
var sockets = {};
var observers = {};
var total_monsters = 0;
var max_players = 96;
var chests = {};
var projectiles = {};
var name_to_id = {};
var id_to_id = {};
var invitations = {};
var challenges = {};
var magiportations = {};
var requests = {};
var parties = {};
var frequests = {};
var trequests = {};
var total_moves = 1;
var total_players = 0;
var unique_players = 0;
var observer_map = "winterland";
var observer_x = 0;
var observer_y = 0;
var merchant_map = "main";
var merchant_y = -50;
var merchant_x = 0;
var total_merchants = 0;
var csold = [];
var cfound = []; // cache of S.sold + S.found
var monster_c = {}; // monster counts
var pwns = [];
var pend = 0;
var tavern = {};
var dbase = { h: 8, v: 7, vn: 2 }; // default-base
var G = {};
var D = {};
var P = {}; // the game
var S = {}; // server data
var T = {}; // cosmetics
var E = {
	schedule: {
		time_offset: 0,
		dailies: [13, 20],
		nightlies: [23],
		night: false,
	},
}; // server event data
var TX = [];
var TXX = {}; // all inter account transactions [07/02/22]
var B = {
	ext_vision: 120, // extends the vision by 120 each at all 4 directions -- obsolete now
	u_boundary: 70, // when an entity moves 70px in x or y, triggers .u || xy_u_logic, last_u
	u_vision: 65, // when an entity moves 65px in x or y, new entities in the new area are sent || xy_upush_logic, last_upush
	vision: [700, 500],
	max_vision: 1000, // used at the 'attack'/'heal'-'nothtere' logic
	dist: 400,
	sell_dist: 400,
	door_dist: 112,
	// game dynamics
	transporter_dist: 160,
	rip_time: 12,
	hlevel_loss: 3,
	heal_multiplier: 1,
	arena_limit: 1,
	use_pack_golds: true,
	v: true,
	dps_heal_mult: 1.8, // originally 1.6
	dps_tank_mult: 0.25, // originally 0.25
	game_loop_log_edge: 60,
	instance_loop_log_edge: 120,
	m_outgoing_gmult: 0.12,
	start_map: "main",
	free_last_hits: false,
	pause_instances: true,
	global_drops: true,
};
var CC = {
	auth: 2,
	move: 1.5,
	players: 12,
	secondhands: 16,
	friend: 24,
	send_updates: 12,
	cruise: 10,
	random_look: 10,
	equip: 3,
	unequip: 6,
	tracker: 50,
	ccreport: 3,
};
var limits = {
	calls: 200, // 4 seconds
	party: 9,
	party_max: 10,
};
var W = {
	// warning flags
	chest: {},
};
var mode = {
	range_test: 0,
	path_checks: 1, // when pursuing a player, monsters check each x/y-line, stop pursuit on collision [14/08/16]
	//#IDEA: Disable when low performance is detected [14/08/16]
	upush_test: 0, // stops monsters to test the "push" logic
	random_attacks: 0, // a test mode that makes monsters attack nearby players randomly [11/09/16]
	aggro: 1,
	dpvpblock: 1, // double-sided pvp blocks
	novi: 1, // no vision improvement - added as a patch [12/01/17]
	xyinf: 0, //sends xy data for corrections
	log_pvp: 1, //sends pvp data to appengine, mainly to see whether people leech xp from sub-characters [03/02/17]
	drop_all: 0,
	red_zone: 1,
	lcorrection: 1,
	enforce_smap: 1,
	rbugs: 0,
	noxy: 0,
	nopush: 0,
	freeze_latest: 0, // to test latest_calls numbers
	log_all: 0, // logs all incoming websocket calls
	friendly_fire: 1,
	fast_mlevels: 0,
	map_respawns: 0, // respawn at maps or where they define [05/12/18]
	low49_20xglobal: 1, // 20x global drops for <=49 level players [03/02/19]
	low49_200xgoo: 1,
	pve_safe_magiports: 1,
	instant_monster_attacks: 1, // #TODO: Consider dynamically sending target data instantly too
	drm_check: 1,
	all_roam: 0,
	all_smart: 1,
	prevent_external: 0, // for "test" / "hardcore"
	pvp_level_gap: 0, // have to be within 10 level to attack
};
var events = {
	// SEASONS
	holidayseason: false,
	lunarnewyear: false,
	valentines: false,
	pinkgoo: 0, // every N minutes - 60
	snowman: 20 * 60, // 1200 normally - 60 - at sprocess_game_data
	egghunt: 0, // every N minutes - 60
	// RANDOM
	halloween: true,
	goblin: false,
	goldenbat: 160000,
	cutebee: 960000,
	hide_and_seek: 0,
	// DAILIES
	goobrawl: false,
	crabxx: false,
	abtesting: false,
	// NIGHTLIES
	icegolem: false,
	franky: false,
};
var dailies = ["crabxx", "goobrawl", "abtesting"];
shuffle(dailies);
var nightlies = ["icegolem", "franky"];
shuffle(nightlies);
if (events.holidayseason) {
	events.snowman = 60;
}
if (events.valentines) {
	events.pinkgoo = 60;
}
TIMEO = {
	EU: 1,
	US: -5,
	ASIA: 7,
};
var perfc = {
	game_loop: {},
	instance_loop: {},
	instance_delay: {},
	cps: 0,
	sxyu: 0,
	game_loops: 0,
	instance_loops: 0,
	roams: 0,
	roam_ops: 0,
};
var instances = {};
// at first there were no instances, monsters were global
// instances improve performance and allow things like dynamic events, dungeons

var luckm = 1;
var xpm = 1;
var goldm = 1;
var buym = 1;

region = process.argv[process.argv.length - 3];
server_name = process.argv[process.argv.length - 2];
port = process.argv[process.argv.length - 1];

E.schedule.time_offset = TIMEO[region];

if (server_name == "HARDCORE") {
	gameplay = "hardcore";
	xpm = 2188;
	// luckm=500;
	goldm = 12000;
	is_pvp = true;
	variables.ip_limit = 1;
	variables.character_limit = 1;
	B.rip_time = -1;
	B.heal_multiplier = 0.6;
	B.sell_dist = 9999999 + 1000;
	events.golden_bat = 8000;
	B.arena_limit = 1;
	B.v = false;
	B.free_last_hits = true;
	mode.prevent_external = 1;
	mode.pvp_level_gap = 1;
} else if (server_name == "TEST") {
	gameplay = "test";
	is_pvp = true;
	variables.ip_limit = 5;
	variables.character_limit = 5;
	B.rip_time = -1;
	B.sell_dist = 9999999 + 1000;
	B.arena_limit = 1;
	B.rbugs = 1;
	mode.prevent_external = 1;
} else if (server_name == "DUNGEON") {
	gameplay = "dungeon";
	is_pvp = true;
	variables.ip_limit = 1;
	variables.character_limit = 1;
	B.start_map = observer_map = "d_e";
	B.free_last_hits = true;
	B.pause_instances = false;
	for (var name in events) {
		if (is_number(events[name])) {
			events[name] = (events[name] !== 0 && 9999999999) || 0;
		} else {
			events[name] = false;
		}
	}
} else {
	gameplay = "normal";
}

// B.u_boundary=12; B.u_vision=12; B["vision"]=[320,270]
// B.vision[0]*=100; B.vision[1]*=100;

if (server_name.startsWith("PVP") || server_name.startsWith("HARDCORE")) {
	is_pvp = true;
	// variables.ip_limit=2+1;
	// variables.character_limit=1+1;
	luckm *= 1.15;
	xpm *= 1.2;
	goldm *= 1.25;
}

// var secure_app=require('https').createServer(s_options,https_handler); #GTODO: Implement secure communications at one point

function init_game() {
	appengine_call(
		"create_server",
		{
			keyword: variables.keyword,
			port: port,
			region: region,
			name: server_name,
			pvp: is_pvp || "",
			gameplay: gameplay,
		},
		function (result) {
			try {
				if (result.exists) {
					return [console.log("Server Exists!"), process.exit()];
				}
				// console.log(result);
				server_id = result.id;
				server_auth = result.auth;
				server_name = result.name;
				server_log("Server Live: " + server_name + " " + server_id, 1);
				server_log("Node Version: " + process.version, 1);
				//server_log("Socket.IO Version: "+require("socket.io").version);
				S = result.data;
				G = result.game;
				server_log("Game Version: " + G.version, 1);
				D = result.dynamics;
				if (S) {
					init_server_data(S);
				}
				if (G) {
					sprocess_game_data();
				}
				try {
					app.listen(port);
					init_io();
					// app2.listen(parseInt(port)+40);
				} catch (e) {
					server.exists = true;
					server.started = true;
					log_trace("port", e);
					return shutdown_routine();
				}
				//create_instance("main2","main2");
				var start = new Date();
				if (gameplay == "normal" || gameplay == "hardcore" || gameplay == "test") {
					create_instance("main");
					create_instance("tunnel");
					create_instance("cave");
					create_instance("tavern");
					create_instance("resort_e");
					create_instance("resort");
					create_instance("mansion");
					create_instance("woffice");
					create_instance("halloween");
					create_instance("spookytown");
					if (gameplay == "normal") {
						create_instance("test");
					}
					create_instance("arena", "arena", { pvp: 1 });
					create_instance("bank");
					create_instance("bank_b");
					create_instance("bank_u");
					//create_instance("batcave","batcave");
					create_instance("winterland");
					create_instance("winter_inn");
					create_instance("winter_inn_rooms");
					create_instance("winter_cave");
					create_instance("winter_cove");
					create_instance("desertland");
					create_instance("level1");
					create_instance("level2");
					create_instance("level2n");
					create_instance("level2e");
					create_instance("level2s");
					create_instance("level2w");
					create_instance("level3");
					create_instance("level4");
					create_instance("cyberland");
					create_instance("hut");
					create_instance("mtunnel");
					create_instance("ship0");
					create_instance("goobrawl");
					create_instance("d_e");
					create_instance("d_g");
					create_instance("d_b1");
					create_instance("d_a1");
					create_instance("d_a2");
					server_bfs("crypt");
					server_bfs("winter_instance");
					server_bfs("tomb");
					server_bfs("dungeon0");
					server_bfs("cgallery");
				} else if (gameplay == "dungeon") {
					for (var name in G.maps) {
						if (G.maps[name].world == "dungeon") {
							create_instance(name);
						}
					}
				}
				create_instance("jail");
				console.log("Calculations took: " + mssince(start) + "ms");
				shuffle(hiding_places);
				init_tavern();
				init_server();
				server.started = true;
				server.live = true;
				server.last_update = new Date();
			} catch (e) {
				log_trace("init", e);
			}
		},
		function () {
			console.log("#X init_game's create_server call failed");
		},
	);
}

init_game();

function reload_server(to_broadcast, change) {
	appengine_call(
		"reload_server",
		{ keyword: variables.keyword, port: port, region: region, pvp: is_pvp || "", gameplay: gameplay },
		function (result) {
			try {
				G = result.game;
				D = result.dynamics;
				sprocess_game_data();
				prop_cache = {};
				if (to_broadcast) {
					broadcast("reloaded", { change: change || "" });
				}
			} catch (e) {
				broadcast("notice", { message: "Server Live Reload Failed" });
				log_trace("#X live_reload", e);
			}
		},
		function () {
			// setTimeout(init_game,1000);
			server_log("#X live_reload failed", 1);
			broadcast("notice", { message: "Live Reload Failed" });
		},
	);
}

function decode_http_data(data) {
	// #TODO: Find a better way to transfer data [28/09/17]
	var result = decodeURIComponent(data)
		.replace_all("u'", "'")
		.replace_all("'", '"')
		.replace_all("+", " ")
		.replace_all("%2B", "+");
	return result;
}

function parse_http_json(data) {
	var result = decode_http_data(data);
	var json = {};
	try {
		json = JSON.parse(result);
	} catch (e) {
		console.log("\n" + data);
		log_trace("parse_http_json", e);
	}
	return json;
}

function http_handler(request, response) {
	var body = [];
	request
		.on("error", function (err) {
			server_log("http_err: " + err, 1);
		})
		.on("data", function (chunk) {
			body.push(chunk);
		})
		.on("end", function () {
			body = Buffer.concat(body).toString();
			try {
				// server_log("http_handle's end");
				var url_parts = url.parse(request.url, true);
				var args = url_parts.query;
				var output = "";
				//console.log(body);
				(body || "").split("&").forEach(function (pv) {
					var pvp = pv.split("=");
					args[pvp[0]] = pvp[1];
				});
				if (args.checkin) {
					// console.log(JSON.stringify(args));
					// safe_search(request,"::1");
					// console.log(JSON.stringify(request.headers));
					console.log("start");
					req = request;
					console.log(req.connection ? req.connection.remoteAddress : null);
					console.log(req.socket ? req.socket.remoteAddress : null);
					console.log(req.connection && req.connection.socket ? req.connection.socket.remoteAddress : null);
					console.log(req.info ? req.info.remoteAddress : null);
					var ip = getClientIp(request);
					var id = id_to_id[args.id];
					// console.log(ip);
					if (players[id] && players[id].ipass == args.ipass) {
						players[id].last_ip = ip;
						players[id].last_ipass = new Date();
						// server_log("ipass for "+players[id].name);
					}
				}
				if (args.spass != variables.access_master) {
					response.writeHead(200);
					response.end(output);
					return;
				}
				if (args.aevent == "shutdown") {
					shutdown_routine();
				}
				if (args.aevent == "cupdate") {
					var id = id_to_id[args.id];
					server_log("cupdate for " + args.id + " socket.id: " + id);
					if (players[id]) {
						var player = players[id];
						player.cash = args.cash;
						if (args.ncash && args.ncash != "0") {
							player.socket.emit("game_log", { message: "Received " + args.ncash + " shells", color: colors.cash });
						}

						resend(player, "reopen+nc");
					}
					output = "yes";
				}
				if (args.aevent == "new_friend") {
					var id = id_to_id[args.id];
					server_log("new_friend for " + args.id + " socket.id: " + id, 1);
					if (players[id]) {
						var player = players[id];
						player.friends = parse_http_json(args.friends);
						player.socket.emit("friend", { event: "new", name: args.name, friends: player.friends });
						resend(player, "redata");
					}
					output = "yes";
				}
				if (args.aevent == "lost_friend") {
					var id = id_to_id[args.id];
					server_log("lost_friend for " + args.id + " socket.id: " + id, 1);
					if (players[id]) {
						var player = players[id];
						player.friends = parse_http_json(args.friends);
						player.socket.emit("friend", { event: "lost", friends: player.friends }); // ,name:args.name
						resend(player, "redata");
					}
					output = "yes";
				}
				if (args.aevent == "eval") {
					var data = parse_http_json(args.data);
					try {
						eval(decode_http_data(args.code));
					} catch (e) {
						console.log("\n" + args.code);
						log_trace("chttp_eval", e);
					}
					output = JSON.stringify(output);
				}
				response.writeHead(200);
				response.end(output);
			} catch (e) {
				log_trace("chttp_err", e);
			}
		});
}

function player_to_server(player, place) {
	var char = {};
	for (prop in player) {
		if (
			!in_arr(prop, [
				"auth",
				"last_sync",
				"socket",
				"character",
				"last_upush",
				"push",
				"last",
				"last_u",
				"width",
				"height",
				"u",
			])
		) {
			char[prop] = player[prop];
		}
	}
	if (place == "sync" && !Object.keys(player.q).length && player.type != "merchant") {
		delete char.p;
	} // ~20KB - too much [19/11/18]
	return char;
}

function player_to_client(player, stranger) {
	var data = {};
	[
		"hp",
		"max_hp",
		"mp",
		"max_mp",
		"xp",
		"attack",
		"heal",
		"frequency",
		"speed",
		"range",
		"armor",
		"resistance",
		"level",
		"party",
		"rip",
		"npc",
		"allow",
		"code",
		"afk",
		"target",
		"focus",
		"role",
		"s",
		"c",
		"q",
		"b",
		"age",
		"pdps",
		"id",
		"x",
		"y",
		"moving",
		"going_x",
		"going_y",
		"abs",
		"move_num",
		"angle",
		"cid",
		"guild",
		"team",
	].forEach(function (p) {
		// removed "vx","vy"
		if (player[p] !== undefined) {
			data[p] = player[p];
		}
	});
	["stand"].forEach(function (p) {
		if (player.p && player.p[p] !== undefined) {
			data[p] = player.p[p];
		}
	});
	if (player.afk == "code") {
		data.controller = player.controller;
	}
	if (player.rip && ((player.tcx && player.tcx.gravestone) || player.cx.gravestone)) {
		player.rip = (player.tcx && player.tcx.gravestone) || player.cx.gravestone;
	}
	data.skin = player.tskin || player.skin;
	data.cx = player.tcx || player.cx;
	data.slots = player.cslots;
	if (player.tp) {
		data.tp = true;
	}
	data.ctype = player.type;
	data.owner = (!player.private && player.owner) || "";

	if (player.is_npc) {
		// data.id="$"+data.id;
		data.name = player.name;
		if (player.direction !== undefined) {
			data.direction = player.direction;
			data.npc = player.npc;
		}
	}

	if (!stranger) {
		[
			"int",
			"str",
			"dex",
			"vit",
			"for",
			"mp_cost",
			"mp_reduction",
			"max_xp",
			"goldm",
			"xpm",
			"luckm",
			"map",
			"in",
			"isize",
			"esize",
			"gold",
			"cash",
			"targets",
			"m",
			"evasion",
			"miss",
			"reflection",
			"lifesteal",
			"manasteal",
			"rpiercing",
			"apiercing",
			"crit",
			"critdamage",
			"dreturn",
			"tax",
			"xrange",
			"pnresistance",
			"firesistance",
			"fzresistance",
			"phresistance",
			"stresistance",
			"incdmgamp",
			"stun",
			"blast",
			"explosion",
			"courage",
			"mcourage",
			"pcourage",
			"fear",
		].forEach(function (p) {
			//"vision",
			data[p] = player[p];
		});
		data.items = player.citems;
		if (player.user !== undefined) {
			data.user = player.cuser;
			if (player.user) {
				data.user.gold = player.user.gold;
			}
		}
		if (player.socket) {
			data.cc = get_call_cost(player);
		}
	}
	return data;
}

function monster_to_client(monster, events) {
	var data = {};
	var def = G.monsters[monster.type];
	[
		"speed",
		"hp",
		"mp",
		"max_mp",
		"attack",
		"xp",
		"frequency",
		"armor",
		"resistance",
		"1hp",
		"skin",
		"cooperative",
		"drops",
	].forEach(function (p) {
		//same array as game.js adopt_soft_properties
		if (p in monster && monster[p] != def[p]) {
			data[p] = monster[p];
		}
	});
	if (monster.max_hp != def.hp) {
		data.max_hp = monster.max_hp;
	}
	[
		"id",
		"x",
		"y",
		"moving",
		"going_x",
		"going_y",
		"abs",
		"move_num",
		"angle",
		"type",
		"cid",
		"target",
		"focus",
		"s",
	].forEach(function (p) {
		// removed "vx","vy" from both datasets [16/04/18]
		if (monster[p] !== undefined) {
			data[p] = monster[p];
		}
	});
	if (monster.level > 1) {
		data.level = monster.level;
	}
	if (monster.pet) {
		data.pet = true;
		data.owner = monster.owner;
		data.name = monster.name;
	}
	if (monster.trap) {
		data.trap = true;
		data.owner = monster.owner;
	}

	if (events && events.length) {
		data.events = events;
	}
	return data;
}

function player_to_summary(player) {
	var summary = {
		skin: player.tskin || player.skin,
		level: player.level,
		type: player.type,
		x: player.x,
		y: player.y,
		in: player.in,
		map: player.map,
		name: player.name,
		hp: player.hp,
		max_hp: player.max_hp,
	};
	if (player.rip) {
		summary.rip = (player.tcx && player.tcx.gravestone) || player.cx.gravestone || true;
	}
	summary.cx = player.tcx || player.cx || {};
	return summary;
}

function save_state(player) {
	player.state = {
		map: player.map,
		in: player.in,
		hp: player.hp,
		mp: player.mp,
		s: player.s,
		x: player.x,
		y: player.y,
		restored: false,
	};
}

function clean_slate(player) {
	restore_state(player);
	save_state(player);
	player.hp = player.max_hp;
	player.mp = player.max_mp;
	player.s = {};
	player.c = {};
}

function restore_state(player, dc) {
	if (player.state && !player.state.restored) {
		player.hp = player.state.hp;
		player.mp = player.state.mp;
		player.s = player.state.s;
		player.rip = false;
		if (player.state.rip) {
			player.rip = true;
		}
		if (dc) {
			player.map = player.state.map;
			player.in = player.state.in;
			player.x = player.state.x;
			player.y = player.state.y;
		}
		player.state.restored = true;
	}
	delete player.team;
	delete player.duel;
}

function party_to_client(oname) {
	var list = parties[oname];
	var party = {};
	var output = 0;
	var length = 0;
	var newbies = 0;
	var odps = {};
	var c = {};
	var add = 36000;
	calculate_party(oname);
	list.forEach(function (name) {
		var player = players[name_to_id[name]];
		var dps_multiplier = 1;
		if (!player) {
			return;
		}
		if (player.type == "merchant") {
			return;
		}
		if (player.type == "priest") {
			dps_multiplier = 1.36;
		}
		length += 1;
		if (player.level < 60) {
			newbies += 1;
		}
		output += player.pdps * dps_multiplier + add;
		odps[player.owner] = (odps[player.owner] || 0) + player.pdps * dps_multiplier + add;
		c[player.owner] = (c[player.owner] || 0) + 1;
	});
	list.forEach(function (name) {
		var player = players[name_to_id[name]];
		var dps_multiplier = 1;
		if (!player) {
			return;
		}
		if (player.type == "priest") {
			dps_multiplier = 1.36;
		}
		player.share = 0;
		if (!output) {
			// to handle an all merchant party
			player.share = 1.0 / (max(1, list.length) + EPS);
		} else if (player.type != "merchant") {
			player.share = odps[player.owner] / (c[player.owner] + EPS) / (output + EPS);
			player.share = min(1, player.share);
		}
		player.party_length = length;
		player.party_gold = 5;
		player.party_luck = newbies * 10;
		player.party_xp = [0, 0, 10, 16, 20, 24, 25, 30, 36, 40, 40, 40, 40][length] || 0;
		party[name] = {
			skin: player.tskin || player.skin,
			level: player.level,
			type: player.type,
			x: player.x,
			y: player.y,
			in: player.in,
			map: player.map,
			share: player.share,
			pdps: player.pdps,
			l: length,
			xp: player.party_xp,
			luck: player.party_luck,
			gold: player.party_gold,
		};
		if (player.rip) {
			party[name].rip = (player.tcx && player.tcx.gravestone) || player.cx.gravestone || true;
		}
		if (Object.keys(player.tcx || player.cx).length) {
			party[name].cx = player.tcx || player.cx;
		}
	});
	// git test
	return party;
}

function send_party_update(oname) {
	var party = party_to_client(oname);
	parties[oname].forEach(function (name) {
		var player = players[name_to_id[name]];
		if (!player) {
			console.log("#X party player not found: " + oname);
			leave_party(oname, { name: name });
			return;
		}
		players[name_to_id[name]].socket.emit("party_update", { list: parties[oname], party: party });
	});
}

function calculate_party(oname) {
	var list = parties[oname];
	list.forEach(function (name) {
		var player = players[name_to_id[name]];
		if (!player) {
			return;
		}
		if (player.type == "merchant") {
			player.party_weight = 0;
		}
		player.party_weight = 20;
	});
}

var stat_to_attr = {
	str: "str",
	int: "int",
	dex: "dex",
	vit: "vit",
	for: "for",
	armor: "armor",
	resistance: "resistance",
	pnresistance: "pnresistance",
	firesistance: "firesistance",
	fzresistance: "fzresistance",
	phresistance: "phresistance",
	stresistance: "stresistance",
	incdmgamp: "incdmgamp",
	stun: "stun",
	blast: "blast",
	explosion: "explosion",
	evasion: "evasion",
	cuteness: "cuteness",
	bling: "bling",
	dreturn: "dreturn",
	reflection: "reflection",
	crit: "crit",
	critdamage: "critdamage",
	miss: "miss",
	avoidance: "avoidance",
	hp: "max_hp",
	mp: "max_mp",
	speed: "speed",
	lifesteal: "lifesteal",
	manasteal: "manasteal",
	apiercing: "apiercing",
	rpiercing: "rpiercing",
	output: "output",
	attack: "a_attack",
	mp_cost: "a_mp_cost",
	mp_reduction: "mp_reduction",
	xp: "xxp",
	luck: "xluck",
	gold: "xgold",
	range: "range",
	courage: "courage",
	mcourage: "mcourage",
	pcourage: "pcourage",
};

function apply_stats(player, prop, args) {
	for (var stat in prop) {
		if (args && args.no_range && stat == "range") {
			continue;
		}
		if (stat_to_attr[stat]) {
			player[stat_to_attr[stat]] = player[stat_to_attr[stat]] + prop[stat];
		} else if (stat == "frequency") {
			player.frequency += prop[stat] / 100.0;
		}
	}
}

function calculate_player_stats(player) {
	if (player.is_npc) {
		return;
	}
	player.max_xp = G.levels[player.level + ""];
	var level_up = false;
	while (player.xp >= player.max_xp) {
		level_up = true;
		player.xp -= player.max_xp;
		player.level++;
		player.max_xp = G.levels[player.level + ""];
		player.hp = 0;
		achievement_logic_level(player);
	}
	if (level_up) {
		if (player.level >= 80) {
			realm_broadcast("server_message", { message: player.name + " is now level " + player.level, color: "#968CFA" });
		} else if (player.level >= 70) {
			broadcast("server_message", { message: player.name + " is now level " + player.level + "!", color: "#968CFA" });
		}
		xy_emit(player, "ui", { type: "level_up", name: player.name });
	}
	//	disappearing_text(player.socket,player,"LEVEL UP!",{xy:1,size:"huge",color:"#724A8F"});
	if (player.xp < 0) {
		player.xp = 0;
		player.warnings = (player.warnings || 0) + 1;
		if (player.warnings == 2) {
			console.log("'Your monster!' logged out ->");
			player.socket.emit("ui_log", "You monster!");
			player.socket.disconnect();
			return;
		}
	}
	var class_def = G.classes[player.type];
	var item_attack = 0;
	var the_date = new Date();
	if (!class_def) {
		class_def = G.classes.merchant;
	} // when npc's get resend't
	player.range = class_def.range;
	player.max_hp = class_def.hp;
	player.max_mp = class_def.mp;
	["stealth"].forEach(function (prop) {
		player[prop] = false;
	});
	[
		"a_mp_cost",
		"a_attack",
		"stones",
		"lifesteal",
		"manasteal",
		"incdmgamp",
		"mp_reduction",
		"stun",
		"blast",
		"explosion",
		"cuteness",
		"bling",
	].forEach(function (prop) {
		player[prop] = 0;
	});
	[
		"speed",
		"attack",
		"frequency",
		"mp_cost",
		"armor",
		"resistance",
		"apiercing",
		"rpiercing",
		"a",
		"aura",
		"evasion",
		"miss",
		"reflection",
		"crit",
		"critdamage",
		"dreturn",
		"computer",
		"xxp",
		"xluck",
		"xgold",
		"output",
		"courage",
		"mcourage",
		"pcourage",
		"pnresistance",
		"firesistance",
		"fzresistance",
		"phresistance",
		"stresistance",
	].forEach(function (prop) {
		player[prop] = class_def[prop] || 0;
	});
	if (!player.a) {
		player.a = {};
	} //abilities
	if (!player.aura) {
		player.aura = {};
	}
	if (player.paura) {
		for (var id in player.paura) {
			player.aura[id] = player.paura[id];
		}
	}
	for (stat in class_def.stats) {
		player[stat] = class_def.stats[stat] + player.level * class_def.lstats[stat];
		if (player.level > 40) {
			player[stat] += (player.level - 40) * class_def.lstats[stat];
		}
		if (player.level > 55) {
			player[stat] += (player.level - 55) * class_def.lstats[stat];
		}
		if (player.level > 65) {
			player[stat] += (player.level - 65) * class_def.lstats[stat];
		}
		if (player.level > 80) {
			player[stat] -= (player.level - 80) * class_def.lstats[stat];
		}
		player[stat] = floor(player[stat]);
	}
	if (!player.slots) {
		player.slots = {};
	}
	// players.citems[27]=null; //- to reproduce the bug
	while (player.items.length > 42 && !player.items[player.items.length - 1]) {
		player.items.splice(player.items.length - 1);
	}
	while (player.citems.length > 42 && !player.citems[player.citems.length - 1]) {
		player.citems.splice(player.citems.length - 1);
	}
	player.isize = 42;
	player.sets = {};
	player.esize = player.isize - player.items.length;
	player.xpm = player.goldm = player.luckm = 1;
	for (var i = 0; i < player.items.length; i++) {
		var current = player.items[i];
		if (!current) {
			player.esize++;
		} else if (current.name == "supercomputer") {
			player.tracker = player.computer = player.supercomputer = true;
		} else if (current.name == "computer") {
			player.computer = true;
		} else if (current.name == "tracker") {
			player.tracker = true;
		} else if (current.expires) {
			// &&!current.ex = ex=elixier
			if (the_date > current.expires) {
				player.items[i] = null;
				player.citems[i] = null;
			} else if (G.items[current.name].gain) {
				var prop = calculate_item_properties(current);
				player.stones++;
				player["x" + G.items[current.name].gain] = prop[G.items[current.name].gain];
			}
		}
	}
	player.monster_stats = {};
	if (player.tracker) {
		for (var name in G.monsters) {
			var mx = max(
				(player.p.stats.monsters[name] || 0) + (player.p.stats.monsters_diff[name] || 0),
				(player.max_stats.monsters[name] || [0, 0])[0],
			);
			if (!mx || !G.monsters[name].achievements) {
				continue;
			}
			G.monsters[name].achievements.forEach(function (def) {
				if (mx < def[0]) {
					return;
				}
				if (def[1] == "stat") {
					player.monster_stats[def[2]] = (player.monster_stats[def[2]] || 0) + def[3];
				}
			});
		}
	}
	character_slots.forEach(function (slot) {
		var current = player.slots[slot];
		if (!current) {
			return;
		}
		var def = G.items[current.name];
		if (!def) {
			console.log("#X Undefined item: " + current.name + " (" + slot + ")");
			return;
		}
		var prop = calculate_item_properties(current, { class: player.type, map: player.map });
		if (prop.class && !prop.class.includes(player.type)) {
			return;
		}

		apply_stats(player, prop, { no_range: slot == "offhand" && def.type == "weapon" });
		if (prop.attack) {
			if (slot == "offhand") {
				item_attack += prop.attack * 0.7;
			} else {
				item_attack += prop.attack;
			}
		}
		if (def.ability) {
			player.a[def.ability] = {
				attr0: ((player.a[def.ability] && player.a[def.ability].attr0) || 0) + prop.attr0,
				attr1: ((player.a[def.ability] && player.a[def.ability].attr1) || 0) + prop.attr1,
			};
		}
		if (def.aura) {
			player.aura[def.aura] = { attr0: prop.attr0 || 0, attr1: prop.attr1 || 0 };
		}
		if (slot == "mainhand") {
			apply_stats(player, class_def.doublehand[def.wtype] || class_def.mainhand[def.wtype] || {});
		}
		if (slot == "offhand") {
			apply_stats(
				player,
				class_def.offhand[def.wtype] ||
					class_def.offhand[def.type] || {
						no_range: !player.slots.mainhand,
					},
			);
		}
		if (prop.set) {
			player.sets[def.set] = (player.sets[def.set] || 0) + 1;
		}
	});
	for (var set in player.sets) {
		var prop = G.sets[set] && G.sets[set][player.sets[set]];
		if (!prop) {
			continue;
		}
		apply_stats(player, prop);
	}
	for (var condition in player.s) {
		var prop = G.conditions[condition];
		apply_stats(player, player.s[condition]);
		if (!prop) {
			continue;
		}
		apply_stats(player, prop);
	}
	apply_stats(player, player.monster_stats);
	if (
		player.slots.mainhand &&
		player.slots.offhand &&
		G.items[player.slots.mainhand.name].wtype == "stars" &&
		G.items[player.slots.offhand.name].wtype != "stars"
	) {
		item_attack /= 3.0;
	}
	if (player.slots.cape && player.slots.cape.name == "stealthcape") {
		player.stealth = true;
	}
	item_attack = max(item_attack, 5);
	if (player.type == "paladin") {
		player.attack += item_attack * (player.str / 20.0 + player.int / 40.0);
	} else {
		player.attack += item_attack * (player[class_def.main_stat] / 20.0);
	}
	player.attack += player.a_attack;
	if (player.type == "priest") {
		player.attack *= 1.6;
	}
	if (player.type == "warrior") {
		player.courage += round(player.str / 30);
	}
	if (player.type == "priest") {
		player.mcourage += round(player.int / 30);
	}
	if (player.type == "paladin") {
		player.pcourage += round(player.str / 30 + player.int / 30);
	}
	//console.log(player.speed)
	//player.speed+=player.dex/20.0+player.str/40.0+min(player.level,40)/4.0+max(0,min(player.level-40,20))/5.0+max(0,player.level-60)/7.0
	player.speed +=
		min(player.dex, 256) / 32.0 +
		min(player.str, 256) / 64.0 +
		min(player.level, 40) / 10.0 +
		max(0, min(player.level - 40, 20)) / 15.0 +
		max(0, min(86, player.level) - 60) / 16.0;

	player.aggro_diff = player.bling / 100 - player.cuteness / 100;

	//console.log(player.speed)
	//player.max_hp+=player.str*5+player.vit*player.level/2; //player.str*10.0+player.level*10+player.vit*25
	player.max_hp += player.str * 21 + player.vit * (48 + player.level / 3.0);
	player.max_hp = max(1, player.max_hp);
	player.max_mp += player.int * 15.0 + player.level * 5;
	//player.armor+=player.str/2.0;
	player.armor += min(player.str, 160) + max(0, player.str - 160) * 0.25;
	player.resistance += min(player.int, 180) + max(0, player.int - 180) * 0.25;
	player.frequency +=
		min(player.level, 80) / 164.0 +
		min(160, player.dex) / 640.0 +
		max(player.dex - 160, 0) / 925.0 +
		player.int / 1575.0; // 120 635 1275 is the original mix
	// player.frequency=9000;
	player.attack_ms = round(1000.0 / player.frequency);
	if (player.last_attack_ms && player.attack_ms != player.last_attack_ms) {
		// server_log("skill_timeout_correction: "+player.last_attack_ms+" to "+player.attack_ms+" timeout: "+(player.attack_ms-mssince(player.last.attack)))
		player.socket.emit("skill_timeout", {
			name: "attack",
			ms: player.attack_ms - mssince(player.last.attack),
			reason: "attack_ms",
		});
	}
	player.last_attack_ms = player.attack_ms;
	player.mp_cost +=
		min(player.level, 80) * (player.mp_cost / 10.0) +
		player.a_mp_cost +
		player.crit * 1.25 +
		player.lifesteal * 1.5 +
		player.manasteal / 5.0;
	if (player.damage_type == "physical") {
		player.mp_cost += player.apiercing / 15.0;
	} else {
		player.mp_cost += player.rpiercing / 15.0;
	}
	player.mp_cost = max(1, player.mp_cost);
	if (!player.hp && !player.rip) {
		player.hp = player.max_hp;
		player.mp = player.max_mp;
	} // used for level-ups
	if ((player.gold || 0) <= 0) {
		player.gold = 0;
	}
	player.heal = 0;
	if (player.type == "priest") {
		player.heal = player.attack;
	}
	player.output = max(5, player.output);
	if (player.output) {
		player.attack = (player.attack * player.output) / 100.0;
	}
	if (player.s.damage_received) {
		player.attack += (player.s.damage_received.amount * 4) / 100;
	}
	["attack", "heal", "hp", "mp", "max_hp", "max_mp", "range", "mp_cost", "resistance", "armor"].forEach(
		function (prop) {
			player[prop] = round(player[prop]);
		},
	);
	player.hp = max(0, min(player.hp, player.max_hp));
	player.mp = max(0, min(player.mp, player.max_mp));

	if (player.party && parties[player.party]) {
		if (player.party_xp) {
			player.xxp += player.party_xp;
		}
		if (player.party_luck) {
			player.xluck += player.party_luck;
		}
		if (player.party_gold) {
			player.xgold += player.party_gold;
		}
	}

	if (goldm != 1) {
		player.xgold += (goldm - 1) * 100.0;
		player.xluck += (luckm - 1) * 100.0;
		player.xxp += (xpm - 1) * 100.0;
	}
	player.luckm = 1 + player.xluck / 100.0;
	player.xpm = 1 + player.xxp / 100.0;
	player.goldm = 1 + player.xgold / 100.0;
	["luckm", "xpm", "goldm"].forEach(function (p) {
		player[p] = max(0.01, player[p]);
	});

	if (player.tskin == "konami") {
		player.range = 120;
		player.frequency += 0.25;
		player.goldm *= 0.25;
		player.luckm += 0.25;
	}

	if (player.s.invis) {
		player.speed = max(player.speed * 0.6, player.speed - 25);
		player.attack = round(player.attack * 1.25);
	}
	if (player.s.invincible) {
		player.attack = round(player.attack * 0.45);
	}
	if (player.s.dash) {
		player.speed = 500;
	}
	calculate_common_stats(player);

	player.tax =
		(player.level > 80 && 0.01) ||
		(player.level > 80 && 0.012) ||
		(player.level > 70 && 0.02) ||
		(player.level > 60 && 0.025) ||
		(player.level > 50 && 0.03) ||
		(player.level > 20 && 0.04) ||
		0.05;

	var excess = max(
		0,
		max(player.targets_p - player.courage, max(player.targets_m - player.mcourage, player.targets_u - player.pcourage)),
	);
	var sredux = [0, 20, 40, 70, 80, 90, 100];
	player.speed -= sredux[min(sredux.length - 1, excess)];
	if (excess > 2) {
		player.attack = round(player.attack * 0.2);
	} else if (excess > 1) {
		player.attack = round(player.attack * 0.4);
	} else if (excess) {
		player.attack = round(player.attack * 0.6);
	}
	player.fear = excess;

	if (player.map == "winterland") {
		player.speed *= 0.95;
	}

	if (player.p.stand || player.s.hardshell) {
		player.speed = 10;
	}
	player.evasion = min(50, player.evasion);
	player.reflection = min((player.s.reflection && 50) || 30, player.reflection);
	player.speed = min(player.speed, player.cruise || 200000);
	player.speed = round(max(5, player.speed));
	if (!player.gold && player.gold !== 0) {
		player.gold = 0;
		server_log("#X - GOLD BUG calculate", 1);
	}
	recalculate_vxy(player);
	perfc.cps += 1;
}

function calculate_common_stats(entity) {
	if (entity.s.poisoned) {
		entity.frequency *= 0.9;
	}
	if (entity.s.frozen) {
		entity.frequency *= 0.3;
		entity.speed -= 40;
	}
	if (entity.speed < 1) {
		entity.speed = 1;
	}
	if (entity.s.tangled) {
		entity.speed = min(entity.speed, 24);
	}
}

function calculate_monster_stats(monster) {
	var def = G.monsters[monster.type];
	["attack", "speed", "frequency", "armor", "resistance", "output", "incdmgamp", "avoidance"].forEach(function (p) {
		monster[p] = def[p] || 0;
	});
	monster.output = 100;
	if (monster.target || monster.focus) {
		monster.speed = G.monsters[monster.type].charge;
	}
	for (var name in monster.s) {
		// if(G.conditions[name])
		// {
		// 	for(var p in G.conditions[name])
		// 		if(p in monster)
		// 			monster[p]+=G.conditions[name][p];
		// }

		var prop = G.conditions[name];
		apply_stats(monster, monster.s[name]);
		if (!prop) {
			continue;
		}
		apply_stats(monster, prop);
	}
	monster.attack = round((monster.attack * monster.output) / 100.0);
	if (monster.focus && instances[monster.in].monsters[monster.focus]) {
		monster.speed = min(monster.speed, instances[monster.in].monsters[monster.focus].speed + 4);
	}
	if (monster.level > 1) {
		var att_mult = 0.125;
		var freq_mult = 0.034;
		var speed_mult = 0.24; // speed originally 0.34
		var mlevel = min(monster.level, 12);
		if (monster.map_def.grow) {
			att_mult = 0.05;
			freq_mult = 0.008;
			speed_mult = 0.16;
		}
		monster.attack = parseInt(monster.attack * (1 + mlevel * att_mult));
		monster.speed += mlevel * speed_mult;
		monster.frequency += mlevel * freq_mult;
	}
	if (E.schedule.night) {
		monster.speed = ceil(monster.speed * 0.7);
	}
	calculate_common_stats(monster);
	recalculate_vxy(monster);
}

function ccms(monster) {
	if (Object.keys(monster.s).length) {
		calculate_monster_stats(monster);
	}
}

function can_equip_item(player, item, slot) {
	var class_def = G.classes[player.type];
	if (!slot) {
		slot = item.type;
	}
	if (slot == "offhand" && item.type != "weapon") {
		slot = item.type;
	} //Easiest solution to the slot:"offhand" challenge [15/11/16]
	if (item.type == "tool") {
		slot = "mainhand";
	}
	if (item.type == "test" && slot != "test") {
		return slot;
	}
	if (
		!in_arr(item.type, [
			"helmet",
			"pants",
			"chest",
			"weapon",
			"amulet",
			"earring",
			"shoes",
			"gloves",
			"ring",
			"shield",
			"belt",
			"source",
			"orb",
			"quiver",
			"cape",
			"misc_offhand",
			"tool",
		])
	) {
		return "no";
	}
	if (slot != item.type && in_arr(item.type, ["shield", "source", "quiver", "misc_offhand"]) && slot != "offhand") {
		return "no";
	}
	if (in_arr(slot, ["weapon", "mainhand", "offhand", "tool"])) {
		if (
			slot == "weapon" &&
			player.slots.mainhand &&
			class_def.mainhand[G.items[player.slots.mainhand.name].wtype] &&
			!player.slots.offhand &&
			class_def.offhand[item.wtype]
		) {
			slot = "offhand";
		} else if (
			slot == "offhand" &&
			(!player.slots.mainhand ||
				(player.slots.mainhand && class_def.mainhand[G.items[player.slots.mainhand.name].wtype])) &&
			class_def.offhand[item.wtype]
		) {
			slot = "offhand";
		} else if (slot == "weapon" || slot == "mainhand") {
			if (class_def.doublehand[item.wtype] && !player.slots.offhand) {
			} else if (!class_def.mainhand[item.wtype]) {
				return "no";
			}
			slot = "mainhand";
		} else {
			return "no";
		}
	} else if (item.type == "shield" || item.type == "misc_offhand") {
		if (
			class_def.offhand[item.type] &&
			!(player.slots.mainhand && class_def.doublehand[G.items[player.slots.mainhand.name].wtype])
		) {
			slot = "offhand";
		} else {
			return "no";
		}
	} else if (item.type == "quiver") {
		if (
			class_def.offhand.quiver &&
			!(player.slots.mainhand && class_def.doublehand[G.items[player.slots.mainhand.name].wtype])
		) {
			slot = "offhand";
		} else {
			return "no";
		}
	} else if (item.type == "source") {
		if (
			class_def.offhand.source &&
			!(player.slots.mainhand && class_def.doublehand[G.items[player.slots.mainhand.name].wtype])
		) {
			slot = "offhand";
		} else {
			return "no";
		}
	} else if (item.type == "ring") {
		if (slot == "ring1" || slot == "ring2") {
		} else if (!player.slots["ring1"]) {
			slot = "ring1";
		} else {
			slot = "ring2";
		}
	} else if (item.type == "earring") {
		if (slot == "earring1" || slot == "earring2") {
		} else if (!player.slots["earring1"]) {
			slot = "earring1";
		} else {
			slot = "earring2";
		}
	} else if (slot != item.type) {
		return "no";
	}
	return slot;
}

function consume(player, num, quantity) {
	var available = player.items[num].q || 1;
	if (quantity > available) {
		exception = not_enough_items;
	}
	if (available == quantity) {
		player.items[num] = null;
		player.esize++;
	} else {
		player.items[num].q -= quantity;
	}
	player.citems[num] = cache_item(player.items[num]);
}

function consume_one(player, num) {
	consume(player, num, 1);
}

function consume_one_by_id(player, id) {
	for (var i = 0; i < player.items.length; i++) {
		if (player.items[i] && player.items[i].name == id) {
			consume_one(player, i);
			return true;
		}
	}
	return false;
}

function create_new_item(name, quantity) {
	var new_item = { name: name };
	if (G.items[name].s) {
		new_item.q = quantity || 1;
	}
	if (G.items[name].upgrade || G.items[name].compound) {
		new_item.level = 0;
	}
	return new_item;
}

function aadd_item(player, new_item) {
	// admin [24/06/23]
	add_item(player, new_item, { announce: false });
	reopen(player, "u+cid+reopen");
}

function add_item(player, new_item, args) {
	// # IMPORTANT: ALWAYS KEEP CAN_ADD_ITEM IN SYNC!
	var done = false;
	var num = 0;
	var a = false;
	if (!args) {
		args = {};
	}
	if (!new_item.name) {
		new_item = create_new_item(new_item, args.q || 1);
	}
	if (args.p) {
		new_item.p = args.p;
	}
	if (
		(args.m || args.r) &&
		((G.items[new_item.name].upgrade && Math.random() < 1.0 / 500) ||
			(G.items[new_item.name].compound && Math.random() < 1.0 / 20000))
	) {
		new_item.p = "shiny";
		a = true;
	}
	if (G.items[new_item.name].s) {
		for (var i = 0; i < player.items.length; i++) {
			var item = player.items[i];
			if (can_stack(item, new_item)) {
				if ((args.v && is_in_pvp(player, 1)) || new_item.v) {
					item.v = new Date();
				}
				if (new_item.m) {
					item.m = new_item.m;
				}
				item.q = parseInt((new_item.q || 1) + (item.q || 1)); // to fix the side-effects of not including parseInt on 'sell'/'buy' [22/02/18]
				player.citems[i] = cache_item(player.items[i]);
				done = true;
				num = i;
				break;
			}
		}
	}
	if (!new_item.oo) {
		new_item.oo = player.name;
	}
	if (!done) {
		for (var i = 0; i < player.items.length; i++) {
			var item = player.items[i];
			if (!item) {
				if (args.v && is_in_pvp(player, 1)) {
					new_item.v = new Date();
				}
				player.items[i] = new_item;
				player.citems[i] = cache_item(player.items[i]);
				player.esize--; // esize-- needed for concurrent party chest operations [18/10/18]
				done = true;
				num = i;
				break;
			}
		}
	}
	if (!done) {
		player.items.push(new_item);
		player.citems[player.items.length - 1] = cache_item(player.items[player.items.length - 1]);
		num = player.items.length - 1;
		player.esize--;
	}
	if (
		args.m &&
		player.s.mluck &&
		get_player(player.s.mluck.f) &&
		Math.random() <= 0.02 &&
		can_add_item(get_player(player.s.mluck.f), new_item.name)
	) {
		var mr = get_player(player.s.mluck.f);
		var item = create_new_item(new_item.name);
		item.m = player.name;
		if (new_item.data) {
			item.data = new_item.data;
		} // "cxjar"
		var num = add_item(mr, item, { m: 1 });
		mr.socket.emit("game_log", { message: "Found " + item_to_phrase(item), color: "#64B867" });
		xy_emit(mr, "ui", { type: "+M", name: mr.name, item: cache_item(item), num: num, cevent: "mluck", event: "mluck" });
		resend(mr, "reopen+nc+inv");
	}
	if (args.announce !== false && (a || (a_score[new_item.name] || 0) < G.items[new_item.name].a) && !player.stealth) {
		var event = G.items[new_item.name].event;
		var e_type = "server_found";
		var e_phrase = " found ";
		if (!args.found) {
			e_type = "server_received";
			e_phrase = " received ";
		}
		if (args.phrase) {
			e_type = "server_received";
			e_phrase = " " + args.phrase.toLowerCase() + " ";
		}
		broadcast("server_message", {
			message: player.name + e_phrase + item_to_phrase(new_item),
			color: "#85C76B",
			type: e_type,
			item: cache_item(new_item),
			name: player.name,
			event: event,
		});
		a_score[new_item.name] = (a_score[new_item.name] || 0) + 1.05;
	}
	if (args.log) {
		player.socket.emit("game_response", { response: "add_item", item: new_item });
	}
	return num;
}

function list_to_pseudo_items(list, type, add) {
	var items = [];
	var ex = {};
	if (!type || type == "multi") {
		list.forEach(function (el) {
			if (G.items[el[1]].s) {
				if (ex[el[1]]) {
					ex[el[1]].q += max(1, el[0]);
				} else {
					ex[el[1]] = { name: el[1], q: max(1, el[0]) };
					items.push(ex[el[1]]);
				}
			} else {
				items.push({ name: el[1], q: max(1, el[0]) });
			}
		});
	} else if (type == "chest") {
		list.forEach(function (name) {
			if (G.items[name].s) {
				if (ex[name]) {
					ex[name].q += 1;
				} else {
					ex[name] = create_new_item(name);
					items.push(ex[name]);
				}
			} else {
				items.push(create_new_item(name));
			}
		});
		(add || []).forEach(function (item) {
			items.push(item);
		});
	}
	return items;
}

function bank_add_item(player, slot, new_item) {
	var done = false;
	if (!new_item.name) {
		new_item = create_new_item(new_item);
	}
	if (new_item.q) {
		for (var i = 0; i < player.user[slot].length; i++) {
			var item = player.user[slot][i];
			if (can_stack(item, new_item)) {
				item.q = (item.q || 1) + (new_item.q || 1);
				player.cuser[slot][i] = cache_item(player.user[slot][i]);
				done = true;
				break;
			}
		}
	}
	if (!done) {
		for (var i = 0; i < player.user[slot].length; i++) {
			var item = player.user[slot][i];
			if (!item) {
				player.user[slot][i] = new_item;
				player.cuser[slot][i] = cache_item(player.user[slot][i]);
				done = true;
				break;
			}
		}
	}
	if (!done) {
		player.user[slot].push(new_item);
		player.cuser[slot][player.user[slot].length - 1] = cache_item(player.user[slot][player.user[slot].length - 1]);
	}
}

function drop_item_logic(drop, def, pvp) {
	var added = false;
	if (def[1] == "shells") {
		drop.cash += def[2];
	} else if (def[1] == "cxjar" || def[1] == "emotionjar") {
		var item = { name: def[1], q: def[2], data: def[3] };
		if (pvp) {
			item.v = new Date();
		}
		for (var i = 0; i < drop.items.length; i++) {
			if (can_stack(drop.items[i], item)) {
				drop.items[i].q += def[2];
				added = true;
				break;
			}
		}
		if (!added) {
			drop.items.push(item);
		}
	} else if (def[1] == "open") {
		chest_exchange(drop, def[2]);
	} else {
		var item = create_new_item(def[1]);
		if (pvp) {
			item.v = new Date();
		}
		for (var i = 0; i < drop.items.length; i++) {
			if (can_stack(drop.items[i], item)) {
				drop.items[i].q += 1;
				added = true;
				break;
			}
		}
		if (!added) {
			drop.items.push(item);
		}
	}
}

function drop_one_thing(player, items, args) {
	if (!args) {
		args = {};
	}
	var drop_id = randomStr(30);
	var chest = args.chest || "chest1";
	if (!is_array(items)) {
		items = [items];
	}
	drop = chests[drop_id] = { items: [], cash: 0 };
	for (var i = 0; i < items.length; i++) {
		if (is_string(items[i])) {
			drop_item_logic(drop, [1, items[i]], is_in_pvp(player, 1));
		}
	}
	drop.gold = args.gold || 0;
	drop.x = (args.x !== undefined && args.x) || player.x;
	drop.y = (args.y !== undefined && args.y) || player.y;
	drop.map = args.map || player.map;
	drop.date = new Date();
	player.socket.emit("drop", {
		x: drop.x,
		y: drop.y,
		items: drop.items.length,
		chest: chest,
		id: drop_id,
		map: drop.map,
		owners: [player.owner],
	});
}

function drop_something(player, monster, share) {
	if (monster.pet || monster.trap) {
		return;
	}
	achievement_logic_monster_kill(player, monster);
	share = (share === undefined && 1) || share || 0;
	// console.log("share: "+share);
	var drop_id = randomStr(30);
	var drop;
	var chest = "chest3";
	var hp_mult = 1;
	var drop_norm = 1000;
	var global_mult = monster.mult;
	var monster_mult = monster.mult; // originally: G.maps[player.map] && G.maps[player.map].drop_norm [31/01/18]
	var GOLD = D.monster_gold[monster.type];
	if (B.use_pack_golds && monster.gold) {
		GOLD = monster.gold;
	}
	if (drop_norm) {
		hp_mult = monster.max_hp / drop_norm;
	}

	drop = chests[drop_id] = { items: [], cash: 0 };
	drop.gold =
		round(1 + GOLD * D.drops.gold.base * share + Math.random() * GOLD * D.drops.gold.random * share) *
			monster.level *
			monster.mult || 0; // previously 0.75
	if (monster.extra_gold) {
		drop.egold = (drop.egold || 0) + max(0, monster.extra_gold);
	}
	if (monster.outgoing) {
		drop.egold =
			(drop.egold || 0) +
			min(
				monster.outgoing * B.m_outgoing_gmult,
				G.monsters[monster.type].hp * 0.048 * (gameplay == "hardcore" ? 50 : 1),
			);
	}
	if (drop.egold) {
		drop.egold *= share;
	}
	if (monster.difficulty === 0) {
		drop.gold = drop.egold = 0;
	}
	drop.x = monster.x;
	drop.y = monster.y;
	drop.map = monster.map;
	if (monster["global"]) {
		drop.x = player.x;
		drop.y = player.y;
		drop.map = player.map;
	}
	// if(player.level<50 && mode.low49_20xglobal) global_mult=20; - Commented out after SpadarFaar discovered/used it [16/04/19]
	// console.log(global_mult);
	if (monster["1hp"]) {
		global_mult *= 1000;
	}
	if (D.drops.maps.global_static && player.tskin != "konami" && B.global_drops) {
		D.drops.maps.global_static.forEach(function (item) {
			if (Math.random() / share / player.luckm / monster.luckx / global_mult < item[0] || mode.drop_all) {
				drop_item_logic(drop, item, is_in_pvp(player, 1));
			}
		});
	}
	if (D.drops.maps.global && player.tskin != "konami" && B.global_drops) {
		D.drops.maps.global.forEach(function (item) {
			if (Math.random() / share / player.luckm / hp_mult / monster.luckx / global_mult < item[0] || mode.drop_all) {
				drop_item_logic(drop, item, is_in_pvp(player, 1));
			}
		});
	}
	if (D.drops.maps[monster.map] && player.tskin != "konami") {
		D.drops.maps[monster.map].forEach(function (item) {
			if (Math.random() / share / player.luckm / hp_mult / monster.luckx < item[0] || mode.drop_all) {
				drop_item_logic(drop, item, is_in_pvp(player, 1));
			}
		});
	}
	// if(player.level<50 && monster.type=="goo" && mode.low49_200xgoo) monster_mult=200;
	if (D.drops.monsters[monster.type] && player.tskin != "konami") {
		D.drops.monsters[monster.type].forEach(function (item) {
			if (
				((!monster.temp || item[0] > 0.00001) &&
					Math.random() / share / player.luckm / monster.level / monster_mult < item[0]) ||
				mode.drop_all
			) {
				// /hp_mult - removed [13/07/18]
				drop_item_logic(drop, item, is_in_pvp(player, 1));
			}
		});
	}
	if (monster.drops) {
		monster.drops.forEach(function (item) {
			if (
				((!monster.temp || item[0] > 0.00001) &&
					Math.random() / share / player.luckm / monster.level / monster_mult < item[0]) ||
				mode.drop_all
			) {
				// /hp_mult - removed [13/07/18]
				drop_item_logic(drop, item, is_in_pvp(player, 1));
			}
		});
	}
	if (player.tskin == "konami") {
		D.drops.konami.forEach(function (item) {
			if (Math.random() / share / player.luckm / monster.level < item[0] || mode.drop_all) {
				drop_item_logic(drop, item, is_in_pvp(player, 1));
			}
		});
	}
	if (player.p.first && !player.p.first_drop) {
		player.p.first_drop = true;
		drop.gold += 100000;
		drop.items.push(create_new_item("ringsj"));
		drop.items.push(create_new_item("ringsj"));
		drop.items.push(create_new_item("ringsj"));
		drop.items.push(create_new_item("hpbelt"));
		drop.items.push(create_new_item("gem0"));
	}
	if (Math.random() < D.drops.gold.x10) {
		drop.gold *= 10;
		chest = "chest4";
	} // previously 12
	if (Math.random() < D.drops.gold.x50) {
		drop.gold *= 50;
		chest = "chest5";
	} // previously 200
	if (drop.items.length || drop.cash) {
		chest = "chest6";
	}
	drop.date = new Date();
	if (player.party) {
		var owners = [];
		parties[player.party].forEach(function (name) {
			var current = players[name_to_id[name]];
			if (current && !owners.includes(current.owner)) {
				owners.push(current.owner);
			}
		});
		party_emit(
			player.party,
			"drop",
			{
				x: drop.x,
				y: drop.y,
				items: drop.items.length,
				chest: chest,
				id: drop_id,
				party: player.party,
				map: drop.map,
				owners: owners,
			},
			{ instance: player.in },
		);
	} else {
		player.socket.emit("drop", {
			x: drop.x,
			y: drop.y,
			items: drop.items.length,
			chest: chest,
			id: drop_id,
			map: drop.map,
			owners: [player.owner],
		});
	}
}

function drop_something_hardcore(player, target) {
	var drop_id = randomStr(30);
	var drop;
	drop = chests[drop_id] = { items: [], pvp_items: [], cash: 0 };
	drop.gold = 99;
	drop.x = target.x;
	drop.y = target.y + 10;
	drop.map = target.map;

	target.slots.elixir = target.cslots.elixir = null;

	for (var name in target.slots) {
		if (target.slots[name] && !target.slots[name].b) {
			var prob = 0.1;
			if (name == "mainhand" || name == "offhand") {
				prob = 0.05;
			}
			if (Math.random() < prob) {
				drop.pvp_items.push(target.slots[name]);
				target.slots[name] = target.cslots[name] = null;
			}
		}
	}

	for (var i = 0; i < 42; i++) {
		if (target.items[i]) {
			if (Math.random() < 0.2) {
				drop.pvp_items.push(target.items[i]);
				target.items[i] = target.citems[i] = null;
			} else if (Math.random() < 0.05) {
				target.items[i] = target.citems[i] = null;
			}
		}
	}

	drop.date = new Date();

	if (!drop.pvp_items.length) {
		delete chests[drop_id];
		return;
	}

	if (player.party) {
		var owners = [];
		parties[player.party].forEach(function (name) {
			var current = players[name_to_id[name]];
			if (current && !owners.includes(current.owner)) {
				owners.push(current.owner);
			}
		});
		party_emit(
			player.party,
			"drop",
			{
				x: drop.x,
				y: drop.y,
				items: drop.pvp_items.length,
				chest: "chest8",
				id: drop_id,
				party: player.party,
				map: target.map,
				owners: owners,
			},
			{ instance: player.in },
		);
	} else {
		player.socket.emit("drop", {
			x: drop.x,
			y: drop.y,
			items: drop.pvp_items.length,
			chest: "chest8",
			id: drop_id,
			map: target.map,
			owners: [player.owner],
		});
	}
}

function drop_something_pvp(player, target) {
	var drop_id = randomStr(30);
	var drop;
	drop = chests[drop_id] = { items: [], pvp_items: [], cash: 0, pvp: true };
	drop.gold = 0;
	drop.x = target.x;
	drop.y = target.y + 10;
	drop.map = target.map;

	for (var name in target.slots) {
		if (target.slots[name] && target.slots[name].v && !target.slots[name].b) {
			var prob = 0.5;
			if (name == "mainhand" || name == "offhand") {
				prob = 0.3;
			}
			if (Math.random() < prob) {
				drop.pvp_items.push(target.slots[name]);
				target.slots[name] = target.cslots[name] = null;
			}
		}
	}

	for (var i = 0; i < 42; i++) {
		if (target.items[i] && target.items[i].v) {
			var prob = (target.items[i].q && 0.5) || 0.8;
			if (Math.random() < prob) {
				drop.pvp_items.push(target.items[i]);
				target.items[i] = target.citems[i] = null;
			}
			// else if(Math.random()<0.05) target.items[i]=target.citems[i]=null;
		}
	}

	drop.date = new Date();

	if (!drop.pvp_items.length) {
		delete chests[drop_id];
		return;
	}

	if (player.party) {
		var owners = [];
		parties[player.party].forEach(function (name) {
			var current = players[name_to_id[name]];
			if (current && !owners.includes(current.owner)) {
				owners.push(current.owner);
			}
		});
		party_emit(
			player.party,
			"drop",
			{
				x: drop.x,
				y: drop.y,
				items: drop.pvp_items.length,
				chest: "chest8",
				id: drop_id,
				party: player.party,
				map: target.map,
				owners: owners,
			},
			{ instance: player.in },
		);
	} else {
		player.socket.emit("drop", {
			x: drop.x,
			y: drop.y,
			items: drop.pvp_items.length,
			chest: "chest8",
			id: drop_id,
			map: target.map,
			owners: [player.owner],
		});
	}
}

function monster_hunt_logic(player, monster) {
	var target = monster;
	if (!player.s.monsterhunt || player.s.monsterhunt.sn != region + " " + server_name) {
		return;
	}
	if (player.s.monsterhunt.id == monster.type && player.s.monsterhunt.c) {
		player.s.monsterhunt.c--;
	}
	if (target.level == 1 && player.s.monsterhunt.id == target.type && player.s.monsterhunt.dl) {
		player.s.monsterhunt.dl = false;
		get_monsters(player.s.monsterhunt.id).forEach(function (m) {
			if (!player.s.monsterhunt.dl && m.level > 1) {
				// && !m.target - it was possible to keep a high level monsters aggroed and abuse the system [21/07/23]
				player.s.monsterhunt.dl = true;
				level_monster(m, { delevel: true });
			}
		});
	}
}

function calculate_monster_score(player, monster, share) {
	var score = min(1, monster.mult * 2.2);
	var divider = 1;
	if (!share) {
		share = 0;
	}
	if (monster.cooperative) {
		divider = 2;
	}
	for (var id in players) {
		var current = players[id];
		if (current.id == player.id) {
			continue;
		}
		if (current.owner == player.owner && current.type == "merchant" && simple_distance(current, player) < 600) {
			score -= 0.2 / divider;
		}
		if (
			current.party &&
			current.party == player.party &&
			current.type == "merchant" &&
			simple_distance(current, player) < 600
		) {
			score -= 0.1 / divider;
		} else if (
			current.owner == player.owner &&
			current.party == player.party &&
			simple_distance(current, player) < 600 &&
			current.type != "merchant"
		) {
			score += 0.3 / divider;
		} else if (
			current.owner == player.owner &&
			current.party &&
			current.party == player.party &&
			current.type != "merchant"
		) {
			score += 0.3 / divider;
		} // originally 0.25
	}
	if (simple_distance(player, monster) > 600 && share < 0.01) {
		score -= 0.3 / divider;
	}
	if (player.type == "merchant" && player.party) {
		score /= 2;
	}
	if (score < 0) {
		score = 0;
	}
	if (gameplay == "hardcore") {
		score *= 10000;
	}
	return score;
}

function issue_monster_awards(monster) {
	var total = 0.1;
	for (var name in monster.points) {
		var current = players[name_to_id[name]];
		if (current) {
			//  && current.map==monster.map
			total += max(0, monster.points[name]);
		}
	}
	for (var name in monster.points) {
		var current = players[name_to_id[name]];
		var share = max(0, monster.points[name]) / total;
		if (current && share > 0.0025) {
			//  && current.map==monster.map
			if (monster.rbuff && G.conditions[monster.rbuff]) {
				current.s[monster.rbuff] = { ms: G.conditions[monster.rbuff].duration };
			}
			if (monster.cbuff) {
				for (var i = 0; i < monster.cbuff.length; i++) {
					if (current.level <= monster.cbuff[i][0] && G.conditions[monster.cbuff[i][1]]) {
						current.s[monster.cbuff[i][1]] = { ms: G.conditions[monster.cbuff[i][1]].duration };
						break;
					}
				}
			}
			if (G.monsters[monster.type]["1hp"]) {
				drop_something(current, monster);
			} else {
				drop_something(current, monster, share);
			}
			var score = calculate_monster_score(current, monster, share);
			current.p.stats.monsters[monster.type] = (current.p.stats.monsters[monster.type] || 0) + 1;
			current.p.stats.monsters_diff[monster.type] = (current.p.stats.monsters_diff[monster.type] || 0) + (score - 1);
			monster_hunt_logic(current, monster, share);
			if (current.type == "merchant") {
				continue;
			}
			current.xp += round(monster.xp * share * current.xpm);
			if (current.t) {
				current.t.xp += round(monster.xp * share * current.xpm);
			}
			delete current.s.coop;
			resend(current, "u+cid");
		}
	}
}

function issue_monster_award(monster) {
	if (monster.cooperative) {
		return issue_monster_awards(monster);
	}
	var player = players[name_to_id[monster.target]];
	if (!player) {
		return;
	}
	// if(gameplay=="test" && player.level<80) player.level+=1;
	stats.kills[monster.type]++;
	drop_something(player, monster);
	if (!player.party) {
		if (monster.rbuff && G.conditions[monster.rbuff]) {
			player.s[monster.rbuff] = { ms: G.conditions[monster.rbuff].duration };
		}
		if (monster.cbuff) {
			for (var i = 0; i < monster.cbuff.length; i++) {
				if (player.level <= monster.cbuff[i][0] && G.conditions[monster.cbuff[i][1]]) {
					player.s[monster.cbuff[i][1]] = { ms: G.conditions[monster.cbuff[i][1]].duration };
					break;
				}
			}
		}
		var score = calculate_monster_score(player, monster);
		player.p.stats.monsters[monster.type] = (player.p.stats.monsters[monster.type] || 0) + 1;
		player.p.stats.monsters_diff[monster.type] = (player.p.stats.monsters_diff[monster.type] || 0) + (score - 1);
		monster_hunt_logic(player, monster);
		if (player.type == "merchant") {
			return;
		}
		player.xp += monster.xp * player.xpm * monster.mult;
		if (player.t) {
			player.t.xp += monster.xp * player.xpm * monster.mult;
		}
		player.cid++;
		player.u = true;
		calculate_player_stats(player);
	} else {
		var xp = monster.xp;
		// xp*=[1,1,0.70,0.5,0.4,0.32,0.26,0.24,0.24,0.24,0.24,0.24][parties[player.party].length];
		// original: [1,1,0.8,0.7,0.65,0.5,0.4,0.3,0.3,0.3,0.3,0.3]
		// xp=round(xp);
		parties[player.party].forEach(function (name) {
			var current = players[name_to_id[name]];
			var cxp = round(xp * current.xpm * current.share);
			if (monster.rbuff && G.conditions[monster.rbuff]) {
				current.s[monster.rbuff] = { ms: G.conditions[monster.rbuff].duration };
			}
			var score = calculate_monster_score(current, monster);
			current.p.stats.monsters[monster.type] = (current.p.stats.monsters[monster.type] || 0) + 1;
			current.p.stats.monsters_diff[monster.type] = (current.p.stats.monsters_diff[monster.type] || 0) + (score - 1);
			monster_hunt_logic(current, monster);
			if (current.type == "merchant") {
				return;
			}
			current.xp += cxp * monster.mult;
			if (current.t) {
				current.t.xp += cxp * monster.mult;
			}
			current.cid++;
			current.u = true;
			calculate_player_stats(current);
			if (current != player) {
				current.socket.emit("player", player_to_client(current));
			}
			// current.socket.emit("game_log",{message:xp+" XP",color:"#416F3A"});
			disappearing_text(current.socket, current, "+" + cxp, {
				map: current.map,
				color: "#753D8C",
				size: "large",
				nv: 1,
			}); //party:player.party, - better send it to individuals and multiply on client with a setting [19/08/16]
		});
	}
}

function kill_monster(attacker, target) {
	if (target.dead) {
		return;
	} // [04/02/23]
	var no_decrease = false;
	if (attacker) {
		if (!attacker.party) {
			attacker.socket.emit("game_log", "You " + killed_message(target.type));
		} // tut("killagoo") on game.js
		else {
			party_emit(attacker.party, "game_log", attacker.name + " " + killed_message(target.type));
		}
		if (B.free_last_hits && target.target && target.target != attacker.name) {
			stop_pursuit(target, { force: true, cause: "kill_monster call" });
		}
		if (!target.target) {
			target_player(target, attacker, 1);
			no_decrease = true;
		}
	}
	issue_monster_award(target);
	remove_monster(target, { no_decrease: no_decrease });
}

function player_rip_logic(player) {
	if (!player.rip && player.hp <= 0) {
		defeat_player(player);
		rip(player);
	}
}

function pwn_routine(victor, target) {
	issue_player_award(victor, target);
	rip(target);
	instance_emit(target.in, "server_message", {
		message: victor.name + " pwned " + target.name,
		color: (victor.team && colors[victor.team]) || "gray",
	});
	if (target.map == "arena") {
		xy_emit(npcs.pvp, "chat_log", { owner: npcs.pvp.name, message: victor.name + " pwned " + target.name, id: "pvp" });
	}
}

function issue_player_award(attacker, target) {
	if (attacker.map == "duelland") {
		if (target.duel) {
			duel_defeat(target);
		}
		return;
	}
	if (attacker.map == "abtesting" && attacker.team != target.team) {
		if (E.abtesting) {
			E.abtesting[attacker.team]++;
			item_achievement_increment(attacker, attacker.slots.orb, "abtesting");
			// instance_emit(attacker.map,"game_event",{name:"ab_score",A:E.abtesting.A,B:E.abtesting.B,win:attacker.name,lose:target.name,color:attacker.team});
			broadcast_e();
		}
		return;
	}
	var lost_xp = floor(min(max((target.max_xp * 0.01) / 10, (target.xp * 0.02) / 10), target.xp));

	var lost_gold = 100;
	var gain_gold = 100;
	if (target.level >= 10) {
		lost_gold = 1000;
	}
	if (target.level >= 20) {
		lost_gold = 5000;
	}
	if (target.level >= 30) {
		lost_gold = 12500;
	}
	if (target.level >= 40) {
		lost_gold = 25000;
	}
	if (target.level >= 50) {
		lost_gold = 50000;
	}
	if (target.level >= 55) {
		lost_gold = 75000;
	}
	if (target.level >= 60) {
		lost_gold = 125000;
	}
	if (target.level >= 65) {
		lost_gold = 250000;
	}
	if (target.level >= 70) {
		lost_gold = 500000;
	}
	if (target.level >= 75) {
		lost_gold = 1000000;
	}

	lost_gold = min(lost_gold, max(attacker.gold, 10000) * 4) || 0;
	lost_xp = round(min(lost_xp, max(attacker.xp / 15.0, 50000))) || 0;

	if (G.maps[attacker.map].safe_pvp && !is_pvp) {
		lost_gold = 0;
		lost_xp = 0;
	}

	if (gameplay == "hardcore") {
		lost_gold = round(target.gold * 0.8);
		lost_xp = target.xp;
		for (var i = 1; i <= B.hlevel_loss; i++) {
			if (target.level - i > 0) {
				lost_xp += G.levels[target.level - i + ""];
			}
		}
		target.level = max(1, target.level - B.hlevel_loss);
	}

	lost_gold = min(target.gold, lost_gold);
	gain_gold = round(lost_gold * 0.9);

	if (target.type == "merchant") {
		lost_xp = 0;
	}
	if (gameplay != "hardcore" && gameplay != "test" && is_same(attacker, target, 1)) {
		lost_gold = gain_gold = 0;
		lost_xp = 0;
	}

	if (!is_same(attacker, target, 1)) {
		attacker.kills++;
	}

	if (mode.log_pvp) {
		appengine_log("pvp", attacker.name + " pwned " + target.name + " For " + lost_gold + " Gold " + lost_xp + " XP");
	}
	pwns[pend++ % 200] = [attacker.name, target.name];

	target.socket.emit("game_log", { message: "Slain by " + attacker.name, color: "#F12F02" });
	var lost_shells = 0;
	var psize = 1;
	if (lost_xp) {
		for (var i = 0; i < target.isize; i++) {
			if (target.items[i] && target.items[i].name == "xptome") {
				lost_shells = 2;
				lost_xp = floor(lost_xp / 50);
				consume_one(target, i);
				target.to_reopen = true;
				target.socket.emit("game_log", { message: "A tome fades away", color: "#B5C09C" });
				break;
			}
		}
	}

	target.gold -= lost_gold;
	target.xp -= lost_xp;
	if (target.xp < 0) {
		target.xp = 0;
	}
	target.socket.emit("game_log", "Lost " + to_pretty_num(lost_gold) + " gold");
	target.socket.emit("game_log", "Lost " + to_pretty_num(lost_xp) + " experience");
	target.socket.emit("disappearing_text", {
		message: "-" + lost_xp,
		x: target.x,
		y: target.y - 30,
		args: { color: colors.party_xp },
	});

	if (gameplay == "hardcore") {
		drop_something_hardcore(attacker, target);
	}
	if (is_in_pvp(target)) {
		drop_something_pvp(attacker, target);
	}

	if (!attacker.party) {
		if (attacker.type == "merchant") {
			lost_xp = 0;
		}
		attacker.gold += gain_gold;
		attacker.xp += round(lost_xp * 0.95);
		attacker.socket.emit("game_log", { message: "Pwned " + target.name, color: "#67C051" });
		attacker.socket.emit("game_log", "Looted " + to_pretty_num(gain_gold) + " gold");
		attacker.socket.emit("disappearing_text", {
			message: "+" + gain_gold,
			x: target.x,
			y: target.y - 40,
			args: { color: "+gold", size: "large" },
		});
		attacker.socket.emit("game_log", "Gained " + to_pretty_num(round(lost_xp * 0.95)) + " experience");
		attacker.socket.emit("disappearing_text", {
			message: "+" + lost_xp,
			x: target.x,
			y: target.y - 30,
			args: { color: colors.party_xp },
		});
		if (lost_shells) {
			add_shells(attacker, lost_shells, "xptome");
		}
	} else {
		var name = attacker.name;
		lost_xp = floor((lost_xp * 0.92) / parties[attacker.party].length);
		gain_gold = floor(gain_gold / parties[attacker.party].length);
		if (lost_shells) {
			add_shells(attacker, lost_shells, "xptome");
		}
		// ,lost_shells=ceil(lost_shells/parties[attacker.party].length)
		parties[attacker.party].forEach(function (a_name) {
			var attacker = players[name_to_id[a_name]];
			attacker.gold += gain_gold;
			if (attacker.type != "merchant") {
				attacker.xp += lost_xp;
			}
			attacker.socket.emit("game_log", { message: name + " pwned " + target.name, color: "#67C051" });
			attacker.socket.emit("game_log", "Looted " + to_pretty_num(gain_gold) + " gold");
			attacker.socket.emit("disappearing_text", {
				message: "+" + gain_gold,
				x: target.x,
				y: target.y - 40,
				args: { color: "+gold", size: "large" },
			});
			if (attacker.type != "merchant") {
				attacker.socket.emit("game_log", "Gained " + to_pretty_num(lost_xp) + " experience");
				attacker.socket.emit("disappearing_text", {
					message: "+" + lost_xp,
					x: target.x,
					y: target.y - 30,
					args: { color: colors.party_xp },
				});
			}
		});
	}
}

function commence_attack(attacker, target, atype) {
	var attack = attacker.attack;
	var mp_cost = 0;
	var info = {
		apiercing: 0,
		damage_type: attacker.damage_type,
		heal: false,
		lines: true,
		positive: false,
		first_attack: 0,
		procs: false,
		conditions: [],
	}; // server projectile

	if (!G.skills[atype].hostile) {
		info.positive = true;
	}

	// TARGET CHANGE
	if (attacker.is_player) {
		attacker.target = target.id;
	}

	// FAILURE SCENARIOS
	if (
		attacker.type == "merchant" &&
		!G.skills[atype].merchant_use &&
		!(atype == "attack" && attacker.slots.mainhand && G.items[attacker.slots.mainhand.name].wtype == "dartgun")
	) {
		attacker.socket.emit("game_response", { response: "attack_failed", id: target.id });
		return { failed: true, reason: "merchant", place: atype, id: target.id };
	}
	if (
		mode.pvp_level_gap &&
		attacker.is_player &&
		target.is_player &&
		!info.positive &&
		abs(attacker.level - target.level) > 10
	) {
		attacker.socket.emit("game_response", { response: "attack_failed", id: target.id, reason: "level" });
		return { failed: true, reason: "level_gap", place: atype, id: target.id };
	}

	var dist = distance(attacker, target);
	var range = 0;
	var def = { hid: attacker.id, source: atype, projectile: null };

	// PROJECTILE LOGIC
	if (attacker.is_monster) {
		def.projectile = G.monsters[attacker.type].projectile || "stone";
	}
	if (attacker.is_player && G.classes[attacker.type].projectile) {
		def.projectile = G.classes[attacker.type].projectile;
	}
	if (attacker.projectile) {
		def.projectile = attacker.projectile;
	}
	if (attacker.slots && attacker.slots.mainhand && G.items[attacker.slots.mainhand.name].projectile) {
		def.projectile = G.items[attacker.slots.mainhand.name].projectile;
	}
	if (attacker.tskin == "konami") {
		def.projectile = "stone_k";
	}
	if ((atype != "attack" || !def.projectile || atype == "heal") && G.skills[atype].projectile) {
		def.projectile = G.skills[atype].projectile;
	}

	// DAMAGE TYPE LOGIC
	if (attacker.is_monster && G.monsters[attacker.type].damage_type) {
		info.damage_type = G.monsters[attacker.type].damage_type;
	}
	if (attacker.is_player && G.classes[attacker.type].damage_type) {
		info.damage_type = G.classes[attacker.type].damage_type;
	}
	if (attacker.is_player && attacker.slots.mainhand && G.items[attacker.slots.mainhand.name].damage_type) {
		info.damage_type = G.items[attacker.slots.mainhand.name].damage_type;
	}
	if (atype != "attack" && G.skills[atype].damage_type) {
		info.damage_type = G.skills[atype].damage_type;
	}

	// PROCS
	if (!attacker.is_player || G.skills[atype].procs) {
		info.procs = true;
	}

	// HEAL / POSITIVE
	if (
		G.skills[atype].heal ||
		(attacker.is_player && attacker.slots.mainhand && attacker.slots.mainhand.name == "cupid")
	) {
		info.heal = true;
		info.positive = true;
	}

	if ((attacker.is_player && target.is_player && !is_in_pvp(target, true) && !info.positive) || target.npc) {
		attacker.socket.emit("game_response", { response: "attack_failed", id: target.id });
		return { failed: true, reason: "no_pvp", place: atype, id: target.id };
	}

	// COMMON RANGE CHECKS
	if (G.skills[atype].use_range) {
		range = attacker.range;
	}
	if (G.skills[atype].range) {
		range = G.skills[atype].range;
	}

	// DAMAGE
	if (G.skills[atype].damage) {
		attack = G.skills[atype].damage;
	}

	// SKILL MP
	if (G.skills[atype].mp) {
		mp_cost = G.skills[atype].mp;
	}

	if (attacker.is_player && range && !attacker.is_npc) {
		if (dist > range + attacker.xrange) {
			attacker.socket.emit("game_response", { response: "too_far", id: target.id, dist: dist });
			return { failed: true, reason: "too_far", place: atype, id: target.id, dist: dist };
		}
		if (dist > range) {
			attacker.xrange += range - dist;
		}
	}

	if (info.procs && attacker.s.poisonous) {
		info.conditions.push("poisoned");
	}

	if (atype == "heal") {
		attack = attacker.heal || attacker.attack;
		mp_cost = attacker.mp_cost;
	} else if (
		attacker.is_player &&
		(atype == "attack" || atype == "3shot" || atype == "5shot" || atype == "cleave" || atype == "shadowstrike")
	) {
		var mp_mult = 1;
		var att_mult = 1;
		if (atype == "3shot") {
			mp_mult = 0;
			att_mult = 0.7;
		}
		if (atype == "5shot") {
			mp_mult = 0;
			att_mult = 0.5;
		}
		if (atype == "cleave") {
			mp_mult = 0.02;
			info.lines = false;
			att_mult = 0.1 + Math.random() * 0.8;
			def.aoe = true;
			attacker.first = true;
		}
		if (atype == "shadowstrike") {
			mp_mult = 0;
			info.lines = false;
			att_mult = (0.2 + Math.random() * 1.2) * ((Math.random() < 0.05 && 12) || 1);
			def.aoe = true;
		}
		if (attacker.mp < attacker.mp_cost * mp_mult) {
			attacker.socket.emit("game_response", { response: "no_mp" });
			return { failed: true, reason: "no_mp", place: atype, id: target.id };
		}
		mp_cost = parseInt(attacker.mp_cost * mp_mult);
		attack = attacker.attack * att_mult;
	} else if (atype == "piercingshot") {
		info.apiercing = 500;
		attack = attacker.attack * 0.75;
	} else if (atype == "partyheal") {
		if (attacker.level >= 80) {
			attack = 800;
		} else if (attacker.level >= 72) {
			attack = 720;
		} else if (attacker.level >= 60) {
			attack = 600;
		} else {
			attack = 400;
		}
	} else if (atype == "selfheal") {
		if (attacker.level >= 80) {
			attack = 800;
		} else if (attacker.level >= 72) {
			attack = 720;
		} else if (attacker.level >= 60) {
			attack = 600;
		} else {
			attack = 400;
		}
	} else if (atype == "taunt") {
		if (
			target.is_monster &&
			target.target &&
			get_player(target.target) &&
			is_same(attacker, get_player(target.target), 1)
		) {
			stop_pursuit(target, { redirect: true, cause: "taunt redirect" });
			target_player(target, attacker);
		}
	} else if (atype == "curse") {
		if (distance(attacker, target) > min(200, attacker.range * 5 + 20)) {
			attacker.socket.emit("game_response", { response: "too_far", id: target.id, dist: dist });
			return { failed: true, reason: "too_far", place: atype, id: target.id, dist: dist };
		}
		attack = 0;
		info.conditions.push("cursed");
	} else if (atype == "burst") {
		if (attacker.mp < 1) {
			attacker.socket.emit("game_response", { response: "no_mp" });
			return { failed: true, reason: "no_mp", place: atype, id: target.id };
		}
		attack = attacker.mp * G.skills.burst.ratio;
		mp_cost = attacker.mp;
	} else if (atype == "cburst") {
		var mp_cutoff = attacker.next_mp;
		var mp = attacker.next_mp;
		if (atype == "cburst") {
			mp = mp_cutoff = attacker.next_mp;
		}
		if (attacker.mp < mp_cutoff) {
			attacker.socket.emit("game_response", { response: "no_mp" });
			return { failed: true, reason: "no_mp", place: atype, id: target.id };
		}
		attack = mp * G.skills.cburst.ratio;
		mp_cost = mp;
		attacker.first = true;
	} else if (atype == "purify") {
		def.purify = true;
	} else if (atype == "frostball") {
		info.conditions.push("frozen");
	} else if (atype == "fireball") {
		info.conditions.push("burned");
	} else if (atype == "supershot") {
		if (attacker.in != target.in || distance(attacker, target, true) > 3 * attacker.range + 20) {
			attacker.socket.emit("game_response", { response: "too_far", id: target.id, dist: dist });
			return { failed: true, reason: "too_far", place: atype, id: target.id, dist: dist };
		}
		attack = attacker.attack * 1.5;
		// if(attacker.slots.mainhand && attacker.slots.mainhand.name=="cupid") info.heal=info.positive=true,def.projectile=G.items.cupid.projectile;
	} else if (atype == "snowball") {
		if (target.is_monster && attacker.a.freeze && attacker.a.freeze.attr0) {
			attack += 10 * attacker.a.freeze.attr0 * attacker.a.freeze.attr0;
		}
		if (target.is_monster || is_in_pvp(attacker, true)) {
			info.conditions.push("frozen");
		}
	} else if (atype == "quickpunch" || atype == "quickstab" || atype == "smash") {
		attack = attacker.attack * G.skills[atype].damage_multiplier;
	} else if (atype == "mentalburst") {
		if (
			attacker.in != target.in ||
			distance(attacker, target, true) >
				attacker.range * G.skills.mentalburst.range_multiplier + G.skills.mentalburst.range_bonus
		) {
			attacker.socket.emit("game_response", { response: "too_far", id: target.id, dist: dist });
			return { failed: true, reason: "too_far", place: atype, id: target.id, dist: dist };
		}
		attack = attacker.attack * G.skills[atype].damage_multiplier;
	} else if (atype == "poisonarrow") {
		info.conditions.push("poisoned");
	} else if (attacker.is_monster) {
		var rng = parseInt(Math.random() * 100 - 50);
		if (attacker.s.poisonous) {
			info.conditions.push("poisoned");
		}
		attacker.last.attack = future_ms(rng);
	}

	if (atype != "attack" && target.immune && (!G.skills[atype] || !G.skills[atype].pierces_immunity)) {
		disappearing_text(target.socket, target, "IMMUNE!", { xy: 1, color: "evade", nv: 1, from: attacker.id });
		return { failed: true, reason: "skill_immune", place: atype, id: target.id };
	}

	if (
		(!info.positive &&
			((attacker.is_player && G.maps[attacker.map].safe) ||
				(!mode.friendly_fire &&
					(!attacker.team || attacker.team != target.team) &&
					((attacker.party && attacker.party == target.party) ||
						(attacker.guild && attacker.guild == target.guild))))) ||
		(attacker.map == "duelland" && (!attacker.duel || !target.duel))
	) {
		attacker.socket.emit("game_response", { response: "friendly", id: target.id });
		return { failed: true, reason: "friendly", place: atype, id: target.id };
	}

	direction_logic(attacker, target);

	if (mp_cost && attacker.first && !attacker.is_npc) {
		consume_mp(attacker, mp_cost, atype != "attack" && atype != "heal" && target);
	}
	attacker.first = false;

	if (attacker.is_player) {
		attacker.c = {};
		attacker.to_resend = "u+cid";
		if (attacker.p && attacker.p.stand) {
			attacker.p.stand = false;
		}
		step_out_of_invis(attacker);
		if (attacker.type == "merchant") {
			var gold = parseInt(attack * 2);
			attack = parseInt(min(attack, attacker.gold / 2));
			attacker.gold = max(0, attacker.gold - gold);
			attacker.to_resend += "+reopen";
		}
	}

	if (info.procs) {
		["crit", "critdamage", "explosion", "blast", "lifesteal", "manasteal"].forEach(function (p) {
			if (attacker[p]) {
				info[p] = attacker[p];
			}
		});
	}
	["apiercing", "rpiercing", "miss"].forEach(function (p) {
		if (attacker[p]) {
			info[p] = attacker[p];
		}
	});
	if (
		info.procs &&
		attacker.a.freeze &&
		Math.random() < (attacker.a.freeze.attr0 * (G.maps[attacker.map].freeze_multiplier || 1)) / 100.0
	) {
		info.conditions.push("frozen");
	}
	if (
		info.procs &&
		attacker.a.burn &&
		info.procs &&
		Math.random() < (attacker.a.burn.attr0 * (G.maps[attacker.map].burn_multiplier || 1)) / 100.0
	) {
		info.conditions.push("burned");
	}
	if (info.procs && attacker.a.weave && info.procs) {
		info.conditions.push("woven");
	}
	if (info.procs && attacker.stun && Math.random() < attacker.stun / 100.0 && info.damage_type == "physical") {
		info.conditions.push("stunned");
	}

	var pid = randomStr(6);
	var eta = 0;
	info.first_attack = info.attack = attack;
	info.def = def;
	def.damage_type = info.damage_type;
	def.pid = pid;
	info.attacker = attacker;
	info.target = target;
	info.atype = atype;
	projectiles[pid] = info;

	var action = {
		attacker: attacker.id,
		target: target.id,
		type: atype,
		source: atype,
		x: target.x,
		y: target.y,
		eta: 400,
		m: target.m,
		pid: pid,
	};

	if (def.projectile) {
		action.projectile = def.projectile;
		if (target.is_monster && G.monsters[target.type].escapist) {
			var dampened = false;
			for (var id in instances[target.in].monsters) {
				var m = instances[target.in].monsters[id];
				if (m.type == "fieldgen0" && point_distance(target.x, target.y, m.x, m.y) < 300) {
					target.s.dampened = { ms: 2000 };
					add_condition(target, "dampened", { ms: 2000 });
					dampened = true;
				}
			}
			if (!dampened) {
				port_monster(target, random_place(target.map));
			}
		}
	}

	if (!(G.projectiles[def.projectile] && G.projectiles[def.projectile].instant)) {
		eta = (1000 * dist) / G.projectiles[def.projectile].speed;
	} else {
		action.instant = true;
	}

	info.eta = future_ms(eta);

	if (info.heal) {
		action.heal = attack;
	} else if (attack) {
		action.damage = attack;
	}
	if (info.positive) {
		action.positive = true;
	}
	if (info.conditions.length) {
		action.conditions = info.conditions;
	}
	info.action = action;
	xy_emit(attacker, "action", action, target.id);

	if (!eta) {
		projectiles_loop();
	}

	action.response = "data";
	action.place = atype;

	return action;
}

function complete_attack(attacker, target, info) {
	var defense = "armor";
	var pierce = "apiercing";
	var combo = 1;
	var combo_m = 1;
	var atype = info.atype;
	var evade = false;
	var first = true;
	var attack = info.attack;
	var o_attack;
	var i_attack = info.attack;
	var def = info.def;
	if (G.monsters[attacker.type] && G.monsters[attacker.type].good) {
		info.heal = info.positive = true;
	}
	var change = false;
	var targets = [[target, "normal"]];
	var otarget = target;
	var events = [];
	info.action.map = attacker.map;
	info.action.in = attacker.in;

	if (info.damage_type == "pure" || target === attacker) {
		defense = "none_existent";
		pierce = "non_existent";
		info.apiercing = 0;
	} else if (info.damage_type == "magical") {
		defense = "resistance";
		pierce = "rpiercing";
		info.apiercing = 0;
	} else {
		info.damage_type = "physical";
	}

	if (target.is_player && attack > 0 && !info.heal) {
		add_pdps(target, attacker, attack * B.dps_tank_mult); // "tank"
		if (attacker.cooperative) {
			add_coop_points(attacker, target, attack * B.dps_tank_mult);
		}
	}
	if (attacker.is_monster && attack > 0 && !info.heal) {
		attacker.outgoing += min(target.hp, attack);
	}

	if (
		target.reflection &&
		defense == "resistance" &&
		Math.random() * 100 < target.reflection &&
		!info.heal &&
		attacker != target
	) {
		var pid = randomStr(6);
		var eta = 0;
		var opid = info.action.pid;
		// info.attack=ceil(attack*damage_multiplier(attacker.resistance||0))||1;
		info.attack = ceil(attack * (0.9 + ((attack && Math.random() * 0.2) || 0))); // A pure reflection was requested [29/03/22]
		if (!info.action.instant) {
			eta = (1000 * distance(target, attacker, true)) / G.projectiles[info.action.projectile].speed;
		}
		info.target = attacker;
		info.attacker = target;
		info.eta = future_ms(eta);
		projectiles[pid] = info;
		info.action.pid = pid;
		info.action.target = attacker.id;
		info.action.attacker = target.id;
		info.action.x = attacker.x;
		info.action.y = attacker.y;
		info.action.reflect = info.attack;
		info.action.m = attacker.m;

		if ((attacker.is_player && target.is_monster) || info.reflections) {
			info.reflections = (info.reflections || 0) + 1;
		}
		if (info.reflections >= 4 && attacker.is_player) {
			item_achievement_increment(attacker, attacker.slots.chest, "reflector");
		}
		if (info.reflections >= 4 && target.is_player) {
			item_achievement_increment(target, target.slots.chest, "reflector");
		}

		xy_emit(
			target,
			"hit",
			{ pid: def.pid, hid: attacker.id, id: target.id, damage: 0, reflect: info.attack },
			attacker.id,
		);
		return xy_emit(target, "action", info.action, attacker.id);
	}

	if (attacker == target && !target.dead) {
	} // reflect after dead fix [04/02/23]
	else if (target.evasion && defense == "armor" && Math.random() * 100 < target.evasion) {
		return xy_emit(
			info.action,
			"hit",
			{ pid: def.pid, hid: attacker.id, id: target.id, damage: 0, evade: true },
			attacker.id,
		);
	} else if (
		target.dc ||
		target.dead ||
		(attacker.miss && Math.random() * 100 < attacker.miss) ||
		(target.avoidance && Math.random() * 100 < target.avoidance)
	) {
		return xy_emit(
			info.action,
			"hit",
			{ pid: def.pid, hid: attacker.id, id: target.id, damage: 0, miss: true },
			attacker.id,
		);
	} else if (
		target.m != info.action.m ||
		point_distance(target.x, target.y, info.action.x, info.action.y) > 72 * ((info.heal && 1.5) || 1)
	) {
		return xy_emit(
			info.action,
			"hit",
			{
				pid: def.pid,
				hid: attacker.id,
				id: target.id,
				damage: 0,
				avoid: true,
				x: info.action.x,
				y: info.action.y,
				map: info.attacker.map,
				in: info.attacker.in,
			},
			attacker.id,
		);
	}

	if (info.positive || !info.procs) {
		combo = 0;
	}
	if (combo && target.targets > 3) {
		if (!target.last_combo || ssince(target.last_combo) > 5) {
			target.combo = 1;
		}
		combo += target.combo;
		target.last_combo = new Date();
		target.combo += 1;
		def.mobbing = target.combo;
	}
	if (
		combo &&
		target.is_player &&
		instances[target.in].pmap[target.last_hash] &&
		Object.keys(instances[target.in].pmap[target.last_hash]).length > 1
	) {
		var combo_check = false;
		for (var id in instances[target.in].pmap[target.last_hash]) {
			var ntarget = instances[target.in].pmap[target.last_hash][id];
			if (
				target.id == ntarget.id ||
				is_invinc(ntarget) ||
				(!is_same(target, ntarget, 2) && !is_in_pvp(target)) ||
				attacker.id == ntarget.id
			) {
				continue;
			} //is_same(attacker,ntarget,1)
			//!is_same(target,ntarget,1) && !is_in_pvp(target) to prevent people killing other people in non-pvp servers
			//!is_same(target,ntarget,2) makes people kill others in coop fights
			combo_check = true;
			break;
		}
		if (combo_check) {
			targets = [];
			combo = 0;
			for (var id in instances[target.in].pmap[target.last_hash]) {
				var ntarget = instances[target.in].pmap[target.last_hash][id];
				if (is_invinc(ntarget) || attacker.id == ntarget.id || !is_same(target, ntarget, 2)) {
					continue;
				} //is_same(attacker,ntarget,1)
				targets.push([ntarget, "stack"]);
				if (!ntarget.last_combo || ssince(ntarget.last_combo) > 5) {
					ntarget.combo = 1;
				}
				combo += ntarget.combo;
				ntarget.last_combo = new Date();
				ntarget.combo += 1;
			}
			if (targets.length > 1) {
				def.stacked = [];
				targets.forEach(function (t) {
					def.stacked.push(t[0].id);
				});
			}
		}
	}

	if (combo > 10) {
		combo_m = combo / 4.0;
	} else if (combo > 1) {
		combo_m = [1, 1.6, 1.62, 1.64, 1.7, 1.72, 1.75, 1.8, 1.9, 2, 2, 2, 2][combo];
	}
	combo_m = min(combo_m, max(300 / attack, 1.2)); // previously 2.4

	if (
		!info.positive &&
		((info.explosion && info.damage_type == "physical") || (info.blast && info.damage_type == "magical"))
	) {
		var intensity = info.blast;
		var defense = "resistance";
		if (info.damage_type == "physical") {
			intensity = info.explosion;
			defense = "armor";
		}
		var radius = intensity / 3.6;
		if (is_in_pvp(attacker) || attacker.is_monster) {
			for (var id in instances[target.in].players) {
				var target = instances[target.in].players[id];
				if (target.npc) {
					continue;
				}
				if (target.id != otarget.id && distance(target, otarget) < radius) {
					targets.push([target, "splash", (damage_multiplier(target[defense] || 0) * intensity) / 100.0]);
				}
			}
		}
		if (attacker.is_player) {
			for (var id in instances[target.in].monsters) {
				var target = instances[target.in].monsters[id];
				if (target.avoidance && Math.random() * 100 < target.avoidance) {
					xy_emit(
						info.action,
						"hit",
						{ pid: def.pid, hid: attacker.id, id: target.id, damage: 0, miss: true },
						attacker.id,
					);
					continue;
				}
				if (target.id != otarget.id && distance(target, otarget) < radius) {
					targets.push([target, "splash", (damage_multiplier(target[defense] || 0) * intensity) / 100.0]);
				}
			}
		}
	}

	targets.forEach(function (target_def) {
		delete def.splash;
		delete def.dreturn;
		delete def.kill;
		delete def.unintentional;

		var target = target_def[0];
		if (target_def[1] != "normal") {
			def.unintentional = true;
		}
		if (target_def[1] == "splash") {
			def.splash = true;
		}

		def.id = target.id;

		if (info.heal) {
			if (first) {
				o_attack = attack = -ceil(
					B.heal_multiplier *
						attack *
						(0.9 + Math.random() * 0.2) *
						damage_multiplier(((target[defense] || 0) - (attacker[pierce] || 0)) / 2.0),
				);
				if (target.s.poisoned) {
					attack = round(attack * 0.25);
				}
			} else {
				attack = o_attack;
			}
			def.heal = -attack;
			if (attacker.is_player && target.type == "ghost" && !target.s.healed) {
				target.s.healed = { ms: 960 * 60 * 60 * 1000 };
				drop_one_thing(attacker, "essenceoflife", { x: target.x, y: target.y, chest: "chestp" });
			}
			if (G.monsters[attacker.type] && G.monsters[attacker.type].goldsteal && target.is_player) {
				var gold = -88;
				target.gold -= gold;
				def.goldsteal = gold;
			}
		} else {
			if (evade) {
				return;
			}
			target.hits++;
			if (first) {
				if (info.crit && Math.random() * 100 < info.crit) {
					var cmult = 2 + (info.critdamage || 0) / 100.0;
					def.crit = cmult;
					attack *= cmult;
				}
				if (attacker.type == "rogue") {
					var maxd = G.skills.stack.max;
					// if(G.monsters[target.type] && G.monsters[target.type].stationary) maxd=9999999999;
					target.s.stack = { ms: 10000, s: min(maxd, (target.s.stack && target.s.stack.s + 1) || 1) };
					attack += target.s.stack.s;
				}
				if (def.purify) {
					for (var name in target.s) {
						if (
							(G.conditions[name] &&
								(G.conditions[name].buff || G.conditions[name].debuff) &&
								!G.conditions[name].persistent) ||
							target.s[name].citizens
						) {
							delete target.s[name];
							attack += 400;
							info.first_attack += 400;
							target.cid++;
							target.u = true;
						}
					}
				}
				var dmg_mult = 1;
				if (attacker.is_player && target["for"]) {
					dmg_mult = damage_multiplier(target["for"] * 5);
				}
				i_attack = attack = ceil(combo_m * attack * (0.9 + ((attack && Math.random() * 0.2) || 0)));
				attack =
					ceil(
						attack * dmg_mult * damage_multiplier((target[defense] || 0) - (attacker[pierce] || 0) - info.apiercing),
					) || 0;

				if (target.incdmgamp) {
					attack = round((attack * (100 + target.incdmgamp)) / 100.0);
				}

				if (target["1hp"]) {
					attack = (def.crit && 2) || 1;
				}
				if (attack > 0 && target.s.invincible) {
					attack = 0;
				}
				if (attacker.tskin == "konami" && target.type != attacker.p.target_lock) {
					attack = 0;
				}

				o_attack = attack = ceil(attack);

				if (info.conditions.includes("frozen") && !target.immune && target.hp > attack) {
					if (Math.random() < target.fzresistance / 100.0) {
						xy_emit(target, "ui", { type: "freeze_resist", id: target.id });
					} else {
						add_condition(target, "frozen");
						disappearing_text(target.socket, target, "FREEZE!", { xy: 1, size: "huge", color: "freeze", nv: 1 }); //target.is_player&&"huge"||undefined
					}
				}

				if (info.conditions.includes("burned") && !target.immune && target.hp > attack) {
					add_condition(target, "burned", {
						divider: attacker.a && attacker.a.burn && attacker.a.burn.unlimited && 1.5,
						fid: attacker.id,
						f: attacker.name || G.monsters[attacker.type].name,
						attack: attack,
					});
				}

				if (info.conditions.includes("woven") && !target.immune) {
					add_condition(target, "woven");
				}

				if (
					info.conditions.includes("stunned") &&
					target.hp > attack &&
					add_condition(target, "stunned", { duration: 2000 })
				) {
					disappearing_text(target.socket, target, "STUN!", { xy: 1, size: "huge", color: "stun", nv: 1 });
				} //target.is_player&&"huge"||undefined

				if (info.procs && target.a.putrid) {
					add_condition(attacker, "poisoned");
					add_condition(attacker, "cursed");
					change = true;
				}
				info.conditions.forEach(function (c) {
					if (["frozen", "burned", "woven", "stunned"].includes(c)) {
						return;
					}
					if (target.hp > attack && !target.immune) {
						add_condition(target, c);
					}
				});
				if (info.procs && attacker.a.sugarrush && Math.random() < 0.0025) {
					def.trigger = "sugarrush";
					add_condition(attacker, "sugarrush");
					disappearing_text(attacker.socket, attacker, "SUGAR RUSH!", { xy: 1, size: "huge", color: "sugar", nv: 1 }); //target.is_player&&"huge"||undefined
				}
				if (attacker.s.invis) {
					// && target.is_player
					def.sneak = true;
					disappearing_text(target.socket, target, "SNEAK!", { xy: 1, size: "huge", color: "sneak", nv: 1 });
				}
				if (info.damage_type == "pure") {
					attack = ceil(info.first_attack);
				}
				if (target["1hp"]) {
					attack = (def.crit && 2) || 1;
				}
			} else {
				attack = o_attack;
				if (target_def[1] == "splash") {
					attack = ceil(attack * target_def[2]);
				}
				if (target["1hp"]) {
					def.damage = o_attack = attack = 1;
				}
			}
			if (attack >= 1) {
				target.last.attacked = new Date();
				if (target.is_monster && attacker.is_player) {
					target.points[attacker.name] = (target.points[attacker.name] || 0) + 1;
				}
			}
			if (atype == "deepfreeze" && add_condition(target, "deepfreezed")) {
				def.deepfreeze = true;
			}

			def.damage = attack;
			if (info.lifesteal) {
				var hp = ceil((min(attack, target.hp) * info.lifesteal) / 100.0);
				attacker.hp = min(attacker.max_hp, attacker.hp + hp);
				change = true;
				if (hp) {
					def.lifesteal = hp;
				}
			}
			if (info.manasteal) {
				var mp = ceil((min(attack, target.hp) * info.manasteal) / 100.0);
				if (target.mp !== undefined) {
					mp = min(target.mp, mp);
					target.mp = max(0, target.mp - mp);
				} else {
					mp = 0;
				}
				if (attacker.mp !== undefined) {
					attacker.mp = min(attacker.max_mp || 0, attacker.mp + mp);
					change = true;
				}
				if (mp) {
					def.manasteal = mp;
				}
			}
			if (G.monsters[attacker.type] && G.monsters[attacker.type].goldsteal && target.gold) {
				//var gold=min(target.gold,parseInt(ceil(target.level*target.level/10)));
				var gold = parseInt(Math.random() * 12) + 1;
				target.gold = max(0, target.gold - gold);
				attacker.extra_gold = (attacker.extra_gold || 0) + gold;
				def.goldsteal = gold;
			}
		}

		var original = target.hp;
		if (target.s.mshield && target.mp > 200 && attack > 0) {
			// console.log("HERE MPSHIELD!")
			var max_mp = target.mp - 200;
			var damage_per_mp = 1.5;
			if (target.level > 99) {
				damage_per_mp = 3;
			} else if (target.level > 89) {
				damage_per_mp = 2.4;
			} else if (target.level > 79) {
				damage_per_mp = 2;
			} else if (target.level > 69) {
				damage_per_mp = 1.75;
			}
			var max_hp = ceil(max_mp * damage_per_mp);
			if (max_hp < attack) {
				def.mp_damage = max_mp;
				attack -= max_hp;
				target.mp = 200;
			} else {
				def.mp_damage = parseInt(attack / damage_per_mp);
				attack = 0;
				target.mp -= def.mp_damage;
			}
			change = true;
		}
		target.hp = min(target.hp - attack, target.max_hp); // both for damage and heal
		var net = original - max(0, target.hp);
		if (target.hp <= 0) {
			def.kill = true;
			if (G.skills[atype].kill_buff) {
				add_condition(attacker, G.skills[atype].kill_buff);
			}
		}

		if (
			target.dreturn &&
			i_attack > 0 &&
			first &&
			attacker.range < 75 &&
			info.damage_type == "physical" &&
			!attacker["1hp"]
		) {
			// dreturn happens at every hit
			def.dreturn = ceil((i_attack * target.dreturn) / 100.0);
			if (attacker.is_monster) {
				attacker.u = true;
				attacker.cid++;
			}
			attacker.hp = max(attacker.hp - def.dreturn, 0);
		}

		// if(target.is_player && net>0) target.s.damage_received={amount:target.s.damage_received&&(target.s.damage_received.amount+net)||net,ms:10000};

		if (attacker.is_player) {
			if (net > 0) {
				// "attack"
				if (attacker.t) {
					attacker.t.mdamage += net;
				}
				add_pdps(attacker, target, net);
			} // "heal"
			else {
				add_pdps(attacker, target, -net * B.dps_heal_mult);
			}
			var m = target;
			var mnet = net;
			if (net < 0 && target.s && target.s.coop) {
				m = instances[attacker.in].monsters[target.s.coop.id];
				mnet = -net * B.dps_heal_mult;
				if (m && m.attack < 120) {
					mnet /= 100;
				} // dirty fix
				// console.log("coop heal: "+m)
			}
			if (target.master) {
				m = instances[attacker.in].monsters[target.master];
			}
			if (m && m.is_monster && m.cooperative) {
				add_coop_points(m, attacker, mnet);
			}
		}

		if (mode.instant_monster_attacks || attacker.is_player) {
			xy_emit(target, "hit", def, attacker.id);
		} // always sends the event to attacker.id
		else {
			events.push(["hit", def]);
		}

		if (attacker.is_monster) {
			//monster attacks player
			achievement_logic_monster_hit(attacker, target, attack);
			if (target.hp <= 0 && !target.rip) {
				if (target.a && target.a.secondchance && Math.random() * 100 < target.a.secondchance.attr0) {
					target.hp = target.max_hp;
					disappearing_text(target.socket, target, "SECOND CHANCE!", { xy: 1, size: "huge", color: "green", nv: 1 });
				} else {
					if (target.s.block && get_player(target.s.block.f)) {
						pwn_routine(get_player(target.s.block.f), target);
					} else {
						defeated_by_a_monster(attacker, target);
					}
				}
			}
			target.c = {};
		} else if (target.is_monster) {
			//player attacks monster
			achievement_logic_monster_damage(attacker, target, net);
			target.u = true;
			target.cid++;
			ccms(target);
			if (target.hp <= 0) {
				if (atype == "mentalburst") {
					attacker.mp += net;
				}
				achievement_logic_monster_last_hit(attacker, target);
				kill_monster(attacker, target);
			} else {
				if (target.a.warp_on_hit && Math.random() < target.a.warp_on_hit.attr0 && !is_disabled(target)) {
					var point = random_place(target.map);
					transport_monster_to(target, target.in, target.map, point.x, point.y);
				}
				if (target.drop_on_hit) {
					drop_something(attacker, target, 1);
				}
				if (
					!attacker.is_npc &&
					!target.target &&
					!evade &&
					atype != "shadowstrike" &&
					!G.monsters[target.type].passive
				) {
					target_player(target, attacker);
				}
			}
		} else if (target.is_player) {
			//player attacks player
			if (!info.positive && !target.s.invincible) {
				if (mode.dpvpblock) {
					attacker.socket.emit("eval", { code: "pvp_timeout(3600,1)" });
					attacker.s.block = { ms: 3600, f: (attacker.s.block && attacker.s.block.f) || target.name };
					change = true;
				}
				target.socket.emit("eval", { code: "pvp_timeout(3600)" });
				target.s.block = { ms: 3600, f: (target.s.block && target.s.block.f) || attacker.name };
				if (!is_same(target, attacker, 1)) {
					target.s.block.f = attacker.name;
				}
				target.c = {};
			}

			if (target.hp <= 0 && !target.rip) {
				if (atype == "mentalburst") {
					attacker.mp += net;
					change = true;
				}
				if (target.a && target.a.secondchance && Math.random() * 100 < target.a.secondchance.attr0) {
					target.hp = target.max_hp;
					disappearing_text(target.socket, target, "SECOND CHANCE!", { xy: 1, size: "huge", color: "green", nv: 1 });
				} else {
					var victor = attacker;
					if (target.s.block && get_player(target.s.block.f)) {
						victor = get_player(target.s.block.f);
					}
					pwn_routine(victor, target);
				}
			}
		}

		first = false;

		if (target.is_player) {
			resend(target, "u+cid");
		}
	});

	if (attacker.hp <= 0 && !attacker.dead && !attacker.rip) {
		// dreturn
		if (attacker.is_monster) {
			kill_monster((attacker.target && get_player(attacker.target)) || target, attacker);
		} // monster to player
		else if (target.is_monster) {
			defeated_by_a_monster(target, attacker);
			change = true;
		} // player to monster
		else {
			pwn_routine(target, attacker);
		} // player to player
	}

	if ((change || attacker.to_resend) && attacker.is_player) {
		resend(attacker, "u+cid");
	}
	if (change && attacker.is_monster && !attacker.dead) {
		attacker.u = true;
		attacker.cid++;
		ccms(attacker);
	}
}

function target_player(monster, player, no_increase) {
	// if(is_sdk) console.log("target_player: "+player.name+" "+(!no_increase));
	if (!no_increase && (monster.s.charmed || monster.peaceful)) {
		return;
	}
	if (monster.dead || monster.pet || monster.trap) {
		return;
	}
	monster.target = player.name;
	if (!no_increase) {
		increase_targets(player, monster);
	}
	delete monster.s.sleeping;
	monster.last.attacked = new Date();
	monster.last_level = future_s(Math.random() * 100 - 50);
	monster.ex = monster.x;
	monster.ey = monster.y;
	monster.moving = false;
	monster.abs = true;
	monster.u = true;
	monster.cid++;
	calculate_monster_stats(monster);
}

function defeat_player(player) {
	player.violations = (player.violations || 0) + 1;
	if (player.s.block && player.s.block.f && !player.rip) {
		var attacker = players[name_to_id[player.s.block.f]];
		if (attacker && attacker.name != player.name) {
			issue_player_award(attacker, player);
			instance_emit(attacker.in, "server_message", {
				message: attacker.name + " defeated " + player.name,
				color: "gray",
			});
			if (player.map == "arena") {
				xy_emit(npcs.pvp, "chat_log", {
					owner: npcs.pvp.name,
					message: attacker.name + " defeated " + player.name,
					id: "pvp",
				});
			}
			rip(player);
		}
	}
}

function duel_defeat(player) {
	var info = instances[player.duel.id].info;
	info.A.forEach(function (p) {
		if (p.name == player.name) {
			p.active = false;
		}
	});
	info.B.forEach(function (p) {
		if (p.name == player.name) {
			p.active = false;
		}
	});
	delete player.duel;
	delete player.team;
}

function resend(player, events) {
	if (player.halt || player.is_npc) {
		return;
	}
	if (!player.gold && player.gold !== 0) {
		player.gold = 0;
		server_log("#X - GOLD BUG resend", 1);
	}
	events = (events && events.split && events.split("+")) || [];
	delete player.to_resend;
	if (in_arr("u", events)) {
		add_call_cost(call_modifier);
		player.u = true;
	}
	if (in_arr("cid", events)) {
		player.cid++;
	}
	// if(in_arr("inv",events)) no longer needed as both add_item and consume has .esize updates [18/10/18]
	// {
	// 	player.esize=0;
	// 	for(var i=0;i<player.items.length;i++) if(!player.items[i]) player.esize++;
	// 	player.esize+=player.isize-player.items.length;
	// }
	if (!in_arr("nc", events)) {
		add_call_cost(call_modifier);
		calculate_player_stats(player);
	}
	var data = player_to_client(player);
	if (player.hitchhikers && player.hitchhikers.length) {
		data.hitchhikers = player.hitchhikers;
		player.hitchhikers = [];
	}
	if (in_arr("reopen", events) || player.to_reopen) {
		if (current_socket != player.socket) {
			add_call_cost(call_modifier * 4);
		}
		data.reopen = true;
		player.socket.emit("player", data);
		delete player.to_reopen;
	} else {
		player.socket.emit("player", data);
	}
	delete player.to_resend;
}

function transport_monster_to(monster, to_in, to_map, x, y) {
	xy_emit(monster, "disappear", { id: monster.id, effect: "magiport", to: to_map, s: 0, reason: "magiport" });
	delete instances[monster.in].monsters[monster.id];
	instances[to_in].monsters[monster.id] = monster;
	monster.x = x;
	monster.y = y;
	monster.in = to_in;
	monster.map = to_map;
	monster.abs = true;
	monster.moving = false;
}

function transport_observer_to(observer, to_in, map, x, y) {
	delete instances[observer.in].observers[observer.id];
	var instance = instances[to_in];
	instance.observers[observer.id] = observer;
	resume_instance(instance);
	observer.in = to_in;
	observer.map = map;
	observer.x = x;
	observer.y = y;
	// observer.socket.latest_calls+=8;
	observer.socket.emit("new_map", {
		name: instance.map,
		in: to_in,
		x: observer.x,
		y: observer.y,
		direction: 0,
		effect: 0,
		info: instance.info,
		m: 0,
		entities: send_all_xy(observer, { raw: true }),
	});
}

function transport_player_to(player, name, point, effect) {
	// if((player.duel || player.team) && player.in!=name) restore_state(player); // PROBLEMATIC [29/07/22]
	if (!instances[name]) {
		name = "main";
	}
	var instance = instances[name];
	var new_map = G.maps[instance.map];
	var direction = 0;
	var scatter = 0;
	var data = { id: player.id, reason: "transport" };
	if (!is_invis(player) && !player.stealth && G.maps[name]) {
		data.to = name;
		data.s = point;
	}
	if (effect) {
		data.effect = effect;
	}
	xy_emit(player, "disappear", data);

	player.map = instance.map;
	if (player.in != name) {
		delete instances[player.in].players[player.id];
		if (instances[player.in].solo == player.id) {
			destroy_instance(player.in);
		}
	}
	pmap_remove(player);
	player.in = name;
	resume_instance(instances[player.in]);
	instances[player.in].players[player.id] = player;
	if (!instances[player.in].mount && player.user && !player.mounting && !player.unmounting) {
		player.unmounting = new Date();
		sync_loop();
	} // patches the exit by jail loophole [20/08/18]
	if (Object.keys(player.bets).length && name != "tavern") {
		for (var bid in player.bets) {
			player.gold += player.bets[bid].gold;
		}
		player.bets = {};
		resend(player, "reopen+nc");
	}

	player.m++;
	if (is_array(point)) {
		player.x = point[0];
		player.y = point[1];
		direction = point[2] || 0;
		scatter = point[3] || 0;
	} else {
		if (!new_map.spawns[point || 0]) {
			point = 0;
		}
		player.x = new_map.spawns[point || 0][0];
		player.y = new_map.spawns[point || 0][1];
		direction = new_map.spawns[point || 0][2];
		scatter = new_map.spawns[point || 0][3] || 0;
	}

	if (scatter) {
		player.x += Math.random() * scatter - scatter / 2;
		player.y += Math.random() * scatter - scatter / 2;
	}
	// server_log(effect);
	if (effect) {
		// server_log("here");
		player.tp = effect; //appear
		setTimeout(function () {
			try {
				if (!check_player(player)) {
					return;
				}
				player.tp = false;
			} catch (e) {
				log_trace("#X Critical-tp", e);
			}
		}, 500);
	}
	player.moving = false;
	player.vx = player.vy = 0;
	player.u = true;
	player.cid++;
	calculate_player_stats(player);
	pmap_add(player);
	add_call_cost(player, 8, "transport"); // New - to offset send_all_xy [26/01/20]
	if (0 && !effect && mssince(player.last.transport) > 6000) {
		var ms = max(0, -mssince(player.last.attack)) + 3200;
		var EV = "";
		EV = "skill_timeout('attack'," + ms + "); ";
		player.last.attack = future_ms(ms);
		for (var i in player.last) {
			if (G.skills[i] && player.last[i] > future_ms(-3000)) {
				player.last[i] = future_ms(3200);
				EV += "skill_timeout('" + i + "'," + (3200 + (G.skills[i].cooldown || 0)) + "); ";
			}
		}
	}
	if (effect) {
		player.s.penalty_cd = { ms: min(((player.s.penalty_cd && player.s.penalty_cd.ms) || 0) + 812, 120000) };
	} else {
		player.s.penalty_cd = { ms: min(((player.s.penalty_cd && player.s.penalty_cd.ms) || 0) + 3200, 120000) };
	}
	player.socket.emit("new_map", {
		name: instance.map,
		in: name,
		x: player.x,
		y: player.y,
		direction: direction,
		effect: effect || 0,
		info: instance.info,
		m: player.m,
		entities: send_all_xy(player, { raw: true }),
		eval: EV,
	});
	player.last.transport = new Date();
	resend(player, "u+cid");
}

function add_shells(player, amount, reason, announce, override) {
	if (gameplay == "hardcore" || gameplay == "test") {
		return;
	}
	var phrase = "Received";
	if (reason == "xptome") {
		phrase = "Earned";
	}
	player.cash += amount;
	player.socket.emit("game_log", { message: phrase + " " + to_pretty_num(amount) + " SHELLS", color: "green" });
	disappearing_text(player.socket, player, "+" + to_pretty_num(amount), {
		color: colors.cash,
		xy: 1,
		s: "cash",
		size: "huge",
	});
	appengine_call(
		"bill_user",
		{ auth: player.auth, amount: -parseInt(amount), reason: reason + "_drop", name: player.name, override: override },
		function (result) {
			if (result.failed || !result.done) {
				return;
			}
			player.cash = result.cash;
			resend(player, "reopen");
		},
	);
	if (announce) {
		broadcast("server_message", {
			message: player.name + " found " + to_pretty_num(amount) + " shells",
			color: "#85C76B",
			type: "server_found",
			shells: amount,
			name: player.name,
		});
	}
}

function is_socket_allowed(socket) {
	var loose = 0;
	for (var id in sockets) {
		if (!players[id] && get_ip(sockets[id]) == get_ip(socket)) {
			loose++;
		}
	}
	if (loose > 5) {
		return false;
	}
	return true;
}

function disconnect_old_sockets(socket) {
	for (var id in sockets) {
		if (id != socket.id && !players[id] && get_ip(sockets[id]) == get_ip(socket)) {
			sockets[id].emit("disconnect_reason", "Too many loose connections from your network. Simply reload to play.");
			if (sockets[id]) {
				sockets[id].disconnect();
			} // emit can trigger a disconnect too, so this would throw an exception, bring down the server
		}
	}
}

function init_io() {
	io.on("connection", function (socket) {
		if (socket.handshake.query.server_method) {
			if (0 && socket.handshake.query.server_master == variables.server_master) {
				// this was to make servers communicate with each other and disconnect overflows immediately [28/10/23]
				if (socket.handshake.query.server_method == "players") {
					socket.emit("players"); // decided to make the existing cron more aggressive [26/09/21]
				}
			}
			socket.disconnect();
			return;
		}
		sockets[socket.id] = socket;
		socket.total_calls = 0;
		socket.calls = [];
		socket.fs = {}; // function list

		if (!is_socket_allowed(socket)) {
			disconnect_old_sockets(socket);
		}

		var original_on = socket.on;
		socket.on = function (method, f) {
			// takes the "f" function, the function thats sent to socket.on, wraps it into a "g" function
			var g = function (data) {
				ls_method = method;
				if (mode.log_all) {
					console.log("'" + method + "': " + JSON.stringify(data));
				}
				try {
					var climit = limits.calls;
					var name = "_observer";
					if (data === undefined) {
						data = {};
					} // data normalisation [28/08/18]
					socket.total_calls++;
					add_call_cost(-1);
					current_socket = socket;
					call_modifier = { open_chest: 0.1, skill: 0.05, target: 0.5 }[method] || 1;
					if (players[socket.id]) {
						name = players[socket.id].name;
						// if(players[socket.id].type=="merchant") climit=round(climit/3);
						// Merchants are first class citizens now! [14/01/18]
					} else {
						climit = round(climit / 4);
					}
					if (method == "cm") {
						var add = 1;
						var len = data.message.length;
						var mult = 1;
						if (len > 100) {
							add = 2;
						} else if (len > 1000) {
							add = 3;
						} else if (len > 10000) {
							add = 10;
						} else if (len > 50000) {
							add = 20;
						}
						// console.log("add: "+add+"len: "+len);
						if (data.to.length > 1) {
							mult = 0.8;
						}
						add_call_cost(add * data.to.length * mult, undefined, "cm_data");
					} else {
						if (CC[method]) {
							add_call_cost(CC[method] || 0);
						}
					}
					if (get_call_cost() > climit && method != "disconnect") {
						server_log(">>> LIMITDC " + name, 1);
						socket.emit("limitdcreport", { calls: socket.calls, climit: climit, total: socket.total_calls });
						socket.emit("disconnect_reason", "limitdc");
						socket.disconnect();
					} else {
						f(data);
					}
				} catch (e) {
					try {
						var climit = limits.calls;
						add_call_cost(16);
						log_trace("socket.on: " + method.substr(0, 200), e);
						if (get_call_cost() > climit) {
							server_log(">>> LIMITDC2 " + name, 1);
							socket.emit("limitdcreport", {
								calls: socket.calls,
								climit: climit,
								total: socket.total_calls,
								method: method.substr(0, 200),
							});
							socket.emit("disconnect_reason", "limitdc");
							socket.disconnect();
						} else {
							try {
								socket.emit("game_error", "ERROR!");
							} catch (e) {}
						}
					} catch (e) {
						log_trace("limit_calls", e);
					}
				}
				current_socket = false_socket;
			};
			socket.fs[method] = f;
			original_on.apply(socket, [method, g]);
		};

		var data = {
			region: region,
			name: server_name,
			pvp: is_pvp,
			gameplay: gameplay,
			info: (instances[socket.first_map] && instances[socket.first_map].info) || {},
		};
		socket.first_map = socket.first_in = observer_map;
		socket.first_x = observer_x;
		socket.first_y = observer_y + 120;
		socket.desktop = true;
		if (socket.request && socket.request._query && socket.request._query.secret) {
			for (var id in players) {
				var player = players[id];
				if (player.secret == socket.request._query.secret) {
					socket.player = player;
					data.character = player_to_client(player);
					data.character.id = data.character.name = player.name;
					socket.first_map = player.map;
					socket.first_in = player.in;
					socket.first_x = player.x;
					socket.first_y = player.y;
					if (socket.request._query.desktop) {
						socket.desktop = true;
						socket.first_y += 120;
					} else {
						socket.desktop = false;
					}
				}
			}
		}
		data.x = socket.first_x;
		data.y = socket.first_y;
		data.map = socket.first_map;
		data.in = socket.first_in;
		broadcast_e(true);
		data.S = E;
		socket.emit("welcome", data);
		socket.on("send_updates", function () {
			if (observers[socket.id]) {
				send_all_xy(observers[socket.id]);
			}
			if (players[socket.id]) {
				send_all_xy(players[socket.id]);
			}
		});
		socket.on("loaded", function (data) {
			var observer = (observers[socket.id] = {
				socket: socket,
				x: socket.first_x,
				y: socket.first_y,
				// vision:[round((data.width/2)/data.scale)+B.ext_vision,round((data.height/2)/data.scale)+B.ext_vision],
				map: socket.first_map,
				in: socket.first_in,
				observer: 1,
				id: "o" + socket.id,
				s: {},
			});
			if (socket.player) {
				observer.player = socket.player;
			}
			// observer.vision[0]=min(1000,observer.vision[0]); observer.vision[1]=min(700,observer.vision[1]);
			observer.vision = B.vision;
			// socket.emit("observing",{map:observer.map,x:observer.x,y:observer.y});
			resume_instance(instances[observer.in]);
			instances[observer.in].observers[observer.id] = observer;
			send_all_xy(observer);
		});
		socket.on("o:home", function (data) {
			var observer = observers[socket.id];
			if (!observer) {
				return;
			}
			var player = observer.player;
			if (!player || player.dc) {
				return;
			}
			transport_observer_to(observer, player.in, player.map, player.x, player.y + ((socket.desktop && 120) || 0));
		});
		socket.on("o:command", function (data) {
			var observer = observers[socket.id];
			if (!observer) {
				return;
			}
			var player = observer.player;
			if (!player || player.dc) {
				return;
			}
			player.socket.emit("code_eval", data);
		});
		socket.on("cm", function (data) {
			var player = players[socket.id];
			var receivers = [];
			if (!player || player.s.mute) {
				return fail_response("muted");
			}
			data.to.forEach(function (name) {
				var p = players[name_to_id[name]];
				if (p) {
					p.socket.emit("cm", { name: player.name, message: data.message || "" });
					receivers.push(name);
				}
			});
			success_response("data", { locals: [], receivers: receivers });
		});
		socket.on("say", function (data) {
			var player = players[socket.id];
			var message = strip_string(data.message).substr(0, 1200);
			if (!player || player.s.mute) {
				return fail_response("muted");
			}
			if (data.code && player.last_say && ssince(player.last_say) < 15) {
				return fail_response("chat_slowdown");
			}
			if (player.last_say && mssince(player.last_say) < 400) {
				return fail_response("chat_slowdown");
			}
			if (!message || !message.length) {
				return fail_response("invalid");
			}
			player.last_say = new Date();
			if (data.party) {
				if (!player.party) {
					return fail_response("not_in_a_party");
				}
				party_emit(player.party, "partym", { owner: player.name, message: message, id: player.id, p: true });
			} else if (data.name) {
				var target = get_player(data.name);
				if (!target) {
					player.socket.emit("pm", {
						owner: player.name,
						to: data.name,
						message: message,
						id: player.id,
						xserver: true,
					});
					appengine_call(
						"log_chat",
						{ to: ["", data.name], type: "xprivate", message: message, fro: player.name, author: player.owner },
						function (result) {
							if (result.failed && players[socket.id]) {
								player.socket.emit("pm", {
									owner: player.name,
									to: data.name,
									message: "(FAILED)",
									id: player.id,
									xserver: true,
								});
							}
						},
					);
				} else {
					if (target.name == player.name) {
						return fail_response("invalid");
					}
					player.socket.emit("pm", { owner: player.name, to: data.name, message: message, id: player.id });
					target.socket.emit("pm", { owner: player.name, message: message, id: player.id });
					appengine_call("log_chat", {
						to: [target.owner, target.name],
						type: "private",
						message: message,
						fro: player.name,
						author: player.owner,
					});
				}
			} else {
				if (1) {
					broadcast("chat_log", { owner: player.name, message: message, id: player.id, p: true });
					var owners = {};
					for (var id in players) {
						var p = players[id];
						owners[p.owner] = owners[p.owner] || [];
						owners[p.owner].push(p.name);
					}
					appengine_call("log_chat", {
						to: Object.entries(owners),
						type: "ambient",
						message: message,
						fro: player.name,
						author: player.owner,
					});
				} else {
					xy_emit(player, "chat_log", { owner: player.name, message: message, id: player.id, p: true });
				}
				appengine_call("log_chat", { type: "server", message: message, fro: player.name, author: player.owner });
			}
			if (player.s.typing) {
				delete player.s.typing;
				resend(player, "u+cid+nc");
			}
			success_response();
		});
		socket.on("ping_trig", function (data) {
			socket.emit("ping_ack", data);
		});
		socket.on("target", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			reduce_call_cost();
			player.target = data.id;
			player.focus = data.xid;
			var target = instances[player.in].monsters[data.id];
			if (!target) {
				target = instances[player.in].players[data.id];
			}
			if (!target) {
				target = instances[player.in].players[NPC_prefix + data.id];
			}
			if (!target) {
				player.target = null;
			}
			var focus = instances[player.in].monsters[data.xid];
			if (!focus) {
				focus = instances[player.in].players[data.xid];
			}
			if (!focus) {
				focus = instances[player.in].players[NPC_prefix + data.xid];
			}
			if (!focus) {
				player.focus = null;
			}
			if (focus && focus.screenshot) {
				target.going_x = player.x;
				target.going_y = player.y;
				target.u = true;
				start_moving_element(focus);
			}
			if (focus && player.map == "cgallery" && focus.npc) {
				// target.going_x=player.x;
				// target.going_y=player.y;
				// target.u=true;
				// start_moving_element(target);
				if (!player.tcx) {
					player.tcx = {};
				}
				if (focus.ctype == "body") {
					player.tskin = focus.skin;
				} else if (player.cx.length > 5) {
					return fail_response("invalid");
				}
				player.tcx[focus.ctype] = focus.cx[focus.ctype];
				// player.tcx=target.cx;
				resend(player, "u+cid");
			}
			// server_log(player.name+" target: "+player.target+" focus: "+player.focus);
			resend(player, "u+nc");
			success_response({});
		});
		socket.on("ureward", function (data) {
			if (!player || player.user || !data.name || !G.docs.rewards[data.name]) {
				return;
			}
			if (!player.verified || !player.auth_id) {
				return socket.emit("game_response", "reward_notverified");
			}
			if (!player.user.rewards) {
				player.user.rewards = [];
			}
			if (player.user.rewards.includes(data.name)) {
				return socket.emit("game_response", "reward_already");
			}
			player.user.rewards.push(data.name);
			exchange(player, G.docs.rewards[data.name], { name: "reward_" + data.name });
			socket.emit("game_response", { response: "reward_received", rewards: player.user.rewards });
		});
		socket.on("creward", function (data) {
			if (!player || !data.name || !G.classes[player.type].rewards[data.name]) {
				return;
			}
			if (!player.verified || !player.auth_id) {
				return socket.emit("game_response", "reward_notverified");
			}
			if (!player.p.rewards) {
				player.p.rewards = [];
			}
			if (player.p.rewards.includes(data.name)) {
				return socket.emit("game_response", "reward_already");
			}
			player.p.rewards.push(data.name);
			exchange(player, G.classes[player.type].rewards[data.name].reward, { name: "reward_" + data.name });
			socket.emit("game_response", { response: "reward_received", rewards: player.p.rewards });
		});
		socket.on("cx", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			// if(player.role!="gm") return socket.emit('game_log',"Cosmetics system is out of the test phase for now");
			// console.log(data);
			var cx = player.cx;
			var cxl = all_cx(player);
			// if(!player.tcx) player.tcx=clone(player.cx);
			if (data.slot && !data.name) {
				if (data.slot == "back") {
					delete cx.tail;
				} // synced with render_cgallery
				if (data.slot == "face") {
					delete cx.makeup;
				}
				delete cx[data.slot];
			} else {
				if (!T[data.name] || (!cxl[data.name] && player.role != "cx")) {
					return fail_response("cx_not_found");
				}
				if ((T[data.name] == "body" || T[data.name] == "armor" || T[data.name] == "character") && data.slot == "skin") {
					player.skin = data.name;
				} else if ((T[data.name] == "body" || T[data.name] == "armor") && data.slot == "upper") {
					cx.upper = data.name;
				} else if (cxtype_to_slot[T[data.name]] && cxtype_to_slot[T[data.name]] != "skin") {
					cx[cxtype_to_slot[T[data.name]]] = data.name;
				}
			}
			prune_cx(player.cx, player.skin);
			resend(player, "u+cid");
			success_response();
		});
		socket.on("gm", function (data) {
			var player = players[socket.id];
			if (!player || player.role != "gm") {
				return;
			}
			var target = players[id_to_id[data.id]];
			var action = data.action;
			if (action == "mute") {
				if (!target) {
					return socket.emit("game_log", "Player not found: " + data.id);
				}
				if (!target.s.mute) {
					target.s.mute = { ms: 48 * 60 * 60 * 1000 };
					return socket.emit("game_chat", "Muted " + target.name);
				} else {
					target.s.mute = { ms: 0 };
					return socket.emit("game_chat", "Unmuted " + target.name);
				}
			} else if (action == "jail") {
				if (!target) {
					return socket.emit("game_log", "Player not found: " + data.id);
				}
				transport_player_to(target, "jail");
			} else if (action == "ban") {
				appengine_call("ban_user", { name: data.id }, function (result) {
					socket.emit("game_log", "Ban: " + ((result && result.result) || "No result"));
				});
			} else if (action == "invincible") {
				player.s.invincible = { ms: 24 * 60 * 60 * 1000 };
				resend(player, "u+cid");
			} else if (action == "jump") {
				if (!target) {
					return socket.emit("game_log", "Player not found: " + data.id);
				}
				var spot = safe_xy_nearby(target.map, target.x - 8, target.y - 6);
				if (spot) {
					pulled = player;
					pulled.s.magiport = { ms: 400 };
					pulled.s.magiport.x = spot.x;
					pulled.s.magiport.y = spot.y;
					pulled.s.magiport.f = target.name;
					pulled.s.magiport.in = target.in;
					pulled.s.magiport.map = target.map;
					resend(pulled, "u+cid");
				} else {
					return socket.emit("game_log", "No safe spot near: " + data.id);
				}
			} else if (action == "mjump") {
				target = get_monsters(data.monster)[0];
				if (!target) {
					return socket.emit("game_log", "Monster not found: " + data.monster);
				}
				var spot = safe_xy_nearby(target.map, target.x - 8, target.y - 6);
				if (spot) {
					pulled = player;
					pulled.s.magiport = { ms: 400 };
					pulled.s.magiport.x = spot.x;
					pulled.s.magiport.y = spot.y;
					pulled.s.magiport.f = target.name;
					pulled.s.magiport.in = target.in;
					pulled.s.magiport.map = target.map;
					resend(pulled, "u+cid");
				} else {
					return socket.emit("game_log", "No safe spot near: " + data.monster);
				}
			} else if (action == "jump_list") {
				var ids = [];
				for (var id in players) {
					ids.push(players[id].name);
				}
				socket.emit("gm", { action: "jump_list", ids: ids });
			} else if (action == "server_info") {
				var info = [];
				for (var id in players) {
					info.push({ name: players[id].name, owner: players[id].owner, ip: get_ip(players[id]) });
				}
				//socket.emit("gm",{action:"server_info",info:info});
			}
		});
		socket.on("monsterhunt", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (simple_distance(G.maps.main.ref.monsterhunter, player, true) > B.sell_dist) {
				return fail_response("distance");
			}
			var hunted = [];
			for (var id in server.s) {
				if (server.s[id].type == "monsterhunt") {
					hunted.push(server.s[id].id);
				}
			}
			if (player.s.monsterhunt && player.s.monsterhunt.c) {
				return fail_response("monsterhunt_already");
			} else if (player.s.monsterhunt) {
				delete server.s["monsterhunt_" + player.s.monsterhunt.id];
				delete player.s.monsterhunt;
				add_item(player, "monstertoken", { log: true, q: (gameplay == "hardcore" && 100) || 1 });
				resend(player, "u+cid+reopen");
				return success_response({ completed: true });
			}
			if (player.type == "merchant") {
				return socket.emit("game_response", "monsterhunt_merchant");
			}
			var mmax = -1;
			var name = "goo";
			var count = 100;
			var times = 0;
			var the_hp = 0;
			for (var id in instances) {
				if (instances[id].name != id || !G.maps[id] || G.maps[id].irregular) {
					continue;
				}
				for (var mid in instances[id].monsters) {
					var monster = instances[id].monsters[mid];
					if (monster.level > mmax && !in_arr(monster.type, hunted) && !monster.target) {
						// added the target condition [21/07/23]
						name = monster.type;
						mmax = monster.level;
						the_hp = monster.max_hp / 1000.0;
					}
				}
			}
			for (var id in G.maps) {
				if (G.maps[id].irregular || !G.maps[id].monsters) {
					continue;
				}
				G.maps[id].monsters.forEach(function (p) {
					if (p.type == name) {
						times += p.count;
					}
				});
			}
			// console.log(times);
			count = max(1, min(500, parseInt((20 * 60 * max(1, times)) / the_hp / (G.monsters[name].respawn + 0.25))));
			if (gameplay == "hardcore") {
				count = max(1, parseInt(count / 10));
			}
			player.s.monsterhunt = { sn: region + " " + server_name, id: name, c: count, ms: 30 * 60 * 1000, dl: true };
			server.s["monsterhunt_" + name] = { name: player.name, id: name, ms: 20 * 60 * 1000, type: "monsterhunt" };
			player.hitchhikers.push(["game_response", "monsterhunt_started"]);
			resend(player, "u+cid");
			success_response({ started: true });
		});
		socket.on("ccreport", function () {
			socket.emit("ccreport", { calls: socket.calls, climit: limits.calls, total: socket.total_calls });
		});
		socket.on("tracker", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (!player.tracker) {
				return;
			}
			var data = {
				monsters: player.p.stats.monsters,
				monsters_diff: player.p.stats.monsters_diff,
				exchanges: player.p.stats.exchanges,
				maps: D.drops.maps,
				tables: {},
				max: player.max_stats,
			}; // ,computer:false
			function register_table(table) {
				if (table) {
					table.forEach(function (drop) {
						if (drop[1] == "open" && !data.tables[drop[2]]) {
							data.tables[drop[2]] = D.drops[drop[2]];
							register_table(D.drops[drop[2]]);
						}
					});
				}
			}
			if (player.computer || 1) {
				// data.computer=true;
				data.drops = D.drops.monsters;
			} else {
				data.drops = {};
				for (var name in data.monsters) {
					if (data.monsters[name] >= 100 && D.drops.monsters[name]) {
						data.drops[name] = D.drops.monsters[name];
					}
				}
			}
			if (D.drops.maps.global) {
				data.global = D.drops.maps.global;
				register_table(data.global);
			}
			if (D.drops.maps.global_static) {
				data.global_static = D.drops.maps.global_static;
				register_table(data.global_static);
			}
			for (var name in data.drops) {
				register_table(data.drops[name]);
			}
			for (var name in data.maps) {
				register_table(data.maps[name]);
			}
			for (var name in G.items) {
				if (
					G.items[name].e &&
					(player.computer ||
						1 ||
						(player.p.stats.exchanges && player.p.stats.exchanges[name] && player.p.stats.exchanges[name] >= 100))
				) {
					if (G.items[name].upgrade || G.items[name].compound) {
						for (var i = 0; i < 13; i++) {
							if (D.drops[name + i]) {
								data.tables[name + i] = D.drops[name + i];
								register_table(data.tables[name + i]);
							}
						}
					} else if (D.drops[name]) {
						data.tables[name] = D.drops[name];
						register_table(data.tables[name]);
					}
				}
			}
			socket.emit("tracker", data);
		});
		socket.on("set_home", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (player.p.dt.last_homeset && hsince(player.p.dt.last_homeset) < 36) {
				return fail_response("sh_time", { hours: 36 - hsince(player.p.dt.last_homeset) });
			}
			player.p.dt.last_homeset = new Date();
			player.p.home = region + server_name;
			delete player.s.hopsickness;
			success_response("home_set", { home: player.p.home });
		});
		socket.on("code", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.run) {
				players[socket.id].code = true;
			} else {
				players[socket.id].code = false;
			}
			resend(players[socket.id], "u+cid");
		});
		socket.on("property", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.typing) {
				if (!player.s.typing || player.s.typing.ms < 3000) {
					reduce_call_cost();
				}
				player.s.typing = { ms: 4000 };
				resend(player, "u+cid+nc");
			} else {
				var original = player.afk;
				if (player.afk == "bot" || player.afk == "code") {
				} else if (data.afk === true) {
					player.afk = true;
				} else if (data.afk === false) {
					if (player.afk !== undefined) {
						player.afk = false;
					}
				}
				if (original !== player.afk) {
					reduce_call_cost();
					resend(player, "u+cid+nc");
				}
			}
		});
		socket.on("cruise", function (speed) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			player.cruise = parseInt(speed);
			resend(player, "u+cid");
			success_response("cruise", { speed: player.cruise });
		});
		socket.on("test", function (data) {
			if (is_sdk) {
				console.log(data.test);
			}
			socket.emit("test", { date: new Date() });
		});
		socket.on("blocker", function (data) {
			if (data.type == "pvp") {
				if (instances["arena"].allow) {
					socket.emit("blocker", { type: "pvp", allow: 1 });
				} else {
					socket.emit("blocker", { type: "pvp" });
				}
			}
		});
		socket.on("mail_take_item", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (mode.prevent_external) {
				return socket.emit("game_response", { response: "not_in_this_server" });
			}
			if (!player.esize) {
				return socket.emit("game_response", "inv_size");
			}
			appengine_call(
				"take_item_from_mail",
				{ owner: player.owner, mid: data.id },
				function (result) {
					var player = players[socket.id];
					if (result.failed) {
						return socket.emit("game_response", { response: "mail_item_already_taken" });
					}
					var item = JSON.parse(result.item);
					add_item(player, item, { announce: false });
					resend(player, "reopen");
					socket.emit("game_response", { response: "mail_item_taken" });
				},
				function () {
					socket.emit("game_response", { response: "mail_take_item_failed" });
				},
			);
		});
		socket.on("mail", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (mode.prevent_external) {
				return fail_response("not_in_this_server");
			}
			var item = null;
			var retries = 1;
			if (player.gold < 48000) {
				return fail_response("gold_not_enough");
			}
			player.gold -= 48000;
			if (data.item && player.items[0] && player.items[0].name != "placeholder") {
				if (player.items[0].l) {
					return fail_response("item_locked");
				}
				if (player.items[0].b || player.items[0].v) {
					return fail_response("item_blocked");
				}
				if (player.gold < 312000) {
					return fail_response("gold_not_enough");
				}
				player.gold -= 312000;
				item = JSON.stringify(player.items[0]);
				player.items[0] = player.citems[0] = null;
				retries = 3;
			}
			appengine_call(
				"send_mail",
				{
					fro: player.name,
					to: data.to,
					subject: data.subject || "",
					message: data.message || "",
					rid: randomStr(50),
					retries: retries,
					item: item,
				},
				function (result) {
					var player = players[socket.id];
					if (result.failed) {
						if (player) {
							socket.emit("game_response", {
								response: "mail_failed",
								to: data.to,
								reason: result.reason,
								cevent: "mail_failed",
							});
						}
						if (player && item && result.return && player.esize) {
							var r = JSON.parse(item);
							add_item(player, r);
							resend(player, "reopen");
						} else {
							console.log("#M unsent mail, lost item: " + item);
						}
						return;
					}
					if (player) {
						socket.emit("game_response", { response: "mail_sent", to: data.to, cevent: "mail_sent" });
					}
				},
				function () {
					var player = players[socket.id];
					if (player) {
						socket.emit("game_response", { response: "mail_failed", reason: "coms_failure" });
					}
					if (item) {
						console.log("#M unsent mail, lost item: " + item);
					}
				},
			);
			resend(player, "reopen");
			success_response("mail_sending", { sucess: false, in_progress: true, received: "unknown" });
		});
		socket.on("leave", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (!can_walk(player)) {
				return fail_response("transport_failed");
			}
			if (
				(0 && player.s.block) ||
				player.targets > 5 ||
				!(player.map == "jail" || player.map == "cyberland" || instances[player.in].solo)
			) {
				return fail_response("cant_escape");
			}
			transport_player_to(player, B.start_map);
			success_response();
		});
		socket.on("transport", function (data) {
			var player = players[socket.id];
			var can_reach = false;
			if (!player) {
				return;
			} // this was missing, probably caused a production exception - should be added everywhere [04/09/16]
			if (!can_walk(player) || player.map == "jail") {
				return fail_response("transport_failed");
			}
			var new_map = G.maps[data.to];
			var s = data.s || 0;
			var the_door = null;
			if (!new_map || !instances[data.to] || !instances[data.to].allow) {
				return fail_response("cant_enter");
			}
			if ((0 && player.s.block) || player.targets > 5) {
				return fail_response("cant_escape");
			}

			(G.maps[player.map].doors || []).forEach(function (door) {
				if (
					!can_reach &&
					door[4] == data.to &&
					s == (door[5] || 0) &&
					simple_distance(
						{ map: player.map, x: G.maps[player.map].spawns[door[6]][0], y: G.maps[player.map].spawns[door[6]][1] },
						player,
					) < B.door_dist
				) {
					can_reach = "door";
					the_door = door;
				}
			});
			if ((player.map == "woffice" && gameplay == "hardcore") || player.role == "gm") {
				can_reach = "transport";
			}
			if (
				!can_reach &&
				G.maps[player.map].ref.transporter &&
				simple_distance(G.maps[player.map].ref.transporter, player) < B.transporter_dist &&
				G.npcs.transporter.places[data.to] === s
			) {
				can_reach = "transport";
			}
			if (can_reach == "transport" && player.s.dampened) {
				return fail_response("transport_cant_dampened");
			}
			if (!can_reach) {
				return fail_response("transport_cant_reach");
			}
			if (the_door && the_door[7] == "protected") {
				var protected = false;
				for (var x in instances[player.in].monsters || {}) {
					if (instances[player.in].monsters[x].map_def.gatekeeper) {
						protected = true;
					}
				}
				if (protected) {
					return fail_response("transport_cant_protection");
				}
			}
			if (
				the_door &&
				the_door[7] == "ulocked" &&
				G.maps[data.to].mount &&
				player.user &&
				!player.user.unlocked[data.to]
			) {
				return fail_response("transport_cant_locked");
			}

			if (instances[data.to].mount && !player.user) {
				if (player.mounting || player.unmounting) {
					return fail_response("bank_opi");
				}
				add_call_cost(32, undefined, "bank");
				player.mounting = new Date();
				player.mount_to = data.to;
				player.mount_s = s;
				sync_loop();
				return success_response({ success: false, in_progress: true });
			} else if (!instances[data.to].mount && player.user) {
				// previously handled at transport_player_to
				if (player.mounting || player.unmounting) {
					return fail_response("bank_opi");
				}
				add_call_cost(16, undefined, "bank");
				player.unmounting = new Date();
				player.unmount_to = data.to;
				player.unmount_s = s;
				sync_loop();
				return success_response({ success: false, in_progress: true });
			} else if (0 && instances[data.to].mount && player.user && data.to != player.map) {
				// an easy prevention for the bank re-entry nuisance, bank can be re-entered physically but not digitally [03/11/16]
				// commented out for bank_u / bank_b [06/05/20]
				return fail_response("transport_failed");
			} else {
				decay_s(player, 5200);
				transport_player_to(player, data.to, s);
				return success_response();
			}
		});
		socket.on("enter", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (gameplay != "normal") {
				return fail_response("transport_failed");
			}
			if (!can_walk(player) || player.map == "jail") {
				return fail_response("transport_failed");
			}
			if (player.s.block || player.targets > 5) {
				return fail_response("cant_escape");
			}
			// if(player.role!="gm" && !(data.place==player.map && player.map=="cgallery"))
			// {
			// 	if(data.place!="resort" && !G.maps[player.map].ref.transporter || simple_distance(G.maps[player.map].ref.transporter,player)>80) return socket.emit("game_response","transport_cant_reach");
			// 	if(data.place=="resort" && player.map!="resort") return socket.emit("game_response","transport_cant_reach");
			// }
			server_log(data);
			var name = randomStr(24);
			if (data.place == "resort" && 0) {
				var name = "resort_" + data.name;
				instance = instances[name] || create_instance(name, "resort_map");
				transport_player_to(player, name);
			} else if (data.place == "duelland") {
				if (instances[data.name] && instances[data.name].map == "duelland") {
					transport_player_to(player, data.name);
					instance_emit(data.name, "game_log", { message: player.name + " is spectating the duel", color: "gray" });
				} else {
					return fail_response("cant_enter");
				}
			} else if (data.place == "crypt" || data.place == "winter_instance") {
				var f = "cave";
				var ref = G.maps.cave.spawns[2];
				var item = "cryptkey";
				if (data.place == "winter_instance") {
					f = "winterland";
					ref = G.maps.winterland.spawns[5];
					item = "frozenkey";
				}
				if (simple_distance(player, { in: f, map: f, x: ref[0], y: ref[1] }) > 120) {
					return fail_response("transport_cant_reach");
				}
				if (data.name && instances[data.name] && instances[data.name].map == data.place) {
					transport_player_to(player, data.name);
				} else {
					if (!consume_one_by_id(player, item)) {
						return fail_response("transport_cant_item");
					}
					instance = create_instance(name, data.place);
					transport_player_to(player, name);
				}
				resend(player, "u+cid+reopen");
			} else if (data.place == "dungeon0" && player.role == "gm") {
				instance = create_instance(name, "dungeon0", { solo: player.id });
				transport_player_to(player, name);
			} else if (data.place == "cgallery" && player.role == "gm") {
				var point = null;
				if (player.map == "cgallery") {
					point = [player.x, player.y];
				}
				instance = create_instance(name, "cgallery", { solo: player.id });
				transport_player_to(player, name, point);
				var bodies = [];
				var heads = [];
				var hairs = [];
				var wings = [];
				var hats = [];
				for (var s in G.sprites) {
					var current = G.sprites[s];
					var matrix = current.matrix;
					if (current.skip || current.rskip) {
						continue;
					}
					if (!in_arr(current.type, ["body", "head", "hair", "s_wings", "hat"])) {
						continue;
					}
					for (var i = 0; i < matrix.length; i++) {
						for (var j = 0; j < matrix[i].length; j++) {
							if (!matrix[i][j]) {
								continue;
							}
							if (current.type == "body") {
								bodies.push(matrix[i][j]);
							}
							if (current.type == "head") {
								heads.push(matrix[i][j]);
							}
							if (current.type == "hair") {
								hairs.push(matrix[i][j]);
							}
							if (current.type == "hat") {
								hats.push(matrix[i][j]);
							}
							if (current.type == "s_wings") {
								wings.push(matrix[i][j]);
							}
							T[matrix[i][j]] = current.type;
						}
					}
				}
				var xs = [-80, -40, 0, 40, 80];
				for (var n = 0; n < bodies.length; n++) {
					var npc = create_npc(
						{
							name: bodies[n],
							level: 1,
							speed: 12,
							hp: 1000,
							skin: bodies[n],
							cx: {},
						},
						{
							position: [xs[n % xs.length], -parseInt(n / xs.length) * 40],
							id: bodies[n],
						},
						instance,
					);
					npc.ctype = "body";
					npc.cx = { head: heads[n] };
					npc.id = "body: " + bodies[n];
					instance.players[NPC_prefix + npc.id] = npc;
				}
				for (var n = 0; n < heads.length; n++) {
					var npc = create_npc(
						{ name: heads[n], level: 1, speed: 12, hp: 1000, skin: bodies[0], cx: {} },
						{ position: [xs[n % xs.length] + 240, -parseInt(n / xs.length) * 40], id: heads[n] },
						instance,
					);
					npc.ctype = "head";
					npc.cx = { head: heads[n] };
					npc.id = "head: " + heads[n];
					instance.players[NPC_prefix + npc.id] = npc;
				}
				for (var n = 0; n < hairs.length; n++) {
					var npc = create_npc(
						{ name: hairs[n], level: 1, speed: 12, hp: 1000, skin: bodies[1], cx: {} },
						{ position: [xs[n % xs.length] + 480, -parseInt(n / xs.length) * 40], id: hairs[n] },
						instance,
					);
					npc.ctype = "hair";
					npc.cx = { head: heads[0], hair: hairs[n] };
					npc.id = "hair: " + hairs[n];
					instance.players[NPC_prefix + npc.id] = npc;
				}
				for (var n = 0; n < hats.length; n++) {
					var npc = create_npc(
						{ name: hats[n], level: 1, speed: 12, hp: 1000, skin: bodies[2], cx: {} },
						{ position: [xs[n % xs.length] + 720, -parseInt(n / xs.length) * 40], id: hats[n] },
						instance,
					);
					npc.ctype = "hat";
					npc.cx = { head: heads[0], hat: hats[n] };
					npc.id = "hair: " + hats[n];
					instance.players[NPC_prefix + npc.id] = npc;
				}
			} else {
				return fail_response("transport_cant_reach");
			}
			success_response();
		});
		socket.on("town", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			// if(player.last.town && mssince(player.last.town)<1200) return; // bad ui experience [Unknown] - got reported and disabled [25/03/22]
			if (!can_walk(player) || player.map == "jail") {
				return fail_response("transport_failed");
			}
			if ((0 && player.s.block) || player.targets > 5) {
				return fail_response("cant_escape");
			}
			player.c.town = { ms: min((player.c.town && player.c.town.ms) || 5000, 3000) };
			resend(player, "u+nc");
			success_response({ success: false, in_progress: true });
		});
		socket.on("respawn", function (data) {
			var player = players[socket.id];
			if (!player || !player.rip) {
				return fail_response("invalid");
			}
			if (player.rip_time && ssince(player.rip_time) < B.rip_time) {
				return fail_response("cant_respawn");
			}

			delete player.s.block;
			player.hp = player.max_hp;
			player.mp = round(player.max_mp / 2);
			player.rip = false;
			if (gameplay == "hardcore") {
				reset_player(player, 1);
			}

			if (data && data.safe) {
				// gameplay=="hardcore" &&
				transport_player_to(player, "woffice", 0, 1);
			} else {
				var place = G.maps[player.map].on_death || G.maps[B.start_map].on_death || ["main", 0];
				transport_player_to(player, place[0], place[1], 1);
			}
			if (player.party) {
				send_party_update(player.party);
			}
			invincible_logic(player);
			resend(player, "u+cid");
			success_response("data", { place: "respawn", cevent: "respawn" });
		});
		socket.on("random_look", function (data) {
			return socket.emit("game_log", "socket.emit('enter',{place:'cgallery'})");
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var bodies = [];
			var heads = [];
			var hairs = [];
			var wings = [];
			var hats = [];
			if (player.rlooks == 25 && !is_sdk && player.role != "gm") {
				return;
			}
			if (player.role == "gm") {
				reduce_call_cost(40);
			}
			player.rlooks = (player.rlooks || 0) + 1;
			for (var s in G.sprites) {
				var current = G.sprites[s];
				var matrix = current.matrix;
				if (current.skip || current.rskip) {
					continue;
				}
				if (!in_arr(current.type, ["body", "head", "hair", "s_wings", "hat"])) {
					continue;
				}
				for (var i = 0; i < matrix.length; i++) {
					for (var j = 0; j < matrix[i].length; j++) {
						if (!matrix[i][j]) {
							continue;
						}
						if (current.type == "body") {
							bodies.push(matrix[i][j]);
						}
						if (current.type == "head") {
							heads.push(matrix[i][j]);
						}
						if (current.type == "hair") {
							hairs.push(matrix[i][j]);
						}
						if (current.type == "hat") {
							hats.push(matrix[i][j]);
						}
						if (current.type == "s_wings") {
							wings.push(matrix[i][j]);
						}
					}
				}
			}
			var head = "head";
			if (Math.random() < 0.1) {
				head = random_one(heads);
			}
			player.tskin = random_one(bodies);
			player.tcx = [head, random_one(hairs)];
			if (Math.random() < 0.08) {
				player.tcx.push(random_one(wings));
			}
			if (Math.random() < 0.4) {
				player.tcx.push(random_one(hats));
			}
			resend(player, "u+cid");
		});
		socket.on("unlock", function (data) {
			return; // [27/06/18]
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (gameplay == "normal") {
				return;
			} // ? [27/06/18]
			if (data.name == "code") {
				var item = player.items[data.num || 0];
				if (!item || item.name != "computer" || item.charges === 0 || item.charges < 0 || player.unlocking_code) {
					return;
				}
				if (!item.charges) {
					item.charges = 2;
				}
				item.charges--;
				player.citems[data.num || 0] = player.items[data.num || 0]; // explicitly linked to the actual item
				player.unlocking_code = true;
				appengine_call(
					"user_operation",
					{ auth: player.auth, operation: "code_unlock", suffix: "/code_unlock/" + player.owner, retries: 4 },
					function (result) {
						server_log("user_operation_code: " + JSON.stringify(result), 1);
						if (result.failed) {
							if (result.reason == "already") {
								socket.emit(
									"game_log",
									"Your CODE slots are already unlocked. You can lend your Ancient Computer to a friend in need, that's why there are 2 charges :]",
								);
								item.charges++;
							} else {
								socket.emit("game_log", "Unlock Failed. Email hello@adventure.land with a screenshot.");
							}
							return;
						}
						socket.emit("game_log", "CODE slots increased to 100!");
						resend(player, "reopen");
					},
				);
			}
		});
		socket.on("dismantle", function (data) {
			var player = players[socket.id];
			var check = true;
			var items = [];
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!player.computer && simple_distance(G.maps.main.ref.craftsman, player) > B.sell_dist) {
				return fail_response("distance");
			}
			// if(player.esize<=0) return socket.emit("game_response","inventory_full");
			var item = player.items[data.num];
			if (item && item.level && G.items[item.name].compound) {
				var cost = min(50000000, calculate_item_value(item) * 10);
				if (player.gold < cost) {
					return fail_response("gold_not_enough");
				}
				if (player.esize < 2) {
					return fail_response("inv_size");
				}
				if (G.items[item.name].type == "booster") {
					return fail_response("dismantle_cant");
				}
				player.gold -= cost;
				consume_one(player, data.num);
				add_item(
					player,
					{ name: item.name, level: item.level - 1, grace: parseInt((item.grace || 0) / 3) },
					{ announce: false },
				);
				add_item(
					player,
					{ name: item.name, level: item.level - 1, grace: parseInt((item.grace || 0) / 3) },
					{ announce: false },
				);
				add_item(
					player,
					{ name: item.name, level: item.level - 1, grace: parseInt((item.grace || 0) / 3) },
					{ announce: false },
				);
				resend(player, "reopen+nc+inv");
				return success_response("dismantle", { name: item.name, level: item.level, cost: cost, cevent: true });
			}
			if (!item || !G.dismantle[item.name]) {
				return fail_response("dismantle_cant");
			}
			if (item.l) {
				return fail_response("item_locked");
			}
			if (item.b) {
				return fail_response("item_blocked");
			}
			if (player.gold < G.dismantle[item.name].cost) {
				return fail_response("gold_not_enough");
			}
			if (
				!can_add_items(player, list_to_pseudo_items(G.dismantle[item.name].items), {
					space: ((item.q || 1) == 1 && 1) || 0,
				})
			) {
				return fail_response("inv_size");
			}
			player.gold -= G.dismantle[item.name].cost;
			consume_one(player, data.num);
			G.dismantle[item.name].items.forEach(function (e) {
				if (e[0] < 1 && Math.random() > e[0]) {
					return;
				}
				add_item(player, e[1], { q: max(1, e[0]), p: item.p && !G.titles[item.p].misc && item.p });
			});
			resend(player, "reopen+nc+inv");
			success_response("dismantle", { name: item.name, cevent: true });
		});
		socket.on("craft", function (data) {
			var player = players[socket.id];
			var check = true;
			var items = [];
			var quantity = {};
			var place = {};
			var space = false;
			var p = {};
			var locked = false;
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			data.items.forEach(function (x) {
				if (!player.items[x[1]]) {
					check = false;
				} else if (player.items[x[1]].l || player.items[x[1]].b) {
					check = false;
					locked = true;
				} else {
					var name = player.items[x[1]].name;
					if (player.items[x[1]].level) {
						name += "+" + player.items[x[1]].level;
					}
					items.push(name);
					quantity[player.items[x[1]].name] = player.items[x[1]].q || 1; // (quantity[player.items[x[1]].name]||0)+ removed this part, seems like a bad initial addition [17/06/18]
					place[player.items[x[1]].name] = x[1];
					if (player.items[x[1]].p && !G.titles[player.items[x[1]].p].misc) {
						p[player.items[x[1]].p] = player.items[x[1]].p;
					}
				}
			});
			if (locked) {
				return fail_response("item_locked");
			}
			if (!check) {
				return fail_response("no_item");
			}
			//if(items.length<2) return socket.emit("game_response","craft_atleast2");
			items.sort();
			var key = items.join(",");
			// console.log(key);
			if (!D.craftmap[key]) {
				return fail_response("craft_cant");
			}
			var name = D.craftmap[key];
			var enough = true;
			if (
				!player.computer &&
				!G.craft[name].quest &&
				simple_distance(get_npc_coords("craftsman"), player) > B.sell_dist
			) {
				return fail_response("distance");
			}
			if (
				!player.computer &&
				G.craft[name].quest &&
				simple_distance(get_npc_coords(G.craft[name].quest), player) > B.sell_dist
			) {
				return fail_response("distance");
			}
			if (player.gold < G.craft[name].cost) {
				return fail_response("gold_not_enough");
			}
			G.craft[name].items.forEach(function (i) {
				if (quantity[i[1]] < i[0]) {
					enough = false;
				}
				if (quantity[i[1]] == i[0]) {
					space = true;
				}
			});
			if (!space && !can_add_item(player, create_new_item(name))) {
				return fail_response("inventory_full");
			}
			if (!enough) {
				return fail_response("craft_cant_quantity");
			}
			player.gold -= G.craft[name].cost;
			G.craft[name].items.forEach(function (x) {
				consume(player, place[x[1]], x[0]);
			});
			var i = add_item(player, name, { r: 1, p: Object.keys(p).length && random_one(p) });
			resend(player, "reopen+nc+inv");
			success_response("craft", { num: i, name: name, cevent: true });
		});
		socket.on("exchange", function (data) {
			var player = players[socket.id];
			var item = player.items[data.item_num];
			var def = G.items[item && item.name];
			var suffix = "";
			if (player.q.exchange) {
				return fail_response("exchange_existing");
			}
			if (def && (def.compound || def.upgrade)) {
				suffix = item.level || 0;
			}
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			G.maps.main.exchange.name = player.name;
			if (!def || !def.e || item.q != data.q || !D.drops[item.name + suffix]) {
				return fail_response("invalid");
			}
			if (item.l) {
				return fail_response("item_locked");
			}
			if (!player.computer && !def.quest && simple_distance(G.maps.main.exchange, player) > B.sell_dist) {
				return fail_response("distance");
			}
			if (!player.computer && def.quest && simple_distance(G.quests[def.quest], player) > B.sell_dist) {
				return fail_response("distance");
			}
			if (player.esize <= 0 && !((item.q || 1) == 1)) {
				return fail_response("inventory_full");
			}
			if (def.e > 1 && item.q < def.e) {
				return fail_response("exchange_notenough");
			}
			player.p.stats.exchanges[item.name + suffix] = (player.p.stats.exchanges[item.name + suffix] || 0) + 1;
			consume(player, data.item_num, def.e);
			var num = add_item(player, "placeholder");
			var ms = 3000 + parseInt(Math.random() * 3000);
			if (gameplay == "hardcore") {
				ms = 400;
			}
			player.q.exchange = { ms: ms, len: ms, name: item.name, id: item.name + suffix, q: def.e, num: num };
			if (suffix) {
				player.q.exchange.s = suffix;
			}
			if (item.v) {
				player.q.exchange.v = item.v;
			}
			if (def.quest) {
				player.q.exchange.qs = def.quest;
			}
			resend(player, "reopen+nc+inv");
			success_response({ success: false, in_progress: true, num: num });
		});
		socket.on("exchange_buy", function (data) {
			//console.log(JSON.stringify(data));
			var player = players[socket.id];
			var item = player.items[data.num];
			var def = G.items[item && item.name];
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!def || def.type != "token") {
				return fail_response("invalid");
			}
			var npc = G.maps.main.ref[G.items[item.name].npc || item.name + "s"];
			var num = -1;
			if (!G.tokens[item.name][data.name]) {
				return fail_response("invalid");
			}
			if (item.l) {
				return fail_response("item_locked");
			}
			npc.name = player.name;
			if (item.q != data.q) {
				return fail_response("safety_check");
			}
			if (!player.computer && simple_distance(npc, player) > B.sell_dist) {
				return fail_response("distance");
			}
			if (item.q < G.tokens[item.name][data.name]) {
				return fail_response("exchange_notenough");
			}

			if (G.tokens[item.name][data.name] < 1) {
				var q = parseInt(1 / G.tokens[item.name][data.name]);
				if (item.q != 1 && !can_add_item(player, { name: data.name, q: q })) {
					return fail_response("inventory_full");
				}
				consume(player, data.num, 1);
				num = add_item(player, data.name, { q: q, announce: false, r: true });
			} else {
				var name = data.name;
				var idata = undefined;
				if (name.search("-") != -1) {
					idata = name.split("-")[1];
					name = name.split("-")[0];
				}
				var new_item = create_new_item(name);
				if (idata) {
					new_item.data = idata;
				}
				if (item.q != G.tokens[item.name][data.name] && !can_add_item(player, new_item)) {
					return fail_response("inventory_full");
				}
				consume(player, data.num, G.tokens[item.name][data.name]);
				num = add_item(player, new_item, { announce: false, r: true });
			}

			xy_emit(npc, "upgrade", { type: item.name + "s", success: 1 });
			resend(player, "reopen+nc+inv");
			success_response({ num: num, cevent: true });
		});
		socket.on("locksmith", function (data) {
			var player = players[socket.id];
			var item = player.items[data.item_num];
			var def = G.items[item && item.name];
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!player.computer && simple_distance(G.maps.desertland.ref.locksmith, player) > B.sell_dist) {
				return fail_response("distance");
			}
			var item = player.items[data.num];
			if (!item) {
				return fail_response("no_item");
			}
			var def = G.items[item.name];
			if (in_arr(def.type, ["uscroll", "cscroll", "pscroll", "offering", "tome"])) {
				return fail_response("locksmith_cant");
			}
			if (data.operation == "unlock") {
				if (!item.l) {
					resend(player, "reopen+nc");
					return fail_response("locksmith_aunlocked", "locksmith", "already_unlocked");
				}
				if (item.l == "s") {
					if (player.gold < 250000) {
						return fail_response("gold_not_enough");
					}
					player.gold -= 250000;
					item.ld = JSON.stringify(future_s(2 * 24 * 60 * 60));
					item.l = "u";
					socket.emit("game_response", "locksmith_unsealed");
				} else if (item.l == "u") {
					var date = new Date(JSON.parse(item.ld));
					if (date < new Date()) {
						delete item.l;
						socket.emit("game_response", "locksmith_unseal_complete");
					} else {
						resend(player, "reopen+nc");
						return success_response("locksmith_unsealing", { hours: -hsince(date), success: false, in_progress: true });
					}
				} else {
					if (player.gold < 250000) {
						return fail_response("gold_not_enough");
					}
					player.gold -= 250000;
					delete item.l;
					socket.emit("game_response", "locksmith_unlocked");
				}
			} else if (data.operation == "lock") {
				if (item.l) {
					resend(player, "reopen+nc");
					return fail_response("locksmith_alocked", "locksmith", "already_locked");
				}
				if (player.gold < 250000) {
					return fail_response("gold_not_enough");
				}
				player.gold -= 250000;
				item.l = "l";
				socket.emit("game_response", "locksmith_locked");
			} else if (data.operation == "seal") {
				if (player.gold < 250000) {
					return fail_response("gold_not_enough");
				}
				player.gold -= 250000;
				item.l = "s";
				socket.emit("game_response", "locksmith_sealed");
			}
			player.citems[data.num] = cache_item(player.items[data.num]);
			resend(player, "reopen+nc");
			success_response();
		});
		socket.on("compound", function (data) {
			try {
				var player = players[socket.id];
				var item0 = player.items[data.items[0]];
				var item1 = player.items[data.items[1]];
				var item2 = player.items[data.items[2]];
				var scroll = player.items[data.scroll_num];
				var result;
				var ex = "";
				if (!player || player.user) {
					return fail_response("cant_in_bank");
				}
				G.maps.main.compound.name = player.name;
				if (player.q.compound) {
					return fail_response("compound_in_progress", "compound", "in_progress");
				}
				var offering = player.items[data.offering_num];
				if (offering && G.items[offering.name].type != "offering") {
					return socket.emit("game_response", "compound_invalid_offering");
				}
				if (!scroll) {
					return socket.emit("game_response", "compound_no_scroll");
				}
				if (!item0 || (item0.level || 0) != data.clevel) {
					return fail_response("no_item");
				}
				if (!player.computer && simple_distance(G.maps.main.compound, player) > B.sell_dist) {
					return socket.emit("game_response", { response: "distance", place: "compound", failed: true });
				}
				var def = G.items[item0.name];
				var scroll_def = G.items[scroll.name];
				var offering_def = offering && G.items[offering.name];
				var grade = calculate_item_grade(def, item0);
				if (grade == 4) {
					return socket.emit("game_response", {
						response: "max_level",
						level: item.level,
						place: "compound",
						failed: true,
					});
				}
				if (
					!(
						item0.name == item1.name &&
						item1.name == item2.name &&
						(item0.level || 0) == (item1.level || 0) &&
						(item1.level || 0) == (item2.level || 0)
					)
				) {
					return socket.emit("game_response", "compound_mismatch");
				}
				if (!def.compound) {
					return socket.emit("game_response", "compound_cant");
				}
				if (scroll_def.type != "cscroll" || grade > scroll_def.grade) {
					return socket.emit("game_response", "compound_incompatible_scroll");
				}
				if (data.items[0] == data.items[1] || data.items[1] == data.items[2] || data.items[0] == data.items[2]) {
					return socket.emit("game_response", { response: "misc_fail", place: "compound", failed: true });
				}
				if (item0.l || item1.l || item2.l) {
					return socket.emit("game_response", { response: "item_locked", place: "compound", failed: true });
				}

				if (!data.calculate) {
					consume_one(player, data.scroll_num);
				}

				var new_level = (item0.level || 0) + 1;
				var probability = 1;
				var oprobability = 1;
				var result = 0;
				var proc = 0;
				var grace = 0;
				var igrade = def.igrade;
				var high = false;
				var grace_bonus = 0;
				if (item0.level >= 3) {
					igrade = calculate_item_grade(def, { name: item0.name, level: item0.level - 2 });
				}

				delete player.p.c_item;
				delete player.p.c_itemx;
				delete player.p.c_roll;

				oprobability = probability = D.compounds[igrade][new_level];
				result = Math.random();
				server_log(result + " < " + probability);

				if (scroll_def.grade > grade) {
					probability = probability * 1.1 + 0.001;
					server_log("higher grade scroll " + result + " < " + probability);
					if (!data.calculate) {
						grace_bonus += 0.4;
					}
					high = scroll_def.grade - grade;
				}

				if (offering) {
					var increase = 0.5;
					if (!data.calculate) {
						consume_one(player, data.offering_num);
					}
					grace = 0.027 * ((item0.grace || 0) + (item1.grace || 0) + (item2.grace || 0) + 0.5 + player.p.ograce);

					if (offering_def.grade > grade + 1) {
						probability = probability * 1.64 + grace * 2;
						high = true;
						increase = 3;
					} else if (offering_def.grade > grade) {
						probability = probability * 1.48 + grace;
						high = true;
						increase = 1;
					} else if (offering_def.grade == grade) {
						probability = probability * 1.36 + min(30 * 0.027, grace);
					} else if (offering_def.grade == grade - 1) {
						probability = probability * 1.15 + min(25 * 0.019, grace) / max(item0.level - 2, 1);
						increase = 0.2;
					} else {
						probability = probability * 1.08 + min(15 * 0.015, grace) / max(item0.level - 1, 1);
						increase = 0.1;
					}

					if (!data.calculate) {
						item0.grace = (item0.grace || 0) + (item1.grace || 0) + (item2.grace || 0);
						grace_bonus += increase;
					}
					server_log("offering " + result + " < " + probability);
				} else {
					grace = 0.007 * ((item0.grace || 0) + (item1.grace || 0) + (item2.grace || 0) + player.p.ograce);
					probability = probability + min(25 * 0.007, grace) / max(item0.level - 1, 1);
					if (!data.calculate) {
						item0.grace = max(max(item0.grace || 0, item1.grace || 0), item2.grace || 0);
					}
				}

				if (!data.calculate) {
					item0.grace = item0.grace / 6.4 + grace_bonus;
				}

				if (def.type == "booster") {
					probability = 0.9999999999999;
					proc = offering && 0.12;
				} else {
					probability = min(
						probability,
						min(oprobability * (3 + ((high && high * 0.6) || 0)), oprobability + 0.2 + ((high && high * 0.05) || 0)),
					);
				}

				if (gameplay == "test") {
					result = 0;
				}

				server_log(result + " < " + probability + " grace: " + grace);

				if (data.calculate) {
					return success_response("compound_chance", {
						calculate: true,
						chance: probability,
						item: cache_item(item0),
						scroll: scroll.name,
						offering: (offering && offering.name) || undefined,
						grace: (item0.grace || 0) + (item1.grace || 0) + (item2.grace || 0),
					});
				}

				player.p.c_roll = result;
				var len = 10000;
				if (gameplay == "hardcore") {
					len = 1200;
				}
				if (player.s.massproduction) {
					len /= 2;
					delete player.s.massproduction;
					ex = "+u+cid";
				}
				if (player.s.massproductionpp) {
					len /= 10;
					delete player.s.massproductionpp;
					ex = "+u+cid";
				}
				player.q.compound = { ms: len, len: len, num: data.items[0], nums: [] };
				player.items[data.items[0]] = {
					name: "placeholder",
					p: {
						chance: probability,
						name: item0.name,
						level: item0.level,
						scroll: scroll.name,
						offering: offering && offering.name,
						nums: [],
					},
				};
				player.items[data.items[1]] = null;
				player.items[data.items[2]] = null;

				if (result <= probability) {
					if (offering) {
						player.p.ograce = 0;
					} else {
						player.p.ograce *= 1 - new_level * 0.02;
					}
					item0.level = new_level;
					if ((item0.p || item1.p || item2.p) != "legacy") {
						item0.p = item0.p || item1.p || item2.p;
					} else {
						delete item0.p;
					}
					player.p.c_item = item0;
					if (item0.oo != player.name) {
						item0.o = player.name;
					}
					player.esize += 2;
					if (parseInt(result * 10000) == parseInt(probability * 10000)) {
						// && grade>=1
						add_achievement(player, "lucky");
						add_item_property(item0, "lucky");
					}
					if (item1.v || item2.v) {
						item0.v = item1.v || item2.v;
					}
					if (item0.name == "ctristone" && item0.level == 1 && Math.random() < 0.012) {
						item0.name = "cdarktristone";
					}
					if (def.type == "booster") {
						var activate = false;
						item0.extra = 0;
						while (offering && proc && Math.random() < proc) {
							item0.extra++;
							item0.level += 1;
							proc /= 2.0;
						}
						var seconds = 6 * 24 * 60 * 60;
						[item0, item1, item2].forEach(function (i) {
							if (i.expires) {
								seconds -= ssince(i.expires);
								activate = true;
							} else {
								seconds += def.days * 24 * 60 * 60;
							}
						});
						if (activate) {
							item0.expires = future_s(seconds / 3);
						}
					}
				} else {
					if (offering) {
						player.p.ograce += 0.4;
					}
					player.esize += 2;
					player.p.c_item = null;
					player.p.c_itemx = item0;
				}

				player.citems[data.items[0]] = cache_item(player.items[data.items[0]]);
				player.citems[data.items[1]] = cache_item(player.items[data.items[1]]);
				player.citems[data.items[2]] = cache_item(player.items[data.items[2]]);

				resend(player, "reopen+nc+inv" + ex);
			} catch (e) {
				server_log("compound_e " + e);
				return socket.emit("game_response", { response: "exception", place: "compound", failed: true });
			}
		});
		socket.on("upgrade", function (data) {
			try {
				var player = players[socket.id];
				var item = player.items[data.item_num];
				var scroll = player.items[data.scroll_num];
				var offering = player.items[data.offering_num];
				var result;
				var ex = "";
				if (!player || player.user) {
					return fail_response("cant_in_bank");
				}
				if (player.q.upgrade) {
					return socket.emit("game_response", "upgrade_in_progress");
				}
				G.maps.main.upgrade.name = player.name;
				if (!player.computer && simple_distance(G.maps.main.upgrade, player) > B.sell_dist) {
					return socket.emit("game_response", { response: "distance", place: "upgrade", failed: true });
				}
				if (!item) {
					return socket.emit("game_response", "upgrade_no_item");
				}
				if (
					offering &&
					!(
						(G.items[offering.name] && G.items[offering.name].type == "offering") ||
						(G.items[offering.name] && G.items[offering.name].offering !== undefined && !(item.level > 0))
					)
				) {
					return socket.emit("game_response", "upgrade_invalid_offering");
				}
				if (!scroll && !offering) {
					return socket.emit("game_response", "upgrade_no_scroll");
				}
				if ((item.level || 0) != data.clevel) {
					return socket.emit("game_response", "upgrade_mismatch");
				}
				var item_def = G.items[item.name];
				var scroll_def = scroll && G.items[scroll.name];
				var offering_def = offering && G.items[offering.name];
				var grade = calculate_item_grade(item_def, item);
				if (!item_def.upgrade) {
					return socket.emit("game_response", "upgrade_cant");
				}
				if (
					scroll &&
					(!in_arr(scroll_def.type, ["uscroll", "pscroll"]) ||
						(scroll_def.type == "uscroll" && !item_def.upgrade) ||
						(scroll_def.type == "pscroll" && !item_def.stat) ||
						grade > scroll_def.grade)
				) {
					if (grade == 4 && scroll_def.type == "uscroll") {
						return socket.emit("game_response", {
							response: "max_level",
							level: item.level,
							place: "upgrade",
							failed: true,
						});
					}
					return socket.emit("game_response", "upgrade_incompatible_scroll");
				}

				var new_level = (item.level || 0) + 1;
				var probability = 1;
				var oprobability = 1;
				var grace = 0;
				var high = false;
				var ograde = calculate_item_grade(item_def, { name: item.name, level: 0 });
				var tmult = 1;
				if (ograde == 1) {
					tmult = 1.5;
				} else if (ograde == 2) {
					tmult = 2;
				}

				delete player.p.u_item;
				delete player.p.u_type;
				delete player.p.u_itemx;
				delete player.p.u_roll;
				delete player.p.u_fail;
				delete player.p.u_level;

				player.p.u_level = item.level || 0;

				if (!scroll) {
					if (G.items[offering.name] && G.items[offering.name].offering !== undefined) {
						var chance = 0.16;
						var ms = 2000;
						if (
							G.items[offering.name].offering > ograde ||
							(G.items[offering.name].offering == 2 && calculate_item_value(item) <= 20000000)
						) {
							chance = 0.32;
						}
						chance *= [2.8, 1.6, 1][ograde];
						if (G.items[offering.name].offering < ograde) {
							return socket.emit("game_response", "upgrade_invalid_offering");
						}
						if (data.calculate) {
							return success_response("upgrade_chance", {
								calculate: true,
								chance: chance,
								offering: offering.name,
								item: cache_item(item),
								grace: item.grace || 0,
							});
						}
						var result = Math.random();

						consume_one(player, data.offering_num);
						player.p.u_type = "normal";
						player.p.u_roll = result;
						if (player.s.massproduction) {
							ms /= 2;
							delete player.s.massproduction;
							ex = "+u+cid";
						}
						if (player.s.massproductionpp) {
							ms /= 10;
							delete player.s.massproductionpp;
							ex = "+u+cid";
						}
						player.q.upgrade = { ms: ms, len: ms, num: data.item_num, silent: true };
						player.items[data.item_num] = {
							name: "placeholder",
							p: {
								chance: chance,
								name: item.name,
								level: item.level,
								scroll: null,
								offering: offering.name,
								nums: [],
							},
						};

						if (result <= chance) {
							item.p = "shiny";
							player.p.u_item = item;
						} else {
							player.p.u_item = item;
							player.p.u_fail = true;
						}
					} else {
						var ms = 1000;
						if (data.calculate) {
							return success_response("upgrade_chance", {
								calculate: true,
								chance: 1,
								offering: offering.name,
								item: cache_item(item),
								grace: item.grace || 0,
							});
						}
						consume_one(player, data.offering_num);
						item.grace = (item.grace || 0) + 0.5;
						server_log("item.grace: " + item.grace);
						player.p.u_type = "offering";
						player.p.u_item = item;
						player.p.u_roll = 0.999999999999999;
						if (player.s.massproduction) {
							ms /= 2;
							delete player.s.massproduction;
							ex = "+u+cid";
						}
						if (player.s.massproductionpp) {
							ms /= 10;
							delete player.s.massproductionpp;
							ex = "+u+cid";
						}
						player.q.upgrade = { ms: ms, len: ms, num: data.item_num };
						player.items[data.item_num] = {
							name: "placeholder",
							p: { chance: 1, name: item.name, level: item.level, scroll: null, offering: offering.name, nums: [] },
						};
					}
				} else if (scroll_def.type == "uscroll") {
					if (item.l) {
						return socket.emit("game_response", { response: "item_locked", place: "upgrade", failed: true });
					}
					if (grade == 4) {
						return socket.emit("game_response", {
							response: "max_level",
							level: item.level,
							place: "upgrade",
							failed: true,
						});
					}
					if (!data.calculate) {
						consume_one(player, data.scroll_num);
					}
					oprobability = probability = D.upgrades[item_def.igrade][new_level];
					// grace=max(0,min(new_level+1, (item.grace||0) + min(3,player.p.ugrace[new_level]/3.0) +min(2,ugrace[new_level]/4.0) +item_def.igrace + player.p.ograce/2.0 )); - original [16/07/18]
					grace = max(
						0,
						min(new_level + 1, (item.grace || 0) + min(3, player.p.ugrace[new_level] / 4.5) + item_def.igrace) +
							min(6, S.ugrace[new_level] / 3.0) +
							player.p.ograce / 3.2,
					);
					server_log(
						"Grace num: " +
							grace +
							"\nItem: " +
							(item.grace || 0) +
							"\nPlayer: " +
							min(3, player.p.ugrace[new_level] / 4.5) +
							"\nDef: " +
							item_def.igrace +
							"\nOgrace:" +
							player.p.ograce / 3.2 +
							"\nS.ugrace: " +
							min(6, S.ugrace[new_level] / 3.0),
					);
					grace = (probability * grace) / new_level + grace / 1000.0;
					server_log("Grace-prob: " + grace);
					result = Math.random();
					server_log(result + " < " + probability);

					// if(!data.calculate && item.name=="throwingstars" && scroll_def.grade==2 && item.level==4) item.p="superfast";

					if (scroll_def.grade > grade && new_level <= 10) {
						probability = probability * 1.2 + 0.01;
						high = true;
						if (!data.calculate) {
							item.grace = (item.grace || 0) + 0.4;
						}
					}

					if (offering) {
						var increase = 0.4;
						if (!data.calculate) {
							consume_one(player, data.offering_num);
						}

						if (offering_def.grade > grade + 1) {
							probability = probability * 1.7 + grace * 4;
							high = true;
							increase = 3;
						} else if (offering_def.grade > grade) {
							probability = probability * 1.5 + grace * 1.2;
							high = true;
							increase = 1;
						} else if (offering_def.grade == grade) {
							probability = probability * 1.4 + grace;
						} else if (offering_def.grade == grade - 1) {
							probability = probability * 1.15 + grace / 3.2;
							increase = 0.2;
						} else {
							probability = probability * 1.08 + grace / 4;
							increase = 0.1;
						}

						if (!data.calculate) {
							item.grace = (item.grace || 0) + increase;
						} // previously +1 [16/07/18]
					} else {
						grace = max(0, grace / 4.8 - 0.4 / ((new_level - 0.999) * (new_level - 0.999)));
						probability += grace; // previously 12.0 // previously 9.0 [16/07/18]
					}

					if (!data.calculate && Math.random() < 0.025) {
						// Bonus grace
						item.grace = (item.grace || 0) + 1;
					}

					if (data.item_num == player.p.item_num && Math.random() < 0.6) {
						// Added [29/10/17]
						server_log("16 cheat");
						result = max(Math.random() / 10000.0, result * 0.975 - 0.012);
					}

					if (high) {
						probability = min(probability, min(oprobability + 0.36, oprobability * 3));
					} else {
						probability = min(probability, min(oprobability + 0.24, oprobability * 2));
					}
					server_log(result + " < " + probability + " grace: " + grace);

					if (data.calculate) {
						return success_response("upgrade_chance", {
							calculate: true,
							chance: probability,
							offering: (offering && offering.name) || undefined,
							item: cache_item(item),
							grace: item.grace || 0,
							scroll: scroll.name,
						});
					}

					if (gameplay == "test") {
						result = 0;
					}
					// result=probability;
					player.p.u_type = "normal";
					player.p.u_roll = result;
					var ms = 500 * new_level * Math.sqrt(new_level) * tmult;
					if (player.s.massproduction) {
						ms /= 2;
						delete player.s.massproduction;
						ex = "+u+cid";
					}
					if (player.s.massproductionpp) {
						ms /= 10;
						delete player.s.massproductionpp;
						ex = "+u+cid";
					}
					player.q.upgrade = { ms: ms, len: ms, num: data.item_num };
					if (gameplay == "hardcore") {
						player.q.upgrade.ms = player.q.upgrade.len = 500;
					}
					player.items[data.item_num] = {
						name: "placeholder",
						p: {
							chance: probability,
							name: item.name,
							level: item.level,
							scroll: scroll.name,
							offering: offering && offering.name,
							nums: [],
						},
					};

					//result=probability+EPS;

					if (result <= probability) {
						// console.log("here");
						player.p.ugrace[new_level] = S.ugrace[new_level] = 0;
						if (offering) {
							player.p.ograce *= 0.25;
						} else {
							player.p.ograce *= 1 - new_level * 0.005;
						}
						item.level = new_level;
						if (item.oo != player.name) {
							item.o = player.name;
						}
						player.p.u_item = item;
						if (parseInt(result * 10000) == parseInt(probability * 10000) && grade >= 1) {
							add_item_property(item, "lucky");
							add_achievement(player, "lucky");
						}
					} else {
						player.p.ugrace[new_level - 1] += 1;
						S.ugrace[new_level - 1] += 1;
						player.p.ugrace[new_level] += 1;
						S.ugrace[new_level] += 1;
						if (new_level >= 8 && new_level <= 15) {
							player.p.ugrace[new_level - 1] += 1;
							S.ugrace[new_level - 1] += 1;
							player.p.ugrace[new_level - 2] += 2 + ((offering && 1) || 0);
							S.ugrace[new_level - 2] += 2;
							player.p.ugrace[new_level - 3] += 2 + ((offering && 2) || 0);
							S.ugrace[new_level - 3] += 3 + ((offering && 1) || 0);
						}
						if (offering) {
							player.p.ograce += 0.6;
						} // previously 1 [16/07/18]
						if (scroll_def.grade != 3.6) {
							player.p.u_itemx = item;
						} else {
							player.p.u_item = item;
							player.p.u_fail = true;
						}
						if (parseInt(result * 10000) == parseInt(probability * 10000)) {
							if (player.esize && grade >= 1) {
								add_item(player, "essenceofgreed");
							}
							add_achievement(player, "unlucky");
						}
					}
				} else if (scroll_def.type == "pscroll") {
					var needed = [1, 10, 100, 1000, 9999, 9999, 9999];
					if (scroll.q < needed[grade]) {
						return socket.emit("game_response", { response: "upgrade_scroll_q", q: needed[grade], h: scroll.q });
					}
					if (!data.calculate) {
						consume(player, data.scroll_num, needed[grade]);
					}

					if (data.calculate) {
						return success_response("upgrade_chance", {
							calculate: true,
							chance: 0.99999,
							scroll: scroll.name,
							item: cache_item(item),
							grace: item.grace || 0,
						});
					}

					if (offering) {
						consume_one(player, data.offering_num);
						item.grace = (item.grace || 0) + 1;
						server_log("Graced up to " + item.grace);
					}

					item.stat_type = scroll_def.stat;
					player.p.u_roll = Math.random();

					player.p.u_type = "stat";
					if (player.p.u_roll <= 0.99999 || offering) {
						player.p.u_item = item;
					} else {
						player.p.u_itemx = item;
					}
					var ms = 2000 * tmult * tmult;
					if (player.s.massproduction) {
						ms /= 2;
						delete player.s.massproduction;
						ex = "+u+cid";
					}
					if (player.s.massproductionpp) {
						ms /= 10;
						delete player.s.massproductionpp;
						ex = "+u+cid";
					}
					player.q.upgrade = { ms: ms, len: ms, num: data.item_num };
					player.items[data.item_num] = {
						name: "placeholder",
						p: {
							chance: 0.99999,
							name: item.name,
							level: item.level,
							scroll: scroll.name,
							offering: offering && offering.name,
							nums: [],
						},
					};
				}

				player.citems[data.item_num] = cache_item(player.items[data.item_num]);

				resend(player, "reopen+nc+inv" + ex);
			} catch (e) {
				server_log("upgrade_e " + e);
				return socket.emit("game_response", { response: "exception", place: "upgrade", failed: true });
			}
		});
		socket.on("equip", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			player.c = {};
			data.num = to_number(data.num);
			if (data.num >= player.items.length) {
				return fail_response("invalid");
			}
			var item = player.items[data.num];
			if (!item) {
				return fail_response("no_item");
			}
			if (item.b) {
				return fail_response("item_blocked");
			}
			if (item.name == "placeholder") {
				return fail_response("item_placeholder");
			}
			var def = G.items[item.name];
			var to_update = "reopen+u+cid";
			var resolve = { num: data.num };
			var resolve_type = "data";
			def.iname = item.name; //just for orb name checks [08/10/16]
			if (!def) {
				return fail_response("no_item");
			}
			// if(is_sdk) server_log("Trying to equip "+JSON.stringify(data));

			if (data.slot && get_trade_slots(player).includes(data.slot) && !data.consume) {
				if (item.acl || item.v) {
					return fail_response("item_locked");
				}
				var slot = data.slot;
				var price = round(min(99999999999, max(parseInt(data.price) || 1, 1)));
				var minutes = 1;
				data.q = max(1, parseInt(data.q) || 1);
				if ((item.q || 1) < data.q) {
					return fail_response("not_enough");
				}
				if (data.giveaway) {
					minutes = max(
						5,
						min(600, min(parseInt(data.minutes) || 5, max(60, round((calculate_item_value(item) * data.q) / 40000)))),
					);
				}
				if (!price || data.giveaway) {
					price = 1;
				}
				if (player.slots[slot]) {
					return fail_response("slot_occuppied");
				}
				if (def.s) {
					player.slots[slot] = create_new_item(player.items[data.num].name, 1);
					player.slots[slot].price = price;
					player.slots[slot].q = data.q;
					player.slots[slot].rid = randomStr(4);
					if (player.items[data.num].data) {
						player.slots[slot].data = player.items[data.num].data;
					}
					if (data.giveaway) {
						player.slots[slot].giveaway = minutes;
						player.slots[slot].list = [];
						player.giveaway = true;
					}
					player.cslots[slot] = cache_item(player.slots[slot], true);
					consume(player, data.num, data.q);
					if (data.giveaway) {
						socket.emit("game_log", "Listed " + data.q + " " + item_name(player.slots[slot]) + " to giveaway!");
					} else {
						socket.emit(
							"game_log",
							"Listed " + data.q + " " + item_name(player.slots[slot]) + " at " + to_pretty_num(price) + " gold each",
						);
					}
				} else {
					player.items[data.num].price = price;
					player.items[data.num].rid = randomStr(4);
					player.slots[slot] = player.items[data.num];
					if (data.giveaway) {
						player.slots[slot].giveaway = minutes;
						player.slots[slot].list = [];
						player.giveaway = true;
					}
					player.cslots[slot] = cache_item(player.slots[slot], true);
					player.items[data.num] = null;
					player.citems[data.num] = null;
					if (data.giveaway) {
						socket.emit("game_log", "Listed " + item_name(player.slots[slot]) + " to giveaway!");
					} else {
						socket.emit(
							"game_log",
							"Listed " + item_name(player.slots[slot]) + " at " + to_pretty_num(price) + " gold",
						);
					}
				}
				resolve.slot = slot;
			} else if (def.type == "elixir") {
				if (item.l) {
					return fail_response("item_locked");
				}
				if (player.slots.elixir && G.items[player.slots.elixir.name].withdrawal) {
					add_condition(player, G.items[player.slots.elixir.name].withdrawal);
				}
				if (player.slots.elixir && player.slots.elixir.name == item.name) {
					player.slots.elixir.expires = future_s(def.duration * 60 * 60 - ssince(player.slots.elixir.expires) * 0.975);
				} else {
					player.slots.elixir = { name: item.name, expires: future_s(def.duration * 60 * 60), ex: true };
				}
				if (G.items[item.name] && G.items[item.name].withdrawal && player.s.withdrawal) {
					delete player.s.withdrawal;
				}
				player.cslots.elixir = cache_item(player.slots.elixir);
				consume_one(player, data.num);
				resolve_type = "elixir";
			} else if (item.name == "cxjar") {
				if (!item.data || item.l) {
					return fail_response("item_locked");
				}
				player.p.acx[item.data] = (player.p.acx[item.data] || 0) + 1;
				socket.emit("game_response", { response: "cx_new", acx: player.p.acx, name: item.data, from: "cxjar" });
				consume_one(player, data.num);
			} else if (item.name == "emotionjar") {
				if (!item.data || item.l) {
					return fail_response("item_locked");
				}
				player.p.emx[item.data] = (player.p.emx[item.data] || 0) + 1;
				socket.emit("game_response", {
					response: "emotion_new",
					emx: player.p.emx,
					name: item.data,
					from: "emotionjar",
				});
				consume_one(player, data.num);
			} else if (def.type == "licence") {
				if (item.l) {
					return fail_response("item_locked");
				}
				player.s.licenced = { ms: ((player.s.licenced && player.s.licenced.ms) || 0) + 7 * 60 * 1000 };
				consume_one(player, data.num);
			} else if (def.type == "spawner") {
				new_monster(player.in, { type: def.spawn, stype: "trap", x: player.x, y: player.y, owner: player.name });
				consume_one(player, data.num);
			} else if (def.gives) {
				if (player.last.potion && mssince(player.last.potion) < 0) {
					return fail_response("not_ready");
				}
				if (item.l) {
					return fail_response("item_locked");
				}
				var timeout = 2000;
				var timeout_ui = null;
				var xp = false;
				consume_one(player, data.num);
				(def.gives || []).forEach(function (p) {
					var amount = p[1];
					if (player.s.poisoned) {
						amount = round(amount / 2);
					}
					player[p[0]] = (player[p[0]] || 0) + amount;
					player[p[0]] = max(1, player[p[0]]);
					if (p[0] == "hp") {
						if (amount > 0) {
							disappearing_text(socket, player, "+" + amount, { color: "hp", xy: 1, s: "hp" });
						} else {
							disappearing_text(socket, player, amount, { color: "hp", xy: 1, s: "hp" });
						}
					}
					if (p[0] == "mp") {
						disappearing_text(socket, player, "+" + amount, { color: "mp", xy: 1, s: "mp" });
					}
					if (p[0] == "xp") {
						disappearing_text(socket, player, "+1M", { color: "1mxp", xy: 1, s: "xp", size: "large" });
						xp = true;
						timeout_ui = 120;
						timeout = 0.1;
					}
				});
				if (def.debuff) {
					for (var c in player.s) {
						if (G.conditions[c] && G.conditions[c].debuff && (!G.conditions[c].persistent || c == "hopsickness")) {
							delete player.s[c];
						}
					}
				}
				player.hp = min(player.hp, player.max_hp);
				player.mp = min(player.mp, player.max_mp);
				if (def.cooldown) {
					timeout = def.cooldown;
				}
				player.last.potion = future_ms(timeout);
				if (!xp) {
					to_update = "u+cid+reopen+nc";
				}
				socket.emit("eval", { code: "pot_timeout(" + (timeout_ui || timeout) + ")" });
			} else if (!data.consume) {
				// console.log(data);
				var slot = data.slot || def.type;
				var existing;
				var comp = can_equip_item(player, def, slot);
				if (comp == "no") {
					resend(player, "u+cid+reopen"); // if you drop something on an invalid slot, it stays there for a bit otherwise [29/08/22]
					return fail_response("cant_equip");
				}
				slot = comp;
				existing = player.slots[slot];
				player.slots[slot] = player.items[data.num];
				player.cslots[slot] = cache_item(player.slots[slot]);
				if (existing && existing.b) {
					existing = null;
				}
				player.items[data.num] = existing;
				player.citems[data.num] = cache_item(existing);
				player.s.penalty_cd = { ms: min(((player.s.penalty_cd && player.s.penalty_cd.ms) || 0) + 120, 120000) };
				resolve.slot = slot;
			} else {
				return fail_response("cant_consume");
			}

			if (to_update) {
				resend(player, to_update);
			}
			success_response(resolve_type, resolve);
		});
		socket.on("misc_npc", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var npc = players[data.npc];
			if (!npc || !npc.npc) {
				return;
			}
			if (simple_distance(player, npc) > 1000) {
				return socket.emit("game_response", "distance");
			}
			if (data.npc == NPC_prefix + "Marven" && npc.misc == true) {
				server_log("Here!");
			}
		});
		socket.on("unequip", function (data) {
			var player = players[socket.id];
			if (!player || !data.slot || !player.slots[data.slot]) {
				return fail_response("invalid");
			}
			if (data.slot == "elixir") {
				return fail_response("cant");
			}
			var item = player.slots[data.slot];
			var done = false;
			if (in_arr(data.slot, trade_slots) && item.giveaway !== undefined) {
				return fail_response("giveaway");
			}
			// an oversight allowed .giveaway items to be equipped, so now they can be unequipped from regular slots [04/11/21]
			if (player.esize <= 0 && !item.b) {
				return fail_response("no_space");
			}
			player.slots[data.slot] = null;
			player.cslots[data.slot] = null;
			player.c = {};
			if (!item.b) {
				add_item(player, item, { announce: false });
			}
			resend(player, "reopen+u+cid");
			success_response("data");
		});
		socket.on("secondhands", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (simple_distance(G.maps.main.ref.secondhands, player) > 500) {
				return socket.emit("game_response", "distance");
			}
			socket.emit("secondhands", csold);
		});
		socket.on("lostandfound", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data == "info") {
				return socket.emit("game_response", { response: "lostandfound_info", gold: S.gold });
			}
			if (!player.donation) {
				return socket.emit("game_response", "lostandfound_donate");
			}
			if (simple_distance(G.maps.woffice.ref.lostandfound, player) > 500) {
				return socket.emit("game_response", "distance");
			}
			socket.emit("lostandfound", cfound);
		});
		socket.on("split", function (data) {
			var player = players[socket.id];
			var num = data.num;
			var item = player.items[data.num];
			var quantity = min(max(parseInt(data.quantity) || 0, 1), (item && item.q) || 1);
			if (!item) {
				return fail_response("no_item");
			}
			if (!G.items[item.name].s) {
				return fail_response("invalid");
			}
			quantity = min(quantity, G.items[item.name].s || 1);
			if (!player.esize) {
				return fail_response("cant_space");
			}
			if (item.q == quantity) {
				return success_response();
			}
			if (item.name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (item.l) {
				return fail_response("item_locked");
			}
			if (item.b) {
				return fail_response("item_blocked");
			}

			consume(player, data.num, quantity);

			var new_item = cache_item(item);
			if (item.q) {
				new_item.q = quantity;
			}

			for (var i = 0; i < player.isize; i++) {
				if (!player.items[i]) {
					player.items[i] = new_item;
					player.citems[i] = cache_item(new_item);
					break;
				}
			}
			resend(player, "reopen");
			success_response();
		});
		socket.on("sell", function (data) {
			var player = players[socket.id];
			var num = data.num;
			var item = player.items[data.num];
			var quantity = min(max(parseInt(data.quantity) || 0, 1), (item && item.q) || 1);
			var can_reach = false;
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!item) {
				return fail_response("no_item");
			}
			if (item.name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (item.l) {
				return fail_response("item_locked");
			}
			if (item.b) {
				return fail_response("item_blocked");
			}
			(G.maps[player.map].merchants || []).forEach(function (m) {
				if (simple_distance(player, m) < B.sell_dist) {
					can_reach = m;
				}
			});
			if (player.computer && !can_reach) {
				can_reach = G.maps.main.merchants[0];
			}
			if (!can_reach) {
				return fail_response("distance");
			}
			can_reach.name = player.name;
			var value = calculate_item_value(item);
			consume(player, data.num, quantity);
			player.gold += value * quantity;
			var new_item = cache_item(item);
			if (item.q) {
				new_item.q = quantity;
			}
			xy_emit(can_reach, "ui", {
				type: "-$",
				id: can_reach.id,
				name: player.name,
				item: new_item,
				num: num,
				event: "sell",
			});
			resend(player, "reopen+nc+inv");
			success_response("gold_received", { gold: value * quantity, item: new_item, cevent: "sell" });
			secondhands_logic(item, quantity); // In the end, so if this fails, the "sell" still succeeds - otherwise it could cause a infinite gold loophole [10/07/18]
		});
		socket.on("buy_shells", function (data) {
			return socket.emit("game_log", "No longer possible");
			var player = players[socket.id];
			if (!player || player.user || gameplay == "hardcore" || gameplay == "test") {
				return game_response("cant_in_bank");
			}
			var gold = parseInt(data.gold) || 0;
			if (gold < 1000000 || gold > player.gold) {
				return socket.emit("game_response", "not_enough_gold");
			}
			var shells = Math.floor(gold / G.multipliers.shells_to_gold);
			player.gold -= gold;
			socket.emit("game_log", "Gave " + to_pretty_num(gold) + " gold");
			appengine_call(
				"bill_user",
				{ auth: player.auth, amount: -shells, reason: "buy_shells", name: player.name },
				function (result) {
					server_log("buy_with_cash: " + JSON.stringify(result));
					if (result.failed || !result.done) {
						socket.emit("game_log", "Purchase failed");
						return;
					}
					player.cash = result.cash;
					socket.emit("game_log", "Received " + to_pretty_num(shells) + " shells");

					resend(player, "reopen+nc");
				},
			);
			resend(player, "reopen+nc");
		});
		socket.on("buy_with_cash", function (data) {
			var player = players[socket.id];
			var name = data.name;
			var def = G.items[data.name];
			var quantity = min(max(parseInt(data.quantity) || 0, 1), (def && def.s) || 9999);
			if (!player || player.user || gameplay == "hardcore" || gameplay == "test") {
				return fail_response("cant_in_bank");
			}
			var cost = def.cash * quantity;
			if (!def.cash || def.ignore) {
				return fail_response("invalid");
			}
			if (def.p2w) {
				return fail_response("invalid");
			}
			if (!def.s) {
				quantity = 1;
			}
			if (!can_add_item(player, create_new_item(name, quantity))) {
				return fail_response("no_space");
			}
			appengine_call(
				"bill_user",
				{ auth: player.auth, amount: cost, reason: data.name, name: player.name },
				function (result) {
					server_log("buy_with_cash: " + JSON.stringify(result));
					if (result.failed || !result.done) {
						socket.emit("game_log", "Purchase failed");
						return;
					}
					player.cash = result.cash;
					var new_item = create_new_item(name, quantity);
					var done = false;
					add_item(player, new_item, { announce: false });
					socket.emit("game_log", "Spent " + to_pretty_num(cost) + " shells");

					resend(player, "reopen+nc+inv");
				},
			);
			success_response({ success: false, in_progress: true });
		});
		socket.on("sbuy", function (data) {
			var player = players[socket.id];
			var done = false;
			var npc = G.maps.main.ref.secondhands;
			var c = S.sold;
			var cc = csold;
			var e = "+$p";
			var ev = "secondhands";
			var mult = 2;
			var src = "scnd";
			if (data.f) {
				npc = G.maps.woffice.ref.lostandfound;
				c = S.found;
				cc = cfound;
				e = "+$f";
				ev = "lostandfound";
				mult = 4;
				src = "lost";
			}
			if (!player || player.user) {
				return game_response("cant_in_bank");
			}
			if (player.s.hopsickness && ev == "lostandfound") {
				return fail_response("cant_when_sick", { goblin: true });
			}
			if (simple_distance(npc, player) > 500) {
				return socket.emit("game_response", "distance");
			}
			for (var i = 0; i < c.length; i++) {
				if (c[i].rid == data.rid) {
					if (mult == 2 && G.items[c[i].name].cash) {
						mult = 3;
					}
					var gold = calculate_item_value(c[i]) * mult * (c[i].q || 1);
					var item = c[i];
					if (!can_add_item(player, c[i])) {
						return disappearing_text(socket, player, "NO SPACE");
					}
					if (gold > player.gold) {
						return socket.emit("game_response", "buy_cost");
					}
					player.gold -= gold;
					item.src = src;
					add_item(player, c[i], { announce: false });
					c.splice(i, 1);
					cc.splice(i, 1);
					socket.emit("game_log", "Spent " + to_pretty_num(gold) + " gold");
					resend(player, "reopen+nc+inv");
					socket.emit(ev, cc);
					done = true;
					xy_emit(npc, "ui", { type: e, id: npc.id, name: player.name, item: cache_item(item, 1) });
					break;
				}
			}
			if (!done) {
				return socket.emit("game_log", "Item gone");
			}
		});
		socket.on("buy", function (data) {
			var player = players[socket.id];
			var can_reach = false;
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			var name = data.name;
			var quantity = min(max(parseInt(data.quantity) || 0, 1), (G.items[name] && G.items[name].s) || 9999);
			var cost = 0;
			var added = false;
			var done = false;
			if (!can_buy[name] && gameplay != "test") {
				return fail_response("buy_cant_npc");
			}
			if (!can_add_item(player, create_new_item(name, quantity))) {
				return fail_response("buy_cant_space");
			}
			(G.maps[player.map].items[name] || []).forEach(function (l) {
				if (simple_distance(player, l) < B.sell_dist) {
					can_reach = l;
				}
			});
			if (player.computer && !can_reach) {
				can_reach = G.maps.main.merchants[0];
			}
			if (!can_reach) {
				return fail_response("distance");
			}
			can_reach.name = player.name;
			var def = G.items[name];
			if (!def.s) {
				quantity = 1;
			}
			cost = quantity * G.items[name].g;
			if (G.items[name].p2w) {
				cost *= G.inflation;
			}
			if (player.gold < cost) {
				return fail_response("buy_cost");
			}
			var new_item = create_new_item(name, quantity);
			player.gold -= cost;
			var num = add_item(player, new_item, { announce: false });
			xy_emit(can_reach, "ui", {
				type: "+$",
				id: can_reach.id,
				name: player.name,
				item: cache_item(new_item),
				event: "buy",
			});

			resend(player, "reopen+nc+inv");
			success_response("buy_success", { cost: cost, num: num, name: name, q: quantity, cevent: "buy" });
		});
		socket.on("send", function (data) {
			var player = players[socket.id];
			var receiver = players[name_to_id[data.name || ""]];
			var num;
			var s_item;
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!receiver || receiver.user) {
				return fail_response("receiver_unavailable");
			}
			if (distance(receiver, player, true) > B.dist || receiver.map != player.map) {
				return fail_response("distance");
			}
			if (data.num !== undefined) {
				data.num = max(0, parseInt(data.num) || 0);
				var item = player.items[data.num];
				if (!item) {
					return fail_response("send_no_item");
				}
				if (item.name == "placeholder") {
					return fail_response("item_placeholder");
				}
				if (item.l || (item.acl && receiver.owner != player.owner)) {
					return fail_response("item_locked");
				}
				if (item.b) {
					return fail_response("item_blocked");
				}
				data.q = min(item.q || 1, max(1, parseInt(data.q || 1) || 1));
				if (!data.q) {
					return fail_response("no_item");
				}
				if (!can_add_item(receiver, create_new_item(item.name, data.q))) {
					return fail_response("send_no_space");
				}
				if ((item.q || 1) == data.q) {
					player.items[data.num] = player.citems[data.num] = null;
					player.esize++;
				} else {
					player.items[data.num].q -= data.q;
					player.citems[data.num] = cache_item(player.items[data.num]);
				}

				if (item.q) {
					s_item = create_new_item(item.name, data.q);
					if (item.v) {
						s_item.v = item.v;
					}
					if (item.data) {
						s_item.data = item.data;
					}
					num = add_item(receiver, s_item, { announce: false });
				} else {
					s_item = item;
					num = add_item(receiver, item, { announce: false });
				}

				if (receiver.owner != player.owner) {
					item.src = "snd";
				}

				add_to_history(player, { name: "item", to: receiver.name, item: item.name, q: data.q, level: item.level });
				add_to_history(receiver, { name: "item", from: player.name, item: item.name, q: data.q, level: item.level });

				xy_emit(player, "ui", {
					type: "item_sent",
					receiver: receiver.name,
					sender: player.name,
					item: cache_item(s_item, null, { q: data.q }),
					num: num,
					fnum: data.num,
					event: true,
				});

				resend(player, "reopen+nc+inv");
				resend(receiver, "reopen+nc+inv");
				receiver.socket.emit("game_response", {
					response: "item_received",
					name: player.name,
					item: item.name,
					q: data.q,
					num: num,
					cevent: true,
				});
				player.socket.emit("game_response", {
					response: "item_sent",
					name: receiver.name,
					item: item.name,
					q: data.q,
					num: data.num,
					cevent: true,
					place: "send",
				});
			} else if (data.gold !== undefined) {
				data.gold = min(player.gold, max(1, parseInt(data.gold || 1) || 1)) || player.gold;
				if (!data.gold) {
					return fail_response("invalid");
				}
				player.gold -= data.gold;
				if (!is_same(player, receiver) && data.gold != 1) {
					data.gold = parseInt(data.gold * 0.975);
				}
				receiver.gold += data.gold;

				add_to_history(player, { name: "gold", to: receiver.name, amount: data.gold });
				add_to_history(receiver, { name: "gold", from: player.name, amount: data.gold });

				xy_emit(player, "ui", {
					type: "gold_sent",
					receiver: receiver.name,
					sender: player.name,
					gold: data.gold,
					event: true,
				});

				resend(player, "reopen+nc+inv");
				resend(receiver, "reopen+nc+inv");
				receiver.socket.emit("game_response", {
					response: "gold_received",
					name: player.name,
					gold: data.gold,
					cevent: true,
				});
				player.socket.emit("game_response", {
					response: "gold_sent",
					name: receiver.name,
					gold: data.gold,
					cevent: true,
					place: "send",
				});
			} else if (data.cx !== undefined) {
				var cxl = map_cx(player);
				var count = all_cx(player, 1);
				if (!(cxl[data.cx] && player.p.acx[cxl[data.cx]] && count[data.cx] > 0)) {
					return fail_response("send_no_cx");
				}
				// count[cxl[data.cx]] before [28/01/22]
				if (receiver.owner != player.owner) {
					return fail_response("send_diff_owner");
				}
				player.p.acx[cxl[data.cx]] -= 1;
				if (!player.p.acx[cxl[data.cx]]) {
					delete player.p.acx[cxl[data.cx]];
				}
				receiver.p.acx[cxl[data.cx]] = (receiver.p.acx[cxl[data.cx]] || 0) + 1;

				xy_emit(player, "ui", {
					type: "cx_sent",
					receiver: receiver.name,
					sender: player.name,
					cx: data.cx,
					event: true,
				});

				receiver.socket.emit("game_response", {
					response: "cx_received",
					name: player.name,
					cx: data.cx,
					acx: receiver.p.acx,
					cevent: true,
				});
				player.socket.emit("game_response", {
					response: "cx_sent",
					name: receiver.name,
					cx: data.cx,
					acx: player.p.acx,
					cevent: true,
					place: "send",
				});
			}
		});
		socket.on("donate", function (data) {
			var player = players[socket.id];
			var XPX = 3.2;
			if (!player || player.user) {
				return game_response("cant_in_bank");
			}
			var gold = max(1, min(parseInt(data.gold) || 0, 1000000000));
			if (gold > player.gold) {
				return socket.emit("game_response", "gold_not_enough");
			}
			if (gold >= 1000000) {
				response = "thx";
				player.donation = true;
			} else if (gold < 100000) {
				response = "low";
			} else {
				add_item(player, "gum");
				response = "gum";
			}
			if (S.gold < 500000000) {
				XPX = 4.8;
			} else if (S.gold <= 1000000000) {
				XPX = 4;
			}
			player.gold -= gold;
			S.gold += gold;
			if (gold >= 5000000) {
				lstack(S.logs.donate, { name: player.name, gold: gold, xp: XPX });
			}
			if (player.type == "merchant") {
				player.xp += parseInt(gold * XPX);
			}
			resend(player, "reopen");
			socket.emit("game_response", { response: "donate_" + response, gold: gold, xprate: XPX });
		});
		socket.on("destroy", function (data) {
			var player = players[socket.id];
			var add = "+nc+inv";
			data.num = max(0, parseInt(data.num) || 0);
			if (!player.items[data.num]) {
				return fail_response("no_item");
			}
			var item = player.items[data.num];
			var name = player.items[data.num].name;
			data.q = min(max(parseInt(data.q) || 0, 1), (item && item.q) || 1);
			if (item.name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (item.l) {
				return fail_response("item_locked");
			}
			if (item.b) {
				return fail_response("item_blocked");
			}
			if (item.level != 13) {
				consume(player, data.num, data.q);
				//player.items[data.num]=player.citems[data.num]=null;
			}
			if (data.statue) {
				if (item.name == "shadowstone") {
					add = "+u+cid";
					player.s.invis = { ms: 99999 };
				}
				if (G.items[item.name].upgrade && Math.random() < 1.0 / ((gameplay == "hardcore" && 10000) || 1000000)) {
					add = "+u+cid";
					item.level = 13;
					player.items[data.num] = item;
					player.citems[data.num] = cache_item(player.items[data.num]);
				}
				xy_emit(G.maps.spookytown.ref.poof, "upgrade", { type: "poof", success: 1 });
			}
			resend(player, "reopen" + add);
			success_response("destroyed", { name: name, place: "destroy", cevent: "destroy" });
		});
		socket.on("join_giveaway", function (data) {
			var player = players[socket.id];
			var seller = players[id_to_id[data.id]];
			var num;
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!in_arr(data.slot, trade_slots)) {
				return fail_response("invalid");
			}
			if (!seller || seller.npc || is_invis(seller)) {
				return fail_response("seller_gone");
			}
			if (seller.user) {
				return fail_response("cant_in_bank");
			}
			if (distance(seller, player, true) > B.dist || seller.map != player.map) {
				return fail_response("distance");
			}
			if (seller.id == player.id) {
				return fail_response("hmm");
			}
			var item = seller.slots[data.slot];
			if (!item || (data.rid && item.rid != data.rid)) {
				return fail_response("item_gone");
			}
			if (!item.giveaway) {
				return fail_response("sneaky");
			}
			if (!player.auth_id) {
				return fail_response("need_auth");
			}
			//if(item.list.includes(player.name)) return socket.emit("game_log","Already joined!");
			//if(player.type!="merchant") return socket.emit("game_log","Only merchants can join giveaways!");

			//item.list.push(player.name);

			item.registry = item.registry || {};
			item.registry[player.auth_id] = player.name;
			item.list = Object.values(item.registry);

			socket.emit("game_log", "Joined the giveaway!");
			seller.socket.emit("game_response", {
				response: "giveaway_join",
				name: player.name,
				slot: data.slot,
				cevent: true,
			});

			resend(player, "reopen");
			resend(seller, "reopen+u+cid");
			success_response({});
		});
		socket.on("trade_wishlist", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			data.q = min(9999, max(1, parseInt(data.q || 1) || 1));
			if (!in_arr(data.slot, trade_slots) || !G.items[data.name] || data.name == "placeholder") {
				return fail_response("invalid");
			}
			if (player.slots[data.slot] && !player.slots[data.slot].b) {
				return fail_response("slot_occuppied");
			}
			if (!get_trade_slots(player).includes(data.slot)) {
				return fail_response("invalid");
			}
			var item = {
				name: data.name,
				rid: randomStr(4),
				price: round(min(99999999999, max(parseInt(data.price) || 1, 1))),
				b: true,
			};
			if (G.items[data.name].upgrade || G.items[data.name].compound) {
				item.q = min(99, data.q);
				item.level = round(min(12, max(parseInt(data.level) || 0, 0)));
			} else {
				item.q = data.q;
			}
			player.slots[data.slot] = item;
			player.cslots[data.slot] = cache_item(player.slots[data.slot], true);
			resend(player, "reopen+u+cid+nc");
			success_response({});
		});
		socket.on("trade_sell", function (data) {
			// if(!is_sdk) return;
			var player = players[socket.id];
			var buyer = players[id_to_id[data.id]];
			var num;
			var actual = null;
			var num = null;
			data.q = max(1, parseInt(data.q || 1) || 1);
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!in_arr(data.slot, trade_slots)) {
				return fail_response("invalid");
			}
			if (!buyer || buyer.npc || is_invis(buyer)) {
				return fail_response("buyer_gone");
			}
			if (player.user) {
				return fail_response("cant_in_bank");
			}
			if (distance(buyer, player, true) > B.dist) {
				return fail_response("distance");
			}
			if (buyer.id == player.id) {
				return fail_response("hmm");
			}
			var item = buyer.slots[data.slot];
			if (!item || (data.rid && item.rid != data.rid)) {
				return fail_response("item_gone");
			}
			if (item.name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (!item.b && !B.rbugs) {
				return fail_response("sneaky");
			}
			if ((item.q || 1) < data.q) {
				return fail_response("dont_have_enough");
			}
			if (item.price * data.q > buyer.gold) {
				return fail_response("buyer_gold");
			}
			for (var i = 0; i < player.isize; i++) {
				if (
					player.items[i] &&
					player.items[i].name == item.name &&
					(player.items[i].q || 1) >= data.q &&
					player.items[i].level == item.level &&
					!player.items[i].l
				) {
					actual = player.items[i];
					num = i;
					break;
				}
			}
			if (!actual) {
				return fail_response("no_item");
			}
			if (actual.b) {
				return fail_response("item_blocked");
			}
			if (!can_add_item(buyer, create_new_item(item.name, data.q))) {
				return fail_response("trade_bspace");
			}
			var price = item.price * data.q;
			player.gold += round(price * (1 - player.tax));
			add_to_trade_history(player, "sell", buyer.name, cache_item(actual, true, { q: data.q }), price);
			buyer.gold -= price;
			add_to_trade_history(buyer, "buy", player.name, cache_item(actual, true, { q: data.q }), price);
			S.gold += price - round(price * (1 - player.tax));

			if ((item.q || 1) == data.q) {
				buyer.slots[data.slot] = buyer.cslots[data.slot] = null;
			} else {
				buyer.slots[data.slot].q -= data.q;
				buyer.cslots[data.slot] = cache_item(buyer.slots[data.slot], true);
			}

			// up to here

			if ((player.items[i].q || 1) == data.q) {
				player.items[num] = player.citems[num] = null;
			} else {
				player.items[num].q -= data.q;
				player.citems[num] = cache_item(player.items[num]);
			}

			if (G.items[item.name].s) {
				bnum = add_item(buyer, create_new_item(item.name, data.q), { announce: false });
			} else {
				bnum = add_item(buyer, actual, { announce: false });
			}

			if (player.type == "merchant") {
				merchant_xp_logic(player, buyer, price, price - round(price * (1 - player.tax)));
			}
			if (buyer.type == "merchant") {
				merchant_xp_logic(buyer, player, price, price - round(price * (1 - buyer.tax)));
			}

			socket.emit(
				"game_log",
				"Sales tax " + to_pretty_num(price - round(price * (1 - player.tax))) + " gold [" + player.tax * 100 + "%]",
			);
			socket.emit("game_log", "Received " + to_pretty_num(round(price * (1 - player.tax))) + " gold");
			buyer.socket.emit("game_log", "Spent " + to_pretty_num(price) + " gold");

			xy_emit(buyer, "ui", {
				type: "+$$",
				seller: player.name,
				buyer: buyer.name,
				item: cache_item(actual, true, { q: data.q, price: item.price }),
				slot: data.slot,
				num: bnum,
				snum: num,
			});

			resend(player, "reopen");
			resend(buyer, "reopen+u+cid");
			success_response({});
		});
		socket.on("trade_buy", function (data) {
			var player = players[socket.id];
			var seller = players[id_to_id[data.id]];
			var num;
			data.q = max(1, parseInt(data.q || 1) || 1);
			if (!player || player.user) {
				return fail_response("cant_in_bank");
			}
			if (!in_arr(data.slot, trade_slots)) {
				return fail_response("invalid");
			}
			if (!seller || seller.npc || is_invis(seller)) {
				return fail_response("seller_gone");
			}
			if (seller.user) {
				return fail_response("cant_in_bank");
			}
			if (distance(seller, player, true) > B.dist || seller.map != player.map) {
				return fail_response("distance");
			}
			if (seller.id == player.id) {
				return fail_response("hmm");
			}
			var item = seller.slots[data.slot];
			if (!item || (data.rid && item.rid != data.rid)) {
				return fail_response("item_gone");
			}
			if (item.name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (item.b || item.giveaway) {
				return fail_response("sneaky");
			}
			if (item.price * data.q > player.gold) {
				return fail_response("gold_not_enough");
			}
			if ((item.q || 1) < data.q) {
				return fail_response("insufficient_q");
			}
			if (!can_add_item(player, create_new_item(item.name, data.q))) {
				return fail_response("no_space");
			}
			var price = item.price * data.q;
			player.gold -= price;
			add_to_trade_history(player, "buy", seller.name, cache_item(seller.slots[data.slot], true, { q: data.q }), price);
			seller.gold += round(price * (1 - seller.tax));
			add_to_trade_history(
				seller,
				"sell",
				player.name,
				cache_item(seller.slots[data.slot], true, { q: data.q }),
				price,
			);
			S.gold += price - round(price * (1 - seller.tax));

			if ((item.q || 1) == data.q) {
				seller.slots[data.slot] = seller.cslots[data.slot] = null;
			} else {
				seller.slots[data.slot].q -= data.q;
				seller.cslots[data.slot] = cache_item(seller.slots[data.slot], true);
			}

			if (item.q) {
				num = add_item(player, create_new_item(item.name, data.q), { announce: false });
			} else {
				num = add_item(player, item, { announce: false });
			}

			if (seller.owner != player.owner) {
				item.src = "tb";
			}

			if (player.type == "merchant") {
				merchant_xp_logic(player, seller, price, price - round(price * (1 - player.tax)));
			}
			if (seller.type == "merchant") {
				merchant_xp_logic(seller, player, price, price - round(price * (1 - seller.tax)));
			}

			socket.emit("game_log", "Spent " + to_pretty_num(price) + " gold");
			seller.socket.emit(
				"game_log",
				"Sales tax " + to_pretty_num(price - round(price * (1 - seller.tax))) + " gold [" + seller.tax * 100 + "%]",
			);
			seller.socket.emit("game_log", "Received " + to_pretty_num(round(price * (1 - seller.tax))) + " gold");

			xy_emit(seller, "ui", {
				type: "+$$",
				seller: seller.name,
				buyer: player.name,
				item: cache_item(item, true, { q: data.q }),
				slot: data.slot,
				num: data.num,
			});

			resend(player, "reopen");
			resend(seller, "reopen+u+cid");
			success_response({});
		});
		socket.on("trade_history", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			server_log("trade_history: " + player.name);
			socket.emit("trade_history", player.p.trade_history || []);
		});
		socket.on("merchant", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var initial = player.p.stand;
			server_log("merchant: " + player.name);
			if (data.close || player.p.stand) {
				player.p.stand = false;
				for (var i = 0; i < player.items.length; i++) {
					if (player.items[i] && player.items[i].b == "stand") {
						delete player.items[i].b;
					}
				}
			}
			if (data.num !== undefined) {
				var item = player.items[data.num];
				if (item && G.items[item.name].stand) {
					player.p.stand = G.items[item.name].stand;
					item.b = "stand";
				} else {
					return fail_response("invalid");
				}
			}
			if (initial != player.p.stand) {
				// All unneccessary causes of resend's should be patched [03/08/18]
				reslot_player(player);
				resend(player, "u+cid");
			}
			success_response({});
		});
		socket.on("imove", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			data.a = max(0, parseInt(data.a) || 0);
			data.b = max(0, parseInt(data.b) || 0);
			if (data.a == data.b) {
				return fail_response("invalid");
			}
			var a = min(data.a, data.b);
			var b = max(data.a, data.b);
			var a_item;
			if (!(b < player.isize || b < player.items.length)) {
				return fail_response("invalid");
			}
			// while(b>=player.items.length) player.items.push(null); [22/11/16]
			if (player.items[a] && player.items[a].name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (player.items[b] && player.items[b].name == "placeholder") {
				return fail_response("item_placeholder");
			}
			if (can_stack(player.items[a], player.items[b])) {
				player.items[data.a].q = (player.items[a].q || 1) + (player.items[b].q || 1);
				player.items[data.b] = null;
				player.esize++;
			} else {
				a_item = player.items[a];
				player.items[a] = player.items[b];
				player.items[b] = a_item;
			}
			player.citems[data.a] = cache_item(player.items[data.a]);
			player.citems[data.b] = cache_item(player.items[data.b]);
			resend(player, "reopen+nc+inv");
			return success_response("data");
		});
		socket.on("bank", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (!player.user || player.mounting || player.unmounting) {
				return fail_response("bank_unavailable");
			}
			var success = {};
			if (data.operation == "withdraw") {
				var amount = max(0, min(parseInt(data.amount) || 0, player.user.gold));
				player.user.gold -= amount;
				player.gold += amount;
				success = { response: "bank_withdraw", gold: amount, cevent: true };
			}
			if (data.operation == "deposit") {
				var amount = max(0, min(parseInt(data.amount) || 0, player.gold));
				player.user.gold += amount;
				player.gold -= amount;
				success = { response: "bank_store", gold: amount, cevent: true };
			}
			if (data.operation == "unlock") {
				if (!bank_packs[data.pack]) {
					return fail_response("invalid");
				}
				var gold = bank_packs[data.pack][1];
				var shells = bank_packs[data.pack][2];
				if (!gold) {
					return fail_response("gold_not_enough");
				}
				if (player.user[data.pack]) {
					return fail_response("invalid");
				}
				if (data.gold) {
					if (player.gold < gold) {
						return fail_response("gold_not_enough");
					}
					player.gold -= gold;
					player.user[data.pack] = [];
					player.cuser[data.pack] = [];
					success = { response: "bank_new_pack", pack: data.pack, gold: gold, cevent: true };
				} else if (data.shells) {
					if (player["unlocking_" + data.pack]) {
						return fail_response("bank_opi");
					}
					player["unlocking_" + data.pack] = true;
					appengine_call(
						"bill_user",
						{
							auth: player.auth,
							amount: shells,
							reason: data.pack,
							name: player.name,
							suffix: "/" + player.name + "/" + data.pack,
							override: true,
						},
						function (result) {
							server_log("buy_with_cash: " + JSON.stringify(result));
							player["unlocking_" + data.pack] = false;
							if (result.failed || !result.done) {
								return socket.emit("game_log", "Purchase failed");
							}
							player.cash = result.cash;

							player.user[data.pack] = [];
							player.cuser[data.pack] = [];
							game_response("bank_new_pack", { cevent: true, pack: data.pack, shells: shells });

							resend(player, "reopen");
						},
					);
					success = { success: false, in_progress: true };
				}
			}
			if (data.operation == "move") {
				//within a .itemsN
				if (!player.user[data.pack] || bank_packs[data.pack][0] != player.map) {
					return fail_response("invalid");
				}
				server_log("storage move " + JSON.stringify(data));
				data.a = max(0, min(41, parseInt(data.a) || 0));
				data.b = max(0, min(41, parseInt(data.b) || 0));
				if (data.a == data.b) {
					return fail_response("invalid");
				}
				if (player.user[data.pack][data.a] && player.user[data.pack][data.a].name == "placeholder") {
					return fail_response("item_placeholder");
				}
				if (player.user[data.pack][data.b] && player.user[data.pack][data.b].name == "placeholder") {
					return fail_response("item_placeholder");
				}
				if (can_stack(player.user[data.pack][data.a], player.user[data.pack][data.b])) {
					player.user[data.pack][data.b].q =
						(player.user[data.pack][data.a].q || 1) + (player.user[data.pack][data.b].q || 1);
					player.user[data.pack][data.a] = null;
				} else {
					var temp = player.user[data.pack][data.a];
					player.user[data.pack][data.a] = player.user[data.pack][data.b];
					player.user[data.pack][data.b] = temp;
				}
				player.cuser[data.pack][data.a] = cache_item(player.user[data.pack][data.a]);
				player.cuser[data.pack][data.b] = cache_item(player.user[data.pack][data.b]);
			}
			if (data.operation == "swap") {
				//between .items and a .itemsN
				var operation = "swap";
				if (!player.user[data.pack] || bank_packs[data.pack][0] != player.map) {
					return fail_response("invalid");
				}
				data.str = parseInt(data.str);
				data.inv = parseInt(data.inv);
				if (data.inv == -1 || (!data.inv && data.inv !== 0)) {
					operation = "pull";
					for (var i = 0; i < player.isize; i++) {
						if (!player.items[i]) {
							data.inv = i;
							break;
						}
					}
					// if(data.inv==-1) { socket.emit("game_log","Inventory is full"); return; }
				}
				if (data.str == -1 || (!data.str && data.str !== 0)) {
					if (operation == "pull") {
						return fail_response("invalid");
					}
					operation = "store";
					for (var i = 0; i < 42; i++) {
						if (!player.user[data.pack][i]) {
							data.str = i;
							break;
						}
					}
					// if(data.str==-1) { socket.emit("game_log","Storage is full"); return; }
				}
				server_log("storage swap " + JSON.stringify(data));
				data.str = max(0, min(41, parseInt(data.str) || 0));
				data.inv = max(0, min(player.isize - 1, parseInt(data.inv) || 0));
				var bank_item = player.user[data.pack][data.str];
				var inv_item = player.items[data.inv];
				if (inv_item && inv_item.name == "placeholder") {
					return fail_response("item_placeholder");
				}
				if (inv_item && inv_item.b) {
					return fail_response("item_blocked");
				}
				if (inv_item) {
					delete inv_item.m;
					delete inv_item.v;
				}
				if (operation == "swap") {
					player.user[data.pack][data.str] = inv_item;
					player.items[data.inv] = bank_item;
					player.cuser[data.pack][data.str] = cache_item(player.user[data.pack][data.str]);
					player.citems[data.inv] = cache_item(player.items[data.inv]);
				} else if (operation == "store" && inv_item) {
					if (!can_add_item(player.user[data.pack], inv_item)) {
						return fail_response("storage_full");
					}
					player.items[data.inv] = player.citems[data.inv] = null;
					bank_add_item(player, data.pack, inv_item);
				} else if (operation == "pull" && bank_item) {
					if (!can_add_item(player, bank_item)) {
						return fail_response("inventory_full");
					}
					player.user[data.pack][data.str] = player.cuser[data.pack][data.str] = null;
					add_item(player, bank_item, { announce: false });
				}
			}
			if (!player.user.gold && player.user.gold !== 0) {
				player.user.gold = 0;
				server_log("#X - GOLD BUG bank", 1);
			}
			resend(player, "reopen");
			success_response(success);
		});
		socket.on("throw", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var item = player.items[data.num];
			if (item) {
				if (item.name == "placeholder") {
					return fail_response("item_placeholder");
				}
				if (item.l) {
					return fail_response("item_locked");
				}
				if (item.b) {
					return fail_response("item_blocked");
				}
				var def = G.items[item.name];
				if (!def.throw) {
					return fail_response("invalid");
				}
				var x = parseFloat(data.x) || 0;
				var y = parseFloat(data.y) || 0;
				if (distance(player, { map: player.map, in: player.in, x: x, y: y }) > player.str * 3) {
					fail_response("too_far");
				}
				consume_one(player, data.num);
				if (item.name == "confetti") {
					player.thrilling = future_s(20);
					xy_emit(
						{ map: player.map, in: player.in, x: x, y: y },
						"eval",
						"confetti_shower({in:'" + player.in + "',map:'" + player.map + "',real_x:" + x + ",real_y:" + y + "})",
					);
				}
				if (item.name == "firecrackers") {
					player.thrilling = future_s(200);
					xy_emit(
						{ map: player.map, in: player.in, x: x, y: y },
						"eval",
						"firecrackers({in:'" + player.in + "',map:'" + player.map + "',real_x:" + x + ",real_y:" + y + "})",
					);
					for (var id in instances[player.in].monsters) {
						var monster = instances[player.in].monsters[id];
						if (monster.target && distance({ map: player.map, in: player.in, x: x, y: y }, monster) < 64) {
							stop_pursuit(monster, { force: true, cause: "firecrackers" });
						}
					}
				}
				if (item.name == "whiteegg") {
					xy_emit({ map: player.map, in: player.in, x: x, y: y }, "eval", "egg_splash(" + x + "," + y + ")");
					for (var id in instances[player.in].monsters) {
						var monster = instances[player.in].monsters[id];
						if (!monster.target && distance({ map: player.map, in: player.in, x: x, y: y }, monster) < 32) {
							target_player(monster, player);
						}
					}
				}
				if (item.name == "smoke") {
					xy_emit({ map: player.map, in: player.in, x: x, y: y }, "eval", "assassin_smoke(" + x + "," + y + ");");
				}
				resend(player, "reopen+nc+inv");
				success_response({});
			} else {
				fail_response("no_item");
			}
		});
		socket.on("poke", function (data) {
			var player = players[socket.id];
			var level = 1;
			if (!player || !player.slots.gloves || player.slots.gloves.name != "poker") {
				return;
			}
			if (player.pokes >= 50) {
				return socket.emit("game_log", "You are out of pokes!");
			}
			player.pokes = (player.pokes || 0) + 1;
			if (player.slots.gloves.level >= 10) {
				level = 4;
			} else if (player.slots.gloves.level == 9) {
				level = 3;
			} else if (player.slots.gloves.level == 8) {
				level = 2;
			}
			xy_emit(player, "poke", { name: data.name, level: level, who: player.name });
		});
		socket.on("merge", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var container = player.slots[data.container];
			var pet = player.slots[data.pet];
			if (!container || container.type != "container" || !pet || pet.type != "container") {
				return socket.emit("game_response", "merge_mismatch");
			}
			if (G.items[container.name].grade < G.items[pet.name].grade || container.data) {
				return socket.emit("game_response", "merge_mismatch");
			}
			container.data = G.items[pet.name].pet;
			player.slots[data.pet] = null;
			socket.emit("game_response", "merge_complete");
			resend(player, "reopen");
		});
		socket.on("activate", function (data) {
			var player = players[socket.id];
			// console.log(JSON.stringify(data));
			if (!player) {
				return;
			}
			if (data.slot) {
				var item = player.slots[data.slot];
				if (!item || in_arr(data.slot, trade_slots)) {
					return;
				}
				if (item.name == "etherealamulet") {
					if (player.last_ethereal && mssince(player.last_ethereal) < 120) {
						return socket.emit("game_response", "not_ready");
					}
					player.last_ethereal = new Date();
					player.s.ethereal = { ms: 5000 };
					socket.emit("eval", { code: "skill_timeout('ethereal',120)" });
					return resend(player, "u+cid");
				} else if (item.name == "angelwings") {
					if (player.tskin == "snow_angel") {
						player.tskin = "";
					} else if (item.level >= 8 && (player.type == "mage" || player.type == "priest")) {
						player.tskin = "snow_angel";
					} else {
						return socket.emit("game_response", "nothing");
					}
				} else if (item.name == "tristone") {
					var on = true;
					if (player.tskin || player.tactivations == 100) {
						player.tskin = "";
						on = false;
					} else if (item.level <= 1 && deduct_gender(player) == "female") {
						player.tskin = random_one(["tf_green", "tf_pink"]);
					} else if (item.level == 2 && deduct_gender(player) == "female") {
						player.tskin = random_one(["tf_blue", "tf_purple"]);
					} else if (deduct_gender(player) == "female") {
						player.tskin = "tf_orange";
					} else if (item.level <= 1) {
						player.tskin = random_one(["tm_gray", "tm_brown", "tm_white"]);
					} else if (item.level == 2) {
						player.tskin = random_one(["tm_green", "tm_yellow", "tm_purple"]);
					} else {
						player.tskin = random_one(["tm_blue", "tm_red"]);
					}
					player.tactivations = (player.tactivations || 0) + 1;
				} else if (item.name == "darktristone") {
					var on = true;
					if (player.tskin || player.tactivations == 100) {
						player.tskin = "";
						on = false;
					} else if (item.level == 4 && deduct_gender(player) == "female") {
						player.tskin = "mf_blue";
					} else if (deduct_gender(player) == "female") {
						player.tskin = "mf_yellow";
					} else if (item.level == 4) {
						player.tskin = "mm_blue";
					} else {
						player.tskin = "mm_yellow";
					}
					player.tactivations = (player.tactivations || 0) + 1;
				} else {
					return;
				}
				resend(player, "reopen+nc+inv+u+cid");
			} else {
				var item = player.items[data.num];
				if (item) {
					if (item.name == "frozenstone") {
						consume_one(player, data.num);
					}
					if (item.name == "bkey") {
						if (!player.user) {
							return socket.emit("game_response", "only_in_bank");
						}
						if (player.user.unlocked && player.user.unlocked.bank_b) {
							return socket.emit("game_response", "already_unlocked");
						}
						consume_one(player, data.num);
						player.user.unlocked = player.user.unlocked || {};
						player.user.unlocked.bank_b = new Date();
						player.user.items8 = player.user.items8 || [];
						socket.emit("game_response", "door_unlocked");
					}
					if (item.name == "ukey") {
						if (!player.user) {
							return socket.emit("game_response", "only_in_bank");
						}
						if (player.user.unlocked && player.user.unlocked.bank_u) {
							return socket.emit("game_response", "already_unlocked");
						}
						consume_one(player, data.num);
						player.user.unlocked = player.user.unlocked || {};
						player.user.unlocked.bank_u = new Date();
						player.user.items24 = player.user.items24 || [];
						socket.emit("game_response", "door_unlocked");
					}
					if (item.name == "dkey") {
						if (!player.user) {
							return socket.emit("game_response", "only_in_bank");
						}
						var found = false;
						for (var i = 0; i < 48; i++) {
							var pack = "items" + i;
							if (!bank_packs[pack] || player.user[pack]) {
								continue;
							}
							found = true;
							player.user[pack] = [];
							player.cuser[pack] = [];
							break;
						}
						if (!found) {
							return;
						}
						consume_one(player, data.num);
						socket.emit("game_response", "bank_pack_unlocked");
					}
				}
				resend(player, "reopen+nc+inv");
			}
		});
		socket.on("booster", function (data) {
			var player = players[socket.id];
			var item = player.items[data.num];
			if (!player) {
				return;
			}
			server_log("booster " + data.num + " " + data.action);
			if (!item || !in_arr(item.name, booster_items)) {
				return fail_response("invalid");
			}
			if (data.action == "activate" && !item.expires) {
				item.expires = new Date();
				item.expires.setDate(item.expires.getDate() + 30 + (item.level || 0) * 2);
				//item.expires.setMinutes(item.expires.getMinutes()+2);
			} else if (data.action == "shift") {
				if (!in_arr(data.to, booster_items)) {
					return fail_response("invalid");
				}
				player.xpm = player.goldm = player.luckm = 1;
				item.name = data.to;
				player.s.penalty_cd = { ms: min(((player.s.penalty_cd && player.s.penalty_cd.ms) || 0) + 240, 120000) };
			}
			// if(item.expires) item.p="legacy";
			player.citems[data.num] = cache_item(player.items[data.num]);
			resend(player, "reopen");
			success_response({ name: player.items[data.num].name });
		});
		socket.on("convert", function (data) {
			// There are a lot of routines that could give birth to an endgame bug
			// This routine ended up being the one
			// "stone" boosters were originally 1200 shells
			// when they were discontinued, I let players exchange them for 3600 shells instead
			// turns out 'buy_with_cash' didn't check whether an item has "ignore" or not
			// so one could buy the stones for 1200 shells and sell them for 3600
			// unlocking infinite gold and shells [17/01/18]
			var player = players[socket.id];
			var item = player.items[data.num];
			var amount = 3600;
			server_log("stone " + data.num + " " + data.action);
			if (!item || !in_arr(item.name, ["stoneofxp", "stoneofgold", "stoneofluck"])) {
				return;
			}
			if (item.expires) {
				amount = round(600 - (hsince(item.expires) * 100) / 24.0);
			}
			add_shells(player, amount, "convert");
			player.items[data.num] = null;
			player.citems[data.num] = cache_item(player.items[data.num]);
			resend(player, "reopen+cid");
		});
		socket.on("emotion", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (!data.name) {
				data.name = random_one(Object.keys(player.p.emx));
			}
			if (player.last.emotion && mssince(player.last.emotion) < 2000) {
				return socket.emit("game_response", "emotion_cooldown");
			}
			player.last.emotion = new Date();
			if (!G.emotions[data.name] || !player.p.emx[data.name]) {
				return socket.emit("game_response", "emotion_cant");
			}
			xy_emit(player, "emotion", { name: data.name, player: player.name });
		});
		socket.on("skill", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var target = null;
			var cool = true;
			var resolve = { response: "data", place: data.name, success: true };
			var reject = null;
			player.first = true;
			G.skills.attack.cooldown = player.attack_ms;
			server_log("skill " + JSON.stringify(data));
			if (is_disabled(player)) {
				return fail_response("disabled", data.name);
			}
			if ((player.tskin == "konami" || is_silenced(player)) && data.name != "attack") {
				return socket.emit("game_response", { response: "skill_cant_incapacitated", place: data.name, failed: true });
			}
			if (!G.skills[data.name]) {
				return socket.emit("game_response", { response: "no_skill", place: data.name, failed: true });
			}
			if (
				G.skills[data.name].mp &&
				player.mp < (G.skills[data.name].mp * (100 - (player.mp_reduction || 0))) / 100.0 &&
				!(player.role == "gm" && data.name == "blink")
			) {
				return socket.emit("game_response", { response: "no_mp", place: data.name, failed: true });
			}
			if (G.skills[data.name].level && player.level < G.skills[data.name].level) {
				return socket.emit("game_response", { response: "no_level", place: data.name, failed: true });
			}
			if (
				(G.skills[data.name].cooldown || G.skills[data.name].reuse_cooldown) &&
				player.last[data.name] &&
				mssince(player.last[data.name]) < (G.skills[data.name].cooldown || G.skills[data.name].reuse_cooldown)
			) {
				return socket.emit("game_response", {
					response: "cooldown",
					skill: data.name,
					place: data.name,
					id: data.id,
					ms: (G.skills[data.name].cooldown || G.skills[data.name].reuse_cooldown) - mssince(player.last[data.name]),
					failed: true,
				});
			}
			if (
				G.skills[data.name].share &&
				player.last[G.skills[data.name].share] &&
				mssince(player.last[G.skills[data.name].share]) <
					G.skills[G.skills[data.name].share].cooldown * (G.skills[data.name].cooldown_multiplier || 1)
			) {
				return socket.emit("game_response", {
					response: "cooldown",
					skill: data.name,
					place: data.name,
					failed: true,
					id: data.id,
					ms:
						G.skills[G.skills[data.name].share].cooldown * (G.skills[data.name].cooldown_multiplier || 1) -
						mssince(player.last[G.skills[data.name].share]),
				});
			}
			if (G.skills[data.name].class && !in_arr(player.type, G.skills[data.name].class) && player.role != "gm") {
				return socket.emit("game_response", { response: "skill_cant_use", place: data.name, failed: true });
			}
			if (
				G.skills[data.name].wtype &&
				!is_array(G.skills[data.name].wtype) &&
				(!player.slots.mainhand || G.items[player.slots.mainhand.name].wtype != G.skills[data.name].wtype) &&
				player.role != "gm"
			) {
				return socket.emit("game_response", { response: "skill_cant_wtype", place: data.name, failed: true });
			}
			if (
				is_array(G.skills[data.name].wtype) &&
				(!player.slots.mainhand || !in_arr(G.items[player.slots.mainhand.name].wtype, G.skills[data.name].wtype)) &&
				player.role != "gm"
			) {
				return socket.emit("game_response", { response: "skill_cant_wtype", place: data.name, failed: true });
			}
			if (G.skills[data.name].hostile && G.maps[player.map].safe) {
				return socket.emit("game_response", { response: "skill_cant_safe", place: data.name, failed: true });
			}
			if (G.skills[data.name].target) {
				if (
					("" + parseInt(data.id) === "" + data.id && G.skills[data.name].target == "player") ||
					("" + parseInt(data.id) !== "" + data.id && G.skills[data.name].target == "monster")
				) {
					return fail_response("invalid_target", data.name, { id: data.id });
				}
				if (G.skills[data.name].target != "monster" && players[id_to_id[data.id]]) {
					target = players[id_to_id[data.id]];
					if (G.skills[data.name].hostile && target.name == player.name) {
						return socket.emit("game_response", { response: "no_target", place: data.name, failed: true });
					}
				} else if (G.skills[data.name].target != "player" && instances[player.in].monsters[data.id]) {
					target = instances[player.in].monsters[data.id];
				} else {
					return socket.emit("disappear", { id: data.id, place: data.name, reason: "not_there" });
				}

				if (
					is_invis(target) ||
					(!G.skills[data.name].global && (target.map != player.map || distance(target, player, true) > B.max_vision))
				) {
					return socket.emit("disappear", { id: data.id, place: data.name, reason: "not_there" });
				}
			}
			if (G.skills[data.name].requirements) {
				for (var requirement in G.skills[data.name].requirements) {
					if (!player[requirement] || player[requirement] < G.skills[data.name].requirements[requirement]) {
						return socket.emit("game_response", {
							response: "skill_cant_requirements",
							place: data.name,
							failed: true,
						});
					}
				}
			}
			if (G.skills[data.name].slot) {
				var found = false;
				var charges = false;
				G.skills[data.name].slot.forEach(function (p) {
					if (player.slots[p[0]] && player.slots[p[0]].name == p[1]) {
						if (G.items[player.slots[p[0]].name].charge) {
							if ((player.slots[p[0]].charges || 0) < G.items[player.slots[p[0]].name].charge) {
								charges = true;
								return;
							}
							player.slots[p[0]].charges -= G.items[player.slots[p[0]].name].charge;
							player.cslots[p[0]] = cache_item(player.slots[p[0]]);
						}
						found = true;
					}
				});
				if (charges) {
					return socket.emit("game_response", { response: "skill_cant_charges", place: data.name, failed: true });
				}
				if (!found) {
					return socket.emit("game_response", { response: "skill_cant_slot", place: data.name, failed: true });
				}
			}
			if (player.s.invincible) {
				delete player.s.invincible;
				player.to_resend = "u+cid";
			}
			if (data.name == "attack" || data.name == "heal") {
				var attack = commence_attack(player, target, data.name);
				if (!attack.failed) {
					resolve = attack;
				} else {
					reject = attack;
					cool = false;
				}
			}
			if (data.name == "invis" && !player.s.invis) {
				if (player.s.marked) {
					return socket.emit("game_response", { response: "skill_cant_use", place: data.name, failed: true });
				}
				player.s.invis = { ms: 999999999999999 };
				xy_emit(player, "disappear", { id: player.id, invis: true, reason: "invis" });
				player.to_resend = " ";
			}
			if (data.name == "pickpocket") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}

				consume_mp(player, G.skills[data.name].mp);
				player.c[data.name] = {
					ms:
						G.skills[data.name].duration_min +
						Math.random() * (G.skills[data.name].duration_max - G.skills[data.name].duration_min),
					target: target.name,
				};
				player.to_resend = "u+cid";
				resolve = { response: "data", place: data.name, success: false, in_progress: true };
			}
			if (data.name == "fishing" || data.name == "mining") {
				var direction = 0;
				var the_zone = null;
				consume_mp(player, G.skills[data.name].mp);
				(G.maps[player.map].zones || []).forEach(function (zone) {
					if (zone.type != data.name || the_zone) {
						return;
					}
					[
						[0, -24, 3],
						[-24, 0, 1],
						[24, 0, 2],
						[0, 24, 0],
					].forEach(function (m) {
						if (is_point_inside([player.x + m[0], player.y + m[1]], zone.polygon)) {
							the_zone = zone;
							direction = m[2];
						}
					});
				});
				if (!the_zone || player.moving) {
					xy_emit(player, "ui", { type: data.name + "_fail", name: player.name });
					reject = { response: "data", place: data.name };
				} else {
					xy_emit(player, "ui", { type: data.name + "_start", name: player.name, direction: direction });
					player.c[data.name] = {
						ms:
							G.skills[data.name].duration_min +
							Math.random() * (G.skills[data.name].duration_max - G.skills[data.name].duration_min),
						drop: the_zone.drop,
					};
				}
				resolve = { response: "data", place: data.name, success: false, in_progress: true };
				player.to_resend = "u+cid";
			}
			if (data.name == "light") {
				consume_mp(player, G.skills[data.name].mp);
				xy_emit(player, "light", { name: player.name });
				player.to_resend = "u+cid";
			}
			if (data.name == "charge") {
				player.s.charging = { ms: G.skills.charge.duration };
				player.to_resend = "u+cid";
			}
			if (data.name == "dash") {
				//console.log(data);
				consume_mp(player, G.skills[data.name].mp);
				var x = parseFloat(data.x) || 0;
				var y = parseFloat(data.y) || 0;
				var point = true;
				if (point_distance(player.x, player.y, x, y) > 50) {
					point = false;
					player.socket.emit("game_response", "dash_failed");
					reject = { response: "data", place: data.name };
				}
				if (point) {
					var spot = safe_xy_nearby(player.map, x, y);
					if (!spot) {
						spot = safe_xy_nearby(player.map, player.x + (x - player.x) * 0.8, player.y + (y - player.y) * 0.8);
					}
					if (!spot) {
						spot = safe_xy_nearby(player.map, player.x + (x - player.x) * 0.6, player.y + (y - player.y) * 0.6);
					}
					if (!spot || point_distance(player.x, player.y, spot.x, spot.y) < 10) {
						point = false;
						player.socket.emit("game_response", "dash_failed");
						reject = { response: "data", place: data.name };
					}
					if (point) {
						//console.log([player.x,player.y,spot.x,spot.y]);
						player.s.dash = { ms: 1000 };
						player.speed = 500;
						player.going_x = spot.x;
						player.going_y = spot.y;
						start_moving_element(player);
						player.to_resend = "u+cid";
						player.socket.emit("eval", { code: "ui_move(" + spot.x + "," + spot.y + ")" });
					}
				}
			}
			if (data.name == "hardshell" || data.name == "power" || data.name == "xpower") {
				consume_mp(player, G.skills[data.name].mp);
				player.s[G.skills[data.name].condition] = {
					ms: G.skills[data.name].duration || G.conditions[G.skills[data.name].condition].duration,
				};
				player.to_resend = "u+cid";
			}
			if (data.name == "mshield") {
				consume_mp(player, G.skills[data.name].mp);
				if (player.s[G.skills[data.name].condition]) {
					delete player.s[G.skills[data.name].condition];
				} else {
					player.s[G.skills[data.name].condition] = { ms: 999999999 };
				}
				player.to_resend = "u+cid";
			}
			if (
				data.name == "mcourage" ||
				data.name == "mfrenzy" ||
				data.name == "massproduction" ||
				data.name == "massproductionpp"
			) {
				consume_mp(player, G.skills[data.name].mp);
				player.s[G.skills[data.name].condition] = { ms: G.conditions[G.skills[data.name].condition].duration };
				xy_emit(player, "ui", { type: data.name, name: player.name });
				player.to_resend = "u+cid";
			}
			if (data.name == "throw") {
				if (distance(player, target, true) > G.skills[data.name].range + player.level) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				if (target.s.invincible || target.immune) {
					return socket.emit("game_response", { response: "target_invincible", place: data.name, failed: true });
				}
				if (!player.items[data.num]) {
					return socket.emit("game_response", { response: "skill_no_item", place: data.name, failed: true });
				}
				var item = player.items[data.num];
				var r = "u+cid";
				var damage = 0;
				if (item.name == "placeholder") {
					return socket.emit("game_response", { response: "item_placeholder", place: data.name, failed: true });
				}
				if (item.l) {
					return socket.emit("game_response", { response: "item_locked", place: data.name, failed: true });
				}
				if (item.b) {
					return socket.emit("game_response", { response: "item_blocked", place: data.name, failed: true });
				}
				var prop = calculate_item_properties(item);
				var negative = false;
				if (in_arr(item.name, G.skills.throw.negative)) {
					negative = true;
				}
				G.skills.throw.nprop.forEach(function (p) {
					if (prop[p]) {
						negative = true;
					}
				});
				if (negative && target.is_player && !is_in_pvp(player)) {
					return socket.emit("game_response", { response: "not_in_pvp", place: data.name, failed: true });
				}
				consume_one(player, data.num);
				if (item.name == "essenceoffire") {
					add_condition(target, "eburn", { from: player });
				} else if (item.name == "essenceoflife") {
					add_condition(target, "eheal", { from: player });
				} else if (prop.attack) {
					damage = round(Math.random() * prop.attack * 15);
				} else if (prop.armor) {
					damage = round(Math.random() * prop.armor * 24);
				}
				if (damage) {
					if (target["1hp"]) {
						damage = 1;
					}
					target.hp = max(1, target.hp - damage);
					disappearing_text({}, target, "-" + damage, { color: "red", xy: 1 });
				}
				consume_mp(player, G.skills[data.name].mp, target);
				xy_emit(player, "ui", { type: "throw", from: player.name, to: target.id, item: item.name });
				player.to_resend = "u+cid+reopen";
				if (target.is_player) {
					resend(target, r);
				} else {
					target.u = true;
					target.cid++;
				}
			}
			if (data.name == "phaseout") {
				if (!player.items[data.num] || player.items[data.num].name != "shadowstone") {
					return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
				}
				consume_one(player, data.num);
				consume_mp(player, G.skills[data.name].mp);
				player.s.phasedout = { ms: G.conditions.phasedout.duration };
				player.to_resend = "u+cid+reopen";
			}
			if (data.name == "pcoat") {
				if (!player.items[data.num] || player.items[data.num].name != "poison") {
					return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
				}
				consume_one(player, data.num);
				consume_mp(player, G.skills[data.name].mp);
				player.s.poisonous = { ms: G.skills.pcoat.cooldown };
				player.to_resend = "u+cid+reopen";
			}
			if (data.name == "curse") {
				//#TODO: last_curse variable + check for multiple curses
				var attack = commence_attack(player, target, "curse");
				if (!attack.failed) {
					resolve = attack;
					add_pdps(player, null, player.attack / 2);
				} else {
					reject = attack;
					cool = false;
				}
			}
			if (data.name == "snowball") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				var found = false;
				for (var i = player.isize - 1; i >= 0; i--) {
					if (player.items[i] && player.items[i].name == "snowball") {
						consume_one(player, i);
						found = true;
						break;
					}
				}
				if (!found) {
					return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
				}
				var attack = commence_attack(player, target, "snowball");
				if (!attack.failed) {
					resolve = attack;
				} else {
					reject = attack;
					cool = false;
				}
			}
			if (data.name == "entangle" || data.name == "tangle") {
				if (data.name == "entangle") {
					if (!player.items[data.num] || player.items[data.num].name != "essenceofnature") {
						return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
					}
				}
				if (target.s.invincible) {
					return socket.emit("game_response", { response: "target_invincible", place: data.name, failed: true });
				}
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				add_condition(target, "tangled", { ms: G.skills["entangle"].duration });
				target.abs = true;
				target.moving = false;
				xy_emit(player, "ui", { type: "entangle", from: player.name, to: target.id });
				consume_mp(player, G.skills[data.name].mp, target);
				add_pdps(player, target, 4000);
				if (data.name == "entangle") {
					consume_one(player, data.num);
				}
				player.to_resend = "u+cid+reopen";
				if (target.is_monster) {
					target.u = true;
					target.cid++;
					ccms(target);
				} else {
					resend(target, "u+cid");
				}
			}
			if (data.name == "4fingers") {
				if (target.s.invincible) {
					return socket.emit("game_response", { response: "target_invincible", place: data.name, failed: true });
				}
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				if (!is_in_pvp(player) && !is_same(player, target, 1)) {
					return socket.emit("game_response", { response: "non_friendly_target", place: data.name, failed: true });
				}
				add_condition(target, "fingered", { ms: G.skills["4fingers"].duration });
				add_condition(target, "stunned", { duration: G.skills["4fingers"].duration - 2000 });
				xy_emit(player, "ui", { type: "4fingers", from: player.name, to: target.name });
				consume_mp(player, G.skills[data.name].mp, target);
				add_pdps(player, target, 1000);
				resend(target, "u+cid");
				player.to_resend = "u+cid";
			}
			if (
				[
					"quickpunch",
					"quickstab",
					"smash",
					"mentalburst",
					"purify",
					"taunt",
					"supershot",
					"zapperzap",
					"burst",
					"piercingshot",
				].includes(data.name)
			) {
				var attack = commence_attack(player, target, data.name);
				if (!attack.failed) {
					resolve = attack;
				} else {
					reject = attack;
					cool = false;
				}
			}
			if (data.name == "poisonarrow") {
				if (!player.items[data.num] || player.items[data.num].name != "poison") {
					return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
				}

				var attack = commence_attack(player, target, data.name);
				if (!attack.failed) {
					resolve = attack;
				} else {
					reject = attack;
					cool = false;
				}

				consume_one(player, data.num);
				player.to_resend = "reopen";
			}
			if (data.name == "revive") {
				if (!player.items[data.num] || player.items[data.num].name != "essenceoflife") {
					return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
				}
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				if (!target.rip) {
					return socket.emit("game_response", { response: "target_alive", place: data.name, failed: true });
				}

				consume_one(player, data.num);
				player.to_resend = "reopen";
				if (target.party == player.party) {
					add_pdps(player, target, target.pdps / 5);
				}

				if (target.hp != target.max_hp) {
					reject = { response: "data", place: data.name, reason: "hp" };
					player.socket.emit("game_response", { response: "revive_failed", id: data.id });
				} else {
					target.c.revival = { ms: 8000, f: player.name };
				}
				resend(target, "u+cid");
			}
			if (data.name == "cburst") {
				var hit = {};
				var times = 0;
				var attack = null;
				var c_resolve = null;
				consume_mp(player, G.skills[data.name].mp);
				player.first_burst = true;
				player.halt = true;
				if (is_array(data.targets)) {
					data.targets.forEach(function (t) {
						// console.log(id);
						var id = t[0];
						var mp = max(0, parseInt(t[1]) || 0);
						if (player.mp < 20 || times > 16 || !mp) {
							return;
						}
						times += 1;
						var target = instances[player.in].monsters[id];
						if (!target) {
							target = instances[player.in].players[id];
						}
						if (!target || is_invinc(target) || target.name == player.name) {
							return;
						}
						if (hit[id]) {
							return;
						}
						hit[id] = true;
						player.next_mp = mp;
						attack = commence_attack(player, target, "cburst");
						if (!attack || !attack.projectile) {
							return;
						}
						if (!c_resolve) {
							c_resolve = attack;
							attack.pids = [attack.pid];
							attack.targets = [attack.target];
						} else {
							c_resolve.pids.push(attack.pid);
							c_resolve.targets.push(attack.target);
						}
					});
				}
				player.halt = false;
				player.to_resend = "u+cid";
				if (!c_resolve) {
					if (attack) {
						reject = attack;
					}
					disappearing_text(player.socket, player, "NO HITS");
				} else {
					resolve = c_resolve;
				}
			}
			if (data.name == "partyheal") {
				var targets = [player];
				var attack = null;
				var hits = 0;
				if (parties[player.party]) {
					targets = [];
					parties[player.party].forEach(function (name) {
						var current = players[name_to_id[name]];
						targets.push(current);
					});
				}
				targets.forEach(function (target) {
					attack = commence_attack(player, target, "partyheal");
					if (!attack.failed) {
						hits = true;
					}
				});
				if (!hits) {
					reject = attack;
				}
			}
			if (data.name == "selfheal") {
				var attack = commence_attack(player, player, data.name);
				if (!attack.failed) {
					resolve = attack;
				} else {
					reject = attack;
					cool = false;
				}
			}
			if (data.name == "darkblessing" || data.name == "warcry") {
				consume_mp(player, G.skills[data.name].mp);
				for (var id in instances[player.in].players) {
					var target = instances[player.in].players[id];
					if (
						!target.npc &&
						distance(player, target, true) < G.skills[data.name].range &&
						(!(G.maps[player.map].pvp || is_pvp) || is_same(player, target, 1))
					) {
						target.s[G.skills[data.name].condition] = { ms: G.skills[data.name].duration, f: player.name };
						resend(target, "u+cid");
						add_pdps(player, target, 500);
					}
				}
				xy_emit(player, "ui", { type: data.name });
			}
			if (data.name == "3shot" || data.name == "5shot") {
				player.halt = true;
				var times = 0;
				var hit = {};
				var reftarget = null;
				var targets = 3;
				var attack = null;
				var c_resolve = null;
				if (data.name == "5shot") {
					targets = 5;
				}
				//console.log(data.ids);
				if (is_array(data.ids)) {
					data.ids.forEach(function (id) {
						if (times >= targets) {
							return;
						}
						times += 1;
						var target = instances[player.in].monsters[id];
						if (!target) {
							target = instances[player.in].players[id];
						}
						if (!target || is_invinc(target) || target.name == player.name) {
							attack = { failed: true, place: data.name, reason: "no_target" };
							return;
						}
						if (hit[id]) {
							return;
						}
						hit[id] = true;
						attack = commence_attack(player, target, data.name);
						if (!attack || !attack.projectile) {
							return;
						}
						if (!c_resolve) {
							reftarget = target;
							c_resolve = attack;
							attack.pids = [attack.pid];
							attack.targets = [attack.target];
						} else {
							c_resolve.pids.push(attack.pid);
							c_resolve.targets.push(attack.target);
						}
						// if(times==1 && attack==null) times=40;
					});
				}
				consume_mp(player, G.skills[data.name].mp, reftarget);
				player.halt = false;
				player.to_resend = "u+cid";
				if (!c_resolve) {
					if (attack) {
						reject = attack;
					}
					disappearing_text(player.socket, player, "NO HITS");
				} else {
					resolve = c_resolve;
				}
			}
			if (data.name == "track") {
				var list = [];
				for (var id in instances[player.in].players) {
					if (id == player.name) {
						continue;
					}
					var target = instances[player.in].players[id];
					var current = { sound: "wmp" };
					if (target.npc) {
						continue;
					}
					if (is_invis(target)) {
						current.invis = true;
					}
					if (target.type == "rogue" || target.type == "ranger") {
						current.sound = "rr";
					} else if (target.type == "priest" || target.type == "mage") {
						current.sound = "pm";
					}
					current.dist = distance(player, target);
					if (current.dist < G.skills.track.range) {
						list.push(current);
					}
				}
				list.sort(function (a, b) {
					return a.dist - b.dist;
				});
				consume_mp(player, G.skills[data.name].mp);
				xy_emit(player, "ui", { type: "track", name: player.name });
				socket.emit("track", list);
				player.to_resend = "u+cid";
			}
			if (data.name == "agitate") {
				var ids = [];
				for (var id in instances[player.in].monsters) {
					var target = instances[player.in].monsters[id];
					if (target.target == player.name) {
						ids.push(id);
						continue;
					} // why did the missing continue cause a disengage I have no idea [25/03/23]
					if (target.target && !(get_player(target.target) && is_same(player, get_player(target.target), 1))) {
						continue;
					}
					var dist = distance(player, target);
					if (dist < G.skills.agitate.range) {
						if (target.target) {
							stop_pursuit(target, { redirect: true, cause: "agitate redirect" });
						}
						target.cid += 1;
						target.u = true;
						target.last.attacked = new Date();
						target_player(target, player);
						ids.push(id);
					}
				}
				consume_mp(player, G.skills[data.name].mp, target);
				xy_emit(player, "ui", { type: "agitate", name: player.name, ids: ids });
				player.to_resend = "u+cid";
				add_pdps(player, null, 1000);
			}
			if (data.name == "absorb") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				var ids = [];
				if (is_same(player, target, 1)) {
					consume_mp(player, G.skills[data.name].mp);
				} else {
					if (player.mp < G.skills[data.name].mp * 6 || player.level < 75) {
						return socket.emit("game_response", { response: "non_friendly_target", place: data.name, failed: true });
					}
					consume_mp(player, G.skills[data.name].mp * 6);
					if (Math.random() < 0.95) {
						consume_skill(player, data.name);
						resend(player, "u+cid");
						return socket.emit("game_response", { response: "non_friendly_target", place: data.name, failed: true });
					}
				}
				for (var id in instances[player.in].monsters) {
					var monster = instances[player.in].monsters[id];
					if (monster.target == target.name) {
						stop_pursuit(monster, { redirect: true, cause: "absorb redirect" });
						monster.cid += 1;
						monster.u = true;
						target_player(monster, player);
						ids.push(id);
					}
				}
				xy_emit(player, "ui", { type: "absorb", name: player.name, from: data.id, ids: ids });
				player.to_resend = "u+cid";
				add_pdps(player, target, 1000);
			}
			if (data.name == "stomp") {
				var ids = [];
				var reftarget = null;
				for (var id in instances[player.in].monsters) {
					var target = instances[player.in].monsters[id];
					var dist = distance(player, target);
					if (dist < G.skills.stomp.range) {
						if (target.immune) {
							player.hitchhikers.push(["game_response", { response: "skill_immune", skill: data.name }]);
							player.to_resend = "nc";
							disappearing_text(target.socket, target, "IMMUNE!", { xy: 1, color: "evade", nv: 1, from: player.id });
						} else if (add_condition(target, "stunned", { duration: G.skills.stomp.duration })) {
							ids.push(id);
							add_pdps(player, target, 500);
						}
					}
				}
				if (is_in_pvp(player, 1)) {
					for (var id in instances[player.in].players) {
						var target = instances[player.in].players[id];
						var dist = distance(player, target);
						if (dist < G.skills.stomp.range && !target.npc && !is_same(player, target, 1) && !target.s.invincible) {
							if (add_condition(target, "stunned", { duration: G.skills.stomp.duration })) {
								reftarget = target;
								resend(target, "u+cid");
								ids.push(id);
								add_pdps(player, target, 5000);
							}
						}
					}
				}
				consume_mp(player, G.skills[data.name].mp, reftarget);
				xy_emit(player, "ui", { type: "stomp", name: player.name, ids: ids });
				player.to_resend = "u+cid";
				resolve = { response: "data", place: data.name, success: true, ids: ids };
			}
			if (data.name == "scare") {
				var ids = [];
				consume_mp(player, G.skills[data.name].mp);
				for (var id in instances[player.in].monsters) {
					var target = instances[player.in].monsters[id];
					if (target.target == player.name) {
						if (target.immune) {
							player.hitchhikers.push(["game_response", { response: "skill_immune", skill: "scare" }]);
							player.to_resend = "nc";
							disappearing_text(target.socket, target, "IMMUNE!", { xy: 1, color: "evade", nv: 1, from: player.id });
						} else {
							stop_pursuit(target, { force: true, cause: "scare" });
							target.abs = true;
							target.moving = false;
							ids.push(id);
						}
					}
				}
				xy_emit(player, "ui", { type: "scare", name: player.name, ids: ids });
				player.to_resend = "u+cid";
			}
			if (data.name == "huntersmark") {
				if (target.is_player && !is_in_pvp(player) && !is_same(player, target, 1)) {
					return socket.emit("game_response", { response: "skill_cant_pve", place: data.name, failed: true });
				}
				consume_mp(player, G.skills[data.name].mp, target);
				add_condition(target, "marked");
				if (target.is_player) {
					resend(target, "u+cid");
				} else {
					target.cid++;
					target.u = true;
				}
				xy_emit(player, "ui", { type: "huntersmark", name: player.name, id: target.id });
				player.to_resend = "u+cid";
			}
			if (data.name == "charm") {
				consume_mp(player, G.skills[data.name].mp);
				if (Math.random() > 0.01) {
					socket.emit("game_response", "charm_failed");
					xy_emit(player, "ui", { type: "charm", name: player.name, id: target.id, fail: true });
				} else {
					target.cid++;
					target.u = true;
					target.s.charmed = { ms: G.conditions.charmed.duration };
					xy_emit(player, "ui", { type: "charm", name: player.name, id: target.id });
				}
				player.to_resend = "u+cid";
			}
			if (data.name == "cleave" || data.name == "shadowstrike") {
				player.to_resend = "u+cid";
				if (data.name == "shadowstrike") {
					if (!player.items[data.num] || player.items[data.num].name != "shadowstone") {
						return socket.emit("game_response", { response: "skill_cant_item", place: data.name, failed: true });
					}
					consume_one(player, data.num);
					player.to_resend = "u+cid+reopen";
				}
				player.halt = true;
				var ids = [];
				var reftarget = null;
				var c_resolve = null;
				for (var id in instances[player.in].monsters) {
					var target = instances[player.in].monsters[id];
					var dist = distance(player, target);
					if (dist < G.skills[data.name].range) {
						attack = commence_attack(player, target, data.name);
						if (!attack || !attack.projectile) {
							continue;
						}
						ids.push(id);
						if (!c_resolve) {
							c_resolve = attack;
							attack.pids = [attack.pid];
							attack.targets = [attack.target];
						} else {
							c_resolve.pids.push(attack.pid);
							c_resolve.targets.push(attack.target);
						}
					}
				}
				if (is_in_pvp(player, 1)) {
					for (var id in instances[player.in].players) {
						var target = instances[player.in].players[id];
						var dist = distance(player, target);
						if (dist < G.skills[data.name].range && !target.npc && !is_same(player, target, 1)) {
							attack = commence_attack(player, target, data.name);
							if (!attack || !attack.projectile) {
								continue;
							}
							ids.push(id);
							if (!c_resolve) {
								reftarget = target;
								c_resolve = attack;
								attack.pids = [attack.pid];
								attack.targets = [attack.target];
							} else {
								c_resolve.pids.push(attack.pid);
								c_resolve.targets.push(attack.target);
							}
						}
					}
				}
				consume_mp(player, G.skills[data.name].mp, reftarget);
				xy_emit(player, "ui", { type: data.name, name: player.name, ids: ids });
				player.halt = false;
				if (c_resolve) {
					resolve = c_resolve;
				}
			}
			if (data.name == "magiport") {
				var pported = false;
				consume_mp(player, G.skills[data.name].mp);
				if (!is_pvp && mode.pve_safe_magiports) {
					if (!magiportations[player.name]) {
						magiportations[player.name] = {};
					}
					magiportations[player.name][target.name] = true;
					target.socket.emit("magiport", { name: player.name });
					player.socket.emit("game_response", { response: "magiport_sent", id: data.id });
					xy_emit(player, "ui", { type: "magiport", name: player.name });
				} else {
					if (is_same(player, target, 1) || !target.slots.helmet) {
						ported = magiport_someone(target, player);
					}
					if (!ported) {
						player.socket.emit("game_response", { response: "magiport_failed", id: data.id });
					}
				}
				player.to_resend = "u+cid";
			}
			if (data.name == "blink") {
				var x = parseFloat(data.x) || 0;
				var y = parseFloat(data.y) || 0;
				var spot = safe_xy_nearby(player.map, x, y);
				if (!spot) {
					return player.socket.emit("game_response", { response: "blink_failed", place: data.name, failed: true });
				}
				player.s.blink = { ms: 200 };
				player.s.blink.in = player.in;
				player.s.blink.map = player.map;
				player.s.blink.x = spot.x;
				player.s.blink.y = spot.y;
				player.s.blink.d = 0;
				if (in_arr(data.direction, [1, 2, 3])) {
					player.s.blink.d = data.direction;
				}
				if (player.role != "gm") {
					consume_mp(player, G.skills[data.name].mp);
				}
				// xy_emit(player,"ui",{type:"blinking",name:player.name});
				resend(player, "u+cid");
				// #TODO: Appear animation for non-self's [21/05/18]
			}
			if (data.name == "warp") {
				var x = parseFloat(data.x) || 0;
				var y = parseFloat(data.y) || 0;
				var ins = data.in || "main";
				var instance = instances[ins];
				if (!instance) {
					return player.socket.emit("game_response", { response: "blink_failed", place: data.name, failed: true });
				}
				if (instance.mount != instances[player.in].mount) {
					return player.socket.emit("game_response", { response: "cant_in_bank", place: data.name, failed: true });
				}
				var spot = safe_xy_nearby(instance.name, x, y);
				if (!spot) {
					return player.socket.emit("game_response", { response: "blink_failed", place: data.name, failed: true });
				}
				player.s.blink = { ms: 200 };
				player.s.blink.in = ins;
				player.s.blink.map = instance.name;
				player.s.blink.x = spot.x;
				player.s.blink.y = spot.y;
				player.s.blink.d = 0;
				if (in_arr(data.direction, [1, 2, 3])) {
					player.s.blink.d = data.direction;
				}
				if (player.role != "gm") {
					consume_mp(player, G.skills[data.name].mp);
				}
				// xy_emit(player,"ui",{type:"blinking",name:player.name});
				player.to_resend = "u+cid";
				// #TODO: Appear animation for non-self's [21/05/18]
			}
			if (data.name == "mluck") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				consume_mp(player, G.skills[data.name].mp);
				if (
					!target.s[G.skills[data.name].condition] ||
					!target.s[G.skills[data.name].condition].strong ||
					target.s[G.skills[data.name].condition].f == player.name
				) {
					target.s[G.skills[data.name].condition] = { ms: G.conditions.mluck.duration, f: player.name };
				}
				if (target.owner == player.owner) {
					target.s[G.skills[data.name].condition].strong = true;
				}
				xy_emit(player, "ui", { type: "mluck", from: player.name, to: target.name });
				resend(target, "u+cid");
				resend(player, "u+cid");
			}
			if (data.name == "rspeed") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				consume_mp(player, G.skills[data.name].mp);
				target.s[G.skills[data.name].condition] = { ms: G.conditions.rspeed.duration, f: player.name };
				xy_emit(player, "ui", { type: "rspeed", from: player.name, to: target.name });
				resend(target, "u+cid");
				resend(player, "u+cid");
				if (player.party == target.party && player != target) {
					add_pdps(player, target, 2000);
				}
			}
			if (data.name == "reflection") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				consume_mp(player, G.skills[data.name].mp);
				target.s[G.skills[data.name].condition] = { ms: G.conditions.reflection.duration, f: player.name };
				xy_emit(player, "ui", { type: "reflection", from: player.name, to: target.name });
				resend(target, "u+cid");
				resend(player, "u+cid");
				if (player.party == target.party && player != target) {
					add_pdps(player, target, 4000);
				}
			}
			if (data.name == "energize") {
				if (distance(player, target, true) > G.skills[data.name].range) {
					return socket.emit("game_response", { response: "too_far", place: data.name, failed: true });
				}
				if (!player.mp) {
					return socket.emit("game_response", { response: "no_mp", place: data.name, failed: true });
				}
				var mp = parseInt(data.mp) || 10000;
				mp = max(1, min(player.mp, mp));
				if (mp > target.max_mp - target.mp) {
					mp = target.max_mp - target.mp;
				}
				target.mp += mp;
				player.mp -= mp;
				if (player.party == target.party && player != target) {
					add_pdps(player, target, mp * 2);
				}
				disappearing_text(player.socket, player, "-" + mp, { color: "mana", xy: 1 });
				disappearing_text(target.socket, target, "+" + mp, { color: "mana", xy: 1 });
				target.s[G.skills[data.name].condition] = { ms: G.conditions[G.skills[data.name].condition].duration };
				xy_emit(player, "ui", { type: "energize", from: player.name, to: target.name });
				resend(target, "u+cid");
				resend(player, "u+cid");
			}
			if (data.name == "alchemy") {
				var gold = 0;
				var rate = 0.8;
				if (player.level >= 100) {
					rate = 1.12;
				} else if (player.level >= 90) {
					rate = 1.1;
				} else if (player.level >= 80) {
					rate = 1.06;
				} else if (player.level >= 70) {
					rate = 1;
				} else if (player.level >= 60) {
					rate = 0.92;
				} else if (player.level >= 50) {
					rate = 0.86;
				}
				consume_mp(player, G.skills[data.name].mp);
				xy_emit(player, "ui", { type: "alchemy", name: player.name });
				for (var i = 0; i < player.isize; i++) {
					if (!player.items[i] || player.items[i].l) {
						continue;
					}
					gold = calculate_item_value(player.items[i]);
					consume_one(player, i);
					break;
				}
				player.gold += gold * rate;
				resend(player, "reopen");
				socket.emit("game_response", { response: "gold_received", gold: gold * rate });
			}
			if (cool) {
				consume_skill(player, data.name);
			}
			if (player.to_resend) {
				resend(player, player.to_resend);
			}
			if (reject) {
				if (!reject.response) {
					reject.response = "data";
				}
				socket.emit("game_response", reject);
			} else if (resolve) {
				socket.emit("game_response", resolve);
			}
		});
		socket.on("click", function (data) {
			// You'll be missed 'click' method, the 'click' method was the first method on this server, it was used as an attack method up until [17/06/18] - at this date, there were 3 simple conditions left which checked for data.button=="right" - the game matured so that all interactions were handled client-side rather than processed server-side
			socket.emit("game_log", "'click' method is deprecated.");
		});
		socket.on("attack", function (data) {
			return socket.fs.skill({ name: "attack", id: data.id });
		});
		socket.on("heal", function (data) {
			return socket.fs.skill({ name: "heal", id: data.id });
		});
		socket.on("interaction", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.type == "newyear_tree") {
				var x = "";
				if (
					!G.maps[player.map].ref ||
					!G.maps[player.map].ref[data.type] ||
					distance(G.maps[player.map].ref[data.type], player, true) > 300
				) {
					return socket.emit("game_response", "distance");
				}
				if (!player.s.holidayspirit && player.esize) {
					add_item(player, "funtoken");
					x = "+reopen";
				}
				add_condition(player, "holidayspirit");
				resend(player, "u+cid" + x);
			} else if (["redorb", "blueorb", "greenorb", "yelloworb"].includes(data.type)) {
				if (
					!G.maps[player.map].ref ||
					!G.maps[player.map].ref[data.type] ||
					distance(G.maps[player.map].ref[data.type], player, true) > 40
				) {
					return socket.emit("game_response", "distance");
				}
				["redorb", "blueorb", "greenorb", "yelloworb"].forEach(function (s) {
					delete player.s[s];
				});
				add_condition(player, data.type);
				resend(player, "u+cid");
			} else if (data == "the_lever") {
				if (player.map != "resort_e") {
					return socket.emit("game_response", "distance");
				}
				player.s.magiport = { ms: 300 };
				player.s.magiport.x = player.x;
				player.s.magiport.y = player.y;
				player.s.magiport.f = player.name;
				player.s.magiport.in = "resort";
				player.s.magiport.map = "resort";
				resend(player, "u+cid");
			} else if (data.type == "dailytask") {
				if (!G.maps.main.ref.dailytask || distance(G.maps.main.ref.dailytask, player, true) > 150) {
					return socket.emit("game_response", "distance");
				}
				player.p.monsterhunt = { ms: 60 * 60 * 1000, m: "goo" };
				socket.emit("game_response", { response: "monsterhunt", monster: "goo" });
			} else if (data.key && player.konami) {
				if (data.key == "B" && player.konami.length < 20) {
					player.konami.push(data.key[0]);
				} else if (data.key == "A") {
					if (player.konami.join("") == "uuddlrlrB") {
						player.tskin = "konami";
						resend(player, "u+cid");
						if (!player.p.target_lock || !G.monsters[player.p.target_lock] || hsince(player.p.dt.last_tl) > 15 * 24) {
							var monsters = [];
							for (var name in G.monsters) {
								if (!G.monsters[name].special && !G.monsters[name].stationary && G.monsters[name].c) {
									monsters.push(name);
								}
							}
							player.p.target_lock = random_one(monsters);
							player.p.dt.last_tl = new Date();
						}
						socket.emit("game_response", { response: "target_lock", monster: player.p.target_lock });
					} else {
						player.konami = [];
					}
				}
			}
		});
		socket.on("mreport", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var a = 0;
			var b = 0;
			a = parseFloat(data.x) || 0;
			b = parseFloat(data.y) || 0;
			// console.log(JSON.stringify(data));
			socket.emit("game_log", "" + simple_distance({ x: player.x, y: player.y }, { x: a, y: b }));
		});
		socket.on("move", function (data) {
			// if(observers[socket.id]) observers[socket.id].x=data.x,observers[socket.id].y=data.y; Old observer code [17/02/17]
			var player = players[socket.id];
			var current = -1;
			var going = -1;
			var actual = true;
			var x = parseFloat(data.going_x) || 0;
			var y = parseFloat(data.going_y) || 0;
			if (data.pet) {
				player = player.monster;
				actual = false;
			}
			if (data.key && (!player.konami || player.konami.length < 20)) {
				// console.log(data.key);
				if (!player.konami) {
					player.konami = [];
				}
				player.konami.push(data.key[0]);
			}
			if (player && player.m == data.m && can_walk(player) && (x != player.x || y != player.y)) {
				// if(is_sdk) server_log("Player moving to: "+data.going_x+","+data.going_y);

				// player.x=data.x; player.y=data.y; [03/08/16] Seems like a really bad idea to update x/y based on what players provide
				data.x = parseFloat(data.x) || 0;
				data.y = parseFloat(data.y) || 0;
				player.going_x = x;
				player.going_y = y;
				if (smap_data[player.map] != -1 && mode.enforce_smap) {
					current = smap_data[player.map][rphash(data.x, data.y)];
					going = smap_data[player.map][rphash(player.going_x, player.going_y)];
					// server_log("current:"+current+" going:"+going+" real:"+smap_data[player.map][phash(player.x,player.y)]);
					if (current === undefined || current >= 2 || going === undefined || going >= 2) {
						server_log(
							"#C cheater: " +
								player.name +
								" current: " +
								current +
								"[" +
								data.x +
								"," +
								data.x +
								"] going: " +
								going +
								"[" +
								player.going_x +
								"," +
								player.going_y +
								"] at " +
								player.map,
							1,
						);
						appengine_log("violation", "move_line: " + player.name + " afk: " + player.afk + " code: " + player.code);
						player.socket.emit("game_log", "Line violation detected");
						player.socket.emit("game_log", "Make sure you only move with the built-in move function");
						defeat_player(player);
						transport_player_to(player, "jail");
						return;
					}
				}
				// player.check_x=player.going_x; player.check_y=player.going_y; player.checked_xy=false;
				start_moving_element(player);
				if (
					!player.pet &&
					simple_distance(player, { x: data.x, y: data.y }) > 132 &&
					current == 0 &&
					mode.lcorrection
				) {
					// server_log("Correction sent");
					socket.emit("correction", { x: player.x, y: player.y });
				}
				if (actual) {
					var change = false;
					for (var id in player.c) {
						if (G.conditions[id] && !G.conditions[id].can_move) {
							change = true;
							delete player.c[id];
						}
					}
					if (change) {
						resend(player, "u+cid");
					}
				}
				//if(smap_data[player.map][rphash(player.x,player.y)]===0) push_xyh(player,player.x,player.y);
				//else push_xyh(player,data.x,data.y);
			}
		});
		socket.on("open_chest", function (data) {
			var chest = chests[data.id];
			var player = players[socket.id];
			var reopen = false;
			if (!player) {
				return;
			}
			var r = { id: data.id, goldm: player.goldm, opener: player.name, items: [] };
			if (chest && simple_distance(chest, player) > 400) {
				r.goldm = 1;
				r.dry = true;
			}
			if (chest && msince(chest.date) > 8) {
				r.goldm = 1;
				r.stale = true;
			}
			if (player.map == "woffice" || G.maps[player.map].mount || is_invis(player)) {
				return fail_response("loot_failed");
			}
			try {
				if (chest && !chest.pvp && chest.gold > 100000000 && !player.stealth) {
					broadcast("server_message", {
						message: player.name + " looted " + to_pretty_num(server_tax(round(chest.gold * r.goldm), true)) + " gold",
						color: "gold",
						type: "server_gold",
						name: player.name,
					});
				}
				if (chest && player.owner && chest.owners && !in_arr(player.owner, chest.owners) && !W.chest[player.owner]) {
					W.chest[player.owner] = new Date();
					server_log("SEVERE - Cross Loot from " + player.name + " not from " + chest.owners.toString());
				}
				if (chest && !player.party) {
					var all_items = chest.items.slice(0);
					all_items.concat(chest.pvp_items);
					if (!can_add_items(player, all_items)) {
						return fail_response("loot_no_space");
					}
					delete chests[data.id]; // The add_shells routine was at the top, so when inventory was full, attempting to open the chest gave shells infinitely, repeated lesson, always remove before adding, or exceptions [11/07/18]
					if (chest && chest.cash) {
						add_shells(player, chest.cash, "chest", true, "override");
					}
					chest.items.forEach(function (item) {
						item.src = "pvp";
						add_item(player, item, { found: 1, m: 1, v: B.v });
						reopen = true;
						var ritem = cache_item(item);
						ritem.looter = player.name;
						r.items.push(ritem);
						socket.emit("game_log", { message: "Found " + item_to_phrase(item), color: "#4BAEAA" });
						if (player.t) {
							player.t.dgold += round(G.items[item.name].g * 0.6);
						}
					});
					(chest.pvp_items || []).forEach(function (item) {
						item.v = new Date();
						if (can_add_item(player, item)) {
							add_item(player, item, { found: 1, v: B.v });
							reopen = true;
							var ritem = cache_item(item);
							ritem.looter = player.name;
							ritem.pvp_loot = true;
							r.items.push(ritem);
							socket.emit("game_log", { message: "Looted " + item_to_phrase(item), color: "#4BAEAA" });
						} else {
							lostandfound_logic(item);
							var ritem = cache_item(item);
							ritem.looter = null;
							ritem.lostandfound = true;
							r.items.push(ritem);
							socket.emit("game_log", { message: "Lost " + item_to_phrase(item), color: "#AB4E4F" });
						}
					});
					r.gold = round(chest.gold * r.goldm) + round(chest.egold || 0);
					r.gold = server_tax(r.gold);
					player.gold += r.gold;
					if (player.t) {
						player.t.cgold += r.gold;
					}
					if (r.gold) {
						socket.emit("game_log", { message: to_pretty_num(r.gold) + " gold", color: "gold" });
					}
					socket.emit("disappearing_text", {
						message: "+" + r.gold,
						x: chest.x,
						y: chest.y - 10,
						args: { color: "+gold", size: "large" },
					});
					if (!r.items.length) {
						delete r.items;
					}
					resend(player, (reopen && "reopen+nc+inv") || "");
					socket.emit("chest_opened", r);
				} else if (chest) {
					// var gold=round(chest.gold/parties[player.party].length);
					r.party = true;
					var chest = chests[data.id];
					var reopen = {};
					delete chests[data.id];
					if (chest && chest.cash) {
						add_shells(player, chest.cash, "chest", true, "override");
					}
					chest.items.forEach(function (item) {
						// console.log(item);
						var pool = 0;
						var can = {};
						parties[player.party].forEach(function (name) {
							var current = players[name_to_id[name]];
							if (current && can_add_item(current, item)) {
								pool += current.share;
								can[name] = true;
							}
						});
						var pool_winner = Math.random() * pool;
						var pool_current = 0;
						var awarded = false;
						parties[player.party].forEach(function (name) {
							if (awarded) {
								return;
							}
							var current = players[name_to_id[name]];
							if (current && can[name]) {
								if (pool_winner <= pool_current + current.share) {
									awarded = true;
									add_item(current, item, { found: 1, m: 1, v: B.v });
									reopen[current.id] = true;
									var ritem = cache_item(item);
									ritem.looter = current.name;
									r.items.push(ritem);
									party_emit(player.party, "game_log", {
										message: current.name + " found " + item_to_phrase(item),
										color: "#4BAEAA",
									});
									if (current.t) {
										current.t.dgold += round(G.items[item.name].g * 0.6);
									}
								} else {
									pool_current += current.share;
								}
							}
						});
						if (!awarded) {
							lostandfound_logic(item);
							var ritem = cache_item(item);
							ritem.looter = null;
							ritem.lostandfound = true;
							r.items.push(ritem);
							party_emit(player.party, "game_log", { message: "Lost " + item_to_phrase(item), color: "#AB4E4F" });
						}
					});
					(chest.pvp_items || []).forEach(function (item) {
						item.v = new Date();
						var pool = 0;
						var can = {};
						parties[player.party].forEach(function (name) {
							var current = players[name_to_id[name]];
							if (current && current.share && can_add_item(current, item)) {
								pool += current.share;
								can[name] = true;
							}
						});
						var pool_winner = Math.random() * pool;
						var pool_current = 0;
						var awarded = false;
						parties[player.party].forEach(function (name) {
							if (awarded) {
								return;
							}
							var current = players[name_to_id[name]];
							if (current && can[name]) {
								if (pool_winner <= pool_current + current.share) {
									awarded = true;
									add_item(current, item, { found: 1, v: B.v });
									reopen[current.id] = true;
									var ritem = cache_item(item);
									ritem.looter = current.name;
									ritem.pvp_loot = true;
									r.items.push(ritem);
									party_emit(player.party, "game_log", {
										message: current.name + " looted " + item_to_phrase(item),
										color: "#4BAEAA",
									});
								} else {
									pool_current += current.share;
								}
							}
						});
						if (!awarded) {
							lostandfound_logic(item);
							var ritem = cache_item(item);
							ritem.looter = null;
							ritem.pvp_loot = true;
							ritem.lostandfound = true;
							r.items.push(ritem);
							party_emit(player.party, "game_log", { message: "Lost " + item_to_phrase(item), color: "#AB4E4F" });
						}
					});
					parties[player.party].forEach(function (name) {
						var current = players[name_to_id[name]];
						var cgold =
							round(chest.gold * (current.share || 0) * r.goldm) + round((chest.egold || 0) * (current.share || 0));
						r.gold = cgold = server_tax(cgold);
						current.gold += cgold;
						if (current.t) {
							current.t.cgold += cgold;
						}
						if (cgold) {
							current.socket.emit("game_log", { message: to_pretty_num(cgold) + " gold", color: "gold" });
						}
						if (current.in == player.in) {
							current.socket.emit("disappearing_text", {
								message: "+" + cgold,
								x: chest.x,
								y: chest.y - 10,
								args: { color: "gold", size: "large" },
							});
						}
						resend(current, (reopen[current.id] && "reopen+nc+inv") || "");
						current.socket.emit("chest_opened", r);
					});
				} else {
					socket.emit("chest_opened", { id: data.id, gone: true });
				}
			} catch (e) {
				delete chests[data.id]; // If this didn't exist, any exception would end up being a source for infinite gold and items
				log_trace("#X chest_error", e);
				return fail_response("error");
			}
		});
		socket.on("auth", function (data) {
			if (gameplay == "test" && data.passphrase != "potato salad") {
				return socket.emit("game_log", "Wrong passphrase!");
			}
			if (observers[socket.id] && observers[socket.id].auth_engaged) {
				return socket.emit("game_log", "Authorization in progress.");
			}
			if (dc_players[data.character]) {
				return socket.emit("game_log", "Authorization in progress.");
			}
			if (!server.live || !observers[socket.id] || players[socket.id]) {
				return;
			}
			if (Object.keys(players).length >= max_players) {
				socket.emit("game_error", "Can't accept more than " + max_players + " players at this time");
				return;
			}
			socket.observer_secret = randomStr(24);
			observers[socket.id].auth_engaged = true;
			appengine_call(
				"start_character",
				{
					auth: data.user + "-" + data.auth,
					secret: socket.observer_secret,
					code_slot: data.code_slot,
					character: data.character,
					mode: gameplay,
					ip: get_ip(socket),
					suffix: "/" + data.character,
				},
				function (result) {
					if (observers[socket.id]) {
						observers[socket.id].auth_engaged = false;
					}
					if (result.failed) {
						socket.emit("game_error", "Failed: " + result.reason);
						return;
					}
					// console.log(JSON.stringify(result));
					server_log("start_character: " + JSON.stringify(result.character.name), 1);
					var player = { u: true, is_player: true, humanoid: true, secret: socket.observer_secret };
					for (prop in result.character) {
						player[prop] = result.character[prop];
					}
					if (!instances[player.map] || !instances[player.map].allow || instances[player.map].mount) {
						var place = G.maps[player.map].on_exit || G.maps[B.start_map].on_exit || ["main", 0];
						player.map = player.in = place[0];
						player.x = G.maps[player.map].spawns[place[1]][0];
						player.y = G.maps[player.map].spawns[place[1]][1];
					} else {
						player.in = player.map;
					}
					player.owner = data.user;
					player.auth = data.user + "-" + data.auth;
					player.last_sync = new Date();
					player.socket = socket;
					player.max_stats = result.stats;

					if (data.bot == variables.bot_key) {
						player.bot = true;
						player.afk = "bot";
					}
					if (data.no_html) {
						player.afk = "code";
						try {
							player.controller = (name_to_id[data.no_html] && data.no_html) || "";
						} catch (e) {
							player.controller = "";
						}
					}
					if (!player.afk) {
						player.afk = true;
					}
					if (gameplay == "test") {
						player.name += parseInt(Math.random() * 10000);
					}
					player.real_id = player.id;
					player.id = player.name;

					player.total_ips = 1;
					player.width = 26;
					player.height = 36;
					player.damage_type = G.classes[player.type].damage_type;
					player.xrange = 25;
					player.red_zone = 0;
					player.targets = player.targets_p = player.targets_m = player.targets_u = 0;
					player.cid = 1;
					player.hits = 0;
					player.kills = 0;
					player.m = 0; // map number
					/* party variables*/
					player.pdps = 0;
					player.party_length = 1;
					player.party_luck = 0;
					player.party_xp = 0;
					player.party_gold = 0;
					player.share = 0.1;
					player.cx = player.cx || {};
					if (!player.s) {
						player.s = {};
					}
					player.t = { mdamage: 0, cgold: 0, dgold: 0, xp: 0, start: new Date() };
					player.hitchhikers = []; // socket events to be registered after a resend
					player.last = { attack: future_ms(-1200), attacked: really_old };
					player.bets = {};
					player.base = dbase;
					player.age = parseInt(ceil(hsince(new Date(player.created)) / 24.0));
					// player.vision=[round((data.width/2)/data.scale)+B.ext_vision,round((data.height/2)/data.scale)+B.ext_vision];
					// player.vision[0]=min(1000,player.vision[0]);
					// player.vision[1]=min(700,player.vision[1]);
					player.vision = B.vision;

					if (!player.verified) {
						player.s.notverified = { ms: 30 * 60 * 1000 };
					} else if (player.s.notverified) {
						player.s.notverified = { ms: 100 };
					}

					if (player.guild) {
						console.log(player.guild);
						player.guild = player.guild.short;
					}

					if (gameplay == "hardcore") {
						reset_player(player);
					} //  || gameplay=="test"

					init_player(player);
					if (!observers[socket.id]) {
						// observer hang up before "auth"
						server_log("Abrupt stop for " + result.character.name, 1);
						if (gameplay != "hardcore" && gameplay != "test") {
							dc_players[player.real_id] = player;
						}
						sync_loop();
						return;
					}
					try {
						delete_observer(socket);
					} catch (e) {}

					players[socket.id] = player;
					resume_instance(instances[player.in]);
					instances[player.in].players[player.id] = player;
					pmap_add(player);

					name_to_id[player.name] = socket.id;
					id_to_id[player.id] = socket.id;

					cache_player_items(player);
					invincible_logic(player);
					serverhop_logic(player);
					calculate_player_stats(player);

					if (data.epl == "mas" && data.receipt) {
						player.platform = "mas";
						verify_mas_receipt(player, data.receipt);
					} else if (data.epl == "steam" && data.ticket) {
						player.platform = "steam";
						verify_steam_ticket(player, data.ticket);
					} else {
						player.platform = "web";
						if (result.character.pid) {
							player.auth_id = result.character.pid;
						} // part of the new restriction system [02/05/19]
					}

					if (mode.drm_check) {
						if (result.character.drm && !player.auth_id) {
							player.s.authfail = { ms: 900000 * 1000 };
						} else if (player.s.authfail) {
							player.s.authfail = { ms: 100 };
						}
					}

					if (!is_player_allowed(player)) {
						socket.emit("disconnect_reason", "limits");
						socket.disconnect();
					} else {
						var cdata = player_to_client(player);
						player.ipass = cdata.ipass = randomStr(12);
						player.last_ipass = new Date();
						player.last.attack = future_ms(-10000);
						player.last.transport = future_ms(-10000);
						cdata.home = player.p.home;
						cdata.friends = player.friends;
						cdata.acx = player.p.acx;
						cdata.xcx = player.p.xcx;
						cdata.emx = player.p.emx;
						cdata.info = instances[player.in].info;
						cdata.base_gold = D.base_gold;
						broadcast_e(true);
						cdata.s_info = E;
						if (result.code) {
							cdata.code = result.code;
							cdata.code_slot = result.code_slot;
							cdata.code_version = result.code_version;
						}
						cdata.entities = send_all_xy(player, { raw: true });
						socket.emit("start", cdata);
						total_players++;
					}
				},
				function (err) {
					server_log("start_character_failed: " + data.character + " reason: " + err, 1);
					if (observers[socket.id]) {
						observers[socket.id].auth_engaged = false;
					}
				},
			);
		});
		socket.on("use", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.item == "hp" || data.item == "mp") {
				if (player.last.potion && mssince(player.last.potion) < 0) {
					return fail_response("not_ready");
				}
				player.last.potion = future_ms(4000);
				if (data.item == "hp") {
					player.hp += 50;
					disappearing_text(socket, player, "+50", { color: "green", xy: 1, s: "hp", nohp: 1 });
				}
				if (data.item == "mp") {
					player.mp += 100;
					disappearing_text(socket, player, "+100", { color: "#006AA9", xy: 1, s: "mp", nomp: 1 });
				}
				player.hp = min(player.hp, player.max_hp);
				player.mp = min(player.mp, player.max_mp);
				// calculate_player_stats(player); [22/11/16]
				player.cid++;
				player.u = true;
				socket.emit("player", player_to_client(player));
				socket.emit("eval", { code: "pot_timeout(4000)" });
			}
			success_response({});
		});
		socket.on("friend", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			server_log("friend: " + JSON.stringify(data));
			if (data.event == "request") {
				var friend = players[name_to_id[data.name || ""]];
				if (!friend) {
					return fail_response("friend_rleft");
				}
				if (in_arr(friend.owner, player.friends) || friend.owner == player.owner) {
					return success_response("friend_already");
				}
				requests[player.name + "-" + friend.name] = { a: player.owner, b: friend.owner };
				friend.socket.emit("friend", { event: "request", name: player.name });
				return success_response("friend_rsent");
			}
			if (data.event == "accept") {
				if (!requests[data.name + "-" + player.name]) {
					return fail_response("friend_expired");
				}
				appengine_call(
					"set_friends",
					{ user1: requests[data.name + "-" + player.name].a, user2: requests[data.name + "-" + player.name].b },
					function (result) {
						var player = players[socket.id];
						if (result.failed) {
							if (player) {
								socket.emit("game_response", { response: "friend_failed", reason: result.reason });
							}
							return;
						}
						//var friend=players[name_to_id[data.name||""]];
						//if(player)
						//if(friend) friend.emit("friend",{event:"accepted",name:player.name});
					},
					function () {
						var player = players[socket.id];
						if (player) {
							socket.emit("game_response", { response: "friend_failed", reason: "coms failure" });
						}
					},
				);
				requests[data.name + "-" + player.name] = false;
			}
			if (data.event == "unfriend") {
				appengine_call(
					"not_friends",
					{ user1: player.owner, user2: data.name },
					function (result) {
						var player = players[socket.id];
						if (result.failed) {
							if (player) {
								socket.emit("game_response", { response: "unfriend_failed", reason: result.reason });
							}
							return;
						}
					},
					function () {
						var player = players[socket.id];
						if (player) {
							socket.emit("game_response", { response: "unfriend_failed", reason: "coms failure" });
						}
					},
				);
			}
			success_response({ success: false, in_progress: true });
		});
		socket.on("duel", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.event == "challenge") {
				var invited = players[name_to_id[data.id || data.name]];
				if (!invited || invited.id == player.id) {
					return socket.emit("game_log", "Invalid");
				}
				if (invited.duel || player.duel) {
					return socket.emit("game_log", "Already dueling");
				}
				invited.socket.emit("duel", { event: "chellenge", name: player.name });
				socket.emit("game_response", { response: "challenge_sent", name: invited.name });
				invited.socket.emit("game_response", { response: "challenge_received", name: player.name });
				challenges[player.name] = invited.name;
			} else if (data.event == "accept") {
				var challenger = players[name_to_id[data.id || data.name]];
				if (!challenger || challenges[challenger.name] != player.name) {
					return socket.emit("game_log", "Challenge expired");
				}
				if (challenger.duel || player.duel) {
					return socket.emit("game_log", "Already dueling");
				}
				if (is_in_pvp(challenger) || is_in_pvp(player)) {
					return socket.emit("game_log", "Can't start a duel if any of the parties are already in a pvp zone");
				}
				delete challenges[challenger.name];
				challenger.socket.emit("game_response", { response: "challenge_accepted", name: player.name });
				var name = randomStr(20);
				var a = [];
				var b = [];
				instance = create_instance(name, "duelland");
				instance.info = {
					seconds: (is_sdk && 20) || 60,
					active: false,
					A: [player_to_summary(challenger)],
					B: [player_to_summary(player)],
					id: name,
				};
				instance.info.A[0].active = true;
				instance.info.B[0].active = true;
				clean_slate(challenger);
				transport_player_to(challenger, name, 1);
				if (challenger.party) {
					parties[challenger.party].forEach(function (p) {
						a.push(p);
					});
				} else {
					a = [challenger.name];
				}
				clean_slate(player);
				transport_player_to(player, name, 2);
				if (player.party) {
					parties[player.party].forEach(function (p) {
						b.push(p);
					});
				} else {
					b = [player.name];
				}
				if (!E.duels) {
					E.duels = {};
				}
				var duel = {
					challenger: challenger.name,
					a: a,
					vs: player.name,
					b: b,
					instance: name,
					seconds: (is_sdk && 20) || 60,
					active: false,
					id: name,
				};
				challenger.team = "A";
				challenger.duel = duel;
				challenger.s.stunned = { ms: 120000 };
				resend(challenger, "u+cid");
				player.team = "B";
				player.duel = duel;
				player.s.stunned = { ms: 120000 };
				resend(player, "u+cid");
				E.duels[name] = duel;
				broadcast_e();
				a.forEach(function (p) {
					if (p != challenger.name && get_player(p)) {
						get_player(p).socket.emit("game_response", {
							response: "duel_started",
							challenger: challenger.name,
							vs: player.name,
							id: name,
						});
					}
				});
				b.forEach(function (p) {
					if (p != player.name && get_player(p)) {
						get_player(p).socket.emit("game_response", {
							response: "duel_started",
							challenger: challenger.name,
							vs: player.name,
							id: name,
						});
					}
				});
			} else if (data.event == "enter") {
				if (is_in_pvp(player)) {
					return socket.emit("game_log", "Can't join the duel from a pvp zone!");
				}
				if (player.duel) {
					return socket.emit("game_log", "Already in a duel!");
				}
				if (!E.duels[data.id]) {
					return socket.emit("game_log", "Duel expired");
				}
				if (E.duels[data.id].active) {
					return socket.emit("game_log", "Duel already started");
				}
				if (!(E.duels[data.id].a.includes(player.name) || E.duels[data.id].b.includes(player.name))) {
					return socket.emit("game_log", "Not your duel");
				}
				clean_slate(player);

				if (E.duels[data.id].a.includes(player.name)) {
					transport_player_to(player, data.id, 1);
					player.team = "A";
				} else {
					transport_player_to(player, data.id, 2);
					player.team = "B";
				}

				player.duel = E.duels[data.id];
				if (player.duel.a.includes(player.name)) {
					instances[data.id].info.A.push(player_to_summary(player));
					instances[data.id].info.A[instances[data.id].info.A.length - 1].active = true;
				} else {
					instances[data.id].info.B.push(player_to_summary(player));
					instances[data.id].info.B[instances[data.id].info.B.length - 1].active = true;
				}
				player.s.stunned = { ms: 120000 };

				resend(player, "u+cid");
				instance_emit(data.id, "game_chat", { message: player.name + " joined the duel!" });
			}
		});
		socket.on("party", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.event == "invite") {
				// if(player.party && player.party!=player.name) { socket.emit("game_log","Only the party leader can send invites"); return; }
				if (player.party && (parties[player.party].length >= limits.party_max || player.party_length >= limits.party)) {
					return fail_response("party_full");
				}
				var invited = players[name_to_id[data.id || data.name]];
				if (!invited || invited.id == player.id) {
					return fail_response("invalid");
				}
				if (player.party && player.party == invited.party) {
					return success_response("already_in_party");
				}
				// if(invited.party) { socket.emit("game_log",invited.name+" is already partying"); return; }
				invited.socket.emit("invite", { name: player.name });
				socket.emit("game_log", "Invited " + invited.name + " to party");
				if (!invitations[player.name]) {
					invitations[player.name] = {};
				}
				invitations[player.name][invited.id] = 1;
			}
			if (data.event == "request") {
				// if(player.party) { return; }
				var invited = players[name_to_id[data.id || data.name]];
				if (!invited || invited.id == player.id) {
					return fail_response("invalid");
				}
				if (player.party && player.party == invited.party) {
					return success_response("already_in_party");
				}
				// if(!invited.party) { socket.emit("game_log",invited.name+" isn't partying"); return; }
				invited.socket.emit("request", { name: player.name });
				socket.emit("game_log", "Requested to join " + invited.name + "'s party");
				if (!requests[player.name]) {
					requests[player.name] = {};
				}
				requests[player.name][invited.id] = 1;
			}
			if (data.event == "accept") {
				var inviter = players[name_to_id[data.name]];
				// if(player.party) { socket.emit("party_update",{list:parties[player.party],party:party_to_client(player.party)}); socket.emit("game_log","Already partying"); return; }
				// if(!inviter || (inviter.party && inviter.party!=inviter.name)) { socket.emit("game_log","Party was disbanded"); return; }
				if (!inviter) {
					return fail_response("player_gone", { name: data.name });
				}
				if (
					inviter.party &&
					(parties[inviter.party].length >= limits.party_max || inviter.party_length >= limits.party)
				) {
					return fail_response("party_full");
				}
				if (!invitations[inviter.name] || !invitations[inviter.name][player.id]) {
					return fail_response("invitation_expired");
				}
				if (player.party && player.party == inviter.party) {
					return success_response("already_in_party");
				}
				if (player.party) {
					leave_party(player.party, player);
					socket.emit("party_update", {});
					socket.emit("game_log", "Left your current party");
				}
				invitations[inviter.name][player.id] = 0;
				if (!inviter.party) {
					inviter.party = inviter.name;
					parties[inviter.name] = [inviter.name];
					resend(inviter, "nc+u+cid");
					delete requests[inviter.name];
					if (!players[name_to_id[data.name]]) {
						return fail_response("player_gone", { name: data.name });
					} // these repetitions are all because socket.emit's can cause in-line disconnects and disband parties right after creation [07/08/20]
				}
				player.party = inviter.party;
				parties[inviter.party].push(player.name);
				party_emit(player.party, "party_update", {
					list: parties[inviter.party],
					party: party_to_client(inviter.party),
					message:
						player.name +
						" joined the party" +
						((inviter.party != inviter.name && " with " + inviter.name + "'s invite") || ""),
				});
				resend(player, "nc+u+cid");
				delete requests[player.name];
				delete requests[inviter.name]; // optional
			}
			if (data.event == "raccept") {
				var requester = players[name_to_id[data.name]];
				if (!requester) {
					return fail_response("player_gone", { name: data.name });
				}
				// if(requester.party) { socket.emit("game_log","Already partying"); return; }
				if (player.party && (parties[player.party].length >= limits.party_max || player.party_length >= limits.party)) {
					return fail_response("party_full");
				}
				if (!requests[requester.name] || !requests[requester.name][player.id]) {
					return fail_response("request_expired");
				}
				if (player.party && player.party == requester.party) {
					return success_response("already_in_party");
				}
				if (requester.party) {
					leave_party(requester.party, requester);
					requester.socket.emit("party_update", {});
					requester.socket.emit("game_log", "Left the party");
					if (!players[name_to_id[data.name]]) {
						return fail_response("player_gone", { name: data.name });
					}
				}
				requests[requester.name][player.id] = 0;
				if (!player.party) {
					player.party = player.name;
					parties[player.name] = [player.name];
					resend(player, "nc+u+cid");
					delete requests[player.name];
				}
				requester.party = player.party;
				parties[player.party].push(requester.name);
				party_emit(requester.party, "party_update", {
					list: parties[player.party],
					party: party_to_client(player.party),
					message: requester.name + " joined the party",
				});
				resend(requester, "nc+u+cid");
				delete requests[requester.name];
				delete requests[player.name]; // optional
			}
			if (data.event == "leave") {
				if (!player.party) {
					socket.emit("party_update", {});
					return success_response({});
				}
				leave_party(player.party, player);
				socket.emit("party_update", {});
				socket.emit("game_log", "Left the party");
				resend(player, "nc+u+cid");
			}
			if (data.event == "kick") {
				if (!player.party) {
					return success_response({});
				}
				// if(player.party && player.party!=player.name) { socket.emit("game_log","Only the party leader can kick someone"); return; }
				if (!in_arr(data.name, parties[player.party])) {
					socket.emit("party_update", { list: parties[player.party], party: party_to_client(player.party) });
					return success_response({});
				}
				if (parties[player.party].indexOf(player.name) > parties[player.party].indexOf(data.name)) {
					return fail_response("cant_kick");
				}
				var kicked = players[name_to_id[data.name]];
				if (!kicked) {
					return fail_response("player_gone");
				}
				leave_party(player.party, kicked);
				if (player.party) {
					party_emit(player.party, "game_log", player.name + " kicked " + kicked.name);
				}
				kicked.socket.emit("party_update", {});
				kicked.socket.emit("game_log", "You've been removed from the party");
				resend(kicked, "nc+u+cid");
			}
			success_response({});
		});
		socket.on("magiport", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (magiportations[data.name] && magiportations[data.name][player.name] && get_player(data.name)) {
				delete magiportations[data.name][player.name];
				if (instances[get_player(data.name).in].mount != instances[player.in].mount) {
					return fail_response("cant_in_bank");
				}
				if (!magiport_someone(player, get_player(data.name))) {
					return fail_response("invalid");
				}
				return success_response({});
			} else {
				player.socket.emit("game_response", { response: "magiport_gone", name: data.name });
				return fail_response("inviter_gone");
			}
		});
		socket.on("trade", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (data.event == "show" && player.p.trades != 1) {
				player.p.trades = 1;
				reslot_player(player);
				resend(player, "nc+u+cid");
			} else if (data.event == "hide" && player.p.trades != null) {
				player.p.trades = null;
				reslot_player(player);
				resend(player, "nc+u+cid");
			}
		});
		socket.on("signup", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (!signups[player.name]) {
				disappearing_text(false_socket, npcs.bean, "+1", { color: "#4D9A59", xy: 1 });
			}
			signups[player.name] = true;
			socket.emit("game_response", { response: "signed_up" });
		});
		socket.on("join", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (player.type == "merchant") {
				return fail_response("no_merchants");
			}
			if (player.s.hopsickness) {
				return fail_response("cant_when_sick");
			}
			if (player.user) {
				return fail_response("cant_in_bank");
			}
			if (data.name == "goobrawl" && events.goobrawl) {
				if (player.map != "goobrawl") {
					transport_player_to(player, "goobrawl");
				}
			} else if (data.name == "crabxx" && events.crabxx) {
				if (simple_distance(player, { map: "main", x: -1000, y: 1700 }) > 200) {
					transport_player_to(player, "main", [-1000, 1700, 0, 40]);
				}
			} else if (data.name == "franky" && events.franky) {
				if (simple_distance(player, { map: "level2w", x: -300, y: 150 }) > 200) {
					transport_player_to(player, "level2w", [-300, 150, 0, 40]);
				}
			} else if (data.name == "icegolem" && events.icegolem) {
				if (simple_distance(player, { map: "winterland", x: 820, y: 425 }) > 100) {
					transport_player_to(player, "winterland", [820, 425, 0, 10]);
				}
			} else if (data.name == "abtesting" && E.abtesting) {
				if (player.map != "abtesting" || !player.team) {
					if (
						ssince(timers.abtesting_start) > 120 &&
						(!player.p.abtesting || player.p.abtesting[0] != E.abtesting.id)
					) {
						return fail_response("join_too_late");
					}

					if (player.p.abtesting && player.p.abtesting[0] == E.abtesting.id) {
						player.team = player.p.abtesting[1];
					} else {
						player.team = random_one(["A", "B"]);
					}

					player.p.abtesting = [E.abtesting.id, player.team];

					player.team = player.p.abtesting[1]; // transport does a restore ...
					save_state(player);

					if (player.team == "A") {
						transport_player_to(player, "abtesting", 2);
					} else if (player.team == "B") {
						transport_player_to(player, "abtesting", 3);
					}

					resend(player, "cid");
				}
			} else {
				return fail_response("cant_join");
			}
			success_response();
		});
		socket.on("stop", function (data) {
			var player = players[socket.id];
			var change = false;
			if (!player) {
				return;
			}
			if (!data || !data.action) {
				if (player.s.invis) {
					step_out_of_invis(player);
					change = true;
				}
				if (Object.keys(player.c).length) {
					player.c = {};
					change = true;
				}
			} else if (data.action == "invis") {
				if (player.s.invis) {
					step_out_of_invis(player);
					change = true;
				}
			} else if (data.action == "channeling") {
				if (Object.keys(player.c).length) {
					player.c = {};
					change = true;
				}
			} else if (data.action == "teleport" || data.action == "town") {
				if (player.c.town) {
					delete player.c.town;
					change = true;
				}
			} else if (data.action == "revival") {
				if (player.c.revival) {
					delete player.c.revival;
					change = true;
				}
			}
			if (change) {
				resend(player, "u+cid");
			}
			success_response();
		});
		socket.on("tarot", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			var npc = G.maps[player.map].ref.twitch;
			if (!npc || simple_distance(npc, player) > 500) {
				return socket.emit("game_response", "distance");
			}
			for (var name in player.s) {
				if (name.startsWith("tarot")) {
					return socket.emit("game_response", "tarot_exists");
				}
			}
		});
		socket.on("bet", function (data) {
			if (!instances.tavern) {
				return;
			}
			var player = players[socket.id];
			if (!player || player.user || (player.map != "tavern" && !is_sdk)) {
				return;
			}
			if (player.s.xshotted) {
				return socket.emit("game_response", "bet_xshot");
			}
			if (data.type == "roulette") {
				if (!is_sdk) {
					return;
				} // Old routine [23/08/18]
				if (!data.odds) {
					data.odds = "black";
				}
				data.odds = "" + data.odds;
				data.gold = max(1, parseInt(data.gold) || 1);
				if (!tavern.roulette.odds[data.odds]) {
					return;
				}
				if (tavern.roulette.state != "bets") {
					socket.emit("game_log", "Not taking bets yet!");
					return;
				}
				if (Object.keys(player.bets).length >= 5) {
					socket.emit("game_log", "You already have 5 active bets");
					return;
				}
				if (player.gold < data.gold) {
					socket.emit("game_log", "Not enough gold");
					return;
				}

				socket.emit("game_log", { message: "Bet accepted on " + data.odds, color: "white" });
				socket.emit("game_log", { message: to_pretty_num(data.gold) + " gold", color: "gray" });

				var rid = randomStr(10);
				player.gold -= data.gold;
				player.bets[rid] = {
					id: rid,
					type: "roulette",
					odds: data.odds,
					gold: data.gold,
					pid: socket.id,
					state: "bet",
				};
				tavern.roulette.players[player.socket.id] = true;
				io.to("roulette").emit("bet", { name: player.name, type: "roulette", odds: data.odds, gold: data.gold });
				socket.emit("tavern", player.bets[rid]);
				resend(player, "reopen+nc");
			}
			if (data.type == "dice") {
				// server_log(JSON.stringify(data));
				var num = min(99.99, max(parseFloat(data.num) || 0, 0.01));
				var gold = max(10000, min(parseInt(data.gold) || 0, 100000000000));
				var odds = 100.0 / num;
				var dir = "down";
				if (data.dir == "up") {
					odds = 100.0 / (100 - num);
					dir = "up";
				}
				odds = min(odds, 10000);
				odds = parseFloat(floor_f2(odds));
				var win = gold * odds;
				var raw = win;
				var edge = ceil(((gold * odds - gold) * house_edge()) / 100.0);
				win = parseInt(win);
				edge = parseInt(edge);
				if (tavern.dice.state == "roll") {
					return socket.emit("game_response", "tavern_too_late");
				}
				if (tavern.dice.state != "bets") {
					return socket.emit("game_response", "tavern_not_yet");
				}
				if (gold > player.gold) {
					return socket.emit("game_response", "gold_not_enough");
				}
				if (win - edge - gold > (S.gold - house_debt()) * 0.4) {
					return socket.emit("game_response", "tavern_gold_not_enough");
				}
				if (Object.keys(player.bets).length) {
					return socket.emit("game_response", "tavern_dice_exist");
				}
				// if(Object.keys(player.bets).length>=5) return socket.emit("game_response","tavern_too_many_bets");
				// socket.emit("game_log",{"message":"Bet accepted on "+num.toFixed(2)+" "+dir.toUpperCase(),"color":"white"});
				socket.emit("game_log", { message: "Num: " + num.toFixed(2) + " " + dir.toUpperCase(), color: "white" });
				socket.emit("game_log", { message: "Bet: " + to_pretty_num(gold) + " gold", color: "gray" });

				var rid = randomStr(10);
				player.gold -= gold;
				player.bets[rid] = {
					id: rid,
					type: "dice",
					num: num,
					gold: gold,
					dir: dir,
					pid: socket.id,
					state: "bet",
					win: win,
					edge: edge,
					odds: odds,
				};
				tavern.dice.players[player.socket.id] = true;
				instance_emit(tavern, "tavern", {
					event: "bet",
					name: player.name,
					type: "dice",
					num: num,
					gold: gold,
					dir: dir,
				});
				resend(player, "reopen+nc");
			}
			if (data.type == "slots") {
				var gold = 1000000;
				if (gold > player.gold) {
					return socket.emit("game_response", "gold_not_enough");
				}
				player.gold -= gold;
				S.gold += gold;
				player.q.slots = { ms: 3000 };
				xy_emit(player, "ui", { type: "slots", player: player.name });
				socket.emit("game_response", { response: "gold_use", gold: gold, game: data.type });
				resend(player, "u+cid+reopen+nc");
			}
		});
		socket.on("tavern", function (data) {
			if (data.event == "info") {
				socket.emit("tavern", { event: "info", edge: house_edge(), max: parseInt((S.gold - house_debt()) * 0.4) });
			}
		});
		socket.on("play", function (data) {});
		socket.on("pet", function (data) {
			var player = players[socket.id];
			if (!player) {
				return;
			}
			if (!player.monster) {
				player.monster = new_monster(player.in, {
					type: player.pet,
					stype: "pet",
					x: player.x,
					y: player.y,
					owner: player.name,
					name: "Skimpy",
				});
			}
		});
		socket.on("whistle", function (data) {
			if (!player.monster) {
				return;
			}
			xy_emit(player.monster, "disappear", { id: player.monster.id });
			player.monster.x = player.x;
			player.monster.y = player.y;
			player.monster.map = player.map;
			player.monster.in = player.in;
			player.monster.u = true;
			player.monster.cid++;
		});
		socket.on("list_pvp", function (data) {
			var plist = [];
			for (var j = 1; j < 201; j++) {
				if (pend - j < 0) {
					break;
				}
				plist.push(pwns[(pend - j) % 200]);
			}
			socket.emit("pvp_list", { code: data && data.code, list: plist });
		});
		socket.on("players", function (data) {
			var player = players[socket.id];
			var sdata = [];
			if (!player) {
				return;
			} // || is_pvp
			for (var id in players) {
				var current = players[id];
				var mapn = current.map;
				current.age = parseInt(ceil(hsince(new Date(current.created)) / 24.0));
				if (is_pvp) {
					mapn = "Unknown";
					sdata.push({
						name: "Hidden",
						map: mapn,
						age: current.age,
						level: current.level,
						type: current.type,
						afk: (current.afk && 1) || 0,
						party: (current.party && "Hidden") || "",
						kills: current.kills,
					});
				} else if (!is_in_pvp(current)) {
					sdata.push({
						name: current.name,
						map: mapn,
						age: current.age,
						level: current.level,
						type: current.type,
						afk: (current.afk && 1) || 0,
						party: current.party || "",
					});
				}
			}
			socket.emit("players", sdata);
		});
		socket.on("pets", function (data) {
			var player = players[socket.id];
			var sdata = [];
			if (!player) {
				return;
			} // || is_pvp
			for (var id in player.p.pets || {}) {
				sdata.push(player.p.pets[id]);
			}
			socket.emit("players", sdata);
		});
		socket.on("harakiri", function (data) {
			var player = players[socket.id];
			if (!player || player.rip) {
				return;
			}
			defeat_player(player);
			if (!player.rip) {
				rip(player);
			}
			disappearing_text(player.socket, player, "SEPPUKU", { xy: 1, size: "huge", color: "#6F76A6" });
			resend(player, "u+cid");
		});
		socket.on("deepsea", function (data) {
			return;
			var player = players[socket.id];
			if (!player || player.rip || player.tskin == "deepsea") {
				return;
			}
			player.tskin = "deepsea";
			disappearing_text(player.socket, player, "ROARRRRRRR", { xy: 1, size: "huge", color: "#60A975" });
			resend(player, "u+cid");
		});
		socket.on("blend", function (data) {
			var player = players[socket.id];
			var min = 99999;
			var x = null;
			if (!player || player.rip) {
				return;
			}
			for (var id in instances[player.in].monsters || {}) {
				var m = instances[player.in].monsters[id];
				var c = distance(m, player, true);
				if (c < min) {
					min = c;
					x = m;
				}
			}
			if (x) {
				var skin = G.monsters[x.type].skin || x.type;
				if (player.tskin != skin) {
					player.tskin = skin;
					resend(player, "u+cid");
				}
			}
		});
		socket.on("legacify", function (data) {
			var player = players[socket.id];
			if (!player || player.rip) {
				return;
			}
			for (var i = 0; i < 42; i++) {
				if (0 && player.items[i] && !player.items[i].p && ["fury", "starkillers"].includes(player.items[i].name)) {
					player.items[i].p = "legacy";
				}
			}
			resend(player, "reopen");
		});
		socket.on("requested_ack", function (data) {
			// send "requesting_ack", to verify someone is actually connected [03/08/16]
			server_log("requested_ack" + JSON.stringify(data), 1);
		});
		socket.on("disconnect", function () {
			//#IMPORTANT: disconnect exceptions are fatal [07/08/16]
			// console.log("disconnect!");
			var player = players[socket.id];
			var observer = observers[socket.id];
			try {
				delete sockets[socket.id];
			} catch (e) {}
			if (player) {
				player.dc = true;
				try {
					defeat_player(player);
				} catch (e) {
					log_trace("#X DCERRORPVP", e);
				}
				// if(!server.live) { server_log('Ignoring the "disconnect" of '+player.name,1); return; }

				try {
					if (player.moving && distance(player, { x: player.going_x, y: player.going_y }) < 800) {
						player.x = player.going_x;
						player.y = player.going_y;
					}
				} catch (e) {
					log_trace("#X DCERRORM", e);
				}
				// to not get stuck on out-of-bounds corners

				try {
					if (player.party) {
						leave_party(player.party, player);
					}
				} catch (e) {
					log_trace("#X DCERROR1", e);
				}

				try {
					xy_emit(player, "disappear", { id: player.id, reason: "disconnect" });
				} catch (e) {
					log_trace("#X DCERROR2", e);
				}

				server_log("Disconnected Player: " + socket.id + " " + player.name + " Calls: " + socket.total_calls, 1);

				try {
					for (var bid in player.bets) {
						player.gold += player.bets[bid].gold;
					}
					player.bets = {};
				} catch (e) {
					log_trace("#X DCERRORBETS", e);
				}

				try {
					if (player.monster) {
						remove_monster(player.monster);
					}
				} catch (e) {
					log_trace("#X DCERRORPETS", e);
				}

				try {
					delete players[socket.id];
					delete instances[player.in].players[player.id];
					if (instances[player.in].solo == player.id) {
						destroy_instance(player.in);
					}
					pmap_remove(player);
				} catch (e) {
					log_trace("#X DCERROR3 ", e);
				}

				try {
					restore_state(player, true);
				} catch (e) {
					log_trace("#X DCERRORrestore", e);
				}

				try {
					if (gameplay != "hardcore" && gameplay != "test") {
						dc_players[player.real_id] = player;
						sync_loop();
					} else {
						save_player(player);
					}
				} catch (e) {
					log_trace("#X DCERROR", e);
				}
			}
			if (observer) {
				server_log("Disconnected Observer: " + socket.id + " Calls: " + socket.total_calls);
				try {
					delete_observer(socket);
				} catch (e) {
					log_trace("#X DCERRORO ", e);
				}
			}
		});
		socket.on("shutdown", function (data) {
			if (data.pass != variables.access_master) {
				return;
			}
			if (data.reason) {
				broadcast("disconnect_reason", data.reason);
			}
			setTimeout(shutdown_routine, 10000);
		});
		socket.on("notice", function (data) {
			if (data.pass != variables.access_master) {
				return;
			}
			broadcast("notice", { message: data.message });
		});
		socket.on("render", function (data) {
			if (data.pass != variables.access_master) {
				return;
			}
			var player = players[socket.id];
			var output = "";
			var json_output = undefined;
			var window = null;
			var after = "";
			try {
				eval(data.code);
			} catch (e) {
				output = "Exception: " + e;
			}
			if (window) {
				socket.emit("simple_eval", {
					window: window,
					after: after,
					code: "for(var id in data.window) window[id]=data.window[id]; eval(data.after);",
				});
			} else if (json_output !== undefined) {
				socket.emit("simple_eval", { output: output, json_output: json_output, code: "show_json(data.json_output)" });
			} else {
				socket.emit("simple_eval", {
					output: output,
					json_output: json_output,
					code: 'show_modal("<pre>"+data.output+"</pre>")',
				});
			}
			resend(player, "reopen+u+cid");
		});
		socket.on("error", function (data) {
			// socket.emit("error") brings server down [16/02/22]
		});
		socket.on("eval", function (data) {
			if (data.command) {
				var player = players[socket.id];
				if (!player) {
					return;
				}
				if (player.map != "cyberland" || player.rip) {
					return player.socket.emit("game_log", "Not connected to the mainframe");
				}
				if (data.command == "hello") {
					xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
						owner: "mainframe",
						message: "hi",
						id: "mainframe",
					});
				} else if (data.command == "give") {
					xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
						owner: "mainframe",
						message: "what?",
						id: "mainframe",
					});
				} else if (data.command.startsWith("swap")) {
					var numbers = data.command.split(" ");
					if (numbers.length != 3) {
						xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
							owner: "mainframe",
							message: "...",
							id: "mainframe",
						});
					} else {
						var a = parseInt(numbers[1]);
						var b = parseInt(numbers[2]);
						if (0 <= a && a < 42 && 0 <= b && b < 42) {
							if (a == player.p.item_num) {
								player.p.item_num = b;
							} else if (b == player.p.item_num) {
								player.p.item_num = a;
							}
							xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
								owner: "mainframe",
								message: "done",
								id: "mainframe",
							});
						} else {
							xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
								owner: "mainframe",
								message: "ugh, ok",
								id: "mainframe",
							});
						}
					}
				} else if (data.command == "stop") {
					xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
						owner: "mainframe",
						message: "mechagnomes assemble",
						id: "mainframe",
					});
					get_monsters("mechagnome").forEach(function (m) {
						if (m.target) {
							stop_pursuit(m, { stop: 1, cause: "stop()" });
						}
						//else m.irregular=3;
					});
				} else if (data.command.startsWith("give") && data.command != "give spares") {
					xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
						owner: "mainframe",
						message: "no",
						id: "mainframe",
					});
				} else if (data.command == "secret web mode" && (player.p.steam_id || player.p.mas_auth_id)) {
					player.p.secret_web_mode = true;
					xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
						owner: "mainframe",
						message: "secret web mode unlocked",
						id: "mainframe",
					});
				} else if (data.command == "give spares") {
					if (S.misc && S.misc.spares && S.misc.spares.length) {
						xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
							owner: "mainframe",
							message: "here you go",
							id: "mainframe",
						});
						drop_one_thing(player, S.misc.spares, { x: 1, y: -88 });
						S.misc.spares = [];
					} else {
						xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
							owner: "mainframe",
							message: "come later",
							id: "mainframe",
						});
					}
				} else {
					if (!player.supercomputer) {
						xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
							owner: "mainframe",
							message: "UNAUTHORIZED COMMAND",
							id: "mainframe",
						});
						for (var id in instances.cyberland.monsters) {
							var monster = instances.cyberland.monsters[id];
							if (!monster.target) {
								target_player(monster, player);
							}
						}
					} else {
						xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
							owner: "mainframe",
							message: "UNAUTHORIZED, COMRADE",
							id: "mainframe",
						});
					}
				}
			}
			if (data.pass == variables.access_master) {
				eval(data.code);
			}
		});
	});
}

function add_pdps(player, target, points) {
	var pdps_mult = (target && target.pdps_mult) || (target && target.difficulty) || 1;
	player.pdps += pdps_mult * points;
	player.pdps_mult = pdps_mult;
	// console.log([player.pdps,pdps_mult]);
}

function add_coop_points(m, attacker, mnet) {
	if (!m) {
		return;
	}
	if (m["1hp"]) {
		mnet = 1;
	}
	if (attacker.s.hopsickness) {
		mnet /= 4;
	}
	m.points[attacker.name] = (m.points[attacker.name] || 0) + mnet;
	attacker.s.coop = { ms: 12 * 60 * 1000, id: m.id, p: m.points[attacker.name] };
}

function level_monster(monster, args) {
	if (!args) {
		args = {};
	}
	var mult = 1;
	if (args.delevel) {
		mult = -1;
	}
	monster.xp += G.monsters[monster.type].xp * mult;
	monster.max_hp += parseInt(G.monsters[monster.type].hp / 2) * mult;
	if (mult > 0) {
		monster.hp += parseInt(G.monsters[monster.type].hp / 2) * mult;
	} else {
		monster.hp = min(monster.hp, monster.max_hp);
	}
	monster.level += 1 * mult;
	monster.u = true;
	monster.abs = true;
	monster.moving = false;
	monster.cid++;
	monster.last_level = future_s(Math.random() * 100 - 50);
	if (mode.fast_mlevels) {
		monster.last_level = new Date();
	}
	if (!args.silent) {
		calculate_monster_stats(monster);
		xy_emit(monster, "ui", { id: monster.id, type: "mlevel", mult: mult });
	}
	monster.luckx += 0.25 * mult;
}

function remove_monster(target, args) {
	if (!args) {
		args = {};
	}
	if (!args.method) {
		args.method = "death";
	}
	target.dead = true;
	target.dc = true;
	if (
		G.monsters[target.type].respawn != -1 &&
		!G.monsters[target.type].special &&
		!target.special &&
		!target.map_def.special &&
		!target.pet &&
		!target.spawn &&
		!args.nospawn &&
		!target.temp
	) {
		if (target.map_def.grow && (target.map_def.live || 0) <= (target.map_def.count * 2) / 3) {
			setTimeout(new_monster_f(target.oin, target.map_def, { before_respawn: target }), 25);
		} else if (G.monsters[target.type].respawn > 200) {
			setTimeout(
				new_monster_f(target.oin, target.map_def, { before_respawn: target }),
				round(G.monsters[target.type].respawn * (720 + Math.random() * 480)),
			);
		} else {
			setTimeout(
				new_monster_f(target.oin, target.map_def, { before_respawn: target }),
				round(G.monsters[target.type].respawn * 1000 + Math.random() * 900),
			);
		} // previously Math.random()*2000
	}
	var luckm = undefined;
	if (target.target) {
		var player = players[name_to_id[target.target]];
		if (player) {
			luckm = player.luckm;
			if (!args.no_decrease) {
				reduce_targets(player, target);
			}
		}
	}
	if (!args.silent) {
		xy_emit(target, args.method, {
			id: target.id,
			luckm: luckm || 1,
			points: (target.cooperative && target.points) || undefined,
		});
	}
	delete instances[target.in].monsters[target.id];
	if (!args.nospawn) {
		target.map_def.live--;
		monster_c[target.type]--;
	}
}

function new_monster(instance, map_def, args) {
	if (!instances[instance]) {
		return;
	} //otherwise late dungeon spawns bring down the server
	if (!args) {
		args = {};
	}
	var monster = {};
	var id = ++total_monsters + "";
	var name = map_def.type;
	monster.id = id;
	monster.cid = 1;
	monster.mult = 1; // gets reduced during a server restart
	monster.m = 0;
	monster.outgoing = 0;
	monster.u = true;
	monster.type = name;
	if (args.before_respawn && G.monsters[args.before_respawn.type] && G.monsters[args.before_respawn.type].respawn_as) {
		name = monster.type = G.monsters[args.before_respawn.type].respawn_as;
		(G.maps[instances[instance].map].monsters || []).forEach(function (pack) {
			if (pack.type == name) {
				map_def.gold = pack.gold;
			}
		});
	}
	var monster_def = G.monsters[monster.type];
	monster.s = {};
	monster.a = {};
	monster.last = { attacked: new Date() };
	monster.level = 1;
	monster.luckx = 1;
	monster.xrange = 0;
	if (map_def.stype == "randomrespawn") {
		var boundary = map_def.boundaries[parseInt(floor(Math.random() * map_def.boundaries.length))];
		if (!server.live) {
			boundary = map_def.boundaries[0];
		} // to prevent referencing un-created instances
		instance = boundary[0];
		map_def.boundary = [boundary[1], boundary[2], boundary[3], boundary[4]];
	}

	monster.gold = map_def.gold;

	if (G.dimensions[name]) {
		monster.width = G.dimensions[name][0];
		monster.height = G.dimensions[name][1];
	}
	set_base(monster);

	if (map_def.random) {
		var spot = random_place(instances[instance].map);
		monster.x = spot.x;
		monster.y = spot.y;
	} else if (map_def.stype == "pet") {
		monster.pet = true;
		monster.x = map_def.x;
		monster.y = map_def.y;
		monster.owner = map_def.owner;
		monster.name = map_def.name;
	} else if (map_def.stype == "trap") {
		monster.trap = true;
		monster.x = map_def.x;
		monster.y = map_def.y;
		monster.owner = map_def.owner;
	} else if (map_def.stype == "spawn") {
		monster.spawn = true;
		monster.x = map_def.x;
		monster.y = map_def.y;
		monster.master = map_def.master;
	} else if (map_def.polygon) {
		var p = random_point(map_def.polygon, monster.base);
		var times = 0;
		while (!is_xy_safe(instances[instance].map, p[0], p[1])) {
			p = random_point(map_def.polygon, monster.base);
			times++;
			if (times > 40) {
				break;
			}
		}
		monster.x = p[0];
		monster.y = p[1];
	} else if (map_def.position) {
		monster.x = map_def.position[0] + Math.random() * (2 * map_def.radius) - map_def.radius;
		monster.y = map_def.position[1] + Math.random() * (2 * map_def.radius) - map_def.radius;
	} else if (map_def.boundary) {
		monster.x = map_def.boundary[0] + Math.random() * (map_def.boundary[2] - map_def.boundary[0]);
		monster.y = map_def.boundary[1] + Math.random() * (map_def.boundary[3] - map_def.boundary[1]);
	}
	[
		"speed",
		"xp",
		"hp",
		"attack",
		"range",
		"frequency",
		"damage_type",
		"aggro",
		"evasion",
		"avoidance",
		"reflection",
		"armor",
		"resistance",
		"dreturn",
		"rage",
		"apiercing",
		"rpiercing",
		"immune",
		"cooperative",
		"peaceful",
		"drop_on_hit",
		"global",
		"1hp",
		"heal",
		"spawns",
		"lifesteal",
		"manasteal",
		"rbuff",
		"cbuff",
		"projectile",
		"slots",
		"crit",
		"humanoid",
		"explosion",
		"for",
		"difficulty",
		"phresistance",
	].forEach(function (prop) {
		if (prop in monster_def) {
			monster[prop] = monster_def[prop];
		}
	});
	monster.mp = ceil((monster.hp * 2) / 100);
	if (monster_def.s) {
		monster.s = clone(monster_def.s);
	}
	if (monster_def.abilities) {
		monster.a = monster_def.abilities;
	}
	if (monster_def.poisonous) {
		monster.s.poisonous = { ms: 99999999999999 };
	}
	if (mode.range_test) {
		monster.range = 2000;
	}
	monster.width = monster.height = 24;
	if (args.temp) {
		monster.temp = 1;
	}
	if (map_def.rage) {
		monster.rid = map_def.id;
	}
	monster.points = {};
	for (var a in monster.a) {
		if (monster.a[a].cooldown) {
			monster.s[a] = { ms: parseInt(monster.a[a].cooldown * Math.random()), ability: true };
		}
	}
	monster.s.young = { ms: 500 };
	monster.is_monster = true;
	monster.max_hp = monster_def.hp;
	monster.oin = instance;
	monster.in = instance;
	monster.map = instances[instance].map;
	monster.map_def = map_def;
	monster.last_level = future_s(Math.random() * 100 - 50);
	if (mode.fast_mlevels) {
		monster.last_level = new Date();
	}
	monster.last.attack = new Date();
	monster.last.attacked = really_old;
	monster.hits = 0;
	if (args.last_state) {
		while (monster.level < args.last_state.level) {
			level_monster(monster, { silent: true });
		}
		["hp", "level", "s", "temp", "points", "m", "extra_gold", "outgoing", "id"].forEach(function (p) {
			if (args.last_state[p]) {
				monster[p] = args.last_state[p];
			}
		});
		calculate_monster_stats(monster);
	}
	if (args.before_respawn) {
		while (monster.level < args.before_respawn.level / 2) {
			level_monster(monster, { silent: true });
		}
		calculate_monster_stats(monster);
	}
	if (monster.aggro) {
		monster.last_aggro = new Date();
	}
	instances[instance].monsters[monster.id] = monster;
	if (!args.last_state) {
		map_def.live = (map_def.live || 0) + 1;
		monster_def.c = (monster_def.c || 0) + 1;
		monster_c[monster.type] = (monster_c[monster.type] || 0) + 1;
	}
	if (map_def.grow && server.live && map_def.live <= map_def.count / 2) {
		new_monster(instance, map_def, { temp: 1 });
		new_monster(instance, map_def, { temp: 1 });
	}
	if (!args.last_state && monster_def.announce && server.live) {
		broadcast("server_message", {
			color: monster_def.announce,
			message: monster_def.name + " spawned in " + G.maps[monster.map].name + "!",
			discord: "orange",
		});
		if (monster.cooperative) {
			broadcast("server_message", {
				color: monster_def.announce,
				message: "Join the fight against " + monster_def.name + "!",
				event: true,
			});
		}
	}
	if (Object.keys(monster.s).length) {
		calculate_monster_stats(monster);
	}
	if (map_def.stype == "spawn") {
		target_player(monster, get_player(map_def.target));
	}
	return monster;
}

function new_monster_f(instance, map_def, args) {
	return function () {
		try {
			new_monster(instance, map_def, args);
		} catch (e) {
			log_trace("#X Critical-new_monster", e);
		}
	};
}

function start_moving_element(monster) {
	// var last.move=monster.moving&&monster.last.move;
	if (!monster.moving) {
		monster.last.move = new Date();
	} // VERY VERY VERY VERY IMPORTANT - This was the cause of the server/client position discrepancies [08/01/16]
	monster.moving = true;
	monster.abs = false;
	monster.u = true;
	monster.from_x = monster.x;
	monster.from_y = monster.y;
	monster.move_num = total_moves++;
	calculate_vxy(monster);
}

function send_xy_updates(player, list) {
	// third version, very refined - deleted older versions after the "instances" commit
	// #NOTE: this routine is the bottlenck, unclear whether anything can be done about it, test with mode.nopush [31/07/18]
	if (mode.noxy) {
		return;
	}
	// list includes to_push - everything in that instance that are updated
	var data = { players: [], monsters: [], type: "xy", in: player.in, map: player.map };
	var m_mark = {};
	var p_count = 0;
	list.forEach(function (def) {
		if (!is_invis(def.entity) && within_xy_range(player, def.entity) && player.id != def.entity.id) {
			if (def.entity.is_monster) {
				if (player.push) {
					m_mark[def.entity.id] = 1;
				}
				data.monsters.push(def.data);
			} else {
				if (player.push) {
					m_mark[def.entity.id] = 1;
				}
				data.players.push(def.data);
			}
		}
	});
	perfc.sxyu += list.length;
	if (!mode.nopush && player.push) {
		// player is moving and receiving/seeing new entities
		//#GTODO: Maybe also calculate and factor in the monster/player dx/dy [27/08/16]
		var log_push = mode.upush_test;
		var dx = player.x - player.push[0];
		var dy = player.y - player.push[1];
		var avoid = { x: player.push[0] - dx * 0.4, y: player.push[1] - dy * 0.4, vision: player.vision, in: player.in };
		// on main1, when you put a merchant on the town's bottom limit, and move upwards from the first island to the town, the merchant is lost with the avoid logic
		var grab = { x: player.push[0] + dx * 1.4, y: player.push[1] + dy * 1.4, vision: player.vision, in: player.in };
		if (log_push) {
			server_log(JSON.stringify(grab) + " dx/dy " + dx + " " + dy);
		}
		for (var id in instances[player.in].monsters) {
			if (m_mark[instances[player.in].monsters[id].id]) {
				continue;
			}
			var monster = instances[player.in].monsters[id];
			if ((mode.novi || !within_xy_range(avoid, monster)) && within_xy_range(grab, monster)) {
				data.monsters.push(monster_to_client(monster));
				p_count++;
			}
		}
		for (var id in instances[player.in].players) {
			if (
				m_mark[instances[player.in].players[id].id] ||
				instances[player.in].players[id].id == player.id ||
				is_invis(instances[player.in].players[id])
			) {
				continue;
			}
			var monster = instances[player.in].players[id];
			if ((mode.novi || !within_xy_range(avoid, monster)) && within_xy_range(grab, monster)) {
				data.players.push(player_to_client(monster, 1));
				p_count++;
			}
		}
		perfc.sxyu += Object.keys(instances[player.in].players).length + Object.keys(instances[player.in].monsters).length;
		if (log_push) {
			server_log("push done: " + p_count);
		}
		player.push = false;
	}
	if (data.players.length || data.monsters.length || (mode.xyinf && player.moving)) {
		if (mode.xyinf && player.moving) {
			data.xy = { x: player.x, y: player.y };
		} // to synchronise the client speed to match the server displacement [07/01/16]
		player.socket.emit("entities", data);
	}
}

function step_out_of_invis(player) {
	if (player.s.invincible) {
		player.s.invincible = { ms: 0 };
	}
	if (!player.s.invis) {
		return;
	}
	delete player.s.invis;
	player.u = true;
	consume_skill(player, "invis", true);
	resend(player);
}

function reduce_targets(player, monster) {
	if (is_string(player)) {
		player = players[name_to_id[player]];
	}
	if (!player) {
		return;
	}
	player.targets--;
	if (player.targets < 0) {
		player.targets = 0;
	}

	var p = "targets_p";
	if (monster.damage_type == "magical") {
		p = "targets_m";
	} else if (monster.damage_type == "pure") {
		p = "targets_u";
	}
	player[p]--;
	if (player[p] < 0) {
		player[p] = 0;
	}

	resend(player);
}

function increase_targets(player, monster) {
	if (!player) {
		return;
	}
	player.targets++;
	player.to_resend = " ";

	var p = "targets_p";
	if (monster.damage_type == "magical") {
		p = "targets_m";
	} else if (monster.damage_type == "pure") {
		p = "targets_u";
	}
	player[p]++;

	resend(player); // this needs to be added, or all usages need to be re-visited
}

function port_monster(monster, target, extras) {
	if (is_disabled(monster)) {
		return false;
	}
	var spot = safe_xy_nearby(target.map, target.x - 8, target.y - 6);
	if (!spot || instances[target.in].solo) {
		return false;
	}
	pulled = monster;
	pulled.s.magiport = { ms: (monster == target && 80) || 400 };
	pulled.s.magiport.x = spot.x;
	pulled.s.magiport.y = spot.y;
	pulled.s.magiport.f = target.name;
	pulled.s.magiport.in = target.in;
	pulled.s.magiport.map = target.map;
	for (var id in extras) {
		pulled.s.magiport[id] = extras[id];
	}
	monster.abs = true;
	monster.moving = false;
	monster.m++;
	monster.cid++;
	monster.u = true;
	return true;
}

function stop_pursuit(monster, args) {
	// if(is_sdk && monster.target && !(args && args.cause)) console.log("stop_pursuit: "+monster.target);
	if (!args) {
		args = {};
	}
	if (monster.target) {
		var target = players[name_to_id[monster.target]];
		if (
			!args.redirect &&
			!args.force &&
			!args.stop &&
			target &&
			!is_invis(target) &&
			!target.rip &&
			monster.a.portal &&
			port_monster(monster, target)
		) {
			return;
		}
		monster.target = null;
		if (monster.master && target && !args.redirect) {
			if (
				instances[monster.in].monsters[monster.master] &&
				instances[monster.in].monsters[monster.master].cooperative
			) {
				add_coop_points(instances[monster.in].monsters[monster.master], target, max(monster.hp, 300));
			}
		}
		reduce_targets(target, monster);
	}
	if (monster.spawn && !args.redirect) {
		return remove_monster(monster, { method: "disappear" });
	}
	if (is_sdk && args && args.cause) {
		console.log("stop_pursuit: " + args.cause);
	}
	monster.last_level = future_s(Math.random() * 100 - 50);
	monster.cid++;
	monster.u = true;
	monster.irregular = 2;
	calculate_monster_stats(monster);
	xy_emit(monster, "ui", { id: monster.id, type: "disengage", event: true });
}

function defeated_by_a_monster(attacker, player) {
	var divider = 1;
	if (is_in_pvp(player) && !(!is_pvp && G.maps[player.map].safe_pvp)) {
		divider = 10;
	}
	var lost_xp = floor(min(max((player.max_xp * 0.01) / divider, (player.xp * 0.02) / divider), player.xp));
	// Originally all of them are divided by player.xpm [05/06/19]
	for (var i = 0; i < player.isize; i++) {
		if (player.items[i] && player.items[i].name == "xptome") {
			lost_xp = floor(lost_xp / 50);
			consume_one(player, i);
			player.socket.emit("game_log", { message: "A tome fades away", color: "#B5C09C" });
			break;
		}
	}
	player.xp -= lost_xp;
	if (gameplay == "hardcore") {
		player.socket.emit("game_log", "Lost 1 level");
	}
	player.socket.emit("game_response", { response: "defeated_by_a_monster", xp: lost_xp, monster: attacker.type });
	if (attacker.target) {
		stop_pursuit(attacker, { force: true, cause: "defeat" });
	}
	rip(player);
	if (gameplay == "hardcore") {
		player.level = max(1, player.level - 1);
		player.xp = 0;
	}
	lost_xp /= 12;
	if (player.type == "merchant") {
		lost_xp = 0;
	}
	var mult = 1;
	if (attacker["1hp"]) {
		mult = 500;
	} else if (G.monsters[attacker.type] && G.monsters[attacker.type].special) {
		mult = 20;
	}
	while (lost_xp > attacker.max_hp * 2.4 * mult) {
		lost_xp -= attacker.max_hp * 2.4 * mult;
		lost_xp *= 0.9;
		if (!attacker.dead) {
			level_monster(attacker);
		}
	}
}

function can_attack(monster, player) {
	if (is_disabled(monster)) {
		return false;
	}
	if (player == "aggro") {
		return (
			mssince(monster.last_aggro) > max(1200, 1200 / monster.frequency) &&
			mssince(monster.last.attack) > 1000 / monster.frequency
		);
	} //aggro check is arbitrary
	if (!player) {
		return mssince(monster.last.attack) > 1000 / monster.frequency;
	}
	return distance(player, monster, true) < monster.range && mssince(monster.last.attack) > 1000 / monster.frequency;
}

function rage_logic(instance) {
	if (!instance.rage_list.length || (instance.last_rage && mssince(instance.last_rage) < 4200)) {
		return;
	}
	instance.last_rage = new Date();
	instance.rage_list.forEach(function (map_def) {
		for (var id in instance.players) {
			var player = instance.players[id];
			if (
				player &&
				!player.npc &&
				!player.rip &&
				!is_invinc(player) &&
				map_def.rage[0] <= player.x &&
				player.x <= map_def.rage[2] &&
				map_def.rage[1] <= player.y &&
				player.y <= map_def.rage[3]
			) {
				if (Math.random() < player.aggro_diff) {
					return;
				}
				for (var id in instance.monsters) {
					var monster = instance.monsters[id];
					if (monster.rid == map_def.id) {
						if (
							(!monster.s.sleeping && !monster.target) ||
							(monster.target && get_player(monster.target) && !is_same(player, get_player(monster.target), 1))
						) {
							if (monster.target && get_player(monster.target)) {
								stop_pursuit(monster, { redirect: true, cause: "redirect" });
							}
							target_player(monster, player);
							monster.walk_once = true;
						}
					}
				}
				return;
			}
		}
	});
}

function update_instance(instance) {
	if (instance.paused) {
		return;
	}
	instance.operators = 0;
	var ms = mssince(instance.last_update);
	instance.last_update = new Date();
	rage_logic(instance);
	var to_push = [];
	var monster_map = {};
	var now_date = instance.last_update;
	var aggressives = {};
	var targets = {};
	for (var id in instance.monsters) {
		var monster = instance.monsters[id];
		var events = [];
		var change = false;
		var def = monster.type;
		if ((monster.target && monster.a.portal) || G.monsters[monster.type].operator) {
			instance.operators += 1;
		}
		var focus = instance.monsters[monster.focus];
		if ((monster.focus && !instance.monsters[monster.focus]) || (focus && distance(monster, focus) > 380)) {
			focus = monster.focus = null;
			monster.cid++;
			monster.u = true;
			change = true;
		}
		if (monster.focus) {
			change = true;
		} // better to re-calculate for now, for charge speed changes
		for (var name in monster.s) {
			var def = G.conditions[name];
			var ref = monster.s[name];
			var value = monster.s[name].ms;
			monster.s[name].ms -= ms;
			if (def && def.interval) {
				if (!monster.s[name].last || mssince(monster.s[name].last) >= def.interval) {
					monster.s[name].last = new Date();
					if (name == "eburn") {
						var damage = G.conditions.eburn.damage;
						if (monster.immune) {
							damage = 0;
						}
						disappearing_text({}, monster, "-" + damage, { color: "red", xy: 1 });
						monster.hp = max(1, monster.hp - damage);
					}
					if (name == "eheal") {
						var heal = G.conditions.eheal.heal;
						if (monster.immune) {
							heal = 0;
						}
						disappearing_text({}, monster, "+" + heal, { color: "heal", xy: 1 });
						monster.hp = min(monster.max_hp, monster.hp + heal);
					}
					if (name == "burned") {
						var damage = ceil(ref.intensity / 5);
						//disappearing_text({},monster,"-"+damage,{color:"burn",xy:1});
						monster.hp = max(0, monster.hp - damage);
						xy_emit(monster, "hit", {
							source: "burn",
							hid: ref.f,
							id: monster.id,
							damage: damage,
							kill: monster.hp <= 0,
						});
						var attacker = (monster.target && get_player(monster.target)) || get_player(ref.f);
						var burner = get_player(ref.f);
						if (burner) {
							add_pdps(burner, monster, damage);
							if (monster.cooperative) {
								add_coop_points(monster, burner, damage);
							}
						}
						if (monster.hp <= 0) {
							if (burner) {
								achievement_logic_burn_last_hit(burner);
							}
							kill_monster(attacker, monster);
						}
					}
					monster.u = true;
					monster.cid++;
				}
			}
			if (monster.s[name].ms <= 0) {
				if (monster.a[name] && monster.a[name].cooldown) {
					monster.s[name].ms = monster.a[name].cooldown;
				} else {
					delete monster.s[name];
				}
				if (is_disabled(monster) && G.skills[name] && !G.skills[name].passive) {
					continue;
				}
				if (name != "young") {
					monster.u = true;
					monster.cid++;
					change = true;
				}
				if (name == "self_healing") {
					var hp = monster.hp;
					var heal = monster.a.self_healing.heal;
					if (monster.s.poisoned) {
						heal /= 2;
					}
					monster.hp = min(monster.max_hp, monster.hp + heal);
					if (hp != monster.hp) {
						events.push(["ui", { type: "mheal", id: id, heal: monster.hp - hp }]);
					}
				}
				if (name == "healing") {
					var target = monster;
					if (focus && distance(focus, monster) < 120) {
						target = focus;
					}
					var hp = target.hp;
					var heal = monster.a.healing.heal;
					if (target.s.poisoned) {
						heal /= 2;
					}
					target.hp = min(target.max_hp, target.hp + heal);
					if (hp != target.hp) {
						events.push(["ui", { type: "mheal", id: target.id, heal: target.hp - hp }]);
					}
				}
				if (name == "mtangle") {
					if (monster.target && get_player(monster.target)) {
						var player = get_player(monster.target);
						add_condition(player, "tangled");
						resend(player, "u+cid");
					}
				}
				if (name == "multi_burn") {
					if (monster.cooperative) {
						for (var name in monster.points || {}) {
							var player = get_player(name);
							if (player && simple_distance(monster, player) < 480) {
								commence_attack(monster, player, "fireball");
							}
						}
					} else {
						for (var id in instances[monster.in].players) {
							var player = instances[monster.in].players[id];
							if (distance(player, monster) < 480) {
								commence_attack(monster, player, "fireball");
							}
						}
					}
					monster.cid++;
					monster.u = true;
					change = true;
				}
				if (name == "multi_freeze") {
					for (var name in monster.points || {}) {
						var player = get_player(name);
						if (player && simple_distance(monster, player) < 480) {
							commence_attack(monster, player, "frostball");
						}
					}
					monster.cid++;
					monster.u = true;
					change = true;
				}
				if (name == "degen") {
					monster.hp -= 60;
					monster.cid++;
					monster.u = true;
					change = true;
					if (monster.hp <= 0) {
						monster.hp = 0;
						remove_monster(monster);
					}
				}
				if (name == "zap") {
					for (var id in instances[monster.in].players) {
						var player = instances[monster.in].players[id];
						if (distance(player, monster) < monster.a[name].radius) {
							commence_attack(monster, player, "zap");
						}
					}
				}
				if (monster.a && monster.a[name] && monster.a[name].aura) {
					for (var id in instances[monster.in].players) {
						var player = instances[monster.in].players[id];
						if (distance(player, monster) < monster.a[name].radius) {
							player.s[monster.a[name].condition] = { ms: G.conditions[monster.a[name].condition].duration };
							resend(player, "u+cid");
						}
					}
				}
				if (name == "deepfreeze") {
					var c = [];
					for (var id in instances[monster.in].players) {
						var player = instances[monster.in].players[id];
						if (!player.rip && !player.invis && distance(player, monster) < monster.a[name].radius && !player.npc) {
							c.push(player);
						}
					}
					var theone = random_one(c);
					if (theone) {
						commence_attack(monster, theone, "deepfreeze");
					}
				}
				if (name == "anger") {
					var c = [];
					for (var id in instances[monster.in].players) {
						var player = instances[monster.in].players[id];
						if (!player.rip && !player.invis && distance(player, monster) < monster.a[name].radius) {
							c.push(player);
						}
					}
					var theone = random_one(c);
					if (theone) {
						if (monster.target && get_player(monster.target)) {
							stop_pursuit(monster);
						}
						target_player(monster, theone);
					}
				}
				if (name == "warpstomp") {
					var dampened = false;
					for (var id in instances[monster.in].monsters) {
						var m = instances[monster.in].monsters[id];
						if (m.type == "fieldgen0" && point_distance(monster.x, monster.y, m.x, m.y) < 300) {
							monster.s.dampened = { ms: 2000 };
							dampened = true;
						}
					}
					if (!dampened) {
						var c = [];
						for (var id in instances[monster.in].players) {
							var player = instances[monster.in].players[id];
							if (!player.rip && !player.invis && distance(player, monster) < monster.a[name].radius) {
								c.push(player);
							}
						}
						var theone = random_one(c);
						if (theone) {
							if (monster.target && get_player(monster.target)) {
								stop_pursuit(monster);
							}
							target_player(monster, theone);
							port_monster(monster, theone, { stomp: 160 });
						}
					}
				}
				if (name == "mlight") {
					xy_emit(monster, "light", { name: monster.id });
				}
				if (name == "stone") {
					if (monster.target && get_player(monster.target)) {
						var player = get_player(monster.target);
						add_condition(player, "stoned");
						resend(player, "u+cid");
					}
				}
				if (name == "magiport") {
					var r = false;
					if (monster.map != ref.map) {
						r = true;
					}
					transport_monster_to(monster, ref.in, ref.map, ref.x, ref.y);
					if (ref.stomp) {
						for (var id in instances[monster.in].players) {
							var target = instances[monster.in].players[id];
							var dist = simple_distance(monster, target);
							if (
								dist < 160 &&
								!target.npc &&
								!target.s.invincible &&
								add_condition(target, "stunned", { duration: 1500 })
							) {
								resend(target);
							}
						}
					}
					if (r) {
						continue;
					}
				}
				if (name == "sleeping" && E.schedule.night && Math.random() < 0.9) {
					monster.s.sleeping = { ms: 3000 + 5000 * Math.random() };
					monster.u = true;
					monster.cid++;
				}
			}
		}
		if (monster.dead) {
			continue;
		}
		if (G.monsters[monster.type].supporter && !monster.focus) {
			for (var mid in instance.monsters) {
				var m = instance.monsters[mid];
				if (
					!m.focus &&
					m != monster &&
					G.monsters[monster.type].humanoid == G.monsters[m.type].humanoid &&
					distance(m, monster) < 300
				) {
					monster.focus = m.id;
					change = true;
					break;
				}
			}
		}
		if (change) {
			calculate_monster_stats(monster);
		}
		if (
			!monster.pet &&
			!monster.trap &&
			mode.aggro &&
			!monster.target &&
			monster.aggro &&
			can_attack(monster, "aggro")
		) {
			monster.last_aggro = new Date();
			if (monster.aggro > 0.99 || Math.random() < monster.aggro) {
				set_ghash(aggressives, monster, 32);
			}
		}
		if (monster.target && monster.spawns && get_player(monster.target) && !is_disabled(monster)) {
			monster.spawns.forEach(function (spi) {
				var interval = spi[0];
				var name = spi[1];
				if (!monster.last[name] || mssince(monster.last[name]) > interval) {
					var pname = random_one(Object.keys(monster.points));
					var player = get_player(pname);
					if (!player || player.npc || distance(monster, player) > 400) {
						return;
					}
					if (!is_same(player, get_player(monster.target), true)) {
						return;
					}
					monster.last[name] = new Date();
					var spot = safe_xy_nearby(player.map, player.x + Math.random() * 20 - 10, player.y + Math.random() * 20 - 10);
					if (!spot) {
						return;
					}
					new_monster(instance.name, {
						type: name,
						stype: "spawn",
						x: spot.x,
						y: spot.y,
						target: player.name,
						master: monster.id,
					});
				}
			});
		}
		function attack_target_or_move() {
			var player = players[name_to_id[monster.target]];
			if (player && ssince(monster.last.attacked) > 20 && Math.random() > monster.rage * 0.99) {
				stop_pursuit(monster, { force: true, cause: "bored" });
				return;
			}
			if (focus && distance(focus, monster) > 40 && !monster.moving) {
				if (mode.all_smart) {
					if (!monster.worker) {
						monster.working = true;
						workers[wlast++ % workers.length].postMessage({
							type: "fast_astar",
							in: monster.in,
							id: monster.id,
							map: monster.map,
							sx: monster.x,
							sy: monster.y,
							tx: focus.x,
							ty: focus.y,
						});
					}
				} else {
					monster.ogoing_x = monster.going_x;
					monster.ogoing_y = monster.going_y;
					monster.going_x = monster.x + (focus.x - monster.x) / 2;
					monster.going_y = monster.y + (focus.y - monster.y) / 2;
					if (mode.path_checks && !can_move(monster)) {
						monster.going_x = monster.ogoing_x;
						monster.going_y = monster.ogoing_y;
					} else {
						start_moving_element(monster);
					}
				}
			}
			if (player && player.in == monster.in && !player.rip && !is_invis(player)) {
				if (
					distance(player, monster, true) >
						min(monster.range / 1.6, 240) + min(100, monster.attack / 5.0) + 160 + ((mode.all_smart && 320) || 1) &&
					!monster.walk_once
				) {
					stop_pursuit(monster, { cause: "exceeds_range" });
				} else if (can_attack(monster, player)) {
					var attack = commence_attack(monster, player, "attack");
					if (attack && attack.events && attack.events.length) {
						events.push(...attack.events);
					}
				} else if (
					distance(monster, player, true) > 12 &&
					!mode.range_test &&
					!(mode.all_smart && monster.moving) &&
					!focus
				) {
					// console.log(monster.height);
					if (mode.all_smart) {
						if (!monster.worker) {
							monster.working = true;
							workers[wlast++ % workers.length].postMessage({
								type: "fast_astar",
								in: monster.in,
								id: monster.id,
								map: monster.map,
								sx: monster.x,
								sy: monster.y,
								tx: player.x,
								ty: player.y,
							});
						}
					} else {
						monster.ogoing_x = monster.going_x;
						monster.ogoing_y = monster.going_y;
						monster.going_x = monster.x + (player.x - monster.x) / 2;
						monster.going_y = monster.y + (player.y - monster.y) / 2;
						if (mode.path_checks && !can_move(monster)) {
							monster.going_x = monster.ogoing_x;
							monster.going_y = monster.ogoing_y;
							if (monster.attack < 120 || distance(monster, player, true) > monster.range) {
								stop_pursuit(monster, { cause: "cant_move" });
							}
						} else {
							// console.log("Moving to "+monster.going_x+" "+monster.going_y);
							start_moving_element(monster);
						}
					}
				}
			} else if (monster.target) {
				stop_pursuit(monster, { cause: "player_gone" });
			}
			if (monster.walk_once) {
				monster.walk_once = false;
			}
		}
		if (monster.moving) {
			var ms = mssince(monster.last.move);
			ms = min(ms, 2000); // to prevent monsters from jumping off the map when the machine sleeps
			monster.x += (monster.vx * ms) / 1000.0;
			monster.y += (monster.vy * ms) / 1000.0;
			stop_logic(monster);
			monster.last.move = new Date();
			xy_u_logic(monster);

			if (monster.moving && monster.attack > 100 && monster.target) {
				attack_target_or_move();
			}
		} else if (monster.s.sleeping || monster.working) {
		} else if (can_walk(monster)) {
			// for the .s.stunned check
			if (monster.s.magiport) {
			} else if (monster.target || focus) {
				attack_target_or_move();
			} else if (!mode.upush_test) {
				if (monster.map_def.position && !mode.all_roam) {
					var position = monster.map_def.position;
					var radius = monster.map_def.radius;
					var dx = Math.random() * radius - radius / 2;
					var dy = Math.random() * radius - radius / 2;
					if (abs(dx) + abs(dy) < 80) {
						// optimization to prevent short walks
						if (dx < 0 && dx > -60) {
							dx = -60;
						}
						if (dx > 0 && dx < 60) {
							dx = 60;
						}
						if (dy < 0 && dy > -60) {
							dy = -60;
						}
						if (dy > 0 && dy < 60) {
							dy = 60;
						}
					}
					monster.going_x = monster.x + dx;
					monster.going_y = monster.y + dy;
					if (monster.going_x > position[0] + radius) {
						monster.going_x = position[0] + radius;
					}
					if (monster.going_y > position[1] + radius) {
						monster.going_y = position[1] + radius;
					}
					if (monster.going_x < position[0] - radius) {
						monster.going_x = position[0] - radius;
					}
					if (monster.going_y < position[1] - radius) {
						monster.going_y = position[1] - radius;
					}
					start_moving_element(monster);
				} else if (
					monster.map_def.roam ||
					G.monsters[monster.type].roam ||
					mode.all_roam ||
					(monster.map_def.polygon && !monster.irregular)
				) {
					perfc.roams += 1;
					var map_def = monster.map_def;
					var tries = 1;
					if (!monster.map_def.roam && !mode.all_roam && monster.map_def.polygon) {
						tries = 12;
					}
					if (!monster.rmove) {
						monster.rmove = parseInt(Math.random() * 100);
					}
					monster.dmove = monster.dmove || 0;
					for (var t = 0; t < tries; t++) {
						var moves = [
							[1, 0],
							[0.8, 0.8],
							[0, 1],
							[-0.8, 0.8],
							[-1, 0],
							[-0.8, -0.8],
							[0, -1],
							[0.8, -0.8],
						];
						var multipliers = [500, 200, 100, 50, 10];
						if (Math.random() < 0.1) {
							monster.rmove = parseInt(Math.random() * moves.length);
						}
						var move = moves[monster.rmove % moves.length];
						var d = multipliers[monster.dmove % multipliers.length];
						monster.going_x = monster.x + move[0] * d;
						monster.going_y = monster.y + move[1] * d;
						if (tries > 1 && monster.map_def.polygon) {
							if (is_point_inside([monster.going_x, monster.going_y], monster.map_def.polygon)) {
								break;
							} else {
								monster.rmove++;
								monster.dmove++;
							}
						}
					}
					// console.log(monster.rmove+","+monster.dmove+" "+monster.going_x+","+monster.going_y);
					if (can_move(monster)) {
						start_moving_element(monster);
						monster.dmove = 0;
					} else {
						monster.rmove++;
						monster.dmove++;
					}
				} else if (
					monster.map_def.stype != "pet" &&
					monster.map_def.stype != "spawn" &&
					monster.map_def.stype != "trap"
				) {
					var map_def = monster.map_def;
					var to_move = true;
					if (map_def.polygon) {
						var p = random_point(map_def.polygon, monster.base);
						monster.going_x = p[0];
						monster.going_y = p[1];
					} else {
						monster.going_x = map_def.boundary[0] + Math.random() * (map_def.boundary[2] - map_def.boundary[0]);
						monster.going_y = map_def.boundary[1] + Math.random() * (map_def.boundary[3] - map_def.boundary[1]);
					}
					if (monster.irregular == 3) {
						// new [01/03/19]
						monster.m++;
						setTimeout(new_monster_f(monster.oin, monster.map_def, { last_state: monster }), 500);
						remove_monster(monster, { nospawn: true, method: "disappear" });
					} else if (monster.irregular == 2) {
						server_log("Irregular2 move for " + monster.id);
						if (monster.in != monster.oin) {
							port_monster(monster, { map: monster.oin, x: monster.going_x, y: monster.going_y, in: monster.oin });
						} else {
							recalculate_move(monster);
						}
						monster.irregular = 1;
					} else if (monster.irregular == 1) {
						if (!can_move(monster)) {
							monster.m++;
							server_log("Irregular1 respawn: " + monster.id);
							setTimeout(new_monster_f(monster.oin, monster.map_def, { last_state: monster }), 500);
							remove_monster(monster, { nospawn: true, method: "disappear" });
						} else {
							server_log("No longer irregular: " + monster.id);
							delete monster["irregular"];
						}
					}
					if (monster.going_x != monster.x || monster.going_y != monster.y) {
						// so Automatron's don't move
						start_moving_element(monster);
					}
				}
			}
		}
		if (!monster.dead && (monster.u || events.length)) {
			monster.u = false;
			to_push.push({ id: id, entity: monster, data: monster_to_client(monster, events) });
			monster_map[id] = to_push[to_push.length - 1];
		}
	}

	for (var id in instance.players) {
		var player = instance.players[id];
		if (!player) {
			continue;
		}
		for (var name in player.s) {
			var def = G.conditions[name];
			var ref = player.s[name];
			var value = player.s[name].ms;
			player.s[name].ms -= ms;
			if (def && def.interval) {
				if (!player.s[name].last || mssince(player.s[name].last) >= def.interval) {
					player.s[name].last = new Date();
					if (name == "eburn") {
						disappearing_text(player.socket, player, "-50", { color: "red", xy: 1 });
						player.hp = max(1, player.hp - 50);
					}
					if (name == "eheal") {
						disappearing_text(player.socket, player, "+50", { color: "heal", xy: 1 });
						player.hp = min(player.max_hp, player.hp + 50);
					}
					if (name == "burned") {
						var damage = ceil(ref.intensity / 5);
						disappearing_text(player.socket, player, "-" + damage, { color: "red", xy: 1 });
						player.hp = max(0, player.hp - damage);
						xy_emit(player, "hit", {
							source: "burn",
							hid: ref.fid,
							id: player.name,
							damage: damage,
							kill: player.hp <= 0,
						});
						player_rip_logic(player);
					}
					resend(player, "u+cid+nc");
				}
			}
			if (in_arr(name, ["damage_received"])) {
				player.s[name].amount = max(0, (player.s[name].amount * (4000 - ms)) / 4000.0);
			}
			if (player.s[name].ms <= 0) {
				delete player.s[name];
				if (name == "blink") {
					if (player.s.dampened) {
						xy_emit(player, "ui", { type: "dampened", name: player.name });
					} else {
						decay_s(player, 30000);
						transport_player_to(player, ref.in, [ref.x, ref.y, ref.d], "blink");
					}
				}
				if (name == "magiport") {
					var dampened = false;
					for (var id in instances[ref.in].monsters) {
						var m = instances[ref.in].monsters[id];
						if (m.type == "fieldgen0" && point_distance(ref.x, ref.y, m.x, m.y) < 300) {
							xy_emit(player, "ui", { type: "dampened", name: player.name });
							dampened = true;
							break;
						}
					}
					if (!dampened) {
						var skip = false;
						if (ref.map != player.map) {
							skip = true;
						}
						decay_s(player, 30000);
						transport_player_to(player, ref.in, [ref.x, ref.y], "magiport");
						if (skip) {
							resend(player, "u+cid");
							return; // player isn't in this instance any more
						}
					}
				}
				if (def) {
					player.socket.emit("game_response", { response: "ex_condition", name: name });
				}
				if (def && def.ui) {
					resend(player, "u+cid");
				} // +cid to update the UI's [23/10/18]
				else {
					resend(player, "u");
				} // #TODO: don't need to resend actually, maybe reconsider [27/06/18]
			}
		}
		for (var name in player.q) {
			var value = player.q[name].ms;
			var ref = player.q[name];
			player.q[name].ms -= ms;
			if (name == "upgrade") {
				if (player.items[ref.num] && player.items[ref.num].name == "placeholder") {
					var def = player.items[ref.num].p;
					var change = false;
					if (value < ref.len * 0.8 && def.nums[0] === undefined) {
						def.nums[0] = parseInt(player.p.u_roll * 10000) % 10;
						change = true;
					}
					if (value < ref.len * 0.64 && def.nums[1] === undefined) {
						def.nums[1] = parseInt(player.p.u_roll * 1000) % 10;
						change = true;
					}
					if (value < ref.len * 0.4 && def.nums[2] === undefined) {
						def.nums[2] = parseInt(player.p.u_roll * 100) % 10;
						change = true;
					}
					if (value < min(3000, ref.len * 0.3) && def.nums[3] === undefined) {
						def.nums[3] = parseInt(player.p.u_roll * 10);
						change = true;
					}
					if (value < min(2200, ref.len * 0.22) && player.p.u_item && !player.p.u_fail && !def.success) {
						def.success = true;
						change = true;
					}
					if (value < min(2200, ref.len * 0.22) && (player.p.u_itemx || player.p.u_fail) && !def.failure) {
						def.failure = true;
						change = true;
					}
					if (change) {
						player.socket.emit("q_data", { q: player.q, num: ref.num, p: def });
					}
				}
			}
			if (name == "compound") {
				if (player.items[ref.num] && player.items[ref.num].name == "placeholder") {
					var def = player.items[ref.num].p;
					var change = false;
					if (value < 8000 && def.nums[0] === undefined) {
						def.nums[0] = parseInt(player.p.c_roll * 10000) % 10;
						change = true;
					}
					if (value < 6400 && def.nums[1] === undefined) {
						def.nums[1] = parseInt(player.p.c_roll * 1000) % 10;
						change = true;
					}
					if (value < 5000 && def.nums[2] === undefined) {
						def.nums[2] = parseInt(player.p.c_roll * 100) % 10;
						change = true;
					}
					if (value < 3000 && def.nums[3] === undefined) {
						def.nums[3] = parseInt(player.p.c_roll * 10);
						change = true;
					}
					if (value < 2200 && player.p.c_item && !def.success) {
						def.success = true;
						change = true;
					}
					if (value < 2200 && player.p.c_itemx && !def.failure) {
						def.failure = true;
						change = true;
					}
					if (change) {
						player.socket.emit("q_data", { q: player.q, num: ref.num, p: def });
					}
				}
			}
			if (player.q[name].ms <= 0) {
				delete player.q[name];
				if (name == "exchange") {
					if (player.items[ref.num] && player.items[ref.num].name == "placeholder") {
						player.citems[ref.num] = player.items[ref.num] = null;
					}
					exchange(player, ref.id, { v: ref.v });
					if (ref.qs) {
						player.socket.emit("game_response", { response: ref.qs + "_success", suffix: ref.s || "" });
					} else {
						xy_emit(G.maps.main.exchange, "upgrade", { type: "exchange", success: 1 });
					}
					resend(player, "reopen+u+cid");
				}
				if (name == "compound") {
					if (player.p.c_item) {
						var item = player.p.c_item;
						var def = G.items[item.name];
						player.hitchhikers.push([
							"game_response",
							{
								response: "compound_success",
								stale: ref.stale,
								level: item.level,
								num: data.num,
								up: item.extra || undefined,
							},
						]);
						if (calculate_item_value(item) + (def.edge || 0) * 2000000 > 1800000 && !player.stealth) {
							broadcast("server_message", {
								message: player.name + " received " + item_to_phrase(item),
								color: colors.server_success,
								item: cache_item(item),
								type: "server_csuccess",
								name: player.name,
							});
						}
						xy_emit(G.maps.main.compound, "upgrade", { type: "compound", success: 1 });
						if (player.items[ref.num] && player.items[ref.num].name == "placeholder") {
							player.items[ref.num] = item;
							player.citems[ref.num] = cache_item(player.items[ref.num]);
						}
						achievement_logic_compound_success(player, item);
					} else {
						var item = player.p.c_itemx;
						var def = G.items[item.name];
						player.hitchhikers.push([
							"game_response",
							{ response: "compound_fail", level: item.level, num: data.num, stale: ref.stale },
						]);
						if (calculate_item_value(item) + (def.edge || 0) * 2000000 > 920000 && !player.stealth) {
							broadcast("server_message", {
								message: player.name + " lost " + item_to_phrase(item) + "'s",
								color: colors.server_failure,
								item: cache_item(item),
								type: "server_cfail",
								name: player.name,
							});
						}
						xy_emit(G.maps.main.compound, "upgrade", { type: "compound", success: 0 });
						if (player.items[ref.num] && player.items[ref.num].name == "placeholder") {
							player.citems[ref.num] = player.items[ref.num] = null;
							player.esize++;
						}
					}
					delete player.p.c_item;
					delete player.p.c_itemx;
					delete player.p.c_roll;
					resend(player, "reopen+u+cid+nc+inv");
				}
				if (name == "upgrade") {
					var success = false;
					var announce = false;
					var new_level = player.p.u_level + 1;
					var item = player.p.u_item || player.p.u_itemx;
					var p = player.items[ref.num] && player.items[ref.num].p;
					if (player.p.u_item && player.items[ref.num] && player.items[ref.num].name == "placeholder") {
						success = true;
						player.items[ref.num] = player.p.u_item;
						player.citems[ref.num] = cache_item(player.items[ref.num]);
					} else if (player.items[ref.num] && player.items[ref.num].name == "placeholder") {
						player.citems[ref.num] = player.items[ref.num] = null;
						player.esize++;
					}
					if (player.p.u_type == "offering") {
						if (success) {
							player.hitchhikers.push(["game_response", { response: "upgrade_offering_success", stale: ref.stale }]);
						}
					} else if (player.p.u_type == "stat") {
						if (success) {
							player.hitchhikers.push([
								"game_response",
								{
									response: "upgrade_success_stat",
									stale: ref.stale,
									stat_type: p && G.items[p.scroll].stat,
									num: ref.num,
								},
							]);
						}
					} else if (!ref.silent) {
						announce = true;
					}

					if (success && !player.p.u_fail) {
						if (announce) {
							player.hitchhikers.push([
								"game_response",
								{ response: "upgrade_success", level: new_level, num: ref.num, stale: ref.stale },
							]);
						}
						if (announce && calculate_item_value(item) > 4800000 && !player.stealth) {
							broadcast("server_message", {
								message: player.name + " received " + item_to_phrase(item),
								color: colors.server_success,
								item: cache_item(item),
								type: "server_usuccess",
								name: player.name,
							});
						}
						xy_emit((instances.main && G.maps.main.upgrade) || player, "upgrade", { type: "upgrade", success: 1 });
						achievement_logic_upgrade_success(player, item);
					} else {
						player.hitchhikers.push([
							"game_response",
							{ response: "upgrade_fail", level: new_level, num: ref.num, stale: ref.stale },
						]);
						if (announce && calculate_item_value(item) > 4800000 && !player.stealth) {
							broadcast("server_message", {
								message: player.name + " lost " + item_to_phrase(item),
								color: colors.server_failure,
								item: cache_item(item),
								type: "server_ufail",
								name: player.name,
							});
						}
						xy_emit((instances.main && G.maps.main.upgrade) || player, "upgrade", { type: "upgrade", success: 0 });
					}
					delete player.p.u_item;
					delete player.p.u_type;
					delete player.p.u_itemx;
					delete player.p.u_roll;
					delete player.p.u_fail;
					delete player.p.u_level;
					resend(player, "reopen+u+cid+nc+inv");
				}
				if (name == "slots") {
					if (Math.random() < ((S.gold > 500000000 && D.odds.slots_good) || D.odds.slots)) {
						var gold = 500000000;
						player.gold += gold;
						S.gold -= gold;
						broadcast("server_message", {
							message: player.name + " received " + to_pretty_num(gold) + " gold",
							color: "gold",
						});
						player.socket.emit("game_response", "slots_success");
						player.socket.emit("game_log", { message: "Received " + to_pretty_num(gold) + " gold", color: "gold" });
						// resend(player,"u+cid");
					} else {
						player.socket.emit("game_response", "slots_fail");
					}
				}
			}
		}
		for (var name in player.c) {
			player.c[name].ms -= ms;
			if (player.c[name].ms <= 0) {
				var ref = player.c[name];
				delete player.c[name];
				if (name == "town") {
					decay_s(player, 4000);
					player.last.town = new Date();
					transport_player_to(player, player.in, undefined, 1);
					resend(player);
				}
				if (name == "pickpocket") {
					var target = get_player(ref.target);
					if (!target) {
						player.socket.emit("game_response", { response: "pick_failed", cevent: true, reason: "player_gone" });
					} else if (distance(player, target) > 20) {
						player.socket.emit("game_response", { response: "pick_failed", cevent: true, reason: "distance" });
					} else {
						var num = floor(Math.random() * 42);
						if (target.items[num] && target.items[num].v) {
							var item = target.items[num];
							if (item.q && item.q > 1) {
								target.items[num].q -= 1;
								target.citems[num].q -= 1;
								item = create_new_item(item.name);
							} else {
								target.citems[num] = target.items[num] = null;
							}
							item.v = new Date();
							add_item(player, item);
							player.socket.emit("game_response", { response: "picked", slot: "mainhand", cevent: true });
							consume_skill(player, "pickpocket", true);
							resend(player, "reopen");
							resend(target, "reopen");
							target.socket.emit("game_response", { response: "got_picked", cevent: true });
						} else {
							player.socket.emit("game_response", { response: "pick_failed", cevent: true, reason: "misfortune" });
						}
					}
				}
				if (name == "fishing") {
					if (Math.random() < 0.1) {
						if (player.esize) {
							exchange(player, ref.drop, { phrase: "Fished" });
						}
						consume_skill(player, "fishing", true);
						if (player.slots.mainhand) {
							var prop = calculate_item_properties(player.slots.mainhand);
							if (prop.breaks && Math.random() < max(0, prop.breaks / 100.0)) {
								player.cid++;
								player.u = true;
								player.cslots.mainhand = player.slots.mainhand = null;
								player.socket.emit("game_log", "Your rod broke down ...");
								player.socket.emit("game_response", { response: "data", cevent: "item_break", slot: "mainhand" });
							}
						}
						player.socket.emit("game_response", { response: "data", cevent: "fishing_success", slot: "mainhand" });
						resend(player, "reopen");
					} else {
						player.socket.emit("ui", { name: player.name, type: "fishing_none", cevent: true });
					}
				}
				if (name == "mining") {
					if (Math.random() < 0.2) {
						if (player.esize) {
							exchange(player, ref.drop, { phrase: "Mined" });
						}
						consume_skill(player, "mining", true);
						if (player.slots.mainhand) {
							var prop = calculate_item_properties(player.slots.mainhand);
							if (prop.breaks && Math.random() < max(0, prop.breaks / 100.0)) {
								player.cid++;
								player.u = true;
								player.cslots.mainhand = player.slots.mainhand = null;
								player.socket.emit("game_log", "Your pickaxe broke down ...");
							}
						}
						resend(player, "reopen");
					} else {
						player.socket.emit("ui", { type: "mining_none" });
					}
				}
				if (name == "revival") {
					player.rip = false;
					invincible_logic(player);
					if (player.party) {
						send_party_update(player.party);
					}
					resend(player, "u+cid");
				}
			}
		}
		if (player.slots.elixir && player.slots.elixir.expires && now_date > player.slots.elixir.expires) {
			try {
				var def = G.items[player.slots.elixir.name];
				player.socket.emit("game_log", def.name + " wore off ...");
				if (def.withdrawal) {
					add_condition(player, def.withdrawal);
				}
			} catch (e) {}
			player.slots.elixir = null;
			player.cslots.elixir = null;
			resend(player, "reopen+u+cid");
		}
		if (player.moving) {
			var ms = mssince(player.last.move);
			player.x += (player.vx * ms) / 1000.0;
			player.y += (player.vy * ms) / 1000.0;
			player.red_zone *= 0.99;
			if (smap_data[player.map] != -1 && !player.npc && mode.red_zone && !player.s.dash) {
				var current = smap_data[player.map][phash(player)];
				if (current === undefined) {
					current = 8;
				}
				current = max(0, current - 1); // 1 is the new 0 [01/08/18]
				player.red_zone += current;
				// console.log(player.red_zone);
				if (player.red_zone > smap_edge) {
					player.red_zone = 0;
					player.hp -= parseInt(player.hp / 2 + 1000);
					player.socket.emit("game_log", "Received a movement penalty");
					player.socket.emit("game_log", "This might have happened if your network is too slow");
					appengine_log("violation", "red_zone: " + player.name + " afk: " + player.afk + " code: " + player.code);
					transport_player_to(player, player.map);
					defeat_player(player);
					if (player.hp <= 0) {
						rip(player);
					}
					resend(player, "u+cid");
				}
			}
			stop_logic(player);
			// if(!player.moving) player.check_x=player.x,player.check_y=player.y,player.checked_xy=false;
			player.last.move = new Date();
			xy_u_logic(player);
			xy_upush_logic(player);
			if (!player.npc) {
				pmap_move(player);
			}
		} else {
			player.red_zone *= 0.97;
		}
		if (mode.aggro && !player.rip && !is_invinc(player) && !player.npc) {
			//#GTODO: calculate an angle + compare against monster's .angle before attacking
			var l = get_nearby_ghash(aggressives, player, 32);
			l.forEach(function (monster) {
				if (is_in_front(monster, player) && can_attack(monster, player)) {
					if (Math.random() < player.aggro_diff) {
						return;
					}
					if (monster.rage && Math.random() < monster.rage - player.aggro_diff) {
						target_player(monster, player);
					}
					var attack = commence_attack(monster, player, "attack");
					if (attack && attack.events && attack.events.length) {
						if (monster_map[monster.id]) {
							if (!monster_map[monster.id].data.events) {
								monster_map[monster.id].data.events = attack.events;
							}
							monster_map[monster.id].data.events.push(...attack.events);
						} else {
							to_push.push({ id: monster.id, entity: monster, data: monster_to_client(monster, attack.events) });
							monster_map[monster.id] = to_push[to_push.length - 1];
						}
					}
					// disappearing_text(player.socket,monster,"ATTACK!",{color:"#E082B1",xy:1});
				}
			});
		}
		if (player.u) {
			player.u = false;
			to_push.push({ id: id, entity: player, data: player_to_client(player, 1) });
		}
		if (player.violations >= 3) {
			player.socket.disconnect();
		}
	}

	(G.maps[instance.map].traps || []).forEach(function (trap) {
		if (trap.type == "spikes") {
			for (var id in pmap_get({ x: trap.position[0], y: trap.position[1], in: instance.name })) {
				var player = players[id_to_id[id]];
				if (player && !player.npc) {
					disappearing_text(player.socket, player, "-50", { color: "red", xy: 1 });
					player.hp = max(0, player.hp - 50);
					player_rip_logic(player);
					resend(player, "u+cid");
				}
			}
		} else if (trap.type == "debuff") {
			for (var id in instance.players) {
				var player = instance.players[id];
				if (is_point_inside([player.x, player.y], trap.polygon)) {
					// player.s["debuffaura"]={"ms":200,"name":"Debuff","skin":"citizens","citizens":true,"speed":-40};
					add_condition(player, "slowness", { duration: 200 });
					resend(player, "u+cid");
				}
			}
		}
	});

	for (var id in instance.players) {
		send_xy_updates(instance.players[id], to_push);
	}
	for (var id in instance.observers) {
		send_xy_updates(instance.observers[id], to_push);
	}
}

function count_unique_users() {
	unique_players = 0;
	var marked = {};
	for (var id in players) {
		var ip = get_ip(players[id]);
		if (!marked[ip]) {
			marked[ip] = 1;
			unique_players++;
		}
	}
	if (is_sdk) {
		unique_players = 9;
	}
	for (name in instances) {
		var instance = instances[name];
		if (!instance.pvp) {
			continue;
		}
		var initial = instance.allow;
		var npc = npcs.pvp;
		if (
			(is_sdk && Object.keys(players).length >= 2) ||
			unique_players >= B.arena_limit ||
			Object.keys(instance.players).length
		) {
			// direction logic at game.js/update_sprite
			if (instance.allow) {
				continue;
			}
			instance.allow = true;
			if (!npc) {
				continue;
			}
			npc.going_x = npc.positions[1][0];
			npc.going_y = npc.positions[1][1];
			npc.allow = true;
			npc.u = true;
			start_moving_element(npc);
		} else {
			if (!instance.allow) {
				continue;
			}
			instance.allow = false;
			if (!npc) {
				continue;
			}
			npc.going_x = npc.positions[0][0];
			npc.going_y = npc.positions[0][1];
			npc.allow = false;
			npc.u = true;
			start_moving_element(npc);
		}
	}
}

var last_iloop = new Date();
function instance_loop() {
	var ms_since = 32;
	try {
		var now_date = new Date();

		for (name in instances) {
			var instance = instances[name];
			if (mssince(instance.last_update) > 75) {
				update_instance(instance);
			}
		}

		ms_since = mssince(now_date);
		if (ms_since > B.instance_loop_log_edge) {
			server_log("Instance loop took " + mssince(now_date) + "ms", 1);
		}
		perfc.instance_loop[ms_since] = (perfc.instance_loop[ms_since] || 0) + 1;
		perfc.instance_loops += 1;
		var mss_since = mssince(last_iloop);
		perfc.instance_delay[mss_since] = (perfc.instance_delay[mss_since] || 0) + 1;
		if (mss_since / 1000 > 15) {
			console.log("Sleep detected: " + mss_since / 1000);
		}
		last_iloop = new Date();
	} catch (e) {
		log_trace("#X Instance loop error", e);
	}
	setTimeout(instance_loop, max(75, min(1000, ms_since * 2 + 2)));
}

function npc_loop() {
	// now mainly just NPC's, back in the day pretty much everything [11/08/22]
	if (!server.live) {
		return setTimeout(npc_loop, 10);
	}
	var ms_since = 32;
	try {
		var now_date = new Date();

		for (var id in npcs) {
			var npc = npcs[id];
			var delay = -npc.delay * npc.d_multiplier;
			if (npc.rip) {
				continue;
			}
			var def = G.npcs[npc.ntype] || {};
			if (
				def &&
				instances[npc.in] &&
				instances[npc.in].players &&
				def.aura &&
				(!npc.last_aura || mssince(npc.last_aura) > 2000)
			) {
				npc.last_aura = new Date();
				for (var pid in instances[npc.in].players) {
					var player = instances[npc.in].players[pid];
					// console.log(player);
					if (!player.npc && distance(player, npc) < 320) {
						player.s[npc.ntype + "aura"] = { ms: 6000, name: "Citizen's Aura", skin: "citizens", citizens: true };
						for (var p in def.aura) {
							player.s[npc.ntype + "aura"][p] = def.aura[p];
						}
						resend(player, "u+cid");
					}
				}
			}
			if (def.attack && ssince(npc.last.attack) > 1.5) {
				for (var id in instances[npc.in].monsters) {
					var monster = instances[npc.in].monsters[id];
					if (distance(npc, monster) < npc.range) {
						//  && monster.hp>5000
						npc.last.attack = new Date();
						commence_attack(npc, monster, "attack");
						break;
					}
				}
			}

			if (def.seek) {
				var target = npc.focus && get_player(npc.focus);
				if (target && def.transport && target.map != npc.map && target.in == target.map) {
					var spot = safe_xy_nearby(target.map, target.x - 8, target.y - 6);
					if (spot) {
						transport_player_to(npc, get_player(npc.focus).map, [spot.x, spot.y]);
					}
				}
				var target = null;
				var old_focus = npc.focus;
				var min_val = 99999;
				var max_val = -99999;

				for (var pid in instances[npc.in].players) {
					var player = instances[npc.in].players[pid];
					if (def.seek == "low_hp" && player.hp < player.max_hp * 0.275 && player.hp < min_val) {
						min_val = player.hp;
						target = player;
					}
					if (def.seek == "cuteness" && player.cuteness && player.cuteness > max_val) {
						max_val = player.cuteness;
						target = player;
					}
					if (
						def.seek == "thrill" &&
						player.thrilling &&
						player.thrilling > now_date &&
						(!target || player.thrilling > target.thrilling)
					) {
						target = player;
					}
					if (def.seek == "gold" && player.gold > 1000000000 * ((!is_pvp && 10) || 1) && player.gold > max_val) {
						max_val = player.gold;
						target = player;
					}
					if (player.type == "merchant") {
						continue;
					}
					if (
						def.seek == "dragondagger" &&
						player.slots.mainhand &&
						player.slots.mainhand.name == "dragondagger" &&
						player.level < min_val
					) {
						min_val = player.level;
						target = player;
					}
				}

				npc.focus = target && target.name;
				if (old_focus != npc.focus) {
					npc.u = true;
					npc.cid++;
				}
			}

			if (!npc.movable) {
				continue;
			}
			var moves = [
				[1, 0],
				[0, 1],
				[-1, 0],
				[0, -1],
				[0.8, 0.8],
				[-0.8, -0.8],
				[0.8, -0.8],
				[-0.8, 0.8],
			];
			var multiplier = npc.steps;
			shuffle(moves);
			if (def.aura && G.maps[npc.map].ref.transporter && distance(npc, G.maps[npc.map].ref.transporter) < 2000) {
				delay = -2400;
				multiplier *= 4;
			} else if (def.aura) {
				delay *= 3;
			}
			if (!npc.citizen || npc.moving || npc.last.move > future_ms(delay) || instances[npc.in].paused) {
				continue;
			}
			if (Math.random() < 0.3) {
				multiplier *= 2;
			} else if (Math.random() < 0.3) {
				multiplier *= 4;
			}

			if (def.heal) {
				for (var id in instances[npc.in].players) {
					var player = instances[npc.in].players[id];
					if (distance(player, npc) < 320 && player.hp < player.max_hp) {
						commence_attack(npc, player, "partyheal");
					}
				}
			}

			if (npc.focus) {
				var target = get_player(npc.focus);
				if (!target || distance(target, npc) < 30) {
					continue;
				}
				npc.going_x = (npc.x + target.x) / 2;
				npc.going_y = (npc.y + target.y) / 2;
				if (!can_move(npc)) {
					npc.going_x = npc.x + moves[0][0] * multiplier;
					npc.going_y = npc.y + moves[0][1] * multiplier;
				}
			} else {
				npc.going_x = npc.x + moves[0][0] * multiplier;
				npc.going_y = npc.y + moves[0][1] * multiplier;
			}
			npc.d_multiplier = 1 + 2 * Math.random();

			if (
				npc.boundary &&
				(npc.going_x < npc.boundary[0] ||
					npc.going_x > npc.boundary[2] ||
					npc.going_y < npc.boundary[1] ||
					npc.going_y > npc.boundary[3])
			) {
			} else if (can_move(npc)) {
				npc.u = true;
				start_moving_element(npc);
				// server_log("Moving to "+npc.going_x+","+npc.going_y);
			} else {
				npc.going_x = npc.x;
				npc.going_y = npc.y;
				npc.last.move = new Date();
			}
		}
		ms_since = mssince(now_date);
	} catch (e) {
		log_trace("#X NPC loop error", e);
	}
	setTimeout(npc_loop, max(28, min(1000, ms_since * 2 + 2))); // originally 24
}

function game_loop() {
	// back in the day pretty much everything was in here [11/08/22]
	if (!server.live) {
		return setTimeout(game_loop, 10);
	}
	var ms_since = 32;
	try {
		var now_date = new Date();
		// for(name in instances)
		// {
		// 	var instance=instances[name];
		// 	if(mssince(instance.last_update)>75) update_instance(instance);
		// }
		for (var id in server.s) {
			server.s[id].ms -= 10;
			if (server.s[id].ms < 0) {
				delete server.s[id];
			}
		}

		ms_since = mssince(now_date);
		if (ms_since > B.game_loop_log_edge) {
			server_log("Main loop took " + mssince(now_date) + "ms", 1);
		}
		perfc.game_loop[ms_since] = (perfc.game_loop[ms_since] || 0) + 1;
		perfc.game_loops += 1;
	} catch (e) {
		log_trace("#X Main loop error", e);
	}
	setTimeout(game_loop, max(28, min(1000, ms_since * 2 + 2))); // originally 24
}

var lrid = 0;
function aura_loop() {
	try {
		lrid++;
		for (var id in players) {
			var player = players[id];
			if (!player || !player.aura || player.rid % 5 != lrid % 5) {
				continue;
			}
			for (var aid in player.aura) {
				for (var pid in instances[player.in].players) {
					if (!is_same(instances[player.in].players[pid], player, 3)) {
						continue;
					}
					if (distance(instances[player.in].players[pid], player) > 200) {
						continue;
					}
					instances[player.in].players[pid].s[aid] = { ms: G.conditions[aid].duration || 30000, f: player.name };
					if (G.conditions[aid].attr0) {
						instances[player.in].players[pid].s[aid][G.conditions[aid].attr0] = player.aura[aid].attr0;
					}
					resend(instances[player.in].players[pid], "u+cid");
				}
			}
		}
	} catch (e) {
		log_trace("#X aura loop error", e);
	}
	setTimeout(aura_loop, 1000);
}

setTimeout(game_loop, 10);
setTimeout(npc_loop, 10);
setTimeout(instance_loop, 10);
setTimeout(aura_loop, 10);
setInterval(count_unique_users, 6000);

setInterval(function () {
	try {
		for (var id in observers) {
			var observer = observers[id];
			if (observer.player && get_player(observer.player.name)) {
				var player = get_player(observer.player.name);
				if (simple_distance(observer, player) > 200) {
					transport_observer_to(
						observer,
						player.in,
						player.map,
						player.x,
						player.y + ((observer.socket.desktop && 120) || 0),
					);
				}
			} else {
				if (simple_distance(observer, { map: observer_map, in: observer_map, x: observer_x, y: observer_y }) > 200) {
					transport_observer_to(
						observer,
						observer_map,
						observer_map,
						observer_x,
						observer_y + ((observer.socket.desktop && 120) || 0),
					);
				}
			}
		}
	} catch (e) {
		log_trace("#X observer loop2 error", e);
	}
}, 13200);

setInterval(function () {
	try {
		if (is_pvp) {
			return;
		}
		var names = [];
		var player;
		total_merchants = 0;
		for (var id in players) {
			player = players[id];
			if (
				!player.npc &&
				player.last.attack &&
				player.map == player.in &&
				ssince(player.last.attack) < 3 &&
				!G.maps[player.map].pvp
			) {
				names.push(player.name);
			}
			if (player.p && player.p.stand) {
				total_merchants += 1;
			}
		}
		if (names.length) {
			player = get_player(names[floor(Math.random() * names.length)]);
			observer_map = player.map;
			observer_x = parseInt(player.x);
			observer_y = parseInt(player.y);
			server_log("Set the observer location: " + [observer_map, observer_x, observer_y]);
		} else {
			observer_map = merchant_map;
			observer_x = merchant_x;
			observer_y = merchant_y;
		}
	} catch (e) {
		log_trace("#X observer loop error", e);
	}
}, 4000);

setTimeout(
	function () {
		setInterval(
			function () {
				for (var id in players) {
					var player = players[id];
					if (player.type == "merchant" && player.p.stand) {
						var xp = 1000;
						if (player.level <= 40) {
							xp = G.levels[player.level] / 100;
						} else if (player.level <= 60) {
							xp = G.levels[player.level] / 200;
						} else if (player.level <= 70) {
							xp = G.levels[player.level] / 400;
						} else {
							xp = G.levels[70] / 400;
						}
						xp = parseInt(Math.round(xp));
						player.xp += xp;
						player.socket.emit("game_log", "Gained " + to_pretty_num(xp) + " marketing XP");
						player.socket.emit("disappearing_text", {
							message: "+" + xp,
							x: player.x,
							y: player.y - 32,
							args: { color: "gray", size: "large" },
						});
						resend(player, "reopen+u+cid");
					}
				}
			},
			3 * 60 * 60 * 1000,
		); //3
	},
	1 * 60 * 60 * 1000,
); //1

setInterval(function () {
	try {
		var edge = future_s(-120);
		for (var id in players) {
			if (0 && players[id].last_ipass < edge) {
				players[id].ban = "ipass";
				players[id].socket.emit("disconnect_reason", "Failed to check in. Your network might be too slow.");
				players[id].socket.disconnect();
			}
		}
	} catch (e) {
		log_trace("#X ipass loop error", e);
	}
}, 132000);

setTimeout(function () {
	setInterval(function () {
		try {
			for (var id in instances) {
				var instance = instances[id];
				if (
					B.pause_instances &&
					!instance.paused &&
					!instance.operators &&
					Object.keys(instance.players).length <= instance.npcs &&
					!Object.keys(instance.observers).length &&
					ssince(instance.last_player) > 50
				) {
					pause_instance(instance);
				}
				if (Object.keys(instance.players).length > instance.npcs || Object.keys(instance.observers).length) {
					instance.last_player = new Date();
				}
			}
		} catch (e) {
			log_trace("#X pause loop error", e);
		}
	}, 2000);
}, 60000); // delay for a minute, so citizens move around

setInterval(function () {
	try {
		for (var oname in parties) {
			send_party_update(oname);
		}
	} catch (e) {
		log_trace("#X party loop error", e);
	}
}, 60000);

setInterval(function () {
	try {
		for (var id in players) {
			var player = players[id];
			players[id].pdps *= 0.8;
			player.p.minutes++;
			trade_slots.forEach(function (slot) {
				if (player.slots[slot] && player.slots[slot].giveaway) {
					player.slots[slot].giveaway--;
					if (!player.slots[slot].giveaway) {
						var list = [];
						player.slots[slot].list.forEach(function (p) {
							var p = get_player(p);
							if (p && p.esize) {
								list.push(p);
							} else if (!mode.prevent_external) {
								list.push({ name: p });
							}
						});
						if (!list.length) {
							player.slots[slot].giveaway = 5;
						} else {
							if (!mode.prevent_external) {
								var winner = random_one(list);
								var item = player.slots[slot];
								player.slots[slot] = null;
								delete item.list;
								delete item.giveaway;
								delete item.registry;
								item.gf = player.name;
								item.src = "gva";
								var mitem = JSON.stringify(item);
								add_to_trade_history(player, "giveaway", winner.name, cache_item(item, true));
								xy_emit(player, "game_log", {
									message: winner.name + " won " + player.name + "'s giveaway of " + G.items[item.name].name + "!",
									color: "#42A0DC",
									confetti: winner.name,
								});
								appengine_call(
									"send_mail",
									{
										fro: player.name,
										to: winner.name,
										subject: "You've won a giveaway!",
										message:
											"Congratulations, you won " + player.name + "'s giveaway. Participants were: " + list.join(", "),
										rid: randomStr(50),
										retries: 5,
										item: mitem,
									},
									function (result) {},
									function () {
										console.log("#M unsent giveaway, lost item: " + mitem);
									},
								);
							} else {
								var winner = random_one(list);
								var item = player.slots[slot];
								player.slots[slot] = null;
								delete item.list;
								delete item.giveaway;
								delete item.registry;
								item.gf = player.name;
								item.src = "gva";
								add_item(winner, item);
								add_to_trade_history(player, "giveaway", winner.name, cache_item(item, true));
								xy_emit(player, "game_log", {
									message: winner.name + " won " + player.name + "'s giveaway of " + G.items[item.name].name + "!",
									color: "#42A0DC",
									confetti: winner.name,
								});
								resend(winner, "reopen");
							}
						}
					}
					player.cslots[slot] = cache_item(player.slots[slot], true);
					resend(player, "u+cid" + ((!player.slots[slot] && "+reopen") || ""));
				}
			});
		}
	} catch (e) {
		log_trace("#X decay loop error", e);
	}
}, 60000);

var a_score = {}; // announcement score
setInterval(function () {
	try {
		for (var id in a_score) {
			a_score[id] *= 0.99;
		}
	} catch (e) {
		log_trace("#X ascore loop error", e);
	}
}, 10000);

setInterval(function () {
	try {
		for (var id in players) {
			var player = players[id];
			player.xrange = min(25, player.xrange + 5);
		}
	} catch (e) {
		log_trace("#X xrange loop error", e);
	}
}, 1000);

setInterval(function () {
	try {
		var c = new Date();
		for (var id in players) {
			var player = players[id];
			if (player.auth_id && player.p.first === undefined && !player.first_u_call) {
				function first_call(player) {
					player.first_u_call = appengine_call(
						"is_first",
						{ auth: player.auth, auth_id: player.auth_id, character: player.real_id, suffix: "/" + player.id },
						function (result) {
							if (result.first) {
								player.p.first = true;
							} else {
								player.p.first = false;
							}
						},
						function () {
							delete player.first_u_call;
						},
					);
				}
				first_call(player);
			}
			if (player.p.first && !player.p.dt.first) {
				realm_broadcast("server_message", { message: player.name + " joined Adventure Land!", color: "#24A2FA" });
				player.p.dt.first = future_h(24 * 7);
			} else if (player.p.dt.first && player.p.dt.first > c) {
				player.paura = player.paura || {};
				player.paura["newcomersblessing"] = { attr0: 0, attr1: 0 };
			}
		}
	} catch (e) {
		log_trace("#X first_character loop error", e);
	}
}, 4000);

function projectiles_loop() {
	var now = new Date();
	for (var id in projectiles) {
		try {
			if (projectiles[id].eta <= now) {
				var projectile = projectiles[id];
				delete projectiles[id];
				complete_attack(projectile.attacker, projectile.target, projectile);
			}
		} catch (e) {
			log_trace("#X projectile loop error", e);
		}
	}
}

setInterval(projectiles_loop, 7);

var accel = 1;
if (mode.fast_mlevels) {
	accel = 100;
}
setInterval(function () {
	try {
		for (var id in instances) {
			for (var mid in instances[id].monsters || []) {
				var monster = instances[id].monsters[mid];
				if (
					G.monsters[monster.type].cute ||
					G.monsters[monster.type].peaceful ||
					G.monsters[monster.type].stationary ||
					monster.target
				) {
					continue;
				}
				var exp = Math.pow(2, (monster.level - 1) * 0.3);
				var mult = 1;
				if (monster["1hp"]) {
					mult = 200;
				} else if (G.monsters[monster.type].special) {
					mult = 20;
				}
				if (
					mssince(monster.last_level) > max((180000 * exp * mult) / accel, (monster.max_hp * mult * 30 * exp) / accel)
				) {
					if (monster.temp) {
						remove_monster(monster);
					} else {
						level_monster(monster);
					}
				}
			}
		}
	} catch (e) {
		log_trace("#X mlevel loop error", e);
	}
}, 16000 / accel);

setInterval(function () {
	try {
		for (var id in instances) {
			for (var mid in instances[id].monsters || []) {
				var monster = instances[id].monsters[mid];
				if (G.monsters[monster.type].cute || G.monsters[monster.type].stationary || !monster.target) {
					continue;
				}
				var target = get_player(monster.target);
				if (!target || (target.targets > 1 && monster.hp < monster.max_hp * 0.23)) {
					continue;
				}
				monster.extra_gold =
					(monster.extra_gold || 0) +
					((min(min(2400, target.attack) / 220.0 + monster.attack / 1.2, 55) + 19) *
						((gameplay == "hardcore" && 100) || 1)) /
						(max((target.targets - 1) * (target.targets - 1), 1) || 1);
			}
		}
	} catch (e) {
		log_trace("#X mgold loop error", e);
	}
}, 2000);

setInterval(function () {
	try {
		for (var id in players) {
			var player = players[id];
			if (Math.random() < 1.0 / (6 * 15)) {
				// once every 15 hours
				var slots = [];
				character_slots.forEach(function (slot) {
					if (
						player.slots[slot] &&
						(G.items[player.slots[slot].name].upgrade || G.items[player.slots[slot].name].compound)
					) {
						slots.push(slot);
					}
				});
				if (!slots.length) {
					continue;
				}
				var slot = random_one(slots);
				player.slots[slot].grace = (player.slots[slot].grace || 0) + 0.4;
				console.log("random grace " + player.name + " " + slot + " " + player.slots[slot].grace);
			}
			if (player.computer && Math.random() < 1.0 / (6 * 1)) {
				// once every hour
				for (var s in player.slots) {
					if (player.slots[s] && G.items[player.slots[s].name].charge) {
						if (player.slots[s].charges > G.items[player.slots[s].name].charge && Math.random() < 0.96) {
							continue;
						}
						player.slots[s].charges = (player.slots[s].charges || 0) + 1;
						player.cslots[s] = cache_item(player.slots[s]);
					}
				}
				for (var i = 0; i < player.items.length; i++) {
					if (player.items[i] && G.items[player.items[i].name].charge) {
						if (player.items[i].charges > G.items[player.items[i].name].charge && Math.random() < 0.96) {
							continue;
						}
						player.items[i].charges = (player.items[i].charges || 0) + 1;
						player.citems[i] = cache_item(player.items[i]);
					}
				}
			}
		}
	} catch (e) {
		log_trace("#X random grace loop error", e);
	}
}, 10 * 60000); // every 10 minutes

setInterval(
	function () {
		try {
			server_loot();
		} catch (e) {
			log_trace("#X server loot error", e);
		}
	},
	4 * 60 * 60 * 1000,
);

setInterval(function () {
	try {
		if (server.live) {
			broadcast_e();
		}
	} catch (e) {
		log_trace("#X broadcast error", e);
	}
}, 24 * 1000);

function sync_loop() {
	function check_for_delays(player) {
		var limit = 6;
		if (player.mounting && msince(player.mounting) > limit && !player.mount_issue) {
			server_log("#X SEVERE: " + limit + " minutes and still mounting: " + player.name, 1);
			player.mount_issue = new Date();
		}
		if (player.unmounting && msince(player.unmounting) > limit && !player.unmount_issue) {
			server_log("#X SEVERE: " + limit + " minutes and still unmounting: " + player.name, 1);
			player.unmount_issue = new Date();
		}
		if (player.sync_call && msince(player.last_sync) > limit && !player.sync_issue) {
			server_log("#X SEVERE: " + limit + " minutes and still syncing: " + player.name, 1);
			// player.sync_issue=new Date();
			delete player.sync_call;
		}
		if (player.stopping && msince(player.stopping) > limit && !player.stop_issue) {
			server_log("#X SEVERE: " + limit + " minutes and still stopping: " + player.name, 1);
			player.stop_issue = new Date();
		}
	}
	function mount_call(player) {
		// player.last_sync=new Date(); - sync doesn't happen at mount - maybe it should [16/08/17]
		player.mount_call = appengine_call(
			"mount_user",
			{ auth: player.auth, character: player.real_id, suffix: "/" + player.id, to: player.mount_to },
			function (result) {
				server_log("mount_user: " + player.name + " owner: " + player.owner, 1);
				delete player.mounting;
				delete player.mount_call;
				if (result.failed) {
					server_log(
						"mount_user[failed]: " + player.name + " in-bank: " + result.name + " result: " + JSON.stringify(result),
						1,
					);
					player.socket.emit("game_response", { response: "bank_opx", name: result.name, reason: result.reason });
					return;
				}
				player.user = result.user;
				init_bank(player);
				if (players[player.socket.id]) {
					transport_player_to(player, player.mount_to, player.mount_s);
					resend(player);
				}
			},
			function () {
				delete player.mounting;
				delete player.mount_call;
				server_log("#X SEVERE-ish: Mount failed for " + player.name, 1);
			},
		);
	}
	function unmount_call(player) {
		player.last_sync = new Date();
		init_bank_exit(player);
		player.unmount_call = appengine_call(
			"sync_character",
			{
				auth: player.auth,
				character: player.real_id,
				data: player_to_server(player, "sync"),
				user_data: player.user || "",
				retries: 100,
				unmount: 1,
				suffix: "/" + player.name + "/unmount",
			},
			function (result) {
				server_log(
					"unmount_user[sync]: " + player.name + " owner: " + player.owner + " result: " + JSON.stringify(result),
					1,
				);
				delete player.unmount_call;
				if (result.failed) {
					server_log("unmount_user[failed]: " + player.name + " owner: " + player.owner, 1);
					return;
				}
				delete player.unmounting;
				player.user = null;
				player.cuser = null;
				if (players[player.socket.id] && player.unmount_to) {
					transport_player_to(player, player.unmount_to, player.unmount_s);
				}
				if (players[player.socket.id]) {
					resend(player);
				}
			},
			function () {
				server_log("#X SEVERE: Unmount failed for " + player.name, 1);
				delete player.unmounting;
				delete player.unmount_call;
				if (players[player.socket.id]) {
					players[socket.id].socket.disconnect();
				}
			},
		);
	}
	function sync_call(player) {
		player.last_sync = new Date();
		player.sync_call = appengine_call(
			"sync_character",
			{
				auth: player.auth,
				character: player.real_id,
				data: player_to_server(player, "sync"),
				user_data: player.user || "",
				retries: 0,
				suffix: "/" + player.name,
			},
			function (result) {
				if (result && result.reason == "notingame") {
					server_log("#X SEVERE: sync notingame disconnect for " + player.name, 1);
					try {
						player.socket.disconnect();
					} catch (e) {}
				}
				delete player.sync_call;
			},
			function () {
				delete player.sync_call;
			},
		);
	}
	function stop_call(player) {
		var bank = false;
		if (player.user) {
			bank = true;
		}
		player.stopping = new Date();
		init_player_exit(player);
		if (player.unmount_call) {
			player.unmount_call.retries = 0;
		}
		player.stop_call = appengine_call(
			"stop_character",
			{
				auth: player.auth,
				character: player.real_id,
				data: player_to_server(player),
				user_data: player.user || "",
				retries: CINF,
				suffix: "/" + player.name,
			},
			function (result) {
				server_log(
					"stop_character: " +
						player.name +
						" owner: " +
						player.owner +
						" bank: " +
						bank +
						" result: " +
						JSON.stringify(result),
					1,
				);
				if (result.done) {
					delete dc_players[player.real_id];
				}
				delete player.stop_call;
			},
			function () {
				server_log("#X SEVERE: stop_character failed for " + player.name, 1);
				delete player.stop_call;
			},
		);
	}

	for (var id in players) {
		if (gameplay == "hardcore" || gameplay == "test") {
			return;
		}
		var player = players[id];
		try {
			check_for_delays(player);

			if (player.unmount_call || player.mount_call || player.sync_call || player.stop_call) {
			} else if (!server.live) {
				player.socket.disconnect();
			} else if (player.unmounting) {
				unmount_call(player);
			} else if (player.mounting) {
				mount_call(player);
			} else if (msince(player.last_sync) > 5 && !player.unmounting && !player.mounting) {
				sync_call(player);
			}
		} catch (e) {
			log_trace("#X dc loop error1", e);
		}
	}
	for (var id in dc_players) {
		if (gameplay == "hardcore" || gameplay == "test") {
			return;
		}
		var player = dc_players[id];
		try {
			check_for_delays(player);

			if (player.unmount_call || player.mount_call || player.sync_call || player.stop_call) {
			} else if (!player.stop_call) {
				stop_call(player);
			}
		} catch (e) {
			log_trace("#X dc loop error2", e);
		}
	}
}

function server_loop() {
	// #IMPORTANT: sometimes none of the success/error callbacks trigger [20/08/19]
	if (server.update_call && msince(server.update_call.init) > 4) {
		delete server.update_call;
	}
	if (server.update_call || server.stop_call) {
	} else if (server.live && ssince(server.last_update) > 75) {
		server.update_call = appengine_call(
			"update_server",
			{
				keyword: variables.keyword,
				id: server_id,
				players: Object.keys(players).length,
				observers: Object.keys(observers).length,
				merchants: total_merchants,
				total_players: total_players,
				data: S,
				retries: 3,
			},
			function (result) {
				server.last_update = new Date();
				server_log("Server update sent");
				delete server.update_call;
			},
			function () {
				server_log("Server update failed", 1);
				delete server.update_call;
			},
		);
	} else if (server.started && !server.live && !server.stopped) {
		server.stop_call = appengine_call(
			"stop_server",
			{ keyword: variables.keyword, id: server_id, retries: CINF, data: S },
			function (result) {
				server_log("stop_server success", 1);
				// these are here as shutting the server first disrupts connections in actual servers
				// io.close(); app.close(); - decided to comment these out, they don't do anything now [23/09/16]
				server.stopped = true;
				delete server.stop_call;
			},
		);
	} else if (
		server.stopped &&
		((!Object.keys(dc_players).length && !Object.keys(players).length) || gameplay == "hardcore" || gameplay == "test")
	) {
		process.exit();
	} else if (server.stopped) {
		sync_loop();
	}
}

setInterval(sync_loop, 24000);
setInterval(server_loop, 1000);

function shutdown() {
	server_log("shutdown", 1);
	server.live = false;
	if (!server.exists) {
		server_loot("all");
	}
	sync_loop();
}

function shutdown_routine() {
	server_log("shutdown_routine", 1);
	server.shutdown = true;
	for (var name in instances) {
		for (var id in instances[name].monsters) {
			var monster = instances[name].monsters[id];
			if (monster.target) {
				monster.u = true;
				monster.cid++;
				monster.mult = (monster.max_hp - monster.hp) / monster.max_hp;
				monster.hp = 1;
			}
		}
	}
	var seconds = 20;
	if (is_sdk) {
		seconds = 1;
	} else if (gameplay == "hardcore") {
		seconds = 240;
	}
	workers.forEach(function (worker) {
		try {
			worker.postMessage({ type: "exit" });
		} catch (e) {
			console.log(e);
		}
	});
	for (var i = 0; i < seconds; i++) {
		function m(x) {
			return function () {
				broadcast("server_message", { message: "Server shutdown in: " + x, color: "#DD1B50", nod: true, log: true });
			};
		}
		setTimeout(m(seconds - i), i * 1000);
	}
	broadcast("eval", { code: "call_code_function('trigger_event','shutdown',{seconds:" + seconds + "})" });
	setTimeout(shutdown, seconds * 1000);
	if (!is_sdk && region == "EU" && server_name == "I") {
		discord_call("Game update sequence initiated. Servers are shutting down in 20 seconds!");
	}
}

function exit_handler(options, err) {
	if (options.exit) {
		server_log("exit_handler", 1);
		shutdown_routine();
	}
}
process.on("exit", exit_handler.bind(null, { cleanup: true }));
process.on("SIGHUP", exit_handler.bind(null, { exit: true }));
process.on("SIGQUIT", exit_handler.bind(null, { exit: true }));
process.on("SIGINT", exit_handler.bind(null, { exit: true }));
process.on("SIGTERM", exit_handler.bind(null, { exit: true }));

// process.on('uncaughtException', function(err) { console.log('Caught exception: ' + err); });
