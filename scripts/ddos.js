var io=require('socket.io-client');
var num=0;
function connect()
{
	// var socket=io('ws://0.0.0.0:8090');
	var socket=io('ws://138.201.60.196:2053');
	socket.num=num++;
	socket.on('connect', function(){console.log("Connected");});
	socket.on('event', function(data){console.log("Event");});
	socket.on('disconnect', function(){console.log("Disonnected");});
	socket.on('connect_error',function(error){
		console.log("Error: "+error);
	});
	socket.on('entities',function(){
		console.log("Entities on :"+socket.num);
	});
	socket.emit("loaded",{success:1,width:1920,height:1080,scale:2});
}

for(var i=0;i<100;i++)
{
	setTimeout(function(){
		connect();
	},i*2000)
}

setTimeout(function(){
	// process.exit();
},60000);