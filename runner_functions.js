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
};
character.bot=parent.is_bot;

//#NOTE: Most new features are experimental - for #feedback + suggestions: https://discord.gg/X4MpntA [05/01/18]

function start_character(name,code_slot_or_name)
{
	// Loads a character in [CODE] mode
	parent.start_character_runner(name,code_slot_or_name)
}

function stop_character(name)
{
	parent.stop_character_runner(name)
}

function command_character(name,code_snippet)
{
	// Commands the character in [CODE] mode
	parent.character_code_eval(name,code_snippet)
}

function get_active_characters()
{
	// States: "self", "starting","loading", "active", "code"
	// Example: {"Me":"self","Protector":"loading"}
	return parent.get_active_characters()
}

function change_server(region,name) // change_server("EU","I") or change_server("ASIA","PVP") or change_server("US","III")
{
	parent.window.location.href="/character/"+character.name+"/in/"+region+"/"+name+"/";
}

function is_pvp()
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
function is_player(e){return is_character(e);} // backwards-compatibility

function activate(num) // activates an item, likely a booster, in the num-th inventory slot
{
	parent.activate(num);
}

function shift(num,name) // shifts an item, likely a booster, in the num-th inventory slot
{
	// shift(0,'xpbooster')
	// shift(0,'luckbooster')
	// shift(0,'goldbooster')
	parent.shift(num,name);
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

function use_skill(name,target,extra_arg)
{
	// target: object or string (character name or monster ID)
	// for "blink": use_skill("blink",[x,y])
	// for "3shot", "5shot" target can be an array of objects or strings (name or ID)
	// example: use_skill("3shot",[target1,target2,target3])
	// extra_arg is currently for use_skill("throw",target,inventory_num) and use_skill("energize",target,optional_mp)
	if(!target) target=get_target();
	parent.use_skill(name,target,extra_arg);
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
	if(!character.bank) return game_log("Not inside the bank");
	parent.socket.emit("bank",{operation:"deposit",amount:gold});
}

function bank_withdraw(gold)
{
	if(!character.bank) return game_log("Not inside the bank");
	parent.socket.emit("bank",{operation:"withdraw",amount:gold});
}

function bank_store(num,pack,pack_slot)
{
	// bank_store(0) - Stores the first item in inventory in the first/best spot in bank
	// parent.socket.emit("bank",{operation:"swap",pack:pack,str:num,inv:num});
	// Above call can be used manually to pull items, swap items and so on - str is from 0 to 41, it's the storage slot #
	// parent.socket.emit("bank",{operation:"swap",pack:pack,str:num,inv:-1}); <- this call would pull an item to the first inventory slot available
	// pack is one of ["items0","items1","items2","items3","items4","items5","items6","items7"]
	if(!character.bank) return game_log("Not inside the bank");
	if(!character.items[num]) return game_log("No item in that spot");
	if(!pack_slot) pack_slot=-1; // the server interprets -1 as first slot available
	if(!pack)
	{
		var cp=undefined,cs=undefined;
		bank_packs.forEach(function(cpack){
			if(!character.bank[cpack]) return;
			for(var i=0;i<42;i++)
			{
				if(pack) return;
				if(can_stack(character.bank[cpack][i],character.items[num])) // the item we want to store and this bank item can stack - best case scenario
				{
					pack=cpack;
				}
				if(!character.bank[cpack][i] && !cp)
				{
					cp=cpack;
				}
			}
		});
		if(!pack && !cp) return game_log("Bank is full!");
		if(!pack) pack=cp;
	}
	parent.socket.emit("bank",{operation:"swap",pack:pack,str:-1,inv:num});
}

function swap(a,b) // inventory move/swap
{
	parent.socket.emit("imove",{a:a,b:b});
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
	return calculate_item_properties(G.items[item.name],item);
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

function transport(map,spawn)
{
	parent.socket.emit("transport",{to:map,s:spawn});
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
	return null;
}

function get_targeted_monster()
{
	if(parent.ctarget && !parent.ctarget.dead && parent.ctarget.type=='monster') return parent.ctarget;
	return null;
}

function change_target(target,public)
{
	parent.ctarget=target;
	if(!public) //no need to send the target on default for CODE, some people are using change_target 5-6 times in an interval
	{
		// user change_target(target,true) from now on to send the target to the server explicitly [23/10/16]
		if(target) parent.last_id_sent=target.id;
		else parent.last_id_sent='';
	}
	parent.send_target_logic();
}

function can_move_to(x,y)
{
	if(is_object(x)) y=x.real_y,x=x.real_x;
	return can_move({map:character.map,x:character.real_x,y:character.real_y,going_x:x,going_y:y,base:character.base});
}

function xmove(x,y)
{
    if(can_move_to(x,y)) move(x,y);
    else smart_move({x:x,y:y});
}

function is_in_range(target,skill)
{
	// Valid usages: is_in_range(target), is_in_range(target,"attack"), is_in_range(target,"heal"), is_in_range(target,"mentalburst")
	if(!target || !target.visible) return false;
	// When a target leaves your viewpoint, .visible becomes false and the object reference is never updated again
	var range_multiplier=1,range_bonus=0;
	if(G.skills[skill] && G.skills[skill].range_multiplier) range_multiplier=G.skills[skill].range_multiplier;
	if(G.skills[skill] && G.skills[skill].range_bonus) range_bonus=G.skills[skill].range_bonus;
	if(distance(character,target)<=character.range*range_multiplier+range_bonus) return true;
	return false;
}

function is_on_cooldown(skill)
{
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
	parent.buy_with_shells(name,quantity);
}

function sell(num,quantity) //sell an item from character.items by it's order - 0 to N-1
{
	parent.sell(num,quantity);
}

function equip(num,slot) // slot is optional
{
	parent.socket.emit("equip",{num:num,slot:slot});
}

function unequip(slot) // show_json(character.slots) => to see slot options
{
	parent.socket.emit("unequip",{slot:slot});
}

function trade(num,trade_slot,price,quantity) // where trade_slot is 1 to 16 - example, trade(0,4,1000) puts the first item in inventory to the 4th trade slot for 1000 gold [27/10/16]
{
	if(!is_string(trade_slot) || !trade_slot.startsWith("trade")) trade_slot="trade"+trade_slot;
	parent.trade(trade_slot,num,price,quantity||1);
}

function trade_buy(target,trade_slot) // target needs to be an actual player
{
	parent.trade_buy(trade_slot,target.id,target.slots[trade_slot].rid); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}

function upgrade(item_num,scroll_num,offering_num) // number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
	return parent.upgrade(item_num,scroll_num,offering_num,"code"); // returns a Promise
}

function compound(item0,item1,item2,scroll_num,offering_num) // for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
{
	return parent.compound(item0,item1,item2,scroll_num,offering_num,"code"); // returns a Promise
}

function craft(i0,i1,i2,i3,i4,i5,i6,i7,i8)
// for example -> craft(null,0,null,null,1,null,null,2,null)
// sends 3 items to be crafted, the 0th, 1st, 2nd items in your inventory, and it places them all in the middle column of crafting
{
	parent.cr_items=[i0,i1,i2,i3,i4,i5,i6,i7,i8];
	parent.craft();
}

function auto_craft(name)
{
	// Picks the inventory positions automatically. Example: auto_craft("computer")
	return parent.auto_craft(name,true);
}

function dismantle(item_num)
{
	parent.ds_item=item_num;
	parent.dismantle();
}

function exchange(item_num)
{
	parent.e_item=item_num;
	parent.exchange(1);
}

function say(message) // please use MORE responsibly, thank you! :)
{
	parent.say(message,1);
}

function pm(name,message) // please use responsibly, thank you! :)
{
	parent.private_say(name,message,0)
}

function move(x,y)
{
	if(!can_walk(character)) return;
	parent.move(x,y);
}

function cruise(speed)
{
	parent.socket.emit("cruise",speed);
}

function show_json(e) // renders the object as json inside the game
{
	if(character.bot) parent.parent.show_json(parent.game_stringify(e,'\t'));
	else parent.show_json(parent.game_stringify(e,'\t'));
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

function use_hp_or_mp()
{
	if(safeties && mssince(last_potion)<min(200,character.ping*3)) return;
	var used=false;
	if(new Date()<parent.next_skill.use_hp) return;
	if(character.mp/character.max_mp<0.2) use('use_mp'),used=true; 
	else if(character.hp/character.max_hp<0.7) use('use_hp'),used=true;
	else if(character.mp/character.max_mp<0.8) use('use_mp'),used=true;
	else if(character.hp<character.max_hp) use('use_hp'),used=true;
	else if(character.mp<character.max_mp) use('use_mp'),used=true;
	if(used) last_potion=new Date();
}

function loot(id_or_arg)
{
	// loot(id) loots a specific chest
	// loot(true) allows code characters to make their commanders' loot instead, extremely useful [14/01/18]
	// after recent looting changes, loot(true) isn't too useful any more [08/12/19]
	if(id_or_arg && id_or_arg!==true) return parent.parent.open_chest(id_or_arg);
	var looted=0;
	if(safeties && mssince(last_loot)<min(300,character.ping*3)) return;
	last_loot=new Date();
	for(var id in parent.chests)
	{
		var chest=parent.chests[id];
		if(safeties && (chest.items>character.esize || chest.last_loot && mssince(chest.last_loot)<1600)) continue;
		chest.last_loot=last_loot;
		if(id_or_arg==true) parent.parent.open_chest(id);
		else parent.open_chest(id);
		// parent.socket.emit("open_chest",{id:id}); old version [02/07/18]
		looted++;
		if(looted==2) break;
	}
}

function get_chests()
{
	// parent.chests is an object, each key is a chest ID
	// you can: for(var id in get_chests()) loot(id);
	return parent.chests;
}

function send_gold(receiver,gold)
{
	if(!receiver) return game_log("No receiver sent to send_gold");
	if(receiver.name) receiver=receiver.name;
	parent.socket.emit("send",{name:receiver,gold:gold});
}

function send_item(receiver,num,quantity)
{
	if(!receiver) return game_log("No receiver sent to send_item");
	if(receiver.name) receiver=receiver.name;
	parent.socket.emit("send",{name:receiver,num:num,q:quantity||1});
}

function destroy(num) // num: 0 to 41
{
	parent.socket.emit("destroy",{num:num});
}

function send_party_invite(name,is_request) // name could be a player object, name, or id
{
	if(is_object(name)) name=name.name;
	parent.socket.emit('party',{event:is_request&&'request'||'invite',name:name});
}

function send_party_request(name)
{
	send_party_invite(name,1);
}

function accept_party_invite(name)
{
	parent.remove_chat("pin"+name);
	parent.socket.emit('party',{event:'accept',name:name});
}

function accept_party_request(name)
{
	parent.remove_chat("rq"+name);
	parent.socket.emit('party',{event:'raccept',name:name});
}

function leave_party()
{
	parent.socket.emit("party",{event:"leave"});
}

function accept_magiport(name)
{
	parent.remove_chat("mp"+name);
	parent.socket.emit('magiport',{name:name});
}

function unfriend(name) // instead of a name, an owner id also works, this is currently the only way to unfriend someone [20/08/18]
{
	parent.socket.emit('friend',{event:'unfriend',name:name});
}

function respawn()
{
	parent.socket.emit('respawn');
}

function handle_command(command,args) // command's are things like "/party" that are entered through Chat - args is a string
{
	// game_log("Command: /"+command+" Args: "+args);
	// return true;
	return -1;
}

function send_cm(to,data)
{
	// to: Name or Array of Name's
	// data: JSON object
	var to_server=[];
	if(!is_array(to)) to=[to];
	to.forEach(function(name){
		if(is_character_local(name)) send_local_cm(name,data);
		else to_server.push(name);
	})
	if(to_server.length) parent.send_code_message(to_server,data); // message over the server - has a high call cost / character.cc
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
character.one=function(event,f){ // gets overwritten if another handler comes along
	var def={f:f,id:randomStr(30),event:event,one:true};
	character.listeners.push(def);
	return def.id;
};
character.on=function(event,f){
	var def={f:f,id:randomStr(30),event:event},handled=false;
	for(var i=0;i<character.listeners.length;i++)
		if(character.listeners[i].one && character.listeners[i].event==event)
			character.listeners[i]=def,handled=true;
	if(!handled) character.listeners.push(def);
	return def.id;
};
character.trigger=function(event,args){
	var to_delete=[];
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
			if(l.once || l.f && l.f.delete) to_delete.push(l.id);
		}
	}
	// game_log(to_delete);
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
	var to_delete=[];
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
			if(l.once || l.f && l.f.delete) to_delete.push(l.id);
		}
	}
	// game_log(to_delete);
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
	var activity=localStorage.getItem("activity");
	activity=activity&&JSON.parse(activity)||{};
	if(!activity.cm) activity.cm={};
	delete activity.cm[character.name];
	localStorage.setItem("activity",JSON.stringify(activity));

setInterval(function(){
	var activity=localStorage.getItem("activity"),activities=[],beat={},change=false;
	activity=activity&&JSON.parse(activity)||{};
	if(!activity.heartbeat) activity.heartbeat={};
	if(!activity.heartbeat[character.name] || mssince(new Date(activity.heartbeat[character.name]))>200)
		activity.heartbeat[character.name]=(new Date()).toString(),change=true;
	if(!activity.cm) activity.cm={};
	if(activity.cm[character.name] && activity.cm[character.name].length)
	{
		activities=activity.cm[character.name];
		delete activity.cm[character.name];
		change=true;
	}
	if(change)
		localStorage.setItem("activity",JSON.stringify(activity));
	activities.forEach(function(cm){
		character.trigger("cm",{name:cm[0],message:cm[1],local:true});
	});
},10);

function send_local_cm(name,data)
{
	var activity=localStorage.getItem("activity");
	activity=activity&&JSON.parse(activity)||{};
	if(!activity.heartbeat) activity.heartbeat={};
	if(!activity.cm) activity.cm={};
	if(!activity.cm[name]) activity.cm[name]=[];
	activity.cm[name].push([character.name,data]);
	localStorage.setItem("activity",JSON.stringify(activity));
}

function is_character_local(name)
{
	var activity=localStorage.getItem("activity");
	activity=activity&&JSON.parse(activity)||{};
	if(activity.heartbeat && activity.heartbeat[name] && mssince(new Date(activity.heartbeat[name]))<2400)
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

function load_code(name,onerror) // onerror can be a function that will be executed if load_code fails
{
	if(!onerror) onerror=function(){ game_log("load_code: Failed to load",colors.code_error); }
	var xhrObj = new XMLHttpRequest();
	xhrObj.open('GET',"/code.js?name="+encodeURIComponent(name)+"&timestamp="+(new Date().getTime()), false);
	xhrObj.send('');
	var library=document.createElement("script");
	library.type="text/javascript";
	library.text=xhrObj.responseText;
	library.onerror=onerror;
	document.getElementsByTagName("head")[0].appendChild(library);
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

function smart_move(destination,on_done) // despite the name, smart_move isn't very smart or efficient, it's up to the players to implement a better movement method [05/02/17]
{
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
		if(G.monsters[destination.to])
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
			smart.map=destination.to||destination.map;
			smart.x=G.maps[smart.map].spawns[0][0];
			smart.y=G.maps[smart.map].spawns[0][1];
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
		return;
	}
	smart.moving=true;
	smart.plot=[]; smart.flags={}; smart.searching=smart.found=false;
	if(destination.return)
	{
		var cx=character.real_x,cy=character.real_y,cmap=character.map;
		smart.on_done=function(){
			if(on_done) on_done();
			smart_move({map:cmap,x:cx,y:cy});
		}
	}
	else smart.on_done=on_done||function(){};
	console.log(smart.map+" "+smart.x+" "+smart.y);
}

function stop(action)
{
	if(!action || action=="move")
	{
		if(smart.moving) smart.on_done(false);
		smart.moving=false;
		move(character.real_x,character.real_y);
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
			if(c_dist<smart.baby_edge || s_dist<smart.baby_edge) c_moves=baby_steps;
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
				if(smart.map!="bank" && door[4]=="bank") return; // manually patch the bank shortcut
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
	
	if(result===null) result=best,optimal=false;
	if(result===null)
	{
		game_log("Path not found!","#CF575F");
		smart.moving=false;
		smart.on_done(false);
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
	qpush({x:character.real_x,y:character.real_y,map:character.map,i:-1});
	game_log("Searching for a path...","#89D4A2");
	bfs();
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

code_draw();
