var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
require(process.env.HOME+"/thegame/scripts/data.js");

servers.forEach(function(server){
	var machine=machines[server.machine];
	var command="ssh -i "+machine.key+" "+machine.user+"@"+machine.ip+" \"nohup node server/server.js "+server.region+" "+server.name+" "+server.port+" > s"+server.port+".out 2> s"+server.port+".err < /dev/null &\"";
	console.log(command);
	f.execso(command);
});