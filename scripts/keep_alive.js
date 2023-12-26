var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
require(process.env.HOME+"/thegame/scripts/data.js");

setInterval(function(){
	for(var id in machines)
	{
		try{
			var machine=machines[id];
			var command="ssh -i "+machine.key+" "+machine.user+"@"+machine.ip+" \"ps aux | grep node\"";
			var output=f.execs(command);
			if(output.indexOf("root")==-1) return;
			servers.forEach(function(server){
				if(server.machine!=id) return;
				var name=server.region+" "+server.name+" "+server.port;
				if(output.indexOf("node server/server.js "+server.region+" "+server.name+" "+server.port)==-1)
				{
					console.log("Server not running: "+name);
					var command="ssh -i "+machine.key+" "+machine.user+"@"+machine.ip+" \"nohup node server/server.js "+server.region+" "+server.name+" "+server.port+" > s"+server.port+".out 2> s"+server.port+".err < /dev/null &\"";
					console.log(command);
					f.execso(command);
				}
				else
				{
					//console.log("Server running: "+name);
				}
			});
		}catch(e){}
	}
},10000);