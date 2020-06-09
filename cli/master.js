const { Worker, SHARE_ENV } = require('worker_threads');
// parent.api_call("cli_time") to purchase 7 days for 29 shells. The rates will go up
// IMPORTANT: RUN AS
// node --expose-gc master.js
// for global.gc();
var G=null;
var fs=require("fs");
eval(""+fs.readFileSync("common_functions.js")); // Manually copy/paste common_functions.js from libraries/ to this directory
eval(""+fs.readFileSync("functions.js"));

var auth="5818821692620800-gjxqztPovvpiaKTGnjEtT"; // show_json(parent.Cookies.get("auth"))
var characters=[
	{
		"name":"Wizard",
		"region":"EU",
		"server":"I",
		"code":"PhoenixHunter",
		//"code":"Performance Tests",
		"run":false,
	},
	// {
	// 	"name":"Fun",
	// 	"region":"EU",
	// 	"server":"I",
	// 	"code":"Phoenix Hunter",
	// 	"run":false,
	// },
	// {
	// 	"name":"Healer",
	// 	"region":"EU",
	// 	"server":"I",
	// 	"code":"Phoenix Hunter",
	// 	"run":false,
	// }
];

function run_character(workerData)
{
	console.log(workerData);
	const worker = new Worker('./character.js', { workerData:workerData, env: SHARE_ENV, execArgv:["expose-gc","inspect"]});
	worker.on('message',function(data){
		if(data.type=="update")
			this.character.last_update=new Date();
		else if(data.type=="smart_move")
		{
			G=data.G;
			console.log("[CLI] SMART_MOVE");
			smart.moving=true;
			smart.plot=[]; smart.flags={}; smart.searching=smart.found=false;
			character.x=character.real_x=data.start_x;
			character.y=character.real_y=data.start_y;
			character.map=data.start_map;
			smart.x=data.x;
			smart.y=data.y;
			smart.map=data.map;
			start_pathfinding();
			console.log("[CLI] SMART_MOVE_RESULT: "+smart.found);
			console.log(smart.plot);
			worker.postMessage({type:"smart_move",found:smart.found,plot:smart.plot});
		}
		else if(data.type=="kill") process.exit();
	});
	worker.on('error',function(data){
		console.log("[MASTER] "+this.character.name+" error: "+data);
	});
	worker.on('exit',function(code){
		if (code !== 0)
			console.log("[MASTER] "+this.character.name+" stopped with code: "+code);
		worker.character.run=false;
	});
	return worker;
}

setInterval(function(){

	var current=new Date(),delay=false;

	characters.forEach(function(character){
		if(character.run && (current-character.last_update)>40000)
		{
			console.log("[MASTER] Reloading "+character.name);
			character.run=false;
			character.worker.terminate();
			delay=true;
		}
	});

	if(delay) return; // worker.on('exit') needs to fire first

	characters.forEach(function(character){
		if(!character.run)
		{
			if(!character.auth) character.auth=auth;
			character.run=true;
			character.last_update=new Date();
			delete character.worker;
			var workerData={}; Object.assign(workerData,character);
			character.worker=run_character(workerData);
			character.worker.character=character;
		}
	});

},100);

setInterval(function(){
	if (process.memoryUsage().heapUsed > 300000000) {
		global.gc();
		console.log("[MASTER] Manual GC");
	}
},20000);
