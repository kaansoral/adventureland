// creates a python3 project to safely test a python3 environment [27/01/24]

var path=require("path"),f=require(path.resolve(__dirname, "functions.js"));

f.execs("rm -rf ~/deploy/python3/thegame");
f.execs("mkdir ~/deploy/python3/thegame");
//f.execs("cp -r ~/thegame/* ~/deploy/python3/thegame");
f.execs("rsync -rv --exclude=.electron ~/thegame/* ~/deploy/python3/thegame"); // steamworkds_sdk is problematic to cp [11/02/19]

f.execs("rm -rf ~/deploy/python3/thegame/node");
f.execs("rm -rf ~/deploy/python3/thegame/scripts");
f.execs("cp -f ~/deploy/python3/thegame/python3/app.yaml ~/deploy/python3/thegame/app.yaml");
f.execs("cp -f ~/deploy/python3/thegame/python3/requirements.txt ~/deploy/python3/thegame/requirements.txt");
f.execs("rm -rf ~/deploy/python3/thegame/lib");
f.execs("mkdir ~/deploy/python3/thegame/lib");
f.execs("rm -rf ~/deploy/python3/thegame/origin");
f.execs("rm -rf ~/deploy/python3/thegame/electron");
f.execs("find ~/deploy/python3/thegame/ -name '*.pxm' -delete");

f.execs("cp ~/deploy/python3/thegame/js/runner_functions.js ~/deploy/python3/thegame/htmls/contents/codes/runner_functions.js");
f.execs("cp ~/deploy/python3/thegame/js/runner_compat.js ~/deploy/python3/thegame/htmls/contents/codes/runner_compat.js");
f.execs("cp ~/deploy/python3/thegame/js/common_functions.js ~/deploy/python3/thegame/htmls/contents/codes/common_functions.js");

// f.write_file("~/deploy/python3/thegame/app.yaml",f.read_file("~/thegame/app.yaml").replace("application:","#application:").replace("version:","#version:"));
