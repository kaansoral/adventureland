var request = require("request");
var crypto = require("crypto");
var range_check = require("range_check");
var protobuf = require("protobufjs");
var ByteBuffer = require("bytebuffer"); // Steam decryption
var false_socket = {
	emit: function (a, b) {
		if (is_sdk && !server.shutdown) {
			console.log([a, b]);
		}
	},
	total_calls: 0,
	calls: [],
};
var current_socket = false_socket;
var call_modifier = 1;
var ls_method = "";
var server_start = new Date();

var timers = {
	pinkgoo: false,
	snowman: false,
	wabbit: false,
	hardcore: new Date(),
	hide_and_seek: false,
	cyberland: new Date(),
};
var npcs = {};
var signups = {};
var hide_and_seek = {};
var stats = {
	kills: {},
};
var edges = {
	next_goldenbat: 80000,
	next_cutebee: 480000,
};
var NPC_prefix = "NPC0000000000000000NPC";

function sprocess_game_data() {
	for (var name in G.items) {
		var def = G.items[name];
		def.igrade = calculate_item_grade(def);
		if (!def.igrade) {
			def.igrace = 1;
		} else if (def.igrade == 1) {
			def.igrace = -1;
		} else if (def.igrade == 2) {
			def.igrace = -2;
		}

		def.a = 0;

		if (def.compound) {
			var u_v = calculate_item_value({ name: name, level: 3 + (def.edge || 0) });
			def.a = parseInt(round(u_v / 5000000));
		} else if (def.upgrade) {
			var u_v = calculate_item_value({ name: name, level: 7 + (def.edge || 0) });
			def.a = parseInt(round(u_v / 5000000));
		} else {
			var u_v = calculate_item_value({ name: name });
			def.a = parseInt(round(u_v / 5000000));
		}
		if (def.event) {
			def.a = 2;
		}
		if (def.rare) {
			def.a = 12;
		}
	}
	G.items.lostearring.igrade = 2;
	if (gameplay == "test") {
		test_logic();
	}
	if (gameplay == "hardcore") {
		hardcore_logic();
		for (var m in D.drops.monsters) {
			for (var i = 0; i < D.drops.monsters[m].length; i++) {
				D.drops.monsters[m][i][0] *= 200;
				if (D.drops.monsters[m][i][0] < 0.0001) {
					D.drops.monsters[m][i][0] *= 12.0;
				}
				D.drops.monsters[m][i][0] = min(1, D.drops.monsters[m][i][0]);
			}

			D.drops.monsters[m].push([1.0 / 100, "glitch"]);
			D.drops.monsters[m].push([1.0 / 100, "glitch"]);
			D.drops.monsters[m].push([1.0 / 1000, "glitch"]);
		}
		for (var n in D.drops) {
			if (!is_array(D.drops[n])) {
				continue;
			}
			var total = 0;
			for (var i = 0; i < D.drops[n].length; i++) {
				total += D.drops[n][i][0];
			}
			for (var i = 0; i < D.drops[n].length; i++) {
				if (D.drops[n][i][0] < 0.001) {
					D.drops[n][i][0] *= 200;
				}

				if (D.drops[n][i][0] * 3 < total / D.drops[n].length) {
					D.drops[n][i][0] *= 12.0;
				} else if (D.drops[n][i][0] * 1.5 < total / D.drops[n].length) {
					D.drops[n][i][0] *= 3.0;
				} else if (D.drops[n][i][0] / 3 > total / D.drops[n].length) {
					D.drops[n][i][0] /= 12.0;
				} else if (D.drops[n][i][0] / 1.5 > total / D.drops[n].length) {
					D.drops[n][i][0] /= 3.0;
				}
			}
		}
		for (var mname in G.maps) {
			if (!D.drops.maps[mname]) {
				D.drops.maps[mname] = [];
			}

			for (var i = 0; i < D.drops.maps[mname].length; i++) {
				D.drops.maps[mname][i][0] *= 200;
				D.drops.maps[mname][i][0] = min(1, D.drops.maps[mname][i][0]);
			}

			D.drops.maps[mname].push([1.0 / 1200, "gem0"]);
		}
		D.drops.gem0.push([0.5, "candycane"]);
		D.drops.gem0.push([0.05, "basketofeggs"]);
		D.drops.monsters.iceroamer.push([0.1, "open", "statbelt"]);
		D.drops.monsters.arcticbee.push([0.00001, "fclaw"]);
		D.drops.monsters.minimush.push([0.00001, "throwingstars"]);
		D.drops.monsters.squig.push([0.000008, "glitch"]);
		D.drops.monsters.bbpompom.push([0.00008, "glitch"]);
		D.drops.monsters.croc.push([0.000008, "glitch"]);
		D.drops.monsters.mole.push([0.002, "gemfragment"]);
		D.drops.monsters.mole.push([0.002, "gemfragment"]);
		D.drops.maps.mansion.push([0.001, "lostearring"]);
		D.drops.maps.mansion.push([0.001, "lostearring"]);
		D.drops.monsters.croc.push([1, "seashell"]);
		D.drops.monsters.croc.push([1, "seashell"]);
		D.drops.maps.global = [];
		D.monster_gold.bat *= 50;
		D.monster_gold.bbpompom *= 75;
		D.monster_gold.ghost *= 50;
		events.egghunt = 0.1;
	}
	D.craftmap = {};
	for (var name in G.craft) {
		var items = [];
		G.craft[name].items.forEach(function (x) {
			var name = x[1];
			if (x[2]) {
				name += "+" + x[2];
			}
			items.push(name);
		});
		items.sort();
		var key = items.join(",");
		D.craftmap[key] = name;
	}
	process_game_data();
	for (var name in G.monsters) {
		stats.kills[name] = stats.kills[name] || 0;
	}
	D.base_gold = {};
	for (var mname in G.maps) {
		var map = G.maps[mname];
		(map.monsters || []).forEach(function (pack) {
			var def = G.monsters[pack.type];
			var drop_value = 0;
			var map_value = 0;
			var global_value = 0;
			var hp_mult = def.hp / 1000.0;
			// #BETTER IDEA#
			// track damage done + dps utilisation / pack fullness - calculate gold based on that
			// /1400.0 /40.000 /14000.0 originally
			// 0.0624 is the original modifier
			pack.gold =
				def.hp *
					(0.0782 +
						max(def.charge - 40, 0) / 1900.0 +
						((1 - dps_multiplier(def.attack + (def.apiercing || 0) / 2 + (def.rpiercing || 0) / 2)) * 1000) / 120000.0 +
						min(
							(1 - damage_multiplier(def.armor || 0)) * 1000 + (def.evasion || 0) * 10 + (def.avoidance || 0) * 10,
							(1 - damage_multiplier(def.resistance || 0)) * 1000 +
								(def.reflection || 0) * 25 +
								(def.avoidance || 0) * 10,
						) /
							12000.0) -
				def.xp * 0.0172;
			if ((map.pvp || map.safe_pvp) && !is_pvp) {
				pack.gold *= 2;
			}
			drop_value = calculate_xvalue(D.drops.monsters[pack.type] || []);
			map_value = calculate_xvalue(D.drops.maps[mname] || [], undefined, undefined, hp_mult);
			global_value = calculate_xvalue(D.drops.maps.global || [], undefined, undefined, hp_mult);
			pack.gold = pack.gold - map_value / 1.002 - drop_value * 1.002; // Originally 1.2

			if (def.hp <= 2000 && pack.gold < def.hp * 0.0482) {
				pack.gold = def.hp * 0.0482;
			} else if (pack.gold < def.hp * 0.02808) {
				pack.gold = def.hp * 0.02808;
			}

			//if(def.hp<2000 && pack.gold<def.hp*0.05) pack.gold=def.hp*0.05;
			//else if(pack.gold<def.hp*0.03) pack.gold=def.hp*0.03;

			//if(def.hp<=300) pack.gold*=2;
			//else if(def.hp<=600) pack.gold*=1.5;
			//else if(def.hp<=1000) pack.gold*=1.25;

			if (def.hp <= 300) {
				pack.gold *= 1.7501;
			} else if (def.hp <= 600) {
				pack.gold *= 1.401;
			} else if (def.hp <= 1000) {
				pack.gold *= 1.2501;
			}

			// if((pack.gold/def.hp)>0.08 && def.hp>900) pack.gold*=0.7;

			// if(def.hp>=50000) pack.gold*=0.90; // better dps utilisation - don't punish this

			pack.gold *= def.difficulty || 1;
			pack.gold = parseInt(ceil(pack.gold)) || 0;
			if (def.stationary || def.xp < 0) {
				pack.gold = D.monster_gold[pack.type] || 0;
			}
			D.base_gold[pack.type] = D.base_gold[pack.type] || {};
			D.base_gold[pack.type][mname] = pack.gold;
			console.log(
				mname +
					" " +
					pack.type +
					" gold: " +
					pack.gold +
					"[" +
					parseInt(drop_value) +
					"," +
					parseInt(map_value) +
					"] gold/hp: " +
					pack.gold / def.hp +
					" total%: " +
					(pack.gold + drop_value + map_value) / def.hp,
			);
		});
	}
	for (var sname in G.sets) {
		var set = G.sets[sname];
		for (var i = 2; i <= set.items.length; i++) {
			set[i] = set[i] || {};
			for (var prop in set[i - 1]) {
				if (set[i][prop]) {
					set[i][prop] += set[i - 1][prop];
				} else {
					set[i][prop] = set[i - 1][prop];
				}
			}
		}
	}
	if (is_pvp) {
		D.drops.maps.global_static.push([1.0 / ((gameplay == "hardcore" && 1000) || 100000), "pvptoken"]);
	}

	if (events.halloween) {
		G.monsters.jr.respawn = 480;
		G.monsters.greenjr.respawn = 480;
		D.drops.maps.global.push([0.00005, "candy0"]);
		D.drops.maps.global.push([0.00125, "candy1"]);
	}

	if (events.holidayseason) {
		events.snowman = 60;
	}
}

function calculate_xvalue(arr, rec, divide, mult) {
	var value = 0;
	var total = 0;
	// console.log(arr);
	arr.forEach(function (drop) {
		total += drop[0];
	});
	if (!mult) {
		mult = 1;
	}
	if (!divide) {
		total = 1;
	} else {
		mult = 1;
	}
	arr.forEach(function (drop) {
		if (drop[1] == "open") {
			value += min(1, (drop[0] * mult) / total) * calculate_xvalue(D.drops[drop[2]], 1, 1, mult);
		} else if (drop[1] == "shells") {
			value += min(1, (drop[0] * mult) / total) * drop[2] * G.multipliers.shells_to_gold;
		} else if (drop[1] == "empty") {
		} else if (drop[1] == "gold") {
			value += drop[2] * min(1, (drop[0] * mult) / total);
		} else {
			var def = G.items[drop[1]];
			var q = drop[2] || 1;
			var g = def.g;
			var avalue = def.g;
			if (def.e && !rec) {
				var suffix = "";
				if (def.upgrade || def.compound) {
					suffix = "0";
				}
				avalue = calculate_xvalue(D.drops[drop[1] + suffix], 1, 1, mult) / def.e;
				// console.log(drop[1]+" value: "+g+" actual: "+avalue);
			}
			value += (q * min(1, (drop[0] * mult) / total) * (g + avalue)) / 2;
		}
		if (!value) {
			console.log(drop);
		}
	});
	return value;
}

function add_to_trade_history(player, event, name, item, price) {
	if (!player.p.trade_history) {
		player.p.trade_history = [];
	}
	var last = player.p.trade_history[player.p.trade_history.length - 1];
	if (last && last[0] == event && last[1] == name && last[2].name == item.name && last[2].level == item.level) {
		last[2].q = (last[2].q || 1) + (item.q || 1);
		last[3] += price;
		return;
	}
	if (player.p.trade_history.length >= 40) {
		player.p.trade_history.shift();
	}
	player.p.trade_history.push([event, name, item, price]);
}

function add_to_history(player, event) {
	if (!player.p.history) {
		player.p.history = [];
	}
	if (player.p.history.length >= 400) {
		player.p.history.shift();
	}
	player.p.history.push(event);
}

function is_free(player) {
	if (player.bot || player.p.free || player.s.licenced || player.role == "gm") {
		return true;
	}
	return false;
}

function is_player_allowed(player) {
	if (gameplay == "hardcore") {
		//if(player.type=="mage" || player.type=="priest") return false;
		//if(player.type=="rogue") return false;
	}
	var socket = player.socket;
	var characters = 0;
	var ips = 0;
	var ipx = player.ipx || 1;
	var auths = 0;
	if (player.temp_auth || player.auth_id) {
		ipx = 12;
	}
	if (is_free(player) || (player.stones && 0)) {
		return true;
	}
	if (player.type == "merchant") {
		for (var id in players) {
			if ((players[id].stones && 0) || id == player.socket.id || is_free(player)) {
				continue;
			}
			if (players[id].owner == player.owner && players[id].type == "merchant") {
				return false;
			}
		}
		return true;
	}
	for (var id in players) {
		if ((players[id].stones && 0) || is_free(players[id]) || players[id].type == "merchant") {
			continue;
		} // was requested [28/10/16]
		if (players[id].owner == player.owner) {
			characters++;
		}
		if (players[id].name == player.name && player != players[id]) {
			return false;
		} // "hardcore"
		if (get_ip(players[id]) == get_ip(player)) {
			ips++;
		}
		if (player.auth_id && players[id].auth_id == player.auth_id) {
			auths++;
		}
		if (auths > variables.character_limit) {
			return false;
		}
		if (characters > variables.character_limit) {
			return false;
		}
		if (ips > variables.ip_limit * ipx) {
			return false;
		}
	}
	return true;
}

function rip(player) {
	player.hp = 0;
	player.rip = true;
	player.rip_time = new Date();
	player.moving = false;
	player.abs = true;
	if (player.party) {
		send_party_update(player.party);
	}
}

function notify_friends(data) {
	data.list.forEach(function (name) {
		var player = players[name_to_id[name]];
		if (!player) {
			return;
		}
		player.socket.emit("online", { name: data.name, server: data.server });
	});
}

function check_player(player) {
	// to check players in setTimeout's
	if (!player || !player.socket || player.dc || !players[player.socket.id]) {
		return false;
	}
	return true;
}

function is_invis(player) {
	if (player.s && (player.s.invis || player.s.ethereal)) {
		return true;
	}
	return false;
}

function is_invinc(player) {
	if (player.s && (player.s.invis || player.s.ethereal || player.s.invincible)) {
		return true;
	}
	return false;
}

function is_in_pvp(player, allow_safe) {
	if (allow_safe && G.maps[player.map].safe) {
		return false;
	}
	if (is_pvp || G.maps[player.map].pvp) {
		return true;
	}
	return false;
}

function is_map_pvp(map, allow_safe) {
	if (allow_safe && G.maps[map].safe) {
		return false;
	}
	if (is_pvp || G.maps[map].pvp) {
		return true;
	}
	return false;
}

function is_same(player1, player2, party) {
	if (is_sdk && player1.name != player2.name) {
		return false;
	}
	if (player1.name == player2.name) {
		return true;
	}
	if ((player1.owner && player1.owner == player2.owner) || (!is_sdk && get_ip(player1) == get_ip(player2))) {
		return true;
	}
	if (party == 3 && !is_in_pvp(player1)) {
		return true;
	}
	if (party && player1.s && player1.s.coop && player2.s && player2.s.coop && player1.s.coop.id == player2.s.coop.id) {
		return true;
	} // previously party==2 [08/05/21]
	if (party && player1.party && player1.party == player2.party) {
		return true;
	}
	if (party && player1.team && player1.team == player2.team) {
		return true;
	}
	return false;
}

function decay_s(player, ms) {
	for (var name in player.s || {}) {
		if (G.conditions[name] && G.conditions[name].debuff) {
			continue;
		}
		if (player.s[name].ms < 60000 || player.s[name].citizens) {
			if (player.s[name].citizens) {
				for (var p in player.s[name]) {
					if (p != "ms" && is_number(player.s[name][p])) {
						player.s[name][p] = round(player.s[name][p] / 4.0);
					}
				}
			}
			player.s[name].ms -= ms;
		}
	}
}

function reset_player(player, soft) {
	if (!player.p.hardcore) {
		player.p = { hardcore: true, dt: {} };
		player.max_stats = { monsters: {} };
	}
	player.xp = 0;
	if (soft) {
		// player.level=max(1,player.level-20);
	} else {
		player.level = 1;
		player.xp = 0;
		player.s = {};
		player.slots = {};
		player.items = [{ name: "computer" }, { name: "tracker" }];
		player.gold = 0;
		if (P[player.real_id] && gameplay != "test") {
			for (var p in P[player.real_id]) {
				player[p] = P[player.real_id][p];
			}
			P[player.real_id] = null;
		}
	}
}

function save_player(player) {
	P[player.real_id] = {
		level: player.level,
		xp: player.xp,
		slots: player.slots,
		items: player.items,
		gold: player.gold,
		x: player.x,
		y: player.y,
		map: player.map,
		in: player.in,
		rip: player.rip,
		kills: player.kills,
		p: player.p,
		name: player.name,
		auth_id: player.auth_id,
	};
}

function secondhands_logic(item, quantity) {
	var new_item = cache_item(item);
	var done = false;
	var count = 0;
	var replace = null;
	if (
		!(
			!G.items[item.name].buy ||
			(G.items[item.name].upgrade && item.level >= 7) ||
			(G.items[item.name].compound && item.level >= 2)
		) ||
		G.items[item.name].cash ||
		item.expires ||
		item.acl
	) {
		return;
	}
	if (item.grace !== undefined) {
		new_item.grace = item.grace;
	}
	if (new_item.q !== undefined) {
		new_item.q = quantity;
	}
	delete new_item.v;
	new_item.rid = randomStr(5);
	for (var i = 0; i < S.sold.length; i++) {
		if (done) {
			return;
		}
		if (can_stack(S.sold[i], new_item)) {
			done = true;
			S.sold[i].q = S.sold[i].q + new_item.q;
			csold[i] = cache_item(S.sold[i], true);
		}
		if (S.sold[i].name == new_item.name && S.sold[i].level == new_item.level) {
			if (!S.sold[i].p) {
				replace = i;
			}
			count += 1;
		}
	}
	if (!done && (count < 5 || (new_item.p && replace !== null))) {
		var current = S.sold.length % 400;
		if (count >= 5) {
			current = replace;
		}
		S.sold[current] = new_item;
		csold[current] = cache_item(S.sold[current], true);
	}
}

function lostandfound_logic(item) {
	var done = false;
	var count = 0;
	var replace = null;
	item.rid = randomStr(5);
	for (var i = 0; i < S.found.length; i++) {
		if (done) {
			return;
		}
		if (can_stack(S.found[i], item)) {
			done = true;
			S.found[i].q = S.found[i].q + item.q;
			cfound[i] = cache_item(S.found[i], true);
		}
		if (S.found[i].name == item.name && S.found[i].level == item.level) {
			if (!S.found[i].p) {
				replace = i;
			}
			count += 1;
		}
	}
	if (!done && (count < 5 || (item.p && replace !== null))) {
		var current = S.found.length % 400;
		if (count >= 5) {
			current = replace;
		}
		S.found[current] = item;
		cfound[current] = cache_item(S.found[current], true);
	}
}

function server_loot(type) {
	if (type == "all") {
		for (var mtype in D.drops.monsters) {
			for (var j = 0; j < D.drops.monsters[mtype].length; j++) {
				if (D.drops.monsters[mtype][j][0] > 0.1) {
					D.drops.monsters[mtype][j][0] = 0.05;
				}
			}
		}
		for (var id in instances) {
			if (instances[id].map != instances[id].name) {
				continue;
			}
			for (var mid in instances[id].monsters) {
				if (instances[id].monsters[mid].frequency < 4 && instances.main) {
					drop_something(instances.main.players[NPC_prefix + "Kane"], instances[id].monsters[mid]);
				}
			}
		}
	}
	for (var id in chests) {
		var chest = chests[id];
		if (type != "all" && hsince(chests[id].date) < 48) {
			return;
		}
		delete chests[id];
		S.gold += chest.gold;
		if (chest.cash) {
			S.cash += chest.cash;
		}
		if (chest.items) {
			chest.items.forEach(function (item) {
				lostandfound_logic(item);
			});
		}
		if (chest.pvp_items) {
			chest.pvp_items.forEach(function (item) {
				lostandfound_logic(item);
			});
		}
	}
}

function server_tax(gold, preview) {
	var tax = 0;
	if (1) {
		tax = parseInt(gold * 0.1);
	} else if (S.gold < 500000000) {
		tax = parseInt(gold * 0.25);
	} else if (S.gold < 1000000000) {
		tax = parseInt(gold * 0.5);
	}
	if (!preview) {
		S.gold += tax;
	}
	return gold - tax;
}

function merchant_xp_logic(player, seller, price, tax) {
	if (is_same(player, seller)) {
		return;
	}
	if (!player.p.xpcache || Object.keys(player.p.xpcache).length > 120 || hsince(player.p.dt.last_xpcache) > 5 * 24) {
		player.p.xpcache = {};
		player.p.dt.last_xpcache = new Date();
	}
	if (!player.p.xpcache[seller.name]) {
		player.p.xpcache[seller.name] = 0;
	}
	var initial = player.p.xpcache[seller.name];
	player.p.xpcache[seller.name] = min(120000000, player.p.xpcache[seller.name] + round(price / 4));
	player.xp += player.p.xpcache[seller.name] - initial;
}

function merchant_xp_logic(player, seller, price, tax) {
	if (is_same(player, seller)) {
		return;
	}
	player.xp += tax * 3.2;
}

function normalise(data) {
	// normalise(data,["gold","gold"],["num","inv"])
	for (var i = 1; i < arguments.length; i++) {
		var def = arguments[i];
		var name = def[0];
		var type = def[1];
		var value = data[name];
		if (type == "gold") {
			value = max(0, min(parseInt(value) || 0, 99999999999));
		}
		data[name] = value;
	}
}

var cloudflare_ips = [
	// https://www.cloudflare.com/ips/
	"103.21.244.0/22",
	"103.22.200.0/22",
	"103.31.4.0/22",
	"104.16.0.0/12",
	"108.162.192.0/18",
	"131.0.72.0/22",
	"141.101.64.0/18",
	"162.158.0.0/15",
	"172.64.0.0/13",
	"173.245.48.0/20",
	"188.114.96.0/20",
	"190.93.240.0/20",
	"197.234.240.0/22",
	"198.41.128.0/17",
	"2400:cb00::/32",
	"2405:b500::/32",
	"2606:4700::/32",
	"2803:f800::/32",
	"2c0f:f248::/32",
	"2a06:98c0::/29",
];

function get_ip_raw(player) {
	if (!player.socket) {
		player = { socket: player };
	} // so get_ip(socket) works too [06/09/18]
	// return player.socket.handshake.address;
	// BEWARE: player.socket.request.connection.remoteAddress
	try {
		if (player.last_ip) {
			return player.last_ip;
		}
		if (player.first_ip) {
			return player.first_ip;
		}
		if (player.socket.request["headers"]["cf-connecting-ip"]) {
			if (range_check.inRange(range_check.displayIP(player.socket.handshake.address), cloudflare_ips)) {
				player.first_ip = player.socket.request["headers"]["cf-connecting-ip"];
				return player.first_ip;
			} else {
				player.ipx = -1;
			}
		}
	} catch (e) {}
	try {
		return player.socket.request.connection.remoteAddress || player.socket.handshake.address;
	} catch (e) {}
	try {
		return player.socket.handshake.address;
	} catch (e) {}
}

function get_ip(player) {
	var ip = get_ip_raw(player) || "";
	return ip.replace("::ffff:", "");
}

function quick_hash(str) {
	var hash = 0;
	if (str.length == 0) {
		return hash;
	}
	for (var i = 0; i < str.length; i++) {
		var char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash;
}

function verify_steam_ticket(player, ticket) {
	// Thanks: https://github.com/DoctorMcKay/node-steam-user
	try {
		var outer = EncryptedAppTicket.decode(new Buffer(ticket, "hex"));
		var decrypted = symmetricDecrypt(outer.encryptedTicket, new Buffer(variables.steam_key, "hex"));
		let userData = decrypted.slice(0, outer.cbEncrypteduserdata);
		let ownershipTicketLength = decrypted.readUInt32LE(outer.cbEncrypteduserdata);
		let ownershipTicket = parseAppTicket(
			decrypted.slice(outer.cbEncrypteduserdata, outer.cbEncrypteduserdata + ownershipTicketLength),
		);
		if (ownershipTicket) {
			ownershipTicket.userData = userData.toString();
		}
		if (ownershipTicket.appID == 777150 && ownershipTicket.steamID) {
			player.auth_type = "steam";
			player.auth_id = ownershipTicket.steamID;
			player.p.steam_id = ownershipTicket.steamID;
			delete player.s.authfail;
		}
	} catch (e) {
		console.log("#A verify_steam_ticket: " + e);
	}
}

function verify_mas_receipt(player, receipt) {
	if (player.p.mas_hash == quick_hash(receipt) && player.p.dt.mas_expire > new Date()) {
		player.auth_type = "mas";
		player.auth_id = player.p.mas_auth_id;
		delete player.s.authfail;
	} else {
		console.log("verify_mas_receipt for " + player.name);
		player.temp_auth = "mas";
		//player.mas_receipt=receipt;
		var content = { "receipt-data": receipt, password: variables.apple_token };
		var url = "https://buy.itunes.apple.com/verifyReceipt";
		request(
			{
				url: url,
				method: "POST",
				json: content,
			},
			function (err, response, body) {
				if (err) {
					console.log("#M: mas error: " + player.name + " - " + err);
				}
				if (body && body.status == 0 && body.receipt.download_id && body.receipt.original_purchase_date_ms) {
					delete player.temp_auth;
					player.auth_type = "mas";
					player.auth_id = ("" + body.receipt.download_id).substr(0, 4) + body.receipt.original_purchase_date_ms;
					player.p.mas_auth_id = player.auth_id;
					player.p.mas_hash = quick_hash(receipt);
					player.p.dt.mas_expire = future_s(3 * 24 * 60 * 60);
					delete player.s.authfail;
				} else {
					delete player.temp_auth;
					console.log("#M: mas declined: " + player.name + " " + (body && body.status));
				}
			},
		);
	}
}

function verify_steam_ownership(player) {
	var url = "https://partner.steam-api.com/ISteamUser/CheckAppOwnership/v2/";
	data = {
		key: variables.steam_partner_key,
		steamid: player.p.steam_id,
		appid: "777150",
	};
	request.get({ url: url, qs: data }, function (err, response, body) {
		console.log(body);
	});
}

function initiate_steam_microtxn(player) {
	var url = "https://partner.steam-api.com/ISteamMicroTxn/InitTxn/v3/";
	var orderid = parseInt(Math.random() * 1000000000 + 1);
	console.log(orderid);
	data = {
		key: variables.steam_partner_key,
		steamid: player.p.steam_id,
		appid: "777150",
		usersession: "web",
		ipaddress: "85.98.170.74",
		orderid: orderid,
		itemcount: 1,
		language: "en",
		currency: "USD",
		"itemid[0]": "123",
		"qty[0]": 1,
		"amount[0]": 999, // $9.99
		"description[0]": "1000 Shells",
	};
	request.post({ url: url, form: data }, function (err, response, body) {
		console.log(body);
	});
}

function invincible_logic(player, place) {
	if (is_pvp || G.maps[player.map].pvp) {
		player.s.invincible = { ms: max(6000, (player.s.invincible && player.s.invincible.ms) || 0) };
	}
}

function serverhop_logic(player) {
	delete player.s.hopsickness;
	player.p.entries = player.p.entries || [];
	var servers = {};
	var main = null;
	var mx = 0;
	var hops = 0;
	for (var i = player.p.entries.length - 2; i >= 0; i--) {
		var hours = Math.abs(new Date(player.p.entries[i + 1][1]) - new Date(player.p.entries[i][1])) / 36e5;
		servers[player.p.entries[i][0]] = (servers[player.p.entries[i][0]] || 0) + hours;
	}
	for (var id in servers) {
		if (servers[id] > mx) {
			main = id;
			mx = servers[id];
		}
	}
	for (var i = player.p.entries.length - 1; i >= 0; i--) {
		if (hsince(new Date(player.p.entries[i][1])) < 4 && player.p.entries[i][0] != main) {
			hops++;
		}
	}
	if (main && hops && main != region + server_name && player.level >= 60) {
		player.s.hopsickness = { ms: min(10000 * hops * hops, 3 * 60 * 60 * 1000) };
		if (hops > 20) {
			player.s.hopsickness.luck = -80;
			player.s.hopsickness.gold = -80;
			player.s.hopsickness.output = -50;
		} else if (hops > 15) {
			player.s.hopsickness.luck = -60;
			player.s.hopsickness.gold = -60;
			player.s.hopsickness.output = -40;
		} else if (hops > 10) {
			player.s.hopsickness.luck = -40;
			player.s.hopsickness.gold = -40;
			player.s.hopsickness.output = -30;
		} else if (hops > 5) {
			player.s.hopsickness.luck = -30;
			player.s.hopsickness.gold = -30;
			player.s.hopsickness.output = -20;
		} else if (hops > 2) {
			player.s.hopsickness.luck = -20;
			player.s.hopsickness.gold = -20;
			player.s.hopsickness.output = -10;
		}
		calculate_player_stats(player);
	}
	var c = [region + server_name, "" + new Date()];
	player.p.entries.push(c);
	if (player.p.entries.length > 60) {
		player.p.entries.shift();
	}
}

function serverhop_logic(player) {
	if (player.p.entries && player.p.entries[0] && player.p.entries[0][0] == region + server_name) {
		return;
	}
	delete player.s.hopsickness;
	if (!player.p.home) {
		player.p.home = region + server_name;
	}
	player.p.entries = [[region + server_name, "" + new Date()]];
	if (player.p.home != region + server_name && player.level >= 60 && server_name != "PVP") {
		add_condition(player, "hopsickness");
	}
}

function ghash(entity, zone, a_d, b_d) {
	//zone is the square's dimension, a_d, and b_d are displacements
	var a = floor((1.0 * entity.x) / zone) + (a_d || 0);
	var b = floor((1.0 * entity.y) / zone) + (b_d || 0);
	return a + "|" + b;
}

function set_ghash(hash, entity, zone) {
	var h = ghash(entity, zone);
	if (!hash[h]) {
		hash[h] = {};
	}
	hash[h][entity.id] = entity;
}

function get_nearby_ghash(hash, entity, zone) {
	var d = [-1, 0, 1];
	var l = [];
	var h;
	for (var i = 0; i < 3; i++) {
		for (var j = 0; j < 3; j++) {
			h = ghash(entity, zone, d[i], d[j]);
			for (var id in hash[h]) {
				l.push(hash[h][id]);
			}
		}
	}
	return l;
}

function screenshot_npc(player, args) {
	if (!args) {
		args = {};
	}
	if (!args.name) {
		args.name = randomStr(10);
	}
	instance = instances[player.in];
	var npc = create_npc(
		{
			name: args.name,
			level: args.level || 40,
			speed: 1200,
			hp: 100000000,
			skin: args.skin || "mranger",
			cx: args.cx || [],
		},
		{ position: [player.x, player.y], id: args.name },
		instance,
	);
	if (args.stand) {
		npc.p.stand = args.stand;
	}
	npc.screenshot = true;
	npc.direction = player.direction;
	npc.id = args.name;
	instance.players[NPC_prefix + npc.id] = npc;
}

function get_npc_coords(id) {
	for (var iid in instances) {
		if (G.maps[iid] && G.maps[iid].ref && G.maps[iid].ref[id]) {
			return G.maps[iid].ref[id];
		}
	}
	return { x: 0, y: 0, map: "main", in: "main" };
}

function pmap_remove(player) {
	try {
		delete instances[player.in].pmap[player.last_hash][player.id];
		if (!Object.keys(instances[player.in].pmap[player.last_hash]).length) {
			delete instances[player.in].pmap[player.last_hash];
		}
	} catch (e) {}
}

function pmap_get(player) {
	var hash = ghash(player, 6);
	if (!instances[player.in].pmap[hash]) {
		return {};
	}
	return instances[player.in].pmap[hash];
}

function pmap_add(player) {
	var hash = ghash(player, 6);
	if (!instances[player.in].pmap[hash]) {
		instances[player.in].pmap[hash] = {};
	}
	instances[player.in].pmap[hash][player.id] = player;
	player.last_hash = hash;
}

function pmap_move(player) {
	var hash = ghash(player, 6);
	if (player.last_hash == hash) {
		return;
	}
	pmap_remove(player);
	pmap_add(player);
}

function init_tavern() {
	if (!instances.tavern) {
		return;
	}
	tavern = instances.tavern;
	tavern.roulette = {
		state: "bets",
		next: future_s(25),
		odds: {
			red: 2,
			black: 2,
			odd: 2,
			even: 2,
			"1/3": 3,
			"2/3": 3,
			"3/3": 3,
			"1/2": 2,
			"2/2": 2,
			"3n": 3,
			"3n+1": 3,
			"3n+2": 3,
		},
		gain: 0,
		players: {},
	};
	for (var i = 0; i <= 36; i++) {
		tavern.roulette.odds["" + i] = 36;
	}
	tavern.poker = {
		rooms: [],
		gain: 0,
	};
	tavern.dice = {
		rolls: [],
		state: "lock",
		seconds: 0,
		next: future_s(1),
		players: {},
		bets: [],
	};
	tavern.dice.num =
		"" +
		parseInt(Math.random() * 10) +
		"" +
		parseInt(Math.random() * 10) +
		"." +
		parseInt(Math.random() * 10) +
		"" +
		parseInt(Math.random() * 10);
	tavern.info.dice = "lock";
	tavern.info.num = tavern.dice.num;
	tavern.info.seconds = tavern.dice.seconds;
}

function house_debt() {
	var gold = 0;
	for (var id in tavern.dice.players) {
		var player = players[id];
		if (!player) {
			continue;
		}
		for (var b_id in player.bets || {}) {
			var bet = player.bets[b_id];
			if (bet.type != "dice") {
				continue;
			}
			gold += bet.win - bet.edge - bet.gold;
		}
	}
	return gold;
}

function house_edge() {
	var gold = S.gold - house_debt();
	if (gold > 5000000000) {
		return 0.5;
	}
	if (gold > 2000000000) {
		return 1;
	}
	if (gold > 1000000000) {
		return 1.5;
	}
	return 2;
}

var dice_last_roll = 0;
function tavern_loop() {
	try {
		if (!server.live || !instances.tavern) {
			return;
		}
		var c = new Date();
		if (c > tavern.dice.next) {
			if (tavern.dice.state == "bets") {
				tavern.dice.seconds += 1;
				tavern.info.seconds = tavern.dice.seconds;
				if (tavern.dice.seconds >= 30) {
					tavern.info.dice = tavern.dice.state = "roll";
					dice_last_roll = tavern.info.num;
					delete tavern.info.num;
					tavern.dice.next = future_s(10);
					instance_emit(tavern, "dice", { state: "roll" });
					//server_log("Dice: Bets Over");
				}
			} else if (tavern.dice.state == "roll") {
				tavern.info.dice = tavern.dice.state = "lock";
				tavern.info.num = tavern.dice.num;
				tavern.dice.next = future_s(1.6);
				for (var id in tavern.dice.players) {
					var player = players[id];
					if (!player) {
						continue;
					}
					for (var b_id in player.bets || {}) {
						var bet = player.bets[b_id];
						if (bet.type != "dice") {
							continue;
						}
						delete players[bet.pid].bets[bet.id];
						tavern.dice.bets.push(bet);
						if (
							(bet.dir == "up" && parseFloat(tavern.dice.num) >= bet.num) ||
							(bet.dir == "down" && parseFloat(tavern.dice.num) <= bet.num)
						) {
							if (player.type == "merchant") {
								player.xp += parseInt(bet.edge * 7.2);
							}
							player.gold += bet.win - bet.edge;
							S.gold -= bet.win - bet.edge - bet.gold;
							if (bet.win - bet.edge - bet.gold >= 12000000) {
								lstack(S.logs.dice, { name: player.name, gold: bet.win - bet.edge - bet.gold, odds: bet.odds });
							}
						} else {
							if (bet.gold >= 10000000) {
								lstack(S.logs.dice, { name: player.name, gold: -bet.gold, odds: bet.odds });
							}
							S.gold += bet.gold;
						}
					}
				}
				instance_emit(tavern, "dice", {
					state: "lock",
					num: tavern.dice.num,
					text: tavern.dice.text,
					key: tavern.dice.key,
				});
				//server_log("Dice: Roll Over - Locking");
			} else if (tavern.dice.state == "lock") {
				tavern.dice.state = "suspense";
				tavern.dice.bets.forEach(function (bet) {
					var player = players[bet.pid];
					if (!player) {
						return;
					}
					if (
						(bet.dir == "up" && parseFloat(tavern.dice.num) >= bet.num) ||
						(bet.dir == "down" && parseFloat(tavern.dice.num) <= bet.num)
					) {
						player.socket.emit("game_log", {
							message: "Won: " + to_pretty_num(bet.win) + " gold [" + tavern.dice.num + "]",
							color: "gold",
						});
						player.socket.emit("game_log", {
							message: "House edge: " + to_pretty_num(bet.edge) + " gold",
							color: "gray",
						});
						instance_emit(tavern, "tavern", {
							event: "won",
							name: player.name,
							type: "dice",
							num: bet.num,
							gold: bet.win,
							dir: bet.dir,
							net: bet.win - bet.gold - bet.edge,
						});
					} else {
						player.socket.emit("game_log", {
							message: "Lost: " + to_pretty_num(bet.gold) + " gold [" + tavern.dice.num + "]",
							color: "gray",
						});
						instance_emit(tavern, "tavern", {
							event: "lost",
							name: player.name,
							type: "dice",
							num: bet.num,
							gold: bet.gold,
							dir: bet.dir,
						});
					}
					if (player.xp >= player.max_xp) {
						resend(player, "reopen");
					} else {
						resend(player, "reopen+nc");
					}
				});
				tavern.dice.next = future_s(2);
				//server_log("Dice: Locked - Suspensing");
			} else if (tavern.dice.state == "suspense") {
				var timer = new Date();
				tavern.info.dice = tavern.dice.state = "bets";
				tavern.info.seconds = tavern.dice.seconds = 0;
				tavern.dice.players = {};
				tavern.dice.bets = [];
				tavern.dice.num =
					"" +
					parseInt(Math.random() * 10) +
					"" +
					parseInt(Math.random() * 10) +
					"." +
					parseInt(Math.random() * 10) +
					"" +
					parseInt(Math.random() * 10);
				tavern.dice.key = randomStr(20 + parseInt(Math.random() * 20));
				var initials = "";
				for (var id in tavern.players) {
					if (!tavern.players[id].npc) {
						initials += tavern.players[id].name[0];
					}
				}
				tavern.dice.text =
					"Num: " +
					tavern.dice.num +
					" Initials: " +
					initials +
					" Random: " +
					randomStr(16 + parseInt(Math.random() * 16));
				var hmac = crypto.createHmac("sha256", tavern.dice.key);
				hmac.update(tavern.dice.text);
				tavern.dice.hex = hmac.digest("hex");
				hmac.end();
				instance_emit(tavern, "dice", { state: "bets", hex: tavern.dice.hex, algorithm: "hmac-sha256" });
				if (gameplay == "hardcore" && Math.random() < 0.07 && dice_last_roll) {
					tavern.dice.num = dice_last_roll;
				}
				//server_log("Dice: Bets Starting For: "+tavern.dice.num+" in "+mssince(timer)+"ms");
			}
		}
		if (c > tavern.roulette.next && 0) {
			if (tavern.roulette.state == "bets") {
				server_log("Roulette: Bets Over");
				tavern.roulette.state = "roll";
				tavern.roulette.next = future_s(10);
			} else if (tavern.roulette.state == "roll") {
				tavern.roulette.roll = floor(Math.random() * 37);
				tavern.roulette.state = "award";
				tavern.roulette.next = future_s(5);
				server_log("Roulette: Rolled " + tavern.roulette.roll);
			} else if (tavern.roulette.state == "award") {
				var winners = {};
				var roll = tavern.roulette.roll;
				if (roll == 0) {
					winners["0"] = 1;
				} else {
					if (roll % 2) {
						winners["odd"] = 1;
					} else {
						winners["even"] = 1;
					}

					if ([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].indexOf(roll) != -1) {
						winners["black"] = 1;
					} else {
						winners["red"] = 1;
					}

					if (roll <= 12) {
						winners["1/3"] = 1;
					} else if (roll <= 24) {
						winners["2/3"] = 1;
					} else {
						winners["3/3"] = 1;
					}

					if (roll <= 18) {
						winners["1/2"] = 1;
					} else {
						winners["2/2"] = 1;
					}

					if (roll % 3 == 1) {
						winners["3n+1"] = 1;
					} else if (roll % 3 == 2) {
						winners["3n+2"] = 1;
					} else {
						winners["3n"] = 1;
					}
				}
				var totals = {};
				try {
					for (var id in tavern.roulette.players) {
						var player = players[id];
						if (!player) {
							continue;
						}
						for (var b_id in player.bets || {}) {
							var bet = player.bets[b_id];
							if (bet.type != "roulette") {
								continue;
							}
							if (!totals[bet.pid]) {
								totals[bet.pid] = 0;
							}
							if (winners[bet.odd]) {
								totals[bet.pid] += bet.gold * tavern.roulette.odds[bet.odd];
								tavern.roulette.gain -= bet.gold * tavern.roulette.odds[bet.odd];
							} else {
								tavern.roulette.gain += bet.gold;
							}
							// else totals[bet.pid]-=bet.gold;
							if (players[bet.pid]) {
								delete players[bet.pid].bets[bet.id];
								if (winners[bet.odd]) {
									players[bet.pid].gold += bet.gold * tavern.roulette.odds[bet.odd];
								}
							}
						}
					}
				} catch (e) {
					log_trace("Critical-roulette_win", e);
				}
				server_log("Roulette: Awards | Gain: " + to_pretty_num(tavern.roulette.gain));
				for (var id in totals) {
					var player = players[id];
					if (!player) {
						continue;
					}
					if (winners["0"]) {
						player.socket.emit("game_log", { message: "The lucky number is " + roll + " Green", color: "#2E7C2A" });
					} else if (winners["red"]) {
						player.socket.emit("game_log", { message: "The lucky number is " + roll + " Red", color: "#911609" });
					} else {
						player.socket.emit("game_log", { message: "The lucky number is " + roll + " Black", color: "#5C5D5D" });
					}
					if (!totals[id]) {
						player.socket.emit("game_log", "Better luck next time");
					} else {
						player.socket.emit("game_log", {
							message: "You've won " + to_pretty_num(totals[id]) + " gold",
							color: "gold",
						});
					}
					resend(player, "reopen+nc");
				}
				tavern.roulette.state = "bets";
				tavern.roulette.next = future_s(25);
				server_log("Roulette: Bets Open");
			}
		}
		tavern.poker.rooms.forEach(function (room) {
			if (room.state == "shuffle") {
				room.cards = [];
				for (var i = 1; i <= 52; i++) {
					room.cards.push(i);
				}
				shuffle(room.cards);
			}
		});
	} catch (e) {
		log_trace("Critical-tavern_loop", e);
	}
}

function create_npc(npc, map_def, instance) {
	var entity = {
		speed: npc.speed || 20,
		attack: npc.attack || 100,
		range: npc.range || 40,
		level: npc.level || 100,
		hp: npc.hp || 1200,
		max_hp: npc.hp || 1200,
		armor: 500,
		mp: 2000,
		a: {},
		xp: 0,
		pdps: 0, // once got killed by a blaster ... [07/04/21]
		skin: npc.skin,
		name: npc.name,
		red_zone: 0,
		in: instance.name,
		map: instance.map,
		def: npc,
		npc: map_def.id,
		ntype: map_def.id,
		is_player: true,
		is_npc: true,
		type: npc["class"] || "merchant",
		id: "$" + npc.name,
		gold: 0,
		items: [],
		citems: [],
		cid: 0,
		u: true,
		citizen: true,
		luckm: 1, // for loot_all_monsters
		s: {},
		c: {},
		q: {},
		p: {},
		m: 0,
		slots: {},
		bets: {},
		vision: [0, 0],
		socket: false_socket,
		cx: npc.cx || {},
		base: { h: 8, v: 7, vn: 2 },
		last: { move: new Date(), attack: really_old, attacked: really_old },
		delay: npc.delay || 600,
		d_multiplier: 1,
		steps: npc.steps || 40,
	};

	if (npc.slots) {
		entity.slots = npc.slots;
	}
	if (npc.projectile) {
		entity.projectile = npc.projectile;
	}

	if (map_def.positions) {
		entity.x = map_def.positions[0][0];
		entity.y = map_def.positions[0][1];
		entity.positions = map_def.positions;
	} else {
		entity.x = map_def.position[0];
		entity.y = map_def.position[1];
		if (npc.type == "fullstatic" && map_def.position.length == 3) {
			entity.direction = map_def.position[2];
		}
	}

	if (map_def.boundary) {
		entity.boundary = map_def.boundary;
	}
	if (map_def.loop) {
		entity.going_x = entity.x;
		entity.going_y = entity.y;
		start_moving_element(entity);
		entity.loop = true;
		entity.last_m = 0;
	}

	if (npc.role == "citizen" || npc.moving) {
		entity.movable = true;
	}
	return entity;
}

function create_instance(name, map_name, args) {
	if (!map_name) {
		map_name = name;
	}
	if (!smap_data[map_name] && smap_data[map_name] != -1) {
		server_bfs(map_name);
	}
	if (!args) {
		args = {};
	}
	var instance = {
		players: {},
		monsters: {},
		observers: {},
		map: map_name,
		allow: true,
		name: name,
		pmap: {},
		rage_list: [],
		last_update: future_ms(parseInt(Math.random() * 30)),
		last_player: future_s(240),
		npcs: 0,
		paused: false,
		info: {},
		operators: 1,
	};
	instances[name] = instance;
	if (args.solo) {
		instance.solo = args.solo;
	}
	if (args.pvp) {
		instance.pvp = true;
		instance.allow = false;
	}
	if (args.event) {
		instance.allow = false;
	}
	var map = G.maps[map_name];
	if (map.mount && gameplay == "normal") {
		instance.mount = true;
	}
	for (var i = 0; i < (map.monsters || []).length; i++) {
		var map_def = map.monsters[i];
		if (map_def.special) {
			continue;
		}
		if (map_def.rage) {
			map_def.id = randomStr(5);
			instance.rage_list.push(map_def);
		}
		for (var j = 0; j < map_def.count; j++) {
			if (G.monsters[map_def.type].announce) {
				setTimeout(new_monster_f(name, map_def), 120 * 1000);
			} else {
				new_monster(name, map_def);
			}
		}
	}
	// for(var i=0;i<(map.specials||[]).length;i++)
	// {
	// 	var map_def=map.specials[i];
	// 	new_monster(name,map_def,1);
	// }
	// console.log(JSON.stringify(instance.players));
	for (var i = 0; i < (map.npcs || []).length; i++) {
		var map_def = map.npcs[i];
		var def = G.npcs[map_def.id];
		if (instance.players[NPC_prefix + def.name]) {
			console.log("NPC NAME CLASH: " + def.name);
			shutdown_routine();
		}
		var npc = (instance.players[NPC_prefix + def.name] = create_npc(def, map_def, instance));
		npcs[map_def.id] = npc;
		instance.npcs += 1;
	}
	map.spawns.forEach(function (spawn) {
		var cdist = closest_line(map_name, spawn[0], spawn[1]);
		if (cdist < 12) {
			console.log(
				"Spawn [" + map_name + "," + spawn[0] + "," + spawn[1] + "] is " + cdist + " close to a line! >=12 is a must.",
			);
		}
	});
	server_log("Created an instance of " + instances[name].map, 1);
	return instance;
}

function pause_instance(instance) {
	server_log("Paused: " + instance.name);
	instance.paused = true;
}

function resume_instance(instance) {
	if (!instance.paused) {
		return;
	}
	// server_log("Resumed: "+instance.name);
	instance.paused = false;
	update_instance(instance);
}

function destroy_instance(name) {
	for (var id in instances[name].players) {
		var player = instances[name].players[id];
		if (player.npc) {
			continue;
		}
		if (
			player.state &&
			!player.state.restored &&
			instances[player.state.map] &&
			!instances[player.state.map].mount &&
			player.in != name
		) {
			transport_player_to(player, player.state.map, [player.state.x, player.state.y]);
		} else {
			transport_player_to(player, "main");
		}
		restore_state(player);
		resend(player, "cid+reopen"); // reopen for abtesting
	}
	for (var id in instances[name].monsters) {
		remove_monster(instances[name].monsters[id], { silent: true }); // to make sure targets are always updated
	}
	server_log("Deleted an instance of " + instances[name].map, 1);
	delete instances[name];
}

function spawn_special_monster(type) {
	if (type == "pinkgoo") {
		var packs = [];
		["main", "cave", "halloween", "winterland"].forEach(function (m) {
			G.maps[m].monsters.forEach(function (p) {
				if (!p.boundaries) {
					packs.push({ type: "pinkgoo", boundary: p.boundary, count: 1, i: m });
				} // comment boundary out next year [09/02/19]
			});
		});
		var pack = packs[floor(Math.random() * packs.length)];
		pack.gold = D.monster_gold.pinkgoo;
		server_log("Love Goo: " + JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", { name: "pinkgoo", map: pack.i });
	}
	if (type == "crabxx") {
		var pack = null;
		["main"].forEach(function (m) {
			G.maps[m].monsters.forEach(function (p) {
				if (p.type == "crabx") {
					pack = { type: "crabxx", boundary: p.boundary, count: 1, i: m };
				}
			});
		});
		pack.gold = D.monster_gold.crabxx;
		server_log("Crab XX: " + JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", { name: "crabxx", map: pack.i });
	}
	if (type == "snowman") {
		var packs = [];
		["winterland"].forEach(function (m) {
			G.maps[m].monsters.forEach(function (p) {
				if (!p.boundaries) {
					packs.push({ type: "snowman", boundary: p.boundary, count: 1, i: m });
				}
			});
		});
		var pack = packs[floor(Math.random() * packs.length)];
		pack.gold = D.monster_gold.snowman;
		pack = { type: "snowman", boundary: [682, -967, 1482, -779], count: 1, i: "winterland" };
		server_log("Snowman: " + JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", { name: "snowman", map: pack.i, x: 900, y: -800 });
	}
	if (type == "dragold") {
		var packs = [];
		var pack = packs[floor(Math.random() * packs.length)];
		pack = { type: "dragold", boundary: [1018, -940, 1385, -624], count: 1, i: "cave" };
		pack.gold = 100000;
		server_log("Dragold: " + JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", { name: "dragold", map: pack.i, x: 900, y: -800 });
	}
	if (type == "franky") {
		var map = "level2w";
		var pack = { type: "franky", boundary: G.maps[map].monsters[0].boundary, count: 1, i: map };
		pack.gold = D.monster_gold.franky;
		server_log("Franky: " + JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", {
			name: "franky",
			map: pack.i,
			x: G.maps[map].monsters[0].boundary[0],
			y: G.maps[map].monsters[0].boundary[1],
		});
	}
	if (type == "icegolem") {
		var map = "winterland";
		var pack = { type: "icegolem", boundary: [782.25, 395.96, 888.71, 450.28], count: 1, i: map, roam: true };
		pack.gold = D.monster_gold.icegolem;
		server_log("Ice Golem: " + JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", { name: "icegolem", map: pack.i, x: pack.boundary[0], y: pack.boundary[1] });
	}
	if (type == "mrpumpkin" || type == "mrgreen" || type == "grinch") {
		var pack = {};
		var map = "none";
		for (var mname in G.maps) {
			var def = G.maps[mname];
			if (def.ignore) {
				continue;
			}
			(def.monsters || []).forEach(function (p) {
				if (p.type == type) {
					pack = p;
					map = mname;
				}
			});
		}
		server_log(G.monsters[type].name + ": " + JSON.stringify(pack));
		var monster = new_monster(map, pack);
		broadcast("game_event", { name: type, map: map, x: pack.boundary[0], y: pack.boundary[1] });
		if (type == "grinch") {
			monster.extra_gold = 12000000;
		}
	}
	if (type == "slenderman") {
		var packs = [];
		var m = random_one(["cave", "halloween", "spookytown"]);
		var p = random_place(m);
		var pack = { type: "slenderman", boundary: [p.x, p.y, p.x, p.y], count: 1, i: m };
		pack.gold = D.monster_gold.slenderman;
		//server_log("Love Goo: "+JSON.stringify(pack));
		var monster = new_monster(pack.i, pack);
		broadcast("game_event", { name: "slenderman", map: pack.i });
	}
	if (type == "tiger") {
		var packs = [];
		var m = random_one(["cave", "main"]);
		var p = random_place(m);
		var pack = { type: "tiger", boundary: [p.x, p.y, p.x, p.y], count: 1, i: m };
		pack.gold = D.monster_gold.tiger;
		//server_log("Love Goo: "+JSON.stringify(pack));
		var monster = new_monster(pack.i, pack);
		broadcast("game_event", { name: "tiger", map: pack.i });
	}
	if (type == "wabbit") {
		var packs = [];
		["main", "cave", "halloween", "winterland", "tunnel", "mansion", "winter_cave"].forEach(function (m) {
			G.maps[m].monsters.forEach(function (p) {
				if (!p.boundaries) {
					packs.push({ type: "wabbit", boundary: p.boundary, count: 1, i: m, roam: true });
				}
			});
		});
		var pack = packs[floor(Math.random() * packs.length)];
		pack.gold = D.monster_gold.wabbit;
		//server_log("Love Goo: "+JSON.stringify(pack));
		new_monster(pack.i, pack);
		broadcast("game_event", { name: "wabbit", map: pack.i });
	}
	if (type == "goldenbat") {
		var packs = [];
		["cave"].forEach(function (m) {
			G.maps[m].monsters.forEach(function (p) {
				if (!p.boundaries) {
					packs.push({ type: "goldenbat", boundary: p.boundary, count: 1, i: m, roam: true });
				}
			});
		});
		var pack = packs[floor(Math.random() * packs.length)];
		pack.gold = D.monster_gold.goldenbat;
		//server_log("Love Goo: "+JSON.stringify(pack));
		new_monster(pack.i, pack);
		// broadcast("game_event",{name:"goldenbat",map:pack.i});
	}
	if (type == "cutebee") {
		var packs = [];
		["main"].forEach(function (m) {
			G.maps[m].monsters.forEach(function (p) {
				if (!p.boundaries) {
					packs.push({ type: "cutebee", boundary: p.boundary, count: 1, i: m, roam: true });
				}
			});
		});
		var pack = packs[floor(Math.random() * packs.length)];
		pack.gold = D.monster_gold.cutebee;
		//server_log("Love Goo: "+JSON.stringify(pack));
		new_monster(pack.i, pack);
	}
}

function collect_signups(event) {
	var names = [];
	var toggle = 0;
	for (var name in signups) {
		names.push(name);
	}
	shuffle(names);
	names.forEach(function (name) {
		var player = players[name_to_id[name]];
		if (!player) {
			return;
		}

		if (event == "abtesting") {
			player.team = (toggle == 1 && "A") || "B";
			toggle = 1 - toggle;
		}

		if (event == "abtesting" && player.team == "A") {
			transport_player_to(player, event, 2);
			resend(player, "cid");
		} else if (event == "abtesting" && player.team == "B") {
			transport_player_to(player, event, 3);
			resend(player, "cid");
		} else {
			transport_player_to(player, event);
		}
	});
}

var last_daily = null;
function event_loop() {
	try {
		var c = new Date();
		var ch = (c.getUTCHours() + 24 + E.schedule.time_offset) % 24;
		var change = false;
		if (ch >= 0 && ch <= 5) {
			E.schedule.night = true;
		} else {
			E.schedule.night = false;
		}

		E.schedule.dailies.forEach(function (h) {
			if (ch == h && last_daily != h && msince(server_start) > 2) {
				last_daily = h;
				var event = dailies.shift();
				dailies.push(event);
				events[event] = true;
			}
		});

		E.schedule.nightlies.forEach(function (h) {
			if (ch == h && last_daily != h && msince(server_start) > 2) {
				last_daily = h;
				var event = nightlies.shift();
				nightlies.push(event);
				events[event] = true;
			}
		});

		if (events.halloween) {
			var s = get_monster("slenderman");
			if (s) {
				var p = false;
				for (var id in projectiles) {
					if (projectiles[id].target == s) {
						p = true;
					}
				}
				if (!s.last_jump || msince(s.last_jump) > 2) {
					p = true;
				}
				for (var name in instances[s.in].players) {
					var player = instances[s.in].players[name];
					if (p || (!player.s.invis && distance(player, s) < 600)) {
						xy_emit(s, "disappear", { id: s.id });
						delete instances[s.in].monsters[s.id];
						s.oin = s.in = s.map = random_one(["spookytown", "halloween", "cave"]);
						instances[s.in].monsters[s.id] = s;
						var p = random_place(s.map);
						s.moving = false;
						s.abs = true;
						s.map_def.boundary = [p.x, p.y, p.x, p.y];
						s.map_def.i = s.map;
						s.x = p.x;
						s.y = p.y;
						s.u = true;
						s.cid++;
						s.last_jump = new Date();
						break;
					}
				}
			}
		}

		if (monster_c.tiger) {
			var m = get_monster("tiger");
			var ps = [];
			for (var id in players) {
				ps.push(players[id]);
			}
			var player = random_one(ps);
			var spot = null;
			var p = false;
			for (var id in projectiles) {
				if (projectiles[id].target == m && projectiles[id].attack > 999) {
					p = true;
				}
			}
			if (p || Math.random() < 0.01) {
				if (player) {
					spot = safe_xy_nearby(player.map, player.x, player.y);
				}
				if (
					m &&
					player &&
					player.in == player.map &&
					spot &&
					!G.maps[player.map].mount &&
					!player.s.hopsickness &&
					player.p.home == region + server_name
				) {
					xy_emit(m, "disappear", { id: m.id });
					delete instances[m.in].monsters[m.id];
					m.oin = m.in = m.map = player.map;
					instances[m.in].monsters[m.id] = m;
					m.moving = false;
					m.abs = true;
					m.x = spot.x;
					m.y = spot.y;
					m.map_def.boundary = [m.x, m.y, m.x, m.y];
					m.map_def.i = m.map;
					m.u = true;
					m.cid++;
					m.last_jump = new Date();
				}
			}
		}
		["crabxx", "franky", "icegolem"].forEach(function (name) {
			if (events[name]) {
				var monster = get_monster(name);
				if (!monster && monster_c[name]) {
					return;
				} // irregular move
				if (!timers[name]) {
					timers[name] = future_s(G.events[name].duration);
					spawn_special_monster(name);
				} else if (c > timers[name] && (!monster || !monster.last.attacked || ssince(monster.last.attacked) > 20)) {
					if (monster) {
						remove_monster(monster, { method: "disappear" });
					}
					broadcast("notice", { message: G.monsters[name].name + " Event is over ..." });
					events[name] = false;
					change = true;
					delete E[name];
					delete timers[name];
				} else {
					var monster = get_monster(name);
					if (!monster) {
						broadcast("notice", { message: G.monsters[name].name + " has been defeated!" });
						events[name] = false;
						change = true;
						delete E[name];
						delete timers[name];
					} else {
						if (!E[name]) {
							change = true;
						}
						E[name] = {
							live: true,
							map: monster.map,
							hp: monster.hp,
							max_hp: monster.max_hp,
							target: monster.target,
							x: monster.x,
							y: monster.y,
							end: timers[name],
						};
						if (name == "crabxx") {
							var big = get_monster("crabx");
							if (monster && big && !monster["1hp"]) {
								monster["1hp"] = true;
								monster.s = {};
								monster.cid++;
								monster.u = true;
							} else if (monster && !big && monster["1hp"]) {
								monster["1hp"] = false;
								monster.cid++;
								monster.u = true;
							}
						}
					}
				}
			}
		});

		if (events.goobrawl) {
			if (!timers.goobrawl) {
				timers.goobrawl = future_s(G.events.goobrawl.duration);
				E.goobrawl = { end: timers.goobrawl };
				change = true;
				//create_instance("goobrawl","goobrawl",{event:true});
				// collect_signups("goobrawl");
				broadcast("notice", { message: "Goo Brawl has begun!" });
			} else if (c > timers.goobrawl) {
				events.goobrawl = false;
				delete E.goobrawl;
				delete timers.goobrawl;
				change = true;
				//destroy_instance("goobrawl");
				broadcast("notice", { message: "Goo Brawl is over, hope you had fun!" });
			} else if (instances.goobrawl && Object.keys(instances.goobrawl.monsters).length < 6 && Math.random() < 0.3) {
				if (Math.random() < 0.01) {
					var data = clone(G.maps.goobrawl.monsters[0]);
					data.type = "rgoo";
					var m = new_monster("goobrawl", data);
					//m.s.filter={ms:9999999,name:"scale",scale:2};
				} else {
					var data = clone(G.maps.goobrawl.monsters[0]);
					data.type = "bgoo";
					var m = new_monster("goobrawl", data);
					m.skin = random_one(["goo0", "goo1", "goo2", "goo3", "goo4", "goo5", "goo6"]);
					// m.drops=[[0.5,"funtoken"]];
					m.u = true;
					m.cid++;
				}
			}
		}

		if (gameplay == "hardcore" && ssince(timers.hardcore) > 64) {
			timers.hardcore = new Date();
			for (var id in instances.woffice.players) {
				var player = instances.woffice.players[id];
				var gold = 480000;
				player.gold += gold;
				player.socket.emit("game_log", "Received " + to_pretty_num(gold) + " gold");
				player.socket.emit("disappearing_text", {
					message: "+" + gold,
					x: player.x,
					y: player.y - 32,
					args: { color: "+gold", size: "large" },
				});
				resend(player, "reopen");
			}
		}

		if (events.goldenbat && stats.kills.bat > edges.next_goldenbat) {
			edges.next_goldenbat += parseInt(events.goldenbat * Math.random());
			spawn_special_monster("goldenbat");
		}

		if (events.cutebee && stats.kills.bee > edges.next_cutebee) {
			edges.next_cutebee += parseInt(events.cutebee * Math.random());
			spawn_special_monster("cutebee");
		}

		if (!events.holidayseason && events.snowman && !monster_c.snowman) {
			if (!timers.snowman) {
				timers.snowman = future_s(events.snowman * 60);
			} else if (timers.snowman && c > timers.snowman) {
				timers.snowman = 0;
				spawn_special_monster("snowman");
			}
		}

		var eventmap = [
			["halloween", "mrpumpkin"],
			["halloween", "mrgreen"],
			["halloween", "slenderman", true],
			["holidayseason", "grinch"],
			["holidayseason", "snowman"],
			["lunarnewyear", "dragold"],
			["lunarnewyear", "tiger", true],
			["valentines", "pinkgoo", true],
			["egghunt", "wabbit", true],
		];
		eventmap.forEach(function (s) {
			if (events[s[0]] && !monster_c[s[1]]) {
				if (!timers[s[1]]) {
					if (timers[s[1]] !== 0) {
						timers[s[1]] = future_s(120);
					} else {
						timers[s[1]] = future_s(G.monsters[s[1]].respawn);
					}
					E[s[1]] = { live: false, spawn: timers[s[1]] };
					broadcast_e();
				} else if (timers[s[1]] && c > timers[s[1]]) {
					timers[s[1]] = 0;
					spawn_special_monster(s[1]);
					var m = get_monsters(s[1])[0];
					var data = { live: true, map: m.map, hp: m.hp, max_hp: m.max_hp, target: m.target };
					if (!s[2]) {
						data.x = m.x;
						data.y = m.y;
					}
					E[s[1]] = data;
					broadcast_e();
				}
			}
		});
		["holidayseason", "halloween", "lunarnewyear", "valentines", "egghunt"].forEach(function (event) {
			if (events[event]) {
				E[event] = true;
			} else if (E[event]) {
				delete E[event];
			}
		});
		["snowman", "grinch", "dragold", "mrpumpkin", "mrgreen", "wabbit", "pinkgoo", "tiger"].forEach(function (type) {
			if (E[type] && !monster_c[type]) {
				delete E[type]; // [20/01/23]
				change = true;
			}
		});
		for (var name in instances) {
			for (var id in instances[name].monsters) {
				var monster = instances[name].monsters[id];
				["tiger"].forEach(function (type) {
					if (monster.type == type) {
						E[type] = { live: true, map: monster.map, hp: monster.hp, max_hp: monster.max_hp, target: monster.target };
					}
				});
				["snowman", "grinch", "dragold", "mrpumpkin", "mrgreen", "wabbit", "pinkgoo"].forEach(function (type) {
					if (monster.type == type) {
						if (!E[type]) {
							change = true;
						}
						E[type] = {
							live: true,
							map: monster.map,
							hp: monster.hp,
							max_hp: monster.max_hp,
							target: monster.target,
							x: monster.x,
							y: monster.y,
						};
					}
				});
				if (monster.type == "grinch") {
					if (instances[monster.in].paused) {
						resume_instance(instances[monster.in]);
					}

					var phrase = null;
					var disengage = false;

					if (Math.random() < 0.1) {
						if (monster.target && !G.monsters.grinch.good) {
							phrase = random_one([
								"Come to papa",
								"This is not a chew toy!",
								"Give me that! Don't you know you're not supposed to take things that don't belong to you? What's the matter with you? You some kind of wild animal?",
								"HELP ME…I'm FEELING.",
								"It came without ribbons, it came without tags. It came without packages, boxes, or bags.",
								"Poor, poor, " + monster.target,
								"Innie, minnie, tiny " + monster.target + "innie",
							]);
						} else if (!monster.target) {
							phrase = random_one([
								"That is not a chew toy!",
								"Stupid. Ugly. Out of date. This is ridiculous. If I can't find something nice to wear I'm not going.",
								"Kids today. So desensitized by movies and television.",
								"Holiday who-be what-ee?",
								"I could use a little social interaction.",
								"It's because I'm green isn't it?",
								"Social distancing what?",
							]);
						}
					}

					if (
						monster.target &&
						get_player(monster.target) &&
						get_player(monster.target).slots.chest &&
						get_player(monster.target).slots.chest.name == "xmassweater" &&
						!G.monsters.grinch.good
					) {
						phrase = "Ugh. What's that ugly thing you are wearing?! I can't look at it. Stop.";
						disengage = true;
					}

					if (phrase) {
						xy_emit(monster, "chat_log", { owner: "Grinch", message: phrase, id: monster.id, color: "#418343" });
					}

					if (!monster.target && Math.random() < 0.1 * Object.keys(players).length) {
						monster.last_attack = future_ms(1000);
						var player = random_one(players);
						if (
							(player.level < 50 && Math.random() > 0.08) ||
							(G.maps[player.map] &&
								(G.maps[player.map].safe || G.maps[player.map].instance || G.maps[player.map].irregular))
						) {
							player = null;
						}
						if (player && 0) {
							// attack everyone
							for (var pid in instances[player.in].players) {
								if (!player) {
									break;
								}
								var ally = instances[player.in].players[pid];
								if (
									ally.name != player.name &&
									!ally.npc &&
									(ally.type != "merchant" || player.type == "merchant") &&
									simple_distance(ally, player) < 500
								) {
									player = null;
									break;
								}
							}
						}
						if (player) {
							target_player(monster, player);
						}
					}
					if ((monster.target && !is_disabled(monster) && Math.random() < 0.05) || disengage) {
						stop_pursuit(monster, { force: true, cause: "disengage" });
					}
				}
			}
		}

		eventmap.forEach(function (s) {
			if (events[s[0]] && !E[s[1]]) {
				E[s[1]] = { live: false, spawn: timers[s[1]] };
				change = true;
			}
		});

		if (events.goblin) {
		}

		if (events.hide_and_seek) {
		}

		if (events.abtesting) {
			if (timers.abtesting && c > timers.abtesting) {
				var winner = "A";
				if (E.abtesting.B > E.abtesting.A) {
					winner = "B";
				}
				events.abtesting = false;
				timers.abtesting = false;
				delete E.abtesting;
				change = true;
				broadcast("server_message", { message: "Team " + winner + " wins! Hope you all had fun!", color: "#4BB6E1" });
				for (var id in instances.abtesting.players) {
					var player = instances.abtesting.players[id];
					var table = "abtesting";
					if (!player.team) {
						continue;
					}
					if (player.team != winner) {
						table = "abtesting_loser";
					}
					if (!player.esize) {
						socket.emit("game_log", "Full inventory. Unable to receive a prize.");
						continue;
					}
					exchange(player, table);
				}
				destroy_instance("abtesting");
			} else if (!timers.abtesting) {
				timers.abtesting = future_s(G.events.abtesting.duration);
				change = true;
				timers.abtesting_start = c;
				E.abtesting = { end: timers.abtesting, signup_end: future_s(60), A: 0, B: 0, id: randomStr(5) };
				create_instance("abtesting", "abtesting", { event: true });
				collect_signups("abtesting");
				broadcast("server_message", { message: "A/B Testing has begun!", color: "#4BB6E1" });
				// npcs.bean.s.invis={ms:999999999999}; xy_emit(npcs.bean,"disappear",{id:"Bean"});
			}
		}

		if (instances.cyberland && ssince(timers.cyberland) > 10) {
			var detected = false;
			timers.cyberland = new Date();
			for (var id in instances.cyberland.monsters) {
				var monster = instances.cyberland.monsters[id];
				if (monster.target) {
					detected = get_player(monster.target);
				}
			}
			if (detected) {
				xy_emit({ in: "cyberland", map: "cyberland", x: 0, y: -100 }, "chat_log", {
					owner: "mainframe",
					message: "ALERT",
					id: "mainframe",
				});
				for (var id in instances.cyberland.monsters) {
					var monster = instances.cyberland.monsters[id];
					if (!monster.target) {
						target_player(monster, detected);
					}
				}
			}
			if (Math.random() < 1.0 / 1600) {
				S.misc.spares.push("electronics");
				if (Math.random() < 1.0 / 1020) {
					S.misc.spares.push("networkcard");
				}
				if (S.misc.spares.length > 2000) {
					S.misc.spares.length = 2000;
				}
			}
		}

		for (var id in E.duels || {}) {
			var duel = E.duels[id];
			var instance = instances[id];
			var info = instance.info;
			var a = 0;
			var b = 0;
			if (info.seconds) {
				info.seconds--;
			}
			// console.log(info.A); console.log(info.B);
			for (var i = 0; i < info.A.length; i++) {
				var p = info.A[i];
				var player = get_player(p.name);
				//console.log(player.in+" "+player.duel.id+" "+player.rip);
				if (!player || player.in != id || !player.duel || player.rip || !player.team) {
					p.active = false;
				}
				if (p.active) {
					info.A[i] = player_to_summary(player);
					a++;
					info.A[i].active = true;
				}
			}
			for (var i = 0; i < info.B.length; i++) {
				var p = info.B[i];
				var player = get_player(p.name);
				if (!player || player.in != id || !player.duel || player.rip || !player.team) {
					p.active = false;
				}
				if (p.active) {
					info.B[i] = player_to_summary(player);
					b++;
					info.B[i].active = true;
				}
			}
			if (!info.seconds && !info.active) {
				duel.a = [];
				duel.b = [];
				info.active = true;
				info.A.forEach(function (p) {
					var player = get_player(p.name);
					if (player && p.active) {
						player.s = {};
						duel.a.push(p.name);
						resend(player, "u+cid");
					}
				});
				info.B.forEach(function (p) {
					var player = get_player(p.name);
					if (player && p.active) {
						player.s = {};
						duel.b.push(p.name);
						resend(player, "u+cid");
					}
				});
			}
			if (!a || !b) {
				var message = duel.challenger + " wins the duel!";
				var chat = duel.challenger + " defeated " + duel.vs + "!";
				var sent = {};
				if (!a) {
					message = duel.vs + " wins the duel!";
					chat = duel.vs + " defeated " + duel.challenger + "!";
				}
				for (var pid in instance.players) {
					sent[instance.players[pid].name] = true;
					instance.players[pid].socket.emit("game_chat", { message: message, color: "#47C1AE" });
				}
				info.A.forEach(function (p) {
					var player = get_player(p.name);
					if (player && !sent[p.name]) {
						player.socket.emit("game_chat", { message: message, color: "#47C1AE" });
					}
				});
				info.B.forEach(function (p) {
					var player = get_player(p.name);
					if (player && !sent[p.name]) {
						player.socket.emit("game_chat", { message: message, color: "#47C1AE" });
					}
				});

				destroy_instance(id);

				if (!a) {
					info.B.forEach(function (p) {
						var player = get_player(p.name);
						if (player) {
							xy_emit(player, "eval", "confetti_shower(get_player('" + player.name + "'),2)");
						}
					});
				} else {
					info.A.forEach(function (p) {
						var player = get_player(p.name);
						if (player) {
							xy_emit(player, "eval", "confetti_shower(get_player('" + player.name + "'),2)");
						}
					});
				}

				if (!a && get_player(duel.vs)) {
					xy_emit(get_player(duel.vs), "game_chat", { message: chat, color: "#47C1AE" });
				}
				if (!b && get_player(duel.challenger)) {
					xy_emit(get_player(duel.challenger), "game_chat", { message: chat, color: "#47C1AE" });
				}

				delete E.duels[id];
				broadcast_e();
				continue;
			}
			duel.active = instance.active;
			duel.seconds = instance.seconds;
			instance_emit(id, "map_info", instance.info);
		}

		for (var e in E) {
			if ((E[e] && E[e].target) || Object.keys(E.duels || {}).length) {
				change = true;
				break;
			}
		}
		if (change) {
			broadcast_e();
		}
	} catch (e) {
		log_trace("Critical-event_loop: ", e);
	}
}

function broadcast_e(dont_send) {
	if (!dont_send) {
		broadcast("server_info", E);
	}
}

function start_event(name) {
	if (name == "goblin") {
		events.goblin = true;
	} else if (name == "goobrawl") {
		signups = {};
		events.goobrawl = 1;
		timers.goobrawl = future_s(45);
		broadcast("notice", { message: "Goo Brawl is about to start!" });
	} else if (name == "abtesting") {
		signups = {};
		events.abtesting = 1;
		timers.abtesting = future_s(45);
		// instances.main.players[NPC_prefix+"Bean"]=npcs.bean;
		// npcs.bean.party="abtesting"; npcs.bean.last.move=new Date();
		broadcast("server_message", { message: "A/B Testing is about to start!", color: "#4BB6E1" });
	}
}

function new_worker(num) {
	var worker = new Worker(variables.worker_path, {
		workerData: { G: G, amap_data: amap_data, smap_data: smap_data },
		env: SHARE_ENV,
		execArgv: [],
	});
	worker.wnum = num;
	worker.on("message", function (data) {
		if (data.type == "monster_move") {
			var monster = instances[data.in].monsters[data.id];
			if (!monster) {
				return;
			}
			monster.working = false;
			if (data.move && (data.move[2] != "bad" || (monster.bmoves || 0) < 6)) {
				if (data.move[2] == "bad") {
					monster.bmoves = (monster.bmoves || 0) + 1;
				} else {
					monster.bmoves = 0;
				}
				monster.going_x = data.move[0];
				monster.going_y = data.move[1];
				start_moving_element(monster);
			} else {
				var player = monster.target && get_player(monster.target);
				if (player) {
					if (monster.attack < 120 || distance(monster, player, true) > monster.range) {
						stop_pursuit(monster, { cause: "cant_move_smart" });
					}
				}
			}
		}
	});
	worker.on("error", function (data) {
		console.log("#W Worker error: " + JSON.stringify(data));
	});
	worker.on("exit", function (code) {
		workers[this.wnum] = new_worker(this.wnum);
	});
	return worker;
}

function init_server() {
	if (gameplay == "hardcore") {
		E = {
			rewards: {
				item8: null,
				item9: null,
				item10: null,
				item11: null,
				item12: null,
				leader: null,
				first_fvampire: null,
				first_mvampire: null,
				first_skeletor: null,
				first_stompy: null,
				first_franky: null,
				first_ent: null,
				first_wabbit: null,
				accessory5: null,
				accessory6: null,
				first_warrior_70: null,
				first_paladin_70: null,
				first_priest_70: null,
				first_mage_70: null,
				first_ranger_70: null,
				first_rogue_70: null,
				"!participation": "Every authorized account with a level 60+ character receives a participation award!",
			},
		};
		E.minutes = 340;
		if (is_sdk) {
			E.minutes = 12;
		}
		setInterval(hardcore_loop, 60 * 1000);
	}
	setInterval(event_loop, 1000);
	setInterval(tavern_loop, 1000);
	workers = [
		new_worker(0),
		new_worker(1),
		new_worker(2),
		new_worker(3),
		new_worker(4),
		new_worker(5),
		new_worker(6),
		new_worker(7),
	];
}

function init_server_data() {
	if (!S.dt) {
		S.dt = {};
	}
	if (!S.sold) {
		S.sold = [];
	}
	if (!S.found) {
		S.found = [];
	}
	if (!S.gold) {
		S.gold = 0;
	}
	if (!S.cash) {
		S.cash = 0;
	}
	if (!S.logs) {
		S.logs = { donate: [], dice: [] };
	}
	if (!S.misc) {
		S.misc = { spares: ["electronics"] };
	}
	["sold", "found"].forEach(function (store) {
		for (var i = S[store].length - 1; i >= 0; i--) {
			if (
				!S[store][i].name ||
				!G.items[S[store][i].name] ||
				in_arr(S[store][i].name, ["cxjar", "emotionjar"]) ||
				G.items[S[store][i].name].cash
			) {
				S[store].splice(i, 1);
			}
		}
	});
	for (var i = 0; i < S.sold.length; i++) {
		csold[i] = cache_item(S.sold[i], true);
	}
	for (var i = 0; i < S.found.length; i++) {
		cfound[i] = cache_item(S.found[i], true);
	}
	if (!S.ugrace) {
		S.ugrace = [];
		S.cgrace = [];
		for (var i = 0; i < 25; i++) {
			S.ugrace[i] = 24;
			S.cgrace[i] = 24;
		}
	}
}

function get_monsters(type) {
	var l = [];
	for (var name in instances) {
		for (var id in instances[name].monsters) {
			var monster = instances[name].monsters[id];
			if (monster.type == type) {
				l.push(monster);
			}
		}
	}
	return l;
}

function get_monster(type) {
	return get_monsters(type)[0];
}

function add_item_property(item, prop) {
	if (prop == "legacy") {
		return;
	}
	if (!item.ps) {
		item.ps = [];
	}
	if (item.p && !in_arr(item.p, item.ps)) {
		item.ps.push(item.p);
	} // backwards compatibility
	if (!in_arr(prop, item.ps)) {
		item.ps.push(prop);
	}
	item.p = prop;
}

function add_condition(target, condition, args) {
	var def = G.conditions[condition];
	if (!def) {
		return;
	}
	if (!args) {
		args = {};
	}
	var response = { response: "condition", name: condition, cevent: true };
	var duration = args.duration || args.ms || def.duration;
	if (duration == undefined) {
		duration = 1000;
	}
	var C = { ms: duration };
	if (condition == "poisoned" && target.pnresistance) {
		if (Math.random() < (target.pnresistance || 0) / 100.0) {
			return xy_emit(target, "ui", { type: "poison_resist", id: target.id });
		}

		duration *= (100 - target.pnresistance) / 100.0;
	}
	if (condition == "stunned") {
		if (Math.random() < (target.phresistance || 0) / 100.0) {
			return xy_emit(target, "ui", { type: "stun_resist", id: target.id });
		}

		target.abs = true;
		target.moving = false;
	}
	if (condition == "burned") {
		if (Math.random() < (target.firesistance || 0) / 100.0) {
			return xy_emit(target, "ui", { type: "fire_resist", id: target.id });
		}

		duration = 5000;
		if (!args.attack) {
			args.attack = 1000;
		}
		if (args.divider == 3 && target.s.burned && target.s.burned.ms) {
			duration = min(
				12000,
				max(duration + 400, min(8000, parseInt(duration / 4 + (50 * args.attack) / (target.s.burned.intensity + 200)))),
			);
		}
		C.intensity = max(
			(target.s.burned && target.s.burned.intensity) || 1,
			parseInt(((target.s.burned && target.s.burned.intensity) || 0) / (args.divider || 3) + args.attack),
		);
		C.fid = args.fid;
		disappearing_text({}, target, "BURN!", { xy: 1, size: "huge", color: "burn", nv: 1 }); //target.is_player&&"huge"||undefined
	}
	if (condition == "deepfreezed") {
		if (Math.random() < (target.fzresistance || 0) / 100.0) {
			return xy_emit(target, "ui", { type: "freeze_resist", id: target.id });
		}
	}
	if (condition == "woven") {
		C.s = min((target.is_monster && 20) || 5, (target.s.woven && target.s.woven.s + 1) || 1);
		C.speed = -3 * condition.s;
	}
	duration = max((target.s[condition] && target.s[condition].ms) || 0, duration);
	if (target.stresistance && def && def.debuff) {
		duration *= (100 - target.stresistance) / 100.0;
	}
	target.s[condition] = C;
	C.ms = response.duration = duration;
	server_log(C);
	if (args.from) {
		C.f = args.from.name;
	}
	if (args.f) {
		C.f = args.f;
	}
	if (C.f) {
		response.from = C.f;
	}
	target.cid++;
	target.u = true;
	if (target.socket) {
		target.hitchhikers.push(["game_response", response]);
	}
	return true;
}

function consume_mp(player, mp, target) {
	var mult = 1;
	if (target && target.humanoid) {
		mult = 5;
	}
	if (player.a.restore_mp && Math.random() < (player.a.restore_mp.attr0 * mult) / 100.0) {
		player.mp += mp * 2;
		xy_emit(player, "ui", { id: player.id, type: "restore_mp", amount: mp * 2 });
	} else {
		player.mp -= (mp * (100 - (player.mp_reduction || 0))) / 100.0;
	}
	player.mp = parseInt(max(0, player.mp));
	player.mp = min(player.mp, player.max_mp);
}

function game_response(response, data) {
	if (!data) {
		data = {};
	}
	data.response = response;
	current_socket.emit("game_response", data);
}

function fail_response(response, place, data) {
	if (data && is_string(data)) {
		data = { reason: data };
	}
	if (!response) {
		response = "data";
	}
	if (is_object(response)) {
		data = response;
		response = "data";
		place = ls_method;
	}
	if (is_object(place)) {
		data = place;
		place = ls_method;
	}
	if (!data) {
		data = {};
	}
	if (!place) {
		place = ls_method;
	}
	data.response = response;
	data.place = place;
	data.failed = true;
	current_socket.emit("game_response", data);
}

function success_response(response, place, data) {
	if (!response) {
		response = "data";
	}
	if (is_object(response)) {
		data = response;
		response = "data";
		place = ls_method;
	}
	if (place && is_object(place)) {
		data = place;
		place = ls_method;
	}
	if (!data) {
		data = {};
	}
	if (!place) {
		place = ls_method;
	}
	if (data.success !== false) {
		data.success = true;
	}
	data.response = response;
	data.place = place;
	current_socket.emit("game_response", data);
}

function consume_skill(player, name, reuse) {
	var penalty_cd = (player.s.penalty_cd && player.s.penalty_cd.ms) || 0;
	var multiplier = 1;
	//if(name=="attack" || G.skills[name].share=="attack")
	if (G.skills[name].share) {
		multiplier = G.skills[name].cooldown_multiplier || 1;
		name = G.skills[name].share;
	}
	var cooldown = G.skills[name].cooldown;
	if (reuse) {
		cooldown = G.skills[name].reuse_cooldown;
	}
	if (!cooldown) {
		return;
	}
	player.last[name] = future_ms(min(penalty_cd, 10000) + cooldown * (multiplier - 1));
	player.socket.emit("skill_timeout", {
		name: name,
		ms: min(penalty_cd, 10000) + cooldown * multiplier,
		penalty: min(penalty_cd, 10000),
	});
	// player.socket.emit("eval",{code:"skill_timeout('"+name+"',"+(min(penalty_cd,10000)+cooldown*multiplier)+")"});
}

function get_entity(name) {
	if (players[name_to_id[name]]) {
		return players[name_to_id[name]];
	}
	var l = [];
	for (var iname in instances) {
		if (instances[iname].monsters[name]) {
			return instances[iname].monsters[name];
		}
	}
	return null;
}

function get_player(name) {
	return players[name_to_id[name]];
}

function realm_broadcast(event, data) {
	data.sname = region + " " + server_name;
	appengine_call("broadcast", { event: event, data: JSON.stringify(data) });
	// broadcast(event,data);
}

function broadcast(event, data) {
	io.emit(event, data);
	if (event == "notice" || (event == "server_message" && gameplay == "normal")) {
		var to_log = false;
		if (data.sname && data.sname != region + " " + server_name) {
			data.message += " [" + data.sname + "]";
		}
		if (event == "notice") {
			data.color = "orange";
		}
		if (
			event == "server_message" &&
			!data.event &&
			!data.nod &&
			(!data.sname || data.sname == region + " " + server_name)
		) {
			var message = data.message;
			if (data.sname) {
				message += " [" + region + " " + server_name + "]";
			}
			if (data.discord == "orange") {
				message = "```css\n[" + message + "```";
			} // no ]
			if (data.discord == "red") {
				message = "```diff\n-" + message + "```";
			}
			discord_call(message);
			to_log = true;
		}
		if (to_log) {
			appengine_call(
				"server_event",
				{
					event: event,
					keyword: variables.keyword,
					id: server_id,
					message: data.message,
					color: data.color || "",
				},
				function (result) {
					server_log("Server notice: " + data.message);
				},
			);
		}
	}
}

function instance_emit(name, event, data) {
	var instance = instances[name] || name;
	if (gameplay == "hardcore" && event != "tavern" && event != "dice") {
		return broadcast(event, data);
	}
	for (var id in instance.players) {
		var player = instance.players[id];
		if (!player.npc) {
			player.socket.emit(event, data);
		}
	}
}

function party_emit(name, event, data, args) {
	if (!parties[name]) {
		return;
	}
	// console.log(parties[name]);
	var owners = [];
	var owner = get_player(data.owner);
	parties[name].forEach(function (player_name) {
		var player = players[name_to_id[player_name]];
		if (args && args.instance && player.in != args.instance) {
			return;
		}
		if (0 && in_arr(event, ["disappearing_text"])) {
			player.socket.emit(event, data);
		} //volatile.
		else {
			player.socket.emit(event, data);
		}
		if (event == "partym") {
			owners[player.owner] = owners[player.owner] || [];
			owners[player.owner].push(player.name);
		}
	});
	if (event == "partym" && owner) {
		appengine_call("log_chat", {
			to: Object.entries(owners),
			type: "party",
			message: data.message,
			fro: owner.name,
			author: owner.owner,
		});
	}
}

function leave_party(name, leaver) {
	// [10/07/18]: For a long time chased oddities around party routines that didn't make sense, yesterday I realised that .emit causes a "disconnect" to be handled right inside this function, rather than afterwards, causing the oddities and irregularities - so - after a .emit, there's no guarantee that the player will still be there
	var newparty = [];
	var oldparty = parties[name];
	if (!oldparty) {
		leaver.party = null;
		console.log("#X NO PARTY " + name);
		return;
	} // Don't know the cause, maybe a disconnect triggering on the accept routines? [12/07/18]
	parties[name].forEach(function (player_name) {
		var player = players[name_to_id[player_name]];
		if (!player) {
			console.log("#X SHOULD'VE FOUND " + player_name);
			return;
		}
		player.party = null;
		if (leaver.name != player.name) {
			newparty.push(player_name);
		}
	});
	delete parties[name];
	if (newparty.length >= 2) {
		parties[newparty[0]] = newparty;
	}
	if (newparty.length < 2) {
		if (newparty.length) {
			var player = players[name_to_id[newparty[0]]];
			if (!player) {
				console.log("#X SHOULD'VE FOUND2 " + newparty[0]);
			} else {
				player.party = null;
			}
		}
	} else {
		newparty.forEach(function (player_name) {
			var player = players[name_to_id[player_name]];
			if (!player) {
				console.log("#X SHOULD'VE FOUND3 " + newparty[0]);
				return;
			}
			player.party = newparty[0];
		});
	}
	// Moved the socket routine to the end, after all party changes are made [10/07/18]
	oldparty.forEach(function (player_name) {
		var player = players[name_to_id[player_name]];
		if (!player || player.name == leaver.name) {
			return;
		}
		newparty = (newparty && parties[newparty[0]]) || []; // During these .socket.emit's, "disconnect"'s happen, the parties can become empty, and party_to_client fails [21/08/18]
		player.socket.emit("party_update", {
			message: leaver.name + " left the party",
			leave: 1,
			list: newparty.length >= 2 && newparty,
			party: (newparty.length >= 2 && party_to_client(newparty[0])) || {},
		});
		resend(player, "nc+u+cid");
	});
}

function delete_observer(socket) {
	var observer = observers[socket.id];
	delete observers[socket.id];
	delete instances[observer.in].observers[observer.id];
}

function send_all_xy(observer, args) {
	var data = { players: [], monsters: [], type: "all", in: observer.in, map: observer.map };
	var instance = instances[observer.in];
	for (var id in instance.players) {
		if (!instance.players[id].s.invis && within_xy_range(observer, instance.players[id])) {
			data.players.push(player_to_client(instance.players[id], 1));
		}
	}
	for (var id in instance.monsters) {
		if (within_xy_range(observer, instance.monsters[id])) {
			data.monsters.push(monster_to_client(instance.monsters[id]));
		}
	}
	observer.last_ux = observer.x;
	observer.last_uy = observer.y;
	if (observer.moving && mode.xyinf) {
		data.xy = { x: observer.x, y: observer.y };
	}
	if (args && args.raw) {
		return data;
	}
	observer.socket.emit("entities", data);
}

function xy_emit(entity, event, data, must) {
	var x = entity.x;
	var y = entity.y;
	var owners = {};
	for (var id in instances[entity.in].players) {
		var player = instances[entity.in].players[id];
		if (player.npc) {
			continue;
		}
		if (
			(player.x - player.vision[0] < x &&
				x < player.x + player.vision[0] &&
				player.y - player.vision[1] < y &&
				y < player.y + player.vision[1]) ||
			player.id == must
		) {
			if (event == "light" && (player.type == "rogue" || player.s.invis) && distance(player, entity) < 300) {
				player.last.invis = new Date();
				delete player.s.invis;
				player.socket.emit("light", { name: data.name, affected: 1 });
				resend(player, "u");
			} else if ((event == "upgrade" || event == "ui") && entity.name != player.name) {
				player.socket.emit(event, data);
			} //volatile. [02/02/18]
			else {
				player.socket.emit(event, data);
				if (event == "chat_log" && data.p) {
					owners[player.owner] = owners[player.owner] || [];
					owners[player.owner].push(player.name);
				}
			}
			// else if(!data.nv && in_arr(event,["disappearing_text","upgrade"])) player.socket.emit(event,data); //volatile.
		}
	}
	for (var id in instances[entity.in].observers) {
		var player = instances[entity.in].observers[id];
		if (
			player.x - player.vision[0] < x &&
			x < player.x + player.vision[0] &&
			player.y - player.vision[1] < y &&
			y < player.y + player.vision[1]
		) {
			if (event == "upgrade") {
				player.socket.emit(event, data);
			} //volatile. [02/02/18]
			else if (!data.nv && in_arr(event, ["disappearing_text", "upgrade"])) {
				player.socket.emit(event, data);
			} //volatile.
			else {
				player.socket.emit(event, data);
			}
		}
	}
	if (event == "chat_log" && data.p) {
		appengine_call("log_chat", {
			to: Object.entries(owners),
			type: "ambient",
			message: data.message,
			fro: entity.name,
			author: entity.owner,
		});
	}
}

function xy_u_logic(element) {
	// sets .u so updates are sent - this element might enter someone's vision
	var u = false;

	if (!element.last_u) {
		u = true;
	} else if (abs(element.last_u[0] - element.x) > B.u_boundary) {
		u = true;
	} else if (abs(element.last_u[1] - element.y) > B.u_boundary) {
		u = true;
	}

	if (u) {
		element.last_u = [element.x, element.y];
		element.u = true;
	}
}

function xy_upush_logic(element) {
	// sets .push so new entities in that area are pushed to the user/element
	var u = false;

	if (!element.last_upush) {
		element.last_upush = [element.x, element.y];
		return;
	} else if (abs(element.last_upush[0] - element.x) > B.u_vision) {
		u = true;
	} else if (abs(element.last_upush[1] - element.y) > B.u_vision) {
		u = true;
	}

	if (u) {
		element.push = element.last_upush;
		element.last_upush = [element.x, element.y];
	}
}

function appengine_call(method, args, on_success, on_error) {
	var api_path = "/api/" + method;
	if (
		mode.prevent_external &&
		!in_arr(method, ["create_server", "update_server", "stop_server", "start_character", "send_mail"])
	) {
		return;
	}
	function retry_call() {
		var t = 1600;
		args.retried = (args.retried || 0) + 1;
		args.retries--;
		if (args.retried > 20) {
			t = 240000;
		} else if (args.retried > 10) {
			t = 60000;
		} else if (args.retried > 5) {
			t = 20000;
		}
		setTimeout(function () {
			appengine_call(method, args, on_success, on_error);
		}, t);
		// network retries, for "Error: socket hang up" etc. [09/09/16]
	}
	if (!args) {
		args = {};
	}
	if (!on_success) {
		on_success = function () {};
	}
	if (args.suffix) {
		api_path += args.suffix;
		delete args.suffix;
	}
	data = {
		method: method,
		arguments: JSON.stringify(args),
		server_auth: server_id + "-" + server_auth,
		auth: args.auth,
	};
	try {
		request.post({ url: base_url + api_path, form: data }, function (err, response, body) {
			try {
				if (err || !response || response.statusCode != 200) {
					// node.request sends an undefined response when there is an issue ...
					console.log(
						"appengine_call - unknown error " +
							err +
							" or code: " +
							(response && response.statusCode) +
							" retries: " +
							args.retries +
							new Date() +
							" on " +
							api_path,
					);
					if (method != "log_error") {
						setTimeout(
							(function (err, response, api_path, body) {
								return function () {
									try {
										appengine_call("log_error", {
											type: "appengine_call_error",
											err: (response && response.statusCode) + " " + api_path,
											info: "" + body + "" + err + "\n" + JSON.stringify((response && response.headers) || {}),
										});
									} catch (e) {
										log_trace("appengine_call's log_error " + api_path, e);
									}
								};
							})(err, response, api_path, body),
							120000,
						);
					}
					if (args.retries) {
						retry_call();
					} else if (on_error) {
						on_error("" + err + " " + (response && response.statusCode));
					}
				} else {
					ct = JSON.parse(body);
					if (on_success) {
						on_success.apply(this, [ct]);
					}
				}
			} catch (e) {
				log_trace("appengine_call exception on " + api_path, e);
				if (args.retries) {
					retry_call();
				} else if (on_error) {
					on_error("" + err + " " + e + " " + (response && response.statusCode));
				} else if (on_success) {
					on_success.apply(this, [{ failed: 1, reason: "callbackfailed" }]);
				}
			}
		});
	} catch (e) {
		log_trace("appengine_call on " + api_path, e);
		if (args.retries) {
			retry_call();
		} else if (on_error) {
			on_error("" + e + " " + (response && response.statusCode));
		} else if (on_success) {
			on_success.apply(this, [{ failed: 1, reason: "callfailed" }]);
		}
	}
	if (!args.init) {
		args.init = new Date();
	}
	return args;
}

function discord_call(message) {
	if (gameplay == "hardcore" || gameplay == "test") {
		return;
	}
	if (is_sdk) {
		return server_log("Discord: " + message);
	}
	var url = "https://discordapp.com/api/channels/404333059018719233/messages";
	if (message.search(" joined Adventure Land") != -1) {
		url = "https://discordapp.com/api/channels/839163123499794481/messages";
	}
	request(
		{
			url: url,
			headers: { Authorization: "Bot " + variables.discord_token },
			method: "POST",
			json: {
				content: message,
			},
		},
		function (err, response, body) {
			//console.log(response);
		},
	);
}

function server_log(message, important) {
	if (is_sdk || important) {
		if (is_sdk) {
			console.log(message);
		} else {
			console.log(message + " (" + new Date() + ")");
		}
		if (message && (message + "").indexOf("SEVERE") != -1) {
			appengine_call(
				"server_event",
				{
					event: "notice",
					keyword: variables.keyword,
					id: server_id,
					message: message,
					color: "red",
				},
				function (result) {},
			);
		}
	}
}

function appengine_log(event, message, color) {
	if (!color) {
		color = "gray";
	}
	appengine_call(
		"server_event",
		{
			event: event,
			keyword: variables.keyword,
			id: server_id,
			message: message,
			color: color,
		},
		function (result) {},
	);
}

function disappearing_text(socket, entity, text, args) {
	var x = entity.x;
	var y = entity.y - 30;
	var d_args = {};
	if (!args) {
		args = {};
	}
	// if(!args.size) args.size=16;
	if (!args.color) {
		args.color = "";
	}

	if (args.color) {
		d_args.c = args.color;
	} // color
	if (args.s) {
		d_args.s = args.s;
	} // sound
	if (args.size) {
		d_args.sz = args.size;
	}
	if (args.from) {
		d_args.from = args.from;
	} // for d_text + .evade + d_line

	if (args.xy && args.nv) {
		xy_emit(entity, "disappearing_text", { message: text, x: x, y: y, id: entity.id, args: d_args, nv: 1 });
	} else if (args.xy) {
		xy_emit(entity, "disappearing_text", { message: text, x: x, y: y, id: entity.id, args: d_args });
	} else if (args.party) {
		party_emit(
			args.party,
			"disappearing_text",
			{ message: text, x: x, y: y, id: entity.id, args: d_args },
			{ map: args.map },
		);
	} else {
		socket.emit("disappearing_text", { message: text, x: x, y: y, id: entity.id, args: d_args });
	} // volatile.
}

function magiport_someone(pulled, player) {
	var spot = random_one([
		[-10, 16],
		[10, 16],
		[10, -16],
		[-10, -16],
		[0, -24],
		[-20, -32],
		[20, 32],
		[-20, 32],
		[20, -32],
	]);
	var spot = safe_xy_nearby(player.map, player.x + spot[0], player.y + spot[1]);
	if (!spot) {
		return false;
	}
	pulled.s.magiport = { ms: 400 };
	pulled.s.magiport.x = spot.x;
	pulled.s.magiport.y = spot.y;
	pulled.s.magiport.f = player.name;
	pulled.s.magiport.in = player.in;
	pulled.s.magiport.map = player.map;
	if (player.party == pulled.party) {
		player.pdps += 2000;
	}
	resend(pulled, "u+cid");
	return true;
}

function exchange(player, name, args) {
	if (!args) {
		args = {};
	}
	var socket = player.socket;
	var done = false;
	var total = 0;
	var current = 0;
	var table = D.drops[name];
	if (is_array(name)) {
		table = name;
		name = args.name;
	}
	if (name.startsWith("cosmo")) {
		table = clone(table);
		table.forEach(function (drop) {
			if (player.p.acx[drop[2]]) {
				drop[0] /= 10 ** player.p.acx[drop[2]];
			}
		});
		console.log(table);
	}
	table.forEach(function (drop) {
		total += drop[0];
	});
	result = Math.random() * total;
	table.forEach(function (drop) {
		if (done) {
			return;
		}
		current += drop[0];
		if (result <= current) {
			done = true;
			if (drop[1] == "gold") {
				player.gold += drop[2];
				socket.emit("game_log", { message: "Received " + to_pretty_num(drop[2]) + " gold", color: "gold" });
				if (drop[2] > 3000000 && !player.stealth) {
					broadcast("server_message", {
						message: player.name + " received " + to_pretty_num(drop[2]) + " gold",
						color: "gold",
					});
				}
			} else if (drop[1] == "shells") {
				add_shells(player, drop[2], name, true, "override");
			} else if (drop[1] == "empty") {
				socket.emit("game_log", "Didn't receive anything");
			} else if (drop[1] == "cx" || drop[1] == "cxbundle") {
				player.p.acx[drop[2]] = (player.p.acx[drop[2]] || 0) + 1;
				socket.emit("game_response", {
					response: "cx_new",
					acx: player.p.acx,
					name: drop[2],
					from: name,
					bundle: drop[1] == "cxbundle",
				});
			} else if (drop[1] == "open") {
				exchange(player, drop[2]);
			} else {
				var item = create_new_item(drop[1], drop[2]);
				var prop = undefined;
				if (
					name == "glitch" &&
					(G.items[item.name].upgrade ||
						G.items[item.name].compound ||
						character_slots.includes(G.items[item.name].type))
				) {
					item.p = "glitched";
				}
				if (name == "glitch") {
					args.phrase = "Glitched";
				}
				if (args.v) {
					item.v = args.v;
				}
				if (drop[1] == "cxjar" || drop[1] == "emotionjar") {
					item.data = drop[3];
				}
				add_item(player, item, { r: 1, phrase: args.phrase });
				socket.emit("game_log", {
					message: (args.phrase || "Received") + " " + item_to_phrase(item),
					color: colors.server_success,
				});
			}
		}
	});
	if (!done) {
		socket.emit("game_log", "Didn't receive anything");
	}
}

function chest_exchange(chest, name) {
	var done = false;
	var total = 0;
	var current = 0;
	D.drops[name].forEach(function (drop) {
		total += drop[0];
	});
	result = Math.random() * total;
	D.drops[name].forEach(function (drop) {
		if (done) {
			return;
		}
		current += drop[0];
		if (result <= current) {
			done = true;
			if (drop[1] == "gold") {
				chest.gold += drop[2];
			} else if (drop[1] == "shells") {
				chest.cash += drop[2];
			} else if (drop[1] == "empty") {
			} else if (drop[1] == "open") {
				chest_exchange(chest, drop[2]);
			} else {
				chest.items.push(create_new_item(drop[1]));
			}
		}
	});
}

var item_p_ignore = {
	grace: true,
	giveaway: true,
	gf: true,
	price: true,
	b: true,
	rid: true,
	list: true,
	o: true,
	oo: true,
	src: true,
};
var item_trade_p_ignore = { grace: true, o: true, oo: true, src: true };

// DOC
// .name -> key from G.items
// .level -> 9
// .stat_type -> "str"
// .p -> property
// .q -> quantity
// .m -> merchant luck
// .v -> pvp
// .l -> lock state
// .b -> block state
// .r -> rented
// .skin -> .skin override
// .charges
// .data -> free data
// .expires -> ""+(new Date())
// .gift -> gift item
// .acl -> account locked

// UPGRADE
// .p -> upgrade state #CLASH

// TRADE
// .rid
// .b -> buy order #CLASH
// .r -> for rent
// .giveaway
// .list -> the list for .giveaway

function cache_item(current, trade, override) {
	if (!current) {
		return null;
	}
	var item = {};
	if (trade) {
		for (var p in current) {
			if (!item_trade_p_ignore[p]) {
				item[p] = current[p];
			}
		}
		if (!item.giveaway) {
			delete item.list;
		}
	} else {
		for (var p in current) {
			if (!item_p_ignore[p]) {
				item[p] = current[p];
			}
		}
	}
	if (override) {
		for (var p in override) {
			item[p] = override[p];
		}
	}
	return item;
}

function get_trade_slots(player) {
	if (player.p.stand) {
		var num = 16;
		var slots = [];
		if (player.type == "merchant" && player.level >= 80) {
			num = 30;
		} else if (player.type == "merchant" && (player.level >= 70 || player.p.stand == "cstand")) {
			num = 24;
		}
		for (var i = 1; i <= num; i++) {
			slots.push("trade" + i);
		}
		return slots;
	} else if (player.p.trades) {
		return ["trade1", "trade2", "trade3", "trade4"];
	}
	return [];
}

function reslot_player(player) {
	trade_slots.forEach(function (slot) {
		try {
			delete player.cslots[slot];
		} catch (e) {}
	});
	get_trade_slots(player).forEach(function (slot) {
		player.cslots[slot] = cache_item(player.slots[slot], 1);
	});
}

function cache_player_items(player) {
	// console.log("Cached "+player.name+"'s items");
	if (player.slots && player.slots.ring1 && player.slots.ring1.name == "tristone" && player.slots.ring1.level >= 4) {
		player.slots.ring1.name = "darktristone";
	}
	if (player.slots && player.slots.ring2 && player.slots.ring2.name == "tristone" && player.slots.ring2.level >= 4) {
		player.slots.ring2.name = "darktristone";
	}
	player.cslots = {};
	player.citems = [];
	character_slots.forEach(function (slot) {
		player.cslots[slot] = cache_item(player.slots[slot]);
	});
	for (var i = 0; i < player.items.length; i++) {
		player.citems[i] = cache_item(player.items[i]);
	}
	reslot_player(player);
}

function init_bank(player) {
	player.cuser = {};
	for (var pack in bank_packs) {
		if (!player.user[pack]) {
			continue;
		}
		player.cuser[pack] = [];
		for (var i = 0; i < player.user[pack].length; i++) {
			if (!player.user[pack][i]) {
				player.cuser[pack][i] = null;
				continue;
			}
			if (player.user[pack][i].expires) {
				player.user[pack][i].expires = new Date(player.user[pack][i].expires);
			}
			player.cuser[pack][i] = cache_item(player.user[pack][i]);
		}
	}
}

function init_bank_exit(player) {
	for (var pack in bank_packs) {
		if (!player.user[pack]) {
			continue;
		}
		if (player.user[pack].length > 42) {
			player.user[pack].length = 42;
		}
	}
}

function init_player(player) {
	var class_def = G.classes[player.type];
	player.citems = [];
	if (
		(player.slots.mainhand &&
			player.slots.offhand &&
			G.classes[player.type].doublehand[
				G.items[player.slots.mainhand.name].wtype || G.items[player.slots.mainhand.name].type
			]) ||
		(player.slots.mainhand &&
			!G.classes[player.type].mainhand[
				G.items[player.slots.mainhand.name].wtype || G.items[player.slots.mainhand.name].type
			] &&
			!G.classes[player.type].doublehand[
				G.items[player.slots.mainhand.name].wtype || G.items[player.slots.mainhand.name].type
			])
	) {
		add_item(player, player.slots.mainhand, { announce: false });
		player.slots.mainhand = null;
	}
	if (
		player.slots.offhand &&
		!G.classes[player.type].offhand[G.items[player.slots.offhand.name].wtype || G.items[player.slots.offhand.name].type]
	) {
		add_item(player, player.slots.offhand, { announce: false });
		player.slots.offhand = null;
	}
	for (var i = 0; i < player.items.length; i++) {
		if (!player.items[i]) {
			continue;
		}
		delete player.items[i].m;
		if (player.items[i].v && msince(new Date(player.items[i].v)) > 60) {
			delete player.items[i].v;
		}
		if (player.items[i].expires) {
			player.items[i].expires = new Date(player.items[i].expires);
		}
		if (!Object.keys(player.q || {}).length && player.items[i].name == "placeholder") {
			player.items[i] = null;
		}
	}
	check_slots.forEach(function (slot) {
		if (player.slots[slot] && player.slots[slot].expires) {
			player.slots[slot].expires = new Date(player.slots[slot].expires);
		}
	});
	if (player.p.item_num === undefined) {
		player.p.item_num = parseInt(Math.random() * 42);
	}
	for (var s in player.s || {}) {
		if (player.s[s] && player.s[s].last) {
			player.s[s].last = new Date(player.s[s].last);
		}
	}
	for (var dt in player.p.dt) {
		if (!is_string(player.p.dt[dt])) {
			continue;
		}
		player.p.dt[dt] = new Date(player.p.dt[dt]);
	}
	for (var id in G.skills) {
		if (G.skills[id]["class"] && G.skills[id]["class"].includes(player.type) && G.skills[id].persistent) {
			player.last[id] = player.p.dt[id] || new Date();
			if ((G.skills[id].cooldown || G.skills[id].reuse_cooldown) > mssince(player.last[id])) {
				player.hitchhikers.push([
					"eval",
					{
						code:
							"skill_timeout('" +
							id +
							"'," +
							((G.skills[id].cooldown || G.skills[id].reuse_cooldown) - mssince(player.last[id])) +
							")",
					},
				]);
			}
		}
	}
	if (!player.skin || !T[player.skin]) {
		player.skin = class_def.looks[0][0];
		player.cx = clone(class_def.looks[0][1]);
	}
	prune_cx(player.cx || {});
	if (!player.p.acx) {
		player.p.acx = {};
		player.p.xcx = [];
	}
	if (!player.p.emx) {
		player.p.emx = {};
	}
	if (!player.p.ap) {
		player.p.ap = {};
	} // achievement progress
	if (!player.p.achievements) {
		player.p.achievements = {};
	}
	if (player.p.mute) {
		player.mute = true;
	}
	if (player.p.role == "gm") {
		player.gm = true;
	}
	if (player.p.role) {
		player.role = player.p.role;
	}
	if (events.holidayseason && !player.p.firstbuff) {
		add_condition(player, "holidayspirit");
		player.p.firstbuff = true;
	}
	if (!player.p.ugrace || player.p.ugrace.length != 15) {
		player.p.ugrace = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	} // first digit and some of the last aren't used [01/10/17]
	if (!player.p.cgrace || player.p.cgrace.length != 15) {
		player.p.cgrace = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	}
	if (!player.p.ograce) {
		player.p.ograce = 0;
	}
	if (!player.p.minutes) {
		player.p.minutes = 0;
	}
	if (!player.p.stats) {
		player.p.stats = { monsters: {} };
	}
	if (!player.p.stats.exchanges) {
		player.p.stats.exchanges = {};
	}
	if (!player.p.stats.monsters_diff) {
		player.p.stats.monsters_diff = {};
	}
	if (is_array(player.cx)) {
		player.cx = {};
	}
	if (player.items.length < 42) {
		player.items.length = 42;
	}

	//if(player.s.monsterhunt && player.s.monsterhunt.sn!=region+" "+server_name) delete player.s.monsterhunt;

	for (var n in player.s) {
		if (to_number(player.s[n])) {
			player.s[n] = { ms: to_number(player.s[n]) };
		}
	}

	player.xyh = [{ x: player.x, y: player.y, map: player.map, t: new Date() }]; // xy history
	player.rid = round(Math.random() * 1000); // random number to randomise events
}

function init_player_exit(player) {
	// these are safety routines, if a bug allows the inventory to grow infinitely, this prevents item duplication possibilities [18/10/18]
	for (var id in player.q) {
		player.q[id].stale = true;
	}
	if (player.items.length > 70) {
		player.items.length = 70;
	}
	if (Object.keys(player.slots).length > 500) {
		player.slots = {};
	}
	for (var id in G.skills) {
		if (
			G.skills[id]["class"] &&
			G.skills[id]["class"].includes(player.type) &&
			G.skills[id].persistent &&
			player.last[id]
		) {
			player.p.dt[id] = player.last[id];
		}
	}
}

function push_xyh(player, x, y) {
	if (!player.xyh) {
		return;
	}
	var last = player.xyh[player.xyh.length - 1];
	var current = { x: x, y: y, map: player.map, t: new Date() };
	if (mssince(last.t) > 50 || simple_distance(last, current) > 1) {
		player.xyh.push(current);
	}
	if (player.xyh.length > 100) {
		player.xyh.shift();
	}
}

function item_name(item) {
	var def = G.items[item.name];
	var name = def.name;
	if (item.level) {
		name += " +" + item.level;
	}
	return name;
}

function startswith_an(name) {
	if (in_arr(name.toLowerCase()[0], ["a", "e", "o", "u", "i"])) {
		return true;
	}
	return false;
}

function item_to_phrase(item) {
	if (item.q && item.q > 1) {
		return G.items[item.name].name + " [x" + item.q + "]";
	}
	var prefix = "";
	if (startswith_an(G.items[item.name].name)) {
		prefix = "an ";
	} else {
		prefix = "a ";
	}
	if (item.p) {
		prefix += item.p.toTitleCase() + " ";
	}
	if (item.level) {
		return prefix + G.items[item.name].name + " +" + item.level;
	}
	return prefix + G.items[item.name].name;
}

function killed_message(type) {
	if (G.monsters[type].prefix === "the") {
		return "killed the " + G.monsters[type].name;
	} else if (G.monsters[type].prefix === "") {
		return "killed " + G.monsters[type].name;
	} else if (startswith_an(G.monsters[type].name)) {
		return "killed an " + G.monsters[type].name;
	} else {
		return "killed a " + G.monsters[type].name;
	}
}

function is_xy_safe_old(map, x, y) {
	var safe = true;
	if (smap_data[map] == -1) {
		return true;
	}
	[
		[0, 0],
		[0, smap_step + 1],
		[0, -smap_step - 1],
		[smap_step + 1, 0],
		[-smap_step - 1, 0],
		[0, smap_step / 2],
		[smap_step / 2, 0],
		[0, -smap_step / 2],
		[-smap_step / 2, 0],
	].forEach(function (m) {
		var data = smap_data[map][phash(x + m[0], y + m[1])];
		if (data || data === undefined) {
			safe = false;
		}
	});
	return safe;
}

function is_xy_safe(map, x, y) {
	var safe = true;
	if (smap_data[map] == -1) {
		return true;
	}
	// x=parseInt(x)-(parseInt(x)%smap_step);
	// y=parseInt(y)-(parseInt(y)%smap_step);
	[
		[0, 0],
		[0, 1],
		[0, -1],
		[1, 0],
		[-1, 0],
		[1, 1],
		[-1, 1],
		[1, -1],
		[-1, -1],
	].forEach(function (m) {
		// ,[2,2],[-2,-2],[2,-2],[-2,2]
		var data = smap_data[map][phash(x + m[0] * smap_step, y + m[1] * smap_step)];
		if (data || data === undefined) {
			safe = false;
		}
	});
	return safe;
}

function safe_xy_nearby(map, x, y) {
	var point = false;
	// if(is_xy_safe(map,x,y)) return {x:x,y:y};
	x = smap_round(x);
	y = smap_round(y);
	// [1,0],[0,1],[1,1],[-1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[2,0],[0,2],[2,2],[-2,-2],[-2,0],[0,-2]
	[
		[0, 0],
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
		[2, 0],
		[0, 2],
		[-2, 0],
		[0, -2],
		[3, 0],
		[0, 3],
		[-3, 0],
		[0, -3],
	].forEach(function (m) {
		if (!point && is_xy_safe(map, x + m[0] * smap_step, y + m[1] * smap_step)) {
			point = { x: x + m[0] * smap_step, y: y + m[1] * smap_step };
		}
	});
	return point;
}

function smap_round(x) {
	// for blink, port, magiport
	var x1 = parseInt(x) - (parseInt(x) % smap_step);
	var x2 = x1 + smap_step;
	if (x < 0) {
		x2 = x1 - smap_step;
	}
	if (abs(x - x1) < abs(x - x2)) {
		return x1;
	}
	return x2;
}

function phash(x, y) {
	if (x.x !== undefined) {
		y = x.y;
		x = x.x;
	}
	x = parseInt(x) - (parseInt(x) % smap_step);
	y = parseInt(y) - (parseInt(y) % smap_step);
	return x + "|" + y;
}

// Without rphash, halloween -448.0000001,-158.0000001 rounds to a corner which is a 2
function rphash(x, y) {
	if (x.x !== undefined) {
		y = x.y;
		x = x.x;
	}
	x = smap_round(x);
	y = smap_round(y);
	return x + "|" + y;
}

var smap_data = {};
var smap_step = 10;
var smap_edge = 60; // for smap_step 24, the edge was 40 - also check out access_visualize_smap.js for a visualization
// if(is_sdk) smap_step=24; // 10 takes toooo long [22/06/18]
var hiding_places = [];
function server_bfs(map) {
	if ((precomputed && precomputed.version == G.version) || (precomputed && precomputed.smap_data)) {
		smap_data[map] = precomputed.smap_data[map];
		amap_data[map] = precomputed.amap_data[map];
		return;
	}
	if (G.maps[map].no_bounds) {
		smap_data[map] = -1;
		amap_data[map] = {};
		return;
	}
	if (is_sdk && variables.fast_sdk && !(map == "level1" || map == "arena")) {
		smap_data[map] = -1;
		amap_data[map] = {};
		return;
	}
	server_bfs2(map);
	smap_data[map] = {};
	var queue = [];
	var visited = {};
	var start = 0;
	var level = 0;
	var chiding_places = [];
	function push(x, y, c) {
		x = parseInt(x) - (parseInt(x) % smap_step);
		y = parseInt(y) - (parseInt(y) % smap_step);
		var hash = phash(x, y);
		if (visited[hash] && visited[hash].l <= c) {
			return;
		}
		if (!c && !G.maps[map].pvp && !G.maps[map].instance && Math.random() < 0.01) {
			chiding_places.push([map, x, y]);
		}
		if (c == level) {
			queue.push([x, y]);
		}
		visited[hash] = { l: c, x: x, y: y };
		smap_data[map][hash] = c;
	}
	for (level = 0; level < 7; level++) {
		if (level == 0) {
			G.maps[map].spawns.forEach(function (s) {
				var x = s[0];
				var y = s[1];
				var done = false;
				x = parseInt(x) - (parseInt(x) % smap_step);
				y = parseInt(y) - (parseInt(y) % smap_step);
				var current = [x, y];
				[
					[0, 0],
					[0, smap_step],
					[0, -smap_step],
					[smap_step, 0],
					[-smap_step, 0],
				].forEach(function (m) {
					if (!done && can_move({ map: map, x: x, y: y, going_x: current[0] + m[0], going_y: current[1] + m[1] })) {
						push(current[0] + m[0], current[1] + m[1], level);
						done = true;
					}
				});
			});
		} else {
			for (var h in visited) {
				var e = visited[h];
				if (e.l == level) {
					queue.push([e.x, e.y]);
				}
			}
		}
		while (start < queue.length) {
			if (queue.length > 50000) {
				smap_data[map] = -1;
				server_log(map + " is either un-bounded or the spawn point is too close to an edge", 1);
				return;
			}
			var current = queue[start++];
			[
				[0, smap_step],
				[0, -smap_step],
				[smap_step, 0],
				[-smap_step, 0],
			].forEach(function (m) {
				if (level == 0) {
					if (
						can_move({ map: map, x: current[0], y: current[1], going_x: current[0] + m[0], going_y: current[1] + m[1] })
					) {
						push(current[0] + m[0], current[1] + m[1], level);
					} else {
						push(current[0] + m[0], current[1] + m[1], level + 1);
					}
				} else {
					push(current[0] + m[0], current[1] + m[1], level + 1);
				}
			});
		}
		if (level == 0 && 0) {
			// In the new system, 1 is safe too [01/08/18]
			for (var i = 0; i < (G.maps[map].data.x_lines || []).length; i++) {
				var current = G.maps[map].data.x_lines[i];
				push(current[0], current[1], 0);
				push(current[0], current[2], 0);
				for (var j = current[1]; j < current[2]; j += smap_step) {
					push(current[0], j, 0);
					[
						[0, smap_step],
						[0, -smap_step],
						[smap_step, 0],
						[-smap_step, 0],
					].forEach(function (m) {
						push(current[0] + m[0], j + m[1], 1);
					});
				}
			}
			for (var i = 0; i < (G.maps[map].data.y_lines || []).length; i++) {
				var current = G.maps[map].data.y_lines[i];
				push(current[1], current[0], 0);
				push(current[2], current[0], 0);
				for (var j = current[1]; j < current[2]; j += smap_step) {
					push(j, current[0], 0);
					[
						[0, smap_step],
						[0, -smap_step],
						[smap_step, 0],
						[-smap_step, 0],
					].forEach(function (m) {
						push(j + m[0], current[0] + m[1], 1);
					});
				}
			}
		}
		start = 0;
		queue = [];
	}
	if (chiding_places.length) {
		Array.prototype.push.apply(hiding_places, chiding_places);
	}
}

function amap_round(x) {
	// for blink, port, magiport
	var x1 = parseInt(x) - (parseInt(x) % amap_step);
	var x2 = x1 + amap_step;
	if (x < 0) {
		x2 = x1 - amap_step;
	}
	if (abs(x - x1) < abs(x - x2)) {
		return x1;
	}
	return x2;
}

function phash2(x, y) {
	if (x.x !== undefined) {
		y = x.y;
		x = x.x;
	}
	x = parseInt(x) - (parseInt(x) % amap_step);
	y = parseInt(y) - (parseInt(y) % amap_step);
	return x + "|" + y;
}

function rphash2(x, y) {
	if (x.x !== undefined) {
		y = x.y;
		x = x.x;
	}
	x = amap_round(x);
	y = amap_round(y);
	return x + "|" + y;
}

var amap_data = {};
var amap_step = 8;
function server_bfs2(map) {
	var base = { h: 9, v: 9, vn: 2 };
	var xmult = 1;
	var vhmult = 1;
	amap_data[map] = {}; //new Map(); - Map can't be sent to the Worker! :) [19/08/20]
	var queue = [];
	var visited = {};
	var start = 0;
	var level = 0;
	var chiding_places = [];
	function push(x, y, c) {
		x = parseInt(x) - (parseInt(x) % amap_step);
		y = parseInt(y) - (parseInt(y) % amap_step);
		var hash = phash2(x, y);
		if (visited[hash]) {
			return;
		}
		queue.push([x, y]);
		visited[hash] = 1;
	}
	G.maps[map].spawns.forEach(function (s) {
		var x = s[0];
		var y = s[1];
		var done = false;
		x = parseInt(x) - (parseInt(x) % amap_step);
		y = parseInt(y) - (parseInt(y) % amap_step);
		var current = [x, y];
		[
			[0, 0],
			[amap_step, amap_step],
			[amap_step, -amap_step],
			[-amap_step, -amap_step],
			[-amap_step, amap_step],
			[0, amap_step],
			[0, -amap_step],
			[amap_step, 0],
			[-amap_step, 0],
		].forEach(function (m) {
			if (
				!done &&
				can_move({
					map: map,
					x: x,
					y: y,
					going_x: current[0] + m[0] * xmult,
					going_y: current[1] + m[1] * xmult,
					base: base,
				})
			) {
				push(current[0] + m[0], current[1] + m[1], level);
				done = true;
			}
		});
	});
	while (start < queue.length) {
		if (queue.length > 120000) {
			amap_data[map] = {};
			server_log(map + " is either un-bounded or the spawn point is too close to an edge [server_bfs2]", 1);
			return;
		}
		var current = queue[start++];
		[
			[amap_step, amap_step],
			[amap_step, -amap_step],
			[-amap_step, -amap_step],
			[-amap_step, amap_step],
			[0, amap_step],
			[0, -amap_step],
			[amap_step, 0],
			[-amap_step, 0],
		].forEach(function (m) {
			if (
				can_move({
					map: map,
					x: current[0],
					y: current[1],
					going_x: current[0] + m[0] * xmult,
					going_y: current[1] + m[1] * xmult,
					base: base,
				})
			) {
				push(current[0] + m[0], current[1] + m[1]);
			}
		});
	}
	for (var hash in visited) {
		var x = parseInt(hash.split("|")[0]);
		var y = parseInt(hash.split("|")[1]);
		var count = 0;
		[
			[amap_step, amap_step],
			[amap_step, -amap_step],
			[-amap_step, -amap_step],
			[-amap_step, amap_step],
			[0, amap_step],
			[0, -amap_step],
			[amap_step, 0],
			[-amap_step, 0],
		].forEach(function (m) {
			if (visited[x + m[0] + "|" + (y + m[1])]) {
				count += 1;
			}
		});
		if (count >= 2) {
			amap_data[map][hash] = 1;
		}
	}
	for (var hash in amap_data[map]) {
		var x = parseInt(hash.split("|")[0]);
		var y = parseInt(hash.split("|")[1]);
		var count = 0;
		[
			[amap_step, amap_step],
			[amap_step, -amap_step],
			[-amap_step, -amap_step],
			[-amap_step, amap_step],
			[0, amap_step],
			[0, -amap_step],
			[amap_step, 0],
			[-amap_step, 0],
		].forEach(function (m) {
			if (amap_data[map][x + m[0] + "|" + (y + m[1])]) {
				count += 1;
			}
		});
		amap_data[map][hash] = count;
	}
}

function can_amove(map, sx, sy, tx, ty) {
	if (!amap_data[map][amap_round(tx) + "|" + amap_round(ty)]) {
		return false;
	}

	if (sy == ty) {
		var p = (tx < sx && -1) || 1;
		var step = 8;
		for (var s = 1; s < parseInt(abs((tx - sx) / step)); s++) {
			if (!amap_data[map][amap_round(sx + p * s * step) + "|" + amap_round(ty)]) {
				return false;
			}
		}
	} else if (sx == tx) {
		var p = (ty < sy && -1) || 1;
		var step = 8;
		for (var s = 1; s < parseInt(abs((ty - sy) / step)); s++) {
			if (!amap_data[map][amap_round(tx) + "|" + amap_round(sy + p * s * step)]) {
				return false;
			}
		}
	} else {
		var len = point_distance(sx, sy, tx, ty);
		var p = (tx < sx && -1) || 1;
		var step = 5;
		for (var s = 1; s < parseInt(abs((tx - sx) / step)); s++) {
			var x = sx + p * s * step;
			var y = sy + ((ty - sy) * abs(s * step)) / abs(tx - sx);
			//console.log("x-checks: "+to_pretty_float(x)+","+to_pretty_float(y));
			if (!amap_data[map][amap_round(x) + "|" + amap_round(y)]) {
				return false;
			}
		}
		var p = (ty < sy && -1) || 1;
		var step = 5;
		for (var s = 1; s < parseInt(abs((ty - sy) / step)); s++) {
			var x = sx + ((tx - sx) * abs(s * step)) / abs(ty - sy);
			var y = sy + p * s * step;
			//console.log("y-checks: "+to_pretty_float(x)+","+to_pretty_float(y));
			if (!amap_data[map][amap_round(x) + "|" + amap_round(y)]) {
				return false;
			}
		}
	}
	return true;
}

function random_place(map) {
	var place = random_one(Object.keys(amap_data[map] || {}));
	if (!place) {
		return null;
	}
	var xy = place.split("|");
	return { x: parseInt(xy[0]), y: parseInt(xy[1]), map: map, in: map };
}

function fast_astar(args) {
	var map = args.map;
	var sx = args.sx;
	var sy = args.sy;
	var tx = args.tx;
	var ty = args.ty;
	var heap = vHeap();
	var visited = {};
	var total = 0;
	var start = new Date();
	var best = 999999999999;
	var theone = null;
	var good = false;
	function hpush(cx, cy, fr, dir, bad) {
		// if(visited[cx+"|"+cy]) return;
		var value = point_distance(cx, cy, tx, ty);
		var hash = cx + "|" + cy;
		if (amap_data[map][hash] < 4) {
			bad += 2;
		} else if (amap_data[map][hash] < 6) {
			bad += 1;
		} else if (amap_data[map][hash] < 8) {
			bad += 0.5;
		}
		total += 1;
		// console.log(["hpush",total,cx,cy,bad,value]);
		heap.insert({ value: value + bad * 0.25, x: cx, y: cy, bad: bad, dir: dir });
		visited[hash] = fr;
	}
	function finalise(current) {
		var dx = current.x;
		var dy = current.y;
		path = [[dx, dy]];
		while (visited[dx + "|" + dy] && visited[dx + "|" + dy] != "start") {
			dx = visited[dx + "|" + dy].split("|");
			dy = parseInt(dx[1]);
			dx = parseInt(dx[0]);
			path.push([dx, dy]);
		}
		path.reverse();
		// path.push([tx,ty]); // Looks bad
		dx = path[0][0];
		dy = path[0][1];
		// console.log(path);
		for (
			var i = 1;
			i < path.length;
			i++ // 1ms at max [17/08/20]
		) {
			if (can_amove(map, sx, sy, path[i][0], path[i][1])) {
				dx = path[i][0];
				dy = path[i][1];
			} else {
				break;
			}
		}
		// if(!good && point_distance(sx,sy,dx,dy)<30) return null;
		server_log([total, dx, dy, mssince(start)]);
		return [dx, dy];
	}
	for (var step = 1; step <= 2; step++) {
		if (heap.array.length) {
			break;
		}
		[
			[0, 0, 0, 0],
			[amap_step, amap_step, 0, amap_step * 1.41],
			[amap_step, -amap_step, 1, amap_step * 1.41],
			[-amap_step, -amap_step, 2, amap_step * 1.41],
			[-amap_step, amap_step, 3, amap_step * 1.41],
			[0, amap_step, 4, amap_step],
			[0, -amap_step, 5, amap_step],
			[amap_step, 0, 6, amap_step],
			[-amap_step, 0, 7, amap_step],
		].forEach(function (m) {
			var cx = amap_round(sx + m[0] * step);
			var cy = amap_round(sy + m[1] * step);
			if (amap_data[map][cx + "|" + cy]) {
				hpush(cx, cy, "start", m[2], point_distance(sx, sy, cx, cy));
			}
		});
	}
	while (heap.array.length) {
		if (heap.array.length > 1200 || total > 4000) {
			server_log(["heap", "fast_astar"]);
			if (theone) {
				var result = finalise(theone);
				result.push("bad");
				return result;
			}
			return null;
		}
		var current = heap.removeTop();
		var dist = point_distance(current.x, current.y, tx, ty);
		var rnd = Math.random() * 100;
		// console.log([current.x,current.y,visited[current.x+"|"+current.y]]);
		if (dist < 28) {
			good = true;
			return finalise(current);
		}
		if (dist + current.bad - rnd < best) {
			best = dist + current.bad - rnd;
			theone = current;
		}
		[
			[amap_step, amap_step, 0, amap_step * 1.41],
			[amap_step, -amap_step, 1, amap_step * 1.41],
			[-amap_step, -amap_step, 2, amap_step * 1.41],
			[-amap_step, amap_step, 3, amap_step * 1.41],
			[0, amap_step, 4, amap_step],
			[0, -amap_step, 5, amap_step],
			[amap_step, 0, 6, amap_step],
			[-amap_step, 0, 7, amap_step],
		].forEach(function (m) {
			var cx = current.x + m[0];
			var cy = current.y + m[1];
			if (amap_data[map][cx + "|" + cy] && !visited[cx + "|" + cy]) {
				hpush(cx, cy, current.x + "|" + current.y, m[2], current.bad + m[3] + ((current.dir != m[2] && 0.5) || 0));
			}
		});
	}
	server_log(["no start", "fast_astar"]);
}

function fast_abfs(monster, tx, ty) {
	var map = monster.map;
	var sx = monster.x;
	var sy = monster.y;
	var start = 0;
	var last = 0;
	var queue = [];
	var visited = {};
	var start_t = new Date();
	var best = 999999999999;
	var theone = null;
	var good = false;
	function hpush(cx, cy, fr, dir, bad) {
		var value = point_distance(cx, cy, tx, ty);
		var hash = cx + "|" + cy;
		queue[last++] = { x: cx, y: cy, bad: bad, dir: dir };
		visited[hash] = fr;
	}
	function finalise(current) {
		var dx = current.x;
		var dy = current.y;
		path = [[dx, dy]];
		while (visited[dx + "|" + dy] && visited[dx + "|" + dy] != "start") {
			dx = visited[dx + "|" + dy].split("|");
			dy = parseInt(dx[1]);
			dx = parseInt(dx[0]);
			path.push([dx, dy]);
		}
		path.reverse();
		// path.push([tx,ty]); // Looks bad
		dx = path[0][0];
		dy = path[0][1];
		for (
			var i = 1;
			i < path.length;
			i++ // 1ms at max [17/08/20]
		) {
			if (can_amove(map, sx, sy, path[i][0], path[i][1])) {
				dx = path[i][0];
				dy = path[i][1];
			} else {
				break;
			}
		}
		if (!good && point_distance(sx, sy, dx, dy) < 30) {
			return null;
		}
		server_log([last, dx, dy, mssince(start_t)]);
		return [dx, dy];
	}
	for (var step = 1; step <= 2; step++) {
		if (last) {
			break;
		}
		[
			[sx, sy, 0, 0],
			[amap_step, amap_step, 0, amap_step * 1.41],
			[amap_step, -amap_step, 1, amap_step * 1.41],
			[-amap_step, -amap_step, 2, amap_step * 1.41],
			[-amap_step, amap_step, 3, amap_step * 1.41],
			[0, amap_step, 4, amap_step],
			[0, -amap_step, 5, amap_step],
			[amap_step, 0, 6, amap_step],
			[-amap_step, 0, 7, amap_step],
		].forEach(function (m) {
			var cx = amap_round(sx + m[0] * step);
			var cy = amap_round(sy + m[1] * step);
			if (amap_data[map][cx + "|" + cy]) {
				hpush(cx, cy, "start", m[2], point_distance(sx, sy, cx, cy));
			}
		});
	}
	while (start < last) {
		if (last - start > 1200 || last > 4000) {
			server_log(["queue", "fast_abfs"]);
			monster.bpath = (monster.bpath || 0) + 1;
			if (theone && monster.bpath < 20) {
				return finalise(theone);
			}
			return null;
		}
		var current = queue[start++];
		var dist = point_distance(current.x, current.y, tx, ty);
		var rnd = Math.random() * 100;
		if (dist < 28) {
			monster.bpath = 0;
			good = true;
			return finalise(current);
		}
		if (dist + current.bad - rnd < best) {
			best = dist + current.bad - rnd;
			theone = current;
		}
		[
			[amap_step, amap_step, 0, amap_step * 1.41],
			[amap_step, -amap_step, 1, amap_step * 1.41],
			[-amap_step, -amap_step, 2, amap_step * 1.41],
			[-amap_step, amap_step, 3, amap_step * 1.41],
			[0, amap_step, 4, amap_step],
			[0, -amap_step, 5, amap_step],
			[amap_step, 0, 6, amap_step],
			[-amap_step, 0, 7, amap_step],
		].forEach(function (m) {
			var cx = current.x + m[0];
			var cy = current.y + m[1];
			if (amap_data[map][cx + "|" + cy] && !visited[cx + "|" + cy]) {
				hpush(cx, cy, current.x + "|" + current.y, m[2], current.bad + m[3] + ((current.dir != m[2] && 0.5) || 0));
			}
		});
	}
	server_log(["no start", "fast_abfs"]);
}

function add_call_cost(socket, num, method) {
	if (!socket) {
		socket = 1;
	}
	if (is_number(socket)) {
		num = socket;
		socket = current_socket;
	}
	if (socket.socket) {
		socket = socket.socket;
	} // player
	if (!num) {
		num = 1;
	}
	if (!method) {
		method = ls_method;
	}

	while (socket.calls.length && mssince(socket.calls[0][0]) > 4000) {
		socket.calls.shift();
	} // #TODO: make one operation [27/02/23]

	if (socket.calls.length && socket.calls[socket.calls.length - 1][1] == method && num != -1) {
		socket.calls[socket.calls.length - 1][2] += num;
	} else {
		socket.calls.push([new Date(), method, num == -1 ? 1 : num]);
	}
}

function reduce_call_cost(socket, num) {
	if (!socket) {
		socket = 1;
	}
	if (is_number(socket)) {
		num = socket;
		socket = current_socket;
	}
	if (socket.socket) {
		socket = socket.socket;
	} // player
	if (!num) {
		num = 1;
	}

	if (socket.calls.length && socket.calls[socket.calls.length - 1][1] == ls_method) {
		socket.calls[socket.calls.length - 1][2] -= num;
		if (socket.calls[socket.calls.length - 1][2] <= 0) {
			socket.calls.pop();
		}
	}
}

function get_call_cost(socket) {
	if (!socket) {
		socket = current_socket;
	}
	if (socket.socket) {
		socket = socket.socket;
	} // player

	while (socket.calls.length && mssince(socket.calls[0][0]) > 4000) {
		socket.calls.shift();
	} // #TODO: make one operation [27/02/23]

	var cost = 0;
	socket.calls.forEach(function (c) {
		cost += c[2];
	});
	return cost;
}

function set_direction() {} // compatibility

function symmetricDecrypt(input, key, checkHmac) {
	var aesIv = crypto.createDecipheriv("aes-256-ecb", key, "");
	aesIv.setAutoPadding(false);
	aesIv.end(input.slice(0, 16));
	var iv = aesIv.read();

	var aesData = crypto.createDecipheriv("aes-256-cbc", key, iv);
	aesData.end(input.slice(16));
	var plaintext = aesData.read();

	if (checkHmac) {
		// The last 3 bytes of the IV are a random value, and the remainder are a partial HMAC
		var remotePartialHmac = iv.slice(0, iv.length - 3);
		var random = iv.slice(iv.length - 3, iv.length);
		var hmac = crypto.createHmac("sha1", key.slice(0, 16));
		hmac.update(random);
		hmac.update(plaintext);
		if (!remotePartialHmac.equals(hmac.digest().slice(0, remotePartialHmac.length))) {
			throw new Error("Received invalid HMAC from remote host.");
		}
	}

	return plaintext;
}

function parseAppTicket(ticket) {
	// https://github.com/SteamRE/SteamKit/blob/master/Resources/Structs/steam3_appticket.hsl

	// console.log(ticket);
	if (!ByteBuffer.isByteBuffer(ticket)) {
		ticket = ByteBuffer.wrap(ticket, ByteBuffer.LITTLE_ENDIAN);
	}

	let details = {};

	try {
		let initialLength = ticket.readUint32();
		// console.log(initialLength);
		if (initialLength == 20) {
			// This is a full appticket, with a GC token and session header (in addition to ownership ticket)
			details.authTicket = ticket.slice(ticket.offset - 4, ticket.offset - 4 + 52).toBuffer(); // this is the part that's passed back to Steam for validation

			details.gcToken = ticket.readUint64().toString();
			//details.steamID = new SteamID(ticket.readUint64().toString());
			ticket.skip(8); // the SteamID gets read later on
			details.tokenGenerated = new Date(ticket.readUint32() * 1000);

			if (ticket.readUint32() != 24) {
				// SESSIONHEADER should be 24 bytes.
				return null;
			}

			ticket.skip(8); // unknown 1 and unknown 2
			details.sessionExternalIP = Helpers.ipIntToString(ticket.readUint32());
			ticket.skip(4); // filler
			details.clientConnectionTime = ticket.readUint32(); // time the client has been connected to Steam in ms
			details.clientConnectionCount = ticket.readUint32(); // how many servers the client has connected to

			if (ticket.readUint32() + ticket.offset != ticket.limit) {
				// OWNERSHIPSECTIONWITHSIGNATURE sectlength
				return null;
			}
		} else {
			ticket.skip(-4);
		}

		// Start reading the ownership ticket
		let ownershipTicketOffset = ticket.offset;
		let ownershipTicketLength = ticket.readUint32(); // including itself, for some reason
		if (
			ownershipTicketOffset + ownershipTicketLength != ticket.limit &&
			ownershipTicketOffset + ownershipTicketLength + 128 != ticket.limit
		) {
			return null;
		}

		let i;
		let j;
		let dlc;

		details.version = ticket.readUint32();
		details.steamID = ticket.readUint64().toString();
		details.appID = ticket.readUint32();
		details.ownershipTicketExternalIP = ticket.readUint32();
		details.ownershipTicketInternalIP = ticket.readUint32(); // Helpers.ipIntToString(
		details.ownershipFlags = ticket.readUint32();
		details.ownershipTicketGenerated = new Date(ticket.readUint32() * 1000);
		details.ownershipTicketExpires = new Date(ticket.readUint32() * 1000);
		details.licenses = [];
		// return details;

		let licenseCount = ticket.readUint16();
		for (i = 0; i < licenseCount; i++) {
			details.licenses.push(ticket.readUint32());
		}

		details.dlc = [];

		let dlcCount = ticket.readUint16();
		for (i = 0; i < dlcCount; i++) {
			dlc = {};
			dlc.appID = ticket.readUint32();
			dlc.licenses = [];

			licenseCount = ticket.readUint16();

			for (j = 0; j < licenseCount; j++) {
				dlc.licenses.push(ticket.readUint32());
			}

			details.dlc.push(dlc);
		}

		ticket.readUint16(); // reserved
		if (ticket.offset + 128 == ticket.limit) {
			// Has signature
			details.signature = ticket.slice(ticket.offset, ticket.offset + 128).toBuffer();
		}

		let date = new Date();
		details.isExpired = details.ownershipTicketExpires < date;
		details.hasValidSignature =
			!!details.signature &&
			SteamCrypto.verifySignature(
				ticket.slice(ownershipTicketOffset, ownershipTicketOffset + ownershipTicketLength).toBuffer(),
				details.signature,
			);
		details.isValid = !details.isExpired && (!details.signature || details.hasValidSignature);
	} catch (ex) {
		console.log("parseAppTicket: " + ex);
		return details;
		return null; // not a valid ticket
	}

	return details;
}

var proto = {
	nested: {
		EncryptedAppTicket: {
			fields: {
				ticketVersionNo: { type: "uint32", id: 1 },
				crcEncryptedticket: { type: "uint32", id: 2 },
				cbEncrypteduserdata: { type: "uint32", id: 3 },
				cbEncryptedAppownershipticket: { type: "uint32", id: 4 },
				encryptedTicket: { type: "bytes", id: 5 },
			},
		},
	},
};
var proto_root = protobuf.Root.fromJSON(proto);
var EncryptedAppTicket = proto_root.lookupType("EncryptedAppTicket");

function getClientIp(req) {
	//https://github.com/pbojinov/request-ip/blob/master/index.js
	// NOTE: Back in the day, we had a system called ipass - for some weird and unexplainable reason, no Node server, mainly Socket.io, can track the current IP of a client
	// So the clients needed to ping the game every 40 seconds, at a secondary, http-only handler just to get their IP - and, again, for some extremely weird reason, Node servers, don't let you just easily disconnect a client
	// Rather than auto Keep-Alive, so it had a hacky disconnect routine - all in all, decided to move this system to App Engine, while the SSL refactoring was happening [17/11/18]

	// the ipAddress we return
	var ipAddress;

	// workaround to get real client IP
	// most likely because our app will be behind a [reverse] proxy or load balancer
	var clientIp = req.headers["x-client-ip"];
	var forwardedForAlt = req.headers["x-forwarded-for"];
	var realIp = req.headers["x-real-ip"];

	// more obsure ones below
	var clusterClientIp = req.headers["x-cluster-client-ip"];
	var forwardedAlt = req.headers["x-forwarded"];
	var forwardedFor = req.headers["forwarded-for"];
	var forwarded = req.headers["forwarded"];

	// remote address check
	var reqConnectionRemoteAddress = req.connection ? req.connection.remoteAddress : null;
	var reqSocketRemoteAddress = req.socket ? req.socket.remoteAddress : null;
	var reqConnectionSocketRemoteAddress =
		req.connection && req.connection.socket ? req.connection.socket.remoteAddress : null;
	var reqInfoRemoteAddress = req.info ? req.info.remoteAddress : null;

	// x-client-ip
	if (clientIp) {
		ipAddress = clientIp;
	}

	// x-forwarded-for
	// (typically when your node app is behind a load-balancer (eg. AWS ELB) or proxy)
	else if (forwardedForAlt) {
		// x-forwarded-for may return multiple IP addresses in the format:
		// "client IP, proxy 1 IP, proxy 2 IP"
		// Therefore, the right-most IP address is the IP address of the most recent proxy
		// and the left-most IP address is the IP address of the originating client.
		// source: http://docs.aws.amazon.com/elasticloadbalancing/latest/classic/x-forwarded-headers.html
		var forwardedIps = forwardedForAlt.split(",");
		ipAddress = forwardedIps[0];
	}

	// x-real-ip
	// (default nginx proxy/fcgi)
	else if (realIp) {
		// alternative to x-forwarded-for, used by some proxies
		ipAddress = realIp;
	}

	// x-cluster-client-ip
	// (Rackspace LB and Riverbed's Stingray)
	// http://www.rackspace.com/knowledge_center/article/controlling-access-to-linux-cloud-sites-based-on-the-client-ip-address
	// https://splash.riverbed.com/docs/DOC-1926
	else if (clusterClientIp) {
		ipAddress = clusterClientIp;
	}

	// x-forwarded
	else if (forwardedAlt) {
		ipAddress = forwardedAlt;
	}

	// forwarded-for
	else if (forwardedFor) {
		ipAddress = forwardedFor;
	}

	// forwarded
	else if (forwarded) {
		ipAddress = forwarded;
	}

	// remote address checks
	else if (reqConnectionRemoteAddress) {
		ipAddress = reqConnectionRemoteAddress;
	} else if (reqSocketRemoteAddress) {
		ipAddress = reqSocketRemoteAddress;
	} else if (reqConnectionSocketRemoteAddress) {
		ipAddress = reqConnectionSocketRemoteAddress;
	} else if (reqInfoRemoteAddress) {
		ipAddress = reqInfoRemoteAddress;
	}

	// return null if we cannot find an address
	else {
		ipAddress = null;
	}

	return ipAddress;
}

function deduct_gender(player) {
	if (player.cx && player.cx.head && player.cx.head[0] == "f") {
		return "female";
	}
	return "male";
}

function safe_search(obj, phrase) {
	obj = JSON.parse(safe_stringify(obj));
	for (l1 in obj) {
		var c1 = obj[l1];
		if ((c1 && is_string(c1) && c1.indexOf(phrase) != -1) || l1.indexOf(phrase) != -1) {
			console.log(l1 + " ");
		}
		if (!is_object(c1)) {
			continue;
		}
		for (l2 in c1) {
			var c2 = c1[l2];
			if ((c2 && is_string(c2) && c2.indexOf(phrase) != -1) || l2.indexOf(phrase) != -1) {
				console.log(l1 + " " + l2);
			}
			if (!is_object(c2)) {
				continue;
			}
			for (l3 in c2) {
				var c3 = c2[l3];
				if ((c3 && is_string(c3) && c3.indexOf(phrase) != -1) || l3.indexOf(phrase) != -1) {
					console.log(l1 + " " + l2 + " " + l3);
				}
				if (!is_object(c3)) {
					continue;
				}
				for (l4 in c3) {
					var c4 = c3[l4];
					if ((c4 && is_string(c4) && c4.indexOf(phrase) != -1) || l4.indexOf(phrase) != -1) {
						console.log(l1 + " " + l2 + " " + l3 + " " + l4);
					}
					if (!is_object(c4)) {
						continue;
					}
					for (l5 in c4) {
						var c5 = c4[l5];
						if ((c5 && is_string(c5) && c5.indexOf(phrase) != -1) || l5.indexOf(phrase) != -1) {
							console.log(l1 + " " + l2 + " " + l3 + " " + l4 + " " + l5);
						}
						if (!is_object(c5)) {
							continue;
						}
						for (l6 in c5) {
							var c6 = c5[l6];
							if ((c6 && is_string(c6) && c6.indexOf(phrase) != -1) || l6.indexOf(phrase) != -1) {
								console.log(l1 + " " + l2 + " " + l3 + " " + l4 + " " + l5 + " " + l6);
							}
							if (!is_object(c6)) {
								continue;
							}
							for (l7 in c6) {
								var c7 = c6[l7];
								if ((c7 && is_string(c7) && c7.indexOf(phrase) != -1) || l7.indexOf(phrase) != -1) {
									console.log(l1 + " " + l2 + " " + l3 + " " + l4 + " " + l5 + " " + l6 + " " + l7);
								}
								if (!is_object(c7)) {
									continue;
								}
								for (l8 in c7) {
									var c8 = c7[l8];
									if ((c8 && is_string(c8) && c8.indexOf(phrase) != -1) || l8.indexOf(phrase) != -1) {
										console.log(l1 + " " + l2 + " " + l3 + " " + l4 + " " + l5 + " " + l6 + " " + l7 + " " + l8);
									}
									if (!is_object(c8)) {
										continue;
									}
									for (l9 in c8) {
										var c9 = c8[l9];
										if ((c9 && is_string(c9) && c9.indexOf(phrase) != -1) || l9.indexOf(phrase) != -1) {
											console.log(
												l1 + " " + l2 + " " + l3 + " " + l4 + " " + l5 + " " + l6 + " " + l7 + " " + l8 + " " + l9,
											);
										}
										if (!is_object(c9)) {
											continue;
										}
										for (l10 in c9) {
											var c10 = c9[l10];
											if ((c10 && is_string(c10) && c10.indexOf(phrase) != -1) || l10.indexOf(phrase) != -1) {
												console.log(
													l1 +
														" " +
														l2 +
														" " +
														l3 +
														" " +
														l4 +
														" " +
														l5 +
														" " +
														l6 +
														" " +
														l7 +
														" " +
														l8 +
														" " +
														l9 +
														" " +
														l10,
												);
											}
											if (!is_object(c10)) {
												continue;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

/* eslint-disable no-misleading-character-class,no-control-regex */
function strip_string(str) {
	var regexSymbolWithCombiningMarks =
		/([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g;
	var regexLineBreakCombiningMarks =
		/[\0-\x08\x0E-\x1F\x7F-\x84\x86-\x9F\u0300-\u034E\u0350-\u035B\u0363-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u061C\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u200C\u200E\u200F\u202A-\u202E\u2066-\u206F\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3035\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFFF9-\uFFFB]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDCA-\uDDCC\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDF00-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E\uDCA0-\uDCA3]|\uD834[\uDD65-\uDD69\uDD6D-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDC01\uDC20-\uDC7F\uDD00-\uDDEF]/g;
	// https://github.com/mathiasbynens/strip-combining-marks/blob/master/strip-combining-marks.js
	return str
		.replace(regexLineBreakCombiningMarks, "")
		.replace(regexSymbolWithCombiningMarks, "$1")
		.replace(/[^\p{L}\p{N}\p{S}\p{P}\p{Z}]/gu, ""); // https://stackoverflow.com/a/63464318/914546
}
/* eslint-enable no-misleading-character-class,no-control-regex */

// #HARDCORE

var hardcore_done = false;
function hardcore_loop() {
	if (hardcore_done) {
		return;
	}
	var m = 0;
	for (var id in players) {
		if (players[id].level > m) {
			E.rewards.leader = players[id].name;
			m = players[id].level;
		}
	}
	if (E.minutes) {
		E.minutes -= 1;
	} else {
		hardcore_done = true;
		send_hardcore_rewards();
		shutdown_routine();
	}
	broadcast("hardcore_info", { E: E });
}

// #ACHIEVEMENTS

function send_hardcore_rewards() {
	rd = [
		["leader", "Leadership", { name: "xbox", q: 1 }],
		["item8", "First +8 Item", { name: "armorbox", q: 10 }],
		["item9", "First +9 Item", { name: "weaponbox", q: 10 }],
		["item10", "First +X Item", { name: "armorbox", q: 100 }],
		["item11", "First +Y Item", { name: "armorbox", q: 100 }],
		["item12", "First +Z Item", { name: "scroll3", q: 1 }],
		["accessory5", "First +V Accessory", { name: "armorbox", q: 50 }],
		["accessory6", "First +S Accessory", { name: "cscroll3", q: 1 }],
		["first_warrior_70", "First Warrior to Level 70", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_paladin_70", "First Paladin to Level 70", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_priest_70", "First Priest to Level 70", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_mage_70", "First Mage to Level 70", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_rogue_70", "First Rogue to Level 70", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_ranger_70", "First Ranger to Level 70", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_franky", "First Franky Kill", { name: "brownegg", q: 1 }],
		["first_stompy", "First Stompy Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_ent", "First Ent Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_wabbit", "First Wabbit Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_fvampire", "First Ms.Vampire Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_mvampire", "First Mr.Vampire Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_skeletor", "First Skeletor Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
		["first_goo", "First Goo Kill", { name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }],
	];
	rd.forEach(function (r) {
		if (E.rewards[r[0]]) {
			appengine_call("send_mail", {
				subject: "HARDCORE: Congratulations!",
				message: "Reward for " + r[1],
				type: "system",
				rid: randomStr(50),
				to: E.rewards[r[0]],
				item: JSON.stringify(r[2]),
				retries: 8,
			});
		}
	});
	for (var id in players) {
		save_player(players[id]);
	}
	var sent = {};
	for (var id in P) {
		var p = P[id];
		if (p.auth_id && p.level >= 60 && !sent[p.auth_id]) {
			sent[p.auth_id] = true;
			appengine_call("send_mail", {
				subject: "HARDCORE: Congratulations!",
				message: "Reward for Participation",
				type: "system",
				rid: randomStr(50),
				to: p.name,
				item: JSON.stringify({ name: (Math.random() < 0.1 && "gift0") || "gift1", q: 1 }),
			});
		}
	}
}

function add_achievement(player, name) {
	player.p.achievements[name] = (player.p.achievements[name] || 0) + 1;
	player.socket.emit("achievement_success", { name: name });
}

function item_achievement_increment(player, item, ach, amount) {
	if (!G.achievements[ach] || !item) {
		return;
	}
	if (item.ach != ach || !item.acc) {
		item.acc = 0;
	}
	var needed = G.achievements[ach].count;
	var old = item.acc;
	var rr = G.achievements[ach].rr || 1;
	item.ach = ach;
	item.acc += amount || 1;
	if (item.acc < needed) {
		if (parseInt(old / rr) != parseInt(item.acc / rr)) {
			player.socket.emit("achievement_progress", { name: ach, count: item.acc, needed: needed });
		}
	} else {
		add_item_property(item, G.achievements[ach].title);
		delete item.ach;
		delete item.acc;
		add_achievement(player, ach);
		cache_player_items(player);
		resend(player, "u+cid+reopen");
	}
}

function achievement_logic_monster_damage(player, monster, damage) {
	try {
		if (monster.type == "grinch") {
			item_achievement_increment(player, player.slots.cape, "festive", damage);
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_monster_kill(player, monster) {
	try {
		if (gameplay == "hardcore") {
			var announce = false;
			["ent", "stompy", "franky", "fvampire", "mvampire", "skeletor", "goo"].forEach(function (m) {
				if (monster.type == m && !E.rewards["first_" + m] && E.minutes) {
					E.rewards["first_" + m] = player.name;
					announce = true;
				}
			});
			if (announce) {
				broadcast("hardcore_info", { E: E, achiever: player.name });
			}
		} else {
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_level(player) {
	try {
		if (gameplay == "hardcore") {
			var announce = false;
			["warrior", "paladin", "priest", "mage", "ranger", "rogue", "wabbit"].forEach(function (c) {
				if (player.type == c && player.level >= 70 && !E.rewards["first_" + c + "_70"] && E.minutes) {
					E.rewards["first_" + c + "_70"] = player.name;
					announce = true;
				}
			});
			if (announce) {
				broadcast("hardcore_info", { E: E, achiever: player.name });
			}
		} else {
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_compound_success(player, item) {
	try {
		if (gameplay == "hardcore") {
			var announce = false;
			if (item.level == 5 && !E.rewards.accessory5 && E.minutes) {
				E.rewards.accessory5 = player.name;
				announce = true;
			}
			if (item.level == 6 && !E.rewards.accessory6 && E.minutes) {
				E.rewards.accessory6 = player.name;
				announce = true;
			}
			if (announce) {
				broadcast("hardcore_info", { E: E, achiever: player.name });
			}
		} else {
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_upgrade_success(player, item) {
	try {
		if (gameplay == "hardcore") {
			var announce = false;
			if (item.level == 8 && !E.rewards.item8 && E.minutes) {
				E.rewards.item8 = player.name;
				announce = true;
			}
			if (item.level == 9 && !E.rewards.item9 && E.minutes) {
				E.rewards.item9 = player.name;
				announce = true;
			}
			if (item.level == 10 && !E.rewards.item10 && E.minutes) {
				E.rewards.item10 = player.name;
				announce = true;
			}
			if (item.level == 11 && !E.rewards.item11 && E.minutes) {
				E.rewards.item11 = player.name;
				announce = true;
			}
			if (item.level == 12 && !E.rewards.item12 && E.minutes) {
				E.rewards.item12 = player.name;
				announce = true;
			}
			if (announce) {
				broadcast("hardcore_info", { E: E, achiever: player.name });
			}
		} else {
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_monster_last_hit(player, monster) {
	try {
		if (server.shutdown) {
			return;
		}
		if (player.slots.mainhand) {
			delete player.slots.mainhand.ach;
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_monster_hit(monster, player, attack) {
	try {
		if (monster.type == "stompy" && !monster.target) {
			item_achievement_increment(player, player.slots.helmet, "stomped");
		} else if (monster.type != "stompy" && player.slots.helmet) {
			delete player.slots.helmet.ach;
		}

		if (monster.type == "goo" || monster.type == "cgoo") {
			item_achievement_increment(player, player.slots.pants, "gooped", attack);
		}
	} catch (e) {
		console.log("#A: " + e);
	}
}

function achievement_logic_burn_last_hit(player) {
	try {
		if (server.shutdown) {
			return;
		}
		item_achievement_increment(player, player.slots.mainhand, "firehazard");
	} catch (e) {
		console.log("#A: " + e);
	}
}
