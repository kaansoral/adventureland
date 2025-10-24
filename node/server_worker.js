var variables = require("./variables");
var fs = require("fs");
eval("" + fs.readFileSync(variables.cfunctions_path));
eval("" + fs.readFileSync(variables.functions_path));
var {  parentPort } = require("worker_threads");

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
