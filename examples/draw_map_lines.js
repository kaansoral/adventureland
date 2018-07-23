function draw_lines()
{
	parent.GEO.x_lines.forEach(function(line){
		draw_line(line[0],line[1],line[0],line[2],2);
	});
	parent.GEO.y_lines.forEach(function(line){
		draw_line(line[1],line[0],line[2],line[0],2);
	});
}
game.on("new_map",function(data){
	if(!data.redraw) return;
	draw_lines();
})

draw_lines();
