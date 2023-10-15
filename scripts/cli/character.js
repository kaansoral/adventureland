var { workerData, parentPort } = require('worker_threads');
if(!workerData) // for chrome://inspect with "node --expose-gc --inspect character.js"
{
	workerData={
		"name":"NewWarrior",
		"region":"EU",
		"server":"I",
		"code":"cli_tests",
		"auth":"5818821692620800-gjxqztPovvpiaKTGnjEtT",
	};
	parentPort={postMessage:function(){},on:function(){}};

	//jsdomDevtoolsFormatter = require('jsdom-devtools-formatter');
	//jsdomDevtoolsFormatter.install();
}
// In CODE, you can: parent.CLI_OUT.push({"type":"custom_type",data:{}}) - it's propagated to the below routine, and if not handled, to master.js
console.log(workerData.name);
global.gc();

var jsdom,request,localstorager,localStorage=null;
try{
	jsdom=require("jsdom");
}catch(e){
	console.log("You need to run: npm install jsdom");
	process.exit();
}
var { JSDOM }=jsdom;
try{
	request=require('request');
}catch(e){
	console.log("You need to run: npm install request");
	process.exit();
}
try{
	localstorager=require('node-localstorage').LocalStorage;
	localStorage=new localstorager("./storage");
}catch(e){
	console.log("You need to run: npm install node-localstorage for functioning localStorage support!");
}

var base_url="http://thegame.com";

var url=base_url+"/character/"+workerData.name+"/in/"+workerData.region+"/"+workerData.server+"/?no_html=bot&is_bot=1&is_cli=1&code="+workerData.code+"&auth="+workerData.auth;
var dom=false,code_active=false;

request(url, (error, response, body) => {
	var virtualConsole=new jsdom.VirtualConsole();
	virtualConsole.sendTo(console);

	var options={
		url:url,
		pretendToBeVisual:true,
		includeNodeLocations: true,
		resources:'usable',
		runScripts:'dangerously',
		virtualConsole:virtualConsole,
		beforeParse:function(window){}
	}
	dom=new JSDOM(body,options);
	dom.name=workerData.name;
	if(localStorage && !dom.window.ls_emulation) dom.window.ls_emulation=localStorage;
	dom.window.cli_require=require;
	//console.log(dom.window.document.body.innerHTML);
});

setInterval(function(){
	if(!dom || !dom.window.game_logs) return;
	if(dom.window.character) dom.name=dom.window.character.name;

	dom.window.game_logs.forEach(function(l){
		console.log(dom.name+"[LOG] "+l[0]);
	});
	dom.window.game_logs=[];
	dom.window.game_chats.forEach(function(c){
		console.log(dom.name+"[CHAT] "+c[0]+": "+c[1]);
	});
	dom.window.game_chats=[];
	dom.window.CLI_OUT.forEach(function(m){
		if(m.type=="kill") process.exit(1);
		else if(m.type=="time_kill")
		{
			console.log("[CLI] You need to purchase CLI time from the Main Menu (currently: parent.api_call(\"cli_time\"))");
			parentPort.postMessage({"type":"kill"});
		}
		else parentPort.postMessage(m);
	});
	dom.window.CLI_OUT=[];
	if(!code_active && dom.window.code_active) code_active=true,parentPort.postMessage({"type":"code_active"});
},10);

parentPort.on("message",function(data){
	dom.window.CLI_IN.push(data);
});

setInterval(function(){
	if(dom && dom.window.character && dom.window.socket && (new Date()-dom.window.last_ping)<30000)
		parentPort.postMessage({type:"update"});
},1000);

setInterval(function(){
	if (process.memoryUsage().heapUsed > 150000000) {
		global.gc(true);
		console.log("["+workerData.name+"] Manual GC");
	}
},20000);

process.on('unhandledRejection', (reason, p) => {
	// console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});