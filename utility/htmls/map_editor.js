var step_x=8,step_y=8,size_x=16,size_y=16,set=null,x=0,y=0,set_file="",tile_x=0,tile_y=0,tile_set=null,tile_file=null,rotate=0;
var set_cache={};
var mode="normal",lines=true,under_mode=false,last_move="map",purpose=null;
var area_start=null,cgroup=null,anim=null,current_id,polygon=[],line_start=null,tilings=0,sprites=0,r_start=null;
var texture_cache={};
var mm_afk=false,map_editor=true; //compatibility

function register_tile(set,x,y,size_x,size_y,rotation)
{
	var frames=null;
	if(anim)
	{
		frames=parseInt($(".frames").val());
		if(!frames) return;
	}
	for(var i=0;i<map_data.tiles.length;i++)
	{
		var def=map_data.tiles[i];
		if(def[0]==set && def[1]==x && def[2]==y && def[3]==size_x && nunv(def[4],def[3])==size_y && (def[5]||0)==(frames||0) && (def[6]||0)==(rotation||0)) return i;
	}
	var def=[set,x,y,size_x];
	if(size_y!=size_x) def[4]=size_y;
	if(frames) def[5]=frames;
	if(rotation) def[6]=rotation;
	map_data.tiles.push(def);
	return map_data.tiles.length-1;
}

function place_tile(num,x,y,already)
{
	if(anim && !parseInt($(".interval").val())) return show_alert("Invalid interval");
	var def=map_data.tiles[num],name="tile-"+num;

	if(!texture_cache[name])
	{
		var rectangle = new PIXI.Rectangle(def[1],def[2],def[3],nunv(def[4],def[3]));
		texture_cache[name]=new PIXI.Texture(C[tilesets[def[0]].file],rectangle);
	}
	var entity=new PIXI.Sprite(texture_cache[name]); sprites++;

	entity.x=x; entity.y=y;

	if(def[0]=="lights") entity.alpha=0.5;

	map.addChild(entity);

	if(!already)
	{
		if(anim)
		{
			var interval=parseInt($(".interval").val()),delay=$(".delay").val(),zoffset=parseFloat($(".zoffsetval").val());
			if(is_number(parseInt(delay))) delay=parseInt(delay);
			if(purpose=="simple") zoffset=-999;
			if(purpose=="night") map_data.nights.push([num,x,y,null,null,interval,delay,zoffset]);
			else map_data.animations.push([num,x,y,null,null,interval,delay,zoffset]);
			if(purpose!="night") return startstop_animation();
			else return;
		}
		if(def[0]=="lights")
		{
			map_data.lights=map_data.lights||[];
			map_data.lights.push([num,x,y]);
			return;
		}
		var c=map_data.placements;
		if(cgroup) c=map_data.groups[cgroup-1];
		
		if(under_mode) c.unshift([num,x,y]);
		else c.push([num,x,y]);
	}
}

function place_area(num,x,y,lx,ly,already)
{
	if(anim && !parseInt($(".interval").val())) return show_alert("Invalid interval");
	// alert("x: "+x+" lx: "+lx+" y: "+y+" ly: "+ly);
	var tiling=((lx-x)+(ly-y))>300;
	// tiling=false; // bad performance
	var def=map_data.tiles[num],cx=x,name="area-"+num,xs=0;

	if(!texture_cache[name])
	{
		var rectangle = new PIXI.Rectangle(def[1],def[2],def[3],nunv(def[4],def[3]));
		texture_cache[name]=new PIXI.Texture(C[tilesets[def[0]].file],rectangle);
	}

	while(cx<=lx) 
	{
		var cy=y,ys=0;
		while(cy<=ly)
		{

			if(!tiling)
			{
				var entity=new PIXI.Sprite(texture_cache[name]); sprites++;
				entity.x=cx; entity.y=cy;
				map.addChild(entity);
			}

			ys++;
			cy+=nunv(def[4],def[3]);
		}
		xs++;
		cx+=def[3];
	}

	if(tiling)
	{
		tilings++;
		var entity=new PIXI.extras.TilingSprite(texture_cache[name],xs*def[3],ys*nunv(def[4],def[3])); sprites++;
		entity.x=x; entity.y=y;
		map.addChild(entity);
	}

	if(!already)
	{
		if(anim)
		{
			var interval=parseInt($(".interval").val()),delay=$(".delay").val(),zoffset=parseFloat($(".zoffsetval").val());
			if(is_number(delay)) delay=parseInt(delay);
			if(purpose=="simple") zoffset=-999;
			if(purpose=="night") map_data.nights.push([num,x,y,lx,ly,interval,delay,zoffset]);
			else map_data.animations.push([num,x,y,lx,ly,interval,delay,zoffset]);
			return startstop_animation();
		}
		var c=map_data.placements;
		if(cgroup) c=map_data.groups[cgroup-1];

		if(under_mode) c.unshift([num,x,y,lx,ly]);
		else c.push([num,x,y,lx,ly]);
	}
}

function line_check(visited,type,current)
{
	var first=visited.first,paths=0; visited.first=false;
	if(type=="x")
	{
		map.addChild(draw_line(current[0],current[1],current[0],current[2],2,0xD6627F));
		for(var i=0;i<(map_data.x_lines||[]).length;i++)
		{
			if(visited.x[i]) continue;
			var line=map_data.x_lines[i];
			if(current[0]==line[0] && (current[1]<=line[1] && line[1]<=current[2] || current[1]<=line[2] && line[2]<=current[2]))
			{
				visited.x[i]=true; paths+=1;
				line_check(visited,"x",line);
			}
		}
		for(var i=0;i<(map_data.y_lines||[]).length;i++)
		{
			if(visited.y[i]) continue;
			var line=map_data.y_lines[i];
			if(line[1]<=current[0] && current[0]<=line[2] && current[1]<=line[0] && line[0]<=current[2])
			{
				visited.y[i]=true; paths+=1;
				line_check(visited,"y",line);
			}
		}
	}
	if(type=="y")
	{
		map.addChild(draw_line(current[1],current[0],current[2],current[0],2,0xD6627F));
		for(var i=0;i<(map_data.y_lines||[]).length;i++)
		{
			if(visited.y[i]) continue;
			var line=map_data.y_lines[i];
			if(current[0]==line[0] && (current[1]<=line[1] && line[1]<=current[2] || current[1]<=line[2] && line[2]<=current[2]))
			{
				visited.y[i]=true; paths+=1;
				line_check(visited,"y",line);
			}
		}
		for(var i=0;i<(map_data.x_lines||[]).length;i++)
		{
			if(visited.x[i]) continue;
			var line=map_data.x_lines[i];
			if(line[1]<=current[0] && current[0]<=line[2] && current[1]<=line[0] && line[0]<=current[2])
			{
				visited.x[i]=true; paths+=1;
				line_check(visited,"x",line);
			}
		}
	}
	if(first)
	{
		if(paths>1) show_alert(paths+" paths - there is probably a gap!!");
	}
}

function map_click(event)
{
	// if(event.originalEvent) show_alert("yes");
	var cx=(event.data.global.x-map.x)/scale,cy=(event.data.global.y-map.y)/scale;

	circle=new PIXI.Graphics();
	circle.beginFill(0x88313D);
	circle.drawCircle(cx,cy,3);
	circle.endFill();
	//map.addChild(circle);

	if(mode=="alert")
	{
		if(map_data.points)
			for(var id in map_data.points)
			{
				var point=map_data.points[id];
				if(point_distance(cx,cy,point[0],point[1])<6)
					return show_alert("Point: ["+rf(point[0])+","+rf(point[1])+"]");
			}
		if(map_data.rectangles)
			for(var id in map_data.rectangles)
			{
				var point=map_data.rectangles[id];
				if(point_distance(cx,cy,point[0],point[1])<8)
					return show_alert("Rectangle: ["+rf(point[0])+","+rf(point[1])+","+rf(point[2])+","+rf(point[3])+"]<br />Door: ["+rf(point[0]+(point[2]-point[0])/2)+","+rf(point[3])+","+rf(point[2]-point[0])+","+rf(point[3]-point[1])+"]");
			}
		if(map_data.polygons)
			for(var z in map_data.polygons||{})
			{
				var found=false,p=null,min_x=map_data.polygons[z][0][0],max_x=map_data.polygons[z][0][0],min_y=map_data.polygons[z][0][1],max_y=map_data.polygons[z][0][1];
				for(var i=0;i<map_data.polygons[z].length;i++)
				{
					var point=map_data.polygons[z][i];
					min_x=min(point[0],min_x); max_x=max(point[0],max_x);
					min_y=min(point[1],min_y); max_y=max(point[1],max_y);
					if(!p) p="["+rf(point[0])+","+rf(point[1])+"]";
					else p+=",["+rf(point[0])+","+rf(point[1])+"]";
					if(point_distance(cx,cy,point[0],point[1])<6)
						found=true;
				}
				if(found)
					return show_alert("Polygon: ["+p+"]<br />Boundaries: ["+rf(min_x)+","+rf(min_y)+","+rf(max_x)+","+rf(max_y)+"]");
			}
	}

	if(mode=="alert" && !c_pressed && !x_pressed && !z_pressed) show_alert("x: "+cx+" y: "+cy);
	else if(c_pressed) // line deletion or alert
	{
		var done=false;
		for(var i=0;i<(map_data.x_lines||[]).length;i++)
		{
			var current=map_data.x_lines[i];
			if(abs(cx-current[0])<3 && current[1]<=cy && cy<=current[2])
			{
				done=1;
				if(mode=="alert") show_alert("x-line x "+current[0]+" | y "+current[1]+" to "+current[2]);
				else map_data.x_lines.splice(i,1);
				break;
			}
		}
		if(!done)
		for(var i=0;i<(map_data.y_lines||[]).length;i++)
		{
			var current=map_data.y_lines[i];
			if(abs(cy-current[0])<3 && current[1]<=cx && cx<=current[2])
			{
				done=1;
				if(mode=="alert") show_alert("y-line y "+current[0]+" | x "+current[1]+" to "+current[2]);
				else map_data.y_lines.splice(i,1);
				break;
			}
		}
	}
	else if(b_pressed) // zone deletion
	{
		var done=false;
		for(var z in map_data.points||{})
		{
			var point=map_data.points[z];
			if(point_distance(cx,cy,point[0],point[1])<=5)
			{
				done=1;
				delete map_data.points[z];
				break;
			}
		}
		if(!done)
		for(var z in map_data.rectangles||{})
		{
			var point=map_data.rectangles[z];
			if(point_distance(cx,cy,point[0],point[1])<=5)
			{
				done=1;
				delete map_data.rectangles[z];
				break;
			}
		}
		if(!done)
		for(var z in map_data.polygons||{})
		{
			for(var i=0;i<map_data.polygons[z].length;i++)
			{
				if(done) break;
				var point=map_data.polygons[z][i];
				if(point_distance(cx,cy,point[0],point[1])<=5)
				{
					done=1;
					delete map_data.polygons[z];
					break;
				}
			}
		}
	}
	else if(l_pressed) // line coloring, exhaustive, to make sure lines are connected
	{
		var done=false,visited;
		for(var i=0;i<(map_data.x_lines||[]).length;i++)
		{
			var current=map_data.x_lines[i];
			if(abs(cx-current[0])<6 && current[1]<=cy && cy<=current[2])
			{
				done=1;
				visited={}; visited[i]=true;
				line_check({"x":visited,"y":{},"first":true},"x",current);
				break;
			}
		}
		if(!done)
		for(var i=0;i<(map_data.y_lines||[]).length;i++)
		{
			var current=map_data.y_lines[i];
			if(abs(cy-current[0])<6 && current[1]<=cx && cx<=current[2])
			{
				done=1;
				visited={}; visited[i]=true;
				line_check({"y":visited,"x":{},"first":true},"y",current);
				break;
			}
		}
		return;
	}
	else if(z_pressed)
	{
		var to_delete=[];
		for(var i=map_data.placements.length-1;i>=0;i--) // descending + break so only the first one is deleted
		{
			var tile=map_data.placements[i];
			if(is_nun(tile[3])) continue;
			var def=map_data.tiles[tile[0]];
			var w=def[3],h=nunv(def[4],def[3]);
			if(tile[1]<=cx && tile[2]<=cy && tile[3]+w>=cx && tile[4]+h>=cy)
			{
				if(mode=="alert") show_alert("area-tile def: "+JSON.stringify(def)+" tile: "+JSON.stringify(tile));
				else to_delete.push(i);
				break;
			}
		}

		for (var i=to_delete.length-1;i>=0;i--)
			map_data.placements.splice(to_delete[i],1);

	}
	else if(x_pressed) // singular-delete
	{
		var to_delete=[];
		for(var i=map_data.placements.length-1;i>=0;i--) // descending + break so only the first one is deleted
		{
			var tile=map_data.placements[i];
			if(!is_nun(tile[3])) continue;
			var def=map_data.tiles[tile[0]];
			var w=def[3],h=nunv(def[4],def[3]);
			if(tile[1]<=cx && tile[2]<=cy && tile[1]+w>=cx && tile[2]+h>=cy)
			{
				if(mode=="alert") show_alert("single-tile def: "+JSON.stringify(def)+" tile: "+JSON.stringify(tile));
				else to_delete.push(i);
				break;
			}
		}

		for (var i=to_delete.length-1;i>=0;i--)
			map_data.placements.splice(to_delete[i],1);

	}
	else if(v_pressed) // entity deletion
	{
		var done=false;
		var to_delete=[];

		for(var i=(map_data.lights||[]).length-1;i>=0;i--)
			{
				var tile=map_data.lights[i];
				var def=map_data.tiles[tile[0]];
				var w=def[3],h=nunv(def[4],def[3]);
				if(tile[1]<=cx && tile[2]<=cy && nunv(tile[3],tile[1])+w>=cx && nunv(tile[4],tile[2])+h>=cy)
				{
					to_delete.push(i);
					done=true;
					break;
				}
			}
			for (var i=to_delete.length-1;i>=0;i--)
				map_data.lights.splice(to_delete[i],1);

		if(!done)
		{
			for(var i=(map_data.nights||[]).length-1;i>=0;i--)
				{
					var tile=map_data.nights[i];
					var def=map_data.tiles[tile[0]];
					var w=def[3],h=nunv(def[4],def[3]);
					if(tile[1]<=cx && tile[2]<=cy && nunv(tile[3],tile[1])+w>=cx && nunv(tile[4],tile[2])+h>=cy)
					{
						to_delete.push(i);
						done=true;
						break;
					}
				}
				for (var i=to_delete.length-1;i>=0;i--)
					map_data.nights.splice(to_delete[i],1);
		}


		if(!done)
		{
			for(var i=(map_data.animations||[]).length-1;i>=0;i--)
			{
				var tile=map_data.animations[i];
				var def=map_data.tiles[tile[0]];
				var w=def[3],h=nunv(def[4],def[3]);
				if(tile[1]<=cx && tile[2]<=cy && nunv(tile[3],tile[1])+w>=cx && nunv(tile[4],tile[2])+h>=cy)
				{
					to_delete.push(i);
					done=true;
					break;
				}
			}
			for (var i=to_delete.length-1;i>=0;i--)
				map_data.animations.splice(to_delete[i],1);
		}

		if(!done)
		{
			var to_delete=undefined,y_spread=0;
			for(var p=0;p<(map_data.groups||[]).length;p++)
			{
				if(!map_data.groups[p].length) continue;
				var max_y=-9999999999,min_y=9999999999,max_x=-999999999,min_x=9999999999,rx,line;
				for(var i=0;i<map_data.groups[p].length;i++)
				{
					var tile=map_data.groups[p][i],def=map_data.tiles[tile[0]];
					var w=def[3],h=nunv(def[4],def[3]);
					//console.log(JSON.stringify(tile));
					if(!is_nun(tile[3]))
					{
						if(tile[1]<min_x) min_x=tile[1];
						if(tile[1]+w>max_x) max_x=tile[1]+w;
						if(tile[3]<min_x) min_x=tile[3];
						if(tile[3]+w>max_x) max_x=tile[3]+w;

						if(tile[2]<min_y) min_y=tile[2];
						if(tile[2]+h>max_y) max_y=tile[2]+h;
						if(tile[4]<min_y) min_y=tile[4];
						if(tile[4]+h>max_y) max_y=tile[4]+h;
					}
					else
					{
						if(tile[1]<min_x) min_x=tile[1];
						if(tile[1]+w>max_x) max_x=tile[1]+w;

						if(tile[2]<min_y) min_y=tile[2];
						if(tile[2]+h>max_y) max_y=tile[2]+h;
					}
				}
				if(min_y<=cy && cy<=max_y && min_x<=cx && cx<=max_x)
				{
					if(to_delete===undefined || max_y-min_y<y_spread) to_delete=p,y_spread=max_y-min_y; // dirty-fix [07/02/18]
					// break;
				}
			}
			if(to_delete!==undefined) map_data.groups.splice(to_delete,1);
		}
	}
	else if(y_pressed) // default-set
	{
		for(var i=map_data.placements.length-1;i>=0;i--) // descending + break so only the first one is deleted
		{
			var tile=map_data.placements[i];
			var def=map_data.tiles[tile[0]];
			var w=def[3],h=nunv(def[4],def[3]);
			if(tile[1]<=cx && tile[2]<=cy && tile[1]+w>=cx && tile[2]+h>=cy)
			{
				map_data['default']=tile[0];
				show_alert("Default is Set");
				break;
			}
		}

	}
	else if(mode=="point")
	{
		register_point(cx,cy);
	}
	else if(mode=="polygon" && !polygon.length)
	{
		polygon[0]=[floor(cx/step_x)*step_x,floor(cy/step_y)*step_y]; 
	}
	else if(mode=="polygon")
	{
		var rx=floor(cx/step_x)*step_x,ry=floor(cy/step_y)*step_y,t,rxl=rx,ryl=ry;
		if(abs(rx-polygon[polygon.length-1][0])<abs(ry-polygon[polygon.length-1][1]))
		{
			if(ry!=polygon[polygon.length-1][1])
				polygon[polygon.length]=[polygon[polygon.length-1][0],ry];
		}
		else
		{
			if(rx!=polygon[polygon.length-1][0])
				polygon[polygon.length]=[rx,polygon[polygon.length-1][1]];
		}
		if(polygon[0][0]==polygon[polygon.length-1][0] && polygon[0][1]==polygon[polygon.length-1][1] && polygon.length>=4)
			register_polygon();
	}
	else if(mode=="rectangle" && !r_start)
	{
		r_start=[cx,cy];
	}
	else if(mode=="rectangle")
	{
		register_rectangle(cx,cy);
	}
	else if(mode=="line" && !line_start)
	{
		line_start=[floor(cx/step_x)*step_x,floor(cy/step_y)*step_y]; 
	}
	else if(mode=="line")
	{
		var rx=floor(cx/step_x)*step_x,ry=floor(cy/step_y)*step_y,t,rxl=rx,ryl=ry;
		if(abs(rx-line_start[0])<abs(ry-line_start[1]))
		{
			if(line_start[1]>ry) t=ry,ry=line_start[1],line_start[1]=t;
			map_data.x_lines.push([line_start[0],line_start[1],ry]);
			line_start=[line_start[0],ryl];
		}
		else
		{
			if(line_start[0]>rx) t=rx,rx=line_start[0],line_start[0]=t;
			map_data.y_lines.push([line_start[1],line_start[0],rx]);
			line_start=[rxl,line_start[1]];
		}
	}
	else
	{
		if(!tile_set || x==-1) return;
		if(mode=="area")
		{
			if(area_start)
			{
				var lx=area_start[0],ly=area_start[1];
				if(cx>=area_start[0]) while(lx+size_x<=cx) lx+=size_x;
				else {while(lx-size_x>=cx) lx-=size_x; t=lx; lx=area_start[0]; area_start[0]=t;}
				if(cy>=area_start[1]) while(ly+size_y<=cy) ly+=size_y;
				else {while(ly-size_y>=cy) ly-=size_y; t=ly; ly=area_start[1]; area_start[1]=t;}
				place_area(area_num,area_start[0],area_start[1],lx,ly);
				area_start=null;
			}
			else
			{
				area_num=register_tile(tile_set,tile_x,tile_y,size_x,size_y);
				area_start=[floor(cx/step_x)*step_x,floor(cy/step_y)*step_y];
			}
		}
		else
		{
			var num=register_tile(tile_set,tile_x,tile_y,size_x,size_y);
			place_tile(num,floor(cx/step_x)*step_x,floor(cy/step_y)*step_y);
		}
		//console.log("click: "+event.data.global.x+","+event.data.global.y+" map: "+map.x+","+map.y+" entity: "+cx+","+cy);
	}
	redraw_map();
}

function show_alert(x)
{
	show_modal("<div style='padding: 20px; text-align:center'><pre style='font-family: Pixel; font-size: 48px;'>"+x+"</pre></div>");
}

function save(url)
{
	if(!url) url=document.url;
	$.post(url,{data:JSON.stringify(map_data)}).done(function(data){
		show_alert("Done! "+data+" bytes");
	});
}

function map_mmove(event)
{
	last_move="map";
	var cx=(event.data.global.x-map.x)/scale,cy=(event.data.global.y-map.y)/scale;
	if(window.indicator) try{ indicator.parent.removeChild(indicator),indicator.destroy({children:true}),indicator=null; }catch(e){}
	if(mode=="alert") indicator=draw_crosshair(cx,cy,3,0xDB2A1B);
	else if(mode=="point") indicator=draw_circle(cx,cy,2,0xD24499);
	else if(x_pressed) indicator=draw_xhair(cx,cy,2.5);
	else if(b_pressed) indicator=draw_xhair(cx,cy,2.5,0xDF4D8E);
	else if(v_pressed) indicator=draw_xhair(cx,cy,2.5,0x9A7DE6);
	else if(z_pressed) indicator=draw_xhair(cx,cy,2.5,0x63CE99);
	else if(c_pressed) indicator=draw_xhair(cx,cy,2.5,0x287CCE);
	else if(l_pressed) indicator=draw_circle(cx,cy,2,0xD6627F);
	else if(y_pressed) indicator=draw_circle(cx,cy,2,0x69D44F);
	else if(mode=="rectangle" && !r_start)
	{
		indicator=draw_circle(cx,cy,2,0x3790BA);
	}
	else if(mode=="line" && !line_start || mode=="polygon" && !polygon.length)
	{
		indicator=draw_circle(floor(cx/step_x)*step_x,floor(cy/step_y)*step_y,2,0x00BB00);
	}
	else if(mode=="line")
	{
		if(abs(floor(cx/step_x)*step_x-line_start[0])<abs(floor(cy/step_y)*step_y-line_start[1]))
			indicator=draw_line(line_start[0],line_start[1],line_start[0],floor(cy/step_y)*step_y,2,0x00BB00);
		else
			indicator=draw_line(line_start[0],line_start[1],floor(cx/step_x)*step_x,line_start[1],2,0x00BB00);
	}
	else if(mode=="rectangle")
	{
		indicator=new PIXI.Container();
		indicator.addChild(draw_line(r_start[0],r_start[1],cx,r_start[1],2,0x3790BA));
		indicator.addChild(draw_line(r_start[0],r_start[1],r_start[0],cy,2,0x3790BA));
		indicator.addChild(draw_line(cx,cy,r_start[0],cy,2,0x3790BA));
		indicator.addChild(draw_line(cx,r_start[1],cx,cy,2,0x3790BA));
	}
	else if(mode=="polygon")
	{
		if(abs(floor(cx/step_x)*step_x-polygon[polygon.length-1][0])<abs(floor(cy/step_y)*step_y-polygon[polygon.length-1][1]))
			indicator=draw_line(polygon[polygon.length-1][0],polygon[polygon.length-1][1],polygon[polygon.length-1][0],floor(cy/step_y)*step_y,2,0x00BB00);
		else
			indicator=draw_line(polygon[polygon.length-1][0],polygon[polygon.length-1][1],floor(cx/step_x)*step_x,polygon[polygon.length-1][1],2,0x00BB00);
	}
	else if(tile_set && x!=-1)
	{
		if(mode=="area" && area_start)
		{
			var xs=[area_start[0]],ys=[area_start[1]];
			if(cx<area_start[0]) for(var i=area_start[0]-size_x;i>=cx;i-=size_x) xs.push(i);
			else for(var i=area_start[0]+size_x;i<=cx;i+=size_x) xs.push(i);
			if(cy<area_start[1]) for(var i=area_start[1]-size_y;i>=cy;i-=size_y) ys.push(i);
			else for(var i=area_start[1]+size_y;i<=cy;i+=size_y) ys.push(i);
			indicator=new PIXI.Container();
			xs.forEach(function(tx){
				ys.forEach(function(ty){
					var name=tile_file+"-"+tile_x+"-"+tile_y+"-"+size_x+"-"+size_y;
					if(!texture_cache[name])
					{
						var rectangle = new PIXI.Rectangle(tile_x,tile_y,size_x,size_y);
						texture_cache[name]=new PIXI.Texture(C[tile_file],rectangle);
					}
					var cindicator=new PIXI.Sprite(texture_cache[name]);
					

					cindicator.x=floor(tx/step_x)*step_x;
					cindicator.y=floor(ty/step_y)*step_y;

					indicator.addChild(cindicator);
				});
			});
		}
		else
		{
			var name=tile_file+"-"+tile_x+"-"+tile_y+"-"+size_x+"-"+size_y;
			if(!texture_cache[name])
			{
				var rectangle = new PIXI.Rectangle(tile_x,tile_y,size_x,size_y);
				texture_cache[name]=new PIXI.Texture(C[tile_file],rectangle);
			}
			indicator=new PIXI.Sprite(texture_cache[name]);

			if(tile_set=="lights") indicator.alpha=0.5;
			

			indicator.x=floor(cx/step_x)*step_x;
			indicator.y=floor(cy/step_y)*step_y;
		}
	}
	else indicator=empty_rect(floor(cx/step_x)*step_x,floor(cy/step_y)*step_y,size_x,size_y,2);
	map.addChild(indicator);
	event.stopPropagation();
}

function map2_click(event)
{
	x=(event.data.global.x-(window.tileset&&window.tileset.x||0))/tileset_scale;
	y=(event.data.global.y-(window.tileset&&window.tileset.y||0))/tileset_scale;
	tile_x=floor(x/step_x)*step_x;
	tile_y=floor(y/step_y)*step_y;
	tile_set=set;
	tile_file=set_file;
	$('.xbutton').css("display","inline-block");
}

function map2_mmove(event)
{
	last_move="map2";
	var cx=(event.data.global.x-(window.tileset&&window.tileset.x||0))/tileset_scale,cy=(event.data.global.y-(window.tileset&&window.tileset.y||0))/tileset_scale,size=2;
	if(tileset_scale>1) size=1;
	if(window.indicator2) try{ indicator2.parent.removeChild(indicator2),indicator2.destroy(),indicator2=null; }catch(e){}
	indicator2=empty_rect(floor(cx/step_x)*step_x,floor(cy/step_y)*step_y,size_x,size_y,size);
	(window.tileset||stage2).addChild(indicator2);
	event.stopPropagation();
}

function cache_set()
{
	set_cache[set]={x:tileset.x,y:tileset.y,scale:tileset_scale,m:$(".tilesetmove.active").length};
}

function tileset_zoom(num)
{
	var mid_x=renderer2.width/2.0-tileset.x,mid_y=renderer2.height/2.0-tileset.y;
	tileset_scale=tileset_scale+num;
	if(tileset_scale<1) tileset_scale=0.5;
	else tileset_scale=parseInt(floor(tileset_scale));
	// console.log(mid_x+" "+mid_y);
	tileset.scale=new PIXI.Point(tileset_scale,tileset_scale);
	//tileset.x=round(x*tileset_scale)-renderer2.width*tileset_scale/2.0;
	//tileset.y=round(y*tileset_scale)-renderer2.height*tileset_scale/2.0;
	tileset.x=round(renderer2.width/2.0-mid_x);
	tileset.y=round(renderer2.height/2.0-mid_y);
	cache_set();
}

function toggle_area_mode()
{
	$(".mbutton").removeClass("active");
	if(mode=="area")
	{
		mode="normal";
	}
	else
	{
		mode="area"; area_start=null;
		$(".areabutton").addClass("active");
	}
}

function toggle_under_mode()
{
	if(under_mode)
	{
		under_mode=false;
		$(".underbutton").removeClass("active");
	}
	else
	{
		under_mode=true;
		$(".underbutton").addClass("active");
	}
}

function toggle_line_mode()
{
	if(!map_data.x_lines) map_data.x_lines=[];
	if(!map_data.y_lines) map_data.y_lines=[];
	$(".mbutton").removeClass("active");
	if(mode=="line")
	{
		mode="normal";
	}
	else
	{
		mode="line"; line_start=null;
		$(".linebutton").addClass("active");
	}
}

function toggle_alert_mode()
{
	$(".mbutton").removeClass("redborder");
	if(mode=="alert") mode="normal";
	else
	{
		mode="alert";
		$(".alertbutton").addClass("redborder");
	}
}

function toggle_lines()
{
	if(lines) $('.linesbutton').html("Info: OFF");
	else $('.linesbutton').html("Info: ON");
	lines=!lines;
	redraw_map();
}

function startstop_group()
{
	if(!map_data.groups) map_data.groups=[];
	if(cgroup)
	{
		if(!map_data.groups[cgroup-1].length)
		{
			map_data.groups.splice(cgroup-1);
		}
		else
		{
			map_data.groups[cgroup-1][0][5]=parseFloat($('.zoffsetval').val())||0;
		}
		cgroup=null;
		$(".entitybutton").removeClass("active").removeClass("orangeborder").html("Add Entity");
		$(".zoffset").hide();
	}
	else
	{
		map_data.groups.push([]);
		cgroup=map_data.groups.length;
		$(".entitybutton").addClass("active").html("Complete");
		$(".zoffset").css("display","inline-block");
	}
	hide_modal();
}

function startstop_animation(type)
{
	if(!map_data.animations) map_data.animations=[];
	if(!map_data.nights) map_data.nights=[];
	if(anim)
	{
		anim=false;
		$(".entitybutton").removeClass("active").removeClass("orangeborder").html("Add Entity");
		$(".zoffset").hide();
		$(".animinfo").hide();
	}
	else
	{
		anim=true;
		$(".entitybutton").addClass("orangeborder").html("Cancel");
		$(".animinfo").css("display","inline-block");
		purpose=type;
		if(type!="simple") $(".zoffset").css("display","inline-block");
	}
	hide_modal();
}

function startstop_entity()
{
	if(cgroup)
		startstop_group();
	else if(anim)
		startstop_animation();
	else
		show_modal($('#entitymodal').html(),{wrap:false});
}

function startstop_zone()
{
	if(mode=="polygon" || mode=="point" || mode=="rectangle")
	{
		mode="normal"; polygon=[];
		$(".zonebutton").removeClass("orangeborder").html("Add Zone");
		$('.idbutton').hide();
	}
	else show_modal($('#zonemodal').html(),{wrap:false});
}

function startstop_polygon()
{
	if(mode=="polygon")
	{
		mode="normal"; polygon=[];
		$(".zonebutton").removeClass("orangeborder").html("Add Zone");
		$('.idbutton').hide();
	}
	else
	{
		mode="polygon"; $('.idbuttonid').val(randomStr(5)); $('.idbutton').css("display","inline-block"); polygon=[];
		$(".zonebutton").addClass("orangeborder").html("Cancel");
	}
	hide_modal();
}

function startstop_point(p)
{
	purpose=p;
	if(mode=="point")
	{
		mode="normal";
		$(".zonebutton").removeClass("orangeborder").html("Add Zone");
		$('.idbutton').hide();
	}
	else
	{
		mode="point"; $('.idbuttonid').val(randomStr(5)); $('.idbutton').css("display","inline-block");
		$(".zonebutton").addClass("orangeborder").html("Cancel");
	}
	hide_modal();
}

function startstop_rectangle(p)
{
	purpose=p;
	if(mode=="rectangle")
	{
		mode="normal";
		$(".zonebutton").removeClass("orangeborder").html("Add Zone");
		$('.idbutton').hide();
	}
	else
	{
		mode="rectangle"; $('.idbuttonid').val(randomStr(5)); $('.idbutton').css("display","inline-block"); r_start=null;
		$(".zonebutton").addClass("orangeborder").html("Cancel");
	}
	hide_modal();
}

function register_point(x,y)
{
	if(purpose=="spawn")
	{
		for(var i=0;i<(map_data.x_lines||[]).length;i++)
		{
			var current=map_data.x_lines[i];
			if(abs(x-current[0])<12 && current[1]<=y && y<=current[2])
			{
				return show_alert("Spawn points need to be 12px away from lines!");
			}
		}
		for(var i=0;i<(map_data.y_lines||[]).length;i++)
		{
			var current=map_data.y_lines[i];
			if(abs(y-current[0])<12 && current[1]<=x && x<=current[2])
			{
				return show_alert("Spawn points need to be 12px away from lines!");
			}
		}
	}
	if(!map_data.points) map_data.points={};
	map_data.points[$('.idbuttonid').val()]=[x,y];
	startstop_point();
}

function register_rectangle(x,y)
{
	if(r_start[0]!=x || r_start[1]!=y)
	{
		if(!map_data.rectangles) map_data.rectangles={};
		map_data.rectangles[$('.idbuttonid').val()]=[min(x,r_start[0]),min(y,r_start[1]),max(x,r_start[0]),max(y,r_start[1])];
	}
	mode="rectangle";
	startstop_rectangle();
}

function register_polygon()
{
	if(polygon.length==4) return r_start=polygon[1],register_rectangle(polygon[3][0],polygon[3][1]);
	if(!map_data.polygons) map_data.polygons={};
	polygon.length=polygon.length-1;
	map_data.polygons[$('.idbuttonid').val()]=polygon;
	startstop_polygon();
}

function destroy_tileset()
{
	set=""; $("#toprightcorner").hide(); $("#toprightcorner").html("");
	if(set!="upload")
	{
		stage2.destroy(); stage2=null; renderer2.destroy(); indicator2=null; window.tileset=null;
	}
}

function load_tileset(name,file)
{
	var new_mode=true;
	window.tileset_scale=1; window.tileset_move=false;
	if(set==name) destroy_tileset();
	else
	{
		if(set) destroy_tileset();
		if(location.search.indexOf("old_mode")!=-1)
		{
			renderer2 = new PIXI.CanvasRenderer(C[file].width,C[file].height,{antialias: false, transparent: false, resolution:window.devicePixelRatio, autoResize:true});
			stage2 = new PIXI.Container();
			new_mode=false;
		}
		else
		{
			renderer2 = new PIXI.CanvasRenderer(min(parseInt($(window).width()/2),max(600,min(C[file].width,width))),min(parseInt($(window).height()-80),max(400,min(C[file].height,height))),{antialias: false, transparent: false, resolution:window.devicePixelRatio, autoResize:true});
			stage2 = new PIXI.Container();
			stage2.scale=new PIXI.Point(1,1);
		}
		
		set=name; x=-1; y=0;
		set_file=file;
		var name="the-"+set_file;
		if(!texture_cache[name])
		{
			var rectangle = new PIXI.Rectangle(0,0,C[file].width,C[file].height);
			texture_cache[name]=new PIXI.Texture(C[file],rectangle);
		}
		var entity=new PIXI.Sprite(texture_cache[name]);
		if(new_mode) window.tileset=entity;
		entity.interactive=true;
		entity.on('mousedown',map2_click);
		entity.on('mousemove',map2_mmove);
		entity.hitArea = new PIXI.Rectangle(-40000, -40000, 80000, 80000);
		if(set_cache[set]) tileset_scale=set_cache[set].scale,entity.scale=new PIXI.Point(tileset_scale,tileset_scale),entity.x=set_cache[set].x,entity.y=set_cache[set].y;
		stage2.addChild(entity);
		document.getElementById("toprightcorner").appendChild(renderer2.view);
		$('#toprightcorner').show();
		//<div style='position: absolute; top: 10px; right: 110px' class='gamebutton tilesetmove' onclick='$(\".tilesetmove\").toggleClass(\"active\")'>M</div> 
		if(new_mode) $("#toprightcorner").append("<div style='position: absolute; top: 10px; right: 110px' class='gamebutton tilesetmove' onclick='$(\".tilesetmove\").toggleClass(\"active\"); cache_set()'>M</div> <div style='position: absolute; top: 10px; right: 60px' class='gamebutton' onclick='tileset_zoom(-1)'>-</div> <div style='position: absolute; top: 10px; right: 10px' class='gamebutton' onclick='tileset_zoom(1)'>+</div>");
		if(set_cache[set] && set_cache[set].m) $(".tilesetmove").addClass('active');
	}
}

function show_upload_modal()
{
	var html="<div style='font-size: 32px'>";
	html+="<div style='margin-bottom: 20px'>Make sure you save your map before uploading a tileset</div>";
	html+='<form action="{{upload_url}}" method="post" enctype="multipart/form-data">"this_map": <input type="file" name="image"/><input type="hidden" name="iname" value="map" /><input type="hidden" name="key" value="{{name}}"><input type="submit" name="submit" value="Upload"/></form>';
	html+='<form action="{{upload_url}}" method="post" enctype="multipart/form-data">"this_map_a": <input type="file" name="image"/><input type="hidden" name="iname" value="map_a" /><input type="hidden" name="key" value="{{name}}"><input type="submit" name="submit" value="Upload"/></form>';
	html+="</div>";
	if(set) destroy_tileset();
	set="upload";
	$("#toprightcorner").html(html);
	$('#toprightcorner').show();
}

function rescale_map(nscale)
{
	var ox=(map.x-round(width/2))/scale,oy=(map.y-round(height/2))/scale;
	if(in_arr(nscale,[0.25,0.5,1,2,3,4,5,6]))
	{
		scale=nscale;
		redraw_map();
		map.x=round(width/2)+round(ox*scale);
		map.y=round(height/2)+round(oy*scale);
	}
}

function map_zoom(num)
{
	if(num>0 && scale==6) return;
	if(num<0 && scale==0.25) return;
	var index=1;
	if(scale==0.25) index=0;
	if(scale==0.5) index=1;
	if(scale==1) index=2;
	if(scale==2) index=3;
	if(scale==3) index=4;
	if(scale==4) index=5;
	if(scale==5) index=6;
	if(scale==6) index=7;
	if(num>0) index++;
	else index--;
	rescale_map([0.25,0.5,1,2,3,4,5,6][index]);
}

function redraw_map()
{
	tilings=0; sprites=0;
	var x=round(width/2),y=round(height/2);
	if(map) x=map.x,y=map.y,stage.removeChild(map),map.destroy({children:false}); // #GTODO: Consider manually destroying Sprite's at one point [06/10/16]
	map=new PIXI.Container();
	indicator=null;
	map.x=x;
	map.y=y;
	if(scale) map.scale=new PIXI.Point(scale,scale);

	map.interactive=true;
	map.on('mousedown',map_click);
	map.on('mousemove',map_mmove)
	map.hitArea = new PIXI.Rectangle(-40000, -40000, 80000, 80000);

	circle=new PIXI.Graphics();
	circle.beginFill(0x88313D);
	circle.drawCircle(0,0,3);
	circle.endFill();
	map.addChild(circle);

	to_delete=[]; deleted=false;

	for(var i=0;i<map_data.placements.length;i++)
	{
		var tile=map_data.placements[i];
		try{
			if(!is_nun(tile[3])) place_area(tile[0],tile[1],tile[2],tile[3],tile[4],"yes");
			else place_tile(tile[0],tile[1],tile[2],"yes");
		}catch(e)
		{
			console.log("Faulty tile detected + deleted"); deleted=true;
			to_delete.push(i);
		}
	}
	
	delete_indices(map_data.placements,to_delete);
	if(deleted) show_alert("Deleted some faulty tiles, this might have happened if you shrinked your own tileset, or if you increased your tile area after selecting a tile etc.");

	to_delete=[]; deleted=false;

	if(map_data.animations)
		for(var i=0;i<map_data.animations.length;i++)
		{
			var tile=map_data.animations[i];
			if(offset>-900) continue;
			try{
				if(!is_nun(tile[3])) place_area(tile[0],tile[1],tile[2],tile[3],tile[4],"yes");
				else place_tile(tile[0],tile[1],tile[2],"yes");
			}catch(e)
			{
				console.log("Faulty tile detected + deleted"); deleted=true;
				to_delete.push(i);
			}
		}

	delete_indices(map_data.animations,to_delete);
	if(deleted) show_alert("Deleted some faulty tiles, this might have happened if you shrinked your own tileset, or if you increased your tile area after selecting a tile etc.");

	to_delete=[]; deleted=false;

	if(map_data.groups)
	{
		for(var p=0;p<map_data.groups.length;p++)
		{
			try{
				for(var i=0;i<map_data.groups[p].length;i++)
				{
					var tile=map_data.groups[p][i];
					if(!is_nun(tile[3])) place_area(tile[0],tile[1],tile[2],tile[3],tile[4],"yes");
					else place_tile(tile[0],tile[1],tile[2],"yes");
				}
			}catch(e)
			{
				console.log("Faulty group detected + deleted"); deleted=true;
				to_delete.push(i);
			}
		}
	}

	delete_indices(map_data.groups,to_delete);
	if(deleted) show_alert("Deleted some faulty groups, this might have happened if you shrinked your own tileset, or if you increased your tile area after selecting a tile etc.");

	to_delete=[]; deleted=false;

	if(map_data.animations)
	for(var i=0;i<map_data.animations.length;i++)
	{
		var tile=map_data.animations[i];
		if(offset<=-900) continue;
		try{
			if(!is_nun(tile[3])) place_area(tile[0],tile[1],tile[2],tile[3],tile[4],"yes");
			else place_tile(tile[0],tile[1],tile[2],"yes");
		}catch(e)
		{
			console.log("Faulty tile detected + deleted"); deleted=true;
			to_delete.push(i);
		}
	}

	delete_indices(map_data.animations,to_delete);
	if(deleted) show_alert("Deleted some faulty tiles, this might have happened if you shrinked your own tileset, or if you increased your tile area after selecting a tile etc.");

	if(map_data.lights)
	for(var i=0;i<map_data.lights.length;i++)
	{
		var tile=map_data.lights[i];
		try{
			if(!is_nun(tile[3])) place_area(tile[0],tile[1],tile[2],tile[3],tile[4],"yes");
			else place_tile(tile[0],tile[1],tile[2],"yes");
		}catch(e)
		{
			console.log("Faulty tile detected + deleted"); deleted=true;
			to_delete.push(i);
		}
	}
	
	delete_indices(map_data.lights,to_delete);
	if(deleted) show_alert("Deleted some faulty lights, this might have happened if you shrinked your own tileset, or if you increased your tile area after selecting a tile etc.");

	to_delete=[]; deleted=false;

	if(lines && map_data.x_lines)
		for(var i=0;i<map_data.x_lines.length;i++)
		{
			var current=map_data.x_lines[i];
			map.addChild(draw_line(current[0],current[1],current[0],current[2],2,0xEC8519));
		}
	if(lines && map_data.y_lines)
		for(var i=0;i<map_data.y_lines.length;i++)
		{
			var current=map_data.y_lines[i];
			map.addChild(draw_line(current[1],current[0],current[2],current[0],2,0xEC8519));
		}
	if(lines && polygon)
		for(var i=0;i<polygon.length-1;i++)
			map.addChild(draw_line(polygon[i][0],polygon[i][1],polygon[i+1][0],polygon[i+1][1],2.5,0x2AB470));
	if(lines && map_data.polygons)
	{
		for(var z in map_data.polygons)
		{
			var poly=map_data.polygons[z],mx=poly[0][0],my=poly[0][1];
			for(var i=0;i<poly.length;i++)
			{
				map.addChild(draw_line(poly[i][0],poly[i][1],poly[(i+1)%poly.length][0],poly[(i+1)%poly.length][1],2.5,0x2AB470));
				if(poly[i][0]<mx)
					mx=poly[i][0],my=poly[i][1];
				else if(poly[i][0]==mx)
					my=min(poly[i][1],my);
			}
			var fp={fontFamily:"Pixel",fontSize:16,fill:"#976BB9",align:"center",dropShadow:true,dropShadowDistance:1};
			var name=new PIXI.Text(z,fp);
			name.roundPixels=false;
			name.anchor.set(0,0);
			name.x=mx+3;
			name.y=my;
			map.addChild(name);
		}
	}
	if(lines && map_data.rectangles)
	{
		for(var z in map_data.rectangles)
		{
			var rect=map_data.rectangles[z];
			map.addChild(draw_line(rect[0],rect[1],rect[0],rect[3],2.5,0x3790BA));
			map.addChild(draw_line(rect[0],rect[1],rect[2],rect[1],2.5,0x3790BA));
			map.addChild(draw_line(rect[2],rect[1],rect[2],rect[3],2.5,0x3790BA));
			map.addChild(draw_line(rect[0],rect[3],rect[2],rect[3],2.5,0x3790BA));
			var fp={fontFamily:"Pixel",fontSize:16,fill:"#2D872A",align:"center",dropShadow:true,dropShadowDistance:1};
			var name=new PIXI.Text(z,fp);
			name.roundPixels=false;
			name.anchor.set(0,0);
			name.x=rect[0]+3;
			name.y=rect[1];
			map.addChild(name);
		}
	}
	if(lines && map_data.points)
	{
		for(var z in map_data.points)
		{
			var point=map_data.points[z];
			map.addChild(draw_crosshair(point[0],point[1],5,0xD24499));
			var fp={fontFamily:"Pixel",fontSize:16,fill:"#B86A8D",align:"center",dropShadow:true,dropShadowDistance:1};
			var name=new PIXI.Text(z,fp);
			name.roundPixels=false;
			name.anchor.set(0.5,0);
			name.x=point[0];
			name.y=point[1]+4;
			map.addChild(name);
		}
	}
	if(lines && map_data.animations)
		for(var p=0;p<map_data.animations.length;p++)
		{
			var tile=map_data.animations[p],offset=tile[7];
			var def=map_data.tiles[tile[0]],w=def[3],h=nunv(def[4],def[3]),color=0x6BA75E;
			if(offset<-900) offset=0,color=0xA1A3A4;
			map.addChild(draw_line(tile[1]/2.0+((nunv(tile[3],tile[1])+w)/2.0)-4,nunv(tile[4],tile[2])+h+offset,tile[1]/2.0+((nunv(tile[3],tile[1])+w)/2.0)+4,nunv(tile[4],tile[2])+h+offset,2,color));
		}
	if(lines && map_data.nights)
		for(var p=0;p<map_data.nights.length;p++)
		{
			var tile=map_data.nights[p],offset=tile[7];
			var def=map_data.tiles[tile[0]],w=def[3],h=nunv(def[4],def[3]),color=0x6BA75E;
			if(offset<-900) offset=0,color=0xA1A3A4;
			map.addChild(draw_line(tile[1]/2.0+((nunv(tile[3],tile[1])+w)/2.0)-4,nunv(tile[4],tile[2])+h+offset,tile[1]/2.0+((nunv(tile[3],tile[1])+w)/2.0)+4,nunv(tile[4],tile[2])+h+offset,2,color));
		}
	if(lines && map_data.groups) // for the group indicator lines
		for(var p=0;p<map_data.groups.length;p++)
			{
				if(!map_data.groups[p].length) continue;
				var max_y=-9999999999,max_x=-999999999,min_x=9999999999,rx,line,offset=map_data.groups[p][0][5]||0;
				if(cgroup-1===p)
					map_data.groups[p][0][5]=offset=parseFloat($('.zoffsetval').val())||0;
				for(var i=0;i<map_data.groups[p].length;i++)
				{
					var tile=map_data.groups[p][i],def=map_data.tiles[tile[0]];
					var w=def[3],h=nunv(def[4],def[3]);
					//console.log(JSON.stringify(tile));
					if(!is_nun(tile[3]))
					{
						if(tile[1]<min_x) min_x=tile[1];
						if(tile[1]+w>max_x) max_x=tile[1]+w;
						if(tile[3]<min_x) min_x=tile[3];
						if(tile[3]+w>max_x) max_x=tile[3]+w;

						if(tile[2]+h>max_y) max_y=tile[2]+h;
						if(tile[4]+h>max_y) max_y=tile[4]+h;
					}
					else
					{
						if(tile[1]<min_x) min_x=tile[1];
						if(tile[1]+w>max_x) max_x=tile[1]+w;

						if(tile[2]+h>max_y) max_y=tile[2]+h;
					}
				}
				rx=round(max_x/2.0+min_x/2.0);
				line=draw_line(rx-4,max_y+offset,rx+4,max_y+offset,2,0xEEEB18);
				line.alpha=0.9;
				map.addChild(line);
			}

	to_delete=[]; deleted=false;
	if(lines && map_data.nights)
		for(var i=0;i<map_data.nights.length;i++)
		{
			var tile=map_data.nights[i];
			if(offset<=-900) continue;
			try{
				if(!is_nun(tile[3])) place_area(tile[0],tile[1],tile[2],tile[3],tile[4],"yes");
				else place_tile(tile[0],tile[1],tile[2],"yes");
			}catch(e)
			{
				console.log("Faulty tile detected + deleted"); deleted=true;
				to_delete.push(i);
			}
		}

	delete_indices(map_data.nights,to_delete);
	if(deleted) show_alert("Deleted some faulty nights, this might have happened if you shrinked your own tileset, or if you increased your tile area after selecting a tile etc.");

	if(map_name)
	{
		G.maps[map_name].monsters.forEach(function(pack){
			(pack.boundaries||[pack.boundary]).forEach(function(b)
			{
				pack.boundary=b;
				map.addChild(empty_rect(pack.boundary[0],pack.boundary[1],pack.boundary[2]-pack.boundary[0],pack.boundary[3]-pack.boundary[1],2,0xDD3D3F));
				map.addChild(add_monster({"type":pack.type,x:(pack.boundary[2]+pack.boundary[0])/2,y:(pack.boundary[3]+pack.boundary[1])/2}));
			});
		});
	}

	console.log(sprites+" Sprite's + "+tilings+" TilingSprite's");

	if(0)
	{
		var rtexture=PIXI.RenderTexture.create(4000, 4000,undefined,2);
		map.x=2000; map.y=2000;
		renderer.render(map,rtexture);
		rmap=new PIXI.Sprite(rtexture);
		stage.addChild(rmap);
	}
	else
	{
		stage.addChild(map);
	}
}