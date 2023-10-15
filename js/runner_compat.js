// Backwards compatibility routines / functions

// Auto reload is default on now [28/02/19]
function auto_reload(value)
{
	// Configures the game to auto reload in case you disconnect due to rare network issues
	if(value===false) parent.auto_reload="off";
	else if(value=="auto") parent.auto_reload="auto"; // code or merchant stand
	else parent.auto_reload="on"; // always reload
}

function handle_death()
{
	// When a character dies, character.rip is true, you can override handle_death and manually respawn
	// IDEA: A Resident PVP-Dweller, with an evasive Code + irregular respawning
	// respawn current has a 12 second cooldown, best wait 15 seconds before respawning [24/11/16]
	// setTimeout(respawn,15000);
	// NOTE: Add `if(character.rip) {respawn(); return;}` to your main loop/interval too, just in case
}

function can_use(name)
{
	if(G.skills[name] && G.skills[name].class && !in_arr(character.ctype,G.skills[name].class)) return false; // checks the class
	return parent.can_use(name); // checks the cooldown
}

function use(name,target) // a multi-purpose use function, works for skills too
{
	if(isNaN(name)) // if name is not an integer, use the skill
	{
		if(!target) target=get_target();
		parent.use_skill(name,target);
	}
	else
	{
		// for example, if there is a potion at the first inventory slot, use(0) would use it
		equip(name);
	}
}

function on_cm(name,data)
{
	game_log("Received a code message from: "+name);
}

function on_combined_damage() // When multiple characters stay in the same spot, they receive combined damage, this function gets called whenever a monster deals combined damage
{
	// move(character.real_x+5,character.real_y);
}

function on_game_event(event)
{
	if(event.name=="pinkgoo")
	{
		// start searching for the "Love Goo" of the Valentine's Day event
	}
	if(event.name=="goblin")
	{
		// start searching for the "Sneaky Goblin"
	}
}

function in_attack_range(target) // also works for priests/heal
{
	if(!target) return false;
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function is_pvp(){return in_pvp()}

function is_player(e){return is_character(e);}

function destroy_item(i){destroy(i)}

character.on("stacked",function(){ on_combined_damage(); });
character.on("death",function(){ handle_death(); });
character.on("cm",function(data){ on_cm(data.name,data.message) });

// [06/03/19]: doneify aimed to add a completion callback to every function
// such as buy("shoes").done(function(success_flag,data){})
// feedback was mixed, ES6 Promise's were suggested, which hibernated the efforts
// currently shelving doneify, as current DOCS render functions directly, it won't work any more
// likely going to start returning Promise's and re-visit every routine 
function doneify(fn,s_event,f_event)
{
	return function(a,b,c,d,e,f){
		var rxd=randomStr(30);
		parent.rxd=rxd;
		fn(a,b,c,d,e,f);
		return {done:function(callback){
			game.once(s_event,function(event){
				if(event.rxd==rxd)
				{
					callback(true,event);
					this.delete=true; // remove the .on listener
					parent.rxd=null;
				}
				// else game_log("rxd_mismatch");
			});
			game.once(f_event,function(event){
				if(event.rxd==rxd)
				{
					callback(false,event);
					this.delete=true; // remove the .on listener
					parent.rxd=null;
				}
				// else game_log("rxd_mismatch");
			});
		}};
	};
}
// buy=doneify(buy,"buy_success","buy_fail");