setInterval(function(){

	use_hp_or_mp();

	loot();

	var target=get_target()||get_nearest_hostile()||get_nearest_monster();
	if(target && distance(target,character)>700 || target && target.rip) change_target(null),target=null;

	if(target && can_attack(target)) attack(target);

	if(is_moving(character)) return;
	
	if(target && !is_in_range(target))
	{
		if(can_move_to(target)) move(target.x,target.y);
		else smart_move(target.x,target.y);
	}

},100);

function random_move()
{
	smart_move(random_one(["spider","scorpion","crab","crabx","tortoise","squig","bee","goo","croc","armadillo","poisio"]));
}

random_move();

performance_trick();

setInterval(function(){

	random_move();

},30000);

function handle_death()
{
	setTimeout(function(){

		respawn();
		setTimeout(random_move,100);

	},20000+Math.random()*5000);
	return true;
}