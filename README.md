# Adventure Land Documentation
CODE Documentation for Adventure Land MMORPG [Adventure Land](http://adventure.land) .
Currently created by Patric Wellershaus.
This Documentation is currently unofficial and unfinished.
The Source code is property of Kaan Soral.

### [Character](https://fansana.github.io/adventureland/Character.html)

### [Players](https://fansana.github.io/adventureland/Player.html)

### [Monster](https://fansana.github.io/adventureland/Monster.html)
* Properties
 * .real_x (10x of the game's X)
 * .real_y (10x of the game's Y)
 * .hp / .max_hp
 * .mp / .max_mp
 * .xp / .max_xp
 * .party / .name / .rip / .afk / .code / .target / .id / .moving + more

### Game Info
A lot of useful information is stored inside of *parent.G*
To display those Information use 
```javascript
    show_json(parent.G);
```
Here is a list of all current children of G and an explanation to them.

* `G.version`
    - Stores the current Game version
* `G.character.items`
    - Stores all items in the game and there Attributes
* `G.levels`
    - Stores the xp needed to get from one level to the next
* `G.classes`
    - Stores information about each player class
* `G.maps`
    - Contains every game map
* `G.monsters`
    - List of every monster and there attributes
* `G.skills`
    - List of all player skills
* `G.npcs`
    - Contains a information about all npcs.

### Provided Functions

#### move(character.real_x,character.real_y)
Moves the character

#### get_nearest_monster({max_att:100,min_xp:10,target:"Name",no_target:true})
Return's the nearest monster, you might want to target that return value with `change_target`

target: Picks monsters that only target that name

no_target: Picks monster that aren't targeting anyone

#### use_hp_or_mp()
Uses a very basic logic to either use hp or mp pot

#### get_target()
Returns your current target

#### get_target_of(entity)
New, powerful feature, returns the target entity for both players and monsters

Suggestion for Fun: Code your characters to target and attack what you are targeting, even if you don't engage a monster, you can make your characters (or side-characters) engage by just clicking :)

#### change_target(target)
Targets the player or monster

#### loot()
Loots the chests on the map

#### attack(target)
Attacks the target

#### heal(target)
Heals the target

#### game_log(message,color)
Adds a message to game's right log

#### show_json(character.items)
Renders the argument as json, to inspect, learn, use

#### set_message("Code Active")
Sets the IFrame message, the one in the right bottom corner

#### runner_functions.js
There are more functions, examples in runner_functions.js and on the game's main CODE

### Future Plans for Adventure land
As the game progresses, the CODE feature will refine, you will be able to create/save your own code in-game, and hopefully much much more

With the introduction of PVP, Trade, Events and similar stuff, the CODE capabilities should get pretty interesting

I'm also planning to add Networking between characters, so one might create a small team of bot helpers, or create a PVP team that consist entirely of bots

### Usage / Notes
Using CODE in Adventure land requires that the browser tab is focused, otherwise browser commonly slow down the javascript execution.
A good solution to this problem is to open a separate Window where to run the game in.
Follow the rules of the Game to avoid unnecessary punishment.
Also try not to overload the server with too many actions, running the code in an 1/4 second Interval is good practice.
Keep in mind that CODE is currently an early prototype and may change at any time.
If you have questions create an [issue](https://github.com/Fansana/adventureland/issues/new) on github or ask on [Discord](https://discord.gg/hTpwYFJ).
Most importantly have fun programming.


