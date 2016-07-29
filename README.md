# adventureland
CODE Documentation for Adventure Land MMORPG http://adventure.land

### Usage / Notes
* You have to keep the browser focused
* Otherwise browsers slow down the game
* Opening the game in a new window might be a good idea
* Keep in mind that CODE is currently an early prototype
* CODE runs in an IFrame, feel free to interact with **parent**
* You are free to inspect the client game code
* You can freely emulate a regular player
* Please don't use the CODE to hinder other players or the server
* You should be safe as long as the interval is 250ms
* Feel free to use Github Issues for Questions

### Character / Players / Monsters

* Properties
 * real_x (10x of the game's X)
 * real_y (10x of the game's Y)
 * hp / max_hp
 * mp / max_mp
 * xp / max_xp
* show_json(character) to see all the properties

### Provided Functions

####move(character.real_x,character.real_y)
Moves the character

####use_hp_or_mp()
Uses a very basic logic to either use hp or mp pot

####loot()
Loots the chests on the map

####attack(target)
Attacks the target

####show_json(character.items)
Renders the argument as json, to inspect, learn, use

####set_message("Code Active")
Sets the IFrame message, the one in the right bottom corner

####runner_functions.js
There are more functions, examples in runner_functions.js and on the game's main CODE
As the game progresses, the CODE feature will refine, you will be able to create/save your own code in-game, and hopefully much much more :)

With the introduction of PVP, Trade, Events and similar stuff, the CODE capabilities should get pretty interesting

I'm also planning to add Networking between characters, so one might create a small team of bot helpers, and stuff like that
