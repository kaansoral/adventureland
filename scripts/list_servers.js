var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
require(process.env.HOME+"/thegame/scripts/data.js");

for(var id in machines)
{
	var machine=machines[id];
	var command="ssh -i "+machine.key+" "+machine.user+"@"+machine.ip+" \"ps aux | grep node\"";
	console.log(command);
	f.execso(command);
}