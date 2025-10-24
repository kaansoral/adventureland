var false_socket = {
	emit: function (a, b) {
		if (is_sdk && !server.shutdown) {
			console.log([a, b]);
		}
	},
	total_calls: 0,
	calls: [],
};

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
