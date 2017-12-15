var attack_mode=true

function happy_holidays()
{
	if(!G.maps.main.xmas_tree) return; // If this happens, the event is over
	if(character.s.xmas) return; // If you already have the buff, no need to get re-buffed
	G.maps.main.xmas_tree.return=true;
	// If first argument of "smart_move" includes "return"
	// You are placed back to your original point
	smart_move(G.maps.main.xmas_tree,function(){
		// This executes when we reach our destination
		parent.socket.emit("interaction",{type:"xmas_tree"});
		say("Happy Holidays!");
	});
}
setInterval(happy_holidays,60*1000); // Check every minute
happy_holidays(); // Execute once before the first interval is up

setInterval(function(){

	use_hp_or_mp();
	loot();

	if(!attack_mode || is_moving(character)) return;

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

},1000/4); // Loops every 1/4 seconds.

// NOTE: If the tab isn't focused, browsers slow down the game
// Learn Javascript: https://www.codecademy.com/learn/learn-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland
