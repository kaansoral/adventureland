//#NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
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
}

function in_attack_range(target) // also works for priests/heal
{
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function can_attack(target) // also works for priests/heal
{
	if(in_attack_range(target) && new Date()>=parent.next_attack) return true;
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

function upgrade(item_num,scroll_num) //number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
	parent.u_item=item_num;
	parent.u_scroll=scroll_num;
	parent.upgrade();
}

function exchange(item_num)
{
	parent.e_item=item_num;
	parent.exchange();
}

function say(message)
{
	parent.socket.emit("say",{message:message});
}

function move(x,y)
{
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
	var min_d=999999,target=null;
	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || args.min_xp && current.xp<args.min_xp || args.max_att && current.attack>args.max_att || current.dead) continue;
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
		parent.socket.emit("open_chest",{id:id});
}
