// var sharp=require('sharp');

// sharp(process.env.HOME+'/thegame/scripts/tileB_desert.png')
// .resize(384,384,{kernel:sharp.kernel.cubic,interpolator:sharp.interpolator.bilinear}) //kernel:"cubic", interpolator:"nearest",
// .toFile(process.env.HOME+'/thegame/scripts/tileB_desert2.png', function(err) {
// // output.jpg is a 300 pixels wide and 200 pixels high image
// // containing a scaled and cropped version of input.jpg
// });
// doesn't work, loses quality


var fs = require('fs'),
	PNG = require('pngjs').PNG;

fs.createReadStream('vampire.png')
	.pipe(new PNG({
		filterType: 4
	}))
	.on('parsed', function() {

		var output=new PNG({width:this.width/2,height:this.height/2,filterType:4})

		for (var y = 0; y < this.height/2; y++) {
			for (var x = 0; x < this.width/2; x++) {
				var idx = (output.width * y + x) << 2;
				var idx2 = (this.width * 2*y + 2*x) << 2;
				output.data[idx]=this.data[idx2];
				output.data[idx+1]=this.data[idx2+1];
				output.data[idx+2]=this.data[idx2+2];
				output.data[idx+3]=this.data[idx2+3];
			}
		}

		output.pack().pipe(fs.createWriteStream('vampire2.png'));
	});