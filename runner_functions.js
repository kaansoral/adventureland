//#NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
//#NOTICE: [19/10/16]: The CODE will receive many new features and improvements soon :)
var character=parent.character;

function get_socket()
{
	return parent.socket;
}

function get_map()
{
	return parent.G.maps[parent.current_map];
}

function set_message(text)
{
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
	if(character.id+''==entity.target+'' || character.name+''==entity.target+'') return character;
	for(var id in parent.entities)
	{
		var e=parent.entities[id];
		if(e.id+''==entity.target+'' || e.name+''==entity.target+'') return e;
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

function change_target(target)
{
	parent.ctarget=target;
	parent.send_target_logic();
}

function in_attack_range(target) // also works for priests/heal
{
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function can_attack(target) // also works for priests/heal
{
	// is_disabled function checks .rip and .stunned
	if(!parent.is_disabled(character) && in_attack_range(target) && new Date()>=parent.next_attack) return true;
	return false;
}

function attack(target)
{
	if(target.type=="character") parent.player_attack.call(target);
	else parent.monster_attack.call(target);
}

function heal(target)
{
	parent.player_heal.call(target);
}

function buy(name,quantity) //item names can be spotted from show_json(character.items) - they can be bought only if an NPC sells them
{
	parent.buy(name,quantity);
}

function sell(num,quantity) //sell an item from character.items by it's order - 0 to N-1
{
	parent.sell(num,quantity);
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
	parent.exchange();
}

function say(message) // please use "say()" and not socket.emit("say") manually, thank you! :)
{
	parent.socket.emit("say",{message:message,code:true});
}

function move(x,y)
{
	if(!can_walk(character)) return;
	var map=parent.map,move=parent.calculate_move(parent.M,character.real_x,character.real_y,x,y);
	character.from_x=character.real_x;
	character.from_y=character.real_y;
	character.going_x=move.x;
	character.going_y=move.y;
	character.moving=true;
	parent.calculate_vxy(character);
	// parent.console.log("engaged move "+character.angle);
	parent.socket.emit("move",{x:character.real_x,y:character.real_y,going_x:character.going_x,going_y:character.going_y});
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
	var min_d=999999,target=null;

	if(!args) args={};
	if(args && args.target && args.target.name) args.target=args.target.name;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || args.min_xp && current.xp<args.min_xp || args.max_att && current.attack>args.max_att || current.dead) continue;
		if(args.target && current.target!=args.target) continue;
		if(args.no_target && current.target && current.target!=character.name) continue;
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function use_hp_or_mp()
{
	if(new Date()<parent.next_pot) return;
	if(character.mp/character.max_mp<0.2) parent.use('mp'); 
	else if(character.hp/character.max_hp<0.7) parent.use('hp');
	else if(character.mp/character.max_mp<0.8) parent.use('mp');
	else if(character.hp<character.max_hp) parent.use('hp');
	else if(character.mp<character.max_mp) parent.use('mp');
}

function loot()
{
	for(id in parent.chests)
	{
		parent.socket.emit("open_chest",{id:id});
		break; // this ensures only 1 thing is looted at very call, so when the inventory is full, things don't get spammy [22/09/16]
	}
}

var PIXI=parent.PIXI; // for drawing stuff into the game
var drawings=parent.drawings;

//Documentation: https://pixijs.github.io/docs/PIXI.Graphics.html
function draw_line(x,y,x2,y2,size,color)
{
	// keep in mind that drawings could significantly slow redraws, especially if you don't .destroy() them
	if(!color) color=0x00E186;
	if(!size) size=2;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.moveTo(x,y);
	e.lineTo(x2,y2);
	e.endFill();
	parent.drawings.push(e); //for the game to keep track of your drawings
	parent.map.addChild(e); //e.destroy() would remove it, if you draw too many things and leave them there, it will likely bring the game to a halt
	return e;
}

function clear_drawings()
{
	drawings.forEach(function(e){
		try{e.destroy()}catch(ex){}
	});
	drawings=parent.drawings=[];
}
