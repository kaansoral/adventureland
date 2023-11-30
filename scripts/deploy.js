var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");

if(!f.in_args("nocheck") && f.read_file("~/thegame/stack/tocheck.txt")) // nocheck doesn't work [23/01/17]
{
	console.log(f.read_file("~/thegame/stack/tocheck.txt"));
	console.log("Can't Deploy");
	while(1);
}

f.execs("node ~/thegame/scripts/precompute.js")

f.execs("rm -rf ~/deploy/thegame_appengine");
f.execs("mkdir ~/deploy/thegame_appengine");
//f.execs("cp -r ~/thegame/* ~/deploy/thegame_appengine");
f.execs("rsync -rv --exclude=.electron ~/thegame/* ~/deploy/thegame_appengine"); // steamworkds_sdk is problematic to cp [11/02/19]

f.execs("rm -rf ~/deploy/thegame_appengine/node");
f.execs("rm -rf ~/deploy/thegame_appengine/scripts");
f.execs("cp ~/deploy/thegame_appengine/stack/update_notes.txt ~/deploy/thegame_appengine/design/update_notes.txt");
f.execs("rm -rf ~/deploy/thegame_appengine/stack");
f.execs("mkdir ~/deploy/thegame_appengine/stack");
f.execs("cp ~/deploy/thegame_appengine/design/update_notes.txt ~/deploy/thegame_appengine/stack/update_notes.txt");
f.execs("rm -rf ~/deploy/thegame_appengine/origin");
f.execs("rm -rf ~/deploy/thegame_appengine/electron");
f.execs("find ~/deploy/thegame_appengine/ -name '*.pxm' -delete");

f.execs("cp ~/deploy/thegame_appengine/js/runner_functions.js ~/deploy/thegame_appengine/htmls/contents/codes/runner_functions.js");
f.execs("cp ~/deploy/thegame_appengine/js/runner_compat.js ~/deploy/thegame_appengine/htmls/contents/codes/runner_compat.js");
f.execs("cp ~/deploy/thegame_appengine/js/common_functions.js ~/deploy/thegame_appengine/htmls/contents/codes/common_functions.js");

f.write_file("~/deploy/thegame_appengine/app.yaml",f.read_file("~/thegame/app.yaml").replace("application:","#application:").replace("version:","#version:"));

to_minify={
	// "js":["game.js","keyboard.js","html.js","functions.js","common_functions.js"],
	"css":["index.css","common.css"],
	"utility/htmls":["map_editor.js"],
};

f.minify_all("~/deploy/thegame_appengine",to_minify);