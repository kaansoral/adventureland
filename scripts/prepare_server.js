var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
f.execs("rm -rf ~/deploy/server");
f.execs("mkdir ~/deploy/server");
f.execs("cp -r ~/thegame/node/* ~/deploy/server");
f.execs("rm -rf ~/deploy/server/node_modules");
f.execs("rm ~/deploy/server/variables.js");
f.execs("mv ~/deploy/server/live_variables.js ~/deploy/server/variables.js");
f.execs("cp ~/thegame/js/common_functions.js ~/deploy/server");