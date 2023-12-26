var image_size=require('image-size'),fs=require('fs');
var f=require(process.env.HOME+"/thegeobird/scripts/functions.js");
var images={};

var data=f.read_file("~/thegame/design/sprites.py");
data=data.split(".png");
delete data[data.length-1];
data.forEach(function(file){
	file=file.split('"');
	file=file[file.length-1];
	file=file+".png";
	images[file]=image_size(process.env.HOME+'/thegame'+file);
})

// console.log(images);

f.write_file("~/thegame/design/precomputed.py","# "+(new Date())+"\nimages="+JSON.stringify(images)+"\n");