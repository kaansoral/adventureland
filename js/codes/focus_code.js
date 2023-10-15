function on_draw()
{
	clear_drawings();
	for(var id in parent.entities)
	{
		var player=parent.entities[id];
		if(!parent.is_player(player)) continue;
		if(player.target)
		{
			var target=parent.entities[player.target];
			if(target)
			{
				// game_log(target.name);
				draw_line(player.real_x,player.real_y,target.real_x,target.real_y);
			}
		}
	}
}