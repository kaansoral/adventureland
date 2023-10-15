// #NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
// Or at #feedback in Discord: https://discord.gg/4SXJGU

var character={
	// This object proxies the real parent.character
	// Normal entities have normal coordinates, their {x,y}'s are equal to their {real_x,real_y}'s
	// The character object is special, it's always in the middle of the screen, so it has static {x,y}'s
	// Added this wrapper so instead of using .real_x and .real_y on all entities, .x and .y's can be used uniformly
	"note":"This is a proxy object, the real character is in parent.character",
	"properties":["x","y"],
	"read_only":["x","y","real_x","real_y","from_x","from_y","going_x","going_y","moving","target","vx","vy","move_num","attack","speed","hp","mp","xp","max_hp","max_mp","range","level","rip","s","c","in","map","stand","items","slots"],
	"proxy_character":true,
}

Object.defineProperty(character,'x',{get:function(){return parent.character.real_x;},set:function(){game_log("You can't set coordinates manually, use the move(x,y) function!");},enumerable:true});
Object.defineProperty(character,'y',{get:function(){return parent.character.real_y;},set:function(){game_log("You can't set coordinates manually, use the move(x,y) function!");},enumerable:true});
for(var p in parent.character) proxy(p); // Not all properties are sadly available right away, new properties are captured imperfectly
// var character=parent.character; // Old [25/06/2018]

var G=parent.G; // Game Data - Use show_json(Object.keys(G)); and inspect individual data with show_json(G.skills) and alike
var safeties=true; // Prevents common delay based issues that cause many requests to be sent to the server in a burst that triggers the server to disconnect the character

server={
	mode:parent.gameplay, // "normal", "hardcore", "test"
	pvp:parent.is_pvp, // true for PVP servers, use is_pvp() for maps
	region:parent.server_region, // "EU", "US", "ASIA"
	id:parent.server_identifier, // "I", "II", "PVP", "TEST"
}

game={
	platform:parent.is_electron&&"electron"||"web", // "electron" for Steam, Mac clients, "web" for https://adventure.land
	graphics:!parent.no_graphics, // if game.graphics is false, don't draw stuff to the game in your Code
	html:!parent.no_html, // if game.html is false, this character is loaded in [CODE] mode
	cli:parent.is_cli,
};
character.bot=parent.is_bot;

//#NOTE: Most new features are experimental - for #feedback + suggestions: https://discord.gg/X4MpntA [05/01/18]

// #MODES

function mode_resolve_all()
{
	// Never reject a Promise
	// Successful results have {success:true}
	// Failes results have {failed:true}
	parent.parent.RESOLVE_ALL=parent.RESOLVE_ALL=RESOLVE_ALL=true;
}

/**
 * Loads a character in [CODE] mode
 * Character is loaded inside an iframe
 * The Code of the character is inside another iframe within that iframe
 * @param  {string} name - Name of your character
 * @param  {string} code_slot_or_name - Code slot name
 * @returns {Promise}
 */
function start_character(name,code_slot_or_name)
{
	return parent.start_character_runner(name,code_slot_or_name);
}

function stop_character(name)
{
	parent.stop_character_runner(name);
}

function command_character(name,code_snippet)
{
	// Commands the character in [CODE] mode
	parent.character_code_eval(name,code_snippet);
}

function get_active_characters()
{
	// States: "self", "starting","loading", "active", "code"
	// Example: {"Me":"self","Protector":"loading"}
	return parent.get_active_characters();
}

function change_server(region,name) // change_server("EU","I") or change_server("ASIA","PVP") or change_server("US","III")
{
	parent.window.location.href="/character/"+character.name+"/in/"+region+"/"+name+"/";
}

function in_pvp()
{
	return G.maps[character.map].pvp || server.pvp;
}

function is_npc(entity)
{
	if(entity && (entity.npc || entity.type=="npc")) return true;
}

function is_monster(entity)
{
	if(entity && entity.type=="monster") return true;
}

function is_character(entity)
{
	if(entity && entity.type=="character" && !entity.npc) return true;
}

function interact(name)
{
	if(name=="monsterhunt")
	{
		parent.socket.emit("monsterhunt");
		return parent.push_deferred("monsterhunt"); // {started:true} / {completed:true} / {failed:true}
	}
}

function enter(place,name)
{
	// Possible places: "duelland" / "crypt" / "winter_instance"
	parent.socket.emit('enter',{place:place,name:name});
	return parent.push_deferred("enter");
}

function join(event)
{
	// show_json(G.events);
	return parent.join(event);
}

function use_nearest_door()
{
	for(var i=0;i<(G.maps[character.map].doors||[]).length;i++)
	{
		var door=G.maps[character.map].doors[i];
		if(simple_distance(character,{map:character.map,x:door[0],y:door[1]})<100) // Server range is currently 112
			return transport(door[4],door[5]); // map and spawn
	}
	return rejecting_promise({reason:"distance"});
}

function activate(num) // activates an item, likely a booster, in the num-th inventory slot
{
	return parent.activate(num);
}

function shift(num,name) // shifts an item, likely a booster, in the num-th inventory slot
{
	// shift(0,'xpbooster')
	// shift(0,'luckbooster')
	// shift(0,'goldbooster')
	return parent.shift(num,name);
}

function throw_item(num,x,y)
{
	// Throw an inventory item to the ground - only items with "throw":true are throwable this way - Like confetti's
	parent.socket.emit('throw',{num:num,x:x,y:y});
	return parent.push_deferred("throw");
}

function use_skill(name,target,extra_arg)
{
	// target: object or string (character name or monster ID)
	// for "blink": use_skill("blink",[x,y])
	// for "3shot", "5shot" target can be an array of objects or strings (name or ID)
	// example: use_skill("3shot",[target1,target2,target3])
	// extra_arg is currently for use_skill("throw",target,inventory_num) and use_skill("energize",target,optional_mp)
	if(!target) target=get_target();
	return parent.use_skill(name,target,extra_arg);
	// Returns a Promise
	// For "3shot", "5shot", "cburst" returns an array of Promise's - one for each target
}

function reduce_cooldown(name,ms)
{
	// parent.next_skill contains Date objects of when the skills will be available next
	// show_json(parent.next_skill) to get a better idea
	// reduce_cooldown("attack",100) would cause the attack cooldown to reduce by 100 ms
	// If your ping is 100+ms - this would ~correct/improve/adjust the cooldown
	// attack(target).then(function(data){ reduce_cooldown("attack",character.ping*0.95); });
	// Above call is likely the ideal usage
	if(parent.next_skill[name])
		parent.skill_timeout(name,-mssince(parent.next_skill[name])-ms);
}

function bank_deposit(gold)
{
	if(!character.bank) return rejecting_promise({reason:"not_in_bank"});
	parent.socket.emit("bank",{operation:"deposit",amount:gold});
	return parent.push_deferred("bank");
}

function bank_withdraw(gold)
{
	if(!character.bank) return rejecting_promise({reason:"not_in_bank"});
	parent.socket.emit("bank",{operation:"withdraw",amount:gold});
	return parent.push_deferred("bank");
}

function bank_store(num,pack,pack_num)
{
	// bank_store(0) - Stores the first item in inventory in the first/best spot in bank
	// bank_store(41,"items0",41) -> stores the last item on the last spot of bank's "items0"
	// pack is one of "items0","items1","items2",...
	if(!character.bank) return rejecting_promise({reason:"not_in_bank"});
	if(!character.items[num]) return rejecting_promise({reason:"no_item"});
	if(pack_num===undefined) pack_num=-1; // the server interprets -1 as first slot available
	if(!pack)
	{
		var cp=undefined,cs=undefined;
		for(var cpack in bank_packs)
		{
			if(pack || bank_packs[cpack][0]!=character.map || !character.bank[cpack]) continue;
			for(var i=0;i<42;i++)
			{
				if(can_stack(character.bank[cpack][i],character.items[num],null,{ignore_pvp:true})) // the item we want to store and this bank item can stack - best case scenario
					pack=cpack;
				if(!character.bank[cpack][i] && !cp)
					cp=cpack;
			}
		}
		if(!pack && !cp) return rejecting_promise({reason:"bank_full"});
		if(!pack) pack=cp;
	}
	parent.socket.emit("bank",{operation:"swap",pack:pack,str:pack_num,inv:num});
	return parent.push_deferred("bank");
}

function bank_retrieve(pack,pack_num,num)
{
	// bank_retrieve("items0",0) -> retrieves the first item from bank's "items0"
	// bank_retrieve("items0",0,12) -> you can optionally specify where to retrieve the item in inventory
	if(!character.bank) return rejecting_promise({reason:"not_in_bank"});
	if(!character.bank[pack] || !character.bank[pack][pack_num]) return rejecting_promise({reason:"no_item"});
	if(num===undefined) num=-1; // the server interprets -1 as first slot available
	parent.socket.emit("bank",{operation:"swap",pack:pack,str:pack_num,inv:num});
	return parent.push_deferred("bank");
}

function bank_swap(pack,a,b)
{
	// bank_swap("items0",0,1) -> swaps the first 2 items
	parent.socket.emit("bank",{operation:"move",pack:pack,a:a,b:b});
	return parent.push_deferred("bank");
}

function swap(a,b) // inventory move/swap
{
	parent.socket.emit("imove",{a:a,b:b});
	return parent.push_deferred("imove");
}

function locate_item(name)
{
	for(var i=0;i<character.items.length;i++)
	{
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return -1;
}

function quantity(name)
{
	var q=0;
	for(var i=0;i<character.items.length;i++)
	{
		if(character.items[i] && character.items[i].name==name) q+=character.items[i].q||1;
	}
	return q;
}

function item_properties(item) // example: item_properties(character.items[0])
{
	if(!item || !item.name) return null;
	return calculate_item_properties(item);
}

function item_grade(item) // example: item_grade(character.items[0])
{
	// 0 Normal
	// 1 High
	// 2 Rare
	if(!item || !item.name) return -1;
	return calculate_item_grade(G.items[item.name],item);
}

function item_value(item) // example: item_value(character.items[0])
{
	if(!item || !item.name) return 0;
	return calculate_item_value(item);
}

async function transport(map,spawn)
{
	// For "bank" - the response is {success:false,in_progress:true}
	// You have to wait the entry through character.on("new_map",function(data){});
	parent.socket.emit('transport',{to:map,s:spawn});
	var call=await parent.push_deferred("transport");
	if(!call.in_progress) return call;
	for(var i=0;i<20000;i++) // 20 seconds
	{
		if(character.map==map) return {success:true};
		await sleep(1);
	}
	return {failed:true,reason:"timeout"};
}

async function town()
{
	parent.socket.emit('town');
	var call=await parent.push_deferred("town");
	if(call.failed) return call;
	while(character.c.town)
		await sleep(2);
	return {success:true}
}

function leave()
{
	// To leave "cyberland" / "jail" etc.
	parent.socket.emit('leave');
	return parent.push_deferred("leave");
}

function is_paused()
{
	return parent.paused;
}

function pause() // Pauses the Graphics
{
	parent.pause();
}

function get_socket()
{
	return parent.socket;
}

function get_map()
{
	return parent.G.maps[parent.current_map];
}

function set_message(text,color)
{
	if(color) text="<span style='color: "+color+"'>"+text+"</span>";

	if(!game.html) parent.set_status(text);
	else
	{
		current_message=text;
		// $('#gg').html(text); // added the code_draw function for performance [15/01/18]
		// also visit set_status on functions.js for a challenge (note to self)
		// Last note for now: There's probably a browser/chrome bug
		// If you move the cursor into the iframe once - each set_message breaks the cursor
		// Whether code_draw is used or not
		// That's why iframe's have "pointer-events: none;"s now
	}
}

function game_log(message,color,x)
{
	if(game.platform=="electron" && !x) return safe_log(message,color);
	if(!color) color="#51D2E1";
	if(character.bot) parent.parent.add_log(character.name+": "+message,color);
	else parent.add_log(message,color);
}

function log(message,color)
{
	if(is_object(message)) message=JSON.stringify(message);
	game_log(message,color);
}

function safe_log(message,color)
{
	// If the logged message/object is from an untrusted source, this function must be used
	// For example if you: character.on("cm",function(data){log(data)});
	// Someone can: send_cm("You","<script>alert('All your items are now mine!')</script>");
	if(is_object(message)) message=JSON.stringify(message);
	game_log(html_escape(message),color,true);
}

function get_focus()
{
	// focus is a secondary target that appears on top of the actual target
	// it was added to let you view other characters around and still target separately
	if(parent.xtarget && parent.xtarget.visible) return parent.xtarget;
	return null;
}

function get_target_of(entity) // .target is a Name for Monsters and `id` for Players - this function return whatever the entity in question is targeting
{
	if(!entity || !entity.target) return null;
	if(character.id==entity.target) return character;
	for(var id in parent.entities)
	{
		var e=parent.entities[id];
		if(e.id==entity.target) return e;
	}
	return null;
}

function get_target()
{
	if(parent.ctarget && parent.ctarget.visible) return parent.ctarget;
	if(parent.xtarget && parent.xtarget.visible) return parent.xtarget;
	return null;
}

function get_targeted_monster()
{
	if(parent.ctarget && !parent.ctarget.dead && parent.ctarget.type=='monster') return parent.ctarget;
	return null;
}

function change_target(target)
{
	parent.ctarget=target;
	return parent.send_target_logic();
}

function change_target_privately(target)
{
	parent.ctarget=target;
	if(target) parent.last_id_sent=target.id; // Marks the id as sent, so it doesn't actually get sent
	else parent.last_id_sent='';
	return parent.send_target_logic();
}

function can_move_to(x,y)
{
	if(is_object(x)) y=x.real_y,x=x.real_x;
	return can_move({map:character.map,x:character.real_x,y:character.real_y,going_x:x,going_y:y,base:character.base});
}

function xmove(x,y)
{
    if(can_move_to(x,y)) return move(x,y);
    else return smart_move({x:x,y:y});
}

function is_in_range(target,skill)
{
	// Valid usages: is_in_range(target), is_in_range(target,"attack"), is_in_range(target,"heal"), is_in_range(target,"mentalburst")
	if(!target || !target.visible) return false;
	// When a target leaves your viewpoint, .visible becomes false and the object reference is never updated again
	var range_multiplier=1,range_bonus=0;
	if(G.skills[skill] && G.skills[skill].range)
	{
		if(distance(character,target)<=G.skills[skill].range) return true;
		return false;
	}
	if(G.skills[skill] && G.skills[skill].range_multiplier) range_multiplier=G.skills[skill].range_multiplier;
	if(G.skills[skill] && G.skills[skill].range_bonus) range_bonus=G.skills[skill].range_bonus;
	if(distance(character,target)<=character.range*range_multiplier+range_bonus) return true;
	return false;
}

function is_on_cooldown(skill)
{
	if(G.skills[skill] && G.skills[skill].share) return is_on_cooldown(G.skills[skill].share);
	if(parent.next_skill[skill] && new Date()<parent.next_skill[skill]) return true;
	return false;
}

function can_attack(target)
{
	// better to use is_on_cooldown("attack") just for cooldown checks
	// also works for "heal" as G.skills.heal shares the "attack" cooldown
	// is_disabled function checks .rip and .stunned
	if(!target) return false;
	if(!parent.is_disabled(character) && is_in_range(target) && new Date()>=parent.next_skill.attack) return true;
	return false;
}

function can_heal(t)
{
	if(is_monster(t)) return false; // ?? :D [11/10/18]
	return can_attack(t);
}

function is_moving(entity)
{
	if(entity.me && smart.moving) return true;
	if(entity.moving) return true;
	return false;
}

function is_transporting(entity)
{
	if(entity.c.town) return true;
	if(entity.me && parent.transporting) return true;
	return false;
}

function attack(target)
{
	if(target==character) target=parent.character;
	if(!target)
	{
		game_log("Nothing to attack()","gray");
		return rejecting_promise({reason:"not_found"});
	}
	if(target.type=="character")
		return parent.player_attack.call(target,null,true);
	else
		return parent.monster_attack.call(target,null,true);
}

function heal(target)
{
	if(target==character) target=parent.character; // Don't send the proxy object to parent [10/06/19]
	if(!target)
	{
		game_log("No one to heal()","gray");
		return rejecting_promise({reason:"not_found"});
	}
	return parent.player_heal.call(target,null,true);
}

function buy(name,quantity) //item names can be spotted from show_json(character.items) - they can be bought only if an NPC sells them
{
	return parent.buy(name,quantity); // returns a Promise
}

function buy_with_gold(name,quantity)
{
	return parent.buy_with_gold(name,quantity); // returns a Promise
}

function buy_with_shells(name,quantity)
{
	// returns {success:false,in_progress:true}
	return parent.buy_with_shells(name,quantity);
}

function split(num,quantity) // splits the stack at from character.items[num] into a second stack of quantity
{
	return parent.split(num,quantity);
}

function sell(num,quantity) //sell an item from character.items by it's order - 0 to N-1
{
	return parent.sell(num,quantity);
}

function consume(num) // consumes or uses an inventory item
{
	parent.socket.emit("equip",{num:num,consume:true});
	return parent.push_deferred("equip");
}

function equip(num,slot) // slot is optional
{
	if(num<0)
	{
		game_log("Can't equip "+num);
		return rejecting_promise({reason:"invalid"});
	}
	else
	{
		parent.socket.emit("equip",{num:num,slot:slot});
		return parent.push_deferred("equip");
	}
}

function unequip(slot) // show_json(character.slots) => to see slot options
{
	parent.socket.emit("unequip",{slot:slot});
	return parent.push_deferred("unequip");
}

function lock_item(num)
{
	// Lock an item to prevent loss
	return parent.lock_item(num);
}

function seal_item(num)
{
	// Seal an item so it can't be unlocked for 2 days
	return parent.seal_item(num)
}

function unlock_item(num)
{
	// Unlock an item, returns {hours:47,success:false,in_progress:true} if it was sealed
	return parent.unlock_item(num);
}

function trade(num,trade_slot,price,quantity) 
{
	// where trade_slot is 1 to 16
	// example, trade(0,4,1000) puts the first item in inventory to the 4th trade slot for 1000 gold [27/10/16]
	if(!is_string(trade_slot) || !trade_slot.startsWith("trade")) trade_slot="trade"+trade_slot;
	return parent.trade(trade_slot,num,price,quantity||1);
}

function trade_buy(target,trade_slot,quantity)
{
	// buys the item from a target by slot name
	// target needs to be an actual player object
	// quantity is optional
	return parent.trade_buy(trade_slot,target.id,target.slots[trade_slot].rid,quantity||1); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}

function trade_sell(target,trade_slot,quantity)
{
	// sells an item to a target's buy listing by slot name
	// server automatically checks/picks the item from your inventory to sell
	// target needs to be an actual player object
	// quantity is optional
	return parent.trade_sell(trade_slot,target.id,target.slots[trade_slot].rid,quantity||1); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}

function wishlist(trade_slot,name,price,level,quantity)
{
	// where trade_slot is 1 to 16
	// example: trade(0,"staff",10000000,9) Wishlists an +9 Staff for 10,000,000
	if(!is_string(trade_slot) || !trade_slot.startsWith("trade")) trade_slot="trade"+trade_slot;
	return parent.wishlist(trade_slot,name,price,quantity||1,level);
}

function giveaway(slot,num,q,minutes)
{
	// example: giveaway("trade1",0,12,20) - Gives away 12X of Inventory[0] at "trade1" with a 20 minutes cooldown
	return parent.giveaway(slot,num,q,minutes)
}

function join_giveaway(name,slot,rid)
{
	// example: join_giveaway("CharacterName","trade1",get_player("CharacterName").slots.trade1.rid);
	return parent.join_giveaway(slot,name,rid);
}

function upgrade(item_num,scroll_num,offering_num,only_calculate) // number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
	return parent.upgrade(item_num,scroll_num,offering_num,"code",only_calculate); // returns a Promise
}

function compound(item0,item1,item2,scroll_num,offering_num,only_calculate) // for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
{
	return parent.compound(item0,item1,item2,scroll_num,offering_num,"code",only_calculate); // returns a Promise
}

function craft(i0,i1,i2,i3,i4,i5,i6,i7,i8)
// for example -> craft(null,0,null,null,1,null,null,2,null)
// sends 3 items to be crafted, the 0th, 1st, 2nd items in your inventory, and it places them all in the middle column of crafting
{
	parent.cr_items=[i0,i1,i2,i3,i4,i5,i6,i7,i8];
	return parent.craft();
}

function auto_craft(name)
{
	// Picks the inventory positions automatically. Example: auto_craft("computer")
	return parent.auto_craft(name,true);
}

function dismantle(item_num)
{
	parent.ds_item=item_num;
	return parent.dismantle();
}

async function exchange(item_num)
{
	parent.e_item=item_num;
	var call=await parent.exchange(1),num=undefined,name=undefined;
	if(!call.in_progress) return call;
	if(character.q.exchange) num=character.q.exchange.num;
	while(character.q.exchange || character.items[num] && character.items[num].name=="placeholder")
		await sleep(1);
	if(character.items[num]) name=character.items[num].name;
	else num=undefined;
	return {success:true,reward:name,num:num};
}

function exchange_buy(token,name)
{
	// Example: exchange_buy('funtoken','confetti')
	return parent.exchange_buy(token,name);
}

function say(message) // please use MORE responsibly, thank you! :)
{
	return parent.say(message,safeties);
}

function party_say(message)
{
	return parent.party_say(message,safeties);
}

function pm(name,message)
{
	return parent.private_say(name,message,safeties);
}

function move(x,y)
{
	if(!can_walk(character)) return rejecting_promise({reason:"unable"});
	return parent.move(x,y,true);
}

function cruise(speed)
{
	// to revert, just cruise(500) - since it just sets an upper cap for speed
	parent.socket.emit("cruise",speed);
	return parent.push_deferred("cruise");
}

function equip_cx(slot,cx_name)
{
	// Equipped: show_json(character.cx)
	// Available: show_json(character.acx)
	parent.socket.emit("cx",{slot:slot,name:cx_name});
	return parent.push_deferred("cx");
}

function show_json(e) // renders the object as json inside the game
{
	if(character.bot) parent.parent.show_json(parent.game_stringify(e,'\t'));
	else parent.show_json(parent.game_stringify(e,'\t'));
}

function get_servers()
{
	// returns an array of server data
	// best to inspect the format with show_json(get_servers())
	return parent.X.servers;
}

function get_characters()
{
	// returns an infrequently updated array of your characters
	// best to inspect the format with show_json(get_characters())
	return parent.X.characters;
}

function get_party()
{
	// returns an infrequently updated object
	// best to inspect the format with show_json(get_party())
	return parent.party;
}

function get_monster(id)
{
	// returns the monster by id, an integer, if the monster is within the vision area
	var target=parent.entities[id];
	if(target && target.type!="monster") target=null;
	return target;
}

function get_player(name)
{
	// returns the player by name, if the player is within the vision area
	var target=null,entities=parent.entities;
	if(name==character.name) target=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) target=entities[i];
	return target;
}

function get_entity(id)
{
	// entities are currently players, monsters and citizen npcs, this function returns players and monsters
	var target=parent.entities[id];
	if(id==character.name) target=character;
	return target;
}

function find_npc(npc_id)
{
	// returns smart_move'able coordinates for an NPC key from G.npcs
	for(var name in parent.G.maps)
	{
		var map=parent.G.maps[name];
		if(map.ignore || !map.npcs) continue;
		for(var i=0;i<map.npcs.length;i++)
		{
			var npc=map.npcs[i];
			if(npc.id==npc_id)
				return {map:name,"in":name,x:npc.position[0],y:npc.position[1]};
		}
	}
	return null;
}

function get_nearest_monster(args)
{
	//args:
	// max_att - max attack
	// min_xp - min XP
	// target: Only return monsters that target this "name" or player object
	// no_target: Only pick monsters that don't have any target
	// path_check: Checks if the character can move to the target
	// type: Type of the monsters, for example "goo", can be referenced from `show_json(G.monsters)` [08/02/17]
	var min_d=999999,target=null;

	if(!args) args={};
	if(args && args.target && args.target.name) args.target=args.target.name;
	if(args && args.type=="monster") game_log("get_nearest_monster: you used monster.type, which is always 'monster', use monster.mtype instead");
	if(args && args.mtype) game_log("get_nearest_monster: you used 'mtype', you should use 'type'");

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || !current.visible || current.dead) continue;
		if(args.type && current.mtype!=args.type) continue;
		if(args.min_xp && current.xp<args.min_xp) continue;
		if(args.max_att && current.attack>args.max_att) continue;
		if(args.target && current.target!=args.target) continue;
		if(args.no_target && current.target && current.target!=character.name) continue;
		if(args.path_check && !can_move_to(current)) continue;
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function get_nearest_hostile(args) // mainly as an example [08/02/17]
{
	var min_d=999999,target=null;

	if(!args) args={};
	if(args.friendship===undefined && character.owner) args.friendship=true;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="character" || !current.visible || current.rip || current.invincible || current.npc) continue;
		if(character.team && current.team==character.team) continue;
		if(!character.team && current.party && character.party==current.party) continue;
		if(!character.team && current.guild && character.guild==current.guild) continue;
		if(args.friendship && in_arr(current.owner,parent.friends)) continue;
		if(args.exclude && in_arr(current.name,args.exclude)) continue; // get_nearest_hostile({exclude:["Wizard"]}); Thanks
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function get_nearest_npc()
{
	// Just as an example
	var min_d=999999,target=null;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="npc") continue;
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function use_hp_or_mp()
{
	if(safeties && mssince(last_potion)<min(200,character.ping*3)) return resolving_promise({reason:"safeties",success:false,used:false});
	var used=true;
	if(is_on_cooldown("use_hp")) return resolving_promise({success:false,reason:"cooldown"});
	if(character.mp/character.max_mp<0.2) return use_skill('use_mp'); 
	else if(character.hp/character.max_hp<0.7) return use_skill('use_hp');
	else if(character.mp/character.max_mp<0.8) return use_skill('use_mp');
	else if(character.hp<character.max_hp) return use_skill('use_hp');
	else if(character.mp<character.max_mp) return use_skill('use_mp');
	else used=false;
	if(used)
		last_potion=new Date();
	else
		return resolving_promise({reason:"full",success:false,used:false});
}

function loot(id_or_arg)
{
	// loot(id) loots a specific chest
	// loot(true) allows code characters to make their commanders' loot instead, extremely useful [14/01/18]
	// after recent looting changes, loot(true) isn't too useful any more [08/12/19]
	if(id_or_arg && id_or_arg!==true) return parent.parent.open_chest(id_or_arg);
	var looted=0,last=null;
	if(safeties && mssince(last_loot)<min(300,character.ping*3)) return resolving_promise({success:false,reason:"safety"});
	last_loot=new Date();
	for(var id in parent.chests)
	{
		var chest=parent.chests[id];
		if(safeties && (chest.items>character.esize || chest.last_loot && mssince(chest.last_loot)<1600)) continue;
		chest.last_loot=last_loot;
		if(id_or_arg===true) last=parent.parent.open_chest(id);
		else last=parent.open_chest(id);
		looted++;
		if(looted==2) break;
	}
	if(!last) return resolving_promise({reason:"nothing_to_loot"});
	return last;
}

function get_chests()
{
	// parent.chests is an object, each key is a chest ID
	// you can: for(var id in get_chests()) loot(id);
	return parent.chests;
}

function open_stand(num)
{
	// Opens the merchant stand
	// Inventory# is optional
	if(num===undefined)
	{
		for(var i=0;i<42;i++)
			if(character.items[i] && G.items[character.items[i].name].stand)
				num=i;
	}
	return parent.open_merchant(num);
}

function close_stand()
{
	return parent.close_merchant();
}

function send_gold(receiver,gold)
{
	if(!receiver)
	{
		game_log("No receiver sent to send_gold");
		return rejecting_promise({reason:"no_target"});
	}
	if(receiver.name) receiver=receiver.name;
	parent.socket.emit("send",{name:receiver,gold:gold});
	return parent.push_deferred("send");
}

function send_item(receiver,num,quantity)
{
	if(!receiver)
	{
		game_log("No receiver sent to send_item");
		return rejecting_promise({reason:"no_target"});
	}
	if(receiver.name) receiver=receiver.name;
	parent.socket.emit("send",{name:receiver,num:num,q:quantity||1});
	return parent.push_deferred("send");
}

function send_cx(receiver,cx)
{
	// Sends cosmetics to one of your own characters
	if(!receiver)
	{
		game_log("No receiver sent to send_cx");
		return rejecting_promise({reason:"no_target"});
	}
	if(receiver.name) receiver=receiver.name;
	parent.socket.emit("send",{name:receiver,cx:cx});
	return parent.push_deferred("send");
}

function send_mail(to,subject,message,item)
{
	// returns {success:false,in_progress:true}
	item=item&&true||false; // 0th slot is sent
	parent.socket.emit('mail',{to:to,subject:subject,message:message,item:item});
	return parent.push_deferred("mail");
}

function destroy(num) // num: 0 to 41
{
	parent.p_item=num;
	return parent.poof(1);
}

function send_party_invite(name,is_request) // name could be a player object, name, or id
{
	if(is_object(name)) name=name.name;
	parent.socket.emit('party',{event:is_request&&'request'||'invite',name:name});
	return parent.push_deferred("party");
}

function send_party_request(name)
{
	send_party_invite(name,1);
	return parent.push_deferred("party");
}

function accept_party_invite(name)
{
	parent.remove_chat("pin"+name);
	parent.socket.emit('party',{event:'accept',name:name});
	return parent.push_deferred("party");
}

function accept_party_request(name)
{
	parent.remove_chat("rq"+name);
	parent.socket.emit('party',{event:'raccept',name:name});
	return parent.push_deferred("party");
}

function leave_party()
{
	parent.socket.emit("party",{event:"leave"});
	return parent.push_deferred("party");
}

function kick_party_member(name)
{
	parent.socket.emit('party',{event:'kick',name:name});
	return parent.push_deferred("party");
}

function accept_magiport(name)
{
	parent.remove_chat("mp"+name);
	parent.socket.emit('magiport',{name:name});
	return parent.push_deferred("magiport");
}

function unfriend(name) // instead of a name, an owner id also works, this is currently the only way to unfriend someone [20/08/18]
{
	parent.socket.emit('friend',{event:'unfriend',name:name});
	return parent.push_deferred("friend");
}

function respawn()
{
	parent.socket.emit('respawn');
	return parent.push_deferred("respawn");
}

function set_home()
{
	parent.socket.emit('set_home');
	return parent.push_deferred("set_home");
}

function handle_command(command,args) // command's are things like "/party" that are entered through Chat - args is a string
{
	// game_log("Command: /"+command+" Args: "+args);
	// return true;
	return -1;
}

async function send_cm(to,message)
{
	// to: Name or Array of Name's
	// message: JSON object
	// Receive with: character.on("cm",function(m){ m.name; m.message; });
	var to_server=[],locals=[],data={locals:[],receivers:[]};
	if(!is_array(to)) to=[to];
	to.forEach(function(name){
		if(is_character_local(name)) send_local_cm(name,message),locals.push(name);
		else to_server.push(name);
	})
	if(to_server.length)
		data=await send_server_cm(to_server,message); // message over the server - has a high call cost / character.cc
	locals.forEach(function(name){
		data.locals.push(name);
		data.receivers.push(name);
	})
	return data;
}

function send_server_cm(to,message)
{
	// to: Name or Array of Name's
	// message: JSON object
	// returns a Promise with {receivers:[]}
	return parent.send_code_message(to,message);
}

function on_disappear(entity,data)
{
	// game_log("disappear: "+entity.id+" "+JSON.stringify(data));
}

function on_party_invite(name) // called by the inviter's name
{
	// accept_party_invite(name)
}

function on_party_request(name) // called by the inviter's name - request = someone requesting to join your existing party
{
	// accept_party_request(name)
}

function on_magiport(name) // called by the mage's name in PVE servers, in PVP servers magiport either succeeds or fails without consent
{
	// accept_magiport(name)
}

function on_map_click(x,y)
{
	// if true is returned, the default move is cancelled
	// xmove(x,y);
	// return true;
}

function on_destroy() // called just before the CODE is destroyed
{
	clear_drawings();
	clear_buttons();
}

function on_draw() // the game calls this function at the best place in each game draw frame, so if you are playing the game at 60fps, this function gets called 60 times per second
{

}

var PIXI=parent.PIXI; // for drawing stuff into the game
var drawings=parent.drawings;
var buttons=parent.code_buttons;

//Documentation: https://pixijs.github.io/docs/PIXI.Graphics.html
function draw_line(x,y,x2,y2,size,color)
{
	// keep in mind that drawings could significantly slow redraws, especially if you don't .destroy() them
	if(!game.graphics) return;
	if(!color) color=0xF38D00;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.moveTo(x,y);
	e.lineTo(x2,y2);
	e.endFill();
	parent.drawings.push(e); //for the game to keep track of your drawings
	parent.map.addChild(e); //e.destroy() would remove it, if you draw too many things and leave them there, it will likely bring the game to a halt
	return e;
}

// Example: draw_circle(character.real_x,character.real_y,character.range) :) [22/10/16]
function draw_circle(x,y,radius,size,color)
{
	if(!game.graphics) return;
	if(!color) color=0x00F33E;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.drawCircle(x,y,radius);
	parent.drawings.push(e);
	parent.map.addChild(e);
	return e;
}

function clear_drawings()
{
	drawings.forEach(function(e){
		try{e.destroy({children:true})}catch(ex){}
	});
	drawings=parent.drawings=[];
}

function add_top_button(id,value,fn)
{
	if(!buttons[id])
	{
		buttons[id]={value:value,fn:function(){},place:"top"};
		parent.$(".codebuttons").append("<div class='gamebutton codebutton"+id+"' data-id='"+id+"' onclick='code_button_click(this)'>BUTTON</div> ")
	}
	if(fn) set_button_onclick(id,fn)
	if(value) set_button_value(id,value);
}

function add_bottom_button(id,value,fn)
{
	if(!buttons[id])
	{
		buttons[id]={value:value,fn:function(){},place:"bottom"};
		parent.$(".codebbuttons").append("<div class='gamebutton gamebutton-small codebutton"+id+"' data-id='"+id+"' onclick='code_button_click(this)'>BUTTON</div> ")
	}
	if(fn) set_button_onclick(id,fn)
	if(value) set_button_value(id,value);
}

function set_button_value(id,value)
{
	parent.$(".codebutton"+id).html(value);
}

function set_button_color(id,color)
{
	parent.$(".codebutton"+id).css("border-color",color);
}

function set_button_onclick(id,fn)
{
	buttons[id].fn=fn;
}

function clear_buttons()
{
	parent.$('.codebuttons').html("");
	parent.$('.codebbuttons').html("");
	buttons=parent.code_buttons={};
}

character.listeners=[];
character.all=function(f){
	var def={f:f,id:randomStr(30),event:"all"};
	character.listeners.push(def);
	return def.id;
};
character.once=function(event,f){ // gets overwritten if another handler comes along
	var def={f:f,id:randomStr(30),event:event,once:true};
	character.listeners.push(def);
	return def.id;
};
character.on=function(event,f){
	var def={f:f,id:randomStr(30),event:event};
	character.listeners.push(def);
	return def.id;
};
character.trigger=function(event,args){
	var new_listeners=[];
	for(var i=0;i<character.listeners.length;i++)
	{
		var l=character.listeners[i];
		if(l.event==event || l.event=="all")
		{
			try{
				if(l.event=="all") l.f(event,args)
				else l.f(args,event);
			}
			catch(e)
			{
				game_log("Listener Exception ("+l.event+") "+e,colors.code_error);
			}
			if(l.once || l.f && l.f.delete);
			else new_listeners.push(l);
		}
		else new_listeners.push(l);
	}
	character.listeners=new_listeners;
};

game.listeners=[];
game.all=function(f){
	var def={f:f,id:randomStr(30),event:"all"};
	game.listeners.push(def);
	return def.id;
};
game.on=function(event,f){
	var def={f:f,id:randomStr(30),event:event};
	game.listeners.push(def);
	return def.id;
};
game.once=function(event,f){
	var def={f:f,id:randomStr(30),event:event,once:true};
	game.listeners.push(def);
	return def.id;
};
game.remove=function(id){
	for(var i=0;i<game.listeners.length;i++)
	{
		if(game.listeners[i].id==id)
		{
			game.listeners.splice(i,1);
			break;
		}
	}
};
game.trigger=function(event,args){
	var new_listeners=[];
	for(var i=0;i<game.listeners.length;i++)
	{
		var l=game.listeners[i];
		if(l.event==event || l.event=="all")
		{
			try{
				if(l.event=="all") l.f(event,args)
				else l.f(args,event);
			}
			catch(e)
			{
				game_log("Listener Exception ("+l.event+") "+e,colors.code_error);
			}
			if(l.once || l.f && l.f.delete);
			else new_listeners.push(l);
		}
		else new_listeners.push(l);
	}
	game.listeners=new_listeners;
};

function trigger_character_event(name,data)
{
	character.trigger(name,data);
}

function trigger_event(name,data)
{
	game.trigger(name,data);
}

function preview_item(def,args)
{
	//PLANNED Improvements:
	//- Importing a custom thumbnail
	//- Drafting custom item abilities
	// Email me or create an issue if you need these features (if you want to suggest new items) [20/03/17]
	if(!args) args={};
	var html="";
	var styles="vertical-align: top; margin: 10px";
	var name=def.id||args.id||"staff";
	parent.prop_cache={}; // bust the item cache
	if(def.compound || def.upgrade)
	{
		for(var level=0;level<=10;level++)
			html+=parent.render_item("html",{item:def,name:name,styles:styles,actual:{name:name,level:level},sell:true,thumbnail:args.thumbnail});
	}
	else
	{
		html+=parent.render_item("html",{item:def,name:name,thumbnail:args.thumbnail});
	}
	html+="<div style='margin: 10px; border: 5px solid gray; padding: 4px'>"+parent.json_to_html(def)+"</div>";
	parent.show_modal(html);
	parent.prop_cache={};
}

function set_skillbar() // example: set_skillbar("1","2","3","4","R") or set_skillbar(["1","2","3","4","R"])
{
	var arr=["1"];
	if(is_array(arguments[0])) arr=arguments[0];
	else
	{
		arr=[];
		for(var i=0;i<arguments.length;i++) arr.push(arguments[i]);
	}
	parent.set_setting(parent.real_id,"skillbar",arr);
	parent.skillbar=arr;
	parent.render_skills(); parent.render_skills();
}

function set_keymap(keymap) // example: {"1":{"name":"use_mp"},"2":{"name":"use_hp"}}
{
	parent.set_setting(parent.real_id,"keymap",keymap);
	parent.keymap=keymap;
	parent.render_skills(); parent.render_skills();
}

function map_key(key,skill,code) // example: map_key("1","use_hp") or map_key("2","snippet","say('OMG')") or map_key("1","esc") or map_key("ESC","up")
{
	var settings=parent.get_settings(parent.real_id);
	var keymap=settings.keymap||parent.keymap;
	if(is_string(skill)) keymap[key]={"name":skill};
	else keymap[key]=skill;
	if(code) keymap[key].code=code;
	if(keymap[key].keycode) parent.K[keymap[key].keycode]=key;
	set_keymap(keymap);
}

function unmap_key(key)
{
	var settings=parent.get_settings(parent.real_id);
	var keymap=settings.keymap||parent.keymap;
	delete keymap[key];
	set_keymap(keymap);
}

function reset_mappings()
{
	parent.keymap={};
	parent.skillbar=[];
	parent.map_keys_and_skills();
	set_keymap(parent.keymap);
	set_skillbar(parent.skillbar);
}


// delete previous/stale messages
for (var key in localStorage)
{
	if(key.startsWith("cm_"+character.name+"_"))
	{
		var data=localStorage.getItem(key);
		localStorage.removeItem(key);
		game_log("Removed a stale code message from: "+JSON.parse(data)[0],"gray");
	}
}

function local_cm_logic()
{
	// Warning: localStorage is very slow, with a localStorage that's filled with MB's of data, this routine might take 8-9ms each time
	var activity=localStorage.getItem("activity"+(game.cli&&character.name||"")),messages=[],start=new Date();
	activity=activity&&JSON.parse(activity)||{};
	if(!activity.heartbeat) activity.heartbeat={};
	if(activity.cm) delete activity.cm;
	if(!activity.heartbeat[character.name] || mssince(new Date(activity.heartbeat[character.name]))>320)
	{
		activity.heartbeat[character.name]=(new Date()).toString();
		localStorage.setItem("activity"+(game.cli&&character.name||""),JSON.stringify(activity));
	}
	var keys=Object.keys(localStorage);
	if(game.cli) keys=localStorage._keys;
	keys.forEach(function(key){ // 2x faster than for(key in localStorage)
		{
			if(key.startsWith("cm_"+character.name+"_"))
			{
				var data=localStorage.getItem(key);
				localStorage.removeItem(key);
				data=JSON.parse(data);
				data[2]=new Date(data[2]);
				messages.push(data);
			}
		}
	});

	messages.sort(function(a,b){
		if(!(a[2]-b[2]))
			return a[3]-b[3];
		else
			return a[2]-b[2];
	});

	messages.forEach(function(cm){
		try{
			character.trigger("cm",{name:cm[0],message:cm[1],date:cm[2],local:true});
		}catch(e){
			game_log("CM Error, From: "+cm[0]);
			log(e);
			log(e.stack);
		}
	});
	setTimeout(local_cm_logic,min(120,max(16,mssince(start)*10)));
}
setTimeout(local_cm_logic,10);

var local_m_num=0;
function send_local_cm(name,data)
{
	if(game.cli) parent.CLI_OUT.push({"type":"cm","to":name,"data":[character.name,data,new Date(),++local_m_num]});
	else localStorage.setItem("cm_"+name+"_"+randomStr(20),JSON.stringify([character.name,data,new Date(),++local_m_num]));
}

function is_character_local(name)
{
	var activity=localStorage.getItem("activity"+(game.cli&&name||""));
	activity=activity&&JSON.parse(activity)||{};
	if(activity.heartbeat && activity.heartbeat[name] && mssince(new Date(activity.heartbeat[name]))<2880)
		return true;
	return false;
}

function pset(name,value)
{
	// persistent set function for string values
	// on Web, window.localStorage is used, on Steam/Mac, the electron-store package is used for persistent storage
	return parent.storage_set(name,value);
}

function pget(name)
{
	// persistent get function for string values
	// on Web, window.localStorage is used, on Steam/Mac, the electron-store package is used for persistent storage
	return parent.storage_get(name);
}

function set(name,value)
{
	// persistent set function that works for serializable objects
	try{
		window.localStorage.setItem("cstore_"+name,JSON.stringify(value));
		return true;
	}catch(e){
		game_log("set() call failed for: "+name+" reason: "+e,colors.code_error);
		return false;
	}
}

function get(name)
{
	// persistent get function that works for serializable objects
	try{
		return JSON.parse(window.localStorage.getItem("cstore_"+name));
	}catch(e){
		return null;
	}
}

function load_code(name_or_slot,onerror)
{
	// load_code executes the code at top-level in a synchronized manner
	// each function/variable becomes directly available
	// onerror can be a function that will be executed if load_code fails

	var code=parent.get_code_file(name_or_slot); // works on Electron, returns the local file

	if(code===null)
	{
		var xhrObj = new XMLHttpRequest();
		xhrObj.open('GET',"/code.js?name="+encodeURIComponent(name_or_slot)+"&timestamp="+(new Date().getTime()), false);
		xhrObj.send('');
		code=xhrObj.responseText;
	}

	var library=document.createElement("script");
	library.type="text/javascript";
	library.text=code;
	library.onerror=onerror||function(){ game_log("load_code: Failed to load",colors.code_error); };
	document.getElementsByTagName("head")[0].appendChild(library);
}

function require_code(name_or_slot)
{
	// require_code executes code inside it's own scope in a synchronized manner
	// functions returns the exports dictionary, emulating a require

	var code=parent.get_code_file(name_or_slot);

	if(code===null)
	{
		var xhrObj = new XMLHttpRequest();
		xhrObj.open('GET',"/code.js?name="+encodeURIComponent(name_or_slot)+"&xrequire=1&timestamp="+(new Date().getTime()), false);
		xhrObj.send('');
		code=xhrObj.responseText;
	}
	
	var module={exports:{}};
	var exports=module.exports;

	eval(code);

	return module.exports;
}

function upload_code(slot_number,slot_name,code_string)
{
	// Some players use the code slots to persist data across platforms, but please use it sparingly :) [04/08/20]
	return parent.api_call("save_code",{code:code_string,slot:slot_number,name:slot_name,auto:true,electron:true},{promise:true});
}

var active_code_slot=parent.code_slot||"";
function get_active_code_slot()
{
	return active_code_slot;
}

function get_edited_code_slot()
{
	// Current slot on the CODE Editor
	return parent.code_slot;
}

function disconnect()
{
	// Forces a limitdc
	for(var i=0;i<300;i++)
		parent.socket.emit("cruise");
}

var smart={
	moving:false,
	map:"main",x:0,y:0,
	on_done:function(){},
	plot:null,
	edge:20, // getting 20px close to the target is enough
	baby_edge:80, // start treading lightly when 60px close to the target or starting point
	try_exact_spot: false,
	use_town:false,
	prune:{
		smooth:true,
		map:true,
	},
	flags:{}
};

function smart_move(destination,on_done)
{
	// despite the name, smart_move isn't very smart or efficient, it's up to the players to implement a better movement method [05/02/17]
	// on_done function is an old callback function for compatibility, smart_move also returns a Promise [25/03/20]
	if(smart.moving) smart.on_done(false,"interrupted");
	smart.map="";
	if(is_string(destination)) destination={to:destination};
	if(is_number(destination)) destination={x:destination,y:on_done},on_done=null;
	if("x" in destination)
	{
		smart.map=destination.map||character.map;
		smart.x=destination.x;
		smart.y=destination.y;
	}
	else if("to" in destination || "map" in destination)
	{
		if(destination.to=="town") destination.to="main";
		if(G.events[destination.to] && parent.S[destination.to] && G.events[destination.to].join)
		{
			join(destination.to);
			smart.moving=false;
			smart.on_done(true);
			return;
		}
		else if(G.monsters[destination.to])
		{
			var locations=[],theone;
			for(var name in G.maps)
				(G.maps[name].monsters||[]).forEach(function(pack){
					if(pack.type!=destination.to || G.maps[name].ignore || G.maps[name].instance) return;
					if(pack.boundaries) // boundaries: for phoenix, mvampire
					{
						pack.last=pack.last||0;
						var boundary=pack.boundaries[pack.last%pack.boundaries.length];
						pack.last++;
						locations.push([boundary[0],(boundary[1]+boundary[3])/2,(boundary[2]+boundary[4])/2]);
					}
					else if(pack.boundary)
					{
						var boundary=pack.boundary;
						locations.push([name,(boundary[0]+boundary[2])/2,(boundary[1]+boundary[3])/2]);
					}
				});
			if(locations.length) // This way, when you smart_move("snake") repeatedly - you can keep visiting different maps with snakes
			{
				theone=random_one(locations);
				smart.map=theone[0]; smart.x=theone[1]; smart.y=theone[2];
			}
		}
		else if(G.maps[destination.to||destination.map])
		{
			if(G.maps[destination.to||destination.map].event)
			{
				if(parent.S[G.maps[destination.to||destination.map].event])
				{
					join(G.maps[destination.to||destination.map].event);
					smart.moving=false;
					smart.on_done(true);
					return;
				}
				else
				{
					game_log("Path not found!","#CF575F");
					smart.moving=false;
					smart.on_done(false,"failed");
					return;
				}
			}
			else
			{
				smart.map=destination.to||destination.map;
				smart.x=G.maps[smart.map].spawns[0][0];
				smart.y=G.maps[smart.map].spawns[0][1];
			}
		}
		else if(destination.to=="upgrade" || destination.to=="compound") smart.map="main",smart.x=-204,smart.y=-129;
		else if(destination.to=="exchange") smart.map="main",smart.x=-26,smart.y=-432;
		else if(destination.to=="potions" && character.map=="halloween") smart.map="halloween",smart.x=149,smart.y=-182;
		else if(destination.to=="potions" && in_arr(character.map,["winterland","winter_inn","winter_cave"])) smart.map="winter_inn",smart.x=-84,smart.y=-173;
		else if(destination.to=="potions") smart.map="main",smart.x=56,smart.y=-122;
		else if(destination.to=="scrolls") smart.map="main",smart.x=-465,smart.y=-71;
		else if(find_npc(destination.to))
		{
			var l=find_npc(destination.to);
			smart.map=l.map,smart.x=l.x,smart.y=l.y+15;
		}
	}
	if(!smart.map)
	{
		game_log("Unrecognized location","#CF5B5B");
		return rejecting_promise({reason:"invalid"});
	}
	smart.moving=true;
	smart.plot=[]; smart.flags={}; smart.searching=smart.found=false;
	if(destination.return)
	{
		var cx=character.real_x,cy=character.real_y,cmap=character.map;
		smart.on_done=function(done,reason){
			if(on_done) on_done(done);
			smart_move({map:cmap,x:cx,y:cy});
			if(done) resolve_deferreds("smart_move",{success:true});
			else reject_deferreds("smart_move",{reason:reason});
		}
	}
	else smart.on_done=function(done,reason){
		if(on_done) on_done(done);
		if(done) resolve_deferreds("smart_move",{success:true});
		else reject_deferreds("smart_move",{reason:reason});
	};
	console.log("smart_move: "+smart.map+" "+smart.x+" "+smart.y);
	return push_deferred("smart_move");
}

function stop(action,second)
{
	if(!action || action=="move" || action=="smart")
	{
		if(smart.moving) smart.on_done(second||false,"interrupted");
		smart.moving=false;
		if(action!="smart") return move(character.real_x,character.real_y);
		return resolving_promise({success:true});
	}
	else if(action=="invis")
	{
		parent.socket.emit("stop",{action:"invis"});
	}
	else if(action=="teleport" || action=="town")
	{
		parent.socket.emit("stop",{action:"town"});
	}
	else if(action=="revival")
	{
		parent.socket.emit("stop",{action:"revival"});
	}
	return push_deferred("stop");
}

var queue=[],visited={},start=0,best=null;
var moves=[[0,15],[0,-15],[15,0],[-15,0]];
var baby_steps=[[0,5],[0,-5],[5,0],[-5,0]];
// baby_steps is a new logic, used just around the target or starting point, to get out of tough spots [08/03/19]

function plot(index)
{
	if(index==-1) return;
	plot(queue[index].i); // Recursively back-tracks the path we came from
	smart.plot.push(queue[index]);
}

function qpush(node)
{
	// If we haven't visited this location, adds the location to the queue
	if(smart.prune.map && smart.flags.map && node.map!=smart.map) return;
	if(visited[node.map+"-"+node.x+"-"+node.y]) return;
	if(!node.i) node.i=start; // set the index, to aid the plot function
	queue.push(node);
	visited[node.map+"-"+node.x+"-"+node.y]=true;
}

function smooth_path()
{
	var i=0,j;
	while(i<smart.plot.length)
	{
		// Assume the path ahead is [i] [i+1] [i+2] - This routine checks whether [i+1] could be skipped
		// The resulting path is smooth rather than rectangular and bumpy
		// Try adding "function smooth_path(){}" or "smart.prune.smooth=false;" to your Code
		// [06/07/18]: (!smart.plot[i+2] || !smart.plot[i+2].transport) - without this condition, in "winterland", move(-160,-660), smart_move("main") fails
		while(i+2<smart.plot.length && smart.plot[i].map==smart.plot[i+1].map && smart.plot[i].map==smart.plot[i+1].map && (!smart.plot[i+2] || !smart.plot[i+2].transport) &&
			can_move({map:smart.plot[i].map,x:smart.plot[i].x,y:smart.plot[i].y,going_x:smart.plot[i+2].x,going_y:smart.plot[i+2].y,base:character.base}))
				smart.plot.splice(i+1,1);
		i++;
	}
}

function bfs()
{
	var timer=new Date(),result=null,optimal=true;

	while(start<queue.length)
	{
		var current=queue[start];
		// game_log(current.x+" "+current.y);
		var map=G.maps[current.map];
		var c_moves=moves,qlist=[];
		if(current.map==smart.map)
		{
			var c_dist=abs(current.x-smart.x)+abs(current.y-smart.y);
			var s_dist=abs(current.x-smart.start_x)+abs(current.y-smart.start_y);
			smart.flags.map=true;
			if(c_dist<smart.baby_edge || s_dist<smart.baby_edge || map.small_steps) c_moves=baby_steps;
			if(c_dist<smart.edge)
			{
				result=start;
				break;
			}
			else if(best===null || abs(current.x-smart.x)+abs(current.y-smart.y)<abs(queue[best].x-smart.x)+abs(queue[best].y-smart.y))
			{
				best=start;
			}
		}
		else if(current.map!=smart.map)
		{
			if(smart.prune.map && smart.flags.map) {start++; continue;}
			map.doors.forEach(function(door){
				// if(simple_distance({x:map.spawns[door[6]][0],y:map.spawns[door[6]][1]},{x:current.x,y:current.y})<30)
				if(smart.map!="bank" && door[4]=="bank" && !G.maps[current.map].mount || door[8]=="complicated") return; // manually patch the bank shortcut
				if(is_door_close(current.map,door,current.x,current.y) && can_use_door(current.map,door,current.x,current.y))
					qlist.push({map:door[4],x:G.maps[door[4]].spawns[door[5]||0][0],y:G.maps[door[4]].spawns[door[5]||0][1],transport:true,s:door[5]||0});
			});
			map.npcs.forEach(function(npc){
				if(npc.id=="transporter" && simple_distance({x:npc.position[0],y:npc.position[1]},{x:current.x,y:current.y})<75)
				{
					for(var place in G.npcs.transporter.places)
					{
						qlist.push({map:place,x:G.maps[place].spawns[G.npcs.transporter.places[place]][0],y:G.maps[place].spawns[G.npcs.transporter.places[place]][1],transport:true,s:G.npcs.transporter.places[place]});
					}
				}
			});
		}

		if(smart.use_town) qpush({map:current.map,x:map.spawns[0][0],y:map.spawns[0][1],town:true}); // "town"

		shuffle(c_moves);
		c_moves.forEach(function(m){
			var new_x=current.x+m[0],new_y=current.y+m[1];
			// game_log(new_x+" "+new_y);
			// utilise can_move - game itself uses can_move too - smart_move is slow as can_move checks all the lines at each step
			if(can_move({map:current.map,x:current.x,y:current.y,going_x:new_x,going_y:new_y,base:character.base}))
				qpush({map:current.map,x:new_x,y:new_y});
		});
		qlist.forEach(function(q){qpush(q);}); // So regular move's are priotised

		start++;
		if(mssince(timer)>(!parent.is_hidden()&&40||500)) return;
	}
	
	if(result===null)
	{
		result=best,optimal=false;
		game_log("Path not found!","#CF575F");
		smart.moving=false;
		smart.on_done(false,"failed");
	}
	else
	{
		plot(result);
		if(1) // [08/03/19] - to attempt and move to the actual coordinates
		{
			var last=smart.plot[smart.plot.length-1]; if(!last) last={map:character.map,x:character.real_x,y:character.real_y};
			if(smart.x!=last.x || smart.y!=last.y)
			{
				smart.try_exact_spot=true;
				smart.plot.push({map:last.map,x:smart.x,y:smart.y});
			}
		}
		smart.found=true;
		if(smart.prune.smooth) smooth_path();
		if(optimal) game_log("Path found!","#C882D1");
		else game_log("Path found~","#C882D1");
		// game_log(queue.length);
		parent.d_text("Yes!",character,{color:"#58D685"});
	}
}

function start_pathfinding()
{
	smart.try_exact_spot=false;
	smart.searching=true;
	smart.start_x=character.real_x;
	smart.start_y=character.real_y;
	queue=[],visited={},start=0,best=null;
	if(game.cli)
	{
		parent.CLI_OUT.push({"type":"smart_move",G:G,start_x:smart.start_x,start_y:smart.start_y,start_map:character.map,x:smart.x,y:smart.y,map:smart.map});
	}
	else
	{
		qpush({x:character.real_x,y:character.real_y,map:character.map,i:-1});
		game_log("Searching for a path...","#89D4A2");
		bfs();
	}
}

function cli_smart_move_result(data)
{
	if(data.found)
	{
		smart.found=true;
		smart.plot=data.plot;
	}
	else
	{
		game_log("CLI: Path not found!","#CF575F");
		smart.moving=false;
		smart.on_done(false,"failed");
	}
}

function continue_pathfinding()
{
	bfs();
}

function smart_move_logic()
{
	if(!smart.moving) return;
	if(!smart.searching && !smart.found)
	{
		start_pathfinding();
	}
	else if(!smart.found && game.cli) { /* Just wait */ }
	else if(!smart.found)
	{
		if(Math.random()<0.1)
		{
			move(character.real_x+Math.random()*0.0002-0.0001,character.real_y+Math.random()*0.0002-0.0001);
			parent.d_text(shuffle(["Hmm","...","???","Definitely left","No right!","Is it?","I can do this!","I think ...","What If","Should be","I'm Sure","Nope","Wait a min!","Oh my"])[0],character,{color:shuffle(["#68B3D1","#D06F99","#6ED5A3","#D2CF5A"])[0]});
		}
		continue_pathfinding();
	}
	else if(!character.moving && can_walk(character) && !is_transporting(character))
	{
		if(!smart.plot.length)
		{
			smart.moving=false;
			smart.on_done(true);
			return;
		}
		var current=smart.plot[0];
		smart.plot.splice(0,1);
		// game_log(JSON.stringify(current));
		if(current.town)
		{
			use("town");
		}
		else if(current.transport)
		{
			parent.socket.emit("transport",{to:current.map,s:current.s});
			parent.push_deferred("transport")
			// use("transporter",current.map);
		}
		else if(character.map==current.map && (smart.try_exact_spot && !smart.plot.length || can_move_to(current.x,current.y))) 
		{
			// game_log("S "+current.x+" "+current.y);
			move(current.x,current.y);
		}
		else
		{
			game_log("Lost the path...","#CF5B5B");
			smart_move({map:smart.map,x:smart.x,y:smart.y},smart.on_done);
		}
	}
}

setInterval(function(){smart_move_logic();},80);

function proxy(name)
{
	if(in_arr(name,character.properties)) return;
	character.properties.push(name);
	Object.defineProperty(character,name,{
		get:function(){return parent.character[name];},
		set:function(value){
			delete this[name];
			if(character.read_only.includes(name))
			{
				game_log("You attempted to change the character."+name+" value manually. You have to use the provided functions to control your character!",colors.code_error);
			}
			else
			{
				parent.character[name]=value;
			}
		},
		enumerable:true,
	});
}

character.read_only.push(...["on","once"]);
["bank","user","code","angle","direction","target","from_x","from_y","going_x","going_y","moving","vx","vy","move_num"].forEach(function(p){proxy(p)});
setInterval(function(){ for(var p in parent.character) proxy(p); },50); // bottom of the barrel

function eval_s(code) // this is how snippets are eval'ed if they include "output="/"json_output=" - so if they include these, the scope of eval isn't global - doesn't matter much [13/07/18]
{
	var output=undefined,json_output=undefined;
	eval(code);
	if(output!==undefined) parent.show_modal("<pre>"+output+"</pre>");
	if(json_output!==undefined) parent.show_json(json_output);
}

function performance_trick()
{
	// Needed for browsers only, Steam/Mac versions of the game always deliver high JS performance [03/02/19]
	parent.performance_trick(); // Just plays an empty sound file, so browsers don't throttle JS, only way to prevent it, interesting cheat [05/07/18]
	// Lately Chrome has been screwing things up with every update, mostly it's bugs and performance issues, but this time, the way Audio is played has been changed, so, once the game refreshes itself, the tabs need to be manually focused once for performance_trick() to become effective, as Audio can no longer automatically play [21/10/18]
}

//safety flags
var last_loot=new Date(0);
var last_potion=new Date(0);

var last_message="",current_message="";
function code_draw()
{
	var t;
	if(last_message!=current_message) $("#gg").html(current_message),last_message=current_message;
	if(!game.graphics) t=setTimeout(code_draw,16); // jsdom patch [18/04/19]
	else requestAnimationFrame(code_draw);
}

if(parent.is_cli)
{
	if(parent.ls_emulation) window._localStorage=parent.ls_emulation;
	window.cli_require=parent.cli_require;
}
code_draw();