// #NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
// Or at #feedback in Discord: https://discord.gg/4SXJGU

var character={
	// This object proxies the real parent.character
	// Normal entities have normal coordinates, their {x,y}'s are equal to their {real_x,real_y}'s
	// The character object is special, it's always in the middle of the screen, so it has static {x,y}'s
	// Added this wrapper so instead of using .real_x and .real_y on all entities, .x and .y's can be used uniformly
	"note":"This is a proxy object, the real character is in parent.character",
	"properties":["x","y"],
}

Object.defineProperty(character,'x',{get:function(){return parent.character.real_x;},set:function(){game_log("You can't set coordinates manually, use the move(x,y) function!");}});
Object.defineProperty(character,'y',{get:function(){return parent.character.real_y;},set:function(){game_log("You can't set coordinates manually, use the move(x,y) function!");}});
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
}

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

function is_pvp()
{
	return G.maps[character.map].pvp || server.is_pvp;
}

function is_npc(entity)
{
	if(entity && (entity.npc || entity.type=="npc")) return true;
}

function is_monster(entity)
{
	if(entity && entity.type=="monster") return true;
}

function is_player(entity)
{
	if(entity && entity.type=="character" && !entity.npc) return true;
}
function is_character(e){return is_player(e);}

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

function can_use(name) // work in progress, can be used to check cooldowns of class skills [02/02/17]
{
	return parent.can_use(name);
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

function use_skill(name,target)
{
	// for blink: use_skill("blink",[x,y])
	if(!target) target=get_target();
	parent.use_skill(name,target);
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

function game_log(message,color)
{
	if(!color) color="#51D2E1";
	parent.add_log(message,color);
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
	if(parent.ctarget && !parent.ctarget.dead) return parent.ctarget;
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

function in_attack_range(target) // also works for priests/heal
{
	if(!target) return false;
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function can_attack(target) // also works for priests/heal
{
	// is_disabled function checks .rip and .stunned
	if(!target) return false;
	if(!parent.is_disabled(character) && in_attack_range(target) && new Date()>=parent.next_attack) return true;
	return false;
}

function can_heal(t)
{
	if(is_monster(t)) return false;
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
	if(safeties && mssince(last_attack)<400) return;
	if(!target) { game_log("Nothing to attack()","gray"); return; }
	if(target.type=="character") parent.player_attack.call(target);
	else parent.monster_attack.call(target);
	last_attack=new Date();
}

function heal(target)
{
	if(safeties && mssince(last_attack)<400) return;
	if(!target) { game_log("No one to heal()","gray"); return; }
	parent.player_heal.call(target);
	last_attack=new Date();
}

function buy(name,quantity) //item names can be spotted from show_json(character.items) - they can be bought only if an NPC sells them
{
	parent.buy(name,quantity);
}

function sell(num,quantity) //sell an item from character.items by it's order - 0 to N-1
{
	parent.sell(num,quantity);
}

function equip(num)
{
	parent.socket.emit("equip",{num:num});
}

function unequip(slot) // show_json(character.slots) => to see slot options
{
	parent.socket.emit("unequip",{slot:slot});
}

function trade(num,trade_slot,price) // where trade_slot is 1 to 16 - example, trade(0,4,1000) puts the first item in inventory to the 4th trade slot for 1000 gold [27/10/16]
{
	parent.trade("trade"+trade_slot,num,price);
}

function trade_buy(target,trade_slot) // target needs to be an actual player
{
	parent.trade_buy(trade_slot,target.id,target.slots[trade_slot].rid); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}

function upgrade(item_num,scroll_num,offering_num) //number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
	parent.u_item=item_num;
	parent.u_scroll=scroll_num;
	parent.u_offering=offering_num;
	parent.upgrade();
}

function compound(item0,item1,item2,scroll_num,offering_num) // for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
{
	parent.c_items=[item0,item1,item2];
	parent.c_last=3;
	parent.c_scroll=scroll_num;
	parent.c_offering=offering_num;
	parent.compound();
}

function craft(i0,i1,i2,i3,i4,i5,i6,i7,i8)
// for example -> craft(null,0,null,null,1,null,null,2,null)
// sends 3 items to be crafted, the 0th, 1st, 2nd items in your inventory, and it places them all in the middle column of crafting
{
	parent.cr_items=[i0,i1,i2,i3,i4,i5,i6,i7,i8];
	parent.craft();
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

function show_json(e) // renders the object as json inside the game
{
	parent.show_json(parent.game_stringify(e,2));
}

function get_player(name) // returns the player by name, if the player is within the vision area
{
	var target=null,entities=parent.entities;
	if(name==character.name) target=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) target=entities[i];
	return target;
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
	if(args && args.type=="monster") game_log("You used monster.type, which is always 'monster', use monster.mtype instead");

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || current.dead) continue;
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
		if(current.type!="character" || current.rip || current.invincible || current.npc) continue;
		if(current.party && character.party==current.party) continue;
		if(current.guild && character.guild==current.guild) continue;
		if(args.friendship && in_arr(current.owner,parent.friends)) continue;
		if(args.exclude && in_arr(current.name,args.exclude)) continue; // get_nearest_hostile({exclude:["Wizard"]}); Thanks
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function use_hp_or_mp()
{
	if(safeties && mssince(last_potion)<600) return;
	var used=false;
	if(new Date()<parent.next_potion) return;
	if(character.mp/character.max_mp<0.2) use('use_mp'),used=true; 
	else if(character.hp/character.max_hp<0.7) use('use_hp'),used=true;
	else if(character.mp/character.max_mp<0.8) use('use_mp'),used=true;
	else if(character.hp<character.max_hp) use('use_hp'),used=true;
	else if(character.mp<character.max_mp) use('use_mp'),used=true;
	if(used) last_potion=new Date();
}

// loot(true) allows code characters to make their commanders' loot instead, extremely useful [14/01/18]
function loot(commander)
{
	var looted=0;
	if(safeties && mssince(last_loot)<200) return;
	last_loot=new Date();
	for(id in parent.chests)
	{
		var chest=parent.chests[id];
		if(safeties && (chest.items>character.esize || chest.last_loot && mssince(chest.last_loot)<1600)) continue;
		chest.last_loot=last_loot;
		if(commander) parent.parent.open_chest(id);
		else parent.open_chest(id);
		// parent.socket.emit("open_chest",{id:id}); old version [02/07/18]
		looted++;
		if(looted==2) break;
	}
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

function destroy_item(num) // num: 0 to 41
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
	parent.socket.emit('party',{event:'accept',name:name});
}
function accept_party_request(name)
{
	parent.socket.emit('party',{event:'raccept',name:name});
}

function respawn()
{
	parent.socket.emit('respawn');
}

function handle_death()
{
	// When a character dies, character.rip is true, you can override handle_death and manually respawn
	// IDEA: A Resident PVP-Dweller, with an evasive Code + irregular respawning
	// respawn current has a 12 second cooldown, best wait 15 seconds before respawning [24/11/16]
	// setTimeout(respawn,15000);
	// return true;
	// NOTE: Add `if(character.rip) {respawn(); return;}` to your main loop/interval too, just in case
	return -1;
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
	parent.send_code_message(to,data);
}

function on_cm(name,data)
{
	game_log("Received a code message from: "+name);
}

function on_disappear(entity,data)
{
	// game_log("disappear: "+entity.id+" "+JSON.stringify(data));
}

function on_combined_damage() // When multiple characters stay in the same spot, they receive combined damage, this function gets called whenever a monster deals combined damage
{
	// move(character.real_x+5,character.real_y);
}

function on_party_invite(name) // called by the inviter's name
{
	// accept_party_invite(name)
}

function on_party_request(name) // called by the inviter's name - request = someone requesting to join your existing party
{
	// accept_party_request(name)
}

function on_destroy() // called just before the CODE is destroyed
{
	clear_drawings();
	clear_buttons();
}

function on_draw() // the game calls this function at the best place in each game draw frame, so if you are playing the game at 60fps, this function gets called 60 times per second
{
	
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

function auto_reload(value)
{
	// Configures the game to auto reload in case you disconnect due to rare network issues
	if(value===false) parent.auto_reload="off";
	else if(value=="auto") parent.auto_reload="auto"; // code or merchant stand
	else parent.auto_reload="on"; // always reload
}

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
				game_log("Listener Exception ("+l.event+") "+e,code_color);
			}
			if(l.once || l.f && l.f.delete) to_delete.push(l.id);
		}
	}
	// game_log(to_delete);
};

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

function load_code(name,onerror) // onerror can be a function that will be executed if load_code fails
{
	if(!onerror) onerror=function(){ game_log("load_code: Failed to load","#E13758"); }
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
	edge:20,
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
			for(var name in G.maps)
				(G.maps[name].monsters||[]).forEach(function(pack){
					if(pack.type!=destination.to || G.maps[name].ignore || G.maps[name].instance) return;
					if(pack.boundaries) // boundaries: for phoenix, mvampire
					{
						pack.last=pack.last||0;
						var boundary=pack.boundaries[pack.last%pack.boundaries.length];
						pack.last++;
						smart.map=boundary[0];
						smart.x=(boundary[1]+boundary[3])/2;
						smart.y=(boundary[2]+boundary[4])/2;
					}
					else if(pack.boundary)
					{
						var boundary=pack.boundary;
						smart.map=name;
						smart.x=(boundary[0]+boundary[2])/2;
						smart.y=(boundary[1]+boundary[3])/2;
					}
				});
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
	}
	if(!smart.map)
	{
		game_log("Unrecognized","#CF5B5B");
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
	else if(action=="teleport")
	{
		parent.socket.emit("stop",{action:"teleport"});
	}
}

var queue=[],visited={},start=0,best=null;
var moves=[[0,15],[0,-15],[15,0],[-15,0]];

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
		var map=G.maps[current.map];
		if(current.map==smart.map)
		{
			smart.flags.map=true;
			if(abs(current.x-smart.x)+abs(current.y-smart.y)<smart.edge)
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
				if(simple_distance({x:map.spawns[door[6]][0],y:map.spawns[door[6]][1]},{x:current.x,y:current.y})<30)
					qpush({map:door[4],x:G.maps[door[4]].spawns[door[5]||0][0],y:G.maps[door[4]].spawns[door[5]||0][1],transport:true,s:door[5]||0});
			});
			map.npcs.forEach(function(npc){
				if(npc.id=="transporter" && simple_distance({x:npc.position[0],y:npc.position[1]},{x:current.x,y:current.y})<75)
				{
					for(var place in G.npcs.transporter.places)
					{
						qpush({map:place,x:G.maps[place].spawns[G.npcs.transporter.places[place]][0],y:G.maps[place].spawns[G.npcs.transporter.places[place]][1],transport:true,s:G.npcs.transporter.places[place]});
					}
				}
			});
		}

		if(smart.use_town) qpush({map:current.map,x:map.spawns[0][0],y:map.spawns[0][1],town:true}); // "town"

		shuffle(moves);
		moves.forEach(function(m){
			var new_x=parseInt(current.x+m[0]),new_y=parseInt(current.y+m[1]);
			// utilise can_move - game itself uses can_move too - smart_move is slow as can_move checks all the lines at each step
			if(can_move({map:current.map,x:current.x,y:current.y,going_x:new_x,going_y:new_y,base:character.base}))
				qpush({map:current.map,x:new_x,y:new_y});
		});

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
	smart.searching=true;
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
		else if(character.map==current.map && can_move_to(current.x,current.y))
		{
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
	Object.defineProperty(character,name,{get:function(){return parent.character[name];},set:function(value){delete this[name]; parent.character[name]=value;}});
}

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
	parent.performance_trick(); // Just plays an empty sound file, so browsers don't throttle JS, only way to prevent it, interesting cheat [05/07/18]
}

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
buy=doneify(buy,"buy_success","buy_fail");

//safety flags
var last_loot=new Date(0);
var last_attack=new Date(0);
var last_potion=new Date(0);
var last_transport=new Date(0);

var last_message="",current_message="";
function code_draw()
{
	if(last_message!=current_message) $("#gg").html(current_message),last_message=current_message;
	requestAnimationFrame(code_draw);
}

code_draw();
