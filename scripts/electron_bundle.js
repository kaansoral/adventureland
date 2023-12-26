var image_size=require('image-size'),fs=require('fs');
var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
var images={};

f.execs("rm -rf ~/thegame/electron/files");
f.execs("mkdir ~/thegame/electron/files");
[["~/thegame/design/sprites.py",".png"],["~/thegame/design/animations.py",".png"],["~/thegame/js/functions.js",".ogg"],["~/thegame/js/functions.js",".wav"]].forEach(function(fext){
	var main=fext[0],ext=fext[1];
	var data=f.read_file(main);
	data=data.split(ext);
	for(var i=0;i<data.length-1;i++)
	{
		var file=data[i];
		file=file.split('"');
		file=file[file.length-1];
		file=file+ext;
		if(ext==".png") images[file]=image_size(process.env.HOME+'/thegame'+file);
		else images[file]={};

		var version=data[i+1];
		version=version.split("?v=")[1];
		if(version) version=version.split('"')[0];
		if(version) images[file].v=version;

		var folder=file.split("/");
		folder.length=folder.length-1;
		if(folder.length)
		{
			folder=folder.join("/");
			f.execs("mkdir -p ~/thegame/electron/files"+folder);
		}

		f.execs("cp ~/thegame"+file+" ~/thegame/electron/files"+file);
	}
});

// console.log(images);

f.write_file("~/thegame/electron/manifest.js","// "+(new Date())+"\nmodule.exports="+JSON.stringify(images)+"\n");