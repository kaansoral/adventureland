setInterval(function(){

	use_hp_or_mp();
	loot();

	if(is_moving(character)) return;

	var target=get_nearest_monster({type:"phoenix"});
	if(!target)
	{
		smart_move({to:"phoenix"},function(r){
			if(r) game_log("At another Phoenix spawn!","#E0C34C");
		});
		return;
	}
	
	if(!in_attack_range(target))
	{
		move(
			character.real_x+(target.real_x-character.real_x)/2,
			character.real_y+(target.real_y-character.real_y)/2
			);
		// Walk half the distance
	}
	else if(can_attack(target))
	{
		set_message("Attacking");
		attack(target);
	}

},160);
