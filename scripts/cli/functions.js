var is_server=0;
var character={
	x:0, real_x:0,
	y:0, real_y:0,
	map:"main",
	base:{h: 8, v: 7, vn: 2},
	processor:true,
}
var smart={
	moving:false,
	map:"main",x:0,y:0,
	on_done:function(){},
	plot:null,
	edge:20, // getting 20px close to the target is enough
	baby_edge:80, // start treading lightly when 60px close to the target or starting point
	try_exact_spot: false,
	use_town:false,
	prune:{
		smooth:true,
		map:true,
	},
	flags:{}
};

function game_log(x)
{
	console.log("[MGL]: "+x);
}

var queue=[],visited={},start=0,best=null;
var moves=[[0,15],[0,-15],[15,0],[-15,0]];
var baby_steps=[[0,5],[0,-5],[5,0],[-5,0]];
// baby_steps is a new logic, used just around the target or starting point, to get out of tough spots [08/03/19]

function plot(index)
{
	if(index==-1) return;
	plot(queue[index].i); // Recursively back-tracks the path we came from
	smart.plot.push(queue[index]);
}

function qpush(node)
{
	// If we haven't visited this location, adds the location to the queue
	if(smart.prune.map && smart.flags.map && node.map!=smart.map) return;
	if(visited[node.map+"-"+node.x+"-"+node.y]) return;
	if(!node.i) node.i=start; // set the index, to aid the plot function
	queue.push(node);
	visited[node.map+"-"+node.x+"-"+node.y]=true;
}

function smooth_path()
{
	var i=0,j;
	while(i<smart.plot.length)
	{
		// Assume the path ahead is [i] [i+1] [i+2] - This routine checks whether [i+1] could be skipped
		// The resulting path is smooth rather than rectangular and bumpy
		// Try adding "function smooth_path(){}" or "smart.prune.smooth=false;" to your Code
		// [06/07/18]: (!smart.plot[i+2] || !smart.plot[i+2].transport) - without this condition, in "winterland", move(-160,-660), smart_move("main") fails
		while(i+2<smart.plot.length && smart.plot[i].map==smart.plot[i+1].map && smart.plot[i].map==smart.plot[i+1].map && (!smart.plot[i+2] || !smart.plot[i+2].transport) &&
			can_move({map:smart.plot[i].map,x:smart.plot[i].x,y:smart.plot[i].y,going_x:smart.plot[i+2].x,going_y:smart.plot[i+2].y,base:character.base}))
				smart.plot.splice(i+1,1);
		i++;
	}
}

function bfs()
{
	var timer=new Date(),result=null,optimal=true;

	while(start<queue.length)
	{
		var current=queue[start];
		// game_log(current.x+" "+current.y);
		var map=G.maps[current.map];
		var c_moves=moves,qlist=[];
		if(current.map==smart.map)
		{
			var c_dist=abs(current.x-smart.x)+abs(current.y-smart.y);
			var s_dist=abs(current.x-smart.start_x)+abs(current.y-smart.start_y);
			smart.flags.map=true;
			if(c_dist<smart.baby_edge || s_dist<smart.baby_edge) c_moves=baby_steps;
			if(c_dist<smart.edge)
			{
				result=start;
				break;
			}
			else if(best===null || abs(current.x-smart.x)+abs(current.y-smart.y)<abs(queue[best].x-smart.x)+abs(queue[best].y-smart.y))
			{
				best=start;
			}
		}
		else if(current.map!=smart.map)
		{
			if(smart.prune.map && smart.flags.map) {start++; continue;}
			map.doors.forEach(function(door){
				// if(simple_distance({x:map.spawns[door[6]][0],y:map.spawns[door[6]][1]},{x:current.x,y:current.y})<30)
				if(smart.map!="bank" && door[4]=="bank" && !G.maps[current.map].mount || door[8]=="complicated") return; // manually patch the bank shortcut
				if(is_door_close(current.map,door,current.x,current.y) && can_use_door(current.map,door,current.x,current.y))
					qlist.push({map:door[4],x:G.maps[door[4]].spawns[door[5]||0][0],y:G.maps[door[4]].spawns[door[5]||0][1],transport:true,s:door[5]||0});
			});
			map.npcs.forEach(function(npc){
				if(npc.id=="transporter" && simple_distance({x:npc.position[0],y:npc.position[1]},{x:current.x,y:current.y})<75)
				{
					for(var place in G.npcs.transporter.places)
					{
						qlist.push({map:place,x:G.maps[place].spawns[G.npcs.transporter.places[place]][0],y:G.maps[place].spawns[G.npcs.transporter.places[place]][1],transport:true,s:G.npcs.transporter.places[place]});
					}
				}
			});
		}

		if(smart.use_town) qpush({map:current.map,x:map.spawns[0][0],y:map.spawns[0][1],town:true}); // "town"

		shuffle(c_moves);
		c_moves.forEach(function(m){
			var new_x=current.x+m[0],new_y=current.y+m[1];
			// game_log(new_x+" "+new_y);
			// utilise can_move - game itself uses can_move too - smart_move is slow as can_move checks all the lines at each step
			if(can_move({map:current.map,x:current.x,y:current.y,going_x:new_x,going_y:new_y,base:character.base}))
				qpush({map:current.map,x:new_x,y:new_y});
		});
		qlist.forEach(function(q){qpush(q);}); // So regular move's are priotised

		start++;
	}
	
	if(result===null)
	{
		result=best,optimal=false;
		game_log("Path not found!","#CF575F");
		smart.moving=false;
		smart.success=false;
	}
	else
	{
		plot(result);
		if(1) // [08/03/19] - to attempt and move to the actual coordinates
		{
			var last=smart.plot[smart.plot.length-1]; if(!last) last={map:character.map,x:character.real_x,y:character.real_y};
			if(smart.x!=last.x || smart.y!=last.y)
			{
				smart.try_exact_spot=true;
				smart.plot.push({map:last.map,x:smart.x,y:smart.y});
			}
		}
		smart.found=true;
		if(smart.prune.smooth) smooth_path();
		if(optimal) game_log("Path found!","#C882D1");
		else game_log("Path found~","#C882D1");
		// game_log(queue.length);
		smart.moving=false;
		smart.success=true;
	}
}

function start_pathfinding()
{
	smart.try_exact_spot=false;
	smart.searching=true;
	smart.start_x=character.real_x;
	smart.start_y=character.real_y;
	queue=[],visited={},start=0,best=null;
	qpush({x:character.real_x,y:character.real_y,map:character.map,i:-1});
	game_log("Searching for a path...","#89D4A2");
	bfs();
}

function continue_pathfinding()
{
	bfs();
}

function smart_move_logic()
{
	if(!smart.moving) return;
	if(!smart.searching && !smart.found)
	{
		start_pathfinding();
	}
	else if(!smart.found)
	{
		continue_pathfinding();
	}
	else if(!character.moving && can_walk(character) && !is_transporting(character))
	{
		if(!smart.plot.length)
		{
			smart.moving=false;
			smart.on_done(true);
			return;
		}
		var current=smart.plot[0];
		smart.plot.splice(0,1);
		// game_log(JSON.stringify(current));
		if(current.town)
		{
			use("town");
		}
		else if(current.transport)
		{
			parent.socket.emit("transport",{to:current.map,s:current.s});
			parent.push_deferred("transport");
			// use("transporter",current.map);
		}
		else if(character.map==current.map && (smart.try_exact_spot && !smart.plot.length || can_move_to(current.x,current.y))) 
		{
			// game_log("S "+current.x+" "+current.y);
			move(current.x,current.y);
		}
		else
		{
			game_log("Lost the path...","#CF5B5B");
			smart_move({map:smart.map,x:smart.x,y:smart.y},smart.on_done);
		}
	}
}