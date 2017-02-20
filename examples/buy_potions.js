function buy_potions()
{
	var x=character.real_x,y=character.real_y,map=character.map;
	smart_move({to:"potions"},function(done){
		buy("hpot0",100);
		buy("mpot0",400);
		game_log("Got the potions!","#4CE0CC");
		smart_move({x:x,y:y,map:map}); //Return back to the original position
		//If you block your main code when is_moving(character), you can buy potions this way and return back without a hassle
	});
}

buy_potions();
