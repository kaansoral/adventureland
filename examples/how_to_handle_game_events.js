game.all(function(event,args){
	game_log(event,"orange");
	game_log(JSON.stringify(args));
});

game.on("trade",function(args){
	if(args.buyer!=character.name && args.seller!=character.name)
		say("Check out my goods too "+args.buyer+"!");
});
