//#NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
var character=parent.character;
var G=parent.G; // Game data
var safeties=true;

function activate(num) // activates an item, likely a booster, in the num-th inventory slot
{
	parent.activate(num);
}

function shift(num,name) // shifts an item, likely a booster, in the num-th inventory slot
{
	// shift(0,'xpbooster')
	// shift(0,'luckbooster')
	// shift(0,'goldbooster')
	parent.shift(num,name);
}

function can_use(name) // work in progress, can be used to check cooldowns of class skills [02/02/17]
{
	return parent.can_use(name);
}

function use(name,target) // a multi-purpose use function, works for skills too
{
	if(isNaN(name)) // if name is not an integer, use the skill
	{
		if(!target) target=get_target();
		parent.use_skill(name,target);
	}
	else
	{
		// for example, if there is a potion at the first inventory slot, use(0) would use it
		equip(name);
	}
}

function use_skill(name,target)
{
	if(!target) target=get_target();
	parent.use_skill(name,target);
}

function item_properties(item) // example: item_properties(character.items[0])
{
	if(!item || !item.name) return {};
	return calculate_item_properties(G.items[item.name],item);
}

function item_grade(item) // example: item_grade(character.items[0])
{
	// 0 Normal
	// 1 High
	// 2 Rare
	if(!item || !item.name) return -1;
	return calculate_item_grade(G.items[item.name],item);
}

function item_value(item) // example: item_value(character.items[0])
{
	if(!item || !item.name) return 0;
	return calculate_item_value(item);
}

function get_socket()
{
	return parent.socket;
}

function get_map()
{
	return parent.G.maps[parent.current_map];
}

function set_message(text,color)
{
	if(color) text="<span style='color: "+color+"'>"+text+"</span>";
	$('#gg').html(text);
}

function game_log(message,color)
{
	if(!color) color="#51D2E1";
	parent.add_log(message,color);
}

function get_target_of(entity) // .target is a Name for Monsters and `id` for Players - this function return whatever the entity in question is targeting
{
	if(!entity || !entity.target) return null;
	if(character.id==entity.target) return character;
	for(var id in parent.entities)
	{
		var e=parent.entities[id];
		if(e.id==entity.target) return e;
	}
	return null;
}

function get_target()
{
	return parent.ctarget;
}

function get_targeted_monster()
{
	if(parent.ctarget && !parent.ctarget.dead && parent.ctarget.type=='monster') return parent.ctarget;
	return null;
}

function change_target(target,public)
{
	parent.ctarget=target;
	if(!public) //no need to send the target on default for CODE, some people are using change_target 5-6 times in an interval
	{
		// user change_target(target,true) from now on to send the target to the server explicitly [23/10/16]
		if(target) parent.last_id_sent=target.id;
		else parent.last_id_sent='';
	}
	parent.send_target_logic();
}

function can_move_to(x,y)
{
	if(is_object(x)) y=x.real_y,x=x.real_x;
	return can_move({map:character.map,x:character.real_x,y:character.real_y,going_x:x,going_y:y});
}

function in_attack_range(target) // also works for priests/heal
{
	if(!target) return false;
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function can_attack(target) // also works for priests/heal
{
	// is_disabled function checks .rip and .stunned
	if(!target) return false;
	if(!parent.is_disabled(character) && in_attack_range(target) && new Date()>=parent.next_attack) return true;
	return false;
}
function can_heal(t){return can_attack(t);}

function is_moving(entity)
{
	if(entity.me && smart.moving) return true;
	if(entity.moving) return true;
	return false;
}

function is_transporting(entity)
{
	if(entity.c.town) return true;
	if(entity.me && parent.transporting) return true;
	return false;
}

function attack(target)
{
	if(safeties && mssince(last_attack)<400) return;
	if(!target) { game_log("Nothing to attack()","gray"); return; }
	if(target.type=="character") parent.player_attack.call(target);
	else parent.monster_attack.call(target);
	last_attack=new Date();
}

function heal(target)
{
	if(safeties && mssince(last_attack)<400) return;
	if(!target) { game_log("No one to heal()","gray"); return; }
	parent.player_heal.call(target);
	last_attack=new Date();
}

function buy(name,quantity) //item names can be spotted from show_json(character.items) - they can be bought only if an NPC sells them
{
	parent.buy(name,quantity);
}

function sell(num,quantity) //sell an item from character.items by it's order - 0 to N-1
{
	parent.sell(num,quantity);
}

function equip(num)
{
	parent.socket.emit("equip",{num:num});
}

function trade(num,trade_slot,price) // where trade_slot is 1 to 16 - example, trade(0,4,1000) puts the first item in inventory to the 4th trade slot for 1000 gold [27/10/16]
{
	parent.trade("trade"+trade_slot,num,price);
}

function trade_buy(target,trade_slot) // target needs to be an actual player
{
	parent.trade_buy(trade_slot,target.id,target.slots[trade_slot].rid); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}

function upgrade(item_num,scroll_num,offering_num) //number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
	parent.u_item=item_num;
	parent.u_scroll=scroll_num;
	parent.u_offering=offering_num;
	parent.upgrade();
}

function compound(item0,item1,item2,scroll_num,offering_num) // for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
{
	parent.c_items=[item0,item1,item2];
	parent.c_last=3;
	parent.c_scroll=scroll_num;
	parent.c_offering=offering_num;
	parent.compound();
}

function exchange(item_num)
{
	parent.e_item=item_num;
	parent.exchange(1);
}

function say(message) // please use responsibly, thank you! :)
{
	parent.say(message,1);
}

function move(x,y)
{
	if(!can_walk(character)) return;
	var map=parent.map,move=parent.calculate_move(parent.M,character.real_x,character.real_y,parseFloat(x)||0,parseFloat(y)||0);
	character.from_x=character.real_x;
	character.from_y=character.real_y;
	character.going_x=move.x;
	character.going_y=move.y;
	character.moving=true;
	parent.calculate_vxy(character);
	// parent.console.log("engaged move "+character.angle);
	parent.socket.emit("move",{x:character.real_x,y:character.real_y,going_x:character.going_x,going_y:character.going_y,m:character.m});
}

function show_json(e) // renders the object as json inside the game
{
	parent.show_json(parent.game_stringify(e,2));
}

function get_player(name) // returns the player by name, if the player is within the vision area
{
	var target=null,entities=parent.entities;
	if(name==character.name) target=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) target=entities[i];
	return target;
}

function get_nearest_monster(args)
{
	//args:
	// max_att - max attack
	// min_xp - min XP
	// target: Only return monsters that target this "name" or player object
	// no_target: Only pick monsters that don't have any target
	// path_check: Checks if the character can move to the target
	// type: Type of the monsters, for example "goo", can be referenced from `show_json(G.monsters)` [08/02/17]
	var min_d=999999,target=null;

	if(!args) args={};
	if(args && args.target && args.target.name) args.target=args.target.name;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || current.dead) continue;
		if(args.type && current.mtype!=args.type) continue;
		if(args.min_xp && current.xp<args.min_xp) continue;
		if(args.max_att && current.attack>args.max_att) continue;
		if(args.target && current.target!=args.target) continue;
		if(args.no_target && current.target && current.target!=character.name) continue;
		if(args.path_check && !can_move_to(current)) continue;
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function get_nearest_hostile(args) // mainly as an example [08/02/17]
{
	var min_d=999999,target=null;

	if(!args) args={};
	if(args.friendship===undefined) args.friendship=true;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="character" || current.rip || current.invincible || current.npc) continue;
		if(current.party && character.party==current.party) continue;
		if(current.guild && character.guild==current.guild) continue;
		if(args.friendship && in_arr(current.owner,parent.friends)) continue;
		if(args.exclude && in_arr(current.name,args.exclude)) continue; // get_nearest_hostile({exclude:["Wizard"]}); Thanks
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function use_hp_or_mp()
{
	if(safeties && mssince(last_potion)<600) return;
	var used=false;
	if(new Date()<parent.next_potion) return;
	if(character.mp/character.max_mp<0.2) use('use_mp'),used=true; 
	else if(character.hp/character.max_hp<0.7) use('use_hp'),used=true;
	else if(character.mp/character.max_mp<0.8) use('use_mp'),used=true;
	else if(character.hp<character.max_hp) use('use_hp'),used=true;
	else if(character.mp<character.max_mp) use('use_mp'),used=true;
	if(used) last_potion=new Date();
}

function loot()
{
	var looted=0;
	if(safeties && mssince(last_loot)<200) return;
	last_loot=new Date();
	for(id in parent.chests)
	{
		var chest=parent.chests[id];
		if(safeties && (chest.items>character.esize || chest.last_loot && mssince(chest.last_loot)<1600)) continue;
		chest.last_loot=last_loot;
		parent.socket.emit("open_chest",{id:id});
		looted++;
		if(looted==2) break;
	}
}

function send_party_invite(name,is_request) // name could be a player object, name, or id
{
	if(is_object(name)) name=name.name;
	parent.socket.emit('party',{event:is_request&&'request'||'invite',name:name});
}

function send_party_request(name)
{
	send_party_invite(name,1);
}

function accept_party_invite(name)
{
	parent.socket.emit('party',{event:'accept',name:name});
}
function accept_party_request(name)
{
	parent.socket.emit('party',{event:'raccept',name:name});
}

function respawn()
{
	parent.socket.emit('respawn');
}

function handle_death()
{
	// When a character dies, character.rip is true, you can override handle_death and manually respawn
	// IDEA: A Resident PVP-Dweller, with an evasive Code + irregular respawning
	// respawn current has a 12 second cooldown, best wait 15 seconds before respawning [24/11/16]
	// setTimeout(respawn,15000);
	// return true;
	// NOTE: Add `if(character.rip) {respawn(); return;}` to your main loop/interval too, just in case
	return -1;
}

function handle_command(command,args) // command's are things like "/party" that are entered through Chat - args is a string
{
	// game_log("Command: /"+command+" Args: "+args);
	// return true;
	return -1;
}

function send_cm(to,data)
{
	// to: Name or Array of Name's
	// data: JSON object
	parent.send_code_message(to,data);
}

function on_cm(name,data)
{
	game_log("Received a code message from: "+name);
}

function on_disappear(entity,data)
{
	// game_log("disappear: "+entity.id+" "+JSON.stringify(data));
}

function on_combined_damage() // When multiple characters stay in the same spot, they receive combined damage, this function gets called whenever a monster deals combined damage
{
	// move(character.real_x+5,character.real_y);
}

function on_party_invite(name) // called by the inviter's name
{
	// accept_party_invite(name)
}

function on_party_request(name) // called by the inviter's name - request = someone requesting to join your existing party
{
	// accept_party_request(name)
}

function on_destroy() // called just before the CODE is destroyed
{
	clear_drawings();
}

function on_draw() // the game calls this function at the best place in each game draw frame, so if you are playing the game at 60fps, this function gets called 60 times per second
{
	
}

function on_game_event(event)
{
	if(event.name=="pinkgoo")
	{
		// start searching for the "Love Goo" of the Valentine's Day event
	}
	if(event.name=="goblin")
	{
		// start searching for the "Sneaky Goblin"
	}
}

var PIXI=parent.PIXI; // for drawing stuff into the game
var drawings=parent.drawings;

//Documentation: https://pixijs.github.io/docs/PIXI.Graphics.html
function draw_line(x,y,x2,y2,size,color)
{
	// keep in mind that drawings could significantly slow redraws, especially if you don't .destroy() them
	if(!color) color=0xF38D00;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.moveTo(x,y);
	e.lineTo(x2,y2);
	e.endFill();
	parent.drawings.push(e); //for the game to keep track of your drawings
	parent.map.addChild(e); //e.destroy() would remove it, if you draw too many things and leave them there, it will likely bring the game to a halt
	return e;
}

// Example: draw_circle(character.real_x,character.real_y,character.range) :) [22/10/16]
function draw_circle(x,y,radius,size,color)
{
	if(!color) color=0x00F33E;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.drawCircle(x,y,radius);
	parent.drawings.push(e);
	parent.map.addChild(e);
	return e;
}

function clear_drawings()
{
	drawings.forEach(function(e){
		try{e.destroy({children:true})}catch(ex){}
	});
	drawings=parent.drawings=[];
}

var game={
	last:0,
	callbacks:[],
	on:function(event,f){

	},
	once:function(event,f){

	},
	remove:function(num){

	},
	trigger:function(event,args){

	},
};

function load_code(name,onerror) // onerror can be a function that will be executed if load_code fails
{
	if(!onerror) onerror=function(){ game_log("load_code: Failed to load","#E13758"); }
	var xhrObj = new XMLHttpRequest();
	xhrObj.open('GET',"/code.js?name="+encodeURIComponent(name)+"&timestamp="+(new Date().getTime()), false);
	xhrObj.send('');
	var library=document.createElement("script");
	library.type="text/javascript";
	library.text=xhrObj.responseText;
	library.onerror=onerror;
	document.getElementsByTagName("head")[0].appendChild(library);
}

var smart={
	moving:false,
	map:"main",x:0,y:0,
	on_done:function(){},
	plot:null,
	edge:20,
	use_town:false,
	prune:{
		smooth:true,
		map:true,
	},
	flags:{}
};

function smart_move(destination,on_done) // despite the name, smart_move isn't very smart or efficient, it's up to the players to implement a better movement method [05/02/17]
{
	smart.map="";
	if(is_string(destination)) destination={to:destination};
	if("x" in destination)
	{
		smart.map=destination.map||character.map;
		smart.x=destination.x;
		smart.y=destination.y;
	}
	else if("to" in destination || "map" in destination)
	{
		if(destination.to=="town") destination.to="main";
		if(G.monsters[destination.to])
		{
			for(var name in G.maps)
				(G.maps[name].monsters||[]).forEach(function(pack){
					if(pack.type!=destination.to || G.maps[name].ignore) return;
					if(pack.boundaries) // boundaries: for phoenix, mvampire
					{
						pack.last=pack.last||0;
						var boundary=pack.boundaries[pack.last%pack.boundaries.length];
						pack.last++;
						smart.map=boundary[0];
						smart.x=(boundary[1]+boundary[3])/2;
						smart.y=(boundary[2]+boundary[4])/2;
					}
					else if(pack.boundary)
					{
						var boundary=pack.boundary;
						smart.map=name;
						smart.x=(boundary[0]+boundary[2])/2;
						smart.y=(boundary[1]+boundary[3])/2;
					}
				});
		}
		else if(G.maps[destination.to||destination.map])
		{
			smart.map=destination.to||destination.map;
			smart.x=G.maps[smart.map].spawns[0][0];
			smart.y=G.maps[smart.map].spawns[0][1];
		}
		else if(destination.to=="upgrade" || destination.to=="compound") smart.map="main",smart.x=-204,smart.y=-129;
		else if(destination.to=="exchange") smart.map="main",smart.x=-26,smart.y=-432;
		else if(destination.to=="potions" && character.map=="halloween") smart.map="main",smart.x=149,smart.y=-182;
		else if(destination.to=="potions" && in_arr(character.map,["winterland","winter_inn","winter_cave"])) smart.map="winter_inn",smart.x=-84,smart.y=-173;
		else if(destination.to=="potions") smart.map="main",smart.x=56,smart.y=-122;
		else if(destination.to=="scrolls") smart.map="main",smart.x=-465,smart.y=-71;
	}
	if(!smart.map)
	{
		game_log("Unrecognized","#CF5B5B");
		return;
	}
	smart.moving=true;
	smart.plot=[]; smart.flags={}; smart.searching=smart.found=false;
	if(destination.return)
	{
		var cx=character.real_x,cy=character.real_y,cmap=character.map;
		smart.on_done=function(){
			if(on_done) on_done();
			smart_move({map:cmap,x:cx,y:cy});
		}
	}
	else smart.on_done=on_done||function(){};
	console.log(smart.map+" "+smart.x+" "+smart.y);
}

function stop()
{
	if(smart.moving) smart.on_done(false);
	smart.moving=false;
	move(character.real_x,character.real_y);
}

var queue=[],visited={},start=0,best=null;
var moves=[[0,15],[0,-15],[15,0],[-15,0]];

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
		while(i+2<smart.plot.length && smart.plot[i].map==smart.plot[i+1].map && smart.plot[i].map==smart.plot[i+1].map &&
			can_move({map:smart.plot[i].map,x:smart.plot[i].x,y:smart.plot[i].y,going_x:smart.plot[i+2].x,going_y:smart.plot[i+2].y}))
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
		if(current.map==smart.map)
		{
			smart.flags.map=true;
			if(abs(current.x-smart.x)+abs(current.y-smart.y)<smart.edge)
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
			G.maps[current.map].doors.forEach(function(door){
				if(simple_distance({x:door[0]+door[2]/2,y:door[1]+door[3]/2},{x:current.x,y:current.y})<45)
					qpush({map:door[4],x:G.maps[door[4]].spawns[door[5]||0][0],y:G.maps[door[4]].spawns[door[5]||0][1],transport:true,s:door[5]||0});
			});
			G.maps[current.map].npcs.forEach(function(npc){
				if(npc.id=="transporter" && simple_distance({x:npc.position[0],y:npc.position[1]},{x:current.x,y:current.y})<75)
				{
					for(var place in G.npcs.transporter.places)
					{
						qpush({map:place,x:G.maps[place].spawns[G.npcs.transporter.places[place]][0],y:G.maps[place].spawns[G.npcs.transporter.places[place]][1],transport:true,s:G.npcs.transporter.places[place]});
					}
				}
			});
		}

		if(smart.use_town) qpush({map:current.map,x:G.maps[current.map].spawns[0][0],y:G.maps[current.map].spawns[0][1],town:true}); // "town"

		shuffle(moves);
		moves.forEach(function(m){
			var new_x=parseInt(current.x+m[0]),new_y=parseInt(current.y+m[1]);
			// utilise can_move - game itself uses can_move too - smart_move is slow as can_move checks all the lines at each step
			if(can_move({map:current.map,x:current.x,y:current.y,going_x:new_x,going_y:new_y}))
				qpush({map:current.map,x:new_x,y:new_y});
		});

		start++;
		if(mssince(timer)>(!parent.is_hidden()&&40||500)) return;
	}
	
	if(result===null) result=best,optimal=false;
	if(result===null)
	{
		game_log("Path not found!","#CF575F");
		smart.moving=false;
		smart.on_done(false);
	}
	else
	{
		plot(result);
		smart.found=true;
		if(smart.prune.smooth) smooth_path();
		if(optimal) game_log("Path found!","#C882D1");
		else game_log("Path found~","#C882D1");
		// game_log(queue.length);
		parent.d_text("Yes!",character,{color:"#58D685"});
	}
}

function start_pathfinding()
{
	smart.searching=true;
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
		if(Math.random()<0.1)
		{
			move(character.real_x+Math.random()*0.0002-0.0001,character.real_y+Math.random()*0.0002-0.0001);
			parent.d_text(shuffle(["Hmm","...","???","Definitely left","No right!","Is it?","I can do this!","I think ...","What If","Should be","I'm Sure","Nope","Wait a min!","Oh my"])[0],character,{color:shuffle(["#68B3D1","#D06F99","#6ED5A3","#D2CF5A"])[0]});
		}
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
			// use("transporter",current.map);
		}
		else if(character.map==current.map && can_move_to(current.x,current.y))
		{
			move(current.x,current.y);
		}
		else
		{
			game_log("Lost the path...","#CF5B5B");
			smart_move({map:smart.map,x:smart.x,y:smart.y},smart.on_done);
		}
	}
}

setInterval(function(){smart_move_logic();},80);

//safety flags
var last_loot=new Date(0);
var last_attack=new Date(0);
var last_potion=new Date(0);
var last_transport=new Date(0);
