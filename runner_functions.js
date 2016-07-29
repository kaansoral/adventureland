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
	return parent.target;
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

function in_attack_range(target)
{
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function can_attack(target)
{
	if(in_attack_range(target) && new Date()>=parent.next_attack) return true;
	return false;
}

function attack(target)
{
	parent.socket.emit('click',{'type':'monster','id':target.server_id,'button':'right'});
}

function move(x,y)
{
	var map=parent.map,move=parent.calculate_move(character.real_x,character.real_y,x,y);
	character.from_x=character.real_x;
	character.from_y=character.real_y;
	character.going_x=move.x;
	character.going_y=move.y;
	character.moving=true;
	parent.calculate_vxy(character);
	// parent.console.log("engaged move "+character.angle);
	parent.socket.emit("move",{x:character.real_x,y:character.real_y,going_x:character.going_x,going_y:character.going_y});
}

function show_json(e)
{
	parent.show_json(parent.game_stringify(e,2));
}

function get_nearest_monster(args)
{
	var min_d=999999,target=null;
	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || args.min_xp && current.xp<args.min_xp || args.max_att && current.attack>args.max_att) continue;
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
