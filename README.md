# adventureland
CODE Documentation for Adventure Land MMORPG http://adventure.land

### Character / Players / Monsters

* Properties
 * real_x (10x of the game's X)
 * real_y (10x of the game's Y)
 * hp / max_hp
 * mp / max_mp
 * xp / max_xp
* show_json(character) to see all the properties

### Things to Inspect

Replace everything on CODE with these show_json's

* `show_json(character)`
* `show_json(character.items)`
* `show_json(character.slots)`
* `show_json(get_target())`
* `show_json(parent.G.monsters)`
* `show_json(parent.G.items)`
* `show_json(parent.G.npcs)`
* `show_json(parent.M)`

### Provided Functions

####move(character.real_x,character.real_y)
Moves the character

####get_nearest_monster({max_att:100,min_xp:10,target:"Name",no_target:true})
Return's the nearest monster, you might want to target that return value with `change_target`
target: Picks monsters that only target that name
no_target: Picks monster that aren't targeting anyone

####use_hp_or_mp()
Uses a very basic logic to either use hp or mp pot

####get_target()
Returns your current target

####get_target_of(entity)
New, powerful feature, returns the target entity for both players and monsters
Suggestion for Fun: Code your characters to target and attack what you are targeting, even if you don't engage a monster, you can make your characters (or side-characters) engage by just clicking :)

####change_target(target)
Targets the player or monster

####loot()
Loots the chests on the map

####attack(target)
Attacks the target

####heal(target)
Heals the target

####game_log(message,color)
Adds a message to game's right log

####show_json(character.items)
Renders the argument as json, to inspect, learn, use

####set_message("Code Active")
Sets the IFrame message, the one in the right bottom corner

####runner_functions.js
There are more functions, examples in runner_functions.js and on the game's main CODE

###Future Plans
As the game progresses, the CODE feature will refine, you will be able to create/save your own code in-game, and hopefully much much more

With the introduction of PVP, Trade, Events and similar stuff, the CODE capabilities should get pretty interesting

I'm also planning to add Networking between characters, so one might create a small team of bot helpers, or create a PVP team that consist entirely of bots

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
* Ideally, at each Interval, move, attack, use/buy only once :)
