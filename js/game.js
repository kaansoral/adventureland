var is_game=1,is_server=0,is_code=0,is_pvp=0,is_demo=0,gameplay="normal";
var inception=new Date();
/* performance flags */
/*
	Current performance hogs
	- Map tiling
	- Disappearing Texts / Garbage Collection
	- Inventory / Player+Slots UI Refreshes / Event+Garbage Collection
*/
var scale=parseInt(scale);
var round_xy=true,floor_xy=false; //map
// IMPORTANT: Test things on the Macbook screen, Dell screens simply suck [19/05/18]
var round_entities_xy=false;
var offset_walking=true; // entities, to fix overflowing sprites
var antialias=false,mode_nearest=true; // mode_nearest fixes the overflows in general
var gtest=false; // glitch test - cause: pixellated :(
var mode={
	"dom_tests":0, // huntin the dom leak [20/08/16]
	"dom_tests_pixi":0,
	"bitmapfonts":0,
	"debug_moves":0,
	"destroy_tiles":1,
	"log_incoming":0,
	"cosmetics":0,
	"empty_borders_darker":1,
	"ltbl":1, // let there be light [06/08/22]
};
var paused=false;
var log_flags={ //over-written at base_script
	"timers":1,
	"map":0,
	"entities":0,
	"xy_corrections":0,
};
var ptimers=true;
// var cached_map=location.search.indexOf("fast")!=-1; // RenderTexture
var mdraw_mode="redraw",mdraw_border=40;
var mdraw_tiling_sprites=false; // #GTODO: perfect+launch this at one point [20/08/16] - so slow [22/03/20]
var manual_stop=false;
var manual_centering=true;
var high_precision=false;
var retina_mode=false; // conditionally set at DOMContentLoaded
var text_quality=2;
/* modes */
var bw_mode=false; // border_mode in base_script now
var character_names=false;
var hp_bars=true;
/* timers */
var last_interaction=new Date(),afk_edge=60,mm_afk=false; // [AFK]
last_interaction.setYear(1970);
var last_drag_start=new Date();
var last_npc_right_click=new Date(); // to patch the propagation bug
/* */
var block_right_clicks=true;
var mouse_only=true;
var the_code="",code_slot=0,code_change=false,new_code_slot=undefined;
var server_region="EU",server_identifier="I",server_name="",ipass="";
var real_id='',character=null,observing=null,map=null,resources_loaded=false,socket_ready=false,socket_welcomed=false,game_loaded=false,friends=[];
var ch_disp_x=0,ch_disp_y=0; // For shaking the character without modifying coordinates manually [22/06/18]
var head_x=0,head_y=0; // For head gestures [25/09/18]
var tints=[];
var entities={},future_entities={players:{},monsters:{}},pull_all_next=false,clean_house=false;
// Important: set pulling_all to true, so the same logic applies on first connect [12/10/18]
// Removed the pull_all logic, simplifying [26/01/20]
var text_layer,monster_layer,player_layer,chest_layer,map_layer,separate_layer,entity_layer;
var rip=false;
var heartbeat=new Date(),slow_heartbeats=0;
var ctarget=null,ctoggled=null; // character's target
var xtarget=null; // secondary target
var mtarget=null; // mouse target
var textures={},C={},FC={},SS={},SSU={}; // cache textures here
var M={},GEO={}; // M - old x_lines/y_lines, - GEO - new logic
/* start map entities */
var total_map_tiles=0;
var tiles=null,dtile=null,wtile=null; // cached_map entities
var map_npcs=[],map_doors=[],map_nights=[],map_lights=[],map_animatables={};
var map_tiles=[],map_entities=[],map_machines={},dtile_size=32,dtile_width=0,dtile_height=0,wtile_name=null,wtile_width=0,wtile_height=0;
var map_animations={};
var quirks={};
var water_tiles=[],last_water_frame=-1;
var drawings=[],code_buttons={}; // user drawings
var chests={},party_list=[],party={};
var tracker={};
var merchants={};
var tile_sprites={},tile_textures={},sprite_last={};
var first_coords=false,first_x=0,first_y=0;
var last_refxy=0,ref_x=0,ref_y=0;
var last_light=new Date(0);
var current_map="main",current_in="main",draw_map="main";
var transporting=false;
/* */
var current_status="",last_status="";
/* ui flags */
var topleft_npc=false,merchant_id=null,inventory=false,inventory_openef_for=null,code=false,pvp=false,skillsui=false,exchange_type="";
var topright_npc=false;
var transports=false;
var purpose="buying";
var next_minteraction=null;
var next_side_interaction=null;
/* event vars */
var events={
	"abtesting":false,
	"duel":false,
};
/* */
var code_run=false,code_active=false,actual_code=false,CC={}; // run from game, active from code [30/10/16]
var reload_state=false,reload_timer=null,first_entities=false;
var blink_pressed=false,last_blink_pressed=new Date();
var arrow_up=false,arrow_right=false,arrow_down=false,arrow_left=false;
var force_draw_on=false;
var use_layers=false;
var draws=0,in_draw=false;
var keymap={},skillbar=[];
var secondhands=[],s_page=0,lostandfound=[],l_page=0;
var page={title:"Adventure Land",url:"/"};
var I={}; // instance data
var S={}; // server data
var ST=new Date(); // server time
var CLI_OUT=[]; // CLI outgoing messages
var CLI_IN=[]; // CLI incoming messages
var options={
	"move_with_arrows":true,
	"code_fx":false,
	"show_names":false,
	"move_with_mouse":false,
	"always_hpn":false,
	"always_names":false,
	"retain_upgrades":false,
	"friendly_fire":false,
	"bank_max":false,
	"directional_sfx":false,
};
var SZ={
	"font":"Pixel",
	"normal":18,
	"large":24,
	"huge":36,
	"chat":18,
};

setInterval(function(){
	if(reload_state)
	{
		try{
			var data=storage_get("reload"+server_region+server_identifier);
			if(data)
			{
				data=JSON.parse(data);
				data.time=new Date(data.time);
				if(new Date()<data.time)
				{
					if(reload_state!="synced")
					{
						add_log("Reload Synced",colors.serious_green);
					}
					reload_state="synced";
				}
				if(reload_state=="synced") reload_timer=data.time;
			}
		}
		catch(e){console.log(e);}
		if(reload_state=="start")
		{
			reload_state="schedule",reload_timer=future_s((window.rc_delay||0)+3+parseInt(Math.random()*2));
			add_log("First Echo In "+parseInt(-ssince(reload_timer))+" Seconds","gray")
		}
		if(reload_state=="schedule" && new Date()>reload_timer)
		{
			api_call("can_reload",{region:server_region,pvp:is_pvp||'',name:server_identifier});
			add_log("Echo Sent","gray");
			reload_timer=future_s((window.rc_delay||0)+3+parseInt(Math.random()*2));
		}
		if(reload_state=="synced" && new Date()>reload_timer)
		{
			reload_state=false;
			if(is_cli) CLI_OUT.push({"type":"kill"});
			else window.location.href=page.url; // location.reload();
		}
	}
	if(!game_loaded) return;
	var ms_since=mssince(heartbeat),now_date=new Date();
	if(ms_since>900) slow_heartbeats++;
	else if(ms_since<600) slow_heartbeats=0;
	if(is_hidden() && !is_demo) // slow_heartbeats>3
	{
		// if(!code_run) pull_all=true; - this would trigger pull_all frequently with the manual draw logic in place [19/08/16]
		// else pull_all_next=true;
		pull_all_next=true;
	}
	if(!is_hidden() && pull_all_next && socket) // ms_since<220
	{
		console.log("pull_all_next triggered");
		pull_all_next=false;
		socket.emit("send_updates",{});
	}
	if(window.last_draw)
	{
		if((code_run || sound_sfx) && mssince(last_draw)>250) draw(0,1); // previously 500
		else if(!(code_run || sound_sfx) && mssince(last_draw)>15000) draw(0,1);
	}
	if(force_draw_on && force_draw_on<now_date)
	{
		if(current_map!=drawn_map) create_map();
		draw(0,1);
	}
	mm_afk=(ssince(window.last_interaction)>afk_edge/2);
	if(character)
	{
		if(!character.afk && ssince(window.last_interaction)>afk_edge)
		{
			character.afk=true;
			socket.emit("property",{afk:true});
		}
		if(character.afk && ssince(window.last_interaction)<=afk_edge)
		{
			character.afk=false;
			socket.emit("property",{afk:false});
		}
		if(mode.debug_moves) socket.emit("mreport",{x:character.real_x,y:character.real_y});
	}
	// console.log(mssince(heartbeat)); 900 because chrome reduces heartbeat to 1000ms
	heartbeat=new Date();
},100);

setInterval(function(){
	arrow_movement_logic();
},200);

function code_button()
{
	add_log("Executed");
	add_tint(".mpui",{ms:3000});
}

function observe_character(name)
{
	for(var i=0;i<(X.characters||[]).length;i++)
	{
		var ch=X.characters[i];
		if(ch.name==name && ch.secret)
		{
			for(var j=0;j<X.servers.length;j++)
			{
				var server=X.servers[j];
				if(server.key==ch.server)
				{
					if(socket && observing && observing.name==ch.name)
					{
						socket.emit("o:home");
					}
					else
					{
						server_addr=server.addr;
						server_port=server.port;
						init_socket({secret:ch.secret});
						if(is_comm) hide_nav();
					}
					return true;
				}
			}
		}
	}
	return false;
}

function log_in(user,character,auth,passphrase)
{
	if(!socket) return show_alert("Connect to a server first!");
	real_id=character;
	if(!passphrase) passphrase=storage_get("passphrase")||"";
	if(!game_loaded) { ui_log("Game hasn't loaded yet"); return; }
	clear_game_logs(); add_log("Connecting ...");
	var no_html_value=no_html; if(no_html && parent && parent.character) no_html_value=parent.character.name;
	var data={user:user,character:character,code_slot:get_code_slot(),auth:auth,width:screen.width,height:screen.height,scale:scale,passphrase:passphrase,no_html:no_html_value,no_graphics:no_graphics};
	console.log("log_in: "+user+" code_slot: "+data.code_slot);
	if(is_electron)
	{
		data.epl=electron_data.platform;
		if(data.epl=="mas") data.receipt=electron_mas_receipt();
		if(data.epl=="steam") data.ticket=electron_steam_ticket();
	}
	window.auth_sent=new Date();
	socket.emit('auth',data);
}

function disconnect()
{
	$("iframe").remove();
	$(".disconnected").show();
	observing=null; $("#observeui").hide();
	if(socket) try{ socket.disconnect(),socket=null; } catch(e){}
	var message="DISCONNECTED",title_m="Disconnected";
	game_loaded=false;
	if(window.disconnect_reason=="limits")
	{
		message="REJECTED";
		// add_log("Hey there, Adventurer! To make the game fun for everyone, as requested by our community, you can only connect with 2 characters to a normal server, 1 additional character to a PVP server and 1 merchant. If you wish to support our game, a 'Stone of Wisdom' currently allows you to bypass limitations for the wearer.","#83BDCF");
		// add_log("Ps. This is the third version of our prototype limits enforcer. If it's unfair, please email hello@adventure.land","#CF888A");
		add_log("Oops. You exceeded the limitations.","#83BDCF");
		// add_log("You can use one character on a normal server, one additional character on a PVP server and one merchant.","#CF888A");
		add_log("You can have 3 characters and one merchant online at most.","#CF888A");
	}
	else if(window.disconnect_reason) add_log("Disconnect Reason: "+window.disconnect_reason,"gray");
	if(inside!="game")
	{
		return;
	}
	if(character && (auto_reload=="on" || auto_reload=="auto" && (character.stand || code_run || 1))) // Just reload, better to have more players ;) [23/09/17]
	{
		auto_reload=true;
		title_m="Reloading";
		add_log("Auto Reload Active",colors.serious_red);
		reload_state="start";
	}
	else if(character_to_load)
	{
		add_log("Retrying in 2500ms","gray");
		setTimeout(function(){
			if(is_cli) CLI_OUT.push({"type":"kill"});
			else window.location.href=page.url; //location.reload(true);
		},2500);
	}

	if(no_html)
	{
		set_status("Disconnected");
		$("#name").css("color","red");
	}
	else
	{
		if(0)
		{
			hide_modals();
			$("body").children().each(function(){
				if(this.tagName!="CANVAS" && this.id!="bottomrightcorner" && this.id!="bottomleftcorner2") $(this).remove();
				else if(this.id=="bottomrightcorner" || this.id=="bottomleftcorner2") this.style.zIndex=2000;
			});
		}
		$("body").append("<div style='position: fixed; top: 0px; left: 0px; right: 0px; bottom: 0px; z-index: 999; background: rgba(0,0,0,0.6); pointer-events: none; text-align: center'><div onclick='refresh_page()' class='gamebutton clickable' style='margin-top: "+(round(height/2)-10)+"px; color:#FF2E46'>"+message+"</div></div>");
	}

	if(character) $("title").html(title_m+" - "+character.name);
}

function position_map()
{
	if(character) map.real_x=character.real_x,map.real_y=character.real_y;
	var x=width/2.0-map.real_x*scale,y=height/2.0-map.real_y*scale,change=false;
	x=c_round(x); y=c_round(y);
	if(map.x!=x) map.x=x,change=true;
	if(map.y!=y) map.y=y,change=true;
	if(change && dtile_size && window.dtile)
	{
		dtile.x=round(map.real_x-width/(scale*2.0));
		dtile.y=round(map.real_y-height/(scale*2.0));
		dtile.x=ceil(dtile.x/(dtile_size/1.0))*(dtile_size/1.0)-(dtile_size/1.0);
		dtile.y=ceil(dtile.y/(dtile_size/1.0))*(dtile_size/1.0)-(dtile_size/1.0);
	}
	if(change && window.wtile)
	{
		wtile.x=round(map.real_x-width/(scale*2.0));
		wtile.y=round(map.real_y-height/(scale*2.0));
		wtile.x=ceil(wtile.x/(textures[wtile_name][0].width/1.0))*(textures[wtile_name][0].width/1.0)-(textures[wtile_name][0].width/1.0);
		wtile.y=ceil(wtile.y/(textures[wtile_name][0].height/1.0))*(textures[wtile_name][0].height/1.0)-(textures[wtile_name][0].height/1.0);
	}
	if(character)
	{
		if(manual_centering) character.x=c_round(width/2.0+ch_disp_x),character.y=c_round(height/2.0+ch_disp_y);
		else character.x=c_round(character.real_x),character.y=c_round(character.real_y);
	}
	// if(change && character) console.log("character x,y: "+character.x+","+character.y+" map x,y: "+map.x+","+map.y+" total x,y: "+(character.x-map.x)+","+(character.y-map.y));
}

function ui_logic()
{
	if(character && character.ctype=="mage")
	{
		if(b_pressed && map.cursor!="crosshair") map.cursor="crosshair";
		else if(!b_pressed && map.cursor=="crosshair") map.cursor="default";
	}
}

var rendered_target={},last_target_cid=null,last_xtarget_cid=null,dialogs_target=null;
function reset_topleft()
{
	if(no_html) return;
	var name='NO TARGET';
	var otarget=ctarget; // original target
	ctarget=xtarget||ctarget;
	if(ctarget && ctarget.dead && (!ctarget.died || ssince(ctarget.died)>3)) ctarget=null;
	if(ctarget!=rendered_target) { last_target_cid=null; reset_inventory(1); }
	if(dialogs_target && dialogs_target!=ctarget) $("#topleftcornerdialog").html(""),dialogs_target=null;
	if(ctarget && topleft_npc)
	{
		if(topleft_npc && inventory) render_inventory();
		topleft_npc=false;
		reset_inventory();
	}

	if(ctarget && ctarget.type=='monster' && last_target_cid!=ctarget.cid)
	{
		render_monster(ctarget);
	}
	else if(ctarget && ctarget.npc)
	{
		render_npc(ctarget);
	}
	else if(ctarget && ctarget.type=='character' && last_target_cid!=ctarget.cid)
	{
		render_character(ctarget);
	}
	else if(!ctarget && rendered_target!=null)
	{
		$("#topleftcornerui").html('<div class="gamebutton">NO TARGET</div>');
	}
	rendered_target=ctarget;
	last_target_cid=ctarget && ctarget.cid;

	ctarget=otarget;
}

function handle_entities(data,args)
{
	window.last_entities_received=data;
	// if(data.type!="all" && pulling_all) return console.log("discarded 'entities' - pulling_all");
	// Commented the above section out [26/01/20]
	if(data.type=="all")
	{
		if(!(args && args.new_map)) clean_house=true;
		if(!first_entities)
		{
			first_entities=true;
			if(character_to_load)
			{
				set_status("LOADING "+character_to_load);
				try{ log_in(user_id,character_to_load,user_auth); }catch(e){console.log(e);}
				character_to_load=false;
			}
		}
	}
	if(data.type=="all" && log_flags.entities) console.log("all entities "+new Date());
	if(0 && erec%100==1 && window.pako)
	{
		window.lastentities=data;
		var rs=rough_size(data),ms;
		var cs=new Date();
		var enc=pako.deflate(msgpack.encode(data));
		ms=mssince(cs);
		console.log("entities%100 rough_size: "+rs+" enc_length: "+enc.length+" enc_in: "+ms+"ms")
	}
	if(character)
	{
		if(data.xy) last_refxy=new Date(),ref_x=data.x,ref_y=data.y;
		else last_refxy=0;
	}
	for(var i=0;i<data.players.length;i++)
	{
		future_entities.players[data.players[i].id]=data.players[i];
	}
	for(var i=0;i<data.monsters.length;i++)
	{
		var old_events=future_entities.players[data.monsters[i].id] && future_entities.players[data.monsters[i].id].events;
		future_entities.monsters[data.monsters[i].id]=data.monsters[i];
		if(old_events) future_entities.monsters[data.monsters[i].id].events=old_events+future_entities.monsters[data.monsters[i].id].events;
	}
}

function draw_entities()
{
	for(entity in entities)
	{
		var current=entities[entity];
		if(character && !within_xy_range(character,current) || !character && !within_xy_range({map:current_map,"in":current_in,vision:[700,500],x:map.real_x,y:map.real_y},current))
		{
			// console.log("character x,y: "+round(character.real_x)+","+round(character.real_y)+" entity moving outside range: ["+current.id+"] x,y: "+round(current.x)+","+round(current.y));
			call_code_function("on_disappear",current,{outside:true});
			//console.log("mark dead within_xy: "+current.id+" "+(character['in']==current['in'])+" "+character.vision+" "+get_xy(current));
			current.dead="vision";
		}
		if(current.dead || clean_house)
		{
			if(!current.dead) current.dead=true;
			current.cid++;
			current.died=new Date();
			current.interactive=false;
			if(current.drawn && current.tpd) draw_timeout(fade_away_teleport(1,current),30,1);
			else if(current.drawn) draw_timeout(fade_away(1,current),30,1);
			else destroy_sprite(entities[entity],"just");
			//console.log("current: "+current.id+" current.dead: "+current.dead+" pull_all: "+pull_all);
			// console.log("removed: "+current.id);
			delete entities[entity];
			continue;
		}
		else if(!current.drawn)
		{
			current.drawn=true;
			map.addChild(current);
		}
		if(!round_entities_xy)
		{
			current.x=current.real_x;
			current.y=current.real_y;
		}
		else
		{
			current.x=round(current.real_x);
			current.y=round(current.real_y);
		}
		update_sprite(current);
	}
	clean_house=false;
}

function sync_entity(current,monster)
{
	adopt_soft_properties(current,monster); // previously only move_num, speed, dead

	if(current.resync) // currently only set when the entity is new [03/08/16]
	{
		current.real_x=monster.x;
		current.real_y=monster.y;
		if(monster.moving) current.engaged_move=-1,current.move_num=0; // this was only current.move_num=0 before, improved it for "current.move_num!=current.engaged_move"
		else current.engaged_move=current.move_num=monster.move_num,current.angle=((monster.angle===undefined&&90)||monster.angle),set_direction(current);
		current.resync=current.moving=false;
		// console.log("resync, angle "+current.angle+" direction: "+current.direction)
		// console.log("resynced: "+current.id);
	}

	if(monster.abs && !current.abs) // [30/07/16]
	{
		current.abs=true;
		current.moving=false;
	}

	if(current.move_num!=current.engaged_move)
	{
		var speedm=1,dist=simple_distance({x:current.real_x,y:current.real_y},monster);
		if(dist>120) // previously 40 [07/10/16]
		{
			current.real_x=monster.x;
			current.real_y=monster.y;
			if(log_flags.xy_corrections) console.log("manual x,y correction for: "+(current.name||current.id));
		}
		speedm=simple_distance({x:current.real_x,y:current.real_y},{x:monster.going_x,y:monster.going_y})/(simple_distance(monster,{x:monster.going_x,y:monster.going_y})+EPS);
		if(speedm>1.25 && log_flags.timers && log_flags.xy) console.log(current.id+" speedm: "+speedm);
		current.moving=true; current.abs=false;
		current.engaged_move=current.move_num;
		current.from_x=current.real_x;
		current.from_y=current.real_y;
		current.going_x=monster.going_x;
		current.going_y=monster.going_y;
		calculate_vxy(current,speedm);
	}
}
function process_entities()
{
	for(var id in future_entities.monsters)
	{
		var monster=future_entities.monsters[id];
		var current=entities[monster.id];
		// console.log(monster.type+" "+monster.id);
		if(!current)
		{
			if(monster.dead) continue;
			if(gtest) return;
			try{
				current=entities[monster.id]=add_monster(monster); // #GTODO #IMPORTANT: Inspect where the type=undefined monster comes from
				// console.log("added: "+current.id);
				current.drawn=false; current.resync=true;
			}
			catch(e)
			{
				console.log("EMAIL HELLO@ADVENTURE.LAND WITH THIS: "+JSON.stringify(monster));
				if(is_sdk) alert(e+" "+JSON.stringify(monster));
			}
		}
		if(monster.dead) {current.dead=true; continue;}
		sync_entity(current,monster);
		(monster.events||[]).forEach(function(event){

			// This routine originally hosted custom "mhit" events that replicated "hit" events
			// It was too complicated due to the duplication of each routine
			// Currently it can just piggyback regular events if mode.instant_monster_attacks is true
			original_onevent.apply(socket,[{"type":2,"nsp":"/","data":event}]);

		});
		if(ctarget && ctarget.id==current.id) ctarget=current;
		if(xtarget && xtarget.id==current.id) xtarget=current;
	}
	for(var id in future_entities.players)
	{
		var player=future_entities.players[id];
		// show_json(player);
		var current=entities[player.id],original_rip=true;
		if(current) original_rip=current.rip;
		if(character && character.id==player.id) continue;
		if(!current)
		{
			//alert_json(player);
			if(player.dead) continue;
			player.external=true;
			player.player=true;
			current=entities[player.id]=add_character(player);
			current.drawn=false; current.resync=true;
			if(mssince(last_light)<500) start_animation(current,"light");
		}
		if(player.dead) {current.dead=true; continue;}
		// if(current.dead) {console.log("Add a re-add logic!")}; Improved 'disappear' to change the id
		sync_entity(current,player);
		if(!original_rip && current.rip)
			call_code_function("trigger_event","death",{id:current.id});
		if(ctarget && ctarget.id==current.id) ctarget=current;
		if(xtarget && xtarget.id==current.id) xtarget=current;
	}
}

function on_disappear(data)
{
	// console.log("disappear: "+data.id);
	if(future_entities.players[data.id]) delete future_entities.players[data.id]; // moving these outside the `if(entities[data.id])` condition should fix the non-disappearing entities issues [03/02/17]
	if(future_entities.monsters[data.id]) delete future_entities.monsters[data.id];
	
	if(entities[data.id])
	{
		if(data.invis) assassin_smoke(entities[data.id].real_x,entities[data.id].real_y);
		if(data.effect===1) start_animation(entities[data.id],"transport");
		entities["DEAD"+data.id]=entities[data.id];
		entities[data.id].dead=data.reason||true;
		if(data.teleport) entities[data.id].tpd=true;
		call_code_function("on_disappear",entities[data.id],data);
		// console.log("disappear delete: "+data.id);
		delete entities[data.id];
	}
	else if(character && character.id==data.id)
	{
		if(data.invis) assassin_smoke(character.real_x,character.real_y);
		call_code_function("on_disappear",character,data);
		// if(data.effect) start_animation(entities[data.id],"transport");
	}
}

var asp_skip={};
["x","y","vx","vy","moving","abs","going_x","going_y","from_x","from_y","width","height","type","events","angle","skin","events","reopen"].forEach(function(s){asp_skip[s]=true;})

function adopt_soft_properties(element,data)
{
	if(element.me)
	{
		element.stats={};
		["str","dex","int","vit","for"].forEach(function(p){element.stats[p]=data[p];});
		if(element.moving && element.speed && data.speed && element.speed!=data.speed)
		{
			element.speed=data.speed;
			calculate_vxy(element);
		}
		if(data.abs) //[04/10/16]
		{
			element.moving=false;
			if(element.me) resolve_deferreds("move",{reason:"abs"});
		}
		element.bank=null;
	}
	else
	{
		element["in"]=current_in;
		element.map=current_map;
	}
	["team"].forEach(function(p){ if(!data.p) delete element[p];});
	if(element.type=="monster" && G.monsters[element.mtype])
	{
		var def=G.monsters[element.mtype];
		var mapping=[["hp","hp"],["max_hp","hp"],["mp","mp"],["max_mp","mp"]];
		["speed","xp","attack","frequency","rage","aggro","armor","resistance","damage_type","respawn","range","name","abilities","evasion","avoidance","reflection","dreturn","immune","cooperative","spawns","special","1hp","lifesteal","drops"].forEach(function(attr){mapping.push([attr,attr])});
		mapping.forEach(function(attr){ //same array as server.js monster_to_client
			if(def[attr[1]]!==undefined && (data[attr[0]]===undefined || element[attr[0]]===undefined))
			{
				element[attr[0]]=def[attr[1]];
			}
		});
	}
	if(element.type=="character")
	{
		["damage_type"].forEach(function(attr){
			if(data[attr]) element[attr]=data[attr];
		})
	}
	if(element.type=="character" && element.skin && element.skin!=data.skin && !element.rip)
	{
		if(!XYWH[data.skin]) data.skin="naked";
		element.skin=data.skin;
		new_sprite(element,"full","renew");
		restore_dimensions(element);
	}
	// if(data.cash) {data.shells=data.cash; delete data.shells;}
	for(prop in data)
	{
		if(asp_skip[prop]) continue;
		element[prop]=data[prop];
	}
	if(element.slots)
	{
		element.pzazz=0;
		for(var slot in element.slots)
		{
			if(attire_slots.includes(slot) && element.slots[slot])
			{
				var gr=calculate_item_grade(G.items[element.slots[slot].name])+0.5;
				if(element.slots[slot].level==12) element.pzazz+=gr*12;
				else if(element.slots[slot].level>=11) element.pzazz+=gr*8;
				else if(element.slots[slot].level==10) element.pzazz+=gr*6;
				else if(element.slots[slot].level==9) element.pzazz+=gr*2;
				else if(element.slots[slot].level==8) element.pzazz+=gr/2;
			}
		}
	}
	// ["stunned","cursed","poisoned","poisonous","frozen"].forEach(function(prop){
	// 	if(element[prop]) element[prop]=false;
	// });
	// if(is_player(element))
	// {
	// 	["charging","invis","invincible","mute"].forEach(function(prop){
	// 		if(element[prop]) element[prop]=false;
	// 	});
	// }
	// for(prop in data.s||{})
	// {
	// 	element[prop]=data.s[prop];
	// }
	if(element.me) element.bank=element.user;
	element.last_ms=new Date();
}

function reposition_ui()
{
	var w1=$("#topmid").outerWidth(),w2=$("#bottommid").outerWidth();
	if(character && !no_html && !cached('rpui',$("html").width(),w1,w2));
	{
		// $("#skills").css("right",$("#gamelog").outerWidth());
		// $(".locui").css("bottom",$("#chatlog").outerHeight()-5);
		// $("#xpsui").css("bottom",$("#gamelog").outerHeight()-5);
		// $("#coordsui").css("bottom",$("#gamelog").outerHeight()+$("#xpsui").outerHeight()-10);
		$("#topmid").css("right",round(($("html").width()-w1)/2));
		$("#bottommid").css("right",round(($("html").width()-w2)/2));
	}
}

function update_tutorial_ui()
{
	var completion=X.tutorial.progress;
	if(last_rendered_step>X.tutorial.step)
	{
		completion=0;
	}
	else
	{
		if(last_rendered_step<X.tutorial.step)
		{
			completion=100;
			$(".tuttask").css("color","#85C76B").css("font-size","64px");
			//$(".tutstask").show();
			$(".tuttask").html("©");
			$(".tuttaskd").show();
		}
		else completion=X.tutorial.progress;
		X.tutorial.completed.forEach(function(name){
			$(".tuttask"+name).css("color","#85C76B").css("font-size","64px");
			$(".tuttaskd"+name).show();
			//$(".tutstask"+name).show();
			$(".tuttask"+name).html("©");
		});
	}

	if(completion==100)
	{
		$(".tutcontinue").show();
		$('.tutincomplete').hide();
	}
	else
	{
		$(".tutcontinue").hide();
		$('.tutincomplete').show();
	}

	$(".tutprogress").html(completion);
	if(X.tutorial.step>1) $(".flasht").removeClass("flasht");
	$("#tutorialui").html("TUTORIAL "+(X.tutorial.step+1)+" / "+G.docs.tutorial.length);
	$("#tutorialslider").css("width",((X.tutorial.step+1)*100/G.docs.tutorial.length)+"%");
	if(X.tutorial.finished || !tutorial_ui) $(".tutorialui").hide();
	else $(".tutorialui").show();
}

function update_overlays()
{
	if(character) send_target_logic();
	if(mode.dom_tests || no_html) return;
	if(character)
	{
		if(!cached("att",character.attack)) $(".attackui").html((character.ctype=="priest"&&"HEAL "||"ATT ")+(character.ctype=="priest"&&character.heal||character.attack));
		if(!cached("inv",character.esize+"|"+character.isize)) $(".invui").html("INV "+(character.isize-character.esize)+"/"+character.isize);
		if(!cached("hptop",character.hp,character.max_hp))
		{
			//$(".hpui").html("HP: "+character.hp+"/"+character.max_hp);
			$("#hptext").html(character.hp+"/"+character.max_hp);
			$("#hpslider").css("width",(character.hp*100/character.max_hp)+"%");
		}
		if(!cached("mptop",character.mp,character.max_mp))
		{
			//$(".mpui").html("MP: "+character.mp+"/"+character.max_mp);
			$("#mptext").html(character.mp+"/"+character.max_mp);
			$("#mpslider").css("width",(character.mp*100/character.max_mp)+"%");
		}
		var xp=floor(character.xp/character.max_xp*100);
		if(!cached("xptop",character.level+"|"+xp))
		{
			$("#xpui").html("LV"+character.level+" "+xp+"%");
			$("#xpslider").css("width",(character.xp*100/character.max_xp)+"%");
		}
		if(!cached("tutorialtop",X.tutorial.step+"|"+X.tutorial.task))
		{
			update_tutorial_ui();
		}
		if(inventory && !cached("igold",character.gold)) $('.goldnum').html(to_pretty_num(character.gold+((new Date()).getDate()==101 && (new Date()).getMonth()==3?1014201800:0)));
		if(inventory && !cached("icash",character.cash)) $('.cashnum').html(to_pretty_num(character.cash));
		if(!cached("coord",round(map.real_x)+"|"+round(map.real_y))) $('.coords').html(round(map.real_x)+","+round(map.real_y));
		if(!topleft_npc) reset_topleft(ctarget);
		if(topright_npc=="character" && !cached("chcid",character.cid)) render_character_sheet();
	}
	

	var c=new Date(),h=c.getUTCHours(),m=c.getUTCMinutes();
	if(S.schedule && S.schedule.time_offset) h=(24+S.schedule.time_offset+h)%24;
	if(!cached("time",("0"+h).slice(-2)+":"+("0"+m).slice(-2)))
	{
		$(".timeui").html(("0"+h).slice(-2)+":"+("0"+m).slice(-2));
		light_logic();
	}

	if(S.abtesting && window.abtesting)
	{
		$(".scoreA").html(S.abtesting.A);
		$(".scoreB").html(S.abtesting.B);
		var seconds=-ssince(new Date(S.abtesting.end)),minutes=parseInt(seconds/60),seconds=parseInt(seconds)%60;
		if(seconds==0) seconds="00"; else if(seconds<10) seconds="0"+seconds;
		$(".abtime").html("0"+minutes+":"+seconds);
	}
	if(character && character.moving && options.code_fx && stage.cfilter_ascii) remove_code_fx();
	showhide_quirks_logic();
}

function showhide_quirks_logic()
{
	if(!character) return;
	var initial=quirks; quirks={};
	// $(".quirks").hide();
	(G.maps[character.map].quirks||[]).forEach(function(q){
		if(q[4]=="info" && point_distance(character.real_x,character.real_y,q[0],q[1])<200)
		{
			quirks[q[5]]=true;
		}
	});
	(G.maps[character.map].zones||[]).forEach(function(zone){
		[[0,-48,3],[-48,0,1],[48,0,2],[0,48,0],[0,-24,3],[-24,0,1],[24,0,2],[0,24,0]].forEach(function(m){
			if(is_point_inside([character.real_x+m[0],character.real_y+m[1]],zone.polygon))
			{
				quirks[zone.type]=true;
			}
		});
	});
	if(JSON.stringify(initial) !== JSON.stringify(quirks))
		render_server();
}

var last_loader={progress:0};
function on_load_progress(loader,resource) // called at selection.html - as it gets loaded dynamically into the game [16/11/18]
{
	if(!loader) loader=last_loader;
	else last_loader=loader;
	$("#progressui").html(round(loader.progress) + "%");
	if($("#progressui").html()=="100%") $("#progressui").removeClass("loading");
}

function loader_click()
{
	if(!server_addr) show_modal("<div style='font-size: 48px'>No servers found, 3 possible scenarios: <br /><br />(1) The game is being updated <br />(2) All existing servers overloaded <br />(3) Someone found a bug that brought down all the servers<br /><br />Best to spend this time in our Discord to figure out what happened</div>");
	else if($("#progressui").html()!="100%") show_modal("<div style='font-size: 48px'>Game resources are loading<br /><br />This may take some time<br /><br />If the game got stuck at this stage, please email hello@adventure.land</div>");
	else show_modal("<div style='font-size: 48px'>All game resources have been loaded<br /><br />If you can't sign in, please email hello@adventure.land</div>")
}

function init_interface()
{try{
		$('.codesearch').val("");
		$('.codesearch').bind("propertychange change click keyup input paste", function(event){ csearch_logic("ui"); });
		csearch_logic("ui");
	}catch(e){
		console.error(e);
}}

function the_game(demo)
{
	// if(!window.requestAnimationFrame) window.requestAnimationFrame=function(a){ setTimeout(a,16); }; // jsdom patch [18/04/19]
	if(is_cli && window.ls_emulation) window._localStorage=window.ls_emulation;
	width=$(window).width();
	height=$(window).height();
	if(bowser.mac && bowser.firefox && !engine_mode) renderer=new PIXI.CanvasRenderer(width,height,{antialias: antialias, transparent: false}); //, resolution:window.devicePixelRatio etc. doesn't work [15/11/16]
	else if(retina_mode && !engine_mode) renderer=new PIXI.autoDetectRenderer(width,height,{antialias: antialias, transparent: false, resolution:window.devicePixelRatio, autoResize:true});
	else if(engine_mode=="webgl") renderer=new PIXI.WebGLRenderer(width,height,{antialias: antialias, transparent: false});
	else if(engine_mode=="canvas") renderer=new PIXI.CanvasRenderer(width,height,{antialias: antialias, transparent: false});
	else renderer=new PIXI.autoDetectRenderer(width,height,{antialias: antialias, transparent: false}); // , resolution:window.devicePixelRatio, autoResize:true

	if(high_precision) PIXI.PRECISION.DEFAULT = PIXI.PRECISION.HIGH;

	if(renderer.type == PIXI.RENDERER_TYPE.WEBGL) console.log('WebGL Mode');
	else console.log('Canvas Mode');

	renderer.plugins.interaction.cursorStyles.help="help";
	renderer.plugins.interaction.cursorStyles.crosshair="crosshair";

	// renderer.plugins.interaction.cursorStyles.pointer = function() {
	// console.log('Should be a pointer');
	// };
	// renderer.plugins.interaction.cursorStyles.default= function() {
	// console.log('Should be default cursor');
	// };

	if(!no_graphics) document.body.appendChild(renderer.view);
	$("canvas").css("position","fixed").css("top","0px").css("left","0px").css("z-index",1);

	if(PIXI.display && PIXI.display.Stage) stage = new PIXI.display.Stage();
	else stage = new PIXI.Container();
	/* start secondary level */
	//inner_stage=new PIXI.Container();

	if(bw_mode)
	{
		var filter=new PIXI.filters.ColorMatrixFilter();
		filter.desaturate();
		stage.cfilter_bw=filter;
		regather_filters(stage);
	}
	else
	{
		delete stage.cfilter_bw;
		regather_filters(stage);
	}
	
	//stage.addChild(inner_stage);
	/* end secondary level */

	if(PIXI.DisplayList && !no_graphics)
	{
		if(window.inner_stage) inner_stage.displayList = new PIXI.DisplayList();
		else stage.displayList = new PIXI.DisplayList();
		map_layer=new PIXI.DisplayGroup(0, true);
		text_layer=new PIXI.DisplayGroup(3, true);
		chest_layer=new PIXI.DisplayGroup(2, true);
		separate_layer=new PIXI.DisplayGroup(0, true);
		monster_layer=new PIXI.DisplayGroup(1,  function (sprite) {
			var disp=0;
			if(sprite.stand) disp=-3;
			if("real_y" in sprite) sprite.zOrder = -sprite.real_y+disp+(sprite.y_disp||0);
			else sprite.zOrder = -sprite.position.y+disp+(sprite.y_disp||0);
		});
		// var player_layer = new PIXI.DisplayGroup(0, true);
		player_layer=monster_layer;
		chest_layer=monster_layer;
	}
	else if(PIXI.display)
	{

		PIXI.Container.prototype.renderWebGL = function (renderer) {
			if (this._activeParentLayer && this._activeParentLayer != renderer._activeLayer) {
				return;
			}
			if (!this.visible) {
				this.displayOrder = 0;
				return;
			}

			this.displayOrder = renderer.incDisplayOrder();

			if (this.worldAlpha <= 0 || !this.renderable) {
				return;
			}
		 
			renderer._activeLayer = null; // < -- this is my temporary change
			this.containerRenderWebGL(renderer);
			renderer._activeLayer = this._activeParentLayer; // < -- and this one too
		};

		use_layers=true;
		stage.group.enableSort = true;
		// chest_layer=new PIXI.display.Group(3, true);
		var monster_sort=function(sprite){
			var disp=0;
			if(sprite.stand) disp=-3;
			if("real_y" in sprite) sprite.zOrder = -sprite.real_y+disp+(sprite.y_disp||0);
			else sprite.zOrder = -sprite.position.y+disp+(sprite.y_disp||0);
		};
		var child_sort=function(sprite){
			var disp=0;
			if(sprite.parent.stand) disp=-3;
			if("real_y" in sprite.parent) sprite.zOrder = -sprite.parent.real_y+disp+(sprite.parent.y_disp||0);
			else sprite.zOrder = -sprite.parent.position.y+disp+(sprite.parent.y_disp||0);
		}
		map_layer=new PIXI.display.Group(0, true); stage.addChild(new PIXI.display.Layer(map_layer));
		animation_layer=new PIXI.display.Group(1,true); stage.addChild(new PIXI.display.Layer(animation_layer));
		entity_layer=new PIXI.display.Group(2,child_sort); stage.addChild(new PIXI.display.Layer(entity_layer));
		// Name tags - previously 2 - now 6 so they render over everything [06/08/18]
		below_layer=new PIXI.display.Group(2.99,monster_sort); stage.addChild(new PIXI.display.Layer(below_layer));
		monster_layer=new PIXI.display.Group(3,monster_sort); stage.addChild(new PIXI.display.Layer(monster_layer));
		above_layer=new PIXI.display.Group(3.01,monster_sort); stage.addChild(new PIXI.display.Layer(above_layer));
		hp_layer=new PIXI.display.Group(4,child_sort); stage.addChild(new PIXI.display.Layer(hp_layer));
		text_layer=new PIXI.display.Group(5, true); stage.addChild(new PIXI.display.Layer(text_layer));
		weather_layer=new PIXI.display.Group(6, true); stage.addChild(new PIXI.display.Layer(weather_layer));
		fog_layer=new PIXI.display.Group(7, true); stage.addChild(new PIXI.display.Layer(fog_layer));

		// var player_layer = new PIXI.DisplayGroup(0, true);
		player_layer=monster_layer;
		player_layer.sortPriority=1;
		player_layer.useDoubleBuffer=true;
		chest_layer=monster_layer;


		if(mode.ltbl && !no_graphics)
		{
			lighting=new PIXI.display.Layer();
			lighting.on('display', function(element) {
				element.blendMode=PIXI.BLEND_MODES.ADD;
			});
			lighting.useRenderTexture = true;
			lighting.clearColor = [0.25, 0.25, 0.25, 1]; // ambient gray

			stage.addChild(lighting);

			var lightingSprite = new PIXI.Sprite(lighting.getRenderTexture());
			lightingSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
			lightingSprite.parentGroup=lightingSprite.displayGroup=fog_layer;

			stage.addChild(lightingSprite);
		}
	}
	frame_ms=16;
	C=PIXI.utils.BaseTextureCache;
	FC={}; // file for name
	FM={}; // [i,j] for portraits
	XYWH={}; // dimensions - previously D, it was cool while it lasted, renamed to XYWH, so the server.D can be imported into window.D [12/07/18]
	loader=PIXI.loader;
	loader.on("progress",on_load_progress);

	//alert(JSON.stringify(M));
	for(var name in G.animations)
	{
		G.animations[name].file=url_factory(G.animations[name].file);
		loader.add(G.animations[name].file);
	}
	for(var name in G.tilesets)
	{
		G.tilesets[name].file=url_factory(G.tilesets[name].file);
		loader.add(G.tilesets[name].file);
	}
	for(var name in G.sprites)
	{
		var s_def=G.sprites[name];
		if(s_def.skip) continue;
		s_def.file=url_factory(s_def.file);
		loader.add(s_def.file);
	}
	for(var name in G.imagesets)
	{
		if(!G.imagesets[name].load) continue;
		G.imagesets[name].file=url_factory(G.imagesets[name].file);
		loader.add(G.imagesets[name].file);
	}

	gprocess_game_data();

	if(mode.bitmapfonts) loader.add("/css/fonts/m5x7.xml"); //,{xhrType:PIXI.loaders.Resource.XHR_RESPONSE_TYPE.DOCUMENT}

	set_status("75% ->Server");

	if(!demo)
	{
		load_game();
		init_socket();
	}
	else init_demo();
}

function demo_entity_logic(sprite)
{
	if(!sprite.demo) return;
	if(sprite.moving) return;
	if(sprite.pause && mssince(sprite.pause)<800) return;
	if(Math.random()<0.1) sprite.pause=new Date();
	var moves=[[1,0],[0,1],[-1,0],[0,-1],[0.8,0.8],[-0.8,-0.8],[0.8,-0.8],[-0.8,0.8]],multiplier=12;
	if(Math.random()<0.3) multiplier*=2;
	else if(Math.random()<0.3) multiplier*=3;
	shuffle(moves);
	sprite.going_x=sprite.x+moves[0][0]*multiplier;
	sprite.going_y=sprite.y+moves[0][1]*multiplier;
	if(sprite.boundary && (sprite.going_x<sprite.boundary[0] || sprite.going_x>sprite.boundary[2] || sprite.going_y<sprite.boundary[1] || sprite.going_y>sprite.boundary[3]));
	else if(can_move(sprite))
	{
		sprite.u=true; sprite.moving=true;
		sprite.from_x=sprite.x;
		sprite.from_y=sprite.y;
		calculate_vxy(sprite);
	}
	else
	{
		sprite.going_x=sprite.x; sprite.going_y=sprite.y;
	}
}

function init_demo()
{
	is_demo=1;
	current_map=current_in="shellsisland";
	M=G.maps[current_map].data;
	GEO=G.geometry[current_map];
	reflect_music();
	load_game();
	// map.real_y=-90; <- at load_game's callback
	G.maps[current_map].monsters.forEach(function(pack){
		future_entities.monsters[pack.type]={
			type:pack.type,
			speed:8,
			id:pack.type,
			x:pack.boundary[0]+(pack.boundary[2]-pack.boundary[0])*Math.random(),
			y:pack.boundary[1]+(pack.boundary[3]-pack.boundary[1])*Math.random(),
			boundary:pack.boundary,
			s:{},
			'in':current_map,
			map:current_map,
			moving:false,
			demo:true,
		}
	});
}

var first_welcome=false;
function init_socket(args)
{
	if(!args) args={};
	if(!server_addr) { add_log("Welcome"); add_log("No live server found","red"); add_log("Please check again in 2-3 minutes"); add_log("Spend this time in our Discord chat room",colors.code_blue); add_update_notes(); return; }
	if(window.socket)
	{
		if(!socket_welcomed) return add_log("Another server connection in progress. Please wait.");
		window.socket.destroy();
	}
	$(".disconnected").hide();
	if(is_sdk && (Cookies.get("windows") || Cookies.get("local_ip") || window.location.host=="advanture.land" || window.location.host=="x.thegame.com")) server_addr="192.168.1.125"; // Cookies.set('windows','1',{expires:12*365});
	else if(is_sdk)
	{
		if(window.location.origin=='http://127.0.0.1/') server_addr="127.0.0.1";
		else server_addr="0.0.0.0";
	}
	var query=args.secret&&"desktop="+(!is_comm&&1||"")+"&secret="+args.secret||undefined;
	if(location.protocol=="https:") window.socket=io('wss://'+server_addr+':'+server_port,{secure:true,transports:['websocket'],query:query});
	else window.socket=io(server_addr+':'+server_port,{transports:['websocket'],query:query});
	add_log("Connecting to the server.");
	socket_ready=false; socket_welcomed=false; observing=null; $("#observeui").hide();
	original_onevent=socket.onevent;
	original_emit=socket.emit;
	socket.emit=function(packet){
		var is_transport=in_arr(arguments && arguments["0"],["transport","enter","leave"]);
		// if(is_transport) alert("transport intercepted");
		if(mode.log_calls) console.log('CALL',JSON.stringify(arguments)+" "+new Date());
		if(!(transporting && is_transport && ssince(transporting)<8))
		{
			original_emit.apply(socket,arguments);
			if(is_transport) transporting=new Date();
		}
		else
		{
			resolve_deferred(arguments["0"],{success:false,in_progress:true,place:"emit_override_in_gamejs"});
		}
	};
	socket.onevent=function(packet){
		if(mode.log_incoming) console.log('INCOMING',JSON.stringify(arguments)+" "+new Date());
		original_onevent.apply(socket,arguments);
	};
	socket.on('welcome',function(data){
		if(data && data.character)
		{
			observing=data.character;
			$("#observeui").show();
		}
		S=data.S;
		socket_welcomed=true;
		is_pvp=data.pvp;
		gameplay=data.gameplay;
		server_region=data.region;
		server_identifier=data.name;
		server_name=server_names[data.region]+" "+data.name;
		clear_game_logs(); add_log("Welcome to "+server_names[data.region]+" "+data.name);
		add_update_notes();
		if(!first_welcome)
		{
			first_welcome=true;
			if(is_electron && electron_is_main() && user_id) setTimeout(electron_code_sync_logic,1);
		}
		current_map=data.map; current_in=data["in"]; first_coords=true; first_x=data.x; first_y=data.y; reflect_music();
		M=G.maps[current_map].data;
		GEO=G.geometry[current_map];
		$(".servername").html(server_name);
		$(".mapname").html(G.maps[current_map].name||"Unknown");
		if(!resources_loaded) socket_ready=true;
		else
		{
			launch_game();
			//create_map();
			//socket.emit("loaded",{success:1,width:screen.width,height:screen.height,scale:scale});
		}
		render_server();
		new_map_logic("welcome",data);
	});
	socket.on('new_map',function(data){
		var create=false;
		transporting=false;
		if(current_map!=data.name)
		{
			create=true;
			topleft_npc=false;
			data.redraw=true;
		}
		current_map=data.name; current_in=data["in"]; reflect_music();
		// alert(current_map);
		M=G.maps[current_map].data;
		GEO=G.geometry[current_map];
		$(".mapname").html(G.maps[current_map].name||"Unknown");
		if(character)
		{
			character.real_x=data.x;
			character.real_y=data.y;
			character.m=data.m;
			character.moving=false;
			resolve_deferreds("move",{reason:"new_map"});
			var odir=character.direction;
			character.direction=data.direction||0;
			character.map=current_map;
			character['in']=data['in'];
			if(data.effect==="blink")
			{
				delete character.fading_out;
				delete character.s.blink;
				character.real_alpha=0.5;
				//character.fading_in=true; //Decided to use the regular .tp logic [17/05/18]
				restore_dimensions(character);
			}
			if(data.effect==="magiport")
			{
				delete character.fading_out;
				delete character.s.magiport;
				stop_filter(character,"bloom");
				character.real_alpha=0.5;
				character.direction=odir;
				restore_dimensions(character);
			}
			blink_pressed=false; last_blink_pressed=really_old;
			if(data.effect) unstuck_logic(character);
			character.tp=data.effect;
			if(data.name=="bank") tut("bank");
		}
		var cm_timer=new Date();
		if(create) create_map();
		if(!character)
		{
			map.real_x=data.x;
			map.real_y=data.y;
		}
		// console.log("create_map: "+mssince(cm_timer));
		position_map();
		new_map_logic("map",data);
		handle_entities(data.entities,{new_map:true});
		if(data.eval) eval(data.eval);
		call_code_function("trigger_event","new_map",data);
		call_code_function("trigger_character_event","new_map",data);
	});
	socket.on('start',function(data){
		// alert(JSON.stringify(data));
		if(!no_html)
		{
			$("#progressui").remove();
			$("#content").html("");
			$("#topmid,#bottommid,#toprightcorner,#bottomleftcorner2,#bottomleftcorner").show();
			$(".xpsui").css("display","block");
			$(".tutorialui").css("display","block");
			$("body").append('<input id="chatinput" onkeypress="if(event.keyCode==13) say($(this).rfval()); send_typing();" type="text" autocomplete="off" name="alchatinput" placeholder=""/>');
		}

		if(gtest)
		{
			$("body").children().each(function(){
				if(this.tagName!="CANVAS") $(this).remove();
			});
		}
		// $("#gameui").show();
		inside="game"; observing=null; $("#observeui").hide();
		// show_json(data);
		S=data.s_info;
		var code=data.code,code_version=data.code_version,scode_slot=data.code_slot; delete data.code; delete data.code_version; delete data.code_slot;
		if(scode_slot) console.log("start: "+data.id+" code: "+scode_slot);
		// console.log(code); console.log(code_version); console.log(scode_slot);
		var m_info=data.info; delete data.info; delete data.s_info;
		var d_entities=data.entities; delete data.entities;
		G.base_gold=data.base_gold; delete data.base_gold;
		character=add_character(data,1);
		character.ping=min(320,mssince(window.auth_sent));
		pings=[character.ping];
		if(!data.vision) character.vision=[700,500];
		friends=data.friends;
		character.home=data.home;
		character.emx=data.emx;
		character.acx=data.acx;
		character.xcx=data.xcx;
		G.classes[character.ctype].xcx.forEach(function(c){ if(!character.xcx.includes(c)) character.xcx.push(c) });
		if(character.level==1)
		{
			if(X && X.tutorial && !X.tutorial.finished && tutorial_ui) open_tutorial();
			else show_game_guide();
		}
		if(character.ctype=="merchant" || recording_mode || 1) options.show_names=true;
		clear_game_logs(); add_log("Connected!");
		// add_holiday_log();
		// add_greenlight_log();
		if(gameplay=="hardcore")
		{
			add_log("Pro Tips: You can transport to anywhere from the Beach Cave, Water Spirits drop stat belts, 3 monsters drop 3 new unique items, 3 monsters drop 50 times the gold they usually do!","#B2D5DF");
			$(".saferespawn").show();
		}
		else add_log("Note: Game dynamics and drops aren't final, they are evolving with every update","gray");
		// add_log("Warning: A Chrome bug is causing memory leaks, very small but it adds up. They patched the bug, however, that patch didn't make it to our browsers yet","#E08583");
		$(".charactername").html(character.name);
		page.title=character.name;
		if(gameplay=="hardcore") page.title="Fierce "+character.name;
		try{
			var get="";
			if(no_html) get+=(!get&&"?"||"&")+"no_html=true";
			if(is_bot) get+=(!get&&"?"||"&")+"is_bot=1";
			if(no_graphics) get+=(!get&&"?"||"&")+"no_graphics=true";
			if(border_mode) get+=(!get&&"?"||"&")+"borders=true";
			if(explicit_slot) get+=(!get&&"?"||"&")+"code="+explicit_slot;
			// if(lowest) get+=(!get&&"?"||"&")+"lowest=true";
			page.url="/character/"+character.name+"/in/"+server_region+"/"+server_identifier+"/"+get;
			window.history.replaceState({},page.title,page.url);
			$("title").html(page.title);
		} catch(e){
			console.log(e);
		}
		// draw_timeout(function(){ add_log("Welcome "+character.name) },650);
		reposition_ui(); update_overlays();
		current_in=character["in"];
		if(character.map!=current_map)
		{
			current_map=character.map; reflect_music();
			M=G.maps[current_map].data;
			GEO=G.geometry[current_map];
			$(".mapname").html(G.maps[current_map].name||"Unknown");
			create_map();
		}
		if(!gtest)
		{
			if(manual_centering)
			{
				if(window.inner_stage) inner_stage.addChild(character);
				else stage.addChild(character);
			}
			else map.addChild(character);
		}
		position_map();
		rip_logic();
		new_map_logic("start",{info:m_info});
		new_game_logic();
		// ipass=data.ipass;
		// setInterval(function(){ if(game_loaded) $.getJSON(location.protocol+"//"+server_addr+":"+(parseInt(server_port)+40)+"/character?checkin=1&ipass="+ipass+"&id="+character.id+"&callback=?"); },30000); // + "?" = JSONP
		
		// api_call("load_gcode",{file:"/examples/hardcore.js",run:true});
		try{
			var data=storage_get("code_cache"),the_code="",to_run=false;
			if(data)
			{
				data=JSON.parse(data);
				the_code=(!scode_slot || data["slot_"+real_id]==scode_slot)&&data["code_"+real_id]||code||"";
				to_run=explicit_slot&&'1'||data["run_"+real_id];
				code_slot=scode_slot||data["slot_"+real_id]||real_id;
				if(the_code.length)
					handle_information([{type:"code",code:the_code,run:to_run,slot:code_slot,reset:true}]);
			}
			else if(code)
			{
				code_slot=scode_slot;
				handle_information([{type:"code",code:code,run:explicit_slot&&true||false,slot:code_slot,reset:true}]);
			}
		}
		catch(e){console.log(e);}
		var settings=get_settings(real_id);
		if(settings.skillbar) skillbar=settings.skillbar;
		if(settings.keymap) keymap=settings.keymap;
		if(!is_electron)
		{
			if(settings.music=="on" || sound_music) sound_on();
			if(settings.sfx=="on" || sound_sfx) sfx_on();
		}
		map_keys_and_skills();
		render_skillbar();
		if(!character.rip) $("#name").css("color","#1AC506"); set_status("Connected");
		render_server();
		// show_json(d_entities);
		handle_entities(d_entities,{new_map:true});
		if(character.role=="cx" && !is_bot) insert_cx_tuners();
	});
	socket.on('correction',function(data){
		if(can_move({map:character.map,x:character.real_x,y:character.real_y,going_x:data.x,going_y:data.y,base:character.base}))
		{
			add_log("Location corrected","gray");
			console.log("Character correction");
			character.real_x=parseFloat(data.x);
			character.real_y=parseFloat(data.y);
			// character.moving=false; character.vx=character.vy=0;
			recalculate_vxy(character);
			// resolve_deferreds("move",{reason:"correction"});
		}
	});
	socket.on("players",function(data){ load_server_list(data); });
	socket.on("pvp_list",function(data){ if(data.code) call_code_function("trigger_event","pvp_list",data.list); else load_pvp_list(data.list); });
	socket.on("ping_ack",function(data){
		if(!pingts[data.id]) return;
		if(data.ui) add_log("Ping: "+mssince(pingts[data.id])+"ms","gray");
		push_ping(mssince(pingts[data.id]));
		delete pingts[data.id];
	});
	socket.on("requesting_ack",function(){
		socket.emit("requested_ack",{});
	});
	socket.on("game_error",function(data){ draw_trigger(function(){ if(is_string(data)) ui_error(data); else ui_error(data.message)}); });
	socket.on("game_log",function(data){
		if((data.message||data)=="You killed a Goo") tut("killagoo");
		draw_trigger(function(){
			if(is_string(data)) ui_log(data,"gray");
			else
			{
				if(data.sound) sfx(data.sound);
				ui_log(data.message,data.color);
			}
			if(data.confetti && get_player(data.confetti)) confetti_shower(get_player(data.confetti),1);
		});
	});
	socket.on("game_chat",function(data){ // Just for GM stuff [04/07/18]
		draw_trigger(function(){
			if(is_string(data)) add_chat("",data,"gray");
			else
			{
				if(data.sound) sfx(data.sound);
				add_chat("",data.message,data.color);
			}
		});
	});
	socket.on("fx",function(data){
		draw_trigger(function(){
			if(data.name=="the_door") the_door();
		});
	});
	socket.on("online",function(data){
		draw_trigger(function(){
			no_chat_notification=true;
			add_chat("",data.name+" is on "+data.server,"white","online|"+data.name); //#80ECA7
			no_chat_notification=false;
		});
	});
	socket.on('light',function(data){
		draw_trigger(function(){
			if(data.affected)
			{
				// These were outside draw_trigger, but moved inside [03/07/18]
				if(is_pvp) pvp_timeout(3600);
				skill_timeout('invis');
			}
			if(data.affected) start_animation(character,"light");
			last_light=new Date();
			var player=get_entity(data.name); if(!player) return;
			d_text("LIGHT",player,{color:"white"});
			//disappearing_circle(player.real_x,player.real_y-9,20,{alpha:0.7});
			//disappearing_circle(player.real_x,player.real_y-8,10,{alpha:0.7,color:0xDED491});
			if(player.me) start_animation(player,"light");
			for(var id in entities)
			{
				var entity=entities[id];
				if(is_player(entity) && distance(entity,player)<300) start_animation(entity,"light");
			}
		});
	});
	socket.on('game_event',function(data){
		if(!data.name) data={name:data};
		if(data.name=="pinkgoo")
		{
			add_chat("","The 'Love Goo' has respawned in "+G.maps[data.map].name+"!","#EDB0E0");
		}
		if(data.name=="snowman")
		{
			// add_chat("","Snowman respawned in "+G.maps[data.map].name+"!","#B1DCEF");
			// add_chat("","Join the fight against Snowman!","#B1DCEF");
		}
		if(data.name=="franky")
		{
			// add_chat("","Franky spawned in "+G.maps[data.map].name+"!","#9D99EF");
			// add_chat("","Join the fight against Franky!","#9D99EF");
		}
		if(data.name=="wabbit")
		{
			add_chat("","Wabbit has respawned in "+G.maps[data.map].name+"!","#78CFEF");
		}
		if(data.name=="goldenbat")
		{
			add_chat("","The Golden Bat has spawned in "+G.maps[data.map].name+"!","gold");
		}
		if(data.name=="ab_score")
		{
			if(!events.abtesting) return;
			// add_log(data.color+" A: "+data.A+" B: "+data.B);
			events.abtesting.A=data.A;
			events.abtesting.B=data.B;
		}
		call_code_function("on_game_event",data);
		call_code_function("trigger_event","event",data);
	});
	socket.on('achievement_progress',function(data){
		add_log("AP["+data.name+"]: "+to_pretty_num(data.count)+"/"+to_pretty_num(data.needed),"#6DCC9E");
	});
	socket.on('achievement_success',function(data){
		add_log("AP["+data.name+"]: Complete!","#58CF40");
	});
	socket.on('skill_timeout',function(data){
		skill_timeout(data.name,data.ms);
	});
	socket.on('game_response',function(data){
		if(is_sdk) console.log(["game_response",data]);
		var response=data.response||data;
		try{
			var cevent=false,event=false;
			if(data.cevent) cevent=data.cevent,delete data.cevent; if(cevent===true) cevent=response;
			if(data.event) event=data.event,delete data.event; if(event===true) event=response;
			
			if(data.place && data.failed)
			{
				if(!data.reason) data.reason=data.response;
				reject_deferred(data.place,data);
			}
			else if(data.place)
			{
				resolve_deferred(data.place,data);
			}
			if(cevent) call_code_function("trigger_character_event",cevent,data);
			if(event) call_code_function("trigger_event",event,data);

		}catch(e){
			if(is_sdk) console.error(e);
		}
		if(response=="upgrade_success" || response=="upgrade_fail") u_retain_t=options.retain_upgrades;
		draw_trigger(function(){
			if(response=="elixir"){ ui_log("Consumed the elixir","gray"); d_text("YUM",character,{color:"elixir"}); }
			else if(response=="data"){}
			else if(response=="invalid"){
				d_text("INVALID",character);
			}
			else if(response=="error")
			{
				ui_error("Server error!");
			}
			else if(response=="storage_full")
			{
				ui_log("Storage is full","gray");
				reopen();
			}
			else if(response=="safety_check");
			else if(response=="inventory_full")
			{
				d_text("NO SPACE",character);
				ui_log("Inventory is full","gray");
				reopen();
			}
			else if(response=="home_set")
			{
				render_interaction({auto:true,skin:"lionsuit",message:"Set your home to: "+data.home});
				character.home=data.home;
			}
			else if(response=="sh_time")
			{
				render_interaction({auto:true,skin:"lionsuit",message:"You can't change your home server for another "+to_pretty_float(data.hours)+" hours!"});
			}
			else if(response=="invalid") ui_log("Invalid","gray");
			else if(response=="only_in_home") ui_log("You can only do this in your home server!","gray");
			else if(response=="cant_when_sick")
			{
				if(data.goblin) render_interaction({auto:true,skin:G.npcs.lostandfound.skin,message:"Ugh, you're sick! Come back when you are healed!"});
				ui_log("You can't do this when you are sick!","gray");
			}
			else if(response=="party_full") ui_log("The party is full","gray");
			else if(response=="already_in_party") ui_log("Already in this party","gray");
			else if(response=="player_gone") ui_log(data.name+" is gone","gray");
			else if(response=="invitation_expired") ui_log("Invitation expired","gray");
			else if(response=="request_expired") ui_log("Request expired","gray");
			else if(response=="cant_kick") ui_log("You can't kick someone who's above you.","gray");
			else if(response=="compound_success")
			{
				tut("compound");
				ui_log("Item combination succeeded",data.up&&"#1ABEFF"||"white");
				if(!data.stale) resolve_deferred("compound",{success:true,level:data.level,num:data.num});
			}
			else if(response=="compound_fail")
			{
				tut("compound");
				ui_error("Item combination failed");
				if(!data.stale) resolve_deferred("compound",{success:false,level:data.level,num:data.num});
			}
			else if(response=="compound_in_progress")
			{
				ui_log("Another combination in progress","gray");
			}
			else if(response=="compound_invalid_offering")
			{
				ui_log("Offering not accepted","gray");
				reject_deferred("compound",{reason:"offering"});
			}
			else if(response=="compound_mismatch")
			{
				ui_log("Items are different","gray");
				reject_deferred("compound",{reason:"mismatch"});
			}
			else if(response=="compound_cant")
			{
				ui_log("Can't be combined","gray");
				reject_deferred("compound",{reason:"not_combinable"});
			}
			else if(response=="compound_incompatible_scroll")
			{
				set_uchance("?");
				ui_log("Incompatible scroll","gray");
				reject_deferred("compound",{reason:"scroll"});
			}
			else if(response=="misc_fail")
			{
				ui_log(":)","#FF5D54");
			}
			else if(response=="upgrade_success")
			{
				tut("upgrade");
				ui_log("Item upgrade succeeded","white");
				if(!data.stale) resolve_deferred("upgrade",{success:true,level:data.level,num:data.num});
			}
			else if(response=="upgrade_fail")
			{
				tut("upgrade");
				ui_error("Item upgrade failed");
				if(!data.stale) resolve_deferred("upgrade",{failed:true,success:false,level:data.level,num:data.num});
			}
			else if(response=="upgrade_success_stat")
			{
				tut("addstats");
				if(!data.stale) resolve_deferred("upgrade",{stat:true,stat_type:data.stat_type,num:data.num});
			}
			else if(response=="upgrade_offering_success")
			{
				ui_log("Offering succeeded","white");
				if(!data.stale) resolve_deferred("upgrade",{success:true});
			}
			else if(response=="upgrade_no_item")
			{
				reject_deferred("upgrade",{reason:"no_item"});
			}
			else if(response=="upgrade_in_progress")
			{
				ui_log("Another upgrade in progress","gray");
				reject_deferred("upgrade",{reason:"in_progress"});
			}
			else if(response=="mail_sending")
			{
				ui_log("Sending mail ...","gray");
				hide_modal(true);
			}
			else if(response=="mail_failed")
			{
				show_alert("Mail failed, reason: "+data.reason);
			}
			else if(response=="mail_sent")
			{
				ui_log("Mail sent to "+data.to+"!","#C06978");
			}
			else if(response=="mail_sent")
			{
				ui_log("Mail sent to "+data.to+"!","#C06978");
			}
			else if(response=="mail_take_item_failed")
			{
				ui_log("Can't retrieve the item, probably you took it already","#C06978");
				setTimeout(function(){ api_call('pull_mail'); },2000);
				$('.takeitem').hide();
			}
			else if(response=="mail_item_taken")
			{
				ui_log("Item retrieved!","#6DAD47");
				setTimeout(function(){ api_call('pull_mail'); },2000);
				$('.takeitem').hide();
			}
			else if(response=="upgrade_no_scroll")
			{
				reject_deferred("upgrade",{reason:"no_scroll"});
			}
			else if(response=="upgrade_mismatch")
			{
				reject_deferred("upgrade",{reason:"mismatch"});
			}
			else if(response=="upgrade_invalid_offering")
			{
				ui_log("Offering not accepted","gray");
				reject_deferred("upgrade",{reason:"offering"});
			}
			else if(response=="upgrade_cant")
			{
				ui_log("Can't be upgraded","gray");
				reject_deferred("upgrade",{reason:"not_upgradeable"});
			}
			else if(response=="upgrade_incompatible_scroll")
			{
				set_uchance("?");
				ui_log("Incompatible scroll","gray");
				reject_deferred("upgrade",{reason:"scroll"});
			}
			else if(response=="upgrade_scroll_q")
			{
				ui_log("Need "+data.q+" scrolls","gray");
				reject_deferred("upgrade",{reason:"scroll_quantity",need:data.q,have:data.h});
			}
			else if(response=="upgrade_chance" || response=="compound_chance")
			{
				set_uchance(data.chance);
			}
			else if(response=="max_level")
			{
				set_uchance("?");
				ui_log("Already +"+data.level,"white");
			}
			else if(response=="exception")
			{
				ui_error("ERROR!");
			}
			else if(response=="got_picked") ui_log("Felt a touch","#D8866C");
			else if(response=="picked") { yes_yes_yes(); ui_log("Got something!","#3AD585"); }
			else if(response=="pick_failed") { no_no_no(); ui_log("Couldn't pick anything","gray"); }
			else if(response=="nothing") ui_log("Nothing happens","gray");
			else if(response=="inviter_gone") ui_log("Inviter gone","gray");
			else if(response=="not_ready") d_text("NOT READY",character);
			else if(response=="cant_equip") d_text("CAN'T EQUIP",character);
			else if(response=="cant") d_text("CAN'T",character);
			else if(response=="muted") d_text("MUTED",character);
			else if(response=="cant_consume") d_text("CAN'T CONSUME",character);
			else if(response=="giveaway") d_text("GIVEAWAY?!",character);
			else if(response=="no_merchants") ui_log("No merchants!","gray");
			else if(response=="join_too_late") ui_log("Too late to join","gray");
			else if(response=="receiver_unavailable") ui_log("Receiver unavailable","gray");
			else if(response=="no_mp")
			{
				d_text("NO MP",character);
			}
			else if(response=="friendly")
			{
				var safe=false,phrase="FRIENDLY";
				if(G.maps[character.map].safe) safe=true,phrase="SAFE ZONE";
				if(get_entity(data.id)) d_text(phrase,get_entity(data.id));
				else d_text(phrase,character);
				if(safe) ui_log("You can't attack in a safe zone","gray");
			}
			else if(response=="cooldown")
			{
				if(data.id && get_entity(data.id)) d_text("WAIT",get_entity(data.id));
				else d_text("WAIT",character);
			}
			else if(response=="too_far") d_text("TOO FAR",data.id && get_entity(data.id) || character);
			else if(response=="invalid_target") d_text("DOESN'T WORK",data.id && get_entity(data.id) || character);
			else if(response=="miss")
			{
				if(get_entity(data.id)) d_text("MISS",get_entity(data.id));
				else d_text("MISS",character);
			}
			else if(response=="disabled")
			{
				d_text("DISABLED",character);
			}
			else if(response=="attack_failed")
			{
				if(get_entity(data.id)) d_text("FAILED",get_entity(data.id));
				else d_text("FAILED",character);
				if(data.reason=="level") ui_log("Level gap higher than 10","gray");
			}
			else if(response=="no_skill") ui_log("Skill doesn't exist","gray");
			else if(response=="target_alive") d_text("LOOKS LIVE?",character);
			else if(response=="slot_occuppied") ui_log("Slot occuppied","gray");
			else if(response=="no_target") d_text(!ctarget && "NO TARGET" || "INVALID TARGET",character);
			else if(response=="non_friendly_target") d_text("NON FRIENDLY",character);
			else if(response=="cant_respawn") ui_log("Can't respawn yet.","gray");
			else if(response=="chat_slowdown") ui_log("You can't chat this fast.","gray");
			else if(response=="not_in_party") ui_log("You are not in a party.","gray");
			else if(response=="challenge_sent") add_chat("","Challenged "+data.name+" to duel","white");
			else if(response=="challenge_accepted") add_chat("",data.name+" accepted the challenge!","#DF231B");
			else if(response=="challenge_received")
			{
				add_challenge(data.name);
				call_code_function("trigger_character_event","challenge",data.name);
			}
			else if(response=="duel_started")
			{
				add_duel(data.challenger,data.vs,data.id);
				call_code_function("trigger_character_event","duel",{challenger:data.challenger,vs:data.vs,id:data.id});
			}
			else if(response=="no_level") { d_text("LOW LEVEL",character); }
			else if(response=="not_in_pvp") { d_text("NO",character); }
			else if(response=="skill_cant_incapacitated") { d_text("CAN'T USE",character); }
			else if(response=="skill_cant_use") { d_text("CAN'T USE",character); }
			else if(response=="skill_cant_safe") { d_text("CAN'T USE",character); }
			else if(response=="skill_cant_item") { d_text("OUT OF AMMO",character); }
			else if(response=="skill_cant_charges") { d_text("NO CHARGE",character); }
			else if(response=="skill_cant_pve") { d_text("CAN'T USE",character); }
			else if(response=="skill_cant_wtype") { ui_log("Wrong weapon","gray"); d_text("NOPE",character); }
			else if(response=="skill_cant_slot") { ui_log("Item not equipped","gray"); d_text("NOPE",character); }
			else if(response=="skill_cant_requirements") { ui_log("Skill requirements not met","gray"); d_text("NOPE",character); }
			else if(response=="cruise") ui_log("Cruise speed set at "+data.speed,"gray");
			else if(response=="exchange_existing") { d_text("WAIT",character); ui_log("Existing exchange in progress","gray"); reopen(); }
			else if(response=="exchange_notenough") { d_text("NOT ENOUGH",character); ui_log("Need more","gray"); reopen(); }
			else if(in_arr(response,["mistletoe_success","leather_success","candycane_success","ornament_success","seashell_success","gemfragment_success"])) { render_interaction(response); }
			else if(in_arr(response,["donate_thx","donate_gum","donate_low"]))
			{
				var message;
				if(response=="donate_thx") message="Thanks kind sir. Thanks for helping the reserve.";
				else if(response=="donate_gum") message=to_pretty_num(data.gold)+"? "+to_pretty_num(data.gold)+"? "+to_pretty_num(data.gold)+"?! Here, take this!";
				else if(response=="donate_low") message="They say there's no small contribution.. BUT THEY ARE OBVIOUSLY WRONG. "+to_pretty_num(data.gold)+"??!!! GET LOST";
				ui_log("Donated "+to_pretty_num(data.gold)+" gold","gray");
				render_interaction({auto:true,skin:"goblin",message:message});
			}
			else if(response=="lostandfound_info")
			{
				var message="Hey there! I'm in charge of taking care of our gold reserve and making sure unlooted chests are 'recycled'! ",xp=3.2;
				if(data.gold<500000000) message+="Currently the gold reserves are low, so I'm taking a small something something out of every chest :] ",xp=4.8;
				else if(data.gold<1000000000) message+="Currently the gold reserves are low, so I'm taking a small something out of every chest :] ",xp=4;
				message+="Donations are always welcome, merchants get "+xp+" XP for every gold they donate!";
				render_interaction({auto:true,skin:"goblin",message:message,button:"WHAT HAVE YOU FOUND?",onclick:function(){socket.emit('lostandfound')},button2:"DONATE",onclick2:function(){render_donate()}});
			}
			else if(response=="lostandfound_donate")
			{
				var message="Not feeling like showing my loots to cheapskates! Sorry not sorry..";
				render_interaction({auto:true,skin:"goblin",message:message});
			}
			else if(response=="bet_xshot")
			{
				var message="Get lost critter! You can't gamble substanced here!";
				render_interaction({auto:true,skin:"bouncer",message:message});
				if(Math.random()<0.5) d_text("MOVE B****",get_npc('bouncer'),{color:"#F7A9C5"});
				else d_text("GET OUT THE WAY",get_npc('bouncer'),{color:"#F7A9C5"});
			}
			else if(response=="cant_escape")
			{
				d_text("CAN'T ESCAPE",character);
				transporting=false;
			}
			else if(response=="cant_enter")
			{
				ui_log("Can't enter","gray");
				transporting=false;
			}
			else if(response=="cant_in_bank")
			{
				ui_log("Operation unavailable in bank","gray");
			}
			else if(response=="bank_unavailable") ui_log("Bank unavailable","gray");
			else if(response=="bank_withdraw") ui_log("Withdrew "+to_pretty_num(data.gold)+" gold","gray");
			else if(response=="bank_store") ui_log("Stored "+to_pretty_num(data.gold)+" gold","gray");
			else if(response=="bank_new_pack")
			{
				if(data.gold) ui_log("Opened an account for "+to_pretty_num(data.gold)+" gold","gray");
				else ui_log("Opened an account for "+to_pretty_num(data.shells)+" shells","gray");
			}
			else if(response=="locked") ui_log("Locked","gray");
			else if(response=="seller_gone") ui_log("Seller gone","gray");
			else if(response=="buyer_gone") ui_log("Buyer gone","gray");
			else if(response=="item_gone") ui_log("Item gone","gray");
			else if(response=="hmm") ui_log("Hmm.","gray");
			else if(response=="sneaky") ui_log("Sneaky sneaky.","gray");
			else if(response=="need_auth") ui_log("To perform this action your account needs a game client authorization","gray");
			else if(response=="giveaway_join") ui_log(data.name+" joined your giveaway!","gray");
			else if(response=="bank_opi")
			{
				ui_log("Bank connection in progress","gray");
				transporting=false;
			}
			else if(response=="bank_opx")
			{
				if(data.name) ui_log(data.name+" is in the bank","gray");
				else if(data.reason=="locked") ui_log("The door is locked","gray");
				else ui_log("Bank is busy right now","gray");
				transporting=false;
			}
			else if(response=="only_in_bank")
			{
				ui_log("Only works inside the bank","gray");
			}
			else if(response=="already_unlocked")
			{
				ui_log("Already unlocked","gray");
			}
			else if(response=="door_unlocked")
			{
				v_shake();
				ui_log("Door unlocked!","#9D9CFF");
			}
			else if(response=="bank_pack_unlocked")
			{
				v_shake();
				ui_log("Teller unlocked!","#9D9CFF");
			}
			else if(response=="transport_failed")
			{
				transporting=false;
			}
			else if(response=="loot_failed")
			{
				close_chests();
				ui_log("Can't loot","gray");
			}
			else if(response=="no_space")
			{
				d_text("NO SPACE",character);
			}
			else if(response=="loot_no_space")
			{
				close_chests();
				d_text("NO SPACE",character);
			}
			else if(response=="transport_cant_reach")
			{
				ui_log("Can't reach","gray");
				transporting=false;
			}
			else if(response=="transport_cant_item")
			{
				ui_log("Item not found","gray");
				transporting=false;
			}
			else if(response=="transport_cant_dampened")
			{
				ui_log("Can't transport inside a dampening field","#A772D0");
				transporting=false;
				v_shake_i2(character);
			}
			else if(response=="transport_cant_protection")
			{
				ui_log("The door is protected!","#A7282E");
				transporting=false;
			}
			else if(response=="transport_cant_locked")
			{
				ui_log("The door is locked!","#A7282E");
				transporting=false;
			}
			else if(response=="not_in_this_server")
			{
				ui_log("Not possible in this server","#7D5B93");
			}
			else if(response=="destroyed")
			{
				ui_log("Destroyed "+G.items[data.name].name,"gray");
			}
			else if(response=="distance") ui_log("Get closer","gray");
			else if(response=="trade_bspace")
			{
				ui_log("No space on buyer","gray");
			}
			else if(response=="bank_restrictions")
			{
				ui_log("You can't buy, trade or upgrade in the bank.","gray");
			}
			else if(response=="tavern_too_late") ui_log("Too late to bet!","gray");
			else if(response=="tavern_not_yet") ui_log("Not taking bets yet!","gray");
			else if(response=="tavern_too_many_bets") ui_log("You have too many active bets","gray");
			else if(response=="tavern_dice_exist") ui_log("You already have a bet","gray");
			else if(response=="tavern_gold_not_enough") ui_log("Gold reserve insufficient to cover this bet","gray");
			else if(response=="condition")
			{
				var def=G.conditions[data.name],from=data.from;
				if(def.debuff)
				{
					ui_log("Afflicted by "+def.name,"gray");
				}
				else if(from)
				{
					ui_log(from+" buffed you with "+def.name,"gray");
				}
				else
				{
					ui_log("Buffed with "+def.name,"gray");
				}
			}
			else if(response=="cx_sent")
			{
				ui_log("Cosmetics sent: "+data.cx,"#DB7AA9");
				character.acx=data.acx;
			}
			else if(response=="cx_received")
			{
				ui_log("Cosmetics received: "+data.cx,"#A888DD");
				character.acx=data.acx;
			}
			else if(response=="cx_new")
			{
				if($("#topleftcornerdialog").length)
				{
					var html="";
					html+="<div style='padding: 16px; border: 5px solid gray; background: black; text-align: center; min-width: 60px'>";
						html+="<div style='margin-bottom: 8px; margin-top: 4px'>"+cx_sprite(data.name)+"</div>";
						html+="<div class='gamebutton' onclick='$(this).parent().remove()'>OK</div>";
					html+="</div>";
					$("#topleftcornerdialog").html(html);
				}
				else ui_log("Cosmetics: "+data.name,"#DB7AA9");
				character.acx=data.acx;
			}
			else if(response=="emotion_new")
			{
				ui_log("Emotion: "+data.name,"#DB7AA9");
				character.emx=data.emx;
			}
			else if(response=="cx_not_found")
			{
				ui_log("Cosmetics not found","gray");
			}
			else if(response=="ex_condition")
			{
				var def=G.conditions[data.name];
				// ui_log(def.name+" faded away ...","gray");
			}
			else if(response=="buy_success")
			{
				ui_log("Spent "+to_pretty_num(data.cost)+" gold","gray");
			}
			else if(response=="buy_cant_npc")
			{
				ui_log("Can't buy this from an NPC","gray");
			}
			else if(response=="buy_cant_space" || response=="cant_space")
			{
				d_text("SPACE",character);
				ui_log("No space","gray");
			}
			else if(response=="buy_cost")
			{
				d_text("INSUFFICIENT",character);
				ui_log("Not enough gold","gray");
			}
			else if(response=="emotion_cant")
			{
				d_text("NO",character);
			}
			else if(response=="emotion_cooldown")
			{
				d_text("WAIT",character);
			}
			else if(response=="cant_reach") ui_log("Can't reach","gray");
			else if(response=="no_item") ui_log("No item provided","gray");
			else if(response=="not_enough") ui_log("Not enough","gray");
			else if(response=="buyer_gold") ui_log("Not enough gold on buyer","gray");
			else if(response=="dont_have_enough") ui_log("Don't have enough","gray");
			else if(response=="op_unavailable") add_chat("","Operation unavailable","gray");
			else if(response=="send_no_space") add_chat("","No space on receiver","gray");
			else if(response=="send_no_item") add_chat("","Nothing to send","gray");
			else if(response=="send_no_cx") add_chat("","Don't have or not enough","gray");
			else if(response=="send_diff_owner") add_chat("","This is not one of ours!","gray");
			else if(response=="insufficient_q") ui_log("There aren't that many available","gray");
			else if(response=="signed_up") ui_log("Signed Up!","#39BB54");
			else if(response=="item_placeholder")
			{
				ui_log("Slot is occupied","gray");
			}
			else if(response=="item_locked")
			{
				ui_log("Item is locked","gray");
			}
			else if(response=="item_blocked")
			{
				ui_log("Item is in use","gray");
			}
			else if(response=="item_received" || response=="item_sent")
			{
				var additional="";
				if(data.q>1) additional="(x"+data.q+")";
				if(response=="item_received")
				{
					add_chat("","Received "+G.items[data.item].name+additional+" from "+data.name,"#6AB3FF");
					call_code_function("trigger_character_event","item_received",{name:data.item,q:data.q,num:data.num,'from':data.name});
				}
				else
				{
					add_chat("","Sent "+G.items[data.item].name+additional+" to "+data.name,"#6AB3FF");
					call_code_function("trigger_character_event","item_sent",{name:data.item,q:data.q,num:data.num,'to':data.name});
				}
			}
			else if(response=="add_item")
			{
				var additional="",prefix="a ";
				if(data.item.q>1) additional="(x"+data.item.q+")",prefix="";
				add_log("Received "+prefix+G.items[data.item.name].name+additional,"#3B9358");
			}
			else if(response=="gold_not_enough") ui_log("Not enough gold","gray");
			else if(response=="gold_sent")
			{
				add_chat("","Sent "+to_pretty_num(data.gold)+" gold to "+data.name,colors.gold);
				call_code_function("trigger_character_event","gold_sent",{amount:data.gold,'to':data.name});
			}
			else if(response=="gold_received" && !data.name) add_log("Received "+to_pretty_num(data.gold)+" gold","gray");
			else if(response=="gold_received")
			{
				add_chat("","Received "+to_pretty_num(data.gold)+" gold from "+data.name,colors.gold);
				call_code_function("trigger_character_event","gold_received",{amount:data.gold,'from':data.name});
			}
			else if(response=="friend_already") add_chat("","You are already friends","gray");
			else if(response=="friend_rleft") add_chat("","Player left the server","gray");
			else if(response=="friend_rsent") add_chat("","Friend request sent","#409BDD");
			else if(response=="friend_expired") add_chat("","Request expired","#409BDD");
			else if(response=="friend_failed") add_chat("","Friendship failed, reason: "+data.reason,"#409BDD");
			else if(response=="unfriend_failed") add_chat("","Unfriend failed, reason: "+data.reason,"#409BDD");
			else if(response=="gold_use") ui_log("Used "+to_pretty_num(data.gold)+" gold","gray");
			else if(response=="slots_success") ui_log("Machine went crazy","#9733FF");
			else if(response=="slots_fail") ui_log("Machine got stuck","gray");
			else if(response=="craft")
			{
				var def=G.craft[data.name];
				if(def.cost) ui_log("Spent "+to_pretty_num(def.cost)+" gold","gray");
				ui_log("Received "+G.items[data.name].name,"white");
			}
			else if(response=="dismantle")
			{
				var def=G.dismantle[data.name];
				if(data.level) ui_log("Spent "+to_pretty_num(data.cost||10000)+" gold","gray");
				else ui_log("Spent "+to_pretty_num(def.cost)+" gold","gray");
				ui_log("Dismantled "+G.items[data.name].name,"#CF5C65");
			}
			else if(response=="defeated_by_a_monster")
			{
				ui_log("Defeated by "+G.monsters[data.monster].name,"#571F1B");
				ui_log("Lost "+to_pretty_num(data.xp)+" experience","gray");
			}
			else if(response=="dismantle_cant") ui_log("Can't dismantle","gray");
			else if(response=="inv_size") ui_log("Need more empty space","gray");
			else if(response=="craft_cant") ui_log("Can't craft","gray");
			else if(response=="craft_cant_quantity") ui_log("Not enough materials","gray");
			else if(response=="craft_atleast2") ui_log("You need to provide at least 2 items","gray");
			else if(response=="target_lock")
			{
				ui_log("Target Acquired: "+G.monsters[data.monster].name,"#F00B22");
			}
			else if(response=="charm_failed")
			{
				ui_log("Couldn't charm ...","gray");
			}
			else if(response=="cooldown")
			{
				d_text("NOT READY",character);
			}
			else if(response=="blink_failed")
			{
				no_no_no();
				d_text("NO",character);
				last_blink_pressed=inception;
			}
			else if(response=="dash_failed")
			{
				no_no_no();
				d_text("CANT",character);
			}
			else if(response=="magiport_sent")
			{
				ui_log("Magiportation request sent to "+data.id,"white");
			}
			else if(response=="magiport_gone")
			{
				ui_log("Magiporter gone","gray");
				no_no_no(2);
			}
			else if(response=="magiport_failed") ui_log("Magiport failed","gray"),no_no_no(2);
			else if(response=="revive_failed") ui_log("Revival failed","gray"),no_no_no(1);
			else if(response=="locksmith_cant")
			{
				ui_log("Can't lock/unlock this item","gray")
			}
			else if(response=="locksmith_aunlocked")
			{
				ui_log("Already unlocked","gray")
			}
			else if(response=="locksmith_alocked")
			{
				ui_log("Already locked","gray")
			}
			else if(response=="locksmith_unsealed")
			{
				ui_log("Spent 250,000 gold","gray");
				ui_log("Unsealed the item","gray");
				ui_log("It can be unlocked in 2 days","gray")
			}
			else if(response=="locksmith_unsealing")
			{
				ui_log("It can be unlocked in "+parseInt(data.hours)+" hours","gray")
			}
			else if(response=="locksmith_unlocked")
			{
				ui_log("Spent 250,000 gold","gray");
				ui_log("Unlocked the item","gray");
			}
			else if(response=="locksmith_unseal_complete")
			{
				ui_log("Unlocked the item","gray");
			}
			else if(response=="locksmith_locked")
			{
				ui_log("Spent 250,000 gold","gray");
				ui_log("Locked the item","gray");
			}
			else if(response=="locksmith_sealed")
			{
				ui_log("Spent 250,000 gold","gray");
				ui_log("Sealed the item","gray");
			}
			else if(response=="monsterhunt_started" || response=="monsterhunt_already")
			{
				if(!character.s.monsterhunt) return;
				if(character.s.monsterhunt.c==1) $("#merchant-item").html(render_interaction({auto:true,skin:"daisy",message:"Alrighty then! Now go defeat "+G.monsters[character.s.monsterhunt.id].name+" and come back here!"},"return_html"));
				else $("#merchant-item").html(render_interaction({auto:true,skin:"daisy",message:"Alrighty then! Now go defeat "+character.s.monsterhunt.c+" "+G.monsters[character.s.monsterhunt.id].name+"'s and come back here!"},"return_html"));
			}
			else if(response=="monsterhunt_merchant")
			{
				$("#merchant-item").html(render_interaction({auto:true,skin:"daisy",message:"Huh? A merchant? On the hunt? Hahahahahahahaha ... Go sell cake or something ..."},"return_html"));
			}
			else
			{
				console.log("Missed game_response: "+response);
			}
		});
	});
	socket.on("gm",function(data){
		if(data.ids && data.action=="jump_list"){
			var buttons=[];
			hide_modal();
			data.ids.forEach(function(id){
				buttons.push({button:id,onclick:function(){socket.emit("gm",{action:"jump",id:id})}});
			});
			get_input({no_wrap:true,elements:buttons});
		}
		else if(data.action=="server_info")
		{
			show_json(data.info);
		}
	});
	socket.on("secondhands",function(data){
		secondhands=data;
		secondhands.reverse();
		if(topleft_npc!="secondhands") s_page=0;
		render_secondhands();
	});
	socket.on("lostandfound",function(data){
		lostandfound=data;
		lostandfound.reverse();
		if(topleft_npc!="lostandfound") l_page=0;
		render_secondhands("lostandfound");
	});
	socket.on("game_chat_log",function(data){
		draw_trigger(function(){
			if(is_string(data)) add_chat("",data)
			else add_chat("",data.message,data.color); // <- add_chat needs a different color logic
		});
	});
	socket.on('chat_log',function(data){ // <- bad naming [22/10/16]
		draw_trigger(function(){
			var entity=get_entity(data.id);
			if(data.id=="mainframe")
			{
				d_text(data.message,{real_x:0,real_y:-100,height:24},{size:SZ.chat,color:"#C7EFFF"});
				sfx("chat",0,-100);
			}
			else if(entity)
			{
				d_text(data.message,entity,{size:SZ.chat});
				sfx("chat",entity.real_x,entity.real_y);
			}
			else sfx("chat");
			add_chat(data.owner,data.message,data.color,is_number(data.id)&&data.id||undefined);
			call_code_function("trigger_event","chat",{from:data.owner,message:data.message});
		}); 
	});
	socket.on('emotion',function(data){
		draw_trigger(function(){
			var player=get_player(data.player);
			var emotion=data.name;
			if(emotion=="drop_egg")
			{
				if(player) map_animation(random_one(["egg0","egg1","egg2","egg3","egg4","egg5","egg6","egg7","egg8","goldenegg"]),{x:get_x(player),y:get_y(player)+1,target:{x:get_x(player),y:get_y(player)+5,height:0},item:true,fade:0.005,speed:0.01,limit:1,scale:0.5,filter:new PIXI.filters.OutlineFilter(0.5,hx("#ABA3BC"))});
				if(player) v_shake_i(player);
				setTimeout(function(){ sfx("drop_egg"); },30);
			}
			else if(player)
			{
				start_animation(player,emotion);
			}
		});
	});
	socket.on('ui',function(data){
		if(data.event) call_code_function("trigger_event",data.event===true&&data.type||data.event,data);
		if(data.cevent && data.name==character.name) call_code_function("trigger_character_event",data.cevent===true&&data.type||data.cevent,data);
		// show_json(data);
		draw_trigger(function(){
			if(in_arr(data.type,["+$","-$"]))
			{
				var npc=get_npc(data.npc),player=get_player(data.name);
				if(topleft_npc=="merchant" && merchant_id) npc=get_npc(merchant_id)||npc;
				if(data.type=="-$")
				{
					if(npc) d_text(data.type,npc,{color:colors.white_negative});
					if(player) d_text("+$",player,{color:colors.white_positive});
				}
				else
				{
					if(npc) d_text(data.type,npc,{color:colors.white_positive});
					if(player) d_text("-$",player,{color:colors.white_negative});
				}
			}
			else if(data.type=="+$p")
			{
				var npc=get_npc("secondhands"),player=get_player(data.name);
				if(npc) d_text("+$",npc,{color:"#7E65D3"}); //,start_animation(npc,"purple_success");
				if(player) d_text("-$",player,{color:"#7E65D3"});
				call_code_function("trigger_event","sbuy",{item:data.item,name:data.name});
			}
			else if(data.type=="+M")
			{
				var player=get_player(data.name);
				if(player) d_text("+M",player,{color:"#67D385"});
			}
			else if(data.type=="restore_mp")
			{
				var player=get_player(data.id);
				if(player) d_text("+"+data.amount+" MPX!",player,{color:"#6585D3",huge:true});
			}
			else if(data.type=="+$f")
			{
				var npc=get_npc("lostandfound"),player=get_player(data.name);
				if(npc) d_text("+$",npc,{color:"#7E65D3"}); //,start_animation(npc,"purple_success");
				if(player) d_text("-$",player,{color:"#7E65D3"});
				call_code_function("trigger_event","fbuy",{item:data.item,name:data.name});
			}
			else if(data.type=="+$$")
			{
				var seller=get_player(data.seller),buyer=get_player(data.buyer);
				if(seller) d_text(data.type,seller,{color:colors.white_positive});
				if(buyer) d_text("-$$",buyer,{color:colors.white_negative});
				call_code_function("trigger_event","trade",{seller:data.seller,buyer:data.buyer,item:data.item,num:data.num,slot:data.slot});
				if(seller.me) call_code_function("trigger_event","sale",{buyer:data.buyer,item:data.item,num:data.num,slot:data.slot});
			}
			else if(data.type=="gold_sent")
			{
				var sender=get_player(data.sender),receiver=get_player(data.receiver);
				if(sender && receiver) d_line(sender,receiver,{color:"gold"});
			}
			else if(data.type=="item_sent")
			{
				var sender=get_player(data.sender),receiver=get_player(data.receiver);
				if(sender && receiver) d_line(sender,receiver,{color:"item"});
			}
			else if(data.type=="cx_sent")
			{
				var sender=get_player(data.sender),receiver=get_player(data.receiver);
				if(sender && receiver) d_line(sender,receiver,{color:"cx"});
			}
			else if(data.type=="magiport")
			{
				var player=get_player(data.name);
				if(player)
				{
					d_text("M",player,{size:"huge",color:"#3E97AA"});
					jump_up();
				}
			}
			else if(data.type=="mlevel")
			{
				var m=get_entity(data.id);
				if(m) d_text(data.mult==-1&&"-1"||"+1",m,{color:"#9C76D3",size:"huge"});
			}
			else if(data.type=="disengage")
			{
				var m=get_entity(data.id);
				if(m) d_text("FFT..",m,{color:"#84A1D1"});
			}
			else if(data.type=="mheal")
			{
				var m=get_entity(data.id);
				if(m) d_text(data.heal,m,{color:colors.heal,size:"large"});
			}
			else if(data.type=="throw")
			{
				var sender=get_player(data.from),receiver=get_entity(data.to);
				if(sender && receiver) d_line(sender,receiver,{color:"#323232"});
			}
			else if(data.type=="energize")
			{
				var sender=get_player(data.from),receiver=get_player(data.to);
				if(sender && receiver) d_line(sender,receiver,{color:"mana"});
				if(receiver) start_animation(receiver,"block");
			}
			else if(data.type=="mluck")
			{
				var sender=get_player(data.from),receiver=get_player(data.to);
				if(sender && receiver) d_line(sender,receiver,{color:"mluck"});
				if(receiver) start_animation(receiver,"mluck");
			}
			else if(data.type=="rspeed")
			{
				var sender=get_player(data.from),receiver=get_player(data.to);
				if(sender && receiver) d_line(sender,receiver,{color:"#D4C392"});
				if(receiver) start_animation(receiver,"rspeed");
			}
			else if(data.type=="reflection")
			{
				var sender=get_player(data.from),receiver=get_player(data.to);
				if(sender && receiver) d_line(sender,receiver,{color:"#9488BF"});
			}
			else if(data.type=="alchemy")
			{
				var sender=get_player(data.name);
				if(sender)
				{
					map_animation("gold",{x:get_x(sender),y:get_y(sender)-36,target:{x:get_x(sender),y:get_y(sender)-90,height:0,fade:true}});
					start_animation(sender,"gold_anim");
					v_shake_i(sender);
				}
			}
			else if(data.type=="4fingers")
			{
				var sender=get_player(data.from),receiver=get_player(data.to);
				if(sender && receiver) d_line(sender,receiver,{color:"#6F62AE"});
				if(sender) mojo(sender);
			}
			else if(data.type=="mcourage")
			{
				var sender=get_player(data.name);
				if(sender) d_text("OMG!",sender,{size:"huge",color:"#B9A08C"});
			}
			else if(data.type=="mfrenzy")
			{
				var sender=get_player(data.name);
				if(sender) d_text("OMG!!",sender,{size:"huge",color:"#B9A08C"});
			}
			else if(data.type=="fishing_fail")
			{
				var sender=get_player(data.name);
				if(sender) v_shake_i2(sender);
				if(sender.me) add_log("Failed to fish","gray");
			}
			else if(data.type=="fishing_none")
			{
				add_log("Didn't catch anything","gray");
			}
			else if(data.type=="fishing_start")
			{
				var sender=get_player(data.name);
				if(sender)
				{
					v_shake_minor(sender);
					sender.a_direction=sender.direction=data.direction;
				}
			}
			else if(data.type=="mining_fail")
			{
				var sender=get_player(data.name);
				if(sender) v_shake_i2(sender);
				if(sender.me) add_log("Failed to mine","gray");
			}
			else if(data.type=="mining_none")
			{
				add_log("Didn't mine anything","gray");
			}
			else if(data.type=="mining_start")
			{
				var sender=get_player(data.name);
				if(sender)
				{
					v_shake_minor(sender);
					sender.a_direction=sender.direction=data.direction;
				}
			}
			else if(data.type=="poison_resist")
			{
				var target=get_entity(data.id);
				if(target) d_text("RESIST!",target,{color:"#68B84B"});
			}
			else if(data.type=="freeze_resist")
			{
				var target=get_entity(data.id);
				if(target) d_text("RESIST!",target,{color:"#66C1C8"});
			}
			else if(data.type=="fire_resist")
			{
				var target=get_entity(data.id);
				if(target) d_text("RESIST!",target,{color:"#B22F1A"});
			}
			else if(data.type=="stun_resist")
			{
				var target=get_entity(data.id);
				if(target) d_text("RESIST!",target,{color:"crit"});
			}
			else if(data.type=="huntersmark")
			{
				var sender=get_player(data.name);
				var target=get_entity(data.id);
				if(sender && target) d_line(sender,target,{color:"#730E0B"});
				if(target) d_text("X",target,{size:"huge",color:"#730E0B"});
			}
			else if(data.type=="agitate")
			{
				var attacker=get_entity(data.name);
				data.ids.forEach(function(id){
					var entity=entities[id]; if(!entity) return;
					start_emblem(entity,"rr1",{frames:20});
				});
				if(attacker) start_emblem(attacker,"rr1",{frames:10});
			}
			else if(data.type=="stomp")
			{
				var attacker=get_entity(data.name);
				data.ids.forEach(function(id){
					var entity=entities[id]; if(!entity) return;
					start_emblem(entity,"br1",{frames:30});
					if(1 || attacker!=character) v_shake_i(entity);
				});
				if(attacker) start_emblem(attacker,"br1",{frames:5});
				// if(character && get_entity(data.name) && distance(character,get_entity(data.name))<600) v_shake();
				if(attacker==character) v_dive();
				else if(attacker) v_dive_i(attacker);
			}
			else if(data.type=="scare")
			{
				var attacker=get_entity(data.name);
				data.ids.forEach(function(id){
					var entity=entities[id]; if(!entity) return;
					start_emblem(entity,"j1",{frames:5});
					v_shake_i2(entity);
				});
				if(attacker) d_text("BE GONE!",attacker,{size:"huge",color:"#ff5817"});
			}
			else if(data.type=="cleave")
			{
				var points=[],attacker=get_entity(data.name);
				data.ids.forEach(function(id){
					var entity=entities[id]||entities["DEAD"+id]; if(!entity) return;
					points.push({x:get_x(entity),y:get_y(entity)});
					if(attacker) disappearing_clone(attacker,{x:(get_x(entity)+get_x(attacker)*2)/3.0,y:(get_y(entity)+get_y(attacker)*2)/3.0,random:true})
				});
				if(attacker) points.push({x:get_x(attacker),y:get_y(attacker)}),flurry(attacker);
				cpoints=convexhull.makeHull(points);
				for(var i=0;i<cpoints.length;i++)
				{
					var j=(i+1)%cpoints.length;
					d_line(cpoints[i],cpoints[j],{color:"warrior"});
				}
			}
			else if(data.type=="shadowstrike")
			{
				var points=[],attacker=get_entity(data.name);;
				data.ids.forEach(function(id){
					var entity=entities[id]||entities["DEAD"+id];
					if(!entity) return;
					if(!attacker) return;
					disappearing_clone(attacker,{x:(get_x(entity)+get_x(attacker)*2)/3.0,y:(get_y(entity)+get_y(attacker)*2)/3.0,random:true,rcolor:true})
					disappearing_clone(attacker,{x:get_x(entity),y:get_y(entity),random:true,rcolor:true});
				});
			}
			else if(data.type=="track")
			{
				var attacker=get_entity(data.name);
				if(attacker)
				{
					start_emblem(attacker,"o1",{frames:5});
				}
			}
			else if(data.type=="slots")
			{
				if(map_machines.slots) map_machines.slots.spinning=future_s(3);
			}
			else if(data.type=="level_up")
			{
				var player=get_entity(data.name);
				if(player)
				{
					small_success(player);
					d_text("LEVEL UP!",player,{size:"huge",color:"#724A8F"});
					call_code_function("trigger_event","level_up",{name:player.name,level:player.level});
					if(player.me)
					{
						call_code_function("trigger_character_event","level_up",{level:player.level});
						sfx("level_up");
					}
				}
			}
			else if(data.type=="dampened")
			{
				var player=get_entity(data.name);
				if(player)
				{
					v_shake_i2(player);
					if(player.me)
					{
						add_log("Disrupted by a dampening field","#A772D0");
						delete character.fading_out;
						delete character.s.magiport;
						delete character.s.blink;
						stop_filter(character,"bloom");
						character.real_alpha=1;
						restore_dimensions(character);
					}
				}
			}
			else if(is_sdk)
				console.log("Unhandled 'ui': "+data.type);
		});
	});
	socket.on("tavern",function(data){
		if(data.event=="bet")
		{
			var player=get_entity(data.name);
			if(player) d_text("+B",player,{color:"#6E9BBE"});
			if(player && player.me)
			{
				dice_bet.active=true;
				on_dice_change();
			}
		}
		if(data.event=="info")
		{
			render_tavern_info(data);
		}
		if(data.event=="won")
		{
			var player=get_entity(data.name);
			if(player)
			{
				d_text("+B",player,{color:"green"});
				if(data.net>=100000000) confetti_shower(player,2);
				else if(data.net>=10000000) confetti_shower(player,1);
			}
			if(player && player.me)
			{
				dice_bet.active=false;
				on_dice_change();
				$(".diceb").css("border-color","green");
			}
		}
		if(data.event=="lost")
		{
			var player=get_entity(data.name);
			if(player)
			{
				d_text("-B",player,{color:"red"});
				if(data.gold>=10000000) assassin_smoke(player.real_x,player.real_y);
			}
			if(player && player.me)
			{
				dice_bet.active=false;
				on_dice_change();
				$(".diceb").css("border-color","red");
			}
		}
	});
	socket.on("dice",function(data){
		console.log(JSON.stringify(data));
		if(data.state=="roll")
			map_machines.dice.shuffling=true,map_machines.dice.num=undefined,delete map_machines.dice.lock_start,map_machines.dice.locked=0;
		if(data.state=="lock")
			map_machines.dice.num=data.num,map_machines.dice.lock_start=new Date();
		if(data.state=="bets")
			map_machines.dice.shuffling=false,map_machines.dice.seconds=0,map_machines.dice.count_start=new Date(),dice_bet.active=false,on_dice_change();
	});
	socket.on("upgrade",function(data){
		//show_json(data);
		draw_trigger(function(){
			if(data.type=="upgrade") assassin_smoke(G.maps.main.ref.u_mid[0],G.maps.main.ref.u_mid[1],"explode_up");
			else if(data.type=="compound") assassin_smoke(G.maps.main.ref.c_mid[0],G.maps.main.ref.c_mid[1],"explode_up");
			else if(data.type=="poof") assassin_smoke(G.maps.spookytown.ref.poof.x,G.maps.spookytown.ref.poof.y,"explode_up");
			map_npcs.forEach(function(npc){
				if(data.type=="exchange" && npc.role==data.type)
				{
					start_animation(npc,"exchange");
				}
				if(npc.role=="newupgrade" && (data.type=="upgrade" || data.type=="compound"))
				{
					if(data.success) start_animation(npc,"success");
					else start_animation(npc,"failure");
				}
				if(npc.role=="funtokens" && data.type=="funtokens")
				{
					start_animation(npc,"exchange");
				}
				if(npc.role=="pvptokens" && data.type=="pvptokens")
				{
					start_animation(npc,"exchange");
				}
				if(npc.role=="friendtokens" && data.type=="friendtokens")
				{
					start_animation(npc,"exchange");
				}
				if(npc.role=="monstertokens" && data.type=="monstertokens")
				{
					start_animation(npc,"exchange");
				}
			});
		});
	});
	socket.on('map_info',function(data){
		I=data;
		render_map();
	});
	socket.on('server_info',function(data){
		S=data;
		render_server();
	});
	socket.on('hardcore_info',function(data){
		S=data.E;
		if(data.achiever)
			add_chat("mainframe",data.achiever+" ranked on the rewards list!","#60B879");
		render_server();
	});
	socket.on("server_message",function(data){
		// console.log(data.message);
		draw_trigger(function(){
			add_chat("",data.message,data.color||"orange");
			if(data.log && character) add_log(data.message,data.color||"orange");
			if(data.type && data.item) call_code_function("trigger_event",data.type,{item:data.item,name:data.name});
		});
	});
	socket.on("notice",function(data){
		add_chat("SERVER",data.message,data.color||"orange");
	});
	socket.on("reloaded",function(data){
		add_chat("SERVER","Executed a live reload. (Optional) Refresh the game.","orange");
		if(data.change) add_chat("CHANGES",data.change,"#59CAFF");
		reload_data();
	});
	socket.on('chest_opened',function(data){
		tut("firstloot");
		call_code_function("trigger_character_event","loot",data);
		if(data.opener==character.name || data.gone) resolve_deferred("open_chest",data);
		draw_trigger(function(){
			if(chests[data.id])
			{
				var chest=chests[data.id],x=chest.x,y=chest.y;
				if(is_hidden())
				{
					destroy_sprite(chest);
					delete chests[data.id];
				}
				else
				{
					if(!chest.openning)
					{
						chest.openning=new Date();
						set_texture(chest,++chest.frame);
					}
					chest.to_delete=true;
					chest.alpha=0.8;
				}
				sfx("coins",x,y);
			}
			try{
				var chars=get_active_characters();
				for(var name in chars)
				{
					if(chars[name]=="code" || chars[name]=="active")
					{
						character_window_eval(name,"delete chests['"+data.id+"'];")
					}
				}
			}catch(e){console.log(e);}
		});
	});
	socket.on('cm',function(data){
		try{
			call_code_function("trigger_character_event","cm",{name:data.name,message:JSON.parse(data.message)});
		}catch(e){
			console.log(e);
		}
	});
	socket.on('pm',function(data){
		draw_trigger(function(){
			var entity=get_entity(data.id);
			if(entity)
			{
				d_text(data.message,entity,{size:SZ.chat,color:"#BA6B88"});
				sfx("chat",entity.real_x,entity.real_y);
			}
			else
			{
				sfx("chat");
			}
			var cid="pm"+(data.to||data.owner);
			add_pmchat(data.to||data.owner,data.owner,data.message,data.xserver);
			if(in_arr(cid,docked)) add_chat(data.owner,data.message,"#CD7879");
			call_code_function("trigger_character_event","pm",{from:data.owner,message:data.message});
		}); 
	});
	socket.on('partym',function(data){
		draw_trigger(function(){
			var entity=get_entity(data.id);
			if(entity)
			{
				d_text(data.message,entity,{size:SZ.chat,color:"#5B8DB0"});
				sfx("chat",entity.real_x,entity.real_y);
			}
			else
			{
				sfx("chat");
			}
			add_partychat(data.owner,data.message);
			if(in_arr("party",docked)) add_chat(data.owner,data.message,"#46A0C6");
			call_code_function("trigger_character_event","partym",{from:data.owner,message:data.message});
		}); 
	});
	socket.on('drop',function(data){
		draw_trigger(function(){ chest=add_chest(data); });
	});
	socket.on("reopen",function(data){
		reopen();
	})
	socket.on('code_eval',function(data){
		if(no_eval) return;
		var code=data.code||data||"";
		code_eval(code);
	});
	socket.on('simple_eval',function(data){
		if(no_eval) return;
		eval(data.code||data||"");
	});
	socket.on('eval',function(data){
		if(no_eval) return;
		smart_eval(data.code||data||"",data.args);
	});
	socket.on('player',function(data){
		// more draw_trigger's might be needed in the future [24/09/18]
		var hitchhikers=data.hitchhikers;
		delete data.hitchhikers;
		if(character) adopt_soft_properties(character,data),rip_logic();
		if(hitchhikers) hitchhikers.forEach(function(tuple){ original_onevent.apply(socket,[{"type":2,"nsp":"/","data":tuple}]); });
		if(data.reopen) draw_trigger(function(){ reopen(); }); // draw_trigger is new [24/09/18]
	});
	socket.on('q_data',function(data){character.q=data.q;character.items[data.num].p=data.p;})
	socket.on('end',function(data){});
	socket.on('disconnect',function(){ socket.destroy(); window.socket=null; disconnect(); });
	socket.on('disconnect_reason',function(reason){ window.disconnect_reason=reason; });
	socket.on('limitdcreport',function(data){
		window.rc_delay=16;
		data.calls['!']="You've made "+data.climit+" callcosts in 4 seconds. That's tooooo much. This is most probably because you are calling a function like 'move' consecutively. Some calls are also more expensive than others. If you are experiencing issues please email hello@adventure.land or ask for help in Discord/#code_beginner. Ps. You made "+to_pretty_num(data.total)+" calls in total.";
		show_json(data.calls);
	});
	socket.on('ccreport',function(data){
		call_code_function("trigger_event","ccreport",data);
	});
	socket.on('action',function(data){
		if(is_sdk) console.log(data);
		var attacker=get_entity(data.attacker);
		var target=get_entity(data.target),no_target=false;
		if(!attacker) return;
		if(!target) target={"x":data.x,"y":data.y,"map":attacker.map,"in":attacker["in"],height:0,width:0,m:data.m},no_target=true;

		direction_logic(attacker,target,"attack");
		attack_animation_logic(attacker,data.source);
		animate_weapon(attacker,target);

		var event_data={actor:data.attacker};
		for(var name in data)
			if(!in_arr(name,["attacker"]))
				event_data[name]=data[name];
		if(data.heal) event_data.heal=data.heal;
		else if(data.damage) event_data.damage=data.damage;

		call_code_function("trigger_event","action",event_data);
		if(target.me) call_code_function("trigger_character_event","incoming",event_data);

		var color="red";
		if(new_attacks)
		{
			if(G.projectiles[data.projectile] && G.projectiles[data.projectile].animation)
				map_animation(G.projectiles[data.projectile].animation,{x:get_x(attacker),y:get_y(attacker)-15,target:target,m:data.m,id:data.pid,filter:!G.projectiles[data.projectile].pure&&attacker&&attacker.filter_wglow});

			if(G.projectiles[data.projectile] && G.projectiles[data.projectile].ray)
				continuous_map_animation(G.projectiles[data.projectile].ray,attacker,target);
		}
		else
		{
			var owner=attacker,entity=target;
			if(data.heal!==undefined) d_line(owner,entity,{color:"heal"});
			else if(data.anim=="supershot") d_line(owner,entity,{color:"supershot"});
			else if(owner && !data.no_lines) d_line(owner,entity);
		}

	});
	socket.on('hit',function(data){
		var entity=get_entity(data.id);
		var owner=get_entity(data.hid);
		var color="red";

		if(map_animations[data.pid]) map_animations[data.pid].to_delete=true;

		var attack_data=clone(data); delete attack_data.id; delete attack_data.hid;
		attack_data.actor=data.hid; attack_data.target=data.id;
		if(data.stacked && entity && entity.me) call_code_function("trigger_character_event","stacked",{method:"attack",ids:data.stacked});
		if(data.mobbing && entity && entity.me) call_code_function("trigger_character_event","mobbing",{intensity:data.mobbing});
		if(data.heal!==undefined)
		{
			attack_data.heal=abs(data.heal);
			delete attack_data.damage;
		}
		if(owner && owner.me) call_code_function("trigger_character_event","target_hit",attack_data);
		if(entity && entity.me) call_code_function("trigger_character_event","hit",attack_data);
		call_code_function("trigger_event","hit",attack_data);

		draw_trigger(function(){
			var evade=false,offsets=0;
			if(entity && data.evade) sfx("whoosh",entity.real_x,entity.real_y);
			if(entity && data.reflect) sfx("reflect",entity.real_x,entity.real_y);
			if(data.reflect)
			{
				t=true;
				d_text("REFLECT!",entity,{color:"reflect",from:data.hid,size:"huge"});
			}
			if(data.evade)
			{
				evade=true;
				d_text("EVADE",entity,{color:"evade",size:"huge",from:data.hid});
			}
			if(data.miss)
			{
				evade=true;
				d_text("OOPS",entity,{color:"evade",size:"huge",from:data.hid});
			}
			if(data.avoid)
			{
				var c={x:data.x,y:data.y,map:data.map,'in':data['in'],height:14};
				// console.log(c);
				if(entity==character) c=character;
				evade=true;
				d_text("AVOID",c,{color:"evade",size:"huge",from:data.hid});
			}
			if(entity && data.goldsteal)
			{
				if(data.goldsteal>0)
				{
					d_text("-"+data.goldsteal,entity,{color:"gold",from:data.hid,y:-8});
					if(entity==character)
						add_log("You lost "+to_pretty_num(data.goldsteal)+" gold","#5D5246");
				}
				else
				{
					d_text("+"+(-data.goldsteal),entity,{color:"gold",from:data.hid,y:-8});
					if(entity==character)
						add_log("Received "+to_pretty_num(-data.goldsteal)+" gold, huh","#25B77D");
				}
			}
			if(entity && data.projectile && !evade && G.projectiles[data.projectile].hit_animation)
			{
				var anim=G.projectiles[data.projectile].hit_animation;
				if(G.animations[anim])
					start_animation(entity,anim);
			}
			if(entity && !evade)
				sfx("monster_hit",entity.real_x,entity.real_y);
			if(entity && data.projectile && !evade && G.projectiles[data.projectile].hit_text)
			{
				d_text(G.projectiles[data.projectile].hit_text[0],entity,
					{color:G.projectiles[data.projectile].hit_text[1],size:"huge",offset:-offsets*25-10});
				offsets+=1;
			}
			if(entity && data.projectile && !evade && G.projectiles[data.projectile].kill_text && (entity.dead || entity.hp<=0))
			{
				d_text(G.projectiles[data.projectile].kill_text[0],entity,
					{color:G.projectiles[data.projectile].kill_text[1],size:"huge",offset:-offsets*25-10});
				offsets+=1;
			}
			if(data.crit)
			{
				var disp="2X";
				if(data.crit>2.90) disp="3X";
				else if(data.crit>2.74) disp="2.75X";
				else if(data.crit>2.44) disp="2.5X";
				else if(data.crit>2.20) disp="2.25X";
				d_text(disp,entity,{color:"crit",size:"huge",from:data.hid,offset:-offsets*25-10});
				offsets+=1;
			}
			if(entity && owner && data.damage!==undefined && !evade) // added && owner [15/01/18]
			{
				if(data.dreturn) d_text("-"+data.dreturn,owner,{color:color});
				if(data.damage>0) d_text("-"+data.damage,entity,{color:color});
			}
			if(entity && data.heal!==undefined && !evade)
			{
				var y=0;
				if(data.source=="partyheal" || data.source=="selfheal") start_animation(entity,"party_heal"),y=16;
				d_text("+"+data.heal,entity,{color:colors.heal,y:y});
			}
		});
	});
	socket.on("disappearing_text",function(data){
		draw_trigger(function(){
			if(!data.args) data.args={};
			if(data.args.sz) data.args.size=data.args.sz;
			if(data.args.c) data.args.color=data.args.c;
			
			var entity=(data.id && get_entity(data.id));

			// if(data.message=="+50" && entity && entity.me) add_log("Regenerated 50 HP","gray");
			// if(data.message=="+100" && entity && entity.me) add_log("Regenerated 100 MP","gray");

			if(entity) d_text(data.message,entity,data.args);
			else d_text(data.message,data.x,data.y,data.args);
		});
	});
	socket.on('death',function(data){
		// unused now
		if(data.place) reject_deferred(data.place,{reason:data.reason||"not_found"});
		call_code_function("trigger_event","death",data);
		data.death=true;
		on_disappear(data);
	});
	socket.on("disappear",function(data){
		if(data.place) reject_deferred(data.place,{reason:data.reason||"not_found"});
		on_disappear(data);
	});
	socket.on('entities',function(data){
		if(data['in']!=current_in) return console.log("Disregarded stale 'entities' response");
		if(data['type']=="all") future_entities={players:{},monsters:{}}; // also on new_map_logic
		// console.log("Entities: "+data['in']);
		handle_entities(data);
	});
	socket.on('poke',function(data){
		draw_trigger(function(){ 
			var entity=get_entity(data.name);
			if(entity)
			{
				if(entity==character) add_log(data.who+" poked you","gray")
				if(data.level>=2) add_chat("",data.who+" poked "+data.name,"gray");
				bump_up(entity,data.level*2);
			}
		});
	});
	socket.on('test',function(data){ console.log(data.date); });
	socket.on('invite',function(data){
		draw_trigger(function(){ add_invite(data.name); });
		setTimeout(function(){ call_code_function("on_party_invite",data.name); },200);
	});
	socket.on('magiport',function(data){
		draw_trigger(function(){ add_magiport(data.name); });
		setTimeout(function(){ call_code_function("on_magiport",data.name); },200);
	});
	socket.on('request',function(data){
		draw_trigger(function(){ add_request(data.name); });
		setTimeout(function(){ call_code_function("on_party_request",data.name); },200);
	});
	socket.on('frequest',function(data){
		draw_trigger(function(){ add_frequest(data.name); });
		setTimeout(function(){ call_code_function("on_friend_request",data.name); },200);
	});
	socket.on('friend',function(data){
		draw_trigger(function(){
			if(data.event=="new")
			{
				add_chat("","You are now friends with "+data.name,"#409BDD");
				friends=data.friends;
			}
			if(data.event=="lost")
			{
				add_chat("","Lost a friend","#DB5E59"); // : "+data.name
				friends=data.friends;
			}
			if(data.event=="request")
			{
				add_frequest(data.name);
			}
			if(data.event=="update")
			{
				friends=data.friends;
			}
		});
	});
	socket.on('party_update',function(data){
		draw_trigger(function(){
			if(data.message)
			{
				if(data.leave) add_log(data.message,"#875045");
				else add_log(data.message,"#703987");
			}
			if(party_list.length==0 && (data.list||[]).length && !in_arr("party",cwindows)) open_chat_window("party");
			party_list=data.list||[];
			party=data.party||{};
			render_party();
		});
	});
	socket.on('blocker',function(data){
		if(data.type=="pvp")
		{
			if(data.allow)
			{
				add_chat("Ace","Be careful in there!","#62C358");
				draw_trigger(function(){
					var npc=get_npc("pvpblocker");
					if(npc)
					{
						map_npcs.splice(map_npcs.indexOf(get_npc("pvpblocker")),1);
						draw_timeout(fade_away(1,npc),30,1);
					}
				});
			}
			else
			{
				add_chat("Ace","I will leave when there are 6 adventurers around.","#C36348");
			}
		}
	});
	socket.on('tracker',function(data){
		tracker=data;
		render_tracker();
	})
	socket.on('trade_history',function(data){
		//h-> [event,name,item,price]
		var html="";
		data.forEach(function(h){
			var item=G.items[h[2].name].name,prefix="";
			if(h[2].level) item+=" +"+h[2].level;
			if(h[2].q) prefix+=""+h[2].q+"x ";
			if(h[0]=="buy")
			{
				html+="<div>- Bought "+prefix+"'"+item+"' from "+h[1]+" for "+to_pretty_num(h[3])+" gold</div>";
			}
			else if(h[0]=="giveaway")
			{
				html+="<div>- Gave away "+prefix+"'"+item+"' to "+h[1]+"</div>";
			}
			else
			{
				html+="<div>- Sold "+prefix+"'"+item+"' to "+h[1]+" for "+to_pretty_num(h[3])+" gold</div>";
			}
		});
		if(!data.length) add_log("No trade recorded yet.","gray");
		else show_modal(html);
	});
	socket.on("track",function(list){
		if(!list.length) return add_log("No echoes","gray");
		if(list.length==1) { add_log("One echo","gray"); add_log(parseInt(list[0].dist)+" clicks away","gray"); return; }
		var c="";
		add_log(list.length+" echoes","gray");
		list.forEach(function(e){
			if(!c) c=parseInt(e.dist);
			else c=c+","+parseInt(e.dist);
		});
		add_log(c+" clicks","gray");
	});
}

function npc_right_click(event){
	var npc=G.npcs[this.npc];
	sfx("npc",this.x,this.y);
	if(this.type=="character") npc=G.npcs[this.npc];
	last_npc_right_click=new Date();
	$("#topleftcornerdialog").html("");
	next_side_interaction=npc.side_interaction;
	if(!npc.color && current_map=="main") npc.color=colors.npc_white;
	if(this.role!="shrine" && this.role!="compound")
	{
		var says=npc.says||"Yes";
		if(is_array(says)) says=says[seed1()%says.length];
		if(says=="rbin") says=random_binary();
		d_text(says,this,{color:npc.color});
	}
	if(this.role=="secondhands")
	{
		socket.emit("secondhands");
	}
	if(this.role=="lostandfound")
	{
		socket.emit("lostandfound","info");
	}
	if(this.role=="blocker")
	{
		socket.emit("blocker",{type:"pvp"});
	}
	if(this.role=="merchant")
	{
		render_merchant(this);
		if(!inventory) render_inventory();
	}
	if(this.role=="premium")
	{
		render_merchant(this,1);
		if(!inventory) render_inventory();
	}
	if(this.role=="gold")
	{
		render_gold_npc();
		if(!inventory) render_inventory();
	}
	if(this.role=="items")
	{
		render_items_npc(this.pack);
	}
	if(this.role=="exchange")
	{
		render_exchange_shrine(1);
	}
	if(this.role=="events")
	{
		if(character.home!=server_region+server_identifier)
		{	
			render_interaction({auto:true,skin:"lionsuit",message:"This is not your home server. You are a resident of "+character.home+". Would you like to set this server as your home?",button:"Yes!",onclick:function(){ socket.emit('set_home'); push_deferred('set_home'); }});
		}
		else
		{
			render_interaction({auto:true,skin:"lionsuit",message:"This is your home server. Make sure to follow daily and nightly server events! Just click the time icon in the bottom left corner for the schedule!"})
		}
	}
	if(this.role=="mcollector")
	{
		render_recipes("mcollector");
		$("#recipe-item").html(render_interaction({auto:true,skin:"proft",message:"Always looking for new materials for a grand project of mine. Bring the materials you find to me, I will exchange them for items that are more useful to you."},"return_html"));
	}
	if(this.role=="witch")
	{
		render_recipes("witch");
		$("#recipe-item").html(render_interaction({auto:true,skin:"brewingwitch",message:"My child, bring me the materials I seek and I shall unlock unimaginable horrors for you!"},"return_html"));
	}
	if(this.role=="shrine")
	{
		render_upgrade_shrine(1);
	}
	if(this.role=="newupgrade")
	{
		render_interaction("newupgrade");
	}
	if(this.role=="locksmith")
	{
		render_interaction({auto:true,dialog:"locksmith",skin:"asoldier"});
	}
	if(this.role=="compound")
	{
		render_compound_shrine(1);
	}
	if(this.role=="transport")
	{
		render_transports_npc();
		if(0) show_transports();
	}
	if(this.role=="lottery")
	{
		render_interaction("lottery");
	}
	if(this.role=="jailer")
	{
		render_interaction("jailer");
	}
	if(this.role=="guard")
	{
		render_interaction("guard");
	}
	if(this.quest=="seashell")
	{
		render_interaction("seashells");
	}
	if(this.quest=="mistletoe")
	{
		render_interaction("mistletoe");
	}
	if(this.quest=="ornament")
	{
		render_interaction("ornaments");
	}
	if(this.quest=="leather")
	{
		render_interaction("leathers");
	}
	if(this.quest=="lostearring")
	{
		render_interaction("lostearring");
	}
	if(this.role=="santa")
	{
		render_interaction("santa");
	}
	if(this.role=="tavern")
	{
		render_interaction("tavern");
	}
	if(this.quest=="gemfragment")
	{
		render_interaction("gemfragments");
	}
	if(this.role=="standmerchant")
	{
		render_interaction("standmerchant");
	}
	if(this.role=="craftsman")
	{
		render_interaction("crafting");
	}
	if(this.role=="thesearch" && gameplay=="hardcore")
	{
		render_interaction("hardcoretp");
	}
	if(this.role=="shells")
	{
		render_interaction("buyshells");
	}
	if(this.role=="newyear_tree")
	{
		socket.emit("interaction",{type:"newyear_tree"});
	}
	if(this.role=="pvptokens")
	{
		render_token_exchange("pvptoken");
	}
	if(this.role=="friendtokens")
	{
		render_token_exchange("friendtoken");
	}
	if(this.role=="funtokens")
	{
		render_token_exchange("funtoken");
	}
	if(this.role=="cx")
	{
		render_exchange_shrine("cx");
	}
	if(this.role=="petkeeper")
	{
		render_pet_shrine();
	}
	if(this.role=="monstertokens")
	{
		render_token_exchange("monstertoken");
		if(!character.s.monsterhunt)
			$("#merchant-item").html(render_interaction({auto:true,skin:"daisy",message:"Would you like to go on a hunt? However, I have to warn you. It's not for the faint-hearted!"+(gameplay=="hardcore"&&" [100 TOKENS!]"||""),button:"I CAN HANDLE IT!",onclick:function(){socket.emit('monsterhunt'); push_deferred("monsterhunt")}},"return_html"));
		else if(character.s.monsterhunt.c)
			$("#merchant-item").html(render_interaction({auto:true,skin:"daisy",message:"Go now, go! Come back after you completed your hunt ..."},"return_html"));
		else
		{
			socket.emit('monsterhunt');
			push_deferred("monsterhunt")
			$("#merchant-item").html(render_interaction({auto:true,skin:"daisy",message:"Well done, well done! A token for your service!"},"return_html"));
		}
	}
	if(this.role=="announcer")
	{
		render_interaction({auto:true,skin:"lionsuit",message:"Daily Events? Yes. Soon. Hopefully ... Definitely one day."});
	}
	if(npc.interaction)
	{
		var message=npc.interaction;
		if(is_array(message)) message=message[seed0()%message.length];
		if(message=="rbin") message=random_binaries();
		render_interaction({auto:true,skin:this.skin,message:message});
	}
	if(this.stype=="full")
	{
		direction_logic(this,character,"npc");
		this.last_mdirection=new Date();
		setTimeout(function(e){
			return function(){
				if(mssince(e.last_mdirection)>220 && e.moving)
				{
					calculate_vxy(e);
					set_direction(e);
				}
			}
		}(this),240);
	}
	try{if(event) event.stopPropagation();}catch(e){};
}

function player_click(event)
{
	if(is_npc(this) && this.role=="daily_events") render_interaction("subscribe",this.party);
	if(is_npc(this) && this.npc=="pvp") player_right_click.apply(this,event);
	else if(this.npc_onclick) npc_right_click.apply(this,event);
	else
	{
		if(topleft_npc && inventory) render_inventory();
		topleft_npc=false;
		xtarget=this;
	}
	// socket.emit('click',{'type':'player','id':this.id,'button':'left'});
	event.stopPropagation();
}

function player_attack(event,code)
{
	ctarget=this; if(!code) xtarget=null;
	direction_logic(character,ctarget);
	if(event) event.stopPropagation();
	if(distance(this,character)>character.range+5)
	{
		draw_trigger(function(){ d_text("TOO FAR",ctarget||character); });
		return rejecting_promise({reason:"too_far",distance:distance(this,character)});
	}
	if(0 && !options.friendly_fire && (!character.team || character.team==ctarget.team) && (character.party && ctarget.party==character.party || character.guild && ctarget.guild==character.guild))
	{
		// let server decide [05/06/19]
		d_text("FRIENDLY",character);
		return rejecting_promise({reason:"friendly"});
	}
	socket.emit('attack',{id:ctarget.id});
	return push_deferred("attack");
}

function player_heal(event,code)
{
	if(this!=character)
	{
		ctarget=this; if(!code) xtarget=null;
	}
	if(this!=character) direction_logic(character,ctarget);
	if(event) event.stopPropagation();
	if(distance(this,character)>character.range)
	{
		if(this!=character) draw_trigger(function(){ d_text("TOO FAR",ctarget||character); });
		else draw_trigger(function(){ d_text("TOO FAR",character); });
		return rejecting_promise({reason:"too_far",distance:distance(this,character)});
	}
	socket.emit('heal',{id:this.id});
	return push_deferred("heal");
}

function monster_attack(event,code)
{
	ctarget=this; if(!code) xtarget=null;
	direction_logic(character,ctarget);
	if(event) event.stopPropagation();
	if(distance(this,character)>character.range+10)
	{
		draw_trigger(function(){ d_text("TOO FAR",ctarget||character); }); // Added +10 - otherwise seems unfair [17/06/18]
		return rejecting_promise({reason:"too_far",distance:distance(this,character)});
	}
	socket.emit('attack',{id:this.id});
	return push_deferred("attack");
}

function player_right_click(event) // always !me + set on player_rclick_logic
{
	//alert("here");
	if(this.npc && this.npc=="pvp")
	{
		if(this.allow)
		{
			var message="Be careful in there!";
			add_chat("Ace",message);
			d_text(message,this,{size:SZ.chat});
		}
		else
		{
			var message="I will guard this entrance until there are 6 adventurers around.";
			add_chat("Ace",message);
			d_text(message,this,{size:SZ.chat});
		}
	}
	else if(this.npc);
	else if(character.slots.mainhand && character.slots.mainhand.name=="cupid") // just attack now
	{
		player_attack.call(this);
	}
	else if(character.ctype=="priest")
	{
		if(!pvp || character.party && this.party==character.party) player_heal.call(this);
		else if(pvp) player_attack.call(this);
		else return;
	}
	else
	{
		if(!pvp || character.party && this.party==character.party) return;
		else if(pvp) player_attack.call(this);
		else return; // these are important, as event.stopPropagation() shouldn't be called
	}
	if(event) event.stopPropagation();
}

function monster_click(event)
{
	if(ctarget==this) map_click(event);
	ctarget=this; xtarget=null;
	// socket.emit('click',{'type':'monster','id':this.id,'button':'left',"x":this.x,"y":this.y});
	last_monster_click=new Date();
	if(event) event.stopPropagation();
}

function mouseover(event)
{
	mtarget=this;
}

function mouseout(event)
{
	mtarget=null;
}

function map_click(event)
{
	if(!socket || !character) return;
	var dx=0,dy=0;
	if(event && event.data && event.data.global)
	{
		var x=event.data.global.x,y=event.data.global.y;
		dx=x-width/2; dy=y-height/2;
		if(manual_centering && character) dx=x-character.x,dy=y-character.y;
		dx/=scale; dy/=scale;
		// if(log_flags.xy) console.log("dx,dy: "+round(dx)+","+round(dy));
		if(call_code_function("on_map_click",character.real_x+dx,character.real_y+dy)) return;
		if((blink_pressed || mssince(last_blink_pressed)<360) && character.ctype=="mage")
		{
			push_deferred("blink");
			socket.emit("skill",{name:"blink",x:character.real_x+dx,y:character.real_y+dy,direction:character.moving&&character.direction});
			return;
		}
	}
	else if(event.x) // Not used any more
	{
		dx=event.x-character.real_x;
		dy=event.y-character.real_y;
	}
	if(character && can_walk(character))
	{
		var move=calculate_move(character,character.real_x+dx,character.real_y+dy);
		character.from_x=character.real_x;
		character.from_y=character.real_y;
		character.going_x=move.x;
		character.going_y=move.y;
		character.moving=true;
		calculate_vxy(character);
		// if(log_flags.xy) add_log("going to x: "+map.going_x+" y: "+map.going_y+" speed vx: "+character.vx+" speed vy: "+character.vy);
		var data={x:character.real_x,y:character.real_y,going_x:character.going_x,going_y:character.going_y,m:character.m};
		if(next_minteraction) data.key=next_minteraction,next_minteraction=null;
		socket.emit("move",data);
	}
	if(!(topleft_npc=="dice" && current_map=="tavern"))
	{
		if(topleft_npc && inventory) render_inventory();
		topleft_npc=false;
	}
}

function ui_move(x,y)
{
	character.from_x=character.real_x;
	character.from_y=character.real_y;
	character.going_x=x;
	character.going_y=y;
	character.moving=true;
	calculate_vxy(character);
}

function old_move(x,y)
{
	map_click({x:x,y:y});
}

function map_click_release(){}

function update_sprite(sprite)
{
	if(!sprite || !sprite.stype) return;
	for(name in (sprite.animations||{})) update_sprite(sprite.animations[name]);
	for(name in (sprite.emblems||{})) update_sprite(sprite.emblems[name]);
	if(sprite.stype=="static") return;

	if(sprite.type=="monster" && sprite.charge_skin)
	{
		if(sprite.target && sprite.skin!=sprite.charge_skin) sprite.skin=sprite.charge_skin;
		if(!sprite.target && sprite.skin!=sprite.normal_skin) sprite.skin=sprite.normal_skin;
	}

	if(sprite.type=="character" || sprite.type=="monster" || sprite.type=="npc")
	{
		hp_bar_logic(sprite);
		if(border_mode) border_logic(sprite);
	}
	if(sprite.type=="character" || sprite.type=="npc")
	{
		name_logic(sprite);
	}
	if(sprite.type=="character")
	{
		player_rclick_logic(sprite);
		player_effects_logic(sprite);
	}
	if(sprite.type=="character" || sprite.type=="monster") effects_logic(sprite);

	if(is_demo) demo_entity_logic(sprite);
	
	if(sprite.stype=="full") // walk
	{
		
		var aa=false,i=1,j=0; var original=sprite.i;
		if(sprite.type=="monster" && G.monsters[sprite.mtype].aa) aa=true;

		if(sprite.npc && !sprite.moving && sprite.allow===true) sprite.direction=1;
		if(sprite.npc && !sprite.moving && sprite.allow===false) sprite.direction=0;
		if(sprite.orientation && !sprite.moving && !sprite.target) sprite.direction=sprite.orientation;

		if((sprite.moving || aa || sprite.fx && sprite.fx.aaa) && sprite.walking===null)
		{
			if(sprite.last_stop && msince(sprite.last_stop)<320) sprite.walking=sprite.last_walking;
			else reset_ms_check(sprite,"walk",350),sprite.walking=1;
		}
		else if(!(sprite.moving || aa || sprite.fx && sprite.fx.aaa) && sprite.walking)
		{
			sprite.last_stop=new Date();
			sprite.last_walking=sprite.walking||sprite.last_walking||1;
			sprite.walking=null;
		}

		var sequence=[0,1,2,1],base_ms=350;
		if(sprite.mtype=="wabbit") sequence=[0,1,2],base_ms=220;

		if(sprite.walking && ms_check(sprite,"walk",base_ms-((sprite.speed+(sprite.fx&&sprite.fx.aaa&&500||0))/2||0))) sprite.walking++; //sprite.updates%20==1
		// originally just 325, and [0,1,2] animation [13/03/17]

		// if(sprite.moving) set_direction(sprite); should be before stop_logic, for short moves - moved [17/11/16]

		if(sprite.direction!==undefined) j=sprite.direction;
		
		if(!aa && sprite.s && sprite.s.stunned) i=1;
		else if(sprite.walking) i=sequence[sprite.walking%sequence.length];
		else if(sprite.last_stop && mssince(sprite.last_stop)<(sprite.s&&sprite.s.dash&&5||180)) i=sequence[sprite.last_walking%sequence.length];

		if((sprite.type=="character" || sprite.humanoid) && (i===0 || i===2) && original!=i) sfx("walk",sprite.real_x,sprite.real_y);

		if(sprite.lock_i!==undefined) i=sprite.lock_i;

		if(sprite.stand && !sprite.standed)
		{
			var stand=new PIXI.Sprite(textures[sprite.stand+"_texture"]);
			stand.y=3; // also a manual "disp" at monster_layer
			stand.anchor.set(0.5,1);
			stand.zy=100;
			sprite.addChild(stand);
			sprite.standed=stand;
			sprite.speed=10;
		}
		else if(sprite.standed && !sprite.stand)
		{
			destroy_sprite(sprite.standed);
			delete sprite.standed;
		}

		if(sprite.rip && !sprite.rtexture)
		{
			sprite.cskin=null;
			sprite.rtexture=true;
			var gravestone="gravestone";
			if(sprite.rip!==true) gravestone=sprite.rip;
			if(!textures[gravestone]) generate_textures(gravestone,"gravestone");
			sprite.texture=textures[gravestone];
			restore_dimensions(sprite);
		}
		else if(!sprite.rip && sprite.rtexture)
		{
			delete sprite.rtexture;
			set_texture(sprite,i,j);
			restore_dimensions(sprite);
		}

		if(!sprite.rip)
		{
			//if(sprite.standed) i=1,j=0;
			set_texture(sprite,i,j);
		}

		if(sprite.s && (sprite.s.charging || sprite.s.dash) && ms_check(sprite,"clone",sprite.s.charging&&80||30))
		{
			if(sprite.s.dash) rshake_i_major(sprite);
			disappearing_clone(sprite); //!(sprite.updates%5)
		}

	}

	if((sprite.stype=="animation" || sprite.stype=="item") && sprite.atype=="map")
	{
		var target_x=get_x(sprite.target),target_y=get_y(sprite.target)-get_height(sprite.target)/2;
		if(sprite.m!=sprite.target.m) target_x=sprite.going_x,target_y=sprite.going_y;
		var ms=mssince(sprite.last_update);
		sprite.crotation=Math.atan2(target_y-sprite.y,target_x-sprite.x)+Math.PI/2;
		if(sprite.first_rotation===undefined)
		{
			sprite.first_rotation=sprite.crotation;
			if(sprite.directional) sprite.rotation=sprite.crotation;
		}
		if(sprite.directional && point_distance(target_x,target_y,sprite.x,sprite.y)>50)
		{
			sprite.rotation=sprite.crotation;
		}
		sprite.from_x=sprite.x; sprite.from_y=sprite.y;
		sprite.going_x=target_x; sprite.going_y=target_y;
		calculate_vxy(sprite);
		sprite.x=sprite.x+sprite.vx*ms/1000.0;
		sprite.y=sprite.y+sprite.vy*ms/1000.0;
		if(mssince(sprite.last_frame)>=sprite.framefps) sprite.frame+=1,sprite.last_frame=new Date();
		if(sprite.to_fade) sprite.alpha-=((sprite.to_fade!==true&&sprite.to_fade)||0.025)*ms/16.6;
		if(sprite.frame>=sprite.frames) sprite.frame=0;
		set_texture(sprite,sprite.frame);
		sprite.crotation=Math.atan2(target_y-sprite.y,target_x-sprite.x)+Math.PI/2;
		if(sprite.to_delete || point_distance(target_x,target_y,sprite.x,sprite.y)<(sprite.limit||16) || abs(sprite.first_rotation-sprite.crotation)>Math.PI/2)
		{
			destroy_sprite(sprite,"children");
			delete map_animations[sprite.id];
			return;
		}
		sprite.last_update=new Date();
	}
	else if(sprite.stype=="animation" && sprite.atype=="cmap")
	{
		var ms=mssince(sprite.last_update);
		sprite.ax=get_x(sprite.origin);
		sprite.ay=get_y(sprite.origin)-get_height(sprite.origin)/2;
		sprite.bx=get_x(sprite.target);
		sprite.by=get_y(sprite.target)-get_height(sprite.target)/2;
		sprite.x=sprite.ax/2+sprite.bx/2;
		sprite.y=sprite.ay/2+sprite.by/2;
		sprite.alpha-=0.025*ms/16.6;
		sprite.height=point_distance(sprite.ax,sprite.ay,sprite.bx,sprite.by);
		sprite.rotation=Math.atan2(sprite.by-sprite.ay,sprite.bx-sprite.ax)+Math.PI/2;
		if(sprite.alpha<=0)
		{
			destroy_sprite(sprite,"children");
			delete map_animations[sprite.id];
			return;
		}
		sprite.last_update=new Date();
	}
	else if(sprite.stype=="animation" && sprite.atype=="wmap") // map weather animation
	{
		var ms=mssince(sprite.last_update);
		sprite.y+=1;
		sprite.x+=0.1;
		if(ms>=sprite.interval)
		{
			sprite.texture=textures[sprite.skin][(++sprite.last)%textures[sprite.skin].length];
			sprite.last_update=new Date();
		}
		if(sprite.last>=textures[sprite.skin].length)
		{
			destroy_sprite(sprite,"children");
			delete map_animations[sprite.id];
			return;
		}
	}
	else if(sprite.stype=="animation" && sprite.atype=="xmap") // map high frame animation
	{
		var ms=mssince(sprite.last_update);
		if(ms>=sprite.interval)
		{
			sprite.texture=sprite.textures[(++sprite.last)%sprite.textures.length];
			sprite.last_update=new Date();
		}
	}
	else if(sprite.stype=="light" && sprite.atype=="xmap") // map high frame animation
	{
		var ms=mssince(sprite.last_update);
		if(ms>=sprite.interval)
		{
			sprite.texture=sprite.textures[(++sprite.last)%sprite.textures.length];
			sprite.last_update=new Date();
		}
	}
	else if(sprite.stype=="animation")
	{
		var steps=sprite.aspeed; // not used [15/08/16]
		if(sprite.speeding) sprite.aspeed-=0.003;
		if(ms_check(sprite,"anim"+sprite.skin,steps*16.5)) sprite.frame+=1; //sprite.updates%steps==1
		if(sprite.frame>=sprite.frames && sprite.continuous) sprite.frame=0
		else if(sprite.frame>=sprite.frames)
		{
			var parent=sprite.parent;
			if(parent)
			{
				// parent.removeChild(sprite); -- second major memory leak [19/08/16]
				destroy_sprite(sprite,"children");
				delete parent.animations[sprite.skin];
			}
			return;
		}
		set_texture(sprite,sprite.frame);
	}

	if(sprite.stype=="emblem")
	{
		if(!sprite.frames)
		{
			var parent=sprite.parent;
			if(parent)
			{
				destroy_sprite(sprite,"children");
				delete parent.emblems[sprite.skin];
			}
			return;
		}
		if(ms_check(sprite,"emblem"+sprite.skin,60)) sprite.frames-=1;
		sprite.alpha=sprite.frame_list[sprite.frames%sprite.frame_list.length];
	}

	if(sprite.stype=="emote")
	{
		var steps=(sprite.aspeed=="slow"&&17)||(sprite.aspeed=="slower"&&40)||10; // not used [15/08/16]
		if(sprite.atype=="flow")
		{
			if(ms_check(sprite,"anim",steps*16.5)) sprite.frame+=1;
			set_texture(sprite,[0,1,2,1][sprite.frame%4]);
		}
		else
		{
			if(ms_check(sprite,"anim",steps*16.5) && sprite.atype!="once") sprite.frame=(sprite.frame+1)%3; //sprite.updates%steps==1
			set_texture(sprite,sprite.frame);
		}
	}

	if(sprite.mtype && !(no_graphics || paused))
	{
		if(sprite.mtype=="dice")
		{
			if(sprite.shuffling)
			{
				var shake=false;
				if(!sprite.locked)
				{
					if(sprite.line) remove_sprite(sprite.line),delete sprite.line;
					sprite.line=draw_line(0,0,34,0,1,0x80E278);
					sprite.line.x=-17;
					sprite.line.y=-35.5;
					sprite.addChild(sprite.line);
				}
				for(var j=sprite.locked;j<4;j++)
				{
					if((sprite.updates%(j+1))) continue;
					i=3-j;
					var num=parseInt(Math.random()*10);
					if(sprite.lock_start && j==sprite.locked && mssince(sprite.lock_start)>(sprite.locked+1)*300)
					{
						if(i==0) num=sprite.num[0];
						else if(i==1) num=sprite.num[1];
						else if(i==2) num=sprite.num[3];
						else if(i==3) num=sprite.num[4];
						sprite.locked++;
						shake=true;
						sprite.cskin="2";
						sprite.texture=textures["dice"][sprite.cskin];
						if(sprite.line) remove_sprite(sprite.line),delete sprite.line;
						sprite.seconds=(4-sprite.locked)*7;
						sprite.line=draw_line(0,0,min(34,sprite.seconds*1.12),0,1,0x80E278);
						sprite.line.x=-17;
						sprite.line.y=-35.5;
						sprite.addChild(sprite.line);
						if(!sprite.seconds)
						{
							sprite.count_start=future_s(8);
							sprite.snum=sprite.num;
							sprite.shuffling=false;
						}
						sprite.cskin="5";
						sprite.texture=textures["dice"][sprite.cskin];
					}
					sprite.digits[i].texture=textures["dicesub"][num];
				}
				if(shake) v_shake_i_minor(sprite); // can't be used for entities
				if(!sprite.locked && sprite.shuffling && !(sprite.updates%40) || sprite.cskin!="0" && sprite.cskin!="1")
				{
					sprite.cskin=""+(parseInt(sprite.cskin)+1)%2;
					sprite.texture=textures["dice"][sprite.cskin];
				}
			}
			else if(sprite.num!=sprite.snum)
			{
				sprite.snum=sprite.num;
				for(var i=0;i<4;i++)
				{
					var num=0;
					if(i==0) num=sprite.num[0];
					else if(i==1) num=sprite.num[1];
					else if(i==2) num=sprite.num[3];
					else if(i==3) num=sprite.num[4];
					sprite.digits[i].texture=textures["dicesub"][parseInt(num)];
				}
			}
			else
			{
				sprite.seconds=min(30,max(0,mssince(sprite.count_start))/1000.0);
				if(sprite.line) remove_sprite(sprite.line),delete sprite.line;
				sprite.line=draw_line(0,0,sprite.seconds*1.14,0,1,0x80E278);
				sprite.line.x=-17;
				sprite.line.y=-35.5; // -10.5
				sprite.addChild(sprite.line);
				if(sprite.cskin!="5")
				{
					sprite.cskin="5";
					sprite.texture=textures["dice"][sprite.cskin];
				}
				if(0 && !(sprite.updates%20))
				{
					if(sprite.cskin=="3") sprite.cskin="4";
					else if(sprite.cskin=="4") sprite.cskin="5";
					else sprite.cskin="3";
					sprite.texture=textures["dice"][sprite.cskin];
				}
			}
		}

		if(sprite.mtype=="slots" || sprite.mtype=="wheel")
		{
			if(sprite.spinning)
			{
				if(!(sprite.updates%2))
				{
					sprite.cskin=""+(parseInt(sprite.cskin)+1)%3;
					sprite.texture=textures[sprite.mtype][sprite.cskin];
				}
				if(sprite.spinning<new Date()) sprite.spinning=false;
			}	
		}
	}

	if(sprite.type=="chest" && sprite.openning)
	{
		if(mssince(sprite.openning)>30 && sprite.frame!=3)
		{
			sprite.openning=new Date();
			set_texture(sprite,++sprite.frame);
			if(sprite.to_delete) sprite.alpha-=0.1;
		}
		else if(mssince(sprite.openning)>30 && sprite.to_delete && sprite.alpha>=0.5)
		{
			sprite.alpha-=0.1;
		}
		else if(sprite.alpha<0.5)
		{
			destroy_sprite(chests[sprite.id]);
			delete chests[sprite.id];
		}
	}

	if(sprite.type=="character" || sprite.slots || sprite.cx)
	{
		if(!sprite.cx) sprite.cx={};
		if(sprite.stype=="full") cosmetics_logic(sprite);
	}

	if(sprite.last_ms && sprite.s)
	{
		var ms=mssince(sprite.last_ms);
		["s","c","q"].forEach(function(stub){
			if(!sprite[stub]) return;
			for(var name in sprite[stub])
			{
				if(sprite[stub][name].ms)
				{
					sprite[stub][name].ms-=ms;
					if(sprite[stub][name].ms<=0)
					{
						delete sprite[stub][name];
						// if(stub=="q") reopen();
					}
				}
			}
		});
		sprite.last_ms=new Date();
	}

	if(sprite.real_alpha!==undefined) alpha_logic(sprite);

	update_filters(sprite);
	if(sprite.texts) step_d_texts(sprite);

	sprite.updates+=1; //round(frame_ms/15);
}

function add_monster(data)
{
	// console.log("add_monster "+data.type);
	var def=G.monsters[data.type],sprite=new_sprite(data.skin||def.skin||data.type,"full");
	sprite.type="monster";
	sprite.mtype=data.type;

	adopt_soft_properties(sprite,data);

	sprite.parentGroup=sprite.displayGroup=monster_layer;

	sprite.walking=null;
	sprite.animations={}; sprite.fx={};
	sprite.emblems={};
	sprite.move_num=data.move_num;
	sprite.c={}; // [09/03/17]
	sprite.real_alpha=1;
	sprite.x=sprite.real_x=round(data.x);
	sprite.y=sprite.real_y=round(data.y);
	sprite.vx=data.vx || 0;
	sprite.vy=data.vy || 0;
	if(def.slots) sprite.slots=def.slots;
	sprite.level=1;
	if(sprite.s.young) sprite.real_alpha=0.4;
	if(def.charge_skin)
	{
		sprite.normal_skin=sprite.skin;
		sprite.charge_skin=def.charge_skin;
		if(!textures[sprite.charge_skin]) generate_textures(sprite.charge_skin,"full");
	}
	sprite.last_ms=new Date();
	sprite.anchor.set(0.5,1);
	// sprite.speed=data.speed; [16/04/18]
	if(def.hit) sprite.hit=def.hit;
	if(def.size) sprite.height*=def.size,sprite.width*=def.size,sprite.mscale=def.size,sprite.hpbar_wdisp=-5;
	if(def.orientation) sprite.orientation=def.orientation;
	sprite.interactive=true;
	sprite.buttonMode=true;
	set_base(sprite);
	sprite.on('mousedown',monster_click).on('touchstart',monster_click).on('rightdown',monster_attack);
	sprite.on('mouseover',mouseover);
	sprite.on('mouseout',mouseout);
	if(0 && G.dimensions[data.type])
	{
		var actual=G.dimensions[data.type],anchor=sprite.anchor;
		sprite.hitArea=new PIXI.Rectangle(-actual[0]*anchor.x-2,-actual[1]*anchor.y-2,actual[0]+4,actual[1]+4);
		sprite.awidth=actual[0];
		sprite.aheight=actual[1];
	}
	return sprite;
}

function update_filters(sprite)
{
	if(no_graphics) return;
	if(sprite.pglow)
	{
		if(sprite.updates%3) return;

		var steps=[0.9,1.2,1.05];
		if(sprite.pzazz>50) steps=[1.7,1.9,1.7];
		else if(sprite.pzazz>40) steps=[1.5,1.6,1.5];
		else if(sprite.pzazz>25) steps=[1.4,1.5,1.42];
		else if(sprite.pzazz>13) steps=[1.3,1.4,1.275];
		else if(sprite.pzazz>6) steps=[1.2,1.3,1.075]

		var filter=sprite.filter_pglow;
		if(filter.b>steps[1]) filter.step=-abs(filter.step);
		if(filter.b<steps[0]) filter.step=abs(filter.step);
		filter.b+=filter.step;
		if(sprite.stand || sprite.s.charging || sprite.s.dash) filter.b=steps[2];
		filter.brightness(filter.b);
	}
	if(sprite.appearing)
	{
		sprite.real_alpha+=0.05;
		if(sprite.real_alpha>=1 || mssince(sprite.appearing)>900) // rogue logic
		{
			sprite.appearing=sprite.tp=false;
			sprite.real_alpha=1;
			if(sprite.s && sprite.s.invis) sprite.real_alpha=0.5;
			stop_animation(sprite,"transport");
		}
	}
	if(sprite.disappearing)
	{
		if(sprite.real_alpha>0.5) sprite.real_alpha-=0.0025;
	}
}

function start_filter(sprite,ftype,args)
{
	if(no_graphics) return;
	var filter=null;
	if(ftype=="darkgray")
	{
		filter=new PIXI.filters.OutlineFilter(3,0x5E615E);
	}
	else if(ftype=="fingered")
	{
		filter=new PIXI.filters.OutlineFilter(3,0x934FB2);
	}
	else if(ftype=="stoned")
	{
		filter=new PIXI.filters.ColorMatrixFilter();
		filter.greyscale(0.2);
	}
	else if(ftype=="orange")
	{
		filter=new PIXI.filters.AdjustmentFilter({red:1.5,blue:0,green:0.2,brightness:4});
	}
	else if(ftype=="blue")
	{
		filter=new PIXI.filters.AdjustmentFilter({red:0,blue:2,green:0.1,brightness:3,gamma:2});
	}
	else if(ftype=="green")
	{
		filter=new PIXI.filters.AdjustmentFilter({red:0.2,blue:0.2,green:1.5,brightness:2});
	}
	else if(ftype=="red")
	{
		filter=new PIXI.filters.AdjustmentFilter({red:2,blue:0,green:0,brightness:2});
	}
	else if(ftype=="yellow")
	{
		filter=new PIXI.filters.AdjustmentFilter({red:2,blue:0,green:0.5,brightness:2,gamma:2});
	}
	else if(ftype=="bloom")
	{
		filter=new PIXI.filters.BloomFilter(1,1,1);
	}
	else if(ftype=="cv")
	{
		filter=new PIXI.filters.ConvolutionFilter([0.3,0.02,0.1,0.1,0.1,0.02,0.02,0.2,0.02],30,40);
	}
	else if(ftype=="cv2")
	{
		// filter=new PIXI.filters.ConvolutionFilter([1,1,1,1,1,1,1,1,1],40,50);
		filter=new PIXI.filters.ConvolutionFilter([0.1,0.1,0.1,0.1,0.0,0.1,0.1,0.1,0.1],30,40);
	}
	else if(ftype=="rblur")
	{
		filter=new PIXI.filters.RadialBlurFilter(random_one([-0.75,-0.5,0.5,0.75]),[5,10],11,-1);
	}
	else if(ftype=="glow")
	{
		filter=new PIXI.filters.GlowFilter(8,4,0,0x598BFF);
	}
	else if(ftype=="alphaf")
	{
		filter=new PIXI.filters.AlphaFilter();
		filter.alpha=args||1;
	}
	else if(ftype=="rcolor")
	{
		filter=new PIXI.filters.ColorMatrixFilter();
		
		//filter.matrix=[Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random(),Math.random()];
		// filter.colorTone(5,5,"#7B1297","#D7BA36");
		
		// if(Math.random()<0.5) filter.brightness(Math.random(),true);
		// if(Math.random()<0.5) filter.saturate(Math.random(),true);
		// if(Math.random()<0.2) filter.desaturate();

		//if(Math.random()<0.5) filter.hue(parseInt(Math.random()*180),true);
		//else filter.hue(-parseInt(Math.random()*180),true);

		filter.desaturate();
	}
	else
	{
		filter=new PIXI.filters.ColorMatrixFilter();
		filter.step=0.01;
		filter.b=1;
	}

	if(ftype=="curse")
	{
		if(sprite.s && sprite.s.deepfreezed) filter.hue(36);
		else if(sprite.s && sprite.s.frozen) filter.hue(24);
		else if(sprite.s && sprite.s.poisoned) filter.hue(-24);
		else filter.hue(20);
	}
	else if(ftype=="xcolor")
	{
		filter.desaturate(2);
		filter.sepia(0.01);
	}
	else if(ftype=="darken")
	{
		filter.night();
	}
	else if(ftype=="bw")
	{
		filter.desaturate();
	}


	if(!sprite.filter_list) sprite.filter_list=[filter];
	else sprite.filter_list.push(filter);
	sprite.filters=sprite.filter_list;
	//filter.desaturate(2); filter.sepia(0.01); filter.brightness(b);
	sprite["filter_"+ftype]=filter;
}

function stop_filter(sprite,ftype)
{
	if(no_graphics) return;
	if(!sprite["filter_"+ftype]) return;
	sprite.filter_list.splice(sprite.filter_list.indexOf(sprite["filter_"+ftype]),1);
	// console.log(JSON.stringify(sprite.filter_list));
	if(!sprite.filter_list.length) sprite.filters=null;
	else sprite.filters=sprite.filter_list;
	// sprite["filter_"+ftype].destroy(); - no such method [30/03/18]
	delete sprite["filter_"+ftype];
	delete sprite[ftype];
}

function alpha_logic(sprite)
{
	if((!sprite.cx || !sprite.cx.length) && (!sprite.cxc || !Object.keys(sprite.cxc).length))
	{
		if(sprite.alpha!=sprite.real_alpha) sprite.alpha=sprite.real_alpha;
	}
	else
	{
		if(sprite.alpha!=1) sprite.alpha=1; // sometimes cosmetics logic doesn't execute beforehand, alpha gets set, then gets stuck at 0.5 - this fixes it [28/01/20]
		if(sprite.filter_alphaf)
		{
			if(sprite.real_alpha==1) stop_filter(sprite,"alphaf");
			else if(sprite.filter_alphaf.alpha!=sprite.real_alpha) sprite.filter_alphaf.alpha=sprite.real_alpha;
		}
		else if(sprite.real_alpha!=1)
		{
			start_filter(sprite,"alphaf",sprite.real_alpha);
		}
	}
}

function player_effects_logic(sprite)
{
	if(no_graphics || !sprite.s) return;
	if(sprite.pzazz>=4 && !sprite.filter_pglow) start_filter(sprite,"pglow");
	else if(sprite.pzazz<4 && sprite.filter_pglow) stop_filter(sprite,"pglow");

	if(sprite.s.invis && (!sprite.fx.invis || sprite.real_alpha!=0.5))
	{
		sprite.fx.invis=true;
		sprite.real_alpha=0.5;
	}
	else if(!sprite.s.invis && sprite.fx.invis)
	{
		delete sprite.fx.invis;
		sprite.real_alpha=1;
	}

	if(sprite.s.phasedout && !sprite.fx.phs)
	{
		sprite.fx.phs=true;
		sprite.real_alpha=0.8;
		start_filter(sprite,"xcolor");
		//start_emblem(sprite,"c1",{frames:1200,no_dip:true});
		//start_filter(sprite.emblems.c1,"darken");
		if(sprite.me && 0)
		{
			stage.cfilter_rblur=new PIXI.filters.RadialBlurFilter(random_one([-0.5,-0.25,0.25,0.5]),[width/2,height/2],3,-1);
			regather_filters(stage);
		}
	}
	else if(!sprite.s.phasedout && sprite.fx.phs)
	{
		sprite.real_alpha+=0.02;
		if(sprite.real_alpha>=1)
		{
			delete sprite.fx.phs;
			stop_filter(sprite,"xcolor");
		}
		//stop_emblem(sprite,"c1");
		if(sprite.me && 0)
		{
			delete stage.cfilter_rblur;
			regather_filters(stage);
		}
	}

	if(sprite.s.darkblessing && !sprite.fx.db)
	{
		sprite.fx.db=true;
		start_emblem(sprite,"dp1",{frames:1200,no_dip:false});
	}
	else if(!sprite.s.darkblessing && sprite.fx.db)
	{
		delete sprite.fx.db;
		stop_emblem(sprite,"dp1");
	}

	if(sprite.s.warcry && !sprite.fx.wcry)
	{
		sprite.fx.wcry=true;
		start_emblem(sprite,"r1",{frames:1200,no_dip:false});
	}
	else if(!sprite.s.warcry && sprite.fx.wcry)
	{
		delete sprite.fx.wcry;
		stop_emblem(sprite,"r1");
	}

	if(sprite.s.blink && !sprite.fading_out)
	{
		sprite.fading_out=new Date();
		sprite.real_alpha=1;
		draw_timeout(fade_out_blink(0,sprite),0);
	}

	if(sprite.c.revival && !sprite.fx.revival)
	{
		sprite.fx.revival=true;
		start_animation(sprite,"revival");
	}
	else if(!sprite.c.revival && sprite.fx.revival)
	{
		delete sprite.fx.revival;
		stop_animation(sprite,"revival");
		start_animation(sprite,"heal");
	}

	if(sprite.s.typing && !sprite.fx.typing)
	{
		sprite.fx.typing=true;
		start_animation(sprite,"typing");
	}
	else if(!sprite.s.typing && sprite.fx.typing)
	{
		delete sprite.fx.typing;
		stop_animation(sprite,"typing");
	}

	if(sprite.c.town && !sprite.disappearing)
	{
		sprite.disappearing=new Date();
		sprite.real_alpha=1;
		start_animation(sprite,"transport");
	}
	else if(!sprite.c.town && sprite.disappearing)
	{
		delete sprite.disappearing;
		sprite.real_alpha=1;
		stop_animation(sprite,"transport");
	}

	if(sprite.tp && !sprite.appearing) // sprite.tp===1 to limit to regular .tp
	{
		sprite.appearing=new Date();
		sprite.real_alpha=0.5;
		start_animation(sprite,"transport");
	}

	if(sprite.me && sprite.fear && (!sprite.last_fear || sprite.last_fear<sprite.fear))
	{
		if(character.fear>3) add_log("You are petrified","#B03736");
		else if(character.fear>1)  add_log("You are terrified","#B04157");
		else if(character.fear)  add_log("You are getting scared","gray");
	}
	if(sprite.me) sprite.last_fear=sprite.fear;
}

function effects_logic(sprite)
{
	if(no_graphics || !sprite.s) return;

	if(sprite.s && sprite.s.sleeping && !sprite.shaking)
	{
		if(Math.random()<0.1) d_text("zZz",sprite,{color:"white"});
		v_shake_i_minorX(sprite);
	}

	if((sprite.s.cursed || sprite.s.poisoned || sprite.s.frozen || sprite.s.deepfreezed) && !sprite.fx.cursed)
	{
		sprite.fx.cursed=true;
		start_filter(sprite,"curse");
		// start_animation(sprite,"cursed")
	}
	else if(!(sprite.s.cursed || sprite.s.poisoned || sprite.s.frozen || sprite.s.deepfreezed) && sprite.fx.cursed)
	{
		delete sprite.fx.cursed;
		stop_filter(sprite,"curse");
		// stop_animation(sprite,"cursed")
	}

	if(sprite.s.filter && !sprite["filter_"+sprite.s.filter.name])
	{
		if(sprite.s.filter.name!="scale") start_filter(sprite,sprite.s.filter.name);
		if(sprite.s.filter.scale) sprite.scale=new PIXI.Point(sprite.s.filter.scale,sprite.s.filter.scale),sprite.mscale=sprite.s.filter.scale;
	}

	if(sprite.s.fingered && !sprite.filter_fingered)
	{
		start_filter(sprite,"fingered");
	}
	else if(!sprite.s.fingered && sprite.filter_fingered)
	{
		stop_filter(sprite,"fingered");
	}

	if(sprite.s.stoned && !sprite.filter_stoned)
	{
		start_filter(sprite,"stoned");
	}
	else if(!sprite.s.stoned && sprite.filter_stoned)
	{
		stop_filter(sprite,"stoned");
	}

	if(sprite.s.stunned && !sprite.fx.stunned && !sprite.s.fingered)
	{
		sprite.fx.stunned=true;
		start_animation(sprite,"stunned","stun")
	}
	else if(!sprite.s.stunned && sprite.fx.stunned && !sprite.s.fingered)
	{
		delete sprite.fx.stunned;
		stop_animation(sprite,"stunned")
	}

	if(sprite.s.tangled && !sprite.fx.tangled)
	{
		sprite.fx.tangled=true;
		start_animation(sprite,"tangle")
	}
	else if(!sprite.s.tangled && sprite.fx.tangled)
	{
		delete sprite.fx.tangled;
		stop_animation(sprite,"tangle")
	}

	if(sprite.s.dampened && !sprite.fx.dampened)
	{
		sprite.fx.dampened=true;
		start_animation(sprite,"dampened")
	}
	else if(!sprite.s.dampened && sprite.fx.dampened)
	{
		delete sprite.fx.dampened;
		stop_animation(sprite,"dampened")
	}

	if(sprite.s.invincible && !sprite.fx.invincible)
	{
		var aname=sprite.role=="gm"&&"gm"||"invincible";
		sprite.fx.invincible=true;
		start_animation(sprite,aname);
		sprite.real_alpha=0.9;
	}
	else if(!sprite.s.invincible && sprite.fx.invincible)
	{
		var aname=sprite.role=="gm"&&"gm"||"invincible";
		delete sprite.fx.invincible;
		stop_animation(sprite,aname);
		sprite.real_alpha=1;
	}

	if(sprite.s.hardshell && !sprite.fx.hardshell)
	{
		sprite.fx.hardshell=true;
		start_animation(sprite,"hardshell")
	}
	else if(!sprite.s.hardshell && sprite.fx.hardshell)
	{
		delete sprite.fx.hardshell;
		stop_animation(sprite,"hardshell")
	}

	if(sprite.s.reflection && !sprite.fx.reflection)
	{
		sprite.fx.reflection=true;
		start_animation(sprite,"reflection")
	}
	else if(!sprite.s.reflection && sprite.fx.reflection)
	{
		delete sprite.fx.reflection;
		stop_animation(sprite,"reflection")
	}

	if(sprite.s.magiport && !sprite.fading_out)
	{
		sprite.fading_out=new Date();
		sprite.real_alpha=1;
		draw_timeout(fade_out_magiport(0,sprite),0);
		start_filter(sprite,"bloom");
	}

	if(sprite.type=="monster" && !Object.keys(sprite.fx).length && sprite.real_alpha<1 && !sprite.dead && !(sprite.appearing || sprite.disappearing || sprite.fading_out))
	{
		sprite.real_alpha=min(1,sprite.real_alpha+0.05);
	}

	if(sprite.c && sprite.c.pickpocket && !sprite.fx.attack) sprite.fx.attack=[new Date(),0];
	if(sprite.c && sprite.c.fishing && !sprite.fx.attack) sprite.fx.attack=[new Date(),0];
	if(sprite.c && sprite.c.mining && !sprite.fx.attack) sprite.fx.attack=[new Date(),0];
}

// .cx={head:"",hair:"",hat:"",body:"",face:"",upper:"", special:"",back:"",tail:"", stone:""}

function cosmetics_logic(sprite)
{
	// head tilt 0 px on default, 2px for "wizard"
	// improve "zy" logic with parent disp
	if(!sprite.cxc) sprite.cxc={};
	if(no_graphics) return;
	var needed=["bg"],body_type="full",cx_prop={},cxs=[sprite.skin];
	for(var n in sprite.cx) cxs.push(n);

	cxs.forEach(function(cid){
		if(G.cosmetics.prop[cid])
			G.cosmetics.prop[cid].forEach(function(p){
				cx_prop[p]=true;
			})
	});

	if(T[sprite.skin]=="armor") body_type="armor";
	else if(T[sprite.skin]=="body") body_type="body";
	else if(T[sprite.skin]=="character") body_type="character";

	if(sprite.slots && sprite.slots.helmet && sprite.slots.helmet.name.startsWith("ghat"))
	{
		var found=false;
		for(var slot in sprite.slots) if(sprite.slots[slot] && sprite.slots[slot].giveaway) found=true;
		if(found) sprite.cx.hat=G.items[sprite.slots.helmet.name].hat;
	}

	if(sprite.rip)
	{
		if(sprite.cx.hat) needed.push(sprite.cx.hat);
	}
	else
	{
		needed.push(sprite.skin+"copy");
		if(body_type!="full" && !sprite.cx.head) sprite.cx.head="makeup117";
		for(var place in sprite.cx)
		{
			var cid=sprite.cx[place];
			if(!cid || ["stone"].includes(place)) continue;
			if(place=="hair" && cx_prop.no_hair) continue;
			if(body_type=="full" && in_arr(place,["head","hair"])) continue;
			if(body_type=="character" && in_arr(place,["head","hair"])) continue;
			if(place=="upper" && (body_type=="full" || SSU[cid]!=SSU[sprite.skin])) continue;
			if(body_type=="armor" && place=="head")
				needed.push({
					"small":G.cosmetics.head[cid]&&G.cosmetics.head[cid][0]||"sskin1a",
					"normal":G.cosmetics.head[cid]&&G.cosmetics.head[cid][1]||"mskin1a",
					"tall":G.cosmetics.head[cid]&&G.cosmetics.head[cid][1]||"mskin1a",
					"large":G.cosmetics.head[cid]&&G.cosmetics.head[cid][2]||"lskin1a"}[SS[sprite.skin]]);
			needed.push(cid);
		}
		if(new_attacks && sprite.slots && sprite.slots.mainhand && G.items[sprite.slots.mainhand.name] && G.items[sprite.slots.mainhand.name].type=="weapon" && G.positions[G.items[sprite.slots.mainhand.name].skin_c||G.items[sprite.slots.mainhand.name].skin])
		{
			needed.push("weapon"+sprite.slots.mainhand.name);
		}
		if(new_attacks && sprite.slots && sprite.slots.mainhand && G.items[sprite.slots.mainhand.name] && G.items[sprite.slots.mainhand.name].type=="tool" && G.positions[G.items[sprite.slots.mainhand.name].skin_c||G.items[sprite.slots.mainhand.name].skin])
		{
			needed.push("weapon"+sprite.slots.mainhand.name);
		}
		if(new_attacks && sprite.slots && sprite.slots.offhand && G.items[sprite.slots.offhand.name] && (0||G.items[sprite.slots.offhand.name].type=="weapon") && G.positions[G.items[sprite.slots.offhand.name].skin_c||G.items[sprite.slots.offhand.name].skin])
		{
			needed.push("weap2n"+sprite.slots.offhand.name);
		}
	}
	
	for(var cid in sprite.cxc)
		if(!in_arr(cid,needed))
		{
			destroy_sprite(sprite.cxc[cid]);
			delete sprite.cxc[cid];
		}

	var x_disp=head_x;
	var head_dy={"large":2,"tall":1,"normal":0,"small":-1,"xsmall":-3,"xxsmall":-4}[SS[sprite.skin]];
	var head_dh=G.cosmetics.head[sprite.cx.head]&&G.cosmetics.head[sprite.cx.head][3]||0;
	var hair_dy=G.cosmetics.hair[sprite.cx.hair]&&G.cosmetics.hair[sprite.cx.hair][0]||0; hair_dy+=head_dh;
	var hair_dh=G.cosmetics.hair[sprite.cx.hair]&&G.cosmetics.hair[sprite.cx.hair][1]||0;
	var hat_dy=G.cosmetics.hat[sprite.cx.hat]||0; hat_dy+=head_dh;
	if(!(sprite.texture.width%2)) // old sprites have 26px width instead of 27px, they are not centered [25/09/18]
	{
		if(sprite.standed) sprite.standed.x=0;
		x_disp-=0.5;
	}
	else
	{
		if(sprite.standed) sprite.standed.x=0.5;
	}

	if(sprite.rip)
	{
		var g_height=G.cosmetics.gravestone[sprite.cx.gravestone||"gravestone"]||19;
		head_dy=g_height-23;
		hair_dy=0;
	}

	needed.forEach(function(cid){
		var c=sprite.cxc[cid];
		if(!sprite.cxc[cid])
		{
			if(sprite.rip && T[cid]!="hat" && T[cid]!="a_hat") return;
			if(cid==sprite.skin+"copy")
			{
				c=new PIXI.Sprite(sprite.texture);
				c.anchor.set(0.5,1);
				c.stype="copy";
				c.skin=sprite.skin;
				sprite.addChild(c);
				sprite.cxc[cid]=c;
				//c.filters=[new PIXI.filters.ColorReplaceFilter(0xf0f5c2,0x8d8476,0.2)];
			}
			else if(cid=="bg")
			{
				c=new PIXI.Sprite();
				c.anchor.set(0.5,1);
				c.stype="bg";
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(["hat","hair","head","face","makeup","beard","a_makeup","a_hat"].includes(T[cid]))
			{
				c=new_sprite(cid,T[cid]);
				c.anchor.set(0.5,1);
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(T[cid]=="armor") // for "upper"
			{
				c=new_sprite(cid,"upper");
				c.anchor.set(0.5,1);
				c.y=-8; // maybe 9 for "large" ones
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(T[cid]=="skin")
			{
				c=new_sprite(cid,T[cid]);
				c.anchor.set(0.5,1);
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(T[cid]=="wings")
			{
				c=new_sprite(cid,"wings");
				c.anchor.set(0.5,1);
				c.x=-5;
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(T[cid]=="s_wings")
			{
				c=new_sprite(cid,"s_wings");
				c.anchor.set(0.5,1);
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(T[cid]=="tail")
			{
				c=new_sprite(cid,"tail");
				c.anchor.set(0.5,1);
				c.y=0;
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(cid.startsWith("wea"))
			{
				var wname=cid.substr(6,99),wcx=G.items[wname].cx||{},item=sprite.slots.mainhand,main=true;
				if(cid[4]=="2") item=sprite.slots.offhand,main=false;
				var gr=calculate_item_grade(G.items[wname]);
				c=new_sprite(wname,"item");
				c.anchor.set(0.5,1);
				c.y=-4;
				c.x=-5+x_disp;
				if(cid[4]=="2") c.x=5+x_disp,c.scale.set(-1,1);

				var bcolor=0x444444,bsize=0;
				if(wcx.lightborder) bcolor=0x666666,bsize=1;
				if(wcx.border) bsize=wcx.border;

				var glow_distance=8+(min(item.level,13)+[1,1.5,2,2,2][gr]-10)*3;
				var glow_strength=4+(min(item.level,13)+[1.5,1.75,2,2,2][gr]-10)*2;

				if(item.level+gr>=10)
				{
					var glow_filter=new PIXI.filters.GlowFilter(glow_distance,glow_strength,0,hx(wcx.accent||"#DBDBBF",0.05)) // "#DAC7CF"
					c.filters=[glow_filter];
					// if(item.level+gr>=11) c.filterArea = new PIXI.Rectangle(-4000, -4000, 4000, 4000);
					if(main) sprite.filter_wglow=glow_filter;
				}
				else if(wcx.scale==0.5) c.filters=[new PIXI.filters.OutlineFilter(bsize||2,bcolor)]; // ,new PIXI.filters.PixelateFilter(2,2)
				else if(wcx.scale==0.75) c.filters=[new PIXI.filters.OutlineFilter(bsize||2,bcolor)];
				else c.filters=[new PIXI.filters.OutlineFilter(bsize||2,bcolor)];

				// character.cxc.weaponoozingterror.filters=[new PIXI.filters.GlowFilter(10,12,0,hx("#312345",0.05))] #6A49DD #582A08

				c.zy=100;
				sprite.addChild(c);
				sprite.cxc[cid]=c;
			}
			else if(T[cid]=="gravestone"){
				return;
			}
			else /*if(!T[cid])*/
			{
				console.log("Invalid cosmetics: "+cid);
				return;
			}
		}
		if(c.stype=="copy")
		{
			//c.texture=sprite.texture;
			if(sprite.j!==undefined) c.texture=textures[sprite.skin][sprite.i][sprite.j]; // for _clone
			c.zy=0;
		}
		else if(c.stype=="bg")
		{
			c.zy=-100*ZEPS;
		}
		else if(c.stype=="head")
		{
			var covers=G.cosmetics.prop[sprite.skin]&&G.cosmetics.prop[sprite.skin].includes("covers");
			c.y_disp=-(G.cosmetics.default_head_place+head_dy)+head_y;
			c.zy=ZEPS;
			var tilt=0;
			if(sprite.i==0) c.y=c.y_disp+1;
			else if(sprite.i==1) c.y=c.y_disp;
			else if(sprite.i==2) c.y=c.y_disp+1;
			if(sprite.j==0) c.x=0+x_disp;
			else if(sprite.j==1) c.x=-tilt+x_disp; //,c.zy=-2*ZEPS; // new
			else if(sprite.j==2) c.x=+tilt+x_disp; //,c.zy=-2*ZEPS; // new
			else if(sprite.j==3) c.x=0+x_disp,c.zy=-ZEPS;
			if(sprite.j<3 && covers) c.zy=-2*ZEPS;
			if(sprite.j!==undefined) set_texture(c,sprite.j);
			c.moved=false;

		}
		else if(c.stype=="hair")
		{
			c.y_disp=-(G.cosmetics.default_hair_place+head_dy+hair_dy)+head_y;
			var tilt=0;
			c.zy=2*ZEPS;
			if(sprite.i==0) c.y=c.y_disp+1;
			else if(sprite.i==1) c.y=c.y_disp;
			else if(sprite.i==2) c.y=c.y_disp+1;
			if(sprite.j==0) c.x=0+x_disp;
			else if(sprite.j==1) c.x=-tilt+x_disp; //,c.zy=-1.95*ZEPS;
			else if(sprite.j==2) c.x=+tilt+x_disp; //,c.zy=-1.95*ZEPS;
			else if(sprite.j==3) c.x=0+x_disp;
			if(sprite.j!==undefined) set_texture(c,sprite.j);
			c.moved=false;
		}
		else if(c.stype=="hat" || c.stype=="a_hat")
		{
			c.y_disp=-(G.cosmetics.default_hat_place+head_dy+hair_dh+hat_dy)+head_y;
			var tilt=0;
			c.zy=3*ZEPS;
			if(sprite.i==0) c.y=c.y_disp+1;
			else if(sprite.i==1) c.y=c.y_disp;
			else if(sprite.i==2) c.y=c.y_disp+1;
			if(sprite.j==0) c.x=0+x_disp;
			else if(sprite.j==1) c.x=-tilt+x_disp;
			else if(sprite.j==2) c.x=+tilt+x_disp;
			else if(sprite.j==3) c.x=0+x_disp;
			if(sprite.j!==undefined) set_texture(c,sprite.j,sprite.i);
			c.moved=false;
		}
		else if(c.stype=="face")
		{
			c.y_disp=-(G.cosmetics.default_head_place+head_dy+G.cosmetics.default_face_position)+head_y;
			c.y=c.y_disp;
			var tilt=0;
			c.zy=2.5*ZEPS;
			if(sprite.i==0) c.y=c.y_disp+1;
			else if(sprite.i==1) c.y=c.y_disp;
			else if(sprite.i==2) c.y=c.y_disp+1;
			if(sprite.j==0) c.x=0+x_disp;
			else if(sprite.j==1) c.x=-tilt+x_disp;
			else if(sprite.j==2) c.x=+tilt+x_disp;
			else if(sprite.j==3) c.x=0+x_disp;
			if(sprite.j!==undefined) set_texture(c,sprite.j);
			c.moved=false;
		}
		else if(c.stype=="beard" || c.stype=="makeup" || c.stype=="a_makeup")
		{
			c.y_disp=-(G.cosmetics.default_head_place+head_dy+G.cosmetics.default_beard_position)+head_y;
			c.y=c.y_disp;
			var tilt=0;
			c.zy=3.5*ZEPS;
			if(sprite.i==0) c.y=c.y_disp+1;
			else if(sprite.i==1) c.y=c.y_disp;
			else if(sprite.i==2) c.y=c.y_disp+1;
			if(sprite.j==0) c.x=0+x_disp;
			else if(sprite.j==1) { c.x=-tilt+x_disp; if(0 && sprite.i==2) c.zy=-1.9*ZEPS; }
			else if(sprite.j==2) { c.x=+tilt+x_disp; if(0 && sprite.i==0) c.zy=-1.9*ZEPS; }
			else if(sprite.j==3) c.x=0+x_disp;
			// if(sprite.j==1 && sprite.i==2 || sprite.j==2 && sprite.i==0)
			// {
			// 	if(!c.texture.frame.oheight) c.texture.frame.oheight=c.texture.frame.height;
			// 	c.texture.frame.height=c.texture.frame.oheight-6;
			// 	c.texture._updateUvs();
			// 	c.y-=6;
			// }
			// else
			// {
			// 	if(!c.texture.frame.oheight) c.texture.frame.oheight=c.texture.frame.height;
			// 	c.texture.frame.height=c.texture.frame.oheight;
			// 	c.texture._updateUvs();
			// }
			if(sprite.j!==undefined) set_texture(c,sprite.j,parseInt(sprite.updates/4));
			c.moved=false;
		}
		else if(c.stype=="skin")
		{
			if(sprite.j==0) c.zy=-ZEPS;
			else if(sprite.j==1) c.zy=-ZEPS;
			else if(sprite.j==2) c.zy=-ZEPS;
			else if(sprite.j==3) c.zy=-ZEPS;
			if(sprite.j!==undefined) set_texture(c,sprite.i,sprite.j);
		}
		else if(c.stype=="armor") // for old "upper"
		{
			if(!c.texture.frame.p)
			{
				c.texture.frame.p=true;
				c.texture.frame.height-=8;
				c.texture._updateUvs();
				c.y=-8;
			}
			if(sprite.j==0) c.zy=2*ZEPS;
			else if(sprite.j==1) c.zy=2*ZEPS;
			else if(sprite.j==2) c.zy=2*ZEPS;
			else if(sprite.j==3) c.zy=2*ZEPS;
			if(sprite.j!==undefined) set_texture(c,sprite.i,sprite.j);
		}
		else if(c.stype=="upper")
		{
			if(sprite.j==0) c.zy=2*ZEPS;
			else if(sprite.j==1) c.zy=2*ZEPS;
			else if(sprite.j==2) c.zy=2*ZEPS;
			else if(sprite.j==3) c.zy=2*ZEPS;
			if(sprite.j!==undefined) set_texture(c,sprite.i,sprite.j);
		}
		else if(c.stype=="wings")
		{
			if(sprite.j==0) c.zy=-6*ZEPS,c.x=-2.5+x_disp;
			else if(sprite.j==1) c.zy=-6*ZEPS,c.x=5+x_disp;
			else if(sprite.j==2) c.zy=-6*ZEPS,c.x=-9+x_disp;
			else if(sprite.j==3) c.zy=6*ZEPS,c.x=-5+x_disp;
			if(sprite.j!==undefined) set_texture(c,sprite.i,sprite.j);
		}
		else if(c.stype=="s_wings")
		{
			c.y_disp=0;
			if(sprite.i==0) c.y=c.y_disp+1,c.x=x_disp-1;
			else if(sprite.i==1) c.y=c.y_disp,c.x=x_disp;
			else if(sprite.i==2) c.y=c.y_disp+1,c.x=x_disp+1;

			if(sprite.j==0) c.zy=-6*ZEPS;
			else if(sprite.j==1) c.zy=-6*ZEPS,c.x+=3;
			else if(sprite.j==2) c.zy=-6*ZEPS,c.x-=3;
			else if(sprite.j==3) c.zy=6*ZEPS;
			if(sprite.j!==undefined) set_texture(c,sprite.j);
			c.moved=false;
		}
		else if(c.stype=="tail")
		{
			c.x=x_disp; c.y=0;
			if(sprite.j==0) c.zy=-6*ZEPS;
			else if(sprite.j==1) c.zy=-6*ZEPS;
			else if(sprite.j==2) c.zy=-6*ZEPS;
			else if(sprite.j==3) c.zy=6*ZEPS;
			if(sprite.j!==undefined) set_texture(c,(sprite.walking||0)%4,sprite.j);
			c.moved=false;
		}
		else if(cid.startsWith("wea"))
		{
			var wname=cid.substr(6,99),wcx=G.items[wname].cx||{},def=G.items[wname],scale=1,extension=false,blade=false,staff=false,rod=false,pickaxe=false,bow=false,mirror=false,rotation=0,crossbow=false;
			if(in_arr(def.wtype,["wblade","staff"])) staff=true;
			else if(in_arr(def.wtype,["rod"])) rod=true;
			else if(in_arr(def.wtype,["pickaxe"])) pickaxe=true;
			else if(in_arr(def.wtype,["bow"])) bow=true;
			else if(in_arr(def.wtype,["crossbow"])) crossbow=true;
			else blade=true;
			if(wcx.extension) extension=true;
			if(wcx.scale) scale=G.items[wname].cx.scale;
			var mainh=(cid[4]=="o"&&1||-1),xx=0,yy=0;
			if(sprite.i==0) xx=-0.5,yy=-0.5;
			else if(sprite.i==1) xx=0,yy=0;
			else if(sprite.i==2) xx=0.5,yy=0.5;

			if(sprite.j==0)
			{
				c.zy=-(1000+mainh)*ZEPS;
				if(mainh==-1) mirror=true;
				if(extension)
				{
					xx+=mainh*-3;
					yy+=1;
					rotation=mainh*0.5*Math.PI;
					if(wcx.small) xx+=mainh*-5;
				}
				yy-=2;
				if(wcx.small) yy-=5;
			}
			else if(sprite.j==1)
			{
				c.zy=-(1000+mainh)*ZEPS;
				mirror=true;
				xx*=1*mainh;
				yy*=1*mainh;
				if(extension) yy+=round(1/scale);
				else yy-=2;
				if(blade || crossbow)
				{
					if(extension) rotation=0.5*Math.PI;
					else xx+=2;
				}
				else
				{
					rotation=-0.25*Math.PI; xx+=8; yy-=3;
				}
				if(wcx.large) xx+=2;
				if(wcx.small) yy-=5;
			}
			else if(sprite.j==2)
			{
				c.zy=-(1000+mainh)*ZEPS;
				mirror=false;
				xx*=-1*mainh;
				yy*=-1*mainh; // reverse the move
				if(extension) yy+=round(1/scale);
				else yy-=2;
				if(blade || crossbow)
				{
					if(extension) rotation=-0.5*Math.PI;
					else xx+=-2;
				}
				else
				{
					rotation=0.25*Math.PI; xx+=-8; yy-=3;
				}
				if(wcx.large) xx-=2;
				if(wcx.small) yy-=5;
			}
			else if(sprite.j==3)
			{
				c.zy=(1000+mainh)*ZEPS;
				if(mainh==1) mirror=true;
				yy=0;
				if(extension)
				{
					xx+=mainh*-3;
					yy+=1;
					rotation=mainh*0.5*Math.PI;
					if(wcx.small) xx+=mainh*-5;
				}
				if(wcx.small) yy-=5;
			}
			if(sprite.fx && sprite.fx.attack)
			{
				var edge=15,divider=40.0;
				c.zy*=-1;
				if(blade) edge=10,divider=20.0;
				else
				{
					var distx=8;
					if(staff) distx=16,yy+=3;
					if(rod || pickaxe || crossbow)
					{
						if(sprite.j==1 || sprite.j==2);
						else yy+=-8,mirror=true;
					}
					yy+=5;
					if([1,2].includes(sprite.j)) xx+=((xx>0)?-1:1)*distx;
					if(sprite.j==1) rotation=0,mirror=false;
					if(sprite.j==2) rotation=0,mirror=true;
				}
				if(mssince(sprite.fx.attack[0])>edge)
				{
					sprite.fx.attack[0]=new Date(),sprite.fx.attack[1]++;
				}
				if(rotation>0 || sprite.j==2) rotation+=sprite.fx.attack[1]*Math.PI/divider;
				else rotation-=sprite.fx.attack[1]*Math.PI/divider;
				// console.log(c.skin+sprite.fx.attack[1]);
				if(textures["item"+c.skin][0]!=textures["item"+c.skin][1])
				{
					if(sprite.fx.attack[1]>2 && sprite.fx.attack[1]<=8) c.texture=textures["item"+c.skin][1];
					else c.texture=textures["item"+c.skin][0];
				}
				if(sprite.fx.attack[1]<5)
				{
					xx+=((xx>0)?-1:1)*[1,2,3,4,6][sprite.fx.attack[1]];
					yy-=[0.5,1,1.25,1.5,2][sprite.fx.attack[1]];
				}
				else if(sprite.fx.attack[1]<10)
				{
					xx+=((xx>0)?-1:1)*[5,4,3,2,1][sprite.fx.attack[1]-5];
					yy-=[2,1.5,1.25,1,0.5][sprite.fx.attack[1]-5];
				}
				else
					sprite.fx.attack=null;
			}
			if(scale<=0.5) yy-=6;
			else if(scale<=0.75) yy-=3;
			c.rotation=rotation;
			c.scale.set((mirror&&-1||1)*scale,scale);
			c.x=xx+x_disp;
			c.y=-4+yy;
			if(pickaxe && sprite.fx && sprite.fx.attack && sprite.fx.attack[1]==8) assassin_smoke(get_x(sprite)+((sprite.j==1)&&-10||(sprite.j==2)&&10||0),get_y(sprite)-8);
		}
		if((last_cx_d[0]||last_cx_d[1]) && !c.moved && c.skin==last_cx_name) c.moved=true,c.x+=last_cx_d[0],c.y+=last_cx_d[1];
	});
	sprite.children.sort(function(a,b){
		if(a.zy===undefined) a.zy=-CINF; // undefined's break the sort order [27/09/18]
		if(b.zy===undefined) b.zy=-CINF;
		return a.zy-b.zy;
	});
}

function add_npc(npc,position,npc_id) // not used anymore [07/09/22]
{
	var sprite;
	if(npc.type=="static") sprite=new_sprite(npc.skin,"static");
	else if(npc.type=="fullstatic") sprite=new_sprite(npc.skin,"full");
	else sprite=new_sprite(npc.skin,"emote");
	sprite.npc=npc_id;
	sprite.parentGroup=sprite.displayGroup=player_layer;
	sprite.interactive=true;
	sprite.buttonMode=true;
	sprite.real_x=sprite.x=round(position[0]);
	sprite.real_y=sprite.y=round(position[1]);
	if(npc.type=="fullstatic" && position.length==3) npc.direction=position[2];
	if(npc.role=="citizen") sprite.citizen=true;
	sprite.anchor.set(0.5,1); // this might be manually handled, but no need
	sprite.type="npc";
	sprite.npc=true;
	sprite.animations={}; sprite.fx={};
	sprite.emblems={};
	adopt_soft_properties(sprite,npc);
	if(npc.stand)
	{
		var stand=new PIXI.Sprite(textures[npc.stand]);
		stand.y=7;
		stand.anchor.set(0.5,1);
		sprite.addChild(stand);
	}
	if(sprite.stype=="emote")
	{
		var actual=[26,35],anchor=sprite.anchor;
		if(sprite.role=="newyear_tree") actual=[32,60];
		sprite.hitArea=new PIXI.Rectangle(-actual[0]*anchor.x-2,-actual[1]*anchor.y-2,actual[0]+4,actual[1]+4);
		sprite.awidth=actual[0];
		sprite.aheight=actual[1];
		if(npc.atype)
		{
			sprite.atype=npc.atype;
			sprite.frame=sprite.stopframe||sprite.frame;
		}
	}
	sprite.on('mousedown',npc_right_click).on('touchstart',npc_right_click).on('rightdown',npc_right_click);
	//#GTODO: Maybe focus with a story / name 
	sprite.onrclick=npc_right_click;
	return sprite;
}

function add_character(data,me)
{
	// console.log("add_character "+data.skin);
	// data.skin="dknight2";
	var npc=data.npc && G.npcs[data.npc],stype="full";
	if(npc && npc.type=="static") stype="static";
	else if(npc && npc.type!="fullstatic") stype="emote";
	if(log_flags.entities) console.log("add character "+data.id);
	var cscale=(me && manual_centering && 2) || 1;
	if(!XYWH[data.skin]) data.skin="naked";
	var sprite=new_sprite(data.skin,stype);
	if(cscale!=1) sprite.scale=new PIXI.Point(cscale,cscale);
	sprite.cscale=cscale;

	adopt_soft_properties(sprite,data);
	if(stype=="full") cosmetics_logic(sprite);

	sprite.name=sprite.id;

	sprite.parentGroup=sprite.displayGroup=player_layer;
	sprite.walking=null;
	sprite.animations={}; sprite.fx={};
	sprite.emblems={};
	sprite.real_alpha=1;
	sprite.x=round(data.x); sprite.real_x=parseFloat(data.x);
	sprite.y=round(data.y); sprite.real_y=parseFloat(data.y);
	sprite.last_ms=new Date();
	sprite.anchor.set(0.5,1);
	sprite.type="character";
	sprite.me=me;
	sprite.base={h:8,v:7,vn:2};
	if(npc)
	{
		sprite.type="npc";
		if(data.direction!==undefined) sprite.direction=data.direction;
		// sprite.npc_onclick=true;
		sprite.role=G.npcs[data.npc].role;
		adopt_soft_properties(sprite,npc);
		if(npc.role=="citizen" || npc.movable) sprite.citizen=true;
		if(npc.stand)
		{
			var stand=new PIXI.Sprite(textures[npc.stand]);
			stand.y=7;
			stand.anchor.set(0.5,1);
			sprite.addChild(stand);
		}
	}
	sprite.awidth=sprite.width/cscale; sprite.aheight=sprite.height/cscale;
	if(stype=="emote")
	{
		var actual=[26,35],anchor=sprite.anchor;
		if(sprite.role=="newyear_tree") actual=[32,60];
		sprite.hitArea=new PIXI.Rectangle(-actual[0]*anchor.x-2,-actual[1]*anchor.y-2,actual[0]+4,actual[1]+4);
		sprite.awidth=actual[0];
		sprite.aheight=actual[1];
		if(npc.atype)
		{
			sprite.atype=npc.atype;
			sprite.frame=sprite.stopframe||sprite.frame;
		}
	}
	if(npc)
	{
		sprite.interactive=true;
		sprite.buttonMode=true;
		sprite.on('mousedown',npc_right_click).on('touchstart',npc_right_click).on('rightdown',npc_right_click);
		sprite.onrclick=npc_right_click;
	}
	else if(!(me && manual_centering))
	{
		sprite.interactive=true;
		sprite.on("mousedown",player_click).on("touchstart",player_click);
		sprite.on('mouseover',mouseover);
		sprite.on('mouseout',mouseout);
		if(!me && pvp)
		{
			sprite.cursor="crosshair";
		}
		// sprite.on('rightdown',player_right_click); - so simple, yet doesn't work since there is no propagation between siblings [07/09/16]
	}
	if(me)
	{
		sprite.explanation="Hey Adventurer! This is your very own character that is a PIXI.Sprite Object. Adventure Land uses PIXI to draw things. You can learn more about it: https://www.pixijs.com/ and draw your own stuff via CODE! (Technical) Since your character is a special object, it doesn't get drawn like other entities, therefore your real character object has static x and y values. The character object in Code is an Object that mimics and extends your actual character Object. It's kinda complicated, but the only difference is that your real character object has different x and y values.";
		if(mode.ltbl && 0)
		{
			var lightbulb = new PIXI.Graphics();
			var rr = 100;
			var rg = 100;
			var rb = 100;
			var rad = 70;
			lightbulb.beginFill((rr << 16) + (rg << 8) + rb, 1.0);
			lightbulb.drawCircle(0, 0, rad);
			lightbulb.endFill();
			lightbulb.parentLayer = lighting;

			sprite.addChild(lightbulb);
		}
	}
	if(manual_centering && 0)
	{
		var actual=[sprite.awidth,sprite.aheight],anchor=sprite.anchor;
		sprite.hitArea=new PIXI.Rectangle(-actual[0]*anchor.x-2,-actual[1]*anchor.y-2,actual[0]+4,actual[1]+4);
	}
	return sprite;
}

function add_chest(data)
{
	var chest=new_sprite(data.chest,"v_animation"); // previously a new texture was created each time [01/04/17]
	chest.parentGroup=chest.displayGroup=chest_layer;
	chest.x=round(data.x);
	chest.y=round(data.y)-1;
	chest.items=data.items;
	chest.anchor.set(0.5,1);
	chest.type="chest";
	chest.interactive=true;
	chest.buttonMode=true;
	chest.cursor="help";
	chest.map=data.map;
	chest.id=data.id;
	var chest_click=function(){
		// sfx("open",chest.x,chest.y);
		open_chest(data.id);
	};
	chest.on('mousedown',chest_click).on('touchstart',chest_click).on('rightdown',chest_click);
	chests[data.id]=chest;
	if(chest.map==current_map) map.addChild(chest);
}

function get_npc(n_id)
{
	if(!n_id) return null;
	if(entities[n_id]) return entities[n_id];
	for(var id in entities)
		if(entities[id].npc==n_id) 
			return entities[id];
	return null;
}

function add_machine(machine)
{
	var sprite=new_sprite(machine,"machine");
	sprite.parentGroup=sprite.displayGroup=player_layer;
	sprite.interactive=true;
	// sprite.cursor="pointer";
	sprite.buttonMode=true;
	sprite.x=round(machine.x);
	sprite.y=round(machine.y);
	sprite.type="machine";
	sprite.mtype=machine.type;
	sprite.updates=0;
	sprite.anchor.set(0.5,1);
	// sprite.shuffling=true;

	if(machine.type=="dice")
	{
		sprite.digits=e_array(4);
		for(var i=0;i<4;i++)
		{
			sprite.digits[i]=new PIXI.Sprite(textures["dicesub"][8]); //parseInt(Math.random()*10)
			sprite.digits[i].anchor.set(0.5,1);
			sprite.digits[i].x=-11+i*7;
			if(i>1) sprite.digits[i].x+=1;
			sprite.digits[i].y=-17;
			sprite.addChild(sprite.digits[i]);
		}
		sprite.dot=new PIXI.Sprite(textures["dicesub"][10]);
		sprite.dot.anchor.set(0.5,1);
		sprite.dot.x=0;
		sprite.dot.y=-21;
		sprite.addChild(sprite.dot);
		sprite.seconds=0;
		sprite.count_start=new Date();
		// sprite.shuffling=true;
		sprite.shuffle_speed=100;
	}

	function machine_click(event)
	{
		if(machine.type=="dice") render_dice(); // add_log("Curious device","gray");//
		if(machine.type=="wheel") add_log("The hostess isn't around","gray");
		if(machine.type=="slots") render_interaction({auto:true,skin:character.skin,message:"Hmm. This machine seems broken. Still give it a try? [1,000,000 gold]",button:"YES!",onclick:function(){socket.emit("bet",{type:"slots"});}});;
		try{if(event) event.stopPropagation();}catch(e){};
	}
	sprite.on('mousedown',machine_click).on('touchstart',machine_click).on('rightdown',machine_click);
	sprite.onrclick=machine_click;
	return sprite;
}

function add_door(door)
{
	var sprite=new PIXI.Sprite();
	sprite.parentGroup=sprite.displayGroup=player_layer;
	sprite.interactive=true;
	//sprite.cursor="pointer";
	sprite.buttonMode=true;
	sprite.x=round(door[0]);
	sprite.y=round(door[1]);
	sprite.to=door[4];
	sprite.s=door[5];
	sprite.anchor.set(0.5,1);
	//sprite.width=door[2]; sprite.height=door[3];
	//sprite.hitArea=new PIXI.Rectangle(0,0,round(door[2]),round(door[3]));
	sprite.hitArea=new PIXI.Rectangle(-round(door[2]*0.5),-round(door[3]*1),round(door[2]),round(door[3]));
	sprite.type="door";
	function door_right_click(event){
		if(event) event.stopPropagation();
		// if(distance(character,{x:door[0]+door[2]/2,y:door[1]+door[3]/2})>100) {add_log("Get closer","gray"); return;}
		if(is_electron && electron_data.platform=="mas" && door[4]=="tavern") return show_alert("You can't enter the Tavern from Mac App Store :|");
		if(door[7]=="key")
		{
			if(character.party)
			{
				for(var p in party)
				{
					var c=party[p];
					if(c['map']==door[4])
					{
						socket.emit('enter',{place:door[4],name:c["in"]});
						push_deferred("enter");
						return;
					}
				}
			}
			setTimeout(function(){ show_confirm("Enter "+G.maps[door[4]].name+"? [Consumes a key!]",["#D06631","Yes"],"No!",function(){ socket.emit('enter',{place:door[4]}); push_deferred("enter"); hide_modal(true); }); },10);
			return;
		}
		if(!is_door_close(character.map,door,character.real_x,character.real_y) || !can_use_door(character.map,door,character.real_x,character.real_y)) {add_log("Get closer","gray"); return;}
		socket.emit("transport",{to:door[4],s:door[5]});
		push_deferred("transport");
	}
	if(is_mobile) sprite.on('mousedown',door_right_click).on('touchstart',door_right_click);
	sprite.on('rightdown',door_right_click);
	sprite.onrclick=door_right_click;
	return sprite;
}

function add_quirk(quirk)
{
	var sprite=new PIXI.Sprite();
	sprite.parentGroup=sprite.displayGroup=player_layer;
	sprite.interactive=true;
	sprite.buttonMode=true;
	if(quirk[4]!="upgrade" && quirk[4]!="compound") sprite.cursor="help";
	sprite.x=round(quirk[0]);
	sprite.y=round(quirk[1]);
	sprite.anchor.set(0.5,1);
	//sprite.hitArea=new PIXI.Rectangle(0,0,round(quirk[2]),round(quirk[3]));
	sprite.hitArea=new PIXI.Rectangle(-round(quirk[2]*0.5),-round(quirk[3]*1),round(quirk[2]),round(quirk[3]));
	sprite.type="quirk";
	function quirk_right_click(event){
		if(quirk[4]=="sign") add_log('Sign reads: "'+quirk[5]+'"',"gray");
		else if(quirk[4]=="note") add_log('Note reads: "'+quirk[5]+'"',"gray");
		else if(quirk[4]=="tavern_info") socket.emit("tavern",{event:"info"});
		else if(quirk[4]=="mainframe") render_mainframe();
		else if(quirk[4]=="the_lever") the_lever();
		else if(quirk[4]=="log") add_log(quirk[5],"gray");
		else if(quirk[4]=="upgrade") render_upgrade_shrine(1);
		else if(quirk[4]=="compound") render_compound_shrine(1);
		else if(quirk[4]=="list_pvp") socket.emit("list_pvp");
		else if(quirk[4]=="invisible_statue") render_none_shrine(),add_log('An invisible statue!',"gray");
		try{if(event) event.stopPropagation();}catch(e){};
	}
	if(is_mobile || in_arr(quirk[4],["upgrade","compound","invisible_statue"])) sprite.on('mousedown',quirk_right_click).on('touchstart',quirk_right_click);
	sprite.on('rightdown',quirk_right_click);
	sprite.on('mousedown',quirk_right_click).on('touchstart',quirk_right_click); // Better to make them all-clickable [31/08/18]
	return sprite;
}

function add_animatable(name,data)
{
	var animatable=new_sprite(data.position,"animatable");
	animatable.x=data.x;
	animatable.y=data.y;
	animatable.anchor.set(0.5,1);
	animatable.type="animatable";
	return animatable;
}

function create_map()
{
	var start=new Date();
	pvp=G.maps[current_map].pvp || is_pvp;
	if(paused) return;
	drawn_map=current_map;
	if(window.map)
	{
		if(window.inner_stage) inner_stage.removeChild(window.map);
		else stage.removeChild(window.map);
		for(var id in chests)
		{
			var chest=chests[id];
			if(chest.map==window.map.map_name) map.removeChild(chest);
		}
		// #IDEA: Destroy sprites too, otherwise they stack up
		if(!cached_map && map_tiles.length && map.children) map.removeChildren(map.children.indexOf(map_tiles[0]),map.children.indexOf(map_tiles[map_tiles.length-1])); // [06/03/20]
		free_children(map) // #PIXI: https://github.com/pixijs/pixi.js/pull/2995#issuecomment-248974419

		map.destroy();
		for(var id in map_animations) destroy_sprite(map_animations[id],"children");
		map_entities.forEach(function(e){ e.destroy({children:true}); });
		if(wtile) wtile.destroy(),wtile=null;
		if(dtile) dtile.destroy(),dtile=null;
		if(tiles) tiles.destroy(),tiles=null;
		(window.rtextures||[]).forEach(function(t){if(t) t.destroy(true); }); // Live and learn experience, .destroy() was a major memory leak: https://github.com/pixijs/pixi.js/issues/4163 [18/07/17]
		(window.dtextures||[]).forEach(function(t){if(t) t.destroy(true); });	
		// #GTODO: Maybe only destroy groups and NPC's that are not re-used
		// map.destroy({children:true}); // added children:true - exception [20/08/16] #PIXI
	}
	map_npcs=[]; map_doors=[]; map_nights=[]; map_lights=[]; map_tiles=[]; map_entities=[]; map_animations={}; map_machines={}; water_tiles=[]; entities={};

	dtile_size=GEO['default']&&GEO.tiles[GEO['default']][3];
	if(dtile_size && is_array(dtile_size)) dtile_size=dtile_size[0];

	wtile_name=G.maps[current_map].weather;
	
	map=new PIXI.Container();
	map.map_name=current_map;
	//var filter=new PIXI.filters.ColorMatrixFilter()
	//filter.desaturate(0.2);
	//map.filters=[filter];
	//filter.sepia(0.01);
	//filter.brightness(1.04);
	map.real_x=0; map.real_y=0;
	if(first_coords)
	{
		first_coords=false;
		map.real_x=first_x;
		map.real_y=first_y;
	}
	map.speed=80;
	map.hitArea=new PIXI.Rectangle(-20000,-20000,40000,40000);
	if(scale) map.scale=new PIXI.Point(scale,scale);

	map.interactive=true;
	map.on('mousedown',map_click).on('mouseup',map_click_release).on('mouseupoutside',map_click_release)
	.on('touchstart',map_click).on('touchend',map_click_release).on('touchendoutside',map_click_release);

	if(window.inner_stage) inner_stage.addChild(map);
	else stage.addChild(map);

	if(G.maps[current_map].filter=="halloween" && !no_graphics)
	{
		var filter=new PIXI.filters.ColorMatrixFilter()
		filter.saturate(-0.1);
		stage.cfilter_halloween=filter;
		regather_filters(stage);
	}
	else
	{
		delete stage.cfilter_halloween;
		regather_filters(stage);
	}

	if(!tile_sprites[current_map]) tile_sprites[current_map]=[],tile_textures[current_map]=[],sprite_last[current_map]=[];

	for(var i=0;i<GEO.tiles.length;i++)
	{
		element=GEO.tiles[i];
		sprite_last[current_map][i]=0;
		if(!tile_sprites[current_map][i]) // otherwise the map was processed before! [29/08/16]
		{
			tile_sprites[current_map][i]=[];
			tile_textures[current_map][i]=[];
			if(!element) continue;
			// ["t1",x,y,D] // moved to the map routine [11/05/16]
			element[4]=nunv(element[4],element[3]);
			var rectangle=new PIXI.Rectangle(element[1],element[2],element[3],element[4]); // the Frame for the Texture
			var texture=new PIXI.Texture(C[G.tilesets[element[0]].file],rectangle); // Texture for the tile Sprite's
			tile_textures[current_map][i][0]=texture;
			var frames=G.tilesets[element[0]].frames||1;
			var frame_width=G.tilesets[element[0]].frame_width;
			if(element[5]) frames=element[5],frame_width=element[3];
			for(var f=1;f<frames;f++)
			{
				rectangle = new PIXI.Rectangle(element[1]+f*frame_width,element[2],element[3],element[4]);
				texture=new PIXI.Texture(C[G.tilesets[element[0]].file],rectangle);
				tile_textures[current_map][i][f]=texture;
			}
			if(!cached_map) tile_sprites[current_map][i][sprite_last[current_map][i]]=new_map_tile(tile_textures[current_map][i]); // new - cache one in case it increases performance [03/09/16]
		}
	}

	if(cached_map)
	{
		var cstart=new Date();
		window.rtextures=[0,0,0];
		window.dtextures=[0,0,0];
		window.wtextures=[0,0,0];
		if(dtile_size) recreate_dtextures();
		if(wtile_name) recreate_wtextures();
		var tile_containers=[new PIXI.Container(),new PIXI.Container(),new PIXI.Container()];
		var a=0,b=0;
		for(var last_water_frame=0;last_water_frame<3;last_water_frame++)
		{
			rtextures[last_water_frame]=PIXI.RenderTexture.create(GEO.max_x-GEO.min_x,GEO.max_y-GEO.min_y,PIXI.SCALE_MODES.NEAREST,1);
			for(var i=0;i<GEO.placements.length;i++)
			{
				var tile=GEO.placements[i]
				if(tile[3]===undefined || tile[3]===null)
				{
					var def=GEO.tiles[tile[0]],w=def[3],h=def[4];
					if(sprite_last[current_map][tile[0]]>=tile_sprites[current_map][tile[0]].length)
						tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]] ]=new_map_tile(tile_textures[current_map][tile[0]]);
					var entity=tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]]++ ]; // Sprite to add to the stage individually
					if(entity.textures) entity.texture=entity.textures[last_water_frame];
					entity.x=tile[1]-GEO.min_x;
					entity.y=tile[2]-GEO.min_y;
					tile_containers[last_water_frame].addChild(entity);
				}
				else
				{
					var def=GEO.tiles[tile[0]],w=def[3],h=def[4];
					if(abs(((tile[3]-tile[1])/w+1)*((tile[4]-tile[2])/h+1))>=20) // abs(((tile[3]-tile[1])/w+1)*((tile[4]-tile[2])/h+1))>4
					{
						// PIXI.extras.TilingSprite is slow [22/03/20]
						var texture=tile_textures[current_map][tile[0]][0];
						if(tile_textures[current_map][tile[0]].length>1) // new_map_tile logic
							texture=tile_textures[current_map][tile[0]][last_water_frame%tile_textures[current_map][tile[0]].length];
						var entity=new PIXI.extras.TilingSprite(texture,tile[3]-tile[1]+w,tile[4]-tile[2]+h);
						entity.x=tile[1]-GEO.min_x;
						entity.y=tile[2]-GEO.min_y;
						tile_containers[last_water_frame].addChild(entity);
						a++;
					}
					else
					{
						b++;
						for(var x=tile[1];x<=tile[3];x+=w)
						{
							for(var y=tile[2];y<=tile[4];y+=h)
							{
								if(sprite_last[current_map][tile[0]]>=tile_sprites[current_map][tile[0]].length)
									tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]] ]=new_map_tile(tile_textures[current_map][tile[0]]);
								var entity=tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]]++ ];
								if(entity.textures) entity.texture=entity.textures[last_water_frame];
								entity.x=x-GEO.min_x;
								entity.y=y-GEO.min_y;
								tile_containers[last_water_frame].addChild(entity);
							}
						}
					}
				}
			}
			tile_containers[last_water_frame].x=0; tile_containers[last_water_frame].y=0;
			renderer.render(tile_containers[last_water_frame],rtextures[last_water_frame]);
			if(!mode.destroy_tiles) tile_containers[last_water_frame].destroy();
		}
		if(dtile_size) window.dtile=new PIXI.Sprite(dtextures[1]),dtile.x=-500,dtile.y=-500;
		if(wtile_name) window.wtile=new PIXI.Sprite(wtextures[0]),wtile.x=-500,wtile.y=-500,wtile.parentGroup=sprite.displayGroup=weather_layer;
		if(0)
		{
			window.ftile=new PIXI.Sprite(textures.fog[0]),ftile.x=0,ftile.y=0,ftile.parentGroup=sprite.displayGroup=fog_layer;
			window.ftile2=new PIXI.Sprite(textures.fog[1]),ftile2.x=-500,ftile2.y=0,ftile2.parentGroup=sprite.displayGroup=fog_layer;
			window.ftile3=new PIXI.Sprite(textures.fog[1]),ftile3.x=500,ftile3.y=0,ftile3.parentGroup=sprite.displayGroup=fog_layer;
			ftile.anchor.set(0.5,0.5); ftile.height*=5; ftile.width*=5;
			ftile2.anchor.set(0.5,0.5); ftile2.height*=5; ftile2.width*=5;
			ftile3.anchor.set(0.5,0.5); ftile3.height*=5; ftile3.width*=5;
			map.addChild(ftile);
			map.addChild(ftile2);
			map.addChild(ftile3);
		}
		window.tiles=new PIXI.Sprite(rtextures[0]);
		tiles.x=GEO.min_x;	
		tiles.y=GEO.min_y;
		if(dtile_size) map.addChild(dtile);
		map.addChild(tiles);
		if(wtile_name) map.addChild(wtile);

		/* clean up */
		if(mode.destroy_tiles)
		{
			for(var i=0;i<3;i++)
			{
				tile_containers[i].destroy(); //{children:true}
			}
			for(var i=0;i<GEO.tiles.length;i++)
			{
				for(var j=0;j<tile_sprites[current_map][i].length;j++)
					tile_sprites[current_map][i][j].destroy();
				tile_sprites[current_map][i]=[];
			}
		}
		// console.log("map: "+current_map+" a: "+a+" b: "+b+" cstart: "+mssince(cstart));
	}

	if(GEO.animations)
		for(var p=0;p<GEO.animations.length;p++)
		{
			var tile=GEO.animations[p],w=GEO.tiles[tile[0]][3],h=GEO.tiles[tile[0]][4];
			console.log(GEO.tiles[tile[0]][0]);
			for(var x=tile[1];x<=nunv(tile[3],tile[1]);x+=w)
				for(var y=tile[2];y<=nunv(tile[4],tile[2]);y+=h)
				{
					var entity=new PIXI.Sprite(tile_textures[current_map][tile[0]][0]);
					entity.textures=tile_textures[current_map][tile[0]];
					entity.real_x=entity.x=x;
					entity.y=y;
					entity.real_y=nunv(tile[4],tile[2])+h;
					entity.stype="animation"; entity.atype="xmap"; entity.last=0; entity.last_update=future_ms(parseInt(tile[6])||0); entity.interval=tile[5];
					entity.id="xmap"+p+"|"+x+"|"+y;
					entity.parentGroup=entity.displayGroup=player_layer;
					entity.y_disp=-parseFloat(tile[7])||0;
					map.addChild(entity);
					map_animations[entity.id]=entity;
				}
		}

	if(GEO.lights && mode.ltbl && !no_graphics)
		for(var p=0;p<GEO.lights.length;p++)
		{
			var tile=GEO.lights[p],w=GEO.tiles[tile[0]][3],h=GEO.tiles[tile[0]][4];
			console.log(GEO.tiles[tile[0]][0]);
			for(var x=tile[1];x<=nunv(tile[3],tile[1]);x+=w)
				for(var y=tile[2];y<=nunv(tile[4],tile[2]);y+=h)
				{
					var entity=new PIXI.Sprite(tile_textures[current_map][tile[0]][0]);
					entity.x=x;
					entity.y=y;
					entity.real_y=nunv(tile[4],tile[2])+h;
					entity.parentLayer=lighting;
					map_lights.push(entity);
					map.addChild(entity);
				}
		}

	if(GEO.nights && mode.ltbl && !no_graphics)
		for(var p=0;p<GEO.nights.length;p++)
		{
			var tile=GEO.nights[p],w=GEO.tiles[tile[0]][3],h=GEO.tiles[tile[0]][4];
			console.log(GEO.tiles[tile[0]][0]);
			for(var x=tile[1];x<=nunv(tile[3],tile[1]);x+=w)
				for(var y=tile[2];y<=nunv(tile[4],tile[2]);y+=h)
				{
					var entity=new PIXI.Sprite(tile_textures[current_map][tile[0]][0]);
					entity.textures=tile_textures[current_map][tile[0]];
					entity.real_x=entity.x=x;
					entity.y=y;
					entity.real_y=nunv(tile[4],tile[2])+h;
					entity.stype="light"; entity.atype="xmap"; entity.last=0; entity.last_update=future_ms(parseInt(tile[6])||0); entity.interval=tile[5];
					entity.id="xlmap"+p+"|"+x+"|"+y;
					// entity.parentLayer=lighting;
					entity.alpha=0.7;
					entity.parentGroup=entity.displayGroup=player_layer;
					entity.y_disp=-(parseFloat(tile[7])||0)+EPS;
					map_nights.push(entity);
					map.addChild(entity);
					map_animations[entity.id]=entity;
				}
		}

	if(GEO.groups)
		for(var p=0;p<GEO.groups.length;p++)
		{
			if(!GEO.groups[p].length) continue;
			var container=new PIXI.Container();
			container.type="group";
			var min_y=999999999,min_x=99999999,max_y=-999999999;
			for(var i=0;i<GEO.groups[p].length;i++)
			{
				var tile=GEO.groups[p][i],def=GEO.tiles[tile[0]];
				if(tile[1]<min_x) min_x=tile[1];
				if(tile[2]<min_y) min_y=tile[2];
				if(nunv(tile[4],tile[2])+def[4]>max_y) max_y=nunv(tile[4],tile[2])+def[4];
			}
			for(var i=0;i<GEO.groups[p].length;i++)
			{
				var tile=GEO.groups[p][i],w=GEO.tiles[tile[0]][3],h=GEO.tiles[tile[0]][4];
				for(var x=tile[1];x<=nunv(tile[3],tile[1]);x+=w)
					for(var y=tile[2];y<=nunv(tile[4],tile[2]);y+=h)
					{
						var entity=new PIXI.Sprite(tile_textures[current_map][tile[0]][0]);
						entity.x=x-min_x;
						entity.y=y-min_y;
						container.addChild(entity);
					}
			}
			if(GEO.groups[p][0] && GEO.groups[p][0][5]) container.y_disp=-parseFloat(GEO.groups[p][0][5])||0;
			container.x=min_x;
			container.y=min_y;
			container.real_x=min_x;
			container.real_y=max_y;
			container.parentGroup=container.displayGroup=player_layer;
			map.addChild(container);
			map_entities.push(container);
		}

	map_info=G.maps[current_map];
	if(0) // Now all NPC's are live [07/09/22]
	{
		npcs=map_info.npcs;
		for(var i=0;i<npcs.length;i++)
		{
			var npc=npcs[i],def=G.npcs[npc.id];
			if(def.type=="full" || def.role=="citizen" || !npc.position) continue;
			if(log_flags.map) console.log("NPC: "+npc.id);
			var nsprite=add_npc(def,npc.position,npc.id);
			map.addChild(nsprite);
			map_npcs.push(nsprite);
			map_entities.push(nsprite);
		}
	}

	doors=map_info.doors||[];
	for(var i=0;i<doors.length;i++)
	{
		var door=doors[i];
		var nsprite=add_door(door);
		if(log_flags.map) console.log("Door: "+door);
		map.addChild(nsprite);
		map_doors.push(nsprite);
		map_entities.push(nsprite);
		if(border_mode) border_logic(nsprite);
	}

	machines=map_info.machines||[];
	for(var i=0;i<machines.length;i++)
	{
		var machine=machines[i];
		var nsprite=add_machine(machine);
		if(log_flags.map) console.log("Machine: "+machine.type);
		map.addChild(nsprite);
		map_npcs.push(nsprite);
		map_entities.push(nsprite);
		map_machines[nsprite.mtype]=nsprite;
		if(border_mode) border_logic(nsprite);

	}

	var q=map_info.quirks||[];
	for(var i=0;i<q.length;i++)
	{
		var quirk=q[i];
		var nsprite=add_quirk(quirk);
		if(log_flags.map) console.log("Quirk: "+quirk);
		map.addChild(nsprite);
		map_entities.push(nsprite);
		// map_doors.push(nsprite);
		if(border_mode) border_logic(nsprite);
	}

	if(log_flags.map) console.log("Map created: "+current_map);

	animatables={};
	for(var id in map_info.animatables||{})
	{
		animatables[id]=add_animatable(id,map_info.animatables[id]);
		map.addChild(animatables[id]);
		map_entities.push(animatables[id]);
		if(border_mode) border_logic(animatables[id]);
	}

	for(var id in chests)
	{
		var chest=chests[id];
		if(chest.map==current_map) map.addChild(chest);
	}

	if(border_mode)
	{
		G.maps[current_map].spawns.forEach(function(spawn){
			var c=draw_circle(spawn[0],spawn[1],10,0xFD7188);
			map.addChild(c);
		});
		(G.maps[current_map].monsters||[]).forEach(function(mdef){
			if(mdef.boundary)
			{
				var e=empty_rect(mdef.boundary[0],mdef.boundary[1],mdef.boundary[2]-mdef.boundary[0],mdef.boundary[3]-mdef.boundary[1],2,0xFC5F39);
				map.addChild(e);
			}
			if(mdef.rage)
			{
				var e=empty_rect(mdef.rage[0]-3,mdef.rage[1]-3,mdef.rage[2]-mdef.rage[0]+6,mdef.rage[3]-mdef.rage[1]+6,2,0x916BBD);
				map.addChild(e);
			}
			(mdef.boundaries||[]).forEach(function(b){
				if(b[0]!=current_map) return;
				var e=empty_rect(b[1]+2,b[2]+2,b[3]-b[1],b[4]-b[2],2,0x5294FF);
				map.addChild(e);
			});
		});
		M.x_lines.forEach(function(line){
			var l=draw_line(line[0],line[1],line[0],line[2],2);
			map.addChild(l);
		});
		M.y_lines.forEach(function(line){
			var l=draw_line(line[1],line[0],line[2],line[0],2);
			map.addChild(l);
		});
	}

	if(log_flags.map) console.log("Map created: "+current_map);
	// alert(mssince(start));
}

function retile_the_map()
{
	if(paused) return;
	if(cached_map)
	{
		if(dtile_size && (dtile_width<width || dtile_height<height)) recreate_dtextures();
		if(wtile && (wtile_width<width || wtile_height<height)) recreate_wtextures();
		if(last_water_frame!=water_frame())
		{
			last_water_frame=water_frame();
			tiles.texture=rtextures[last_water_frame];
			if(dtile_size) dtile.texture=dtextures[last_water_frame];
		}
		if(wtile && window.last_weather_frame!=weather_frame())
		{
			window.last_weather_frame=weather_frame();
			wtile.texture=wtextures[last_weather_frame];
		}
		return;
	}
	//#IDEA: pre-calculate a redraw tree for each placement
	// var x=width/2.0-map.real_x*scale,y=height/2.0-map.real_y*scale,change=false;
	var border=mdraw_border*scale,nmap_tiles=[],nlast=0,visited={},start=new Date(),r=0,s=0;
	var x=map.real_x,y=map.real_y,min_x=x-width/scale/2-border,max_x=x+width/scale/2+border,min_y=y-height/scale/2-border,max_y=y+height/scale/2+border;
	if(!(map.last_max_y==undefined || abs(map.last_max_y-max_y)>=border || abs(map.last_max_x-max_x)>=border))
	{
		if(last_water_frame!=water_frame())
		{
			last_water_frame=water_frame();
			for(var i=0;i<water_tiles.length;i++)
				water_tiles[i].texture=water_tiles[i].textures[last_water_frame%water_tiles[i].textures.length];
			if(mdraw_tiling_sprites)
				default_tiling.texture=default_tiling.textures[last_water_frame%default_tiling.textures.length];
		}
		return;
	}
	map.last_max_y=max_y; map.last_max_x=max_x;
	// min_x+=100; max_x-=100; min_y+=100; max_y-=100;

	for(var i=0;i<map_tiles.length;i++)
	{
		var entity=map_tiles[i];
		if(mdraw_mode=="redraw" || entity.x>max_x || entity.y>max_y || entity.x+entity.width<min_x || entity.y+entity.height<min_y)
		{
			entity.to_delete=true;
			r++; 
		}
		else
		{
			nmap_tiles.push(entity);
			visited[entity.tid]=true;
		}
	}
	if(0)
	{
		start_timer("remove_sprite");
		for(var i=0;i<map_tiles.length;i++)
			if(map_tiles[i].to_delete) remove_sprite(map_tiles[i]);
		stop_timer("remove_sprite");
	}
	else if(map_tiles.length) // prototype, mass removal
	{
		map.removeChildren(map.children.indexOf(map_tiles[0]),map.children.indexOf(map_tiles[map_tiles.length-1]));
	}

	for(var i=0;i<GEO.tiles.length;i++) sprite_last[current_map][i]=0;

	map_tiles=nmap_tiles; water_tiles=[]; last_water_frame=water_frame();

	if(GEO['default'] && !mdraw_tiling_sprites)
	{
		var def=GEO.tiles[GEO['default']];
		for(var x=min_x;x<=max_x+10;x+=def[3])
			for(var y=min_y;y<=max_y+10;y+=def[4])
			{
				var ex=floor(x/def[3]),ey=floor(y/def[4]),tid='d'+ex+'-'+ey;
				if(visited[tid]) continue;
				if(sprite_last[current_map][GEO['default']]>=tile_sprites[current_map][GEO['default']].length)
					tile_sprites[current_map][GEO['default']][  sprite_last[current_map][GEO['default']]  ]=new_map_tile(tile_textures[current_map][GEO['default']]),s++;
				var entity=tile_sprites[current_map][GEO['default']][  sprite_last[current_map][GEO['default']]++  ];
				if(entity.textures) entity.texture=entity.textures[last_water_frame],water_tiles.push(entity);
				entity.x=ex*def[3];
				entity.y=ey*def[4];
				if(mdraw_mode!="redraw") entity.parentGroup=entity.displayGroup=map_layer,entity.zOrder=0;
				entity.tid=tid;
				map.addChild(entity);
				map_tiles.push(entity);
			}
	}
	else if(GEO['default'])
	{
		var def=GEO.tiles[GEO['default']];
		if(!window.default_tiling) default_tiling=new PIXI.extras.TilingSprite(tile_textures[current_map][GEO['default']][0],floor((max_x-min_x)/32)*32+32,floor((max_y-min_y)/32)*32+32);
		default_tiling.x=floor(min_x/def[3])*def[3];
		default_tiling.y=floor(min_y/def[4])*def[4];
		default_tiling.textures=tile_textures[current_map][GEO['default']];
		map.addChild(default_tiling);
		map_tiles.push(default_tiling);
	}


	for(var i=0;i<GEO.placements.length;i++)
	{
		var tile=GEO.placements[i]
		if(is_nun(tile[3]))
		{
			if(visited['p'+i]) continue;
			var def=GEO.tiles[tile[0]],w=def[3],h=def[4];
			if(tile[1]>max_x || tile[2]>max_y || tile[1]+w<min_x || tile[2]+h<min_y) continue;
			if(sprite_last[current_map][tile[0]]>=tile_sprites[current_map][tile[0]].length)
				tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]] ]=new_map_tile(tile_textures[current_map][tile[0]]),s++;
			var entity=tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]]++ ]; // Sprite to add to the stage individually
			if(entity.textures) entity.texture=entity.textures[last_water_frame],water_tiles.push(entity);
			entity.x=tile[1];
			entity.y=tile[2];
			if(mdraw_mode!="redraw") entity.parentGroup=entity.displayGroup=map_layer,entity.zOrder=-(i+1); 
			entity.tid='p'+i;
			map.addChild(entity);
			map_tiles.push(entity);
		}
		else // #GTODO: Improve this routine, a lot [07/07/16]
		{
			var def=GEO.tiles[tile[0]],w=def[3],h=def[4];
			if(!mdraw_tiling_sprites || mdraw_tiling_sprites && abs(((tile[3]-tile[1])/w+1)*((tile[4]-tile[2])/h+1))<8)
			{
				for(var x=tile[1];x<=tile[3];x+=w)
				{
					if(x>max_x || x+w<min_x) continue; // first improvement, a better version is boundary calculations for for loops [03/09/16]
					for(y=tile[2];y<=tile[4];y+=h)
					{
						if(y>max_y || y+h<min_y) continue;
						if(sprite_last[current_map][tile[0]]>=tile_sprites[current_map][tile[0]].length)
							tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]] ]=new_map_tile(tile_textures[current_map][tile[0]]),s++;
						var entity=tile_sprites[current_map][tile[0]][  sprite_last[current_map][tile[0]]++ ];
						if(entity.textures) entity.texture=entity.textures[last_water_frame],water_tiles.push(entity);
						entity.x=x;
						entity.y=y;
						entity.tid='p'+i+'-'+x+'-'+y;
						map.addChild(entity);
						map_tiles.push(entity);
					}
				}
			}
			else
			{
				if(!window['defP'+current_map+i]) window['defP'+current_map+i]=new PIXI.extras.TilingSprite(tile_textures[current_map][tile[0]][0],tile[3]-tile[1]+w,tile[4]-tile[2]+h);
				var entity=window['defP'+current_map+i];
				entity.x=tile[1];
				entity.y=tile[2];
				entity.tid='pt'+i;
				map.addChild(entity);
				map_tiles.push(entity);
			}
		}
	}

	drawings.forEach(function(e){ //user-drawings
		try{
			var parent=e&&e.parent;
			if(parent){parent.removeChild(e); parent.addChild(e);}
		}catch(ex){
			console.log("User drawing exception: "+ex);
		}
	});

	console.log("retile_map ms: "+mssince(start)+" min_x: "+min_x+" max_x: "+max_x+" entities: "+map_tiles.length+" removed: "+r+" new: "+s);

}

var fps_counter=null,frames=0,last_count=null,last_frame,fps=0;
function calculate_fps()
{
	if(!fps_counter) return;
	if(mode.dom_tests_pixi || inside=="payments") return;
	frames+=1;
	if(!last_count) last_count=new Date(),last_frame=frames,frequency=500;
	if(mssince(last_count)>=frequency) last_count=new Date(),fps=(frames-last_frame)*(1000.0/frequency),last_frame=frames;
	fps_counter.text=""+round(fps);
	fps_counter.position.set(width-(inside=="com"&&5||335), height-(inside=="com"&&5||0));
}

function load_game(c)
{
	loader.load(function (loader, resources) {

		//PIXI.ticker.shared.autoStart = false;
		//PIXI.ticker.shared.stop(); https://github.com/pixijs/pixi.js/issues/2843#issuecomment-241682589 no observable effect

		if(mode_nearest)
			for(file in PIXI.utils.BaseTextureCache)
				PIXI.utils.BaseTextureCache[file].scaleMode=PIXI.SCALE_MODES.NEAREST; // great find - prevents tile gaps and upper shadows / similar imperfections [17/06/16]

		// IID=null;

		for(name in G.sprites)
		{
			var s_def=G.sprites[name];
			// console.log(s_def.file);
			if(s_def.skip) continue;
			var row_num=4,col_num=3,s_type="full";
			// #TODO: ALWAYS REPLICATE TO html.js / precompute_image_positions
			if(in_arr(s_def.type,["animation"])) row_num=1,s_type=s_def.type;
			if(in_arr(s_def.type,["tail"])) col_num=4,s_type=s_def.type;
			if(in_arr(s_def.type,["v_animation","head","hair","hat","s_wings","face","makeup","beard"])) col_num=1,s_type=s_def.type;
			if(in_arr(s_def.type,["a_makeup","a_hat"])) col_num=3,s_type=s_def.type;
			if(in_arr(s_def.type,["wings","body","armor","skin","character"])) s_type=s_def.type;
			if(in_arr(s_def.type,["emblem","gravestone"])) row_num=1,col_num=1,s_type=s_def.type;
			var matrix=s_def.matrix;
			if(no_graphics) C[s_def.file]={width:20,height:20}; //#NOGTODO: pull these values from SDK + Insert into data.js for usage [03/01/18]
			var width=C[s_def.file].width/(s_def.columns*col_num);
			var height=C[s_def.file].height/(s_def.rows*row_num);
			for(var i=0;i<matrix.length;i++)
				for(var j=0;j<matrix[i].length;j++)
				{
					if(!matrix[i][j]) continue;
					var name=matrix[i][j];
					SSU[name]=SS[name]=s_def.size||"normal";
					FC[name]=s_def.file;
					FM[name]=[i,j];
					XYWH[name]=[j*col_num*width,i*row_num*height,width,height];
					if(G.cosmetics.prop[name] && G.cosmetics.prop[name].includes("slender")) SSU[name]+="slender";
				}
		}

		G.positions.textures.forEach(function(name){
			var position=G.positions[name];
			textures[name]=new PIXI.Texture(PIXI.utils.BaseTextureCache[G.tilesets[position[0]].file],new PIXI.Rectangle(position[1],position[2],position[3],position[4]));
		});

		for(name in G.animations) generate_textures(name,"animation");
		
		set_status("Resources Loaded");

		resources_loaded=true;

		if(is_demo)
		{
			create_map();
			map.real_y=-105;
			draw();
		}
		else if(window.socket_ready) launch_game();
	});
	if(no_graphics) loader.load_function();
}

function launch_game()
{
	create_map();

	if(!draws) draw();

	if(!mode.dom_tests_pixi && inside!="payments" && !window.fps_counter)
	{
		// fps_counter = new PIXI.Text("0",{fontFamily:"Arial",fontSize:32,fill:"green"});
		fps_counter = new PIXI.Text("0",{fontFamily:"Pixel",fontSize:40,fill:"green"});
		fps_counter.position.set(10, 10);
		fps_counter.anchor.set(1,1);
		fps_counter.parentGroup=fps_counter.displayGroup=chest_layer; fps_counter.zOrder=-999999999;
		if(window.inner_stage) inner_stage.addChild(fps_counter);
		else stage.addChild(fps_counter);
	}

	game_loaded=true;

	socket.emit("loaded",{success:1,width:screen.width,height:screen.height,scale:scale});
}

function on_resize()
{
	width=$(window).width();
	height=$(window).height();
	if(window.renderer)
	{
		renderer.resize(width,height);
		renderer.antialias=antialias;
		if(window.map) map.last_max_y=undefined;
	}
	$("#pagewrapped").css("margin-top",Math.floor(($(window).height()-$("#pagewrapped").outerHeight())/2)+"px");
	reposition_ui();
	position_modals();
	force_draw_on=future_s(1);
}
function resize(){on_resize();}

function pause()
{
	if(paused)
	{
		paused=false;
		if(current_map!=drawn_map) create_map();
		$("#pausedui").hide();
	}
	else
	{
		paused=true;
		$("#pausedui").show();
	}
}

function draw(arg1,manual_draw) {
	// for(var i=0;i<20000000;i++) { var j=12; j*=Math.random()+i; }
	if(manual_stop) return;
	// if(character && no_html) console.log("draw for "+character.name);
	// console.log("DRAW: "+arg1);
	draws++; in_draw=true;
	if(window.last_draw) frame_ms=mssince(last_draw);
	last_draw=new Date();

	start_timer("draw");

	draw_timeouts_logic(2); stop_timer("draw","timeouts");

	calculate_fps();
	
	if(!(character && mouse_only) && 0) // disabled map movement for now, server needs to be updated at each move and stuff [24/07/16]
	{
		var speed=map.speed;
		if(character) speed=character.speed;
		speed*=frame_ms/1000.0;
		if((left_pressed || right_pressed) && (down_pressed || up_pressed)) speed/=1.41;
		if(left_pressed<right_pressed) map.real_x+=speed;
		if(left_pressed>right_pressed) map.real_x-=speed;
		if(up_pressed<down_pressed) map.real_y+=speed;
		if(up_pressed>down_pressed) map.real_y-=speed;
		
	}
	
	var cframe_ms=frame_ms,mframe_ms=frame_ms;
	if(clean_house) draw_entities(),mframe_ms=0;
	process_entities();
	future_entities={players:{},monsters:{}};
	stop_timer("draw","entities");

	if(gtest && character) map.real_x-=0.1,map.real_y-=0.001;

	
	// cframe_ms=min(2000,cframe_ms); // so the game won't freeze after a lengthy sleep - no need [26/07/16]
	//console.log(cframe_ms); console.log(map.x+" "+map.y);
	if(cframe_ms>(is_sdk&&200||10000)) console.log("cframe_ms is "+cframe_ms);
	while(cframe_ms>0)
	{
		if(character && character.moving)
		{
			moved=true;
			if(character.vx) character.real_x+=character.vx*min(cframe_ms,50)/1000.0;
			if(character.vy) character.real_y+=character.vy*min(cframe_ms,50)/1000.0;
			set_direction(character);
			stop_logic(character);
			// if(!character.moving) console.log("STOPPED");
		}
		cframe_ms-=50;
	}
	while(mframe_ms>0)
	{
		var moved=false;
		for(var iii in entities)
		{
			entity=entities[iii];
			if(entity && !entity.dead && entity.moving)
			{
				moved=true;
				entity.real_x+=entity.vx*min(mframe_ms,50)/1000.0;
				entity.real_y+=entity.vy*min(mframe_ms,50)/1000.0;
				set_direction(entity);
				stop_logic(entity);
			}
		}
		mframe_ms-=50;
		if(!moved) break;
	}
	if(window.ftile && character)
	{
		ftile.x=character.real_x;
		ftile2.y=ftile3.y=ftile.y=character.real_y;
		ftile2.x=ftile.x-500;
		ftile3.x=ftile.x+500;
	}
	stop_timer("draw","movements");

	position_map();

	ui_logic();

	call_code_function("on_draw"); // before retile_the_map, as retile_the_map updates drawings

	retile_the_map(); stop_timer("draw","retile");

	update_overlays();

	if(character && character.q.exchange && topleft_npc=="exchange") exchange_animation_logic();
	if(character && character.q.compound) compound_animation_logic();
	if(character && character.q.upgrade) upgrade_animation_logic();

	stop_timer("draw","uis");

	tint_logic();
	draw_timeouts_logic(); stop_timer("draw","timeouts");

	draw_entities(); // moved all the update_sprite routines to the absolute end - as they make the final visual changes to the sprites [03/10/18]

	stop_timer("draw","draw_entities");

	if(character) update_sprite(character);
	map_npcs.forEach(function(npc){ update_sprite(npc); });
	for(var id in chests) if(chests[id].openning) update_sprite(chests[id]);
	for(var id in map_animations) update_sprite(map_animations[id]);
	stop_timer("draw","sprites");

	stop_timer("draw","before_render");

	if(force_draw_on || !manual_draw && !is_hidden() && !paused)
	{
		renderer.render(stage);
		force_draw_on=false;
	}

	if(current_status!=last_status) $("#status").html(current_status),last_status=current_status;

	stop_timer("draw","after_render");
	var t;
	if(!manual_draw && (!no_html || no_html=="bot")) //  && !no_html [18/04/19] - let no_html call draw as usual too
	{

		if(no_graphics) t=setTimeout(draw,16); // jsdom patch [18/04/19]
		else requestAnimationFrame(draw);
		try{
			var chars=get_active_characters();
			for(var name in chars)
			{
				if(chars[name]!="self" && chars[name]!="loading") character_window_eval(name,"draw()");
			}
		}
		catch(e){console.log(e);}
	}
	in_draw=false;
}