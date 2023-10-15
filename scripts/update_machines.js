var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
require(process.env.HOME+"/thegame/scripts/data.js");

f.execso("node ~/gscripts/prepare_server.js;");
console.log("\nPrepared the server");

for(var id in machines)
{
	var machine=machines[id];
	// var command="scp -qv -r -i "+machine.key+" ~/deploy/server "+machine.user+"@"+machine.ip+":./ 2>&1 | grep -e 'Sending file modes' -e 'Exit status'";
	var command="rsync -ru --exclude='node_modules/' ~/deploy/server -i "+machine.key+" "+machine.user+"@"+machine.ip+":./";
	//var command="rsync -ru ~/deploy/server -e \"ssh -i "+machine.key+"\" "+machine.user+"@"+machine.ip+":./";
	// Spent 50 minutes on perfecting the scp output, bastards didn't provide a non-interactive output argument ... [05/08/18]
	// command+=" > /tmp/scp.log 2>&1";
	console.log("\nRunning: "+command);
	f.execso(command);
	//f.execso("cat /tmp/scp.log");
}