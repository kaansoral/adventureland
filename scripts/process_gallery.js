var image_size=require('image-size'),fs=require('fs');
var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
var images=[];

[["/images/tiles/monsters/","monsters",".png"],["/images/tiles/characters/","characters",".png"],["/images/tiles/characters/tribes/","tribes",".png"],["/images/tiles/characters/npcs/","npcs",".png"],["/images/tiles/map/","map",".png"],["/images/tiles/examples/","examples",".png"],["/images/tiles/examples/","examples_gif",".gif"],["/images/sprites/animations/","animations",".png"],["/images/sprites/emblems/","emblems",".png"],["/images/sprites/weather/","weather",".png"],["/images/tiles/animations/","new animations",".png"]].forEach(function(fext){
	var folder=fext[0],tag=fext[1],ext=fext[2];
	var current=[];
	f.ch("~/thegame"+folder);
	var data=f.execs("ls -al");
	data=data.split(ext);
	for(var i=0;i<data.length-1;i++)
	{
		var file=data[i];
		file=file.split(' ');
		file=file[file.length-1];
		file=folder+file+ext;
		current.push(file);
	}
	images.push([tag,current]);
});

f.write_file("~/thegame/utility/gallery.py","# "+(new Date())+"\ngallery="+JSON.stringify(images)+"\n");