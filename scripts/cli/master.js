const { Worker, SHARE_ENV } = require('worker_threads');
// parent.api_call("cli_time") to purchase 7 days for 29 shells. The rates will go up
// IMPORTANT: RUN AS
// node --expose-gc master.js
// for global.gc();
var G=null;
var fs=require("fs");
eval(""+fs.readFileSync("../../js/common_functions.js")); // Manually copy/paste common_functions.js from libraries/ to this directory
eval(""+fs.readFileSync("functions.js"));

var auth="5818821692620800-gjxqztPovvpiaKTGnjEtT"; // show_json(parent.Cookies.get("auth"))
var characters=[
	{
		"name":"GG",
		"region":"EU",
		"server":"I",
		"code":"local_cm_receiver",
	},
	{
		"name":"MERC",
		"region":"EU",
		"server":"I",
		"code":"local_cm_sender",
	},
];

function run_character(workerData)
{
	console.log(workerData);
	const worker = new Worker('./character.js', { workerData:workerData, env: SHARE_ENV, execArgv:["expose-gc","inspect"]});
	worker.on('message',function(data){
		if(data.type=="update")
			worker.info.last_update=new Date();
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
		else if(data.type=="cm")
		{
			var sent=false;
			characters.forEach(function(char_info){
				if(char_info.run && char_info.name==data['to'])
				{
					char_info.worker.postMessage(data);
					sent=true;
				}
			});
			if(!sent) console.log("[UNSENT CM] TO: "+data['to']);
		}
		else if(data.type=="code_active")
		{
			worker.info.code_active=true;
			worker.postMessage({type:"hello","from":"master.js"});
		}
		else if(data.type=="kill") process.exit();
	});
	worker.on('error',function(data){
		console.log("[MASTER] "+worker.info.name+" error: "+data);
	});
	worker.on('exit',function(code){
		if (code !== 0)
			console.log("[MASTER] "+worker.info.name+" stopped with code: "+code);
		worker.info.run=false;
	});
	return worker;
}

setInterval(function(){

	var current=new Date(),delay=false;

	characters.forEach(function(info){
		if(info.run && (current-info.last_update)>40000)
		{
			console.log("[MASTER] Reloading "+info.name);
			info.run=false;
			info.code_active=false;
			info.worker.terminate();
			delay=true;
		}
	});

	if(delay) return; // worker.on('exit') needs to fire first

	characters.forEach(function(info){
		if(!info.run)
		{
			if(!info.auth) info.auth=auth;
			info.run=true;
			info.code_active=false;
			info.last_update=new Date();
			delete info.worker;
			var workerData={}; Object.assign(workerData,info);
			info.worker=run_character(info);
			info.worker.info=info;
		}
	});

},100);

setInterval(function(){
	if (process.memoryUsage().heapUsed > 300000000) {
		global.gc();
		console.log("[MASTER] Manual GC");
	}
},20000);