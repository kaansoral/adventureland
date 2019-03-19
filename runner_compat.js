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

function on_cm(name,data)
{
	game_log("Received a code message from: "+name);
}

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
