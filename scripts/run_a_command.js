var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
require(process.env.HOME+"/thegame/scripts/data.js");

for(var id in machines)
{
	var machine=machines[id];
	var single_command="npm install socket.io@2.1.1";
	var single_command="sudo apt-get update";
	var single_command="sudo apt-get -y upgrade";
	var single_command="sudo shutdown";
	var single_command="sudo n latest";
	var single_command="sudo killall -s KILL node";
	var single_command="ps aux | grep -i node | awk '{print $2}' | xargs  kill -9";
	// var single_command="npm install socket.io@2.1.1";
	var command="ssh -i "+machine.key+" "+machine.user+"@"+machine.ip+" \""+single_command+"\"";
	console.log(command);
	f.execso(command);
}