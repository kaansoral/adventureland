setInterval(function(){

	use_hp_or_mp();
	lootGold();

	if(is_moving(character)) return;
	
	if(item_quantity("mpot0")<5) // item_quantity is defined below
	{
		smart_move({to:"potions",return:true},function(){ buy("mpot0",10); });
		// {to:"potions"} is ~equal to {"map":"main","x":56,"y":-122}
		// {return:true} brings you back to your original position
		// while the smart_move is happening, is_moving is false
		// therefore the attack routine doesn't execute
		// when the smart_move destination is reached
		// buy("mpot0",10); executes and buys 10 potions
		return;
	}

	var target=get_targeted_monster();
	if(!target)
	{
		target=get_nearest_monster({min_xp:100,max_att:120});
		if(target) change_target(target);
		else
		{
			set_message("No Monsters");
			return;
		}
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

},250);

function item_quantity(name)
{
	for(var i=0;i<42;i++)
	{
		if(character.items[i] && character.items[i].name==name) return character.items[i].q||0;
	}
	return 0;
}
