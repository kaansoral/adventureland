var is_game = 0;
var is_server = 0;
var is_code = 0;
var variables = require("./variables");
var is_sdk = variables.is_sdk;
var fs = require("fs");
var precomputed = null;
eval("" + fs.readFileSync(variables.cfunctions_path));
eval("" + fs.readFileSync(variables.functions_path));
var mode = {};
var server_id = "precompute";
var server_auth = "123456";
var base_url = variables.base_url;

appengine_call("reload_server", { keyword: variables.keyword }, function (result) {
	if (result.failed) {
		return;
	}
	G = result.game;
	var start = new Date();
	for (var mname in G.maps) {
		if (G.maps[mname].ignore) {
			continue;
		}
		var cstart = new Date();
		server_bfs(mname);
		console.log("Precomputed: " + mname + " in " + mssince(cstart) + "ms");
	}
	console.log("Done: " + mssince(start) + "ms");
	var precomputed = {};
	precomputed.version = G.version;
	precomputed.amap_data = amap_data;
	precomputed.smap_data = smap_data;
	fs.writeFileSync(variables.data_path, "var precomputed=" + JSON.stringify(precomputed) + ";");
});
