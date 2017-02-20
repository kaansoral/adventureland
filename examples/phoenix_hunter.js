setInterval(function(){

	use_hp_or_mp();
	loot();

	if(is_moving(character)) return;
	//IDEA: Instead of returning when is_moving, if character.targets<2, farm nearby monsters if they are in_attack_range

	var target=get_nearest_monster({type:"phoenix"});
	if(!target)
	{
		smart_move({to:"phoenix"},function(r){
			if(r) game_log("At another Phoenix spawn!","#E0C34C");
			//TODO: "tunnel" is a dangerous map, find a corner and pull Phoenix there, if a mole targets you, use("town") and escape, heal, re-try
		});
		return;
	}
	
	if(!in_attack_range(target))
	{
		move(
			character.real_x+(target.real_x-character.real_x)/2,
			character.real_y+(target.real_y-character.real_y)/2
			);
	}
	else if(can_attack(target))
	{
		set_message("Attacking");
		attack(target);
	}

},160);
