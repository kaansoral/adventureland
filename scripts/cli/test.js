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

localStorage.setItem("gg",10);

//setInterval(function(){
//	console.log(localStorage.getItem("gg"));
//},3000);

return;
function test1(){ var a=[]; for(var i=0;i<10000;i++) a.push(i); setTimeout(function(){ test1() },1); }

if(0)
{
	for(var i=0;i<100;i++) test1();
}

if(1)
{
	const jsdom=require("jsdom");
	const { JSDOM }=jsdom;

	var options={
		url:"http://gg.com",
		pretendToBeVisual:true,
		includeNodeLocations: true,
		resources:'usable',
		runScripts:'dangerously',
		beforeParse:function(window){}
	}
	dom=new JSDOM('<script>function test1(){ var t=setTimeout(function(){ test1() },1); }; test1(); </script>',options);
}