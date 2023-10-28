var is_game = 0;
var is_server = 1;
var is_code = 0;
var variables = require("./variables");
var is_sdk = variables.is_sdk;
var fs = require("fs");
eval("" + fs.readFileSync(variables.cfunctions_path));
eval("" + fs.readFileSync(variables.functions_path));
var { workerData, parentPort } = require("worker_threads");
var G = workerData.G;
var smap_data = workerData.smap_data;
var amap_data = workerData.amap_data;

parentPort.on("message", function (data) {
	try {
		//console.log(data);
		if (data.type == "fast_astar") {
			parentPort.postMessage({ type: "monster_move", move: fast_astar(data), id: data.id, in: data.in });
		}
		if (data.type == "exit") {
			process.exit();
		}
	} catch (e) {
		console.log(e);
	}
});

setInterval(function () {}, 10);
