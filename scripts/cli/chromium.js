var puppeteer = require('puppeteer');
var { workerData, parentPort } = require('worker_threads');
if(!workerData) // for chrome://inspect with "node --expose-gc --inspect character.js"
{
	workerData={
		"name":"Wizard",
		"region":"EU",
		"server":"I",
		"code":"PhoenixHunter",
		"auth":"5818821692620800-gjxqztPovvpiaKTGnjEtT",
	};
	parentPort={postMessage:function(){},on:function(){}};

	//jsdomDevtoolsFormatter = require('jsdom-devtools-formatter');
	//jsdomDevtoolsFormatter.install();
}
// In CODE, you can: parent.CLI_OUT.push({"type":"custom_type",data:{}}) - it's propagated to the below routine, and if not handled, to master.js

var base_url="http://thegame.com";

var url=base_url+"/character/"+workerData.name+"/in/"+workerData.region+"/"+workerData.server+"/?no_html=1&code="+workerData.code+"&auth="+workerData.auth;
var dom=false,code_active=false;

(async () => {
	console.log(workerData.name);
	const browser = await puppeteer.launch({args:["--disable-gpu","--disable-gpu-compositing","--disable-accelerated-2d-canvas","--ignore-gpu-blacklist","--headless"]});
	const page = await browser.newPage();
	page.on('console', msg => console.log('PAGE LOG:', msg.text()));
	await page.goto(url);
	console.log("Loaded page.");
})();

setInterval(function(){

},1);