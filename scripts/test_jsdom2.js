const jsdom=require("jsdom");
const { JSDOM }=jsdom;
const virtualConsole=new jsdom.VirtualConsole();

const url="http://thegame.com/character/Fun/in/EU/I/?no_html=1&&code=MOVETEST&&auth="+"5818821692620800-gjxqztPovvpiaKTGnjEtT";
const options={
	url:url,
	pretendToBeVisual:true,
	resources:'usable',
	runScripts:'dangerously',
	virtualConsole
}
dom=JSDOM.fromURL(url,options);

virtualConsole.on("error", (...args) => { console.log(args); });
virtualConsole.on("warn", (...args) => { console.log(args); });
virtualConsole.on("info", (...args) => { console.log(args); });
virtualConsole.on("dir", (...args) => { console.log(args); });

setInterval(function(){
},1);