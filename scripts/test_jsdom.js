const jsdom=require("jsdom");
const { JSDOM }=jsdom;
const request=require('request');

var base_url="http://thegame.com";
var auth="5818821692620800-gjxqztPovvpiaKTGnjEtT";
var characters=[["Fun","MOVETEST"],["Wizard",1]];
var doms=[],num=0;

characters.forEach(function(def){

	var character=def[0],code=def[1];
	var url=base_url+"/character/"+character+"/in/EU/I/?no_html=bot&&code="+code+"&&auth="+auth;

	request(url, (error, response, body) => {

		var virtualConsole=new jsdom.VirtualConsole();
		virtualConsole.sendTo(console);

		var options={
			url:url,
			pretendToBeVisual:true,
			resources:'usable',
			runScripts:'dangerously',
			virtualConsole:virtualConsole,
			beforeParse:function(window){}
		}
		var dom=new JSDOM(body,options);
		dom.name=num++;
		doms.push(dom);
		//console.log(dom.window.document.body.innerHTML);
	});
	// #TODO: Reload on disconnects
});

setInterval(function(){
	doms.forEach(function(dom){
		if(!dom.window.game_logs) return;
		if(dom.window.character) dom.name=dom.window.character.name;
		dom.window.game_logs.forEach(function(l){
			console.log(dom.name+"[LOG] "+l[0]);
		});
		dom.window.game_logs=[];
		dom.window.game_chats.forEach(function(c){
			console.log(dom.name+"[CHAT] "+c[0]+": "+c[1]);
		});
		dom.window.game_chats=[];
	});
},10);