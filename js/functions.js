var auto_api_methods=[],base_url=window.location.protocol+"//"+window.location.host;
var sounds={};
var draw_timeouts=[],timers={},pingts={},pings=[],modal_count=0,last_ping=new Date();
var DTM=1; // draw_timeout multiplier - floating point - ideally ~1, but if a 60fps calibrated animation is executed on 30fps, around ~2 [04/03/19]
var DMS=0; // ms after draw timeout trigger

function is_hidden()
{
	return document.hidden;
}

var last_id_sent='',last_xid_sent='';
function send_target_logic()
{
	var change=false;
	if(ctarget && last_id_sent!=(ctarget.id||"")) change=true;
	if(!ctarget && last_id_sent) change=true;
	if(xtarget && last_xid_sent!=(xtarget.id||"")) change=true;
	if(!xtarget && last_xid_sent) change=true;
	last_id_sent=ctarget&&ctarget.id||"";
	last_xid_sent=xtarget&&xtarget.id||"";
	if(change)
	{
		socket.emit("target",{id:last_id_sent,xid:last_xid_sent});
		return push_deferred("target");
	}
	return resolving_promise({success:true,no_change:true});
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

function cfocus(selector)
{
	var $selector=$(selector);
	if(!$(selector+":focus").length) $selector.focus();
	$selector.html($selector.html());
}

var last_typing=new Date();
function send_typing()
{
	if(mssince(last_typing)<1100) return;
	last_typing=new Date();
	socket.emit('property',{typing:true});
}

setInterval(function(){
	if(ssince(last_ping)>2.4)
		if(window.socket) ping(true);
},3200);

function push_ping(ping)
{
	last_ping=new Date();
	pings.push(ping);
	if(pings.length>40) pings.shift();
	if(character)
	{
		character.ping=0;
		pings.forEach(function(p){character.ping+=p/pings.length;})
	}
}

function ping(silent)
{
	var data={id:randomStr(5)};
	pingts[data.id]=new Date();
	if(!silent) data.ui=true;
	socket.emit("ping_trig",data);
}

function reset_ms_check(element,name,ms)
{
	element["ms_"+name]=null;
	//element["ms_"+name]=new Date();
	//element["ms_"+name].setMilliseconds(element["ms_"+name].getMilliseconds()-parseInt(ms/2));
}

function ms_check(element,name,ms)
{
	if(!element["ms_"+name]) {element["ms_"+name]=new Date(); return 0;} //new[13/03/17]
	if(element["ms_"+name] && mssince(element["ms_"+name])<ms) return 0;
	element["ms_"+name]=new Date();
	return 1;
}

function cached(key,value1,value2,value3)
{
	if(!window.GCACHED) window.GCACHED={};
	if(value2) value1+="|_"+value2;
	if(value3) value1+="|_"+value3;
	if(GCACHED[key]==value1) return true;
	GCACHED[key]=value1;
	return false;
}

function preview_all(element)
{
	if(!element) element=character;
	for(var i=0;i<3;i++)
		for(var j=0;j<4;j++)
			disappearing_clone(element,{i:i,j:j,x:get_x(element)+i*40,y:get_y(element)+j*40,stay:true,alpha:1,border:true})
}

function disappearing_clone(element,args)
{
	if(no_graphics) return;
	// console.log("Disappearing clone added"); // RIP .log - you'll be missed [14/01/18]
	if(!args) args={};
	var texture=element.texture,generated=false;
	if(args.random && element.stype=="full") texture=textures[element.skin][parseInt(Math.random()*3)][parseInt(Math.random()*4)];
	if(args.i!==undefined)
	{
		texture=textures[element.skin][args.i][args.j];
	}
	var sprite=new PIXI.Sprite(texture);
	if(element.cx)
	{
		if(args.i!==undefined) sprite.i=args.i,sprite.j=args.j;
		else sprite.i=element.i,sprite.j=element.j;
		sprite.skin=element.skin; sprite.cx=element.cx;
		cosmetics_logic(sprite);
		//texture=renderer.generateTexture(element,PIXI.SCALE_MODES.NEAREST,window.devicePixelRatio); <- boooo https://github.com/pixijs/pixi.js/issues/5125#issuecomment-423564450
		generated=true;
	}
	
	sprite.x=args.x||get_x(element);
	sprite.y=args.y||get_y(element)-1;
	sprite.width=element.width/(element.cscale||1);
	sprite.height=element.height/(element.cscale||1);

	if(args.rcolor) start_filter(sprite,"rcolor");
	
	//if(use_layers) sprite.parentGroup=element.parentGroup;
	//else sprite.displayGroup=element.displayGroup;
	sprite.anchor.set(0.5,1);
	if(sprite.cx && (args.alpha||0.8)!=1)
	{
		var filter=new PIXI.filters.AlphaFilter();
		filter.alpha=args.alpha||0.8;
		sprite.filters=[filter];
	}
	else sprite.alpha=args.alpha||0.8;

	if(args.border) border_logic(sprite);

	map.addChild(sprite);
	if(!args.stay) draw_timeout(fade_away(5,sprite),15);
}

// #NOTE: At this point, entity deletion routines seem a bit chaotic and mixed, for example deleting the entity in blink/magiport by mistake took 1-2 hours from me today, causes fatal issues [29/06/18]

function fade_out_blink(i,element)
{
	return function(){
		if(!element.fading_out) return;
		if(i==10 || is_hidden())
		{
			if(element==character) return;
		}
		else
		{
			element.real_alpha-=0.10;
			element.height+=(element.cscale||1);
			draw_timeout(fade_out_blink(i+1,element),30,1);
		}
	}
}


function fade_out_magiport(i,element)
{
	return function(){
		if(!element.fading_out) return;
		if(i==15 || is_hidden())
		{
			if(element==character) return;
			// destroy_sprite(element,"children"); These routines > should not remove < the entity ... messes the entire game logic [29/06/18]
		}
		else
		{
			element.real_alpha-=0.05;
			element.height-=(element.cscale||1);
			element.width-=(element.cscale||1);
			draw_timeout(fade_out_magiport(i+1,element),16,1);
		}
	}
}

function fade_away_teleport(i,element)
{
	return function(){
		if(i==10 || is_hidden())
		{
			if(element==character) return;
			destroy_sprite(element,"children");
		}
		else
		{
			element.real_alpha-=0.10;
			update_sprite(element);
			draw_timeout(fade_away_teleport(i+1,element),30,1);
		}
	}
}

function fade_away(i,element)
{
	return function(){
		if(i==20 || is_hidden())
		{
			// map.removeChild(element); - originally there was only this - it caused a major memory leak [19/08/16]
			destroy_sprite(element,"children"); //#TODO: consider calling .destroy({children:true}) [20/08/16]
		}
		else
		{
			element.real_alpha-=0.05;
			update_sprite(element);
			draw_timeout(fade_away(i+1,element),30,1);
		}
	}
}

function booster_modal_logic()
{
	$(".bitems").html(item_container({skin:G.items.cscroll1.skin},{name:"cscroll1"}));
	$(".bitemo").html(item_container({skin:G.items.offering.skin},{name:"offering"}));
	for(var i=1;i<=5;i++)
		$(".bitem"+i).html(item_container({skin:G.items.goldbooster.skin_a},{level:i,name:"goldbooster",expires:future_s(999999999)}));
}

var snip_wl_code="map_key(\"Q\",\"snippet\",\"smart_move('winterland')\");\n//Press Q in the Game to test this, after you EXECUTE!";
var snip_esc_code="map_key(\"ESC\",{name:\"eval\",code:\"use_skill('stop'); esc_pressed();\",skin:G.skills.stop.skin});\n//Overrides ESC, adds stopping, overrides the 'eval' icon with the 'stop' icon";
function keymap_modal_logic()
{
	[["1","charge"],["2","blink"],["3","supershot"],["4","invis"],["5","cleave"],["X","use_hp"],["Y","use_mp"]].forEach(function(ks){
		var k=ks[0],s=ks[1];
		$(".skb"+k).html(item_container({skid:k,skin:G.skills[s].skin,draggable:false},{"name":s}));
	});
	var html="";
	object_sort(K).forEach(function(k){
		html+="<span class='klabel'>"+k[1]+"</span>";
	});
	$(".skbkeys").html(html);
}

function show_game_guide()
{
	if(gameplay=="hardcore") show_modal($('#hardcoreguide').html(),{styles:''}); // background: #E5E5E5; color: #010805;
	else render_guide();
}

function show_shells_info()
{
	show_modal($('#shellsinfo').html(),{styles:'padding-left: 20px; padding-right: 20px; font-size: 24px;'});
}

function show_ttp()
{
	show_modal($('#ttp').html(),{wrap:false});
}

function show_credits()
{
	show_modal($('#credits').html(),{styles:'background: #E5E5E5; color: #010805; padding-left: 20px; padding-right: 20px; font-size: 24px; text-align: center',url:"/credits"});
}

function show_terms()
{
	show_modal($('#terms').html(),{styles:'background: #E5E5E5; color: #010805; padding-left: 20px; padding-right: 20px; font-size: 24px; text-align: center',url:"/terms"});
}

function show_privacy()
{
	show_modal($('#privacy').html(),{styles:'background: #E5E5E5; color: #010805; padding-left: 20px; padding-right: 20px; font-size: 24px; text-align: center',url:"/privacy"});
}

function show_opensource_info()
{
	show_modal($('#opensource').html(),{styles:'background: #E5E5E5; color: #010805; padding-left: 20px; padding-right: 20px; font-size: 24px; text-align: center'});
}

function hide_modal(force)
{
	var old_url=null,new_url=null;
	if(window.is_comm && mssince(last_focus)<320){
		 return;
	}
	if(!force && $('.modal:last input.mprotected[type="text"], .modal:last input.mprotected[type="email"], .modal:last input.mprotected[type="password"], .modal:last textarea.mprotected').filter(function(){return this.value.length>0;}).length)
	{
		return show_confirm("Are you sure you want to discard your entries?","Yes","No!",function(){hide_modal(); hide_modal(true);});
	}
	old_url=modals[modal_count-1] && modals[modal_count-1].url;
	if(modal_count>0) modal_count--;
	new_url=modals[modal_count-1] && modals[modal_count-1].url;
	if(window.page && (old_url||new_url)) window.history.replaceState({},page.title,new_url||page.url);
	if($('.modal:last').find(".destroy").length) eval($('.modal:last').find(".destroy").attr("onclick"));
	$('.modal:last').remove();
	if($('.modal:last').hasClass("hideinbackground"))
	{
		$('.modal:last').show();
		position_modals();
	}
	if(!modal_count)
	{
		block_right_clicks=true;
		if(0 && window.code)
		{
			$('#codeui').show();
			codemirror_render.refresh();
		}
		$(".showwithmodals").hide(); $(".hidewithmodals").show();
	}
}

function hide_modals()
{
	while(modal_count)
		hide_modal(true);
}

var modals=[];
function show_modal(mhtml,args)
{
	if(window.is_bot) return;
	if(!args) args={};
	if(!args.opacity && window.modal_opacity!==undefined) args.opacity=window.modal_opacity;
	else if(!args.opacity) args.opacity=0.4;
	if(!args.classes) args.classes="";
	if(args.hideinbackground) args.classes="hideinbackground";
	if(args.wrap===undefined) args.wrap=true;
	var wrap_styles="",min_width=600;
	min_width=min(600,$(window).width()-32);
	if(args.wrap) wrap_styles="width: "+(args.wwidth||min_width)+"px; border: 5px solid gray; background: black;";
	modals[modal_count]=args;
	modal_count++;
	var html="",styles="";
	styles+="position: fixed; top: 0px; bottom: 0px; left: 0px; right: 0px; z-index: 9000; text-align: center; vertical-align: middle; overflow-y: scroll; ";
	styles+="background: rgba(0,0,0,"+args.opacity+")";
		html+="<div style='"+styles+"' class='modal "+args.classes+"' onclick='if(stprlink(event)) return; hide_modal()'>"; //-> .modal is referenced at payments.js
		html+="<div style='display: inline-block; margin-bottom: 100px; margin-top: 40px; padding: 10px; text-align: left; position: relative; "+wrap_styles+" "+(args.styles||"")+"'";
			html+=" onclick='stprlink(event); /*return false*/' class='imodal'>"; // commented out "return false" for the Guide links
		html+=mhtml;
		if(args.ondestroy) html+='<div style="display:none" class="destroy" onclick="'+args.ondestroy+'"></div>';
		html+="</div>";
	html+="</div>";
	if($('.modal:last').hasClass("hideinbackground")) $('.modal:last').hide();
	$("body").append(html);
	var iheight=$('.imodal:last').height();
	if(height>iheight) $('.imodal:last').css("margin-bottom","0px").css("margin-top",max(0,round(height/2-iheight/2-5)));
	if($('.modal:last').find(".oncreate").length) eval($('.modal:last').find(".oncreate").attr("onclick"));
	block_right_clicks=false;
	$(".showwithmodals").show(); $(".hidewithmodals").hide();
	if(0 && window.code && !args.keep_code)
	{
		$('#codeui').hide();
		if(last_hint) $('#codehint').remove(),last_hint=undefined;
	}
	if(window.page && args.url) window.history.replaceState({},page.title,args.url);
}

function show_alert(x)
{
	show_modal("<div style='padding: 20px; text-align:center'><pre style='font-family: Pixel; font-size: 48px;'>"+x+"</pre></div>");
}

function position_modals()
{
	$('.imodal').each(function(){
		var $this=$(this),iheight=$this.height();
		if(height>iheight) $this.css("margin-bottom","0px").css("margin-top",max(0,round(height/2-iheight/2-5)));
		else $this.css("margin-bottom","40px").css("margin-top","100px");
	});
}

function set_status(html)
{
	current_status=html; // <- this is super important, otherwise the redraw's ruin the game, causing the cursor to flicker etc. [15/01/18]
	// $("#status").html(html);
	// Issue: when $("#status").html(html); is there, if you move your mouse into the character iframe, the mouse starts flickering
	// Challenge: when $("#status").html(html); is there, try to contain the overflow, or the mouse interaction, isolate the iframe
}

function show_json(json,args)
{
	// Originally safe_stringify(json,2); [15/02/19]
	var html="",name="",xhtml="";
	if(!args) args={};
	if(args.character_ui)
	{
		if(character && args.name==character.name) name="<span style='font-size:24px'><span style='color: gray'>Showing</span> parent.<span style='color: #39A920'>character</span></span>";
		else name="<span style='font-size:24px'><span style='color: gray'>Showing</span> parent.entities[<span style='color: "+colors.property+"'>\""+args.name+"\"</span>]</span>";
		html+="<div class='gamebutton' style='float: right' onclick='open_article(\"data-character\",\"/docs/code/character/reference\")'><span style='color:#22F4BE'>Docs:</span> Character Objects Explained</div>";
	}
	else if(args.monster_ui)
	{
		name="<span style='font-size:24px'><span style='color: gray'>Showing</span> parent.entities[<span style='color: #EF7A4D'>"+args.name+"</span>]</span>";
		html+="<div style='float: right; text-align: right'>"
			html+="<div class='gamebutton' onclick='open_article(\"data-monster\",\"/docs/code/monster/reference\")'><span style='color:#22F4BE'>Docs:</span> Monster Objects Explained</div>";
			html+="<div></div>";
			html+="<div class='gamebutton mt5' onclick='render_monster_info(\""+args.monster_ui+"\")'><span style='color:#EE8E5B'>Guide:</span> "+G.monsters[args.monster_ui].name+" Info</div>";
			html+="<div></div>";
			html+="<div class='gamebutton mt5' onclick='show_json(G.drops.monsters[\""+args.monster_ui+"\"],{name:\"G.drops.monsters."+args.monster_ui+"\",info:\"Use the item Tracktrix to see the entire drop list, including global drops.\"})'><span style='color:#B330EB'>Drops:</span> "+G.monsters[args.monster_ui].name+" Drops</div>";
		html+="</div>";
	}
	else if(args.inventory_ui!==undefined)
	{
		args.name=args.inventory_ui;
		name="<span style='font-size:24px'><span style='color: gray'>Showing</span> character.items[<span style='color: #EF7A4D'>"+args.name+"</span>]</span>";
		html+="<div style='float: right; text-align: right'>"
			if(character.items[args.name]) html+="<div class='gamebutton' onclick='render_item_info(\""+character.items[args.name].name+"\")'><span style='color:#22F4BE'>Ref:</span> Item Information</div>";
			html+="<div></div>";
			html+="<div class='gamebutton mt5' onclick='show_json(character.items,{prefix:\"character.\",name:\"items\"})'><span style='color:#5993F0'>Show:</span> All Inventory</div>";
		html+="</div>";
	}
	else if(args.name)
	{
		name="<span style='font-size:24px'><span style='color: gray'>Showing</span> "+(args.prefix||"")+"<span style='color: "+(args.color||"#EF7A4D")+"'>"+args.name+(args.postfix||"")+"</span></span>";
	}
	if(args.info)
	{
		xhtml+="<span style='font-size:24px'><span style='color: gray'>Info</span> "+args.info+"</span></span>";
	}
	if(!is_string(json)) json=safe_stringify(json,"\t");
	// IDEA: XHTML to reference the full object
	show_modal(html+name+"<div style='font-size: 24px; white-space: pre-wrap;' class='yesselect pre shcontainer'>"+syntax_highlight(json)+"</div>"+xhtml,{url:args.url});
}

function json_to_html(json)
{
	if(!is_string(json)) json=safe_stringify(json,"\t");
	return "<div style='font-size: 24px; white-space: pre;' class='yesselect shcontainer'>"+syntax_highlight(json)+"</div>";
}

function add_magiport(name)
{
	add_chat("^","<span style='color: white'>"+name+"</span> wants to magiport you! \
		<span class='clickable' style='color:#3E97AA' onclick='socket.emit(\"magiport\",{name:\""+name+"\"}); push_deferred(\"magiport\"); remove_chat(\"mp"+name+"\")'>Accept</span>",undefined,"mp"+name);
}

function add_invite(name)
{
	add_chat("^","<span style='color: white'>"+name+"</span> wants to party. \
		<span class='clickable' style='color:green' onclick='socket.emit(\"party\",{event:\"accept\",name:\""+name+"\"}); push_deferred(\"party\"); remove_chat(\"pin"+name+"\")'>Accept</span>",undefined,"pin"+name);
}

function add_challenge(name)
{
	add_chat("^","<span style='color: white'>"+name+"</span> challenged you to duel! \
		<span class='clickable' style='color:orange' onclick='socket.emit(\"duel\",{event:\"accept\",name:\""+name+"\"}); remove_chat(\"chl"+name+"\")'>Accept</span>",undefined,"chl"+name);
}

function add_duel(challenger,vs,id)
{
	add_chat("^","<span style='color: white'>"+vs+"</span> accepted a duel from "+challenger+"! \
		<span class='clickable' style='color:orange' onclick='socket.emit(\"duel\",{event:\"enter\",id:\""+id+"\"}); remove_chat(\"duel"+vs+"\")'>Join</span>",undefined,"duel"+vs);
}

function add_request(name)
{
	add_chat("^","<span style='color: white'>"+name+"</span> wants to join your party. \
		<span class='clickable' style='color:#119CC1' onclick='socket.emit(\"party\",{event:\"raccept\",name:\""+name+"\"}); push_deferred(\"party\"); remove_chat(\"rq"+name+"\")'>Accept</span>",undefined,"rq"+name);
}

function add_frequest(name)
{
	add_chat("^","<span style='color: white'>"+name+"</span> wants to be your friend. \
		<span class='clickable' style='color:#DB7BB3' onclick='socket.emit(\"friend\",{event:\"accept\",name:\""+name+"\"}); push_deferred(\"friend\"); remove_chat(\"frq"+name+"\")'>Accept</span>",undefined,"frq"+name);
}

function add_update_notes()
{
	update_notes.forEach(function(note){
		var color="gray";
		//if(note.indexOf("Happy New Year")!=-1) color="#C82F17";
		if(note.indexOf("Holiday")!=-1) color="#C82F17";
		if(note.indexOf("Duelland")!=-1) color="#3BB7CB";
		if(note.indexOf("Lunar")!=-1) color="#B02B16";
		if(note.indexOf("Valentine")!=-1) color="#C987B7"; // ,color="#85C76B"
		if(note.indexOf("Halloween")!=-1) color="#DE6E37";
		if(note.indexOf("Egg Hunt Event")!=-1) color="#DE5CB8";
		add_log(note,color);
	});
}

var game_logs=[],game_chats=[];

function clear_game_logs()
{
	game_logs=[];
	$("#gamelog").html("");
}

function add_log(message,color)
{
	// if(is_object(message)) throw "gg";
	if(is_object(message)) try{ message=JSON.stringify(message); }catch(e){ message="[Circular Object]"; }
	if(no_html=="bot") game_logs.push([message,color]);
	if(mode.dom_tests || inside=="payments" || no_html) return;
	if(game_logs.length>480) // previously 1000/720 [27/07/18]
	{
		var html="<div class='gameentry' style='color: gray'>- Truncated -</div>";
		game_logs=game_logs.slice(-160);
		game_logs.forEach(function(log){
			html+="<div class='gameentry' style='color: "+(log[1]||'white')+"'>"+log[0]+"</div>"
		});
		$("#gamelog").html(html);
	}
	game_logs.push([message,color]);
	$("#gamelog").append("<div class='gameentry' style='color: "+(color||'white')+"'>"+message+"</div>");
	var entity=$("#gamelog")[0];
	$("#gamelog").scrollTop(entity&&entity.scrollHeight);
}

function add_holiday_log()
{
	if(mode.dom_tests || inside=="payments" || no_html) return;
	$("#gamelog").append("<div class='gameentry' style='color: "+'white'+"'>Would you like to turn on the Holiday Tunes? <span style='color: #C82F17' class='clickable' onclick='xmas_tunes=true; sound_music=\"1\"; init_music(); reflect_music();  $(\".musicoff\").hide(); $(\".musicon\").show(); add_log(\"As a reminder, you can control Music from CONF\",\"gray\"); $(this).parent().remove();'>Yes!</span></div>");
	var entity=$("#gamelog")[0];
	$("#gamelog").scrollTop(entity&&entity.scrollHeight);
}
function add_greenlight_log()
{
	if(mode.dom_tests || inside=="payments" || no_html) return;
	$("#gamelog").append("<div class='gameentry' style='color: "+'white'+"'>Adventure Land is on Steam Greenlight! Would really appreciate your help: <a href='http://steamcommunity.com/sharedfiles/filedetails/?id=821265543' target='_blank' class='cancela' style='color: "+colors.xmas+"'>Browser</a> <a href='steam://url/CommunityFilePage/821265543' target='_blank' class='cancela' style='color: "+colors.xmasgreen+"'>Open: Steam</a></div>");
	var entity=$("#gamelog")[0];
	$("#gamelog").scrollTop(entity&&entity.scrollHeight);
}

var unread_chat=0,no_chat_notification=false;
function chat_inventory_logic()
{
	if(no_chat_notification) return;
	if(inventory)
	{
		unread_chat+=1;
		if(unread_chat==1) $(".newchatui").html("1 unread chat message!");
		else $(".newchatui").html(unread_chat+" unread chat messages!");
		$(".newchatui").css("display","inline-block");
	}
}

function rebuild_chat()
{
	var selector=(!window.character&&"#gamelog"||"#chatlog");
	var html="";
	if(game_chats.length>250)
	{
		html="<div class='chatentry' style='color: gray'>- Truncated -</div>";
		var new_chats=[];
		for(var i=0;i<game_chats.length;i++) // truncate unimportant stuff more
		{
			var log=game_chats[i];
			if(i<100 && !log[0]) continue;
			new_chats.push(log);
		}
		game_chats=new_chats.slice(-225);
	}
	game_chats.forEach(function(log){
		var o_html="",rrpt=log[4],rcolor="#999A4F";
		if(log[0] && log[0]!="^") o_html="<span style='color:white'>"+log[0]+":</span> ";
		if(log[2]==colors.server_success || log[2]=="gold") rcolor="#E0E0E0";
		if(log[2]==colors.server_failure) rcolor="#626363";
		if(rrpt>1) rrpt=" <span style='color:"+rcolor+"'>["+rrpt+"]</span>"; else rrpt="";
		html+="<div class='chatentry' style='color: "+(log[2]||'gray')+"'>"+o_html+(log[0]=="^"&&log[1]||html_escape(log[1]))+rrpt+"</div>";
	});
	$(selector).html(html);
}

function add_chat(owner,message,color,id)
{
	if(no_html=="bot") game_chats.push([owner,message,color,id]);
	if(no_html || window.is_comm) return;
	var selector=(!window.character&&"#gamelog"||"#chatlog"),owner_html='',rpt=1,deletion=false;
	for(var i=0;i<game_chats.length;i++)
	{
		if(id && game_chats[i][3]==id || game_chats[i][0]==owner && game_chats[i][1]==message && game_chats[i][3]==id)
		{
			if(owner && i!=game_chats.length-1) continue;
			rpt=game_chats[i][4]+1;
			game_chats.splice(i,1);
			deletion=true;
			break;
		}
	}

	if(game_chats.length>250 || deletion) // previously 240-180|150 - previously 360|180-270 [27/07/18]
		rebuild_chat();
	
	chat_inventory_logic();
	var rcolor="#999A4F";
	if(color==colors.server_success || color=="gold") rcolor="#E0E0E0";
	if(color==colors.server_failure) rcolor="#626363";
	game_chats.push([owner,message,color,id,rpt]);
	if(owner && owner!="^") owner_html="<span style='color:white'>"+owner+":</span> ";
	if(rpt>1) rpt=" <span style='color:"+rcolor+"'>["+rpt+"]</span>"; else rpt="";
	$(selector).append("<div class='chatentry' style='color: "+(color||'gray')+"'>"+owner_html+(owner=="^"&&message||html_escape(message))+rpt+"</div>");
	$(selector).scrollTop($(selector)[0].scrollHeight);
}

function remove_chat(id)
{
	var deletion=false;
	for(var i=game_chats.length-1;i>=0;i--)
	{
		if(game_chats[i][3]==id)
		{
			game_chats.splice(i,1);
			deletion=true;
		}
	}
	if(deletion) rebuild_chat();
}

function cpm_window(name)
{
	if(no_html) return;
	var cid="pm"+name;
	last_say=cid;
	if(!in_arr(cid,cwindows)) open_chat_window("pm",name,1);
	else toggle_chat_window("pm",name);
}

function add_pmchat(to,owner,message,xserver)
{
	if(no_html) return;
	var cid="pm"+to,color="";
	if(!in_arr(cid,cwindows)) open_chat_window("pm",to,owner==character.name);
	if(owner!=character.name && in_arr(cid,docked)) $("#chatt"+cid).addClass("newmessage");
	var owner_html='';
	xserver=xserver&&" <span style='color:#525553'>[X]</span>"||"";
	owner_html="<span style='color:white'>"+owner+":</span> ";
	$("#chatd"+cid).append("<div style='color: "+(color||'gray')+"'>"+owner_html+html_escape(message)+xserver+"</div>"); //class='chatentry' 
	$("#chatd"+cid).scrollTop($("#chatd"+cid)[0].scrollHeight);
}

function add_partychat(owner,message)
{
	if(no_html) return;
	var cid="party",color="";
	if(!in_arr(cid,cwindows)) open_chat_window("party","",owner==character.name);
	if(owner!=character.name && in_arr(cid,docked)) $("#chatt"+cid).addClass("newmessage");
	var owner_html='';
	owner_html="<span style='color:white'>"+owner+":</span> ";
	$("#chatd"+cid).append("<div style='color: "+(color||'gray')+"'>"+owner_html+html_escape(message)+"</div>"); //class='chatentry' 
	$("#chatd"+cid).scrollTop($("#chatd"+cid)[0].scrollHeight);
}

function refresh_page()
{
	window.location=window.location;
}

function item_position(name)
{
	for(var i=41;i>=0;i--)
	{
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return undefined;
}

function can_use(name)
{
	if(!next_skill[name] || (new Date())>next_skill[name]) return true;
	return false;
}

function send_code_message(to,data)
{
	if(!is_array(to)) to=[to];
	socket.emit("cm",{to:to,message:JSON.stringify(data)});
	return push_deferred("cm");
}

function get_nearby_hostiles(args)
{
	var hostiles=[];
	if(!args) args={};
	if(!args.range) args.range=character&&character.range||12000;
	if(!args.limit) args.limit=12;

	for(id in entities)
	{
		var current=entities[id];
		if(current.rip || current.invincible || current.npc) continue;
		if(character.team && current.team==character.team) continue;
		if(!character.team && current.party && character.party==current.party) continue;
		if(!character.team && current.guild && character.guild==current.guild) continue;
		if(current.type=="character" && !(is_pvp || G.maps[character.map].pvp)) continue;
		if(in_arr(current.owner,parent.friends)) continue;
		var c_dist=parent.distance(character,current);
		if(c_dist<args.range && hostiles.length<args.limit) hostiles.push(current),current.c_dist=c_dist;
	}
	hostiles.sort(function(a,b){return (a.c_dist > b.c_dist) ? 1 : ((b.c_dist > a.c_dist) ? -1 : 0);});
	return hostiles;
}

var input_onclicks=[];
function get_input(args)
{
	if(!args) return;
	var html="<div style='"+(!args.no_wrap&&"border: 5px solid gray; padding: 5px; background: black"||"")+"'>",ilast=0,focus=null;
	if(is_array(args)) args={elements:args};
	else if(!args.elements) args={elements:[args]};
	args.elements.forEach(function(element){
		if(element.title) html+="<div class='textheader'>"+element.title+"</div>";
		if(element.input)
		{
			if(!focus) focus=element.input;
			html+="<div style='margin-bottom: 4px'><input type='text' class='selectioninput mprotected "+element.input+"' placeholder='"+(element.placeholder||"")+"' value='"+(element.value||"")+"' style='"+(element.style||"")+"'/></div>";
		}
		if(element.textarea)
		{
			if(!focus) focus=element.textarea;
			html+="<div style='margin-bottom: 4px'><textarea class='selectiontextarea mprotected "+element.textarea+"' placeholder='"+(element.placeholder||"")+"' value='"+(element.value||"")+"' style='"+(element.style||"")+"'/></div>";
		}
		if(element.button)
		{
			input_onclicks[ilast++]=element.onclick;
			html+="<div class='gamebutton "+(element.small&&"gamebutton-small mb2"||"mb5")+"' onclick='smart_eval(input_onclicks["+(ilast-1)+"])' style='display:block'>"+element.button+"</div>";
		}
	});
	html+="</div>";
	show_modal(html,{wrap:false});
	if(focus) $("."+focus).focus();
}

function show_mail_modal()
{
	get_input([
			{title:"New Mail"},
			{input:"mrecipient",placeholder:"Recipient",style:"width: 320px; text-align: left !important;"},
			{input:"msubject",placeholder:"Subject",style:"width: 320px; text-align: left !important;"},
			{textarea:"mmsg",placeholder:"Message",style:"width: 324px; height: 74px; text-align: left !important;"},
			{button:"Send",onclick:function(){
				pcs();
				socket.emit('mail',{to:$(".mrecipient").val(),subject:$(".msubject").val(),message:$(".mmsg").val()});
				push_deferred("mail");
			}}
		])
}

var sc_onclick={};
function show_confirm(text,ok,cancel,onclick)
{
	var color="#328355",rid=randomStr(5);
	sc_onclick[rid]=onclick;
	var html="";
	html+="<div style='width: 400px; border: 5px solid gray; background-color: black; font-size: 24px'><div style='padding: 20px;'>"+text+"</div></div>";
	html+="<div style='width: 410px; text-align: right; font-size: 0px'>";
	if(is_array(ok)) color=ok[0],ok=ok[1];
		html+="<div class='gamebutton' style='border-color: "+color+"; margin: 6px 6px 6px 0px' onclick='sc_onclick[\""+rid+"\"]();'>"+ok+"</div>";
		html+="<div class='gamebutton' style='margin: 6px 0px 6px 6px' onclick='hide_modal();'>"+cancel+"</div>";
	html+="</div>";
	show_modal(html,{wrap:false});
}

function use_skill(name,target,arg)
{
	if(target && target.id) target=target.id;
	if(target && is_array(target))
		for(var i=0;i<target.length;i++)
		{
			if(target[i] && target[i].id) target[i]=target[i].id; // "3shot", "5shot"
			if(target[i] && target[i][0] && target[i][0].id) target[i][0]=target[i][0].id; // "cburst"
		}
	if(name=="use_hp" || name=="hp")
	{
		return use("hp");
	}
	else if(name=="use_mp" || name=="mp")
	{
		return use("mp");
	}
	else if(name=="regen_hp")
	{
		socket.emit("use",{item:"hp"});
		return push_deferred("use");
	}
	else if(name=="regen_mp")
	{
		socket.emit("use",{item:"mp"});
		return push_deferred("use");
	}
	else if(name=="stop")
	{

		move(character.real_x,character.real_y+0.00001)
		socket.emit("stop");
		code_eval_if_r("stop('smart')");
		return push_deferred("stop");
	}
	else if(name=="use_town" || name=="town")
	{
		if(character.rip)
		{
			socket.emit('respawn');
			return push_deferred("respawn");
		}
		else
		{
			socket.emit('town');
			return push_deferred("town");
		}
	}
	else if(name=="cburst")
	{
		if(is_array(target))
		{
			socket.emit("skill",{name:"cburst",targets:target});
		}
		else
		{
			var hostiles=get_nearby_hostiles({range:character.range-2,limit:12}),targets=[],mp=character.mp-200,hmp=parseInt(mp/hostiles.length);
			hostiles.forEach(function(hostile){
				targets.push([hostile.id,hmp]);
			});
			socket.emit("skill",{name:"cburst",targets:targets});
		}
	}
	else if(name=="3shot")
	{
		if(is_array(target))
		{
			socket.emit("skill",{name:"3shot",ids:target});
		}
		else
		{
			var hostiles=get_nearby_hostiles({range:character.range-2,limit:3}),ids=[];
			hostiles.forEach(function(hostile){
				ids.push(hostile.id);
			});
			socket.emit("skill",{name:"3shot",ids:ids});
		}
	}
	else if(name=="5shot")
	{
		if(is_array(target))
		{
			socket.emit("skill",{name:"5shot",ids:target});
		}
		else
		{
			var hostiles=get_nearby_hostiles({range:character.range-2,limit:5}),ids=[];
			hostiles.forEach(function(hostile){
				ids.push(hostile.id);
			});
			socket.emit("skill",{name:"5shot",ids:ids});
		}
	}
	else if(name=="pcoat")
	{
		var position=item_position("poison");
		if(position===undefined)
		{
			add_log("You don't have a poison sack","gray");
			return rejecting_promise({reason:"no_item"});
		}
		socket.emit("skill",{name:"pcoat",num:position});
	}
	else if(name=="revive")
	{
		var position=item_position("essenceoflife");
		if(position===undefined)
		{
			add_log("You don't have an essence","gray");
			return rejecting_promise({reason:"no_item"});
		}
		socket.emit("skill",{name:"revive",num:position,id:target});
	}
	else if(name=="entangle")
	{
		var position=item_position("essenceofnature");
		if(position===undefined) { add_log("You don't have an essence","gray"); return rejecting_promise({reason:"no_item"}); }
		socket.emit("skill",{name:"entangle",num:position,id:target});
	}
	else if(name=="poisonarrow")
	{
		var position=item_position("poison");
		if(position===undefined) { add_log("You don't have a poison sack","gray"); return rejecting_promise({reason:"no_item"}); }
		socket.emit("skill",{name:"poisonarrow",num:position,id:target});
	}
	else if(name=="shadowstrike" || name=="phaseout")
	{
		var position=item_position("shadowstone");
		if(position===undefined) { add_log("You don't have any shadow stones","gray"); return rejecting_promise({reason:"no_item"}); }
		socket.emit("skill",{name:name,num:position});
	}
	else if(name=="throw")
	{
		if(!character.items[arg]) { add_log("Inventory slot is empty","gray"); return rejecting_promise({reason:"no_item"}); }
		socket.emit("skill",{name:name,num:arg,id:target});
	}
	else if(name=="blink") socket.emit("skill",{name:"blink",x:target[0],y:target[1]});
	else if(name=="dash")
	{
		var d=character.direction;
		socket.emit("skill",{name:"dash",x:get_x(character)+[0,-40,40,0][d],y:get_y(character)+[40,0,0,-40][d]});
	}
	else if(name=="energize")
	{
		socket.emit("skill",{name:"energize",id:target,mp:arg});
	}
	else if(name=="stack") on_skill("attack");
	else if(name=="warp")
	{
		if(target && is_string(target) && !target[2]) target[2]=character.map;
		else if(!target || !target[2] || is_string(target)) 
		{
			var trset=false;
			for(var id in G.maps)
			{
				var map=G.maps[id];
				if(map.ignore || map.instance) continue;
				map.spawns.forEach(function(s){
					if(trset) return;
					if(Math.random()<0.02) trset=true,target=[s[0],s[1],id];
				});
			}
			if(!trset) target=[Math.random()*100,Math.random()*100,"main"];
		}
		socket.emit("skill",{name:"warp",x:target[0],y:target[1],'in':target[2]});
	}
	else if(G.skills[name] && G.skills[name].target)
		socket.emit("skill",{name:name,id:target});
	else if(G.skills[name])
		socket.emit("skill",{name:name});
	else
	{
		add_log("Skill not found: "+name,"gray");
		return rejecting_promise({reason:"no_skill"});
	}
	return push_deferred(name);
}

function on_skill(key,event)
{
	var skill=keymap[key],name=skill&&skill.name||skill;
	if(!skill) return;
	if(skill.type=="item")
	{
		var num=-1;
		for(i=character.items.length-1;i>=0;i--)
		{
			if(character.items[i] && character.items[i].name==skill.name) {num=i; break;}
		}
		if(num>=0)
		{
			var item=character.items[num];
			if(G.items[item.name].type=="stand" || G.items[item.name].stand)
			{
				if(character.stand) socket.emit("merchant",{close:1});
				else socket.emit("merchant",{num:num});
				push_deferred("merchant");
			}
			else
			{
				socket.emit("equip",{num:num});
				push_deferred("equip");
			}
		}
		else add_log("Item not found","gray");
	}
	else if(name=="attack")
	{
		var target=xtarget||ctarget;
		if(target && target.id)
		{
			socket.emit('attack',{id:target.id});
			push_deferred('attack');
		}
		else add_log("No target","gray");
	}
	else if(name=="heal")
	{
		var target=xtarget||ctarget;
		if(target && target.id)
		{
			socket.emit('heal',{id:target.id});
			push_deferred('heal');
		}
		else add_log("No target","gray");
	}
	else if(name=="blink")
	{
		if(event) blink_pressed=true;
		last_blink_pressed=new Date();
	}
	else if(name=="move_up")
	{
		arrow_up=true;
		next_minteraction="up";
		setTimeout(arrow_movement_logic,40);
	}
	else if(name=="move_down")
	{
		arrow_down=true;
		next_minteraction="down";
		setTimeout(arrow_movement_logic,40);
	}
	else if(name=="move_left")
	{
		arrow_left=true;
		next_minteraction="left";
		setTimeout(arrow_movement_logic,40);
	}
	else if(name=="move_right")
	{
		arrow_right=true;
		next_minteraction="right";
		setTimeout(arrow_movement_logic,40);
	}
	else if(name=="esc")
	{
		esc_pressed();
	}
	else if(name=="travel")
	{
		render_travel();
	}
	else if(name=="gm")
	{
		var buttons=[];
		hide_modal();
		buttons.push({button:"Travel",onclick:function(){ hide_modal(); render_gtravel(); }});
		buttons.push({button:"P Jump",onclick:function(){ socket.emit("gm",{action:"jump_list"}); }});
		buttons.push({button:"M Jump",onclick:function(){ hide_modal(); render_gmonsters(1); }});
		buttons.push({button:"Invincible",onclick:function(){ socket.emit("gm",{action:"invincible"}); hide_modal(); }});
		buttons.push({button:"Mute",onclick:function(){ hide_modal(); get_input({button:"Mute",onclick:function(){ socket.emit("gm",{action:"mute",id:$('.mglocx').val()}); hide_modal(true); },input:"mglocx",placeholder:"Name",title:"Character"}); }});
		buttons.push({button:"Jail",onclick:function(){ hide_modal(); get_input({button:"Jail",onclick:function(){ socket.emit("gm",{action:"jail",id:$('.mglocx').val()}); hide_modal(true); },input:"mglocx",placeholder:"Name",title:"Character"}); }});
		buttons.push({button:"Ban",onclick:function(){ hide_modal(); get_input({button:"Ban",onclick:function(){ socket.emit("gm",{action:"ban",id:$('.mglocx').val()}); hide_modal(true); },input:"mglocx",placeholder:"Name",title:"Character"}); }});
		// buttons.push({button:"Info",onclick:function(){ socket.emit("gm",{action:"server_info"}); }});
		get_input({no_wrap:true,elements:buttons});
	}
	else if(name=="interact")
	{
		npc_focus();
	}
	else if(name=="toggle_inventory")
	{
		render_inventory();
	}
	else if(name=="toggle_character")
	{
		toggle_character();
	}
	else if(name=="toggle_stats")
	{
		toggle_stats();
	}
	else if(name=="open_snippet")
	{
		show_snippet();
	}
	else if(name=="toggle_run_code")
	{
		toggle_runner();
	}
	else if(name=="toggle_code")
	{
		toggle_code();
		if(code) setTimeout(function(){ try{codemirror_render.focus();} catch(e){} },1);
	}
	else if(name=="snippet")
	{
		code_eval(skill.code);
	}
	else if(name=="emotion")
	{
		socket.emit('emotion',{name:skill.emotion});
	}
	else if(name=="eval" || name=="pure_eval")
	{
		smart_eval(skill.code);
	}
	else if(name=="magiport")
	{
		get_input({small:true,button:"Engage",onclick:function(){ use_skill("magiport",$('.mglocx').val()); hide_modal(1); },input:"mglocx",placeholder:"Name",title:"Magiport"});
	}
	else if(name=="throw")
	{
		use_skill(name,xtarget||ctarget,skill.num||0);
	}
	else use_skill(name,xtarget||ctarget);
}

function on_skill_up(key)
{
	var skill=keymap[key],name=skill&&skill.name||skill;
	if(!skill) return;
	if(skill=="blink")
	{
		blink_pressed=false;
		last_blink_pressed=new Date();
	}
	else if(name=="move_up")
	{
		arrow_up=false;
	}
	else if(name=="move_down")
	{
		arrow_down=false;
	}
	else if(name=="move_left")
	{
		arrow_left=false;
	}
	else if(name=="move_right")
	{
		arrow_right=false;
	}
}

function map_keys_and_skills()
{
	if(!skillbar.length)
	{
		if(character.ctype=="warrior" || character.ctype=="rogue") skillbar=["1","2","3","Q","R"];
		else if(character.ctype=="merchant") skillbar=["1","2","3","4","5"];
		else skillbar=["1","2","3","4","R"]; // "X"
	}
	if(!Object.keys(keymap).length)
	{
		if(character.ctype=="warrior") keymap={"1":"use_hp","2":"use_mp","3":"cleave","4":"stomp","5":"agitate","Q":"taunt","R":"charge"};
		else if(character.ctype=="mage") keymap={"1":"use_hp","2":"use_mp","Q":"light","R":"burst","6":"cburst","B":"blink","7":"magiport"};
		else if(character.ctype=="priest") keymap={"1":"use_hp","2":"use_mp","R":"curse","4":"partyheal","8":"darkblessing","H":"heal"};
		else if(character.ctype=="ranger") keymap={"1":"use_hp","2":"use_mp","3":"3shot","5":"5shot","6":"4fingers","R":"supershot"};
		else if(character.ctype=="rogue") keymap={"1":"use_hp","2":"use_mp","3":"quickpunch","5":"quickstab","R":"invis","Q":"pcoat"};
		else if(character.ctype=="merchant") keymap={"1":"use_hp","2":"use_mp","3":"mluck"};
		else if(character.ctype=="paladin") keymap={"1":"use_hp","2":"use_mp","3":"smash","4":"selfheal","R":"purify","Q":"mshield"};
		keymap["A"]="attack";
		keymap["I"]="toggle_inventory";
		keymap["C"]="toggle_character";
		keymap["U"]="toggle_stats";
		keymap["S"]="stop";
		keymap["\\"]="toggle_run_code"
		keymap["\\2"]="toggle_run_code"
		keymap["-"]="toggle_code"
		keymap[","]="open_snippet"
		keymap["F"]="interact";
		keymap["UP"]="move_up";
		keymap["DOWN"]="move_down";
		keymap["LEFT"]="move_left";
		keymap["RIGHT"]="move_right";
		keymap["X"]="use_town";
		keymap["0"]={"name":"snippet","code":"say('Hola')"};
		keymap["L"]={"name":"snippet","code":"loot()"};
		keymap["ESC"]="esc";
		keymap["T"]="travel";
		keymap["TAB"]={"name":"pure_eval","code":"var list=get_nearby_hostiles(); if(list.length) ctarget=list[0];"}
		keymap["N"]={"name":"pure_eval","code":"options.show_names=!options.show_names;"}
		keymap["ENTER"]={"name":"pure_eval","code":"focus_chat()"}
		keymap["SPACE"]={"name":"stand0","type":"item"}
	}
	for(name in keymap)
		if(keymap[name].keycode) K[keymap[name].keycode]=name;
}

var last_move=new Date();
function move(x,y,code)
{
	var map=map,move=calculate_move(character,parseFloat(x)||0,parseFloat(y)||0);
	// alert(move.x+" "+move.y);
	character.from_x=character.real_x;
	character.from_y=character.real_y;
	character.going_x=move.x;
	character.going_y=move.y;
	character.moving=true;
	calculate_vxy(character);
	// console.log("engaged move "+character.angle);
	var data={x:character.real_x,y:character.real_y,going_x:character.going_x,going_y:character.going_y,m:character.m};
	if(next_minteraction) data.key=next_minteraction,next_minteraction=null;
	socket.emit("move",data);
	last_move=new Date();
	resolve_deferreds("move",{reason:"interrupted"});
	if(code) return push_deferred("move");
}

function arrow_movement_logic()
{
	if(!window.socket) return;
	if(!window.character || !window.options.move_with_arrows || !can_walk(character)) return;
	if(arrow_up && arrow_left) move(character.real_x-50,character.real_y-50);
	else if(arrow_up && arrow_right) move(character.real_x+50,character.real_y-50);
	else if(arrow_up) move(character.real_x,character.real_y-50);
	else if(arrow_left && arrow_down) move(character.real_x-50,character.real_y+50);
	else if(arrow_left) move(character.real_x-50,character.real_y);
	else if(arrow_right && arrow_down) move(character.real_x+50,character.real_y+50);
	else if(arrow_right) move(character.real_x+50,character.real_y);
	else if(arrow_down) move(character.real_x,character.real_y+50);
}

function focus_chat()
{
	if(inventory) return;
	$(":focus").blur();
	if(last_say!="normal" && in_arr(last_say,cwindows) && !in_arr(last_say,docked)) $('#chati'+last_say).focus();
	else $('#chatinput').focus();
}

function gallery_click(name)
{
	render_item("#topleftcornerdialog",{id:"buying"+name,item:G.items[name],name:name,buying:true});
}

function condition_click(name)
{
	dialogs_target=xtarget||ctarget;
	render_condition("#topleftcornerdialog",name);
}

var last_invclick=-1;
function inventory_click(num,event)
{
	console.log(event);
	if(is_comm && event) return stpr(event);
	if(event && (event.which==2 || event.button==4))
	{
		inventory_middle(num,event)
	}
	else
	{
		var iname="";
		if(character.items[num]) iname=character.items[num].name+character.items[num].level;
		if(last_invclick && last_invclick==num+iname && $(".inventory-item").html().length)
			$(".inventory-item").html("");
		else if(character.items[num])
		{
			if(character.items[num].name=="placeholder") return;
			if(character.items[num].name=="computer") // gameplay=="hardcore" && 
			{
				return render_computer_network(".inventory-item");
			}
			render_item(".inventory-item",{id:"citem"+num,item:G.items[character.items[num].name],name:character.items[num].name,actual:character.items[num],num:num,inventory_ui:num});
			last_invclick=num+iname;
		}
	}
}

function inventory_middle(num,event)
{
	if(event && (event.which==2 || event.button==4))
	{
		if(character.items[num] && character.items[num].q && character.items[num].q>1)
		{
			if(character.items[num].q==2) split(num,1);
			else
			{
				get_input([
					{title:"(1-"+min(G.items[character.items[num].name].s||1,character.items[num].q-1)+")"},
					{input:"qt",placeholder:"Quantity",style:"width: 320px; text-align: left !important;"},
					{button:"Split",small:true,onclick:function(){
						pcs();
						split(num,$(".qt").val());
						hide_modal(1);
					}}
				]);
			}
		}
	}
}

function sh_click(i)
{
	dialogs_target=get_npc("secondhands");
	render_item("#topleftcornerdialog",{id:"sh"+i,item:G.items[secondhands[i].name],name:secondhands[i].name,actual:secondhands[i],secondhand:true});
}

function lf_click(i)
{
	dialogs_target=get_npc("lostandfound");
	render_item("#topleftcornerdialog",{id:"sh"+i,item:G.items[lostandfound[i].name],name:lostandfound[i].name,actual:lostandfound[i],lostandfound:true});
}

function wishlist_item_click(name,num)
{
	// render_item("#topleftcornerdialog",{item:G.items[name],name:name,wishlist:true,slot:"trade"+num,skin:G.items[name].skin,thumbnail:true});
	render_wishlist_item(name,num);
}

function wishlist_click(slot)
{
	var num=parseInt(slot.substr(5,123));
	render_wishlist(num,0);
}

var last_sclick="";
function slot_click(name)
{

	var target=xtarget||ctarget;
	if(last_sclick && last_sclick==name && $("#topleftcornerdialog").html().length)
	{
		$("#topleftcornerdialog").html(""); return;
	}
	if(target && target.slots && target.slots[name])
	{
		last_sclick=name;
		dialogs_target=target;
		render_item("#topleftcornerdialog",{id:"item"+name,item:G.items[target.slots[name].name],name:target.slots[name].name,actual:target.slots[name],slot:name,from_player:target.id});
	}
}

function pslot_click(key,name)
{
	var x=window['slots'+key];
	if(x && x[name])
	{
		var html="<div style='font-size: 24px; max-width: 800px; text-align: center' onclick='hide_modal()'>";
		html+=render_item("html",{id:"item"+name,item:G.items[x[name].name],name:x[name].name,actual:x[name],slot:name});
		html+="</div>";
		show_modal(html,{wrap:false,hideinbackground:true});
	}
}

function mslot_click(id,name)
{
	var target=merchants[id];
	if(target && target.slots && target.slots[name])
	{
		var html="<div style='font-size: 24px; max-width: 800px; text-align: center' onclick='hide_modal()'>";
		html+=render_item("html",{id:"item"+name,item:G.items[target.slots[name].name],name:target.slots[name].name,actual:target.slots[name],slot:name,from_player:target.name});
		html+="</div>";
		show_modal(html,{wrap:false,hideinbackground:true});
	}
}

function get_player(name)
{
	var target=null;
	if(character && name==character.name) target=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) target=entities[i];
	return target;
}

function get_entity(id)
{
	if(character && (id==character.id || id==character.name)) return character;
	if(entities[id]) return entities[id];
	return entities["$"+id];
}

function target_player(name)
{

	var ptarget=null;
	if(name==character.name) ptarget=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) ptarget=entities[i];
	if(!ptarget)
	{
		add_log(name+" isn't around","gray");
		return;
	}
	xtarget=ptarget;
}

function travel_p(name)
{
	if(party[name] && (party[name]['in']==party[name].map || party[name]['in']==character['in']))
	{
		call_code_function_f("smart_move",{x:party[name].x,y:party[name].y,map:party[name].map});
	}
	else
	{
		add_log("Can't find "+name,"gray");
	}
}

function party_click(name)
{
	var ptarget=null;
	if(name==character.name) ptarget=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) ptarget=entities[i];
	if(!ptarget)
	{
		add_log(name+" isn't around. <span class='clickable' onclick='pcs(event); travel_p(\""+name+"\")' style='color: #A78059'>Travel</span>","gray");
		return;
	}
	if(character.ctype=="priest")
	{
		player_heal.call(ptarget);
	}
	else
	{
		xtarget=ptarget;
	}
}

function attack_click()
{
	if(character.ctype=="priest" && ctarget && ctarget.type=="character")
	{
		player_heal.call(ctarget);
	}
	else if(character.ctype=="priest")
	{
		player_heal.call(character);
	}
	else if(ctarget && ctarget.type=="monster")
	{
		monster_attack.call(ctarget);
	}
}

function code_button_click(b)
{
	var $b=$(b),id=$b.data("id"),fn=code_buttons[id].fn;
	if(fn)
	{
		document.getElementById("maincode").contentWindow.buttons[id].fn();
	}
}

function npc_focus()
{
	var m_dist=102,selected=null,c_dist;
	if(!character) return;
	for(var id in entities)
	{
		if(!entities[id].npc) continue;
		var element=entities[id];
		c_dist=distance(element,character);
		if(c_dist<m_dist) m_dist=c_dist,selected=element;
	}
	map_doors.forEach(function(element){
		c_dist=distance(element,character);
		if(c_dist<m_dist) m_dist=c_dist,selected=element;
	});
	if(selected) selected.onrclick();
	else add_log("Nothing nearby","gray");
}

function locate_item(name)
{
	var loc=0;
	for(var i=0;i<character.items.length;i++)
	{
		if(character.items[i] && character.items[i].name==name) loc=i;
	}
	return loc;
}

function show_configure()
{
	add_log("Coming soon: Settings, Sounds, Music","gray");
	ping();
}

function list_soon()
{
	add_log("Coming soon: Settings, Sounds, Music, PVP (in 1-2 weeks), Trade (Very Soon!)","gray");
}

function transport_to(place,s)
{
	if(character.map==place) {add_log("Already here","gray"); return;}
	if(place=="underworld") {add_log("Can't reach the underworld. Yet.","gray"); return;}
	if(place=="desert") {add_log("Can't reach the desertland. Yet.","gray"); return;}
	socket.emit('transport',{to:place,s:s});
	return push_deferred("transport");
}

function show_transports()
{
	$("#rightcornerui").html($(".transports").html());
	topright_npc="transports";
}

function hide_transports()
{
	$("#rightcornerui").html('');
	topright_npc=false;
}

function execute_codemirror(button)
{
	$('.executei').remove();
	window.the_example=$(button).parent()[0].CodeMirror.getValue();
	$(button).parent().append("<div class='clickable enableclicks' style='position: absolute; top: 4px; right: 4px; z-index: 4;' onclick='$(\".executei\").remove();'><iframe src='/executor' style='width: 200px; height: 26px; border: 1px solid white; pointer-events: none;' class='executei' /></div>");
}

function eval_snippet()
{
	var code=codemirror_render3.getValue();
	code_eval(code);
}

function command_snippet()
{
	var code=codemirror_render3.getValue();
	if(code) socket.emit("o:command",code);
}

function show_commander(fvalue)
{
	if($(".snippetbtn").length) return;
	var html="<textarea id='rendererx'></textarea><div class='gamebutton snippetbtn' style='position: absolute; bottom: -68px; right: -5px' onclick='command_snippet()'>COMMAND</div>";
	show_modal(html);
	var value="";
	if(window.codemirror_render3)
	{
		value=codemirror_render3.getValue();
		// codemirror_render3.destroy(); Automatically garbage collected
	}
	window.codemirror_render3=CodeMirror(function(current){$("#rendererx").replaceWith(current);},{
		value:fvalue||value,
		mode:"javascript",
		indentUnit:4,
		indentWithTabs:true,
		lineWrapping:true,
		lineNumbers:true,
		gutters:["CodeMirror-linenumbers","lspacer"],
		theme:"pixel",
		cursorHeight:0.75,
		/*,lineNumbers:true*/
	});
	codemirror_render3.focus();
}

function show_snippet(fvalue)
{
	if($(".snippetbtn").length) return;
	var html="<textarea id='rendererx'></textarea><div class='gamebutton snippetbtn' style='position: absolute; bottom: -68px; right: -5px' onclick='tut(\"x\"); eval_snippet()'>EXECUTE</div>";
	show_modal(html);
	var value="";
	if(window.codemirror_render3)
	{
		value=codemirror_render3.getValue();
		// codemirror_render3.destroy(); Automatically garbage collected
	}
	window.codemirror_render3=CodeMirror(function(current){$("#rendererx").replaceWith(current);},{
		value:fvalue||value,
		mode:"javascript",
		indentUnit:4,
		indentWithTabs:true,
		lineWrapping:true,
		lineNumbers:true,
		gutters:["CodeMirror-linenumbers","lspacer"],
		theme:"pixel",
		cursorHeight:0.75,
		/*,lineNumbers:true*/
	});
	codemirror_render3.focus();
}

function eval_character_snippet(name)
{
	name=name.toLowerCase();
	character_code_eval(name,window["codemirror_render"+name].getValue());
}

function show_character_snippet(name)
{
	var oname=name;
	name=name.toLowerCase();
	var html="<textarea id='renderer"+name+"'></textarea><div class='gamebutton' style='position: absolute; bottom: -68px; right: -5px' onclick='eval_character_snippet(\""+name+"\")'>EXECUTE</div>";
	show_modal(html);
	var value="// "+oname+"\n";
	if(window["codemirror_render"+name])
	{
		value=window["codemirror_render"+name].getValue();
	}
	window["codemirror_render"+name]=CodeMirror(function(current){$("#renderer"+name).replaceWith(current);},{
		value:value,
		mode:"javascript",
		indentUnit:4,
		indentWithTabs:true,
		lineWrapping:true,
		lineNumbers:true,
		gutters:["CodeMirror-linenumbers","lspacer"],
		theme:"pixel",
		cursorHeight:0.75,
		/*,lineNumbers:true*/
	});
	window["codemirror_render"+name].focus();
}

function get_active_characters()
{
	var characters={};
	if(!character) return characters;
	characters[character.name]="self"
	$("iframe").each(function(){
		var $this=$(this),name=$this.data("name"),new_name=null;
		if(name)
		{
			var state="starting",lname=name.toLowerCase(),rid=$this.attr("id");
			// add_log(rid);
			if(document.getElementById(rid) && document.getElementById(rid).contentWindow)
			{
				state="loading";
				if(document.getElementById(rid).contentWindow.character)
				{
					new_name=document.getElementById(rid).contentWindow.character.name;
					state="active";
					if(document.getElementById(rid).contentWindow.code_active)
					{
						state="code";
					}
				}
			}
			if(new_name && new_name!=name)
				name=new_name,$this.attr("id","ichar"+name.toLowerCase()); // TEST server name correction [31/07/18]
			characters[name]=state;
		}
	});
	return characters;
}

function character_code_eval(name,snippet)
{
	var rid="ichar"+name.toLowerCase();
	var weval=document.getElementById(rid) && document.getElementById(rid).contentWindow && document.getElementById(rid).contentWindow.eval;
	if(!weval) { add_log("Character not found! ","#993D42"); return undefined; }
	if(document.getElementById(rid).contentWindow.code_active)
	{
		document.getElementById(rid).contentWindow.call_code_function("eval",snippet);
	}
	else if(document.getElementById(rid).contentWindow.code_run) add_log("CODE is warming up","#DC9E48")
	else
	{
		document.getElementById(rid).contentWindow.start_runner(0,"\nset_message('Snippet');\n"+snippet);
	}
}

function character_window_eval(name,snippet)
{
	var rid="ichar"+name.toLowerCase();
	var weval=document.getElementById(rid) && document.getElementById(rid).contentWindow && document.getElementById(rid).contentWindow.eval;
	if(!weval) { add_log("Character not found!","#993D42"); return undefined; }
	var result=true;
	try{
		weval(snippet);
	}
	catch(e)
	{
		result=false;
	}
	return result;
}

function character_load_code()
{

}

function code_eval(snippet)
{
	var f="eval";
	if(snippet.search("output=")!=-1 || snippet.search("json_output=")!=-1) f="eval_s";
	if(snippet.search("await")!=-1) snippet="(async () => {"+snippet+"})()";
	if(code_active)
	{
		call_code_function(f,snippet);
	}
	else if(code_run) add_log("CODE is warming up","#DC9E48")
	else
	{
		start_runner(0,"\nset_message('Snippet');\n"+snippet);
	}
}


function code_move(x,y)
{
	code_eval("smart_move({x:'"+x+"',y:'"+y+"'})")
}

function code_travel(map) // putting html into strings, then onclick's, ''s, ""s, gets impossible after a certain level [29/06/18]
{
	code_eval("smart_move({map:'"+map+"'})")
}

function direct_travel(to,s)
{
	socket.emit('transport',{to:to,s:s});
	return push_deferred("transport");
}

function start_character_runner(name,code_slot_or_name)
{
	var rid="ichar"+name.toLowerCase();
	if(gameplay=="test") rid+=randomStr(10);
	$("#"+rid).remove();
	var url=(window.page&&page.url)||(window.location+"");
	url=url.replace(character.name,name);
	url=url.split(".land"); url=url[1]||url[0];
	url=url.split(".com"); url=url[1]||url[0];
	url=url.split("?"); url=url[0];
	if(!code_slot_or_name) code_slot_or_name='';
	$('#iframelist').append('<div class="clickable" onclick="show_character_snippet(\''+name+'\')"><iframe src="'+url+'?no_html=true&is_bot=1&code='+code_slot_or_name+'" id="'+rid+'" style="border: 5px solid gray; background-color: black; margin-top: -5px; height: 60px; width: 128px; overflow: hidden; pointer-events: none" data-name="'+name+'"></iframe></div>');
	$("#iframelist").css("display","inline-block");
	return push_deferred(name);
}

function stop_character_runner(name)
{
	var rid="ichar"+name.toLowerCase();
	$("#"+rid).remove();
}

function start_runner(rid,code)
{
	tut("engage");
	//#MAINISSUE: Probably a Chrome bug, you press "ENGAGE", then ESC right after, iframe dies
	// pointer-events: none; is a life-saver, otherwise if you move cursor in, you are doomed, every message update breaks the game cursor
	if(!rid) rid="maincode";
	actual_code=false;
	if(code===undefined) code=codemirror_render.getValue(),actual_code=true;
	the_code=code;
	$('.engagebutton').hide(); $('.dengagebutton').show();
	$('.iengagebutton').hide(); $('.idengagebutton').css("display","inline-block");
	$("#"+rid).remove();
	if(no_html) $('body').append('<iframe src="/runner" id="'+rid+'" style="border: none; height: 1px; width: 1px; overflow: hidden; pointer-events: none"></iframe>');
	else $('#iframelist').append('<div class="clickable" onclick="show_snippet()"><iframe src="/runner" id="'+rid+'" style="border: 5px solid gray; background-color: black; margin-top: -5px; height: 60px; width: 128px; overflow: hidden; pointer-events: none"></iframe></div>');
	$("#iframelist").css("display","inline-block");
	code_run=true;
	code_persistence_logic();
}

function stop_runner(rid)
{
	if(!rid) rid="maincode";
	call_code_function("on_destroy");
	code_run=code_active=false;
	$('.engagebutton').show(); $('.dengagebutton').hide();
	$('.iengagebutton').css("display","inline-block"); $('.idengagebutton').hide();
	$("#"+rid).remove();
	socket.emit("code",{run:0});
	code_persistence_logic();
	if(sounds.empty) sounds.empty.stop(),sounds.empty.cplaying=false;
}

function set_setting(owner,key,value)
{
	var data=storage_get("settings_cache"),the_code="",to_run=false;
	data=data&&JSON.parse(data)||{};
	data[owner]=data[owner]||{};
	data[owner][key]=value;
	storage_set("settings_cache",JSON.stringify(data));
}

function get_settings(owner)
{
	var data=storage_get("settings_cache"),the_code="",to_run=false;
	data=data&&JSON.parse(data)||{};
	data[owner]=data[owner]||{};
	return data[owner];
}

function free_character(name)
{
	var character=null;
	X.characters.forEach(function(c){ if(name==c.name) character=c;})
	if(character)
	{
		var data=storage_get("code_cache"),the_code="",to_run=false;
		data=data&&JSON.parse(data)||{};
		try{ delete data["run_"+character.id]; } catch(e){}
		// try{ delete data["code_"+character.id]; } catch(e){}
		storage_set("code_cache",JSON.stringify(data));
		//var data=storage_get("settings_cache"),the_code="",to_run=false;
		//data=data&&JSON.parse(data)||{};
		//try{ delete data[character.id]; } catch(e){}
		//try{ delete data["global"]; } catch(e){}
		//storage_set("settings_cache",JSON.stringify(data));
		smart_eval($('.onbackbutton').attr('onclick'));
		add_log('Done!');
	}
	else
	{
		add_log('Character not found!');
	}
}

function get_code_slot()
{
	if(explicit_slot) return explicit_slot;
	var data=storage_get("code_cache"),the_code="",to_run=false;
	if(data)
	{
		data=JSON.parse(data);
		return data["slot_"+real_id]||real_id;
	}
	return real_id;
}


function backup_code_cache_once()
{
	if(storage_get("code_cache") && !storage_get("code_cache_backup"))
		storage_set("code_cache_backup",storage_get("code_cache"));
}

function code_persistence_logic()
{
	if(explicit_slot) return;
	try{
		var data=storage_get("code_cache"),the_code="",to_run=false,suffix="";
		// if(gameplay!="normal") suffix=gameplay;
		data=data&&JSON.parse(data)||{};
		if(!code_slot) code_slot=real_id;
		data["run_"+real_id+suffix]=actual_code&&code_run&&'1'||'';
		if(data["code_"+real_id+suffix]) code_change=true; // first-save - code is no longer locally saved [30/05/20]
		delete data["code_"+real_id+suffix];
		// if(gameplay=="hardcore") data["code_"+real_id+suffix]=codemirror_render.getValue();
		data["slot_"+real_id+suffix]=code_slot;
		storage_set("code_cache",JSON.stringify(data));
		if(code_change) api_call("save_code",{code:codemirror_render.getValue(),slot:code_slot,auto:true}),code_change=false;
		console.log("Code saved!");
	}
	catch(e){console.log(e);}
}

function toggle_runner()
{
	if(code_run)
	{
		stop_runner();
	}
	else
	{
		start_runner();
	}
}

var last_hint=undefined;
function code_logic()
{
	backup_code_cache_once();
	window.codemirror_render=CodeMirror(function(current){$("#code").replaceWith(current); current.classList.add("maincode");},{
		value:$('#dcode').val(),
		mode:"javascript",
		indentUnit:4,
		indentWithTabs:true,
		lineWrapping:true,
		lineNumbers:true,
		gutters:["CodeMirror-linenumbers","lspacer"], // "CodeMirror-lint-markers",
		theme:"pixel",
		cursorHeight:0.75,
		// lint:true,
		/*,lineNumbers:true*/
	});
	codemirror_render.on("change",function(){
		code_change=true;
	});
	listen_for_hints(codemirror_render);
}

function listen_for_hints(editor)
{
	editor.on('cursorActivity', function() {
		if(!code) return;
		var word=editor.findWordAt(editor.getCursor());
		var text=editor.getRange(word.anchor, word.head);


		
		if(text && !in_arr(text,["0"]) && (window[text] || in_arr(text,G.docs.functions)))
		{
			if(last_hint===undefined)
			{
				// $("body").append("<div id='codehint' onclick='load_documentation($(this).html())'></div>");
				$("#codelog").prepend("<div id='codehint' class='clickable' onclick='load_documentation($(\".thehint\").html())'></div>");
			}
			last_hint=text;
			$('#codehint').html("<span style='color: #716CBB'>[E]</span> <span class='thehint'>"+text+"</span>");
			$('#codehint').show();
		}
		else if(last_hint)
			$('#codehint').remove(),last_hint=undefined;
	});
}

function load_code(num,log)
{
	api_call("load_code",{name:num,run:'',log:log});
}

function remove_code_fx()
{
	delete stage.cfilter_ascii;
	delete stage.cfilter_bloom;
	regather_filters(stage);
}

function toggle_code()
{
	if(code)
	{
		$('.codeui').hide();
		code=false;
		$(":focus").blur(); // for the -_ button usage [26/04/17]
		remove_code_fx();
		$('#codehint').remove(); last_hint=undefined;
	}
	else
	{
		$('.codeui').show();
		code=true;
		codemirror_render.refresh();
		if(character && !character.moving && options.code_fx)
		{
			stage.cfilter_ascii=new PIXI.filters.AsciiFilter(16);
			stage.cfilter_bloom=new PIXI.filters.BloomFilter();
			regather_filters(stage);
		}
	}
}

function start_timer(name)
{
	timers[name]=new Date();
}

function stop_timer(name,extra)
{
	if(extra) extra="["+extra+"]"; else extra="";
	ms=mssince(timers[name]);
	if(name=="draw" && ms>10 || name=="remove_sprite")
	{
		if(log_flags.timers) console.log("timer["+name+"]"+extra+": "+mssince(timers[name]));
	}
	timers[name]=new Date();
}

function the_door()
{
	if(animatables.the_door) h_shake();
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"1");
	},200);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"2");
	},300);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"3");
	},400);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"4");
	},500);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"5");
	},600);
	draw_timeout(function(){
		if(animatables.the_door) h_shake();
	},2800);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"4");
	},2900);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"3");
	},3000);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"2");
	},3100);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"1");
	},3200);
	draw_timeout(function(){
		if(animatables.the_door) set_texture(animatables.the_door,"0");
	},3300);
}

function the_lever()
{
	socket.emit("interaction","the_lever");
	if(animatables.the_lever) h_minor();
	draw_timeout(function(){
		if(animatables.the_lever) set_texture(animatables.the_lever,"1");
	},100);
	draw_timeout(function(){
		if(animatables.the_lever) set_texture(animatables.the_lever,"2");
	},200);
}

function v_shake_minor()
{
	function displ(y)
	{
		return function(){
			stage.y+=y;
			ch_disp_y-=y;
		}
	}
	var i=0;
	[-1,1].forEach(function(d){
		setTimeout(displ(d),i++*20);
	})
}

function v_shake()
{
	function displ(y)
	{
		return function(){
			stage.y+=y;
			ch_disp_y-=y;
		}
	}
	var i=0;
	[-1,1,-2,2,-2,2,-1,1].forEach(function(d){
		setTimeout(displ(d),i++*40);
	})
}

function v_shake_i(e)
{
	function displ(e,y)
	{
		return function(){
			if(e==character) ch_disp_y-=y;
			else e.real_y-=y;
		}
	}
	var i=0;
	[-1,1,-2,2,-2,2,-1,1].forEach(function(d){
		setTimeout(displ(e,d),i++*40);
	})
}

function v_shake_i_minorX(e)
{
	function displ(e,y)
	{
		return function(){
			e.real_y-=y;
			if(y===1) delete e.shaking;
		}
	}
	var i=1;
	e.shaking=true;
	[-1,1].forEach(function(d){
		setTimeout(displ(e,d),i++*(round(400+Math.random()*300)));
	})
}

function v_shake_i2(e)
{
	function displ(e,y)
	{
		return function(){
			if(e==character) ch_disp_y-=y;
			else e.real_y-=y;
		}
	}
	var i=0;
	[-1,1,-1,1,-1,1,-1,1].forEach(function(d){
		setTimeout(displ(e,d),i++*20);
	})
}

function rshake_i_major(e)
{
	function displ(e,d)
	{
		return function(){
			if(e==character) stage.y-=d[1],stage.x-=d[0];
			else e.real_y-=d[1],e.real_x-=d[0];
		}
	}
	var i=0;
	[[-6,-4],[6,4],[6,4],[-6,-4]].forEach(function(d){
		setTimeout(displ(e,d),i++*10);
	})
}


function v_shake_i_minor(e) // display object only
{
	function displ(e,y)
	{
		return function(){
			e.y-=y;
		}
	}
	var i=0;
	[-1,1].forEach(function(d){
		setTimeout(displ(e,d),i++*20);
	})
}

function v_dive()
{
	function displ(y)
	{
		return function(){
			stage.y+=y;
			ch_disp_y-=y;
		}
	}
	var i=0;
	[-2,-1.5,-1.5,2,1,1,1].forEach(function(d){
		setTimeout(displ(d),i++*20);
	})
}

function v_dive_i(e)
{
	function displ(e,y)
	{
		return function(){
			if(e==character) ch_disp_y-=y;
			else e.real_y-=y;
		}
	}
	var i=0;
	[-2,-1.5,-1.5,2,1,1,1].forEach(function(d){
		setTimeout(displ(e,d),i++*20);
	})
}

function no_no_no(times)
{
	function displ(y)
	{
		return function(){
			ch_disp_x-=y;
		}
	}
	var i=0,arr=[-1,1,-1,1];
	if(times==2) arr=[-1,1,-1,1,-1,1,-1,1];
	arr.forEach(function(d){
		setTimeout(displ(d),i++*40);
	})
}

function yes_yes_yes(times)
{
	function displ(y)
	{
		return function(){
			ch_disp_y-=y;
		}
	}
	var i=0,arr=[-1,1,-1,1];
	if(times==2) arr=[-1,1,-1,1,-1,1,-1,1];
	arr.forEach(function(d){
		setTimeout(displ(d),i++*40);
	})
}

function jump_up(times)
{
	function displ(y)
	{
		return function(){
			ch_disp_y-=y;
		}
	}
	var i=0,arr=[-1,-2,2,1];
	arr.forEach(function(d){
		setTimeout(displ(d),i++*40);
	})
}

function sway(e) // This is the latest method, uncluding ch_disp/real_x logic [22/06/18]
{
	function displ(x,y)
	{
		return function(){
			if(e==character) ch_disp_x-=x,ch_disp_y-=y;
			else e.real_x-=x,e.real_y-=y;
		}
	}
	var i=0;
	[[-3,-3],[-3,-3],[-3,-3],[0,3],[0,3],[0,3],[3,0],[3,0],[3,0]].forEach(function(d){
		setTimeout(displ(d[0],d[1]),i++*16);
	})
}

function mojo(e)
{
	function displ(x,y)
	{
		return function(){
			if(e==character) ch_disp_x-=x,ch_disp_y-=y;
			else e.real_x-=x,e.real_y-=y;
		}
	}
	var i=0;
	[[-3,-3],[3,3],[-3,3],[3,-3],[3,3],[-3,-3],[-3,3],[3,-3]].forEach(function(d){
		setTimeout(displ(d[0],d[1]),i++*33);
	})
}

function flurry(e)
{
	function displ(x,y)
	{
		return function(){
			if(e==character) ch_disp_x-=x,ch_disp_y-=y;
			else e.real_x-=x,e.real_y-=y;
		}
	}
	var i=0;
	var arr=[[-2,-2],[-2,-2],[-2,-2],[6,6],[0,-2],[0,-4],[-4,0],[-2,0],[0,2],[0,2],[0,2],[2,0],[2,0],[2,0]];
	shuffle(arr);
	arr.forEach(function(d){
		setTimeout(displ(d[0],d[1]),i++*16);
	})
}

function h_minor()
{
	function displ(x)
	{
		return function(){
			stage.x+=x;
		}
	}
	var i=0;
	[-1,1,-1,1,-1,1,-1,1].forEach(function(d){
		setTimeout(displ(d),i++*30);
	})
}

function h_shake()
{
	function displ(x)
	{
		return function(){
			stage.x+=x;
			ch_disp_x-=x;
		}
	}
	var i=0;
	[-1,1,-2,2,-3,3,-3,3,-3,3,-2,2,-1,1].forEach(function(d){
		setTimeout(displ(d),i++*80);
	})
}

function bump_up(entity,amount)
{
	function displ(y)
	{
		return function(){
			if(entity==character) ch_disp_y-=y;
			else entity.real_y-=y;
		}
	}
	var i=0;
	[1,1,1,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5].forEach(function(d){
		setTimeout(displ(d*amount),i++*17);
	})
}

function animate_weapon(player,target)
{
	player.fx.attack=[new Date(),0];
}

function safe_y_move(sprite,y)
{
	if(sprite.me) ch_disp_y+=y;
	else sprite.real_y+=y,sprite.y_disp+=y;
}

function safe_x_move(sprite,x)
{
	if(sprite.me) ch_disp_x+=x;
	else sprite.real_x+=x;
}

function attack_animation_logic(sprite,source)
{
	var only_up=false,multiplier=1.5;
	if(sprite.type=="character") multiplier=3.5;
	if(in_arr(source,["partyheal"])) only_up=true;
	if(sprite.fx.aaa || sprite.fx.aaa===0) return;
	sprite.fx.aaa=sprite.a_direction;
	if(1)
	{
		if(sprite.fx.aaa==0 || only_up) safe_y_move(sprite,multiplier*2);
		else if(sprite.fx.aaa==3) safe_y_move(sprite,-multiplier*2);
		else if(sprite.fx.aaa==1) safe_x_move(sprite,-multiplier*2);
		else safe_x_move(sprite,multiplier*2);
		setTimeout(function(){
			if(sprite.fx.aaa==0 || only_up) safe_y_move(sprite,-multiplier);
			else if(sprite.fx.aaa==3) safe_y_move(sprite,multiplier);
			else if(sprite.fx.aaa==1) safe_x_move(sprite,multiplier);
			else safe_x_move(sprite,-multiplier);
		},60);
		setTimeout(function(){
			if(sprite.fx.aaa==0 || only_up) safe_y_move(sprite,-multiplier);
			else if(sprite.fx.aaa==3) safe_y_move(sprite,multiplier);
			else if(sprite.fx.aaa==1) safe_x_move(sprite,multiplier);
			else safe_x_move(sprite,-multiplier);
			sprite.fx.aaa=null;
		},120);
		if(sprite.moving)
			setTimeout(function(){
				if(sprite.moving && sprite.fx.aaa===null)
				{
					calculate_vxy(sprite);
					set_direction(sprite);
				}
			},240);
	}
}

function set_direction(sprite,mode)
{
	// console.log(sprite.name+" "+mode);
	if(mode!="soft" && sprite.moving && sprite.name_tag) start_name_tag(sprite);
	var edge=70,direction=0;
	if(mode=="npc") edge=45;
	if(abs(sprite.angle)<edge) direction=2;
	else if(abs(abs(sprite.angle)-180)<edge) direction=1;
	else if(abs(sprite.angle+90)<90) direction=3;
	sprite.a_direction=direction;
	if(mode!="soft") sprite.direction=direction;
}

function leave_references(sprite)
{
	sprite.visible=false;
	//sprite.transform={position:{x:sprite.real_x,y:sprite.real_y,copy:function(){}}};
	//sprite.position={x:sprite.real_x,y:sprite.real_y};
	//sprite.scale=sprite.transform.scale={x:1,y:1,copy:function(){}};
	//this._texture={orig:{width:10,height:10}};
	//sprite.x=sprite.real_x;
	//sprite.y=sprite.real_y;
	(function() {
		var xx=sprite.real_x,yy=sprite.real_y,wwidth=sprite.awidth||10,hheight=sprite.aheight||10;
		Object.defineProperty(sprite, "x", {
			get: function () { return xx },
			set: function(value) { xx=value; },
			configurable: true
		});
		Object.defineProperty(sprite, "y", {
			get: function () { return yy },
			set: function(value) { yy=value; },
			configurable: true
		});
		Object.defineProperty(sprite, "width", {
			get: function () { return wwidth },
			set: function(value) { wwidth=value; },
			configurable: true
		});
		Object.defineProperty(sprite, "height", {
			get: function () { return hheight },
			set: function(value) { hheight=value; },
			configurable: true
		});
	})();
}

function free_children(sprite)
{
	if(!sprite.children) return;
	for(var i=0;i<sprite.children.length;i++)
	{
		leave_references(sprite.children[i]);
		if(!sprite.children[i].dead) sprite.children[i].dead="map";
		sprite.children[i].parent=null;
	}
}

function remove_sprite(sprite)
{
	// console.log("start remove");
	if(no_graphics) return;
	try{ sprite.parent.removeChild(sprite); }catch(e){ console.log("Sprite is orphan, can't remove. Type: "+sprite.type); }
	leave_references(sprite);
	if(!sprite.dead) sprite.dead="vision";
	// console.log("end remove");
}

function destroy_sprite(sprite,mode)
{
	if(mode!="just") remove_sprite(sprite);
	try{
		if(mode=="children" || mode=="just") sprite.destroy({children:true});
		else sprite.destroy();
		leave_references(sprite);
		if(!sprite.dead) sprite.dead="vision";
	}catch(e){ console.log("Couldn't destroy sprite: "+sprite.type+" because: "+e); }
}

function wishlist(slot,name,price,q,level)
{
	if(!is_string(slot)) slot="trade"+slot;
	socket.emit("trade_wishlist",{q:q,slot:slot,price:price,level:level,name:name});
	$("#topleftcornerdialog").html("");
	return push_deferred("trade_wishlist");
}

function trade(slot,num,price,q)
{
	q=q||1;
	socket.emit("equip",{q:q,slot:slot,num:num,price:price});
	$("#topleftcornerdialog").html("");
	return push_deferred("equip");
}

function giveaway(slot,num,q,minutes)
{
	socket.emit("equip",{q:q||1,slot:slot,num:num,giveaway:true,minutes:minutes||0});
	$("#topleftcornerdialog").html("");
	return push_deferred("equip");
}

function join_giveaway(slot,id,rid)
{
	socket.emit("join_giveaway",{slot:slot,id:id,rid:rid});
	$("#topleftcornerdialog").html("");
	return push_deferred("join_giveaway");
}

function trade_buy(slot,id,rid,q)
{
	socket.emit("trade_buy",{slot:slot,id:id,rid:rid,q:q||1});
	$("#topleftcornerdialog").html("");
	return push_deferred("trade_buy");
}

function trade_sell(slot,id,rid,q)
{
	socket.emit("trade_sell",{slot:slot,id:id,rid:rid,q:q||1});
	$("#topleftcornerdialog").html("");
	return push_deferred("trade_sell");
}

function secondhand_buy(rid)
{
	socket.emit("sbuy",{rid:rid});
	$("#topleftcornerdialog").html("");
}

function lostandfound_buy(rid)
{
	socket.emit("sbuy",{rid:rid,f:true});
	$("#topleftcornerdialog").html("");
}

function buy_shells(amount)
{
	if((amount*G.multipliers.shells_to_gold)>character.gold) render_interaction("noshells");
	else
	{
		socket.emit("buy_shells",{gold:(amount*G.multipliers.shells_to_gold)});
		render_interaction("yesshells");
	}
}

function buy(name,quantity)
{
	if(G.items[name] && G.items[name].cash && !G.items[name].p2w && G.items[name].cash<=character.cash)
		return buy_with_shells(name,quantity);
	return buy_with_gold(name,quantity);
}

function buy_with_gold(name,quantity)
{
	if(name=="scroll0") tut("buyscrolls"); if(name=="cscroll0") tut("buycscroll0");
	if(mssince(last_npc_right_click)<100) return rejecting_promise({reason:"npc_misclickp"});
	socket.emit("buy",{name:name,quantity:quantity});
	$('.buynum').html($('.buynum').data('q'));
	return push_deferred("buy");
}

function buy_with_shells(name,quantity)
{
	if(mssince(last_npc_right_click)<100) return;
	socket.emit("buy_with_cash",{name:name,quantity:quantity});
	$('.buynum').html($('.buynum').data('q'));
	return push_deferred("buy_with_cash");
}

function split(num,quantity)
{
	socket.emit("split",{num:num,quantity:quantity});
	return push_deferred("split");
}

function sell(num,quantity)
{
	if(!quantity) quantity=1;
	socket.emit("sell",{num:num,quantity:quantity});
	try{
		$('.sellnum').html(max(0,character.items[num].q-quantity));
	}
	catch(e){
		$('.sellnum').html(0);
	}
	return push_deferred("sell");
}

var last_ccfunc=null;
function call_code_function_f(name,a1,a2,a3)
{
	if(code_active)
	{
		try{
			return get_code_function(name)(a1,a2,a3);
		}
		catch(e)
		{
			add_log(name+" "+e,colors.code_error);
			log_trace("call_code_function "+name,e);
		}
	}
	else
	{
		last_ccfunc=[name,a1,a2,a3];
		start_runner(0,"\nset_message('Snippet');\neval(parent.last_ccfunc[0])(parent.last_ccfunc[1],parent.last_ccfunc[2],parent.last_ccfunc[3])");
	}
}

function call_code_function(name,a1,a2,a3)
{
	try{
		return get_code_function(name)(a1,a2,a3);
	}
	catch(e)
	{
		add_log(name+" "+e,colors.code_error);
		log_trace("call_code_function "+name,e);
	}
}

function code_eval_if_r(code)
{
	code_active && document.getElementById("maincode") && document.getElementById("maincode").contentWindow && document.getElementById("maincode").contentWindow.eval && document.getElementById("maincode").contentWindow.eval(code);
}

function get_code_function(name)
{
	return code_active && document.getElementById("maincode") && document.getElementById("maincode").contentWindow && document.getElementById("maincode").contentWindow[name] || (function(){});
}

function private_say(name,message,code)
{
	socket.emit("say",{message:message,code:code,name:name});
	return push_deferred("say");
}

function party_say(message,code)
{
	socket.emit("say",{message:message,code:code,party:true});
	return push_deferred("say");
}

var last_say="normal";

function say(message,code)
{
	message=""+message;
	if(!message || !message.length) return;
	last_say="normal";
	if(message[0]=="/")
	{
		message=message.substr(1,2000);
		var components=message.split(" "),command=components.shift(),rest=components.join(" ");
		if(command=="help" || command=="list" || command=="")
		{
			add_chat("","/list");
			add_chat("","/uptime");
			add_chat("","/guide");
			add_chat("","/learn");
			add_chat("","/docs");
			add_chat("","/codes");
			add_chat("","/invite NAME");
			add_chat("","/request NAME");
			add_chat("","/kick NAME");
			add_chat("","/friend NAME");
			add_chat("","/leave");
			add_chat("","/challenge");
			add_chat("","/whisper NAME MESSAGE");
			add_chat("","/p MESSAGE");
			add_chat("","/ping");
			add_chat("","/pause");
			add_chat("","/eval CODE");
			add_chat("","/snippet");
			add_chat("","/start CHARACTERNAME CODE(OPT.)");
			add_chat("","/stop CHARACTERNAME");
			add_chat("","/stop");
			add_chat("","/stop invis");
			add_chat("","/stop teleport");
			add_chat("","/disconnect");
			add_chat("","/disconnect CHARACTERNAME");
			if(is_electron) add_chat("","/new_window")
			// add_chat("","/savecode /loadcode /runcode");
		}
		else if(is_electron && (command=="new_window" || command=="window" || command=="newwindow"))
		{
			window.open(base_url,"",{width:$(window).width(),height:$(window).height()});
		}
		else if(command=="start")
		{
			var args=rest.split(" "),name=args.shift(),code=args.shift();
			if(name) start_character_runner(name,code);
		}
		else if(command=="codes")
		{
			if(!is_electron) show_alert("Only works in game clients");
			else electron_open_codes();
		}
		else if(command=="leave")
		{
			socket.emit("party",{event:"leave"});
			push_deferred("party");
		}
		else if(command=="uptime")
		{
			add_chat("",to_pretty_num(parseInt(msince(inception)))+" minutes "+parseInt(ssince(inception)%60)+" seconds","gray");
		}
		else if(command=="duel" || command=="challenge")
		{
			var args=rest.split(" "),name=args.shift();
			var target=xtarget||ctarget;
			if(!name && target && target.name) socket.emit("duel",{event:"challenge",name:target.name});
			else if(name) socket.emit("duel",{event:"challenge",name:name});
			else add_chat("","No one to duel");
		}
		else if(command=="stop")
		{
			var args=rest.split(" "),name=args.shift();
			if(!name)
			{
				use_skill("stop");
			}
			else if(name=="teleport" || name=="town")
			{
				socket.emit("stop",{action:"town"});
				push_deferred("stop");
			}
			else if(name=="revival")
			{
				socket.emit("stop",{action:"revival"});
				push_deferred("stop");
			}
			else if(name=="invis")
			{
				socket.emit("stop",{action:"invis"});
				push_deferred("stop");
			}
			else
			{
				stop_character_runner(name);
			}
		}
		else if(command=="disconnect")
		{
			var args=rest.split(" "),name=args.shift();
			if(!name) window.location=base_url;
			else
			{
				api_call("disconnect_character",{name:name});
			}
		}
		else if(command=="p")
		{
			party_say(rest);
		}
		else if(command=="pause")
		{
			pause();
		}
		else if(command=="snippet")
		{
			show_snippet();
		}
		else if(command=="eval" || command=="execute")
		{
			code_eval(rest);
		}
		else if(command=="pure_eval")
		{
			eval(rest);
		}
		else if(command=="w" || command=="whisper" || command=="pm")
		{
			var args=rest.split(" "),name=args.shift(),rest=args.join(" ");
			if(!name || !rest)
			{
				add_chat("","Format: /w NAME MESSAGE");
			}
			else
			{
				private_say(name,rest);
			}
		}
		else if(command=="savecode")
		{
			var args=rest.split(" "),slot=args.shift(),name=args.join(" ");
			if(slot.length && !parseInt(slot))
			{
				add_chat("","/savecode NUMBER NAME");
				add_chat("","NUMBER can be from 1 to 100");
			}
			else
			{
				if(!slot) slot=1;
				api_call("save_code",{code:codemirror_render.getValue(),slot:slot,name:name});
			}
		}
		else if(command=="loadcode" || command=="runcode")
		{
			var args=rest.split(" "),name=args.shift();
			if(!name) name=1;
			api_call("load_code",{name:name,run:(command=="runcode" && "1" || "")});
		}
		else if(command=="ping")
		{
			ping();
		}
		else if(command=="whisper")
		{
			var target=xtarget||ctarget;
			if(target && !target.me && !target.npc && target.type=="character") private_say(target.name,rest);
			else add_chat("","Target someone to whisper");
		}
		else if(command=="party" || command=="invite")
		{
			var args=rest.split(" "),name=args.shift();
			var target=xtarget||ctarget;
			if(name && name.length) socket.emit('party',{event:'invite',name:name}),push_deferred("party");
			else if(target && !target.me && !target.npc && target.type=="character") socket.emit('party',{event:'invite',id:target.id}),push_deferred("party");
			else add_chat("","Target someone to invite");
		}
		else if(command=="kick")
		{
			var args=rest.split(" "),name=args.shift();
			var target=xtarget||ctarget;
			if(name && name.length) socket.emit('party',{event:'kick',name:name});
			else if(target && !target.me && !target.npc && target.type=="character") socket.emit('party',{event:'kick',id:target.id});
			else add_chat("","Target someone to kick");
		}
		else if(command=="request")
		{
			var args=rest.split(" "),name=args.shift();
			var target=xtarget||ctarget;
			if(name && name.length) socket.emit('party',{event:'request',name:name});
			else if(target && !target.me && !target.npc && target.type=="character") socket.emit('party',{event:'request',id:target.id});
			else add_chat("","Target someone to request party");
		}
		else if(command=="friend")
		{
			var args=rest.split(" "),name=args.shift();
			var target=xtarget||ctarget;
			if(name && name.length) socket.emit("friend",{event:"request",name:name}),push_deferred("friend");
			else if(target && !target.me && !target.npc && target.type=="character") socket.emit("friend",{event:"request",name:target.name}),push_deferred("friend");
			else add_chat("","Target someone to friend");
		}
		else if(command=="guide")
		{
			show_game_guide();
		}
		else if(command=="learn")
		{
			render_code_articles();
		}
		else if(command=="docs")
		{
			render_code_docs();
		}
		else if(code_active && document.getElementById("maincode") && document.getElementById("maincode").contentWindow && document.getElementById("maincode").contentWindow.handle_command)
		{
			if(document.getElementById("maincode").contentWindow.handle_command(command,rest)!=-1);
			else add_chat("","Command not found. You can add a `handle_command` function to your CODE to capture commands.")
		}
		else if(screenshot_mode && command=="p1")
		{
			add_chat("Wizard","Adventure Land is a 2D Pixel MMORPG","#D3C7A2");
		}
		else if(screenshot_mode && command=="p2")
		{
			add_chat("Amazon","20% off on all Elixirs","gray");
			add_chat("Healer","Economy is completely Merchant-to-Merchant, players leave their merchants in the town square to sell or buy items","#58BCA5");
		}
		else if(recording_mode && command=="r1")
		{
			ui_log("Item upgrade succeeded","white");
			ui_log("Item upgrade succeeded","white");
			ui_log("Item upgrade succeeded","white");
			ui_log("Item upgrade succeeded","white");
			// add_chat("Wizard","Higher monster hp means more gold from selling the drops, as calculations don't account for the hp based increase in drops","gray");
			add_chat("NewKid","hi","gray")
			add_chat("Wizard","hello :)","gray");
			add_chat("","SweetPea received a Mittens +9","#85C76B");
			add_chat("","Maela found a Mistletoe","#85C76B");
			add_chat("","Trexnamedted found a Candy Cane","#85C76B");
			// add_chat("Wizard","gz :)","gray");
		}
		else
		{
			add_chat("","Command not found. Suggestion: /list");
		}
	}
	else
	{
		socket.emit("say",{message:message,code:code});
		return push_deferred("say");
	}
	return resolving_promise({command:true});
}

function join(event)
{
	// event can be one of show_json(Object.keys(G.events))
	socket.emit('join',{name:event});
	return push_deferred('join');
}

function activate(num)
{
	if(character.items[num] && character.items[num])
	{
		socket.emit("booster",{num:num,action:"activate"});
		return push_deferred("booster");
	}
	else
		return rejecting_promise({reason:"no_item"});
}

function shift(num,to)
{
	socket.emit("booster",{num:num,action:"shift",to:to});
	return push_deferred("booster");
}

function open_merchant(num)
{
	socket.emit("merchant",{num:num});
	return push_deferred("merchant");
}

function close_merchant()
{
	socket.emit("merchant",{close:1});
	return push_deferred("merchant");
}

function donate(gold)
{
	if(gold===undefined)
	{
		var gold=parseInt($(".dgold").html().replace_all(",",""));
		if(!gold) gold=100000; gold=max(1,gold);
	}
	socket.emit("donate",{gold:gold});
}

function dice(direction,num,gold)
{
	if(direction==1) direction="up";
	if(direction==2) direction="down";
	socket.emit("bet",{type:"dice",dir:direction,num:num,gold:gold});
}

function quantity(name,level)
{
	var q=0;
	for(var i=0;i<character.items.length;i++)
	{
		if(character.items[i] && character.items[i].name==name && (character.items[i].level||0)==(level||0)) q+=character.items[i].q||1;
	}
	return q;
}

function auto_craft(name,code)
{
	var issue=null;
	if(!G.craft[name]) issue="recipe";
	else if(G.craft[name].gold<character.gold) issue="gold";
	else
	{
		G.craft[name].items.forEach(function(i){
			if(quantity(i[1],i[2])<i[0]) issue="items";
		});
	}
	if(issue)
	{
		if(issue=="recipe") add_log("Can't craft that item","gray");
		else if(issue=="gold") add_log("Not enough gold","gray");
		else if(issue=="items") add_log("Don't have the required items","gray");
		if(code)
			return rejecting_promise({reason:issue})
	}
	else
	{
		var items=[],k=0;
		G.craft[name].items.forEach(function(i){
			for(var j=0;j<character.items.length;j++)
			{
				if(character.items[j] && character.items[j].name==i[1] && (character.items[j].level||0)==(i[2]||0) && (character.items[j].q||1)>=i[0])
				{
					items.push([k++,j]);
					break;
				}
			}
		});
		socket.emit('craft',{items:items});
		return push_deferred("craft");
	}
}

var suppress_calculations=false;

function upgrade(item,scroll,offering,code,calculate)
{
	if(!code && calculate && suppress_calculations) return;
	if(!code && (item==null || (scroll==null && offering==null))) d_text("INVALID",character);
	else
	{
		socket.emit("upgrade",{item_num:item,scroll_num:scroll,offering_num:offering,clevel:(character.items[item]&&character.items[item].level||0),calculate:calculate});
		last_uping=new Date();
		return push_deferred("upgrade");
	}
}

function compound(item0,item1,item2,scroll,offering,code,calculate)
{
	if(!code && calculate && suppress_calculations) return;
	if(!code && (item0==null || item1==null || item2==null || scroll==null)) d_text("INVALID",character);
	else
	{
		socket.emit("compound",{items:[item0,item1,item2],scroll_num:scroll,offering_num:offering,clevel:(character.items[item0].level||0),calculate:calculate});
		return push_deferred("compound");
	}
}

function lock_item(num)
{
	if(num===undefined) num=l_item;
	socket.emit("locksmith",{num:num,operation:"lock"});
	return push_deferred("locksmith");
}

function seal_item(num)
{
	if(num===undefined) num=l_item;
	socket.emit("locksmith",{num:num,operation:"seal"});
	return push_deferred("locksmith");
}

function unlock_item(num)
{
	if(num===undefined) num=l_item;
	socket.emit("locksmith",{num:num,operation:"unlock"});
	return push_deferred("locksmith");
}

function deposit(amount)
{
	if(!G.maps[current_map].mount) { add_log("Not in the bank.","gray"); return rejecting_promise({reason:"not_in_bank"}); }
	tut("deposit");
	if(!amount) amount=$(".npcgold").html()||"";
	amount=amount.replace_all(",","").replace_all(".","");
	socket.emit("bank",{operation:"deposit",amount:parseInt(amount)});
	return push_deferred("bank");
}

function withdraw(amount)
{
	if(!G.maps[current_map].mount) { add_log("Not in the bank.","gray"); return rejecting_promise({reason:"not_in_bank"}); }
	if(!amount) amount=$(".npcgold").html()||"";
	amount=amount.replace_all(",","").replace_all(".","");
	socket.emit("bank",{operation:"withdraw",amount:parseInt(amount)});
	return push_deferred("bank");
}

var last_excanim=new Date(),exclast=0;
//var exccolors=["#ee4035","#f37736","#fdf498","#7bc043","#0392cf","#7bc043","#fdf498","#f37736"];
// var exccolors=["#ee4035","#f37736","#fdf498","#7bc043","#0392cf"];
//http://www.color-hex.com/color-palette/807

var exccolors1=["#f1c40f","#f39c12","#e74c3c","#c0392b","#8e44ad","#9b59b6","#2980b9","#3498db","#1abc9c"];
var exccolorsl=["#CD6F1A","#A95C15"];
var exccolorsg=["#EFD541","#9495AC"];
var exccolorsgray=["#7C7C7C","#5C5D5D","#3B3C3C"];
var exccolorsc=["#C82F17","#EBECEE"];
var exccolorscosmo=["#CE667E","#91D489","#26BEEA","#61F129","#8990EB","#EBD411"];
var exccolorssea=["#24A7CB","#EBECEE"];

function exchange_animation_logic()
{
	var exccolors=exccolors1;
	if(character.q.exchange.qs=="leather") exccolors=exccolorsl;
	if(character.q.exchange.qs=="lostearring") exccolors=exccolorsg;
	if(character.q.exchange.qs=="seashell") exccolors=exccolorssea;
	if(character.q.exchange.qs=="poof") exccolors=exccolorsgray;
	if(character.q.exchange.name && character.q.exchange.name.startsWith("cosmo")) exccolors=exccolorscosmo;
	if(in_arr(exchange_type,["mistletoe","ornament","candycane"])) exccolors=exccolorsc;
	if(mssince(last_excanim)>300)
	{
		last_excanim=new Date();
		$('#eitem').children().css("border-color",exccolors[exclast%exccolors.length]);
		$('.ering3').css("border-color",exccolors[(exclast+1)%exccolors.length]);
		$('.ering2').css("border-color",exccolors[(exclast+2)%exccolors.length]);
		$('.ering1').css("border-color",exccolors[(exclast+3)%exccolors.length]);
		exclast++;
	}
}

var u_valid=false,last_uchance=null,last_uchance_for="upgrade_or_compound";
function set_uchance(dchance,html)
{
	last_uchance=dchance; last_uchance_for=rendered_target; // retains calculations during reopen's [17/06/19]
	if(dchance=="?")
	{
		$(".uchance").css("color","#299C4C");
		$(".uchance").html("%??.??");
		return;
	}
	if(parseInt(dchance*10000000000)) u_valid=true;
	var chance=min(9999,(parseInt(dchance*10000)||0)),first=""+parseInt(chance/100),last=""+parseInt(chance%100);
	chance=chance/100;
	if(first.length==1) first="0"+first;
	if(last.length==1) last="0"+last;
	if(chance>95) color="#31C760";
	else if(chance>80) color="#259248";
	else if(chance>75) color="#56923B";
	else if(chance>60) color="#76922C";
	else if(chance>50) color="#8F8A23";
	else if(chance>40) color="#8E682D";
	else if(chance>30) color="#8E5744";
	else if(chance>20) color="#8E456A";
	else if(chance>10) color="#8E6087";
	else color="#AA3248";
	if(html) return [color,"%"+first+"."+last]
	$(".uchance").css("color",color);
	$(".uchance").html("%"+first+"."+last);
}

var uroll_colors=["#f1c40f","#f39c12","#e74c3c","#c0392b","#8e44ad","#9b59b6","#2980b9","#3498db","#1abc9c"];
var uroll_colors=["#868590"];
var uroll_characters=["|","/","-","\\"],last_uc=0;
function set_uroll(def,rhtml)
{
	var c=uroll_characters[last_uc++%uroll_characters.length],color=0;
	var html="";
	if(def.success) c="$",color="#49C528";
	if(def.failure) c="^",color="#9F1020";
	html+="<span style='color:"+(color||random_one(uroll_colors))+";'>"+c+"</span>";
	for(var i=3;i>=0;i--)
	{
		if(def.nums[i]!==undefined) html+="<span style='color:"+(color||"white")+"'>"+def.nums[i]+"</span>";
		else html+="<span style='color:"+(color||random_one(uroll_colors))+"'>"+parseInt(Math.random()*10)+"</span>";
		if(i==2) html+="<span style='color:"+(color||random_one(uroll_colors))+"'>.</span>";
	}
	if(rhtml) return html;
	$(".uroll").html(html);
}

var last_companim=new Date();
function compound_animation_logic()
{
	if(topleft_npc=="compound" && character.q.compound && character.items[character.q.compound.num] && character.items[character.q.compound.num].name=="placeholder")
	{
		var def=character.items[character.q.compound.num].p;
		if(mssince(last_companim)>120)
		{
			last_companim=new Date();
			set_uroll(def);
		}
	}
	if(character.map=="main" && Math.random()<0.4) random_spark({map:"main",x:G.maps.main.ref.c_mid[0]+5-Math.random()*10,y:G.maps.main.ref.c_mid[1]-Math.random()*6+1,'in':"main"},{color:"spark"});
}

var last_upganim=new Date(),last_uping=new Date();
function upgrade_animation_logic()
{
	if(topleft_npc=="upgrade" && character.q.upgrade && character.items[character.q.upgrade.num] && character.items[character.q.upgrade.num].name=="placeholder")
	{
		var def=character.items[character.q.upgrade.num].p;
		if(mssince(last_upganim)>120)
		{
			last_upganim=new Date();
			set_uroll(def);
		}
	}
	if(character.map=="main" && Math.random()<0.4) random_spark({map:"main",x:G.maps.main.ref.u_mid[0]+5-Math.random()*10,y:G.maps.main.ref.u_mid[1]-Math.random()*6+1,'in':"main"},{color:"spark"});
}

setInterval(function(){
	if(window.character && !character.q.upgrade && topleft_npc=="upgrade" && u_valid && u_item!==null && u_scroll!==null && mssince(last_uping)>1600) upgrade(u_item,u_scroll,u_offering,null,true),last_uping=new Date();
},1600);

function poof(is_code)
{
	var delay=2400;
	exchange_type="poof";
	if(is_code || 1)
	{
		socket.emit("destroy",{num:p_item,q:1,statue:true});
		return push_deferred("destroy");
	}
	function poof_trigger(p_item)
	{
		return function(){
			if(!exchange_animations) return;
			socket.emit("destroy",{num:p_item,q:1,statue:true});
		}
	}
	if(p_item==null) d_text("INVALID",character);
	else if(exchange_animations) d_text("WAIT FOR IT",character);
	else
	{
		exchange_animations=true;
		draw_timeout(poof_trigger(p_item),delay);
	}
}

function exchange(is_code)
{
	if(character.q.exchange)
	{
		d_text("WAIT",character);
		return rejecting_promise({reason:"in_progress"});
	}
	else if(!is_code && e_item==null)
	{
		d_text("INVALID",character);
		return rejecting_promise({reason:"invalid"});
	}
	else
	{
		socket.emit("exchange",{item_num:e_item,q:character.items[e_item].q});
		return push_deferred("exchange");
	}
}

function exchange_buy(token,name)
{
	var num=item_position(token);
	if(num==undefined)
	{
		d_text("NO TOKENS",character);
		return rejecting_promise({reason:"no_tokens"});
	}
	else
	{
		socket.emit("exchange_buy",{num:num,name:name,q:character.items[num].q});
		return push_deferred("exchange_buy");
	}
}

function craft()
{
	var items=[],j=false;
	for(var i=0;i<9;i++)
	{
		if(cr_items[i] || cr_items[i]===0) j=true,items.push([i,cr_items[i]]);
	}
	if(!j)
	{
		d_text("INVALID",character);
		return rejecting_promise({reason:"invalid"});
	}
	else
	{
		socket.emit("craft",{items:items});
		return push_deferred("craft");
	}
}

function dismantle()
{
	socket.emit("dismantle",{num:ds_item});
	return push_deferred("dismantle");
}

var u_retain=false,u_retain_t=false;
function reopen()
{
	if(options.retain_upgrades && u_item) u_retain=[u_item,u_scroll,u_offering];
	// u_offering=u_scroll=c_scroll=e_item=p_item=l_item=null; // so even if the fps is super-low, the upgrade won't trigger again + verified [14/08/16]
		
	draw_trigger(function(){
		var originals=[];
		if(rendered_target=="upgrade") originals=render_upgrade_shrine();
		else if(rendered_target=="compound") originals=render_compound_shrine();
		else if(rendered_target=="exchange") originals=render_exchange_shrine(exchange_type);
		else if(rendered_target=="gold") render_gold_npc();
		else if(rendered_target=="items") render_items_npc();
		else if(rendered_target=="craftsman") render_craftsman();
		else if(rendered_target=="dismantler") render_dismantler();
		else if(rendered_target=="none") render_none_shrine();
		else if(rendered_target=="locksmith") render_locksmith();
		// else if(rendered_target=="secondhands") render_secondhands(); // Manual resets
		if(inventory) reset_inventory();

		suppress_calculations=true; var ocheck=false;
		for(var i=0;i<originals.length;i++) if(originals[i]!==null) on_rclick($("#citem"+originals[i])[0]),ocheck=true;
		if(ocheck && last_uchance!==null && last_uchance_for==rendered_target) set_uchance(last_uchance);
		suppress_calculations=false;

		if(rendered_target!="upgrade") u_item=u_scroll=u_offering=null;
		if(rendered_target!="compound") c_items[0]=c_items[1]=c_items[2]=c_scroll=c_offering=null;
		if(rendered_target!=last_uchance_for) last_uchance=null;
		if(rendered_target!="exchange") e_item=null;

		if(u_retain && u_retain_t && rendered_target=="upgrade" && !character.q.upgrade)
		{
			// console.log(u_retain);
			for(var i=0;i<3;i++)
				if((u_retain[i] || u_retain[i]===0) && character.items[u_retain[i]]) on_rclick($("#citem"+u_retain[i])[0]);
			u_retain=u_retain_t=false;
		}
	});	
}

function esc_pressed()
{
	if(modal_count>0) hide_modal();
	else if(code) toggle_code();
	else if(topright_npc)
	{
		$("#rightcornerui").html('');
		topright_npc=false;
	}
	else if(topleft_npc && topleft_npc!="dice") topleft_npc=false;
	else if(xtarget) xtarget=null;
	else if(ctarget && ctarget.type=="character") ctarget=null;
	else if(inventory) draw_trigger(render_inventory);
	else if(skillsui) draw_trigger(render_skills);
	else if(topleft_npc=="dice") topleft_npc=false;
	$(":focus").blur();
}

function toggle_stats()
{
	if(topright_npc!="character") render_character_sheet();
	else
	{
		$("#rightcornerui").html('');
		topright_npc=false;
	}
}

function toggle_character()
{
	// if(xtarget && xtarget==character) xtarget=null;
	// else if(ctarget) topleft_npc=false,xtarget=character;
	// else if(ctarget==character && !topleft_npc) ctarget=null;
	// else topleft_npc=false,ctarget=character;
	if(xtarget && xtarget==character) xtarget=null;
	else if(ctarget==character && !topleft_npc) ctarget=null;
	else topleft_npc=false,xtarget=character;
}

function reset_inventory(condition)
{
	if(inventory)
	{
		if(condition && !in_arr(rendered_target,["upgrade","compound","exchange","npc","merchant","craftsman","dismantler","none","locksmith"])) return;
		render_inventory(true);
	}
}

function close_chests()
{
	for(var id in chests)
	{
		var chest=chests[id];
		if(chest.openning)
		{
			delete chest.openning;
			chest.frame=0;
			set_texture(chest,chest.frame);
		}
	}
}

function open_chest(id)
{
	var chest=chests[id];
	if(chest)
	{
		if(chest.openning && ssince(chest.openning)<5) return resolving_promise({sucess:false,in_progress:true,reason:"openning"});;
		draw_trigger(function(){
			var chest=chests[id];
			if(chest && !chest.openning)
			{
				chest.openning=new Date();
				set_texture(chest,++chest.frame);
			}
		});
	}
	socket.emit("open_chest",{id:id});
	return push_deferred("open_chest");
}

function generate_textures(name,stype)
{
	// console.log("generate_textures "+name+" "+stype);
	if(in_arr(stype,["full","wings","body","armor","skin","upper","tail","character"]))
	{
		var d=XYWH[name],width=d[2],height=d[3],dx=0,dy=0,prefix="",dyh=0,col_num=3;
		if(stype=="upper") prefix="upper",dyh=8;
		var a=G.dimensions[name];
		if(a)
		{
			width=a[0]; height=a[1];
			dx=round((d[2]-width)/2.0+(a[2]||0));
			dy=round(d[3]-height); // +(a[3]||0) height-disp was never used, removed to simplify [20/07/18]
		}
		textures[prefix+name]=[[null,null,null,null],[null,null,null,null],[null,null,null,null]];
		if(stype=="tail") col_num=4,textures[prefix+name].push([null,null,null,null]);
		for(var i=0;i<col_num;i++)
			for(var j=0;j<4;j++)
			{
				var rectangle = new PIXI.Rectangle(d[0]+i*d[2]+dx,d[1]+j*d[3]+dy,width,height-dyh);
				if(offset_walking && !a) rectangle.y+=2,rectangle.height-=2;
				textures[prefix+name][i][j]=new PIXI.Texture(C[FC[name]],rectangle);
			}
	}
	if(stype=="item")
	{
		// console.log(name);
		var skin=G.items[name].skin_c||G.items[name].skin;
		if(!G.positions[skin]) skin="placeholder";
		var rectangle = new PIXI.Rectangle(G.positions[skin][1]*20,G.positions[skin][2]*20,20,20);
		textures["item"+name]=[null,new PIXI.Texture(C[G.imagesets[G.positions[skin][0]||"pack_20"].file],rectangle)];
		if(G.items[name].skin_r)
		{
			var skin=G.items[name].skin_r;
			if(!G.positions[skin]) skin="placeholder";
			var rectangle = new PIXI.Rectangle(G.positions[skin][1]*20,G.positions[skin][2]*20,20,20);
			textures["item"+name][0]=new PIXI.Texture(C[G.imagesets[G.positions[skin][0]||"pack_20"].file],rectangle);
		}
		else
			textures["item"+name][0]=textures["item"+name][1];
	}
	if(in_arr(stype,["emblem","gravestone"]))
	{
		var d=XYWH[name];
		var rectangle = new PIXI.Rectangle(d[0],d[1],d[2],d[3]);
		textures[name]=new PIXI.Texture(C[FC[name]],rectangle);
	}
	if(stype=="machine")
	{
		var machine=name; name=machine.type;
		textures[name]=e_array(machine.frames.length);
		for(var i=0;i<machine.frames.length;i++)
		{
			var rectangle = new PIXI.Rectangle(machine.frames[i][0],machine.frames[i][1],machine.frames[i][2],machine.frames[i][3]);
			textures[name][i]=new PIXI.Texture(PIXI.utils.BaseTextureCache[G.tilesets[machine.set].file],rectangle);
		}
		if(machine.subframes)
		{
			textures[name+"sub"]=e_array(machine.subframes.length);
			for(var i=0;i<machine.subframes.length;i++)
			{
				var rectangle = new PIXI.Rectangle(machine.subframes[i][0],machine.subframes[i][1],machine.subframes[i][2],machine.subframes[i][3]);
				textures[name+"sub"][i]=new PIXI.Texture(PIXI.utils.BaseTextureCache[G.tilesets[machine.set].file],rectangle);
			}
		}
	}
	if(stype=="animation")
	{
		var a=G.animations[name];
		if(no_graphics) PIXI.utils.BaseTextureCache[a.file]={width:20,height:20}; //#NOGTODO
		var width=PIXI.utils.BaseTextureCache[a.file].width,fwidth=Math.floor(width/a.frames);
		var height=PIXI.utils.BaseTextureCache[a.file].height;
		textures[name]=e_array(a.frames);
		for(var i=0;i<a.frames;i++)
		{
			var rectangle = new PIXI.Rectangle(0+fwidth*i,0,fwidth,height);
			textures[name][i]=new PIXI.Texture(PIXI.utils.BaseTextureCache[a.file],rectangle);
		}
	}
	if(stype=="animatable")
	{
		var d=G.positions[name];
		textures[name]=e_array(d.length);
		var i=0;
		d.forEach(function(f){
			//console.log(JSON.stringify(f));
			//console.log(PIXI.utils.BaseTextureCache[G.tilesets[f[0].file]]);
			var rectangle = new PIXI.Rectangle(f[1],f[2],f[3],f[4]);
			textures[name][i++]=new PIXI.Texture(PIXI.utils.BaseTextureCache[G.tilesets[f[0]].file],rectangle);
		});
	}
	if(stype=="emote")
	{
		var d=XYWH[name];
		textures[name]=[null,null,null];
		for(var i=0;i<3;i++)
		{
			var rectangle = new PIXI.Rectangle(d[0]+i*d[2],d[1],d[2],d[3]);
			textures[name][i]=new PIXI.Texture(C[FC[name]],rectangle);
		}
	}
	if(in_arr(stype,["v_animation","head","hair","hat","s_wings","face","makeup","beard"]))
	{
		var d=XYWH[name];
		textures[name]=[null,null,null,null];
		for(var i=0;i<4;i++)
		{
			var rectangle = new PIXI.Rectangle(d[0],d[1]+i*d[3],d[2],d[3]);
			textures[name][i]=new PIXI.Texture(C[FC[name]],rectangle);
		}
	}
	if(in_arr(stype,["a_makeup","a_hat"]))
	{
		var d=XYWH[name];
		textures[name]=[[null,null,null],[null,null,null],[null,null,null],[null,null,null]];
		for(var i=0;i<4;i++)
		{
			for(var j=0;j<3;j++)
			{
				var rectangle = new PIXI.Rectangle(d[0]+j*d[2],d[1]+i*d[3],d[2],d[3]);
				textures[name][i][j]=new PIXI.Texture(C[FC[name]],rectangle);
			}
		}
	}
}

function restore_dimensions(sprite)
{
	sprite.height=sprite.texture.height*(sprite.cscale||1)/(sprite.mscale||1);
	sprite.width=sprite.texture.width*(sprite.cscale||1)/(sprite.mscale||1);
}

function set_texture(sprite,i,j)
{
	var c=i+""+j;
	sprite.i=i;
	sprite.j=j;
	if(sprite.cskin==c) return;
	if(sprite.stype=="upper")
	{
		sprite.texture=textures["upper"+sprite.skin][i][j];
	}
	if(in_arr(sprite.stype,["full","wings","body","armor","skin","tail","character"]))
	{
		sprite.texture=textures[sprite.skin][i][j];
	}
	if(sprite.stype=="animation")
	{
		sprite.texture=textures[sprite.skin][i%sprite.frames];
	}
	if(in_arr(sprite.stype,["v_animation","head","hair","hat","s_wings","face","makeup","beard"]))
	{
		sprite.texture=textures[sprite.skin][i%sprite.frames];
	}
	if(in_arr(sprite.stype,["a_makeup","a_hat"]))
	{
		sprite.texture=textures[sprite.skin][i%sprite.frames][j%3];
	}
	if(sprite.stype=="animatable")
	{
		sprite.texture=textures[sprite.skin][i%sprite.frames];
	}
	if(sprite.stype=="emote")
	{
		sprite.texture=textures[sprite.skin][i%3];
	}
	sprite.cskin=c;
}

function new_sprite(skin,stype,n)
{
	if(in_arr(stype,["full","wings","body","armor","skin","tail","character"]))
	{
		if(n=="renew")
		{
			var sprite=skin; skin=sprite.skin;
			if(!textures[skin]) generate_textures(skin,stype);
			sprite.texture=textures[skin][1][0];
		}
		else
		{
			if(!textures[skin]) generate_textures(skin,stype);
			var sprite=new PIXI.Sprite(textures[skin][1][0]);
		}
		sprite.cskin="10"; sprite.i=1; sprite.j=0;
	}
	if(stype=="item")
	{
		if(!textures["item"+skin]) generate_textures(skin,"item");
		var sprite=new PIXI.Sprite(textures["item"+skin][0]);
	}
	if(stype=="upper")
	{
		if(!textures["upper"+skin]) generate_textures(skin,"upper");
		var sprite=new PIXI.Sprite(textures["upper"+skin][1][0]);
		sprite.cskin="10"; sprite.i=1; sprite.j=0;
	}
	if(in_arr(stype,["head","hair","hat","s_wings","face","makeup","beard"]))
	{
		if(!textures[skin]) generate_textures(skin,stype);
		var sprite=new PIXI.Sprite(textures[skin][0]);
		sprite.cskin="0"; sprite.i=0;
		sprite.frames=4;
	}
	if(in_arr(stype,["a_makeup","a_hat"]))
	{
		if(!textures[skin]) generate_textures(skin,stype);
		var sprite=new PIXI.Sprite(textures[skin][0][0]);
		sprite.cskin="00"; sprite.i=0; sprite.j=0;
		sprite.frames=4;
	}
	if(in_arr(stype,["emblem","gravestone"]))
	{
		if(!textures[skin]) generate_textures(skin,"emblem");
		var sprite=new PIXI.Sprite(textures[skin]);
		sprite.cskin="";
	}
	if(stype=="machine")
	{
		if(!textures[skin.type]) generate_textures(skin,"machine");
		var sprite=new PIXI.Sprite(textures[skin.type][0]);
		sprite.cskin="0"; sprite.i=0;
	}
	if(stype=="v_animation")
	{
		if(!textures[skin]) generate_textures(skin,"v_animation");
		var sprite=new PIXI.Sprite(textures[skin][0]);
		sprite.cskin="0"+undefined; sprite.i=0;
		sprite.frame=0;
		sprite.frames=textures[skin].length;
	}
	if(stype=="animatable")
	{
		if(!textures[skin]) generate_textures(skin,"animatable");
		var sprite=new PIXI.Sprite(textures[skin][0]);
		sprite.cskin="0"+undefined; sprite.i=0;
		sprite.frame=0;
		sprite.frames=textures[skin].length;

	}
	if(stype=="animation")
	{
		if(!textures[skin]) generate_textures(skin,"animation");
		var sprite;
		if(G.animations[skin] && G.animations[skin].tiling) sprite=new PIXI.extras.TilingSprite(textures[skin][0],textures[skin][0].width,textures[skin][0].height);
		else sprite=new PIXI.Sprite(textures[skin][0]);
		sprite.cskin="0"+undefined; sprite.i=0;
		sprite.frame=0;
		sprite.frames=textures[skin].length;

		// var filter=new PIXI.filters.ColorMatrixFilter();
		// if(!sprite.filters) sprite.filters=[filter];
		// else sprite.filters.append(filter);
		// filter.desaturate(2);

	}
	if(stype=="emote")
	{
		if(!textures[skin]) generate_textures(skin,"emote");
		var sprite=new PIXI.Sprite(textures[skin][0]);
		sprite.cskin="0"+undefined; sprite.i=0;
		sprite.frame=0;
	}
	if(stype=="static")
	{
		var texture=textures["static_"+skin];
		if(!texture)
		{
			var position=G.positions[skin],file=G.tilesets[position[0]].file;
			var rectangle=new PIXI.Rectangle(position[1],position[2],position[3],position[4]);
			var texture=new PIXI.Texture(PIXI.utils.BaseTextureCache[file],rectangle);
			textures["static_"+skin]=texture;
		}
		var sprite=new PIXI.Sprite(texture);
		sprite.cskin=undefined+""+undefined;
	}
	sprite.skin=skin;
	sprite.stype=stype;
	sprite.updates=0;
	return sprite;
}

function recreate_wtextures()
{
	(window.wtextures||[]).forEach(function(t){if(t) t.destroy(); });
	wtile_width=max(width,screen.width);
	wtile_height=max(height,screen.height);
	for(var last_water_frame=0;last_water_frame<4;last_water_frame++)
	{
		var wsprite=new PIXI.extras.TilingSprite(textures[wtile_name][last_water_frame],wtile_width/scale+4*textures[wtile_name][0].width,wtile_height/scale+4*textures[wtile_name][0].height);
		wtextures[last_water_frame]=PIXI.RenderTexture.create(wtile_width+5*textures[wtile_name][0].width,wtile_height+5*textures[wtile_name][0].height,PIXI.SCALE_MODES.NEAREST,1);
		renderer.render(wsprite,wtextures[last_water_frame]);
		wsprite.destroy();
	}
	// console.log("recreated dtextures");
}

function recreate_dtextures()
{
	(window.dtextures||[]).forEach(function(t){if(t) t.destroy(); });
	dtile_width=max(width,screen.width);
	dtile_height=max(height,screen.height);
	for(var last_water_frame=0;last_water_frame<3;last_water_frame++)
	{
		var dsprite=new PIXI.extras.TilingSprite(tile_textures[current_map][GEO['default']][last_water_frame%tile_textures[current_map][GEO['default']].length],dtile_width/scale+3*dtile_size,dtile_height/scale+3*dtile_size);
		dtextures[last_water_frame]=PIXI.RenderTexture.create(dtile_width+4*dtile_size,dtile_height+4*dtile_size,PIXI.SCALE_MODES.NEAREST,1);
		renderer.render(dsprite,dtextures[last_water_frame]);
		dsprite.destroy();
	}
	// console.log("recreated dtextures");
	if(dtile) dtile.texture=dtextures[water_frame()];
}

function weather_frame()
{
	return [0,1,2,3][round(mssince(inception)/640)%4];
	//return [0,1,2,1][round(draws/30)%4];
}

function water_frame()
{
	return [0,1,2,1][round(mssince(inception)/480)%4];
	//return [0,1,2,1][round(draws/30)%4];
}

function new_map_tile(def)
{
	total_map_tiles++;
	if(def.length>1)
	{
		var s1=new PIXI.Sprite(def[0]);
		s1.textures=def;
		return s1;
	}
	return new PIXI.Sprite(def[0]);
}

function random_rotating_rectangle(entity,args)
{
	if(no_graphics) return;
	if(!entity.cxc.bg) return;
	if(!args) args={};
	var e=new PIXI.Graphics();
	var colors=[0x00F33E,0xF4212B,0xF8F837,0x517DF8,0xE14BF9,0x1EA4F9,0x6E1CF9,0xF7722D];
	if(args.color=="success") colors=[0x85C76B,0xADFF8B,0xEEFCEF];
	else if(args.color=="purple") colors=[0x9944C8,0x7C38A3,0xF4DAFF];
	var color=random_one(colors);
	var size=random_one([3,5,7]),x_step=random_one([1,-1,2,-2]),y_step=random_one([-0.5,0,1,2,3]),r_step=random_one([-0.2,0.2,-0.4,0.4]);
	e.lineStyle(3,color);
	e.beginFill(color);
	e.drawRect(-size/2,-size/2,size/2,size/2);
	e.rotation=Math.random();
	var filter=new PIXI.filters.PixelateFilter(7,7);
	e.filters=[filter];
	e.x=0;
	e.y=-15;
	entity.cxc.bg.addChild(e);
	function animate(step,x_step,y_step,r_step)
	{
		return function(){
			if(step>=10.6)
			{
				destroy_sprite(e);
			}
			else
			{
				//console.log(DTM);
				e.x-=x_step*DTM*2;
				e.y-=y_step*DTM*2;
				e.rotation-=r_step*DTM;
				e.opacity-=0.07*DTM;
				draw_timeout(animate(step+DTM,x_step,y_step,r_step),15);
			}
		}
	}
	draw_timeout(animate(0,x_step,y_step,r_step),15);
}

function random_spark(coord,args)
{
	if(no_graphics) return;
	if(!args) args={};
	var e=new PIXI.Graphics();
	var colors=[0x00F33E,0xF4212B,0xF8F837,0x517DF8,0xE14BF9,0x1EA4F9,0x6E1CF9,0xF7722D];
	if(args.color=="success") colors=[0x85C76B,0xADFF8B,0xEEFCEF];
	else if(args.color=="purple") colors=[0x9944C8,0x7C38A3,0xF4DAFF];
	else if(args.color=="spark") colors=[0xFAFCE5,0xFCFCF3,0xFBC993,0xC4FFE2];
	else if(args.color=="blue") colors=[hx("#477FDD"),hx("#86AEDD"),hx("#2F52DD")];
	var color=random_one(colors);
	var size=0.2,x_step=random_one([0.25,0.5,0,-0.25,-0.5]),y_step=random_one([0.25,0.5,0.75]),a_map=current_map;
	e.lineStyle(3,color);
	e.beginFill(color);
	e.drawRect(-size/2,-size/2,size/2,size/2);
	//var filter=new PIXI.filters.PixelateFilter(7,7);
	//e.filters=[filter];
	e.x=coord.x;
	e.y=coord.y;
	e.alpha=args.alpha||0.25;
	if(use_layers) e.parentGroup=player_layer;
	else e.displayGroup=player_layer;
	map.addChild(e);
	function animate(step,x_step,y_step)
	{
		return function(){
			if(step>=20.6 || a_map!=current_map)
			{
				destroy_sprite(e);
			}
			else
			{
				//console.log(DTM);
				e.x-=x_step*DTM*2;
				e.y-=y_step*DTM*2;
				e.height+=0.01*DTM;
				e.width+=0.01*DTM;
				e.alpha-=0.01*DTM;
				draw_timeout(animate(step+DTM,x_step,y_step),15);
			}
		}
	}
	draw_timeout(animate(0,x_step,y_step),15);
}

function weather_animation(type,args)
{
	if(!args) args={};
	var entity=new_sprite(type,"animation");
	entity.real_x=entity.x=args.x||0;
	entity.real_y=entity.y=args.y||0;
	entity.stype="animation";
	entity.atype="wmap";
	entity.last=0;
	entity.last_update=new Date();
	entity.interval=120;
	entity.parentGroup=entity.displayGroup=weather_layer;
	entity.id=randomStr(8);
	entity.y_disp=0;
	map.addChild(entity);
	map_animations[entity.id]=entity;
}

function small_success(entity,args)
{
	for(var j=0;j<4;j++)
		for(var i=0;i<30;i++)
		{
			draw_timeout(function(){ random_rotating_rectangle(entity,args); },i*16);
		}
}

function assassin_smoke(x,y,type)
{
	if(!type) type="explode_p";
	var d_height=1,d_width=1,d_y=3,interval=40,steps=12,d_x=0,a_map=current_map;
	if(type=="firecrackers")
	{
		type="crackle",d_height=1.5,d_width=1.5,interval=16,d_y=1,steps=6;
		var rx=Math.random();
		if(rx<0.3) d_x=0.5;
		if(rx>0.7) d_x=-0.5;
		if(rx<0.25) draw_timeout(function(){sfx("crackle0")},rx*40);
		else if(rx>0.75) draw_timeout(function(){sfx("crackle1")},rx*40);
	}
	var sprite=new_sprite(type,"animation");
	if(use_layers) sprite.parentGroup=player_layer;
	else sprite.displayGroup=player_layer;
	sprite.x=round(x);
	sprite.y=round(y);
	sprite.real_x=x;
	sprite.real_y=y+1;
	if(type=="explode_p")
	{
		sprite.width=16;
		sprite.height=16;
	}
	sprite.anchor.set(0.5,1);
	map.addChild(sprite);
	function assassin_smoke(step)
	{
		return function(){
			if(step>=steps || a_map!=current_map)
			{
				destroy_sprite(sprite);
			}
			else
			{
				sprite.x-=d_x;
				sprite.y-=d_y;
				sprite.height+=d_height;
				sprite.width+=d_width;
				sprite.frame++;
				set_texture(sprite,sprite.frame);
				draw_timeout(assassin_smoke(step+1),interval);
			}
		}
	}
	draw_timeout(assassin_smoke(1),interval);
}

function confetti_shower(entity,level)
{
	if(!entity) return;
	var interval=200,count=1,times=25,a_map=current_map;
	if(level==2) interval=150,count=2,times=60;
	if(is_hidden()) times=2;
	for(var i=0;i<times;i++)
	{
		for(var j=0;j<count;j++)
			draw_timeout(function(){
				if(entity.real_x===undefined) entity=get_entity(entity);
				if(!entity) return;
				if(entity!=character && a_map!=current_map) return;
				assassin_smoke(entity.real_x+(Math.random()*80-40),entity.real_y+(Math.random()*80-40),"confetti");
			},i*interval);
	}
}

function firecrackers(entity)
{
	interval=60,count=2,times=15;
	for(var i=0;i<times;i++)
	{
		for(var j=0;j<count;j++)
			draw_timeout(function(){
				if(entity.real_x===undefined) entity=get_entity(entity);
				if(!entity) return;
				var xy=random_away(entity.real_x,entity.real_y,30);
				assassin_smoke(xy[0],xy[1],"firecrackers");
				var xy=random_away(entity.real_x,entity.real_y,30);
				assassin_smoke(xy[0],xy[1],"firecrackers");
			},i*interval);
	}
}

function egg_splash(x,y)
{
	var d_height=2,d_width=2,d_y=3,interval=40,steps=3,d_x=0,a_map=current_map;
	var sprite=new_sprite("egg","animation");
	if(use_layers) sprite.parentGroup=player_layer;
	else sprite.displayGroup=player_layer;
	sprite.x=round(x);
	sprite.y=round(y);
	sprite.real_x=x;
	sprite.real_y=y+1;
	sprite.anchor.set(0.5,1);
	map.addChild(sprite);
	function egg_s(step)
	{
		return function(){
			if(step>=steps || a_map!=current_map)
			{
				destroy_sprite(sprite);
			}
			else
			{
				//sprite.x-=d_x;
				//sprite.y-=d_y;
				sprite.height+=d_height;
				sprite.width+=d_width;
				sprite.frame++;
				set_texture(sprite,sprite.frame);
				draw_timeout(egg_s(step+1),interval);
			}
		}
	}
	draw_timeout(egg_s(1),interval);
}

function start_emblem(sprite,name,args)
{
	if(!args) args={};
	if(sprite.emblems[name]) { sprite.emblems[name].frames=args.frames||225; return; }
	var esprite=new_sprite(name,"emblem");
	if(args.no_dip) esprite.frame_list=[0.57,0.60,0.63,0.66,0.69,0.72,0.75,0.78,0.82,0.86,0.90,0.95,1];
	else esprite.frame_list=[0.2,0.33,0.66,0.77,0.88,0.95,1];
	for(var i=esprite.frame_list.length-1;i>=0;i--) esprite.frame_list.push(esprite.frame_list[i]);
	esprite.frame_list
	sprite.emblems[name]=esprite;
	esprite.frames=args.frames||225;
	esprite.x=-0.5;
	esprite.y=-6;
	esprite.anchor.set(0.5,0.5);
	esprite.parentGroup=animation_layer;
	esprite.alpha=0.33;
	sprite.addChild(esprite);
}

function stop_emblem(sprite,name)
{
	if(sprite.emblems[name]) sprite.emblems[name].frames=0;
}

function start_animation(sprite,name,mode)
{
	if(no_graphics) return;
	if(sprite.animations[name]) { sprite.animations[name].frame=0; return }
	var asprite=new_sprite(name,"animation"),width=(sprite.hitArea && sprite.hitArea.width || sprite.texture.width),height=(sprite.hitArea && sprite.hitArea.height || sprite.texture.height);
	var def=G.animations[name];
	sprite.animations[name]=asprite;
	if(def.alpha) asprite.alpha=def.alpha;
	else asprite.alpha=0.5;
	if(mode=="stun")
	{
		asprite.continuous=true;
		asprite.width=round(width*2/3.0);
		asprite.height=round(height/3);
		asprite.y=-height+8;
	}
	if(def.continuous) asprite.continuous=true;
	if(def.exact);
	else if(def.bubble)
	{
		def.y=27;
	}
	else if(def.continuous)
	{
		asprite.height=round(height*0.95);
	}
	else if(def.proportional)
	{
		if(1.0*asprite.height*width/asprite.width>height)
		{
			asprite.height=height;
			asprite.width=ceil(1.0*asprite.width*height/asprite.height);
		}
		else
		{
			asprite.height=ceil(1.0*asprite.height*width/asprite.width);
			asprite.width=sprite.width;
		}
	}
	else if(def.size)
	{
		asprite.width=round(width*def.size);
		asprite.height=round(height*def.size);
	}
	else
	{
		asprite.width=width;
		asprite.height=height;
	}
	if(name=="revival")
	{
		asprite.height=sprite.texture.height;
		asprite.width=sprite.texture.width;
	}
	if(def.speeding) asprite.speeding=true;
	if(def.front) asprite.y_disp=-30;
	if(def.y) asprite.y=-def.y;
	asprite.zy=1200;
	asprite.aspeed=def.aspeed;
	asprite.aspeed=(asprite.aspeed=="fast"&&0.8)||(asprite.aspeed=="mild"&&1.4)||(asprite.aspeed=="slow"&&3)||2
	asprite.anchor.set(0.5,1);
	sprite.addChild(asprite);
}

function map_animation(name,args)
{
	if(no_graphics) return;
	if(!args) args={};
	var asprite=null;
	if(args.item) asprite=new_sprite(name,"item");
	else asprite=new_sprite(name,"animation");
	var width=asprite.width,height=asprite.height;
	var def=G.animations[name]||{};
	asprite.atype="map";
	asprite.continuous=true;
	asprite.speeding=true;
	asprite.aspeed=def.aspeed;
	asprite.aspeed=(asprite.aspeed=="fast"&&0.8)||(asprite.aspeed=="mild"&&1.4)||(asprite.aspeed=="slow"&&3)||2
	asprite.anchor.set(0.5,0.5);
	if(def.front) asprite.y_disp=-30;
	asprite.parentGroup=asprite.displayGroup=player_layer;
	asprite.anchor.set(0.5,1);
	asprite.x=args.x||0;
	asprite.y=args.y||0;
	asprite.m=args.m||0;
	asprite.limit=args.limit||16;
	asprite.framefps=def.framefps||15;
	asprite.last_frame=new Date();
	asprite.last_update=new Date();
	asprite.id=args.id||randomStr(8);
	if(def.directional) asprite.directional=true;
	asprite.speed=args.speed||def.speed||10;
	asprite.to_fade=(args.fade===true&&0.025)||args.fade;
	if(args.filter) asprite.filters=[args.filter];
	if(args.scale||def.scale) asprite.scale.set(args.scale||def.scale,args.scale||def.scale);
	if(args.target)
	{
		asprite.target=args.target;
		asprite.going_x=get_x(args.target);
		asprite.going_y=get_y(args.target)-get_height(args.target)/2;
		if(point_distance(asprite.x,asprite.y,asprite.going_x,asprite.going_y)<100) asprite.speed*=0.75;
	}
	map_animations[asprite.id]=asprite;
	map.addChild(asprite);
}

function continuous_map_animation(name,origin,target)
{
	if(no_graphics) return;
	var asprite=new_sprite(name,"animation"),width=asprite.width,height=asprite.height;
	var def=G.animations[name];
	asprite.atype="cmap";
	asprite.anchor.set(0.5,0.5);
	asprite.zy=12000;
	asprite.parentGroup=asprite.displayGroup=player_layer;
	asprite.id=randomStr(8);
	if(def.directional) asprite.directional=true;
	asprite.speed=def.speed;
	asprite.x=(get_x(origin)+get_x(target))/2;
	asprite.y=(get_y(origin)-get_height(origin)/2+get_y(target)-get_height(target)/2)/2;
	asprite.height=distance(origin,target);
	asprite.origin=origin;
	asprite.target=target;
	asprite.last_update=new Date();
	map_animations[asprite.id]=asprite;
	map.addChild(asprite);
}


function stop_animation(sprite,name)
{
	var anim=sprite.animations[name];
	if(!anim) return;
	var parent=anim.parent;
	if(!parent) return;
	destroy_sprite(anim);
	delete parent.animations[name];
}

function set_base_rectangle(e)
{
	var rectangle=e.texture.frame;
	e.base_rectangle=new PIXI.Rectangle(rectangle.x,rectangle.y,rectangle.width,rectangle.height);
}

function dirty_fix(sprite)
{
	return;
	// if(ssince(inception)<10) return;
	var r=sprite.texture.frame;
	sprite.texture=new PIXI.Rectangle(r.x,r.y+8,r.width,r.height);
}

function restore_base(e)
{
	var base=e.base_rectangle;
	e.texture.frame=new PIXI.Rectangle(base.x,base.y,base.width,base.height);
}

function rotate(sprite,num)
{
	//reference: http://pixijs.github.io/examples/index.html?s=demos&f=texture-rotate.js&title=Texture%20Rotate&v=dev
	var D8 = PIXI.GroupD8,texture=sprite.texture;
	var h = D8.isSwapWidthHeight(num)?texture.frame.width:texture.frame.height;
	var w = D8.isSwapWidthHeight(num)?texture.frame.height:texture.frame.width;

		var frame=texture.frame;
	var crop=new PIXI.Rectangle(0,0, w, h);
	var trim=crop;
	if(num%2==0)
	{
		var rotatedTexture=new PIXI.Texture(texture.baseTexture, frame, crop, trim, num);
	}
	else
	{
		var rotatedTexture=new PIXI.Texture(texture.baseTexture, frame, crop, trim, num-1);
		rotatedTexture.rotate++;
	}
	sprite.texture=rotatedTexture;
}

function rotated_texture(base_texture,frame,num)
{
	if(!num) return new PIXI.Texture(base_texture, frame);
	//reference: http://pixijs.github.io/examples/index.html?s=demos&f=texture-rotate.js&title=Texture%20Rotate&v=dev
	var D8 = PIXI.GroupD8;
	var h = D8.isSwapWidthHeight(num)?frame.width:frame.height;
	var w = D8.isSwapWidthHeight(num)?frame.height:frame.width;

	var crop=new PIXI.Rectangle(0,0, w, h);
	var trim=crop;
	if(num%2==0)
	{
		var rotatedTexture=new PIXI.Texture(base_texture, frame, crop, trim, num);
	}
	else
	{
		var rotatedTexture=new PIXI.Texture(base_texture, frame, crop, trim, num-1);
		rotatedTexture.rotate++;
	}
	return rotatedTexture;
}

function drag_logic()
{

}

function draw_timeouts_logic(mode)
{
	var start=new Date(),to_delete=[];
	for(var i=0;i<draw_timeouts.length;i++)
	{
		var timeout=draw_timeouts[i];
		if(mode && mode==2 && timeout[2]!=2) continue;
		if(start>=timeout[1])
		{
			DTM=1;
			DMS=start-timeout[3];
			if(timeout[4])
				try{
					DTM=(start-timeout[3])/timeout[4];
				}catch(e){}
			to_delete.push(i);
			try{ timeout[0](); }
			catch(e){ console.log('draw_timeout_error: '+e); console.log('code: '+timeout[0]); console.log(e.stack);}
		}
	}
	if(to_delete) delete_indices(draw_timeouts,to_delete);
}

function draw_timeout(f,ms,important)
{
	draw_timeouts.push([f,future_ms(ms),important,new Date(),ms]);
}

function draw_trigger(f)
{
	if(in_draw)
	{
		try{ f(); }
		catch(e){ console.log('draw_trigger_error: '+e); console.log('code: '+f); console.log(e.stack);}
	}
	else draw_timeouts.push([f,new Date(),2,new Date(),0]);
}

function tint_logic()
{
	var start=new Date(),to_delete=[];
	for(var i=0;i<tints.length;i++)
	{
		var tint=tints[i],r=240,g=95,b=0,rr=50,gg=205,bb=50;
		if(tint.type=="skill")
		{
			if(start>tint.end)
			{
				$(tint.selector).parent().find("img").css("opacity",1);
				to_delete.push(i);
				$(tint.selector).css("height","0px").css("background-color","rgb("+r+","+g+","+b+")");
			}
			else
			{
				if(!tint.added)
				{
					$(".skidloader"+tint.skid).parent().find("img").css("opacity",0.5);
					tint.added=true;
					$(tint.selector).css("height","1px");
				}
				var since=mssince(tint.start),to=-mssince(tint.end);
				var height=2*46*since/(since+to+1),ratio=since/(since+to+1);
				$(tint.selector).css("background-color","rgb("+round(r+(rr-r)*ratio)+","+round(g+(gg-g)*ratio)+","+round(b+(bb-b)*ratio)+")");
				$(tint.selector).css({
					//"height":"1px",
					"-webkit-transform":"scaleY("+height+")",
					"-moz-transform":"scaleY("+height+")",
					"-ms-transform":"scaleY("+height+")",
					"-o-transform":"scaleY("+height+")",
					"transform":"scaleY("+height+")",
				});
			}
		}
		else if(tint.type=="progress") // copy-paste of "selector" [14/06/19]
		{
			if(tint.compound) r=50,g=163,b=204,rr=70,gg=183,bb=244;
			else if(tint.upgrade) rr=41,gg=156,bb=76,r=254,g=183,b=42;
			else if(tint.upgrade) r=254,g=183,b=42,rr=255,gg=209,bb=9;
			else r=200,g=200,b=200,rr=250,gg=250,bb=250;
			if(start>tint.end)
			{
				//$(tint.selector).parent().find("img").css("opacity",1);
				to_delete.push(i);
				$(tint.selector).css("height","0px").css("background-color","rgb("+r+","+g+","+b+")");
			}
			else
			{
				if(!tint.added)
				{
					//$(tint.selector).parent().find("img").css("opacity",0.5);
					tint.added=true;
					$(tint.selector).css("height","1px");
				}
				var since=mssince(tint.start),to=-mssince(tint.end);
				var height=2*46*since/(since+to+1),ratio=since/(since+to+1);
				$(tint.selector).css("background-color","rgb("+round(r+(rr-r)*ratio)+","+round(g+(gg-g)*ratio)+","+round(b+(bb-b)*ratio)+")");
				$(tint.selector).css({
					//"height":"1px",
					"-webkit-transform":"scaleY("+height+")",
					"-moz-transform":"scaleY("+height+")",
					"-ms-transform":"scaleY("+height+")",
					"-o-transform":"scaleY("+height+")",
					"transform":"scaleY("+height+")",
				});
			}
		}
		else if(tint.type=="dissipate")
		{
			if(start>tint.end)
			{
				$(tint.selector).parent().css("background","black");
				to_delete.push(i);
			}
			else
			{
				var r=tint.r,g=tint.g,b=tint.b,steps=20;
				if(tint.i<steps)
				{
					r=round(r-(r/2.0/steps)*tint.i);
					g=round(g-(g/2.0/steps)*tint.i);
					b=round(b-(b/2.0/steps)*tint.i);
					if(tint.i==steps-1) tint.mid=new Date();
				}
				else
				{
					var since=mssince(tint.mid),to=-mssince(tint.end);
					var ratio=min(1,max(0,1.0*since/(since+to+1)));
					r=round((1-ratio)*r/2);
					g=round((1-ratio)*g/2);
					b=round((1-ratio)*b/2);
				}
				$(tint.selector).parent().css("background","rgb("+r+","+g+","+b+")");
			}
			tint.i++;
		}
		else if(tint.type=="brute")
		{
			if(start>tint.end)
			{
				if(tint_c[tint.key]==tint.cur || 1)
				{
					$(tint.selector).children(".thetint").remove();
					$(tint.selector).css("background",tint.reset_to);
				}
				to_delete.push(i);
			}
			else
			{
				if(tint_c[tint.key]!=tint.cur && 0) continue;
				if(!tint.added)
				{
					tint.added=true;
					$(tint.selector).children(".thetint").remove();
					$(tint.selector).append("<div style='position: absolute; "+(tint.pos||"bottom")+": 0px; left: 0px; right: 0px; height: 1px; background: "+tint.color+"; z-index: 1' class='thetint'></div>")
				}
				var since=mssince(tint.start),to=-mssince(tint.end);
				//console.log(to);
				var height=60.1*since/(since+to+1);
				// height=max(0,min(60,height));
				// $(tint.selector).children(".thetint").css("height",height+"px");
				$(tint.selector).children(".thetint").css({
					"-webkit-transform":"scaleY("+height+")",
					"-moz-transform":"scaleY("+height+")",
					"-ms-transform":"scaleY("+height+")",
					"-o-transform":"scaleY("+height+")",
					"transform":"scaleY("+height+")",
				});
			}
		}
		else if(tint.type=="fill")
		{
			if(start>tint.end)
			{
				//console.log("end");
				tint.type="glow"; // #GTODO: Glow once
				$(tint.selector).css("background",tint.reset_to);
				if(tint.on_end) tint.on_end();
				to_delete.push(i);
			}
			else
			{
				var since=mssince(tint.start),to=-mssince(tint.end);
				//console.log(to);
				var percentage=round(100.0*since/(since+to+1));
				if(tint.reverse) percentage=100-percentage;
				percentage=max(1,percentage);
				$(tint.selector).css("background","-webkit-gradient(linear, "+tint.start_d+", "+tint.end_d+", from("+tint.color+"), to("+tint.back_to+"), color-stop("+(percentage-1)+"%,"+tint.color+"),color-stop("+percentage+"%, "+tint.back_to+")");
			}
		}
		else if(tint.type=="glow")
		{

		}
		else if(tint.type=="half")
		{
			$(tint.selector).css("background","-webkit-gradient(linear, left top, right top, from(#f0f), to(#0f0), color-stop(49%,#f0f),color-stop(50%, #0f0)");
		}
	}
	if(to_delete) delete_indices(tints,to_delete);
}

function get_tint(selector)
{
	for(var i=0;i<tints.length;i++) 
		if(tints[i].selector==selector) return tints[i];
	return null;
}

function add_tint(selector,args)
{
	if(mode.dom_tests) return;
	if(!args) args={};
	if(!args.color) args.color="#999787";
	if(!args.ms) args.ms=1000;
	if(!args.type) args.type="fill";
	if(!args.back_to) args.back_to="black";
	if(!args.reset_to) args.reset_to=args.back_to;
	if(!args.start_d) args.start_d="left bottom";
	if(!args.end_d) args.end_d="left top";
	args.selector=selector;
	args.start=args.start||(new Date());
	args.end=new Date(); args.end.setMilliseconds(args.end.getMilliseconds()+args.ms);
	var tint=get_tint(selector); // new logic [27/06/18]
	if(tint)
	{
		tint.start=args.start;
		tint.end=args.end;
		tint.ms=args.ms;
	}
	else tints.push(args);
}

function use(item)
{
	var done=false;
	for(var i=character.items.length-1;i>=0;i--)
	{
		var current=character.items[i];
		if(!current) continue;
		if(done) break;
		var def=G.items[current.name];
		(def.gives||[]).forEach(function(p){
			if(p[0]==item && p[1]>0 && !done){
				socket.emit("equip",{num:i});
				done=push_deferred("equip");
			}
		});
	}
	if(!done)
	{
		socket.emit("use",{item:item});
		return push_deferred("use");
	}
	return done;
}

var tint_c={"a":0,"p":0,"t":0};
var next_attack=new Date(),next_potion=new Date(); // backwards compatibility

function attack_timeout_animation(ms)
{
	// if(ms<=0) return; // [09/09/22] 0's are valid now, for corrections
	// #6E6E6E is the ~best gray shade
	//var original=$(".atint").css("background");
	draw_trigger(function(){
		$(".atint").css("background","none");
		tint_c.a++;
		add_tint(".atint",{ms:-mssince(next_skill.attack)-DMS,color:"#4C4C4C",reset_to:"#6A6A6A",type:"brute",key:"a",cur:tint_c.a}); //start_d:"left top",end_d:"left bottom",
	});
}

function pot_timeout(ms)
{
	// if(ms<=0) return; // [09/09/22] 0's are valid now, for corrections
	if(ms===undefined) ms=2000;
	next_potion=future_ms(ms);
	skill_timeout("use_hp",ms);
	skill_timeout("use_mp",ms);
	//add_tint(".hpui",{ms:ms,color:"#9A9A9A",reverse:1});
	//add_tint(".mpui",{ms:ms,color:"#9A9A9A",reverse:1});
	// add_tint(".ptint",{ms:ms,color:"#5F346E",reverse:1});
	//var original=$(".ptint").css("background");
	draw_trigger(function(){
		if(!get_tint(".ptint")) $(".ptint").css("background","none");
		tint_c.p++;
		add_tint(".ptint",{ms:-mssince(next_skill.use_hp)-DMS,color:"#4C4C4C",reset_to:"#6A6A6A",type:"brute",key:"p",cur:tint_c.p});
	});
}

function pvp_timeout(ms,me)
{
	if(ms<=0) return;
	skill_timeout("use_town",ms);
	if(me) return;
	draw_trigger(function(){
		$(".pvptint").parent().css("background","rgb(200,50,20)");
		for(var i=1;i<10;i++)
		{
			var r=200-i*15,g=50-i*3,b=20-i;
			draw_timeout(function(r,g,b){ return function(){ $(".pvptint").parent().css("background","rgb("+r+","+g+","+b+")");} }(r,g,b),i*600);
		}
		0 && draw_timeout(function(){
			$(".pvptint").parent().css("background","black");
			$(".pvptint").css("background","#907B81");
			tint_c.t++;
			add_tint(".pvptint",{ms:-mssince(next_skill.use_town)-DMS,color:"black",reset_to:"none",type:"brute",key:"t",cur:tint_c.t,pos:"top"});
		},200);
	});
}

function pvp_timeout(ms,event)
{
	if(ms<=0) return;
	var r=200,g=50,b=20;
	if(event=="sneak") r=45,g=111,b=45; // didn't work out well
	skill_timeout("use_town",ms);
	if(event==1) return; // 1=me
	draw_trigger(function(){
		$(".pvptint").parent().css("background","rgb("+r+","+g+","+b+")");
		tint_c.t++;
		add_tint(".pvptint",{ms:-mssince(next_skill.use_town)-DMS,r:r,g:g,b:b,type:"dissipate",key:"t",cur:tint_c.t,i:0});
	});
}

var next_skill={"attack":new Date(),use_hp:new Date(),use_mp:new Date(),use_town:new Date()};
function skill_timeout_singular(name,ms)
{
	// console.log([name,ms]);
	if(ms<=0) ms=0;
	var skids=[];
	if(ms===undefined && (G.skills[name].cooldown||G.skills[name].reuse_cooldown)!==undefined) ms=G.skills[name].cooldown||G.skills[name].reuse_cooldown;
	else if(ms===undefined && G.skills[name].share) ms=G.skills[G.skills[name].share].cooldown*(G.skills[name].cooldown_multiplier||1);
	else if(name=="attack" && ms===undefined) ms=1000.0/character.frequency;
	next_skill[name]=future_ms(ms||0);
	if(name=="attack") next_attack=next_skill[name];
	//add_tint(".hpui",{ms:ms,color:"#9A9A9A",reverse:1});
	//add_tint(".mpui",{ms:ms,color:"#9A9A9A",reverse:1});
	// add_tint(".ptint",{ms:ms,color:"#5F346E",reverse:1});
	//var original=$(".ptint").css("background");
	for(var N in keymap)
		if(keymap[N] && (keymap[N]==name || keymap[N].name==name)) skids.push(N);
	draw_trigger(function(){
		if(name=="attack") attack_timeout_animation(-mssince(next_skill[name])-DMS);
		skids.forEach(function(skid){
			add_tint(".skidloader"+skid,{ms:-mssince(next_skill[name])-DMS,type:"skill",skid:skid});
		});
	});
}

function restart_skill_tints()
{
	if(0)
	{
		var skids=[];
		for(var N in keymap)
			if(keymap[N] && (keymap[N]==name || keymap[N].name==name)) skids.push(N);
		for(var name in next_skill)
		{
			if(-mssince(next_skill[name])>0)
			{
				draw_trigger(function(){
					skids.forEach(function(skid){
						add_tint(".skidloader"+skid,{ms:-mssince(next_skill[name]),type:"skill",skid:skid});
					});
				});
			}
		}
	}
	if(1)
		tints.forEach(function(tint){
			if(tint.skid)
			{
				$(".skidloader"+tint.skid).parent().find("img").css("opacity",0.5);
				$(tint.selector).css("height","1px");
			}
		});
}

function skill_timeout(name,ms)
{
	if(G.skills[name].share)
	{
		skill_timeout_singular(G.skills[name].share,ms);
		for(var s in G.skills)
			if(G.skills[s].share==G.skills[name].share)
				skill_timeout_singular(s,ms);
	}
	else if((G.skills[name].cooldown||G.skills[name].reuse_cooldown)!==undefined || name=="attack")
		skill_timeout_singular(name,ms);
}

function disappearing_circle(x,y,size,args)
{
	if(!args) args={};
	if(!args.color) args.color=0xFFFFFF;
	var sprite=new PIXI.Graphics();
	sprite.beginFill(args.color);
	sprite.drawCircle(x,y,size);
	sprite.endFill();
	sprite.pivot=new PIXI.Point(0.5,0.5);
	sprite.alpha=args.alpha||1;
	map.addChild(sprite);
	function d_circle(step)
	{
		return function(){
			if(step>=10)
			{
				destroy_sprite(sprite);
			}
			else
			{
				//sprite.x-=3;
				//sprite.y-=3;
				//sprite.width+=3;
				//sprite.height+=3;
				//sprite.scale.x+=0.2;
				//sprite.scale.y+=0.2;
				sprite.alpha-=0.03;
				draw_timeout(d_circle(step+1),40);
			}
		}
	}
	draw_timeout(d_circle(1),40);
}

function empty_rect(x,y,width,height,size,color)
{
	if(!color) color=0x886C37;
	if(!size) size=1;
	if(!width) width=1;
	if(!height) height=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.drawPolygon([x,y,x,y+height,x+width,y+height,x+width,y,x,y]);
	return e;
}

function draw_crosshair(x,y,size,color)
{
	if(!color) color=0xFF2335;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(1.5, color);
	e.moveTo(x-size,y);
	e.lineTo(x+size,y);
	e.moveTo(x,y-size);
	e.lineTo(x,y+size);
	e.endFill();
	return e;
}

function draw_xhair(x,y,size,color)
{
	if(!color) color=0xFF2335;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(1.5, color);
	e.moveTo(x-size,y-size);
	e.lineTo(x+size,y+size);
	e.moveTo(x+size,y-size);
	e.lineTo(x-size,y+size);
	e.endFill();
	return e;
}

function draw_line(x,y,x2,y2,size,color)
{
	if(!color) color=0xFF2335;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.moveTo(x,y);
	e.lineTo(x2,y2);
	e.endFill();
	return e;
}

function draw_circle(x,y,size,color)
{
	if(!color) color=0xFF2335;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.beginFill(color);
	e.drawCircle(x,y,size);
	e.endFill();
	return e;
}

function add_border(element,width,height)
{
	if(!width) width=(element.texture.width),height=(element.texture.height);
	var e=new PIXI.Graphics();
	e.lineStyle(1,0xFEB222);
	e.drawRect(0,0,width,height);
	if(element.anchor)
	{
		e.x=-element.anchor.x*width;
		e.y=-element.anchor.y*height;
	}
	if(element.hitArea && (element.hitArea.width!=width || element.hitArea.height!=height))
	{
		var b=new PIXI.Graphics();
		b.lineStyle(1,0x84D5FF);
		b.drawRect(0,0,element.hitArea.width,element.hitArea.height);
		if(element.anchor)
		{
			b.x=-element.anchor.x*element.hitArea.width
			b.y=-element.anchor.y*element.hitArea.height;
		}
		element.bborder=b;
		element.addChild(b);
	}
	if(element.base)
	{
		var c=new PIXI.Graphics();
		c.lineStyle(1,0x54AFFF);
		c.drawRect(0,0,element.base.h*2,element.base.v+element.base.vn);
		if(element.anchor)
		{
			c.x=-element.anchor.x*(element.base.h*2);
			c.y=-element.anchor.y*(element.base.v+element.base.vn);
		}
		c.y+=element.base.vn;
		element.cborder=c;
		element.addChild(c);
	}
	element.aborder=e;
	element.addChild(e);
}

function border_logic(element)
{
	if(element.aborder) return;
	if(element.aborder)
	{
		destroy_sprite(element.aborder); element.aborder=null;
	}
	if(element.bborder)
	{
		destroy_sprite(element.bborder); element.bborder=null;
	}
	if(element.cborder)
	{
		destroy_sprite(element.cborder); element.cborder=null;
	}
	add_border(element);
}

function player_rclick_logic(element)
{
	if(!character || element.me) return;
	var add=false;
	if(element.npc) add=true;
	else if(character.ctype=="priest" || character.slots.mainhand && character.slots.mainhand.name=="cupid") add=true; // maybe disable when the target is full hp
	else
	{
		if(!pvp);
		else if(pvp) add=true; //attack
	}

	if(add && !element.on_rclick)
	{
		element.on_rclick=true;
		element.on("rightdown",player_right_click);
	}
	else if(!add && element.on_rclick)
	{
		element.on_rclick=false;
		element.removeListener("rightdown");
	}
}

function regather_filters(entity)
{
	var filters=[];
	for(var p in entity) if(p.startsWith("cfilter_")) filters.push(entity[p]);
	entity.filters=filters; 
}

function rip_logic()
{
	if(character.rip && !rip)
	{
		if(code_run)
		{
			call_code_function("trigger_event","death",{id:character.id});
			call_code_function("trigger_character_event","death",{});
		}
		rip=true; character.i=1; character.j=0;
		if(!no_graphics)
		{
			var filter=new PIXI.filters.ColorMatrixFilter();
			filter.desaturate();
			stage.cfilter_rip=filter;
			regather_filters(stage);
		}
		character.moving=false;
		$("#ripbutton").show();
		skill_timeout('use_town',12000);
		reopen();
		$("#name").css("color","#5E5D5D");

	}
	if(!character.rip && rip)
	{
		rip=false;
		delete stage.cfilter_rip;
		regather_filters(stage);
		$("#ripbutton").hide();
		$("#name").css("color","#1AC506");
	}
}

function name_logic(element)
{
	if(no_graphics) return;
	if(element.type!="character" && element.type!="npc") return;
	if((!options.show_names && !(options.always_hpn || options.always_names) && (mtarget||xtarget||ctarget)!=element && character) && element.name_tag) //show_names
	{
		destroy_sprite(element.name_tag,"children"); element.name_tag=null; element.ntag_cache=null;
	}
	else if(options.show_names || !character || options.always_hpn || options.always_names || (mtarget||xtarget||ctarget)==element) //  && !element.name_tag - added ntag_cache [06/12/16]
	{
		add_name_tag(element);
	}
}

// #TODO: Apply manually: https://github.com/pixijs/pixi.js/pull/4833/files [30/11/18]
// Next level: also round every name tag when the character itself is moving

function start_name_tag(element)
{
	var value=false;
	if(!element.moving || element.me) value=true;
	if(element.name_tag && element.name_tag.roundPixels!=value)
	{
		element.name_tag.roundPixels=value;
		if(element.name_tag.children)
			element.name_tag.children.forEach(function(c){
				c.roundPixels=value;
			});
	}
}

function stop_name_tag(element)
{
	start_name_tag(element)
}

function add_name_tag_old(element)
{
	var ntag_cache=element.name+"|"+element.level;
	if(element.name_tag)
	{
		if(element.ntag_cache==ntag_cache) return;
		destroy_sprite(element.name_tag,"children"); element.name_tag=null; element.ntag_cache=null;
	}
	var bordered_rectangle=new PIXI.Graphics();
	var name=("Lv."+element.level+" ")+element.name,border_color=0x716D6C,width=name.length*4+4,height=11;
	if(element.npc && (element.type=="npc" || G.npcs[element.npc]))
	{
		name=element.name||"NPC";
		border_color=0x26A1CD;
		if(element.citizen) border_color=0xD87F06;
		width=name.length*4+8;
	}
	if(element.role=="gm")
		border_color=0xE6A32F;

	var multiplier=1,offset=0;
	if(!element.me) multiplier=4;
	else multiplier=4; // Previously 8, "Business" was always rendering bad, so trying 2 [06/08/18]

	var fp={fontFamily:SZ.font,fontSize:8*multiplier,fill:"white",align:"center"}; //,dropShadow:true,dropShadowDistance:1
	var name=new PIXI.Text(name,fp);
	// var name=new PIXI.BitmapText(name,{font:"16px m5x7",align:"center"}); // tint:0xFFFFFF} // worse pixel issues [29/11/18]
	// name.x=0; name.y=-round(element.aheight)-2;
	name.roundPixels=false;
	name.anchor.set(0.5,0);
	name.scale=new PIXI.Point(1/multiplier,1/multiplier);

	width=round(name.width+10); // this is new, no more guessing the width [06/08/18]
	// if(round(name.width)!=name.width) offset=0.25; - with roundPixels - no need
	if(!element.moving || element.me) name.roundPixels=true; // manually applied to the 4.8.2 pixi.js
	// [17/02/19] Tested adding element.speed<20 like statements for merchants, makes things worse, current blurring is better

	name.x=(width/2)+offset; name.y=2.5;

	bordered_rectangle.beginFill(border_color);
	bordered_rectangle.drawRect(0,0,width,height);
	bordered_rectangle.endFill();

	bordered_rectangle.beginFill(0x201F1F);
	bordered_rectangle.drawRect(1,1,width-2,height-2);
	bordered_rectangle.endFill();

	// bordered_rectangle.position=new PIXI.Point(-(width/2),-height-(element.aheight||element.height));
	bordered_rectangle.position=new PIXI.Point(-round(width/2),2);

	bordered_rectangle.addChild(name);
	// bordered_rectangle.displayGroup=text_layer;

	element.name_tag=bordered_rectangle;
	element.ntag_cache=ntag_cache;
	element.addChild(bordered_rectangle);
	bordered_rectangle.parentGroup=entity_layer;
}

function add_name_tag(element)
{
	var bar={hp:false,mp:false,color:"white",party:false,level:false,cl:false,focus:false,stand:false,online:false},hp_mwidth=32,mp_mwidth=24,hp_width,mp_width,bsc="";
	if(element.type=="character" && (xtarget||ctarget)==element) bar.hp=bar.mp=bar.level=bar.cl=true;
	if(element.type=="character" && mtarget==element) bar.hp=bar.level=bar.cl=true;
	if(!element.max_mp) bar.mp=false;
	if(is_player(element) && !element.afk) bar.online=true;
	if(is_player(element) && element.stand && (mtarget==element || (xtarget||xtarget)==element))
	{
		var items=[];
		for(var i=1;i<32;i++)
			if(items.length<4 && element.slots["trade"+i] && !element.slots["trade"+i].b && G.positions[G.items[element.slots["trade"+i].name].skin])
				items.push(element.slots["trade"+i]),bsc+=element.slots["trade"+i].name;
		if(items.length || 1) bar.stand=items,bar.hp=false;
	}
	if(character && !element.me && (element.target==character.name || element.focus==character.name) && is_player(element)) bar.focus=true;

	if(element.npc); //bar.color="#E09400";
	// else if(element.type=="character" && !pvp && !is_pvp && (ctarget==element || xtarget==element)) bar.color="#368C2B";
	else if(element.team=="A") bar.color="#39BB54",bar.hp=true;
	else if(element.team=="B") bar.color="#DB37A3",bar.hp=true;
	else if(element.type=="character" && (pvp || is_pvp) && character && character.guild!=element.guild && character.party!=element.party && (element.target==character.name || element.focus==character.name)); //red
	else if(character && character.party && character.party==element.party) bar.color="#6F3F87"; // purple
	//else if(character && character.guild && character.guild==element.guild) bar.color="#3EB6C0"; // teal
	else if(character && element.controller==character.name) bar.color="#899B92";
	
	if(bar.hp) hp_width=round((hp_mwidth-2-2)*element.hp/element.max_hp);
	if(bar.mp) mp_width=round((mp_mwidth-2-2)*element.mp/element.max_mp);

	var ntag_cache=element.name+"|"+element.color+"|"+(bar.level&&element.level)+"|"+(bar.hp&&hp_width)+"|"+(bar.mp&&mp_width)+"|"+(bar.cl&&element.ctype)+"|"+bar.focus+"|"+(bar.stand&&bsc)+"|"+bar.online;
	if(element.name_tag)
	{
		if(element.ntag_cache==ntag_cache) return;
		destroy_sprite(element.name_tag,"children"); element.name_tag=null;
	}
	element.ntag_cache=ntag_cache;
	var bordered_rectangle=new PIXI.Graphics(),name=element.name,height=9,multiplier=1,roundPixels=false;
	if(!element.moving || element.me) roundPixels=true;
	bordered_rectangle.roundPixels=roundPixels;
	// if(element.level) name="Lv."+element.level+" "+name;
	if(element.me) multiplier=1;
	var fp={fontFamily:SZ.font,fontSize:64*multiplier,fill:bar.color,align:"center"}; //,dropShadow:true,dropShadowDistance:1
	var name=new PIXI.Text(name,fp);
	name.scale=new PIXI.Point(0.125/multiplier,0.125/multiplier);
	name.anchor.set(0.5,0);
	var fpl={fontFamily:SZ.font,fontSize:64,fill:"#A2AAB0",align:"center"},level;
	if(bar.level)
	{
		level=new PIXI.Text(element.level>99&&"XX"||element.level,fpl);
		level.scale=new PIXI.Point(0.125,0.125);
		level.anchor.set(0.5,0);
	}
	var fp2={fontFamily:SZ.font,fontSize:64,fill:colors[element.ctype!="merchant"&&G.classes[element.ctype]&&G.classes[element.ctype].main_stat]||"#A29880",align:"center"},cl;
	if(bar.cl)
	{
		cl=new PIXI.Text(element.ctype[0].toUpperCase(),fp2);
		cl.scale=new PIXI.Point(0.125,0.125);
		cl.anchor.set(0.5,0);
	}

	// #IMPORTANT: ensure name.worldTransform.tx - is an integer

	var width=round(name.width+8),cl_width=7,level_width=8;

	bordered_rectangle.beginFill(0x716D6C); // all gray
	bordered_rectangle.drawRect(-(bar.cl&&(cl_width+1)||0),0,width+(bar.cl&&(cl_width+1)||0)+(bar.level&&(level_width+1)||0),height);
	bordered_rectangle.endFill();

	if(bar.cl)
	{
		bordered_rectangle.beginFill(0x201F1F); // class rectangle
		bordered_rectangle.drawRect(-cl_width,1,cl_width,height-2);
		bordered_rectangle.endFill();
	}

	bordered_rectangle.beginFill(0x201F1F); // name rectangle
	bordered_rectangle.drawRect(1,1,width-2,height-2);
	bordered_rectangle.endFill();
	if(bar.focus)
	{
		bordered_rectangle.beginFill(0x3B8ED2);
		bordered_rectangle.drawRect(1,0,width-2,1);
		bordered_rectangle.endFill();
	}
	if(bar.online)
	{
		bordered_rectangle.beginFill(0x6EC344);
		bordered_rectangle.drawRect(1,1,1,height-2);
		bordered_rectangle.endFill();
		bordered_rectangle.beginFill(0x6EC344);
		bordered_rectangle.drawRect(width-2,1,1,height-2);
		bordered_rectangle.endFill();
	}

	if(bar.level)
	{
		bordered_rectangle.beginFill(0x201F1F); // level rectangle
		bordered_rectangle.drawRect(width,1,level_width,height-2);
		bordered_rectangle.endFill();
	}

	if(bar.stand)
	{
		for(var i=0;i<4;i++)
		{
			bordered_rectangle.beginFill(0x716D6C); // gray
			bordered_rectangle.drawRect(round(width/2)+12-i*14+i,-13,14,14);
			bordered_rectangle.endFill();
			bordered_rectangle.beginFill(0x201F1F); // black
			bordered_rectangle.drawRect(round(width/2)+12-i*14+1+i,-12,12,12);
			bordered_rectangle.endFill();
			if(bar.stand[3-i])
			{
				var item=new_sprite(bar.stand[3-i].name,"item");
				item.texture=textures["item"+bar.stand[3-i].name][1];
				item.width=10; item.height=10; item.anchor.set(0,0);
				item.x=round(width/2)+12-i*14+i+2;
				item.y=-11;
				bordered_rectangle.addChild(item);
			}
		}
	}

	bordered_rectangle.position=new PIXI.Point(-round(width/2),-height-(element.aheight||element.height)-(bar.mp&&4||0));

	name.x=round(width/2); name.y=1.5; name.roundPixels=roundPixels;
	bordered_rectangle.addChild(name);

	if(bar.level)
	{
		level.x=width+4.5; level.y=1.5; level.roundPixels=roundPixels;
		bordered_rectangle.addChild(level);
	}

	if(bar.cl)
	{
		cl.x=-3; cl.y=1.5; cl.roundPixels=roundPixels;
		bordered_rectangle.addChild(cl);
	}

	var hp_color=0xB12727; //red
	var mp_color=0x3A62CE;

	if(bar.hp)
	{
		var top_d=-5,left_d=(width-hp_mwidth)/2;

		bordered_rectangle.beginFill(0x716D6C);
		bordered_rectangle.drawRect(left_d,top_d,hp_mwidth,4+1+1);
		bordered_rectangle.endFill();

		bordered_rectangle.beginFill(0x201F1F);
		bordered_rectangle.drawRect(1+left_d,1+top_d,hp_mwidth-1-1,4);
		bordered_rectangle.endFill();

		bordered_rectangle.beginFill(hp_color);
		bordered_rectangle.drawRect(1+1+left_d,1+1+top_d,hp_width,2);
		bordered_rectangle.endFill();
	}

	if(bar.mp)
	{
		var top_d=8,left_d=(width-mp_mwidth)/2;

		bordered_rectangle.beginFill(0x716D6C);
		bordered_rectangle.drawRect(left_d,top_d,mp_mwidth,4+1+1);
		bordered_rectangle.endFill();

		bordered_rectangle.beginFill(0x201F1F);
		bordered_rectangle.drawRect(1+left_d,1+top_d,mp_mwidth-1-1,4);
		bordered_rectangle.endFill();

		bordered_rectangle.beginFill(mp_color);
		bordered_rectangle.drawRect(1+1+left_d,1+1+top_d,mp_width,2);
		bordered_rectangle.endFill();
	}
	
	var container=new PIXI.Sprite();
	container.addChild(bordered_rectangle);
	element.name_tag=container;
	element.addChild(container);
	//container.parentGroup=player_layer;
}

function hp_bar_logic(element)
{
	if(no_graphics) return;
	if(element.type!="monster") return;
	if(element.dead && !element.hp_bar) return;
	if((!hp_bars || element.me) && !options.always_hpn) return;
	if(ctarget==element || xtarget==element || mtarget==element || (character && character.party && character.party==element.party) || (character && character.party && (element.target && in_arr(element.target,party_list) || element.focus && in_arr(element.focus,party_list)))
		|| (character && (element.target==character.name || element.focus==character.name)) || (character && character.team && !element.npc) || (character && element.controller==character.name) || options.always_hpn)
	{
		add_hp_bar(element);
	}
	else if(element.hp_bar)
	{
		destroy_sprite(element.hp_bar,"children"); element.hp_bar=null; element.hp_color=null;
	}
}

function add_hp_bar_old(element)
{
	var width=max(32,round(element.width*0.8)),bsize=1,bsize2=round(2*bsize); // bsize = 1.5 -> awesome [12/08/16]
	var color=0xB12727; //red

	if(element.npc) color=0xE09400;
	else if(element.type=="character" && !pvp && !is_pvp && (ctarget==element || xtarget==element)) color=0x368C2B; // green
	else if(element.team=="A") color=0x39BB54;
	else if(element.team=="B") color=0xDB37A3;
	else if(element.type=="character" && (pvp || is_pvp) && character && character.guild!=element.guild && character.party!=element.party && (element.target==character.name || element.focus==character.name)); //red
	else if(character && character.party && character.party==element.party) color=0x6F3F87; // purple
	else if(character && character.guild && character.guild==element.guild) color=0x3EB6C0; // teal
	else if(character && is_monster(element) && (ctarget==element || xtarget==element)); //red
	else if(character && element.controller==character.name) color=0x899B92;
	else if(character && (element.target==character.name || element.focus==character.name) && is_player(element)) color=0x3FA8D1;
	else if(mtarget==element) color=0x55CFDA;
	// color=0xB8542A; // ligher-dark-orange
	// color=0xB14622; // dark-orange

	var hp_width=round((width-round(2*(bsize+1)))*element.hp/element.max_hp);

	if(element.hp_bar)
	{
		if(element.hp_width == hp_width && element.hp_color==color) return; //The Cache! :) [06/08/16]
		destroy_sprite(element.hp_bar,"children"); element.hp_bar=null;
	}
	//console.log("HP BAR DRAW");

	element.hp_width=hp_width;

	var hp_bar=new PIXI.Graphics();

	hp_bar.beginFill(0x716D6C);
	hp_bar.drawRect(0,0,width,6+bsize2);
	hp_bar.endFill();

	hp_bar.beginFill(0x201F1F);
	hp_bar.drawRect(bsize,bsize,width-bsize2,6);
	hp_bar.endFill();

	hp_bar.beginFill(color);
	hp_bar.drawRect(bsize+1,bsize+1,element.hp_width,4);
	hp_bar.endFill();

	var dy=12,dx=0;
	if(element.type=="character" && character_names) dy+=8;
	if(element.mscale==2) dy+=6,dx+=width/2;
	// if(element.height<40) dy=12;

	hp_bar.position=new PIXI.Point(-(width/2)-dx,-dy-(element.aheight||element.height)+(element.mscale==2&&-4||0));
	if(element.mscale) hp_bar.scale=new PIXI.Point(element.mscale,element.mscale);
	element.hp_bar=hp_bar; element.hp_color=color;
	hp_bar.parentGroup=window.hp_layer;
	element.addChild(hp_bar);
}

function add_hp_bar(element)
{
	var width=max(32,round(element.width*0.8)),bsize=1,bsize2=round(2*bsize); // bsize = 1.5 -> awesome [12/08/16]
	var color=0xB12727; //red

	if(character && is_monster(element) && (ctarget==element || xtarget==element)); //red
	else if(mtarget==element) color=hx("#91987B");

	var hp_width=round((width-round(2*(bsize+1)))*element.hp/element.max_hp);

	if(element.hp_bar)
	{
		if(element.hp_width == hp_width && element.hp_color==color && element.hp_level==element.level) return; //The Cache! :) [06/08/16]
		destroy_sprite(element.hp_bar,"children"); element.hp_bar=null;
	}
	//console.log("HP BAR DRAW");

	element.hp_width=hp_width;
	element.hp_level=element.level;

	var hp_bar=new PIXI.Graphics();
	var level=element.level>1;

	hp_bar.beginFill(0x716D6C);
	hp_bar.drawRect(0-(level&&9||0),0,width+(level&&9||0),6+bsize2);
	hp_bar.endFill();

	if(level)
	{
		var lcolor="#5EC063",diff=calculate_difficulty(element);
		if(diff>=2) lcolor="#D52526";
		else if(diff) lcolor="#EF9232";

		hp_bar.beginFill(hx(lcolor));
		hp_bar.drawRect(bsize-9,bsize,8,6);
		hp_bar.endFill();

		var fpl={fontFamily:SZ.font,fontSize:64,fill:"white",align:"center"},level=new PIXI.Text(element.level>99&&"XX"||element.level,fpl);
		level.scale=new PIXI.Point(0.125,0.125);
		level.anchor.set(0.5,0);
		level.x=-4; level.y=0.5;
		hp_bar.addChild(level);
	}

	hp_bar.beginFill(0x201F1F);
	hp_bar.drawRect(bsize,bsize,width-bsize2,6);
	hp_bar.endFill();

	hp_bar.beginFill(color);
	hp_bar.drawRect(bsize+1,bsize+1,element.hp_width,4);
	hp_bar.endFill();

	var dy=12,dx=0;
	var SCALE=false;
	if(element.mscale==0.5) SCALE=2;
	if(element.mscale>1) dy-=element.mscale*element.mscale*4;
	if(SCALE && element.mscale==0.5) dy+=6,dx+=width/2;
	
	// if(element.height<40) dy=12;

	hp_bar.position=new PIXI.Point(-(width/2)-dx,-dy-(element.aheight||element.height)); // +(element.mscale==2&&-4||0)
	if(SCALE) hp_bar.scale=new PIXI.Point(SCALE,SCALE);
	element.hp_bar=hp_bar; element.hp_color=color;
	hp_bar.parentGroup=window.hp_layer;
	element.addChild(hp_bar);
}

function calculate_difficulty(monster)
{
	var mdps=monster.attack*monster.frequency,dps=4000,hp=8000,mhp=monster.hp;
	if(character) dps=character.attack*character.frequency,hp=character.hp;
	for(var i=0;i<30;i++)
	{
		hp-=mdps*2;
		mhp-=dps*2;
		hp+=400;
		if(hp<0 || mhp<0) break;
	}
	if(hp<0) return 2;
	else if(character && character.hp-hp>character.max_hp*0.3 || !character && 6000-hp>8000*0.3) return 1;
	else return 0;
}

function test_bitmap(x,y,size)
{
	var text=new PIXI.BitmapText("YAY BITMAPS!",{font:size+"px m5x7",align:"center"});
	text.displayGroup=text_layer;
	text.x=round(x);
	text.y=round(y);
	map.addChild(text);
}

function d_line(start,end,args)
{
	if(!d_lines || no_graphics || paused) return;
	if(!args) args={};
	var party=[0xf80c12,0xee1100,0xff3311,0xff4422,0xff6644,0xff9933,0xfeae2d,0xccbb33,0xd0c310,0xaacc22,0x69d025,0x22ccaa,0x12bdb9,0x11aabb,0x4444dd,0x3311bb,0x3b0cbd,0x442299];
	if(start.slots && (start.slots.helmet && start.slots.helmet.name=="partyhat" || start.slots.mainhand && start.slots.mainhand.name=="ornamentstaff") && args.color!="heal")
	{
		shuffle(party);
		args.size=1;
		args.color=party[0];
		d_line({x:get_x(start)-1,y:get_y(start)-1},{x:get_x(end)-1,y:get_y(end)-1},{color:party[1]});
	}
	else if(!args.color || args.color=="attack") args.color=0x980B00 //0xE01100;
	else if(args.color=="heal") args.color=0xE08593;
	else if(args.color=="taunt") args.color=0x707070;
	else if(args.color=="burst") args.color=0x428FAE,args.size=3;
	else if(args.color=="supershot") args.color=0x9B172E,args.size=2;
	else if(args.color=="reflect") args.color=0x8A4AA2,args.size=2;
	else if(args.color=="curse") args.color=0x7D4DAA,args.size=2;
	else if(args.color=="evade") args.color=0x808B94;
	else if(args.color=="my_hit") args.color=0x2C8E25; //0x2A9A28
	else if(args.color=="gold") args.color=0xFFD700;
	else if(args.color=="item") args.color=0x3EA2B3;
	else if(args.color=="cx") args.color=hx("#DC8BD4");
	else if(args.color=="mana") args.color=eval(colors.mp.replace("#","0x"));
	else if(args.color=="mluck") args.color=eval("#9BF984".replace("#","0x"));
	else if(args.color=="warrior") args.color=0xE07523,args.size=3;
	else if(args.color && args.color.startsWith && args.color.startsWith("#")) args.color=eval(args.color.replace("#","0x"));

	e=new PIXI.Graphics();
	e.lineStyle(args.size||1, args.color);
	e.moveTo(get_x(start),get_y(start)-2);
	e.lineTo(get_x(end),get_y(end)-2);
	e.endFill();
	map.addChild(e);
	function disappear_line(step,line)
	{
		return function(){
			line.alpha-=0.08;
			if(step<10) draw_timeout(disappear_line(step+1,line),20);
			else
			{
				remove_sprite(line);
				try{ line.destroy(); }catch(e){}
			}
		}
	}
	draw_timeout(disappear_line(0,e),20);
}

function step_d_texts(entity,add)
{
	var to_remove=[];
	for(var i=0;i<entity.texts.length;i++)
	{
		var text=entity.texts[i];
		var ms=mssince(text.last_fade),y=round(4*ms/text.anim_time)+(add||0);
			// console.log(y);
		if(2<y && y<7) y=4;
		text.y-=text.disp_m*y; // Originally just "-=y" [03/12/17] // removed parseInt() [29/06/18]
		text.alpha=max(0,text.alpha-(0.142*ms/text.anim_time));
		text.last_fade=new Date();
		if(text.alpha>0.25);
		else
		{
			remove_sprite(text);
			try{ text.destroy({texture:true,baseTexture:true}); }catch(e){console.log(e);} // dirty fix: [20/08/16] #PIXI
			to_remove.push(i);
		}
	}
	for(var i=to_remove.length-1;i>=0;i--)
	{
		entity.texts.splice(to_remove[i],1);
	}
}

function shift_d_texts(entity,add)
{
	for(var i=0;i<entity.texts.length;i++)
	{
		var text=entity.texts[i];
		text.y-=add||0;
		if(entity.texts[i+1] && text.y-entity.texts[i+1].y<10)
			add=10-(text.y-entity.texts[i+1].y);
		else
			break;
	}
}

function d_text_new(message,entity,args)
{
	var x=0,y=-get_height(entity);
	if(entity.name_tag || entity.hp_bar) y-=12;
	if(mode.dom_tests_pixi || no_graphics || paused) return;
	if(!args) args={};
	var color=args.color||"#4C4C4C",fx=null; // "#383537" before text_quality = 2 as default [16/08/16]
	if(color=="hp") color="green";
	else if(color=="mp") color="#317188"; // previously "#006AA9"
	else if(color=="damage") color="#C80000"; // previously "red"
	else if(color=="+gold") color="gold";
	else if(color=="stun") color="#FF9601",y-=6;
	else if(color=="sugar") color="#D64770";
	else if(color=="freeze") color="#53C1FF",y-=6;
	else if(color=="burn") color="#FD9644",y-=6;
	else if(color=="crit") color="#D32D51",y-=6;
	else if(color=="sneak") color="#2D9B41",y-=6;
	else if(color=="mana") color=colors.mp;
	else if(color=="elixir") color="#E06A63";
	else if(color=="evade") color="#808B94";
	else if(color=="reflect") color="#6D62A2";
	else if(color=="supershot") color="#9B172E",y-=6;
	else if(color=="quickpunch") color="#41338B",y-=6;
	else if(color=="mentalburst") color="#4C9AE0",y-=6;
	else if(color=="burst") color="#2A8A9A",size="large";
	else if(color=="poison") color=colors.poison,size="large",y-=6;
	else if(color=="1mxp") color="#FFFFFF",fx="glow";
	else if(colors[color]) color=colors[color];
	var size=SZ[args.size]||args.size||SZ.normal;
	// console.log(size);
	var animate=!args.dont_animate;
	var offset=0;
	var text=new PIXI.Text(message,{fontFamily:SZ.font,fontSize:size*text_quality,fontWeight:"bold",fill:color,align:"center",dropShadow:true,dropShadowColor:"#909090",dropShadowDistance:1,dropShadowAngle:Math.PI/2}); //,fontWeight:"bold"
	//,dropShadow:true,dropShadowColor:"#B0B0B0",dropShadowDistance:1,dropShadowAngle:-Math.PI/2
	text.parentGroup=text.displayGroup=text_layer;
	
	text.disp_m=SZ.normal/18.0;
	if(size>SZ.normal) text.disp_m=(SZ.normal+1)/18.0;
	text.anim_time=max(75,parseInt(100*18.0/size)); // Originally just 100 [03/12/17]
	text.type='text';
	text.alpha=1; text.last_fade=new Date();
	text.anchor.set(0.5,1);
	if(fx) start_filter(text,fx);
	if(text_quality>1) text.scale=new PIXI.Point((entity.mscale||1)/text_quality,(entity.mscale||1)/text_quality);

	//twidth=text.width,offset=0;
	//if(round(twidth)!=twidth) offset=0.5;

	text.x=round(x);
	text.y=round(y)+offset;
	if(args.y) text.y-=args.y;
	
	entity.addChild(text);
	
	entity.texts=entity.texts||[];
	if(entity.texts.length && text.y-entity.texts[0].y<10)
		shift_d_texts(entity,10-(text.y-entity.texts[0].y));
	entity.texts.splice(0,0,text);

	if(args.s) sfx(args.s,text.x,text.y);
}

function d_text(message,x,y,args)
{
	var sprite=null;
	if(mode.dom_tests_pixi || no_graphics || paused) return;
	if(is_object(x))
	{
		if(x.type && mode.use_new_d_texts) return d_text_new(message,x,y);
		sprite=x; args=y;
		x=get_x(sprite);
		y=get_y(sprite)-(sprite.aheight||sprite.height)-(sprite.hp_bar&&15||2);
		if(sprite.mscale==2) y+=14;
	}
	if(!args) args={};
	var color=args.color||"#4C4C4C",fx=null; // "#383537" before text_quality = 2 as default [16/08/16]
	if(color=="hp") color="green";
	else if(color=="mp") color="#317188"; // previously "#006AA9"
	else if(color=="damage") color="#C80000"; // previously "red"
	else if(color=="+gold") color="gold";
	else if(color=="stun") color="#FF9601";
	else if(color=="sugar") color="#D64770";
	else if(color=="freeze") color="#53C1FF";
	else if(color=="burn") color="#FD9644";
	else if(color=="crit") color="#D32D51";
	else if(color=="sneak") color="#2D9B41";
	else if(color=="mana") color=colors.mp;
	else if(color=="elixir") color="#E06A63";
	else if(color=="evade") color="#808B94";
	else if(color=="reflect") color="#6D62A2";
	else if(color=="burst") color="#2A8A9A",size="large";
	else if(color=="poison") color=colors.poison,size="large";
	else if(color=="1mxp") color="#FFFFFF",fx="glow";
	else if(colors[color]) color=colors[color];
	var size=SZ[args.size]||args.size||SZ.normal;
	// if(args.size=="huge" || args.size=="large") y=-10;
	// console.log(size);
	var parent=args.parent||window.map;
	var animate=!args.dont_animate;
	var offset=args.offset||0;
	var delay=1000;
	var text=new PIXI.Text(message,{fontFamily:SZ.font,fontSize:size*text_quality,fontWeight:"bold",fill:color,align:"center"}); //,fontWeight:"bold"
	//,dropShadow:true,dropShadowColor:"#B0B0B0",dropShadowDistance:1,dropShadowAngle:-Math.PI/2
	if(use_layers) text.parentGroup=text_layer;
	else text.displayGroup=text_layer;
	
	text.disp_m=SZ.normal/18.0;
	if(size>SZ.normal) text.disp_m=(SZ.normal+1)/18.0;
	text.anim_time=max(75,parseInt(100*18.0/size)); // Originally just 100 [03/12/17]
	text.type='text';
	text.alpha=1; text.last_fade=new Date();
	text.anchor.set(0.5,1);
	if(fx) start_filter(text,fx);
	if(text_quality>1) text.scale=new PIXI.Point(1/text_quality,1/text_quality);

	//twidth=text.width,offset=0;
	//if(round(twidth)!=twidth) offset=0.5;

	text.x=round(x);
	text.y=round(y)+offset;
	if(args.y) text.y-=args.y;
	
	parent.addChild(text);
	function disappear_text(step,text)
	{
		return function(){
			var ms=mssince(text.last_fade),y=round(4*ms/text.anim_time);
			// console.log(y);
			if(2<y && y<7) y=4;
			text.y-=text.disp_m*y; // Originally just "-=y" [03/12/17] // removed parseInt() [29/06/18]
			text.alpha=max(0,text.alpha-(0.078*ms/text.anim_time));
			text.last_fade=new Date();
			if(text.alpha>0.25) draw_timeout(disappear_text(step+1,text),text.anim_time);
			else
			{
				remove_sprite(text);
				try{ text.destroy({texture:true,baseTexture:true}); }catch(e){console.log(e);} // dirty fix: [20/08/16] #PIXI
			}
		}
	}
	function old_disappear_text(step,text)
	{
		return function(){
			text.position.y-=4;
			text.alpha-=0.08;
			if(step<10) draw_timeout(disappear_text(step+1,text),text.anim_time);
			else
			{
				remove_sprite(text);
				try{ text.destroy({texture:true,baseTexture:true}); }catch(e){console.log(e);} // dirty fix: [20/08/16] #PIXI
			}
		}
	}
	draw_timeout(disappear_text(0,text),text.anim_time);

	if(args.s) sfx(args.s,text.x,text.y);
}

function api_call(method,args,r_args)
{
	if(!args) args={}; if(!r_args) r_args={};
	var api_path="/api/"+method,disable=r_args.disable;
	if(args.ui_loader) { r_args.r_id=randomStr(10); delete args.ui_loader; }
	if(args.callback) { r_args.callback=args.callback; delete args.callback; }
	if(disable) disable.addClass("disable");
	if(window.is_electron) args.epl=electron_data.platform;
	data={ 'method':method, 'arguments':JSON.stringify(args) };
	function on_success(r_args,disable) {
		return function(ct) {
			if(r_args.r_id) hide_loader(r_args.r_id);
			if(r_args.callback) r_args.callback.apply(this,[ct]);
			else handle_information(ct);
			if(r_args.success) smart_eval(r_args.success);
			if(disable) disable.removeClass("disable");
			if(r_args.pid) resolve_deferred("api_call"+r_args.pid);
		}
	}
	function on_error(r_args,disable)
	{
		return function(ct) {
			if(r_args.r_id) hide_loader(r_args.r_id);
			if(r_args.silent || in_arr(method,auto_api_methods)) return;
			ui_error("An Unknown Error [HTTP]"); error_ct=ct;
			if(method!="log_error" && ct.status+""!="0") 
				setTimeout(function(ct,api_path){ return function(){api_call("log_error",{type:"api_call_error",err:ct.status+" "+ct.statusText+" on "+api_path,info:ct.getAllResponseHeaders()}); }}(ct,api_path),40000);
			if(disable) disable.removeClass("disable");
			if(r_args.pid) reject_deferred("api_call"+r_args.pid);
		}
	}
	if(r_args.r_id) show_loader(r_args.r_id);
	call_args={type:'POST',dataType:"json",url:window.location.origin+api_path,data:data,success:on_success(r_args,disable),error:on_error(r_args,disable)}
	$.ajax(call_args);
	if(r_args.promise)
	{
		r_args.pid=randomStr(20);
		return push_deferred("api_call"+r_args.pid);
	}
}

function api_call_l(method,args,r_args)
{
	if(!args) args={};
	args.ui_loader=true;
	return api_call(method,args,r_args);
}

var last_llevel=-1;
function light_logic()
{
	if(!mode.ltbl || no_graphics) return;
	
	var c=new Date(),h=c.getUTCHours(),m=c.getUTCMinutes();
	if(S.schedule && S.schedule.time_offset) h=(24+S.schedule.time_offset+h)%24;

	var llevel=1,bonus=0;
	var levels=[0,0,0,0,0,0.2,0.6,0.9,1,1,1,1,1,1,1,1,1,1,1,0.9,0.4,0,0,0,0];

	llevel=(levels[h]*(60-m)+levels[h+1]*(m))/60;
	bonus=llevel/5;

	if(!G.maps[current_map].outside && G.maps[current_map].lux) llevel=G.maps[current_map].lux+bonus;
	if(G.maps[current_map].outside && G.maps[current_map].lux) llevel=min(llevel,G.maps[current_map].lux);

	llevel=max(0,min(llevel,1));

	var alpha=1;
	var levels=[1,1,1,1,1,1,1,1,1,1,1,0.8,0.7,0.8,0.9,1,1,1,1,1,1,1,1,1,1];
	if(G.maps[current_map].outside && !G.maps[current_map].lux) alpha=(levels[h]*(60-m)+levels[h+1]*(m))/60;
	// if(llevel) alpha=0.5;

	if(llevel==last_llevel) return;

	lighting.clearColor = [0.55+llevel*0.45,0.55+llevel*0.45,0.55+llevel*0.45,alpha];

	map_nights.forEach(function(l){
		l.alpha=min(1,max(0,0.8-llevel))
	})

	map_lights.forEach(function(l){
		l.alpha=min(1,max(0,0.8-llevel))
	})

	if(is_sdk) console.log(lighting.clearColor);

	last_llevel=llevel+" "+alpha;
}

var warned={};
function new_map_logic(place,data)
{
	future_entities={players:{},monsters:{}};
	I=data.info||{};
	//console.log(JSON.stringify(I));

	if(current_map=="resort") add_log("Resort is a prototype with work in progress","#ADA9E4");
	if(current_map=="tavern")
	{
		if(I.dice=="roll")
			map_machines.dice.shuffling=true,map_machines.dice.num=undefined,delete map_machines.dice.lock_start,map_machines.dice.locked=0;
		if(I.dice=="lock")
			map_machines.dice.shuffling=true,map_machines.dice.num=I.num,map_machines.dice.lock_start=future_ms(-1200),map_machines.dice.locked=0;
		if(I.dice=="bets")
			map_machines.dice.shuffling=false,map_machines.dice.num=I.num,map_machines.dice.seconds=I.seconds,map_machines.dice.count_start=future_s(-I.seconds);
		add_log("Tavern is a prototype with work in progress","#63ABE4");
	}
	else dice_bet.active=false,topleft_npc=false;

	if(is_pvp && (place=="start" || place=="welcome")) add_log("This is a PVP Server. Be careful!","#E1664C");
	if(place=="map" && !is_pvp && G.maps[current_map].safe_pvp && !warned[current_map]) warned[current_map]=1,add_log("This is a Safe PVP Zone. You can lose recently looted items if someone defeats you!","#E1664C");
	else if(place=="map" && !is_pvp && G.maps[current_map].pvp && !warned[current_map]) warned[current_map]=1,add_log("This is a PVP Zone. Be careful!","#E1664C");
	else if(place=="map" && is_pvp && G.maps[current_map].safe && !warned[current_map]) warned[current_map]=1,add_log("This is a Safe Zone. No one can hurt you here!","#9DE85E");
	light_logic();
	render_map();
}

function new_game_logic()
{
	if(gameplay=="hardcore") hardcore_logic();
	if(gameplay=="test") test_logic();
}

function ui_log(m,color)
{
	add_log(m,color);
}

function ui_error(m)
{
	add_log(m,"red");
}

function ui_success(m)
{
	add_log(m,"green");
}

function load_code_s(num)
{
	if(num=="#")
	{
		show_alert("To delete a code slot, simply enter DELETE as the slot name and save the slot!");
	}
	else
	{
		$(".csharp").val(""+num);
		$(".codename").val(X.codes[num]&&X.codes[num][0]||"Empty");
	}
}

function save_code_s()
{
	if(!$(".csharp").val()) return;
	api_call("save_code",{code:codemirror_render.getValue(),slot:$(".csharp").val(),name:$(".codename").val(),log:1});
}

var last_servers_and_characters=new Date();
setInterval(function(){
	if(!window.inside) return;
	if(inside=="game" && ssince(last_servers_and_characters)>89 || inside=="game" && character && !character.afk && ssince(last_servers_and_characters)>4 || inside=="selection" && ssince(last_servers_and_characters)>4 || window.is_comm && ssince(last_servers_and_characters)>4)
	{
		api_call("servers_and_characters");
		last_servers_and_characters=new Date();
	}
},2000);

function update_servers_and_characters()
{
	var keys={1:null,2:null,3:null,"merchant":null},order=1,c_count=0;
	X.characters.forEach(function(character){
		if(character.online) $(".characterav"+character.name).html('<span style="color: #F3A05D">[I]</span>');
		else $(".characterav"+character.name).html('<span style="color: #A4FA64">[A]</span>');

		if(!character.online) return;
		
		if(character.type=="merchant") keys.merchant=character;
		else if(order<=3) keys[order]=character,order+=1;
	});
	[1,2,3,"merchant"].forEach(function(key){
		if(!keys[key]) $(".characterr"+key).html("<span style='color: orange'>Offline</span>");
		else $(".characterr"+key).html("<span style='color: green'>"+keys[key].name+"</span>"),c_count+=1;
	});
	$(".ccount").html(c_count);
	if($(".cclist").length) load_character_list();
	if($(".sslist").length) load_servers_list();
	if(!X.unread)
		$(".comcount").html("");
	else
		$(".comcount").html(" ["+X.unread+"]");
	$(".mcount").html(X.unread);
}

function load_base_code()
{
	if(character && X.codes[real_id])
		show_confirm("If you load the base code and engage, your default character slot will be overwritten by it, are you sure you want to load the default base code?",["#D06631","Yes"],"No!",function(){ load_code("0",1); hide_modal(true);});
	else
		load_code("0",1);
}

function handle_information(infs)
{
	for(var i=0;i<infs.length;i++)
	{
		info=infs[i];
		call_code_function("trigger_event","api_response",info);
		if(info.type=="code_list")
		{
			if(info.purpose=="load")
			{
				var html="<div style='width: 520px'>",one=false;
				// info.list={};
				var ui_list=clone(info.list);
				X.codes=info.list;
					if(code_change)
					{
						html+="<div class='gamebutton block' style='margin-bottom: -4px'><span style='color: #E46A64'>[WARNING]</span> Unsaved Changes</div>";
					}
					html+='<div class="gamebutton block" style="display: block; margin-bottom: -4px" onclick="open_guide(\'8-code-slots-and-files\',\'/docs/guide/code/8-code-slots-and-files\')"><span style="color: #6FD23F">[Documentation]</span> Code Slots and Files</div>';
					html+="<div class='gamebutton block' style='margin-bottom: -4px' onclick='load_base_code()'><span style='color: gray'>[Default]</span> Load Base Code</div>";
					if(character)
					{
						html+="<div class='gamebutton block' style='margin-bottom: -4px' onclick='load_code(\""+(X.codes[real_id]&&real_id||"0")+"\",1)'><span style='color: #D46E33'>[Character Default]</span> "+character.name+"</div>";
					}
					for(var num in ui_list)
					{
						if(num==real_id) continue;
						var sname=num,lnum=num;
						if(parseInt(num)>100) color="#D46E33",sname="Character Default";
						else color=colors.code_blue;
						if(!X.codes[num]) lnum=0;
						html+="<div class='gamebutton block' style='margin-bottom: -4px' onclick='load_code(\""+lnum+"\",1)'><span style='color: "+color+"'>["+sname+"]</span> "+ui_list[num][0]+"</div>";
						one=true;
					}
					html+="<div style='margin-top: 10px; font-size: 24px; line-height: 28px; border: 4px solid gray; background: black; padding: 16px;'>";
						html+="<div>You can also load codes into your code. For example, you can save your 'Functions' in one code slot, let's say 2, and inside another code slot, you can:<br /><span class='label' style='height: 24px; margin: -2px 0px 0px 0px;'>load_code(2)</span> or <span class='label' style='height: 24px; margin: -2px 0px 0px 0px;'>load_code('Functions')</span></div>";
						// html+="<div>To delete a code slot, enter 'delete' in the name field.</div>";
					html+="</div>";
				html+="</div>";
				show_modal(html,{keep_code:true,wrap:false});
			}
			else if(info.purpose=="save")
			{
				var html="<div style='width: 520px'>",one=false;
				var c_slot=code_slot,c_name="";
				if(c_slot)
					for(var num in info.list)
						if(parseInt(num)==c_slot) c_name=info.list[num][0];
					html+="<div style='box-sizing: border-box; width: 100%; text-align: center; margin-bottom: 8px;'>";
						// The id's and name's etc. are all to prevent autocomplete [13/03/19]
						// https://stackoverflow.com/a/38961567/914546
						html+="<input type='text' style='box-sizing: border-box; width: 15%;; float: left' placeholder='#' autocomplete='nope' id='alcodenumx' name='alcodenumx' class='csharp cinput'/>";
						html+="<input type='text' style='box-sizing: border-box; width: 63%;' placeholder='NAME' autocomplete='nope' id='alcodeinputx' name='alcodeinputx' class='codename cinput' />";
						html+="<div class='gamebutton' style='box-sizing: border-box; width: 20%; padding: 8px; float: right' onclick='save_code_s()'>SAVE</div>";
					html+="</div>";
					// info.list={};
					var ui_list=clone(info.list);
					X.codes=info.list;
					if(!Object.keys(ui_list).length) ui_list={"1":["Empty",0],"2":["Empty",0]};
					for(var i=1;i<=100;i++)
						if(!ui_list[i])
						{
							ui_list[i]=["Empty",0];
							c_slot=""+i;
							c_name="Empty";
							break;
						}
					
					if(character.ctype!="merchant")
						for(var num in ui_list)
						{
							if(parseInt(num)>100)
								delete ui_list[num];
						}
					if(character && !ui_list[real_id]) ui_list[real_id]=[character.name,0];
					ui_list["#"]=["DELETE",0];
					html+='<div class="gamebutton block" style="display: block; margin-bottom: -4px" onclick="open_guide(\'8-code-slots-and-files\',\'/docs/guide/code/8-code-slots-and-files\')"><span style="color: #6FD23F">[Documentation]</span> Code Slots and Files</div>';
					for(var num in ui_list)
					{
						if(parseInt(num)>100) color="#975CAD";
						else if(num=="#") color="gray";
						else color=colors.code_pink;
						html+="<div class='gamebutton block' style='margin-bottom: -4px' onclick='load_code_s(\""+num+"\")'><span style='color: "+color+"'>["+(num==real_id&&"YOUR BASE CODE"||num)+"]</span> "+ui_list[num][0]+"</div>";
						one=true;
					}
					html+="<div style='margin: 10px 5px 5px 5px; font-size: 24px; line-height: 28px'>";
					html+="</div>";
				html+="</div>";
				// if(!one) html+="<div align='center'>You don't have any saved Code's yet</div>";
				show_modal(html,{keep_code:true,wrap:false});
				if(c_slot) $('#alcodenumx').val(c_slot);
				if(c_name) $('#alcodeinputx').val(c_name);
			}
			else show_json(info.list);
		}
		else if(info.type=="servers_and_characters")
		{
			X.servers=info.servers;
			X.characters=info.characters;
			X.tutorial=info.tutorial;
			X.unread=info.mail;
			if(window.character && info.code_list[code_slot] && (!X.codes[code_slot] || info.code_list[code_slot][1]>X.codes[code_slot][1]))
			{
				add_log("External code update detected!","#5BAC57");
				add_log("Syncing ...","#5BAC57");
				api_call("load_code",{name:code_slot,run:'',log:true});
			}
			if(is_electron && electron_is_main())
			{
				var delay=0;
				for(var num in X.codes)
				{
					if(!info.code_list[num])
						file_op_queue[num]=["remove",num,X.codes[num][1]];
				}
				for(var num in info.code_list)
				{
					if(!X.codes[num] || !code_ref[num] || X.codes[num][1]>code_ref[num].v)
						file_op_queue[num]=["download",num,info.code_list[num][1]];
				}
			}
			X.codes=info.code_list;
			update_servers_and_characters();
			if(window.is_comm) render_characters(),render_servers();
		}
		else if(info.type=="unread")
		{
			X.unread=info.count;
			update_servers_and_characters();
		}
		else if(info.type=="reload")
		{
			var reload_time=future_s(10);
			storage_set("reload"+server_region+server_identifier,JSON.stringify({time:reload_time,ip:info.ip,port:""+info.port}));
		}
		else if(info.type=="friends")
		{
			load_friends(info);
		}
		else if(info.type=="mail")
		{
			//show_json(info);
			load_mail(info);
		}
		else if(info.type=="messages")
		{
			// show_json(info);
			load_chat(info,info.mtype);
		}
		else if(info.type=="merchants")
		{
			// show_json(info);
			merchants={};
			load_merchants(info);
		}
		else if(in_arr(info.type,["ui_log","message"]))
		{
			if(info.color) add_log(info.message,info.color);
			else ui_log(info.message);
		}
		else if(info.type=="code_info")
		{
			if(info['delete'])
				delete X.codes[info.num];
			else
				X.codes[info.num]=[info.name,info.v];
		}
		else if(info.type=="libraries")
		{
			var folder=ide_root+"/adventureland/libraries";
			fs.promises.writeFile(folder+"/default_code.js",info.default_code.toString(),"utf8");
			fs.promises.writeFile(folder+"/runner_functions.js",info.runner_functions.toString(),"utf8");
			fs.promises.writeFile(folder+"/runner_compat.js",info.runner_compat.toString(),"utf8");
			fs.promises.writeFile(folder+"/common_functions.js",info.common_functions.toString(),"utf8");
			storage_set("lib_version",VERSION+""+user_id);
		}
		else if(info.type=="code")
		{
			info.code=""+info.code; // apparently it's possible to store objects
			if(info.slot>0 && info.v) X.codes[info.slot]=[info.name,info.v];
			if(info.save)
			{
				if(is_electron && electron_is_main())
					file_op_queue[info.slot]=["save",info.slot,info.code,info.v];
			}
			else
			{
				codemirror_render.setValue(info.code);
				code_change=false;

				new_code_slot=(!info.slot)&&real_id||info.slot;

				if(info.reset || new_code_slot!=code_slot) codemirror_render.clearHistory();
				
				code_slot=new_code_slot;

				if(info.run)
				{
					if(code_run) toggle_runner(),toggle_runner();
					else toggle_runner();
				}
				else if(info.code.indexOf("autorerun")!=-1)
				{
					if(code_run) toggle_runner(),toggle_runner();
				}

				if(parseInt(code_slot)<=100)
					$(".codeslottype").html(""+code_slot);
				else
					$(".codeslottype").html("Character");

				$(".codeslotname").html(""+(X.codes[code_slot]&&X.codes[code_slot][0]||"Default Code"));
			}
		}
		else if(info.type=="gcode")
		{
			var html="";
			html+="<textarea id='gcode'>"+info.code+"</textarea>";
			show_modal(html);
		}
		else if(info.type=="article")
		{
			if(info.tutorial)
			{
				render_tutorial(info.html,parseInt(info.tutorial),info.url||"/docs");
			}
			else if(info.guide)
			{
				render_learn_article(info.html,{url:info.url||"/docs",prev:info.prev,next:info.next});
			}
			else if(info.func)
			{
				render_function_html=info.html;
				render_function_reference(info.func,undefined,undefined);
			}
			else
			{
				render_learn_article(info.html,{url:info.url||"/docs",prev:info.prev,next:info.next});
			}
		}
		else if(info.type=="tutorial_data")
		{
			delete info.type;
			X.tutorial=info;
			if(info.next)
			{
				small_success(character,{color:"purple"});
				delete info.next;
				setTimeout(open_tutorial,1000);
			}
			else if(info.success)
			{
				small_success(character,{color:"success"});
				delete info.success;
			}
			update_tutorial_ui();
		}
		else if(info.type=="chat_message")
		{
			add_chat("",info.message,info.color);
		}
		else if(in_arr(info.type,["ui_error","error"]))
		{
			if(inside=="message") $("#message").html(info.message);
			else ui_error(info.message);
		}
		else if(in_arr(info.type,["success"]))
		{
			if(inside=="message") $("#message").html(info.message);
			else ui_success(info.message);
		}
		else if(info.type=="content")
		{
			$("#content").html(info.html);
			resize();
		}
		else if(info.type=="eval")
		{
			smart_eval(info.code);
		}
		else if(info.type=="func")
		{
			smart_eval(window[info.func],info.args);
		}
		else if(info.type=="refresh")
		{
			refresh_page();
		}
		else if(info.type=="pcs") pcs(info.sound);
	}
}

function add_alert(e)
{
	console.log("caught exception: "+e);
	if(is_sdk) alert(e);
}

function sfx(type,x,y)
{ try {
	if(!window.sound_sfx || no_html) return;
	var sound=null;
	if(type=="hit" || type=="monster_hit") sound=sounds.hit_8bit;
	if(type=="explosion") sound=sounds.fx_explosion;
	if(type=="coins") sound=sounds.coin_collect;
	if(type=="hp" || type=="mp") sound=sounds.use_8bit;
	if(type=="chat") sound=sounds.chat;
	if(type=="walk") sound=sounds.walk;
	if(type=="npc") sound=sounds.drop;
	if(!sound && sounds[type]) sound=sounds[type];
	if(sound)
	{
		if(x===undefined) sound.play();
		else
		{
			if(mode.directional_sfx)
			{
				sound.orientation(0,0,0);
				sound.pos((-x+map.real_x)/120.0,(y-map.real_y)/120.0,0);
				sound.play();
			}
			else
			{
				var distance=point_distance(x,y,map.real_x,map.real_y),volume=1;
				if(!sound.original_volume) sound.original_volume=sound.volume();
				if(distance>700) volume=0.05;
				else if(distance>500) volume=0.075;
				else if(distance>400) volume=0.10;
				else if(distance>300) volume=0.15;
				else if(distance>250) volume=0.175;
				else if(distance>275) volume=0.2;
				else if(distance>250) volume=0.25;
				else if(distance>225) volume=0.3;
				else if(distance>200) volume=0.4;
				else if(distance>175) volume=0.45;
				else if(distance>150) volume=0.5;
				else if(distance>125) volume=0.6;
				else if(distance>100) volume=0.7;
				else if(distance>75) volume=0.8;
				else if(distance>50) volume=0.9;
				sound.volume(sound.original_volume*volume);
				// console.log(distance+" "+sound.original_volume*volume);
				sound.play();
			}
		}
	}
} catch(e) { add_alert(e); } }

function tut(name)
{try{
	if(X && X.tutorial && X.tutorial.task==name)
	{
		api_call("tutorial",{task:name});
	}
} catch(e) { console.error("FATAL: tut() "+name); } }

function pcs(type)
{
	if(!window.sound_sfx) return;
	if(!type || type==0)
	{
		if(sounds.click) sounds.click.play();
	}
	if(type=="success" && sounds.success) sounds.success.play();
}

function init_sounds()
{
	if(!window.Howl) {sound_music=false; sound_sfx=false; add_log("Sound issue (Howl). Turned sound off"); return;}
	if(no_html) return;
	sounds.click = new Howl({
		src: [url_factory("/sounds/effects/click_natural.wav")],
		volume:0.32,
	});
	if(sound_sfx) init_fx();
	if(sound_music) init_music();
}

function init_fx()
{
	if(!window.Howl) {sound_music=false; sound_sfx=false; add_log("Sound issue (Howl). Turned sound off"); return;}
	if(window.fx_init) return;
	window.fx_init=1;
	sounds.fx_explosion = new Howl({
		src: [url_factory("/sounds/fx/EXPLOSION_Short_Kickback_Crackle_stereo.wav")],
		volume:0.3,
	});
	sounds.coin_collect = new Howl({
		src: [url_factory("/sounds/fx/pop_plink.wav")],
		volume:0.2, // 0.1 for Coin's
	});
	sounds.drop_egg = new Howl({
		src: [url_factory("/sounds/fx/ANIMAL_Duck_08_mono.wav")],
		volume:0.2, // 0.1 for Coin's
	});
	// sounds.hit_8bit = new Howl({
	// 	src: [url_factory("/sounds/fx/8BIT_RETRO_Hit_Bump_Noise_mono.wav")],
	// 	volume:0.1,
	// });
	sounds.hit_8bit = new Howl({
		src: [url_factory("/sounds/fx/zap_drum.wav")],
		volume:0.2, // 0.1 for Coin's
	});
	sounds.magic_8bit = new Howl({
		src: [url_factory("/sounds/fx/8BIT_RETRO_Fire_Blaster_Short_mono.wav")],
		volume:0.4,
	});
	// sounds.use_8bit = new Howl({
	// 	src: [url_factory("/sounds/fx/VideoGameSFX_blip_07.wav")],
	// 	volume:0.10,
	// });
	sounds.use_8bit = new Howl({
		src: [url_factory("/sounds/fx/pop_plink.wav")],
		volume:0.16,
	});
	sounds.chat = new Howl({
		src: [url_factory("/sounds/fx/UI_Beep_Double_Quick_Smooth_stereo.wav")],
		volume:0.5,
	});
	sounds.walk=new Howl({
		src:[url_factory("/sounds/fx/FOOTSTEP_Asphalt_Trainers_Walk_Slow_RR5_mono.wav")],
		volume:0.6,
	});
	sounds.drop=new Howl({
		src:[url_factory("/sounds/fx/DROP_Designed_mono.wav")],
		volume:0.4,
	});
	sounds.open=new Howl({
		src:[url_factory("/sounds/fx/CLASP_Plastic_Open_stereo.wav")],
		volume:0.4,
	});
	sounds.whoosh=new Howl({
		src:[url_factory("/sounds/fx/WHOOSH_Air_Fast_Wind_RR1_mono.wav")],
		volume:0.2,
	});
	sounds.reflect=new Howl({
		src:[url_factory("/sounds/fx/MAGIC_SPELL_Spawn_mono.wav")],
		volume:0.15,
	});
	sounds.crackle01=new Howl({
		src:[url_factory("/sounds/fx/Explosive01.wav")],
		volume:0.15,
	});
	sounds.crackle0=new Howl({
		src:[url_factory("/sounds/fx/Explosive02.wav")],
		volume:0.15,
	});
	sounds.level_up=new Howl({
		src:[url_factory("/sounds/fx/MUSIC_EFFECT_Bell_Voice_Positive_09_stereo.wav")],
		volume:0.2,
	});
}

function performance_trick()
{
	if(!window.Howl) return;
	if(sounds.empty) return sounds.empty.play();
	sounds.empty = new Howl({
		src: [url_factory("/sounds/loops/empty_loop_for_js_performance.ogg"),url_factory("/sounds/loops/empty_loop_for_js_performance.wav")],
		volume:0.5,
		autoplay: true, loop: true,
	});
	sounds.empty.cplaying=true;
}

function init_music()
{
	if(!window.Howl) {sound_music=false; sound_sfx=false; add_log("Sound issue (Howl). Turned sound off"); return;}
	if(window.music_init) return;
	window.music_init=1;
	sounds.christmas = new Howl({
		src: [url_factory("/sounds/loops/christmas.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	if(xmas_tunes) return;
	sounds.horror01 = new Howl({
		src: [url_factory("/sounds/loops/horror_01_loop.ogg")], // ,url_factory("/sounds/loops/horror_01_loop.xwav")
		volume:0.15*music_level,
		autoplay: false, loop: true,
	});
	sounds.horror02 = new Howl({
		src: [url_factory("/sounds/loops/horror_02_loop.ogg")],
		volume:0.15*music_level,
		autoplay: false, loop: true,
	});
	sounds.casual05 = new Howl({
		src: [url_factory("/sounds/loops/casual_05_loop.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	sounds.casual02 = new Howl({
		src: [url_factory("/sounds/loops/casual_02_loop.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	sounds.rpg07 = new Howl({
		src: [url_factory("/sounds/loops/rpg_07_loop.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	sounds.rpg08 = new Howl({
		src: [url_factory("/sounds/loops/rpg_08_loop.ogg")], // ,,url_factory("/sounds/loops/rpg_08_loop.xwav")
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	sounds.rpg10 = new Howl({
		src: [url_factory("/sounds/loops/rpg_10_loop.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	sounds.rpg14 = new Howl({
		src: [url_factory("/sounds/loops/rpg_14_loop.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	sounds.rpg16 = new Howl({
		src: [url_factory("/sounds/loops/rpg_16_loop.ogg")],
		volume:0.2*music_level,
		autoplay: false, loop: true,
	});
	// sounds.rpg20 = new Howl({
	// 	src: [url_factory("/sounds/loops/rpg_20_loop.xogg")],
	// 	volume:0.4*music_level,
	// 	autoplay: false, loop: true,
	// });
}

var current_music=null;
function reflect_music()
{
	var the_music=sounds.rpg08;
	if(!window.Howl) {sound_music=false; sound_sfx=false; add_log("Sound issue (Howl). Turned sound off"); return;}
	if(!sound_music)
	{
		if(current_music) current_music.stop();
		current_music=null;
		return;
	}
	if(current_map=="tavern") the_music=sounds.rpg10;
	if(in_arr(current_map,["cave","halloween","spookytown"]) || current_map.startsWith("level")) the_music=sounds.rpg14;
	if(current_map.startsWith("winter_inn")) the_music=sounds.rpg16;
	if(current_map=="desertland") the_music=sounds.rpg07;
	if(current_map=="winterland" || xmas_tunes) the_music=sounds.christmas;
	if(current_map=="bank") the_music=sounds.casual05;
	if(current_map=="goobrawl") the_music=sounds.casual02;
	if(current_map=="crypt" || current_map=="winter_instance") the_music=sounds.horror02;
	if(current_music!=the_music && the_music)
	{
		if(current_music) current_music.stop();
		current_music=the_music;
		the_music.play();
	}
}

function sound_on()
{
	if(is_electron) Cookies.set('music','on',{ expires:12*365});
	else if(character) set_setting(real_id,"music","on");
	sound_music='1'; init_music(); reflect_music();
	$('.musicoff').hide();
	$('.musicoffi').hide();
	$('.musicon').show();
	$('.musiconi').css("display","inline-block");
}

function sound_off(just_ui)
{
	if(!just_ui)
	{
		if(is_electron) Cookies.set('music','off',{ expires:12*365});
		else if(character) set_setting(real_id,"music","off");
		sound_music=''; reflect_music();
	}
	$('.musicon').hide();
	$('.musiconi').hide();
	$('.musicoff').show();
	$('.musicoffi').css("display","inline-block");
}

function sfx_on()
{
	if(is_electron) Cookies.set('sfx','on',{ expires:12*365});
	else if(character) set_setting(real_id,"sfx","on");
	sound_sfx='1';
	init_fx();
	$('.sfxoff').hide();
	$('.sfxoffi').hide();
	$('.sfxon').show();
	$('.sfxoni').css("display","inline-block");
}

function sfx_off()
{
	if(is_electron) Cookies.set('sfx','off',{ expires:12*365});
	else if(character) set_setting(real_id,"sfx","off");
	sound_sfx='';
	$('.sfxon').hide();
	$('.sfxoni').hide();
	$('.sfxoff').show();
	$('.sfxoffi').css("display","inline-block");
}

function gprocess_game_data()
{
	if(no_graphics)
	{
		for(var name in G.geometry)
		{
			var GEO=G.geometry[name];
			if(!GEO.data) continue;
			GEO.data.tiles=[];
			GEO.data.placements=[];
			GEO.data.groups=[];
		}
	}
	process_game_data();
}

var BACKUP={};

function reload_data()
{
	BACKUP.maps=G.maps;
	prop_cache={};
	//$("head").append("<script src='/data.js?reload=1&timestamp="+(new Date().getTime())+"' async></script>");
	$.getScript("/data.js?reload=1&timestamp="+(new Date().getTime()));
}

function apply_backup()
{
	G.maps=BACKUP.maps;
	gprocess_game_data();
	BACKUP={};
}

function bc(t,type)
{
	var $this=$(t);
	if($this.hasClass('disabled')) return 1;
	pcs(type);
	return 0;
}

function btc(event,type)
{
	stpr(event);
	pcs(type);
}

function show_loader(){}
function hide_loader(){}

function ui_inspect(e)
{
	var args={};
	if(e.type=="character") args.character_ui=true,args.name=e.id;
	if(e.type=="monster") args.monster_ui=e.mtype,args.name=e.id;
	show_json(game_stringify(e,'\t'),args);
}

function alert_json(j){alert(JSON.stringify(j));}

// PIXI.Sprite.prototype.toJSON=function(){
// 	// maybe make this work: https://stackoverflow.com/a/48961962
// 	var l=["x","y","width","height"],json={};
// 	for(var p in this) l.push(p);
// 	l.forEach(function(p){
// 		json[p]=this[p];
// 	})
// 	return json;
// }

var ignored_properties=["transform","parent","displayGroup","parentGroup","vertexData","animations","tiles","placements","default","children","tempDisplayObjectParent","cachedTint","vertexTrimmedData","hp_bar","blendMode","filterArea","worldAlpha","pluginName","roundPixels","updateOrder","displayOrder","shader","accessible","interactiveChildren","hitArea","cursor","zOrder","accessibleTitle","accessibleHint","parentLayer","layerableChildren","trackedPointers","interactive","tabIndex","zIndex","buttonMode","renderable","cxc"];

function game_stringify(obj,third)
{
	var seen = [];
	try{
		//TODO: Replicate changes on game_stringify_simple
		if(obj===undefined) return "undefined";
		var result=JSON.stringify(obj, function(key, val) {
			if(in_arr(key,ignored_properties) || key.indexOf("filter_")!=-1 || key[0]=="_") return;
			if(key=="data" && obj[key] && obj[key].x_lines) return;
			if (val != null && typeof val == "object") {
				if (seen.indexOf(val) >= 0) {
					return;
				}
				seen.push(val);
				if("x" in val) // amplify - also in common_functions.js safe_stringify
				{
					var new_val={};
					["x","y","width","height"].forEach(function(p){
						if(p in val) new_val[p]=val[p];
					});
					for(var p in val) new_val[p]=val[p];
					val=new_val;
				}
			}
			return val;
		},third);
		try{
			if("x" in obj) // amplify - also in common_functions.js safe_stringify
			{
				result=JSON.parse(result);
				result.x=obj.x;
				result.y=obj.y;
				result=JSON.stringify(result,undefined,third);
			}
		}catch(e){}
		return result;
	}
	catch(e)
	{
		console.log(e);
		return "game_stringify_exception";
	}
}

function game_stringify_simple(obj,third)
{
	try{
		if(obj===undefined) return "undefined";
		var result=JSON.stringify(obj, function(key, val) {
			if(in_arr(key,ignored_properties) || key.indexOf("filter_")!=-1 || key[0]=="_") return;
			if(key=="data" && obj[key] && obj[key].x_lines) return;
			if (val != null && typeof val == "object") {
				if("x" in val) // amplify - also in common_functions.js safe_stringify
				{
					var new_val={};
					["x","y","width","height"].forEach(function(p){
						if(p in val) new_val[p]=val[p];
					});
					for(var p in val) new_val[p]=val[p];
					val=new_val;
				}
			}
			return val;
		},third);
		try{
			if("x" in obj) // amplify - also in common_functions.js safe_stringify
			{
				result=JSON.parse(result);
				result.x=obj.x;
				result.y=obj.y;
				result=JSON.stringify(result,undefined,third);
			}
		}catch(e){}
		return result;
	}
	catch(e)
	{
		return "game_stringify_simple_exception";
	}
}

function syntax_highlight(json) {
	json = json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
		var cls = 'shnumber';
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = 'shkey';
			} else {
				cls = 'shstring';
			}
		} else if (/true|false/.test(match)) {
			cls = 'shboolean';
		} else if (/null/.test(match)) {
			cls = 'shnull';
		}
		return '<span class="'+cls+'">'+match+'</span>';
	});
}

jQuery.fn.all_html = function() {
	return jQuery('<div />').append(this.eq(0).clone()).html();
};

jQuery.fn.shtml=function(r) { // simplified/processed html for editable div's [26/07/18]
	var e=jQuery(this);
	var val=e.html();
	val=(""+val).replace_all(",","").replace_all(".","").replace_all("\n","").replace_all(" ","").replace_all("<br>","");
	return val;
};

jQuery.fn.rval=function(r) {
	var e=jQuery(this);
	var val=e.val();
	if(r==undefined) r='';
	e.val(r);
	return val;
};

jQuery.fn.cfocus=function() { // Focusing an empty contenteditable is unreliable at this time [27/08/18]
	var html=jQuery(this).html();
	var def="1";
	if(!(html||"").replace_all(" ","").length)
	{
		if(jQuery(this).data('default')!==undefined) def=jQuery(this).data('default');
		jQuery(this).html(def);
	}
	var val=jQuery(this).focus();
	if(def=="\u00a0") document.execCommand('delete', false, null);
	return val;
};

jQuery.fn.codemirror=function(args){
	if(!args) args={};
	return this.each(function(){
		var $this=jQuery(this);
		var value=args.value||$this.html();
		value=value.replace_all("&amp;","&").replace_all("&gt;",">").replace_all("&lt;","<")
		if(args.trim || $this.hasClass("trimnl"))
		{
			while(value[0]=="\n") value=value.substr(1,value.length);
			while(value[value.length-1]=="\n") value=value.substr(0,value.length-1);
		}
		var codemirror=CodeMirror(function(current){$this.replaceWith(current);},{
			value:value,
			mode:"javascript",
			indentUnit:4,
			indentWithTabs:true,
			lineWrapping:true,
			lineNumbers:true,
			gutters:["CodeMirror-linenumbers","lspacer"],
			theme:"pixel",
			cursorHeight:0.75,
			/*,lineNumbers:true*/
		});
		var $cm=$(codemirror.getWrapperElement());
		if($this.hasClass("executeb"))
		{
			$cm.append("<div class='clickable' style='position: absolute; bottom: 4px; right: 4px; color: white; background: black; padding: 2px 2px 2px 4px; border: 1px solid white; z-index:4; padding-left: 8px; padding-right: 4px;' onclick='execute_codemirror(this)'>Execute!</div>")
		}
		if(args.focus) codemirror.focus();
		if(args.hints) listen_for_hints(codemirror);
	});
};

jQuery.fn.rfval=function(r) {
	var val=jQuery(this).rval(r);
	$(":focus").blur();
	return val;
};

function stkp(event)
{ try {
	if(event=="manual") return;
	event.preventDefault();
	event.stopPropagation();
} catch(e){ } }

function stprlink(event) // to make modal click catchers let <a> clicks pass, for electron logic [05/02/19]
{
	try{
		if(event.target.tagName.toLowerCase() === 'a') return true;
		event.stopPropagation();
	}
	catch(e){}
	return false;
}

function stpr(event)
{ try {
	if(event=="manual") return;
	// if(event.stopImmediatePropagation) event.stopImmediatePropagation();
	event.stopPropagation();
	// event.preventDefault(); - recently removed this, as, on the payments UI, when the link click propagates, it was cancelled by this [24/08/16]
} catch(e){ } }

/* SCREENSHOTS */

function clear_ui()
{
	$("body").children().each(function(){
		if(this.tagName!="CANVAS") $(this).remove();
		$("iframe").remove();
	});
}

function clear_ui2()
{
	$("body").children().each(function(){
		if(this.tagName!="CANVAS" && this.id!="topleftcorner") $(this).remove();
		$("iframe").remove();
	});
}

function storage_get(name)
{
	if(is_electron)
	{
		if(!electron_store)
		{
			var Store=require('electron-store');
			electron_store=new Store();
		}
		return electron_store.get(name);
	}
	else
	{
		return window.localStorage.getItem(name);
	}
}

function storage_set(name,value)
{
	if(is_electron)
	{
		if(!electron_store)
		{
			var Store=require('electron-store');
			electron_store=new Store();
		}
		electron_store.set(name,value);
	}
	else
	{
		return window.localStorage.setItem(name,value);
	}
}

/* ELECTRON */

var manifest=null;
var electron=null,path=null,electron_store=null,fs=null,ide_root="/gg/";
function url_factory(url)
{
	try{
		if(is_electron && !manifest)
		{
			if(!electron) electron=require('electron');
			if(!path) path=electron.remote.require('path'); // #ELECTRON 6
			manifest=require(path.resolve(electron.remote.app.getAppPath(), './manifest.js'));
		}
		else if(!manifest) manifest={};
		var bare=url.split("?v=")[0],version=url.split("?v=")[1];
		if(manifest[bare])
		{
			if(!version || manifest[bare].v==version)
			{
				var lpath=path.resolve(electron.remote.app.getAppPath(),"./files"+bare)
				// console.log("Loaded "+bare+" locally: "+lpath);
				return "file://"+lpath;
			}
		}
	}
	catch(e)
	{
		console.log("url_factory: "+e);
	}
	return url;
}

function filename_to_cdata(oname)
{
	if(oname.length<4) return null;
	var name=oname.substr(0,oname.length-3);
	var slot=name.split(".");
	if(slot.length<2) return;
	slot=parseInt(slot[slot.length-1]);
	name=name.substr(0,name.length-(""+slot).length-1);
	var valid=false;
	if(1<=slot && slot<=100) valid=true;
	X.characters.forEach(function(c){if(c.id==slot) valid=true;});
	// console.log((name+"."+slot+".js")+"|"+oname);
	if((name+"."+slot+".js")!=oname) valid=false;
	name.split("").forEach(function(c){ if(!valid_file_chars.includes(c)) valid=false; });
	if(!valid) return null;
	return {name:name,slot:slot,file:oname};
}

function get_code_file(name)
{
	var filename=to_filename(name);
	for(var slot in code_ref)
	{
		if(slot==name || code_ref[slot].name==filename)
		{
			var folder=ide_root+"/adventureland/characters";
			if(parseInt(slot)<=100) folder=ide_root+"/adventureland/codes";
			return fs.readFileSync(folder+"/"+code_ref[slot].file,"utf8");
		}
	}
	return null;
}

async function save_code_file(num,data,v) // only "code"
{
	var folder=ide_root+"/adventureland/characters",filename=X.codes[num][0]+"."+num+".js";
	if(parseInt(num)<=100) folder=ide_root+"/adventureland/codes";
	if(code_ref[num]) await fs.promises.copyFile(folder+"/"+code_ref[num].file,ide_root+"/history/"+code_ref[num].slot+".js").catch();
	file_op[filename]=new Date(); await fs.promises.writeFile(folder+"/"+filename,data.toString(),"utf8"); file_op[filename]=new Date();
	var cdata=filename_to_cdata(filename);
	code_ref[cdata.slot]=cdata; code_ref[cdata.slot].v=v;
	await fs.promises.stat(folder+"/"+filename).then(async (stats)=>{
		code_ref[cdata.slot].m=stats&&stats.mtimeMs;
		if(!ec_initial) await fs.promises.writeFile(ide_root+"/data.json",JSON.stringify(code_ref),"utf8");
	});
	add_log("Saved locally: "+X.codes[num][0]+"."+num+".js","#5BAC57");
}

async function remove_code_file(num) // only "servers_and_characters"
{
	var folder=ide_root+"/adventureland/characters";
	if(parseInt(num)<=100) folder=ide_root+"/adventureland/codes";
	if(code_ref[num] && (!flag_new_code[num] || ssince(flag_new_code[num])>6))
	{
		var fname=code_ref[num].file;
		file_op[fname]=new Date();
		add_log("Moved to /history: "+code_ref[num].file,"#8063A9");
		await fs.promises.copyFile(folder+"/"+code_ref[num].file,ide_root+"/history/"+code_ref[num].slot+".js").catch();
		await fs.promises.unlink(folder+"/"+code_ref[num].file);
		delete code_ref[num];
		if(!ec_initial) await fs.promises.writeFile(ide_root+"/data.json",JSON.stringify(code_ref),"utf8");
		file_op[fname]=new Date();
	}
}

async function download_code_file(num,dynamic)
{
	if(dynamic && code_ref[num])
	{
		var folder=ide_root+"/adventureland/characters",filename=X.codes[num][0]+"."+num+".js";
		if(parseInt(num)<=100) folder=ide_root+"/adventureland/codes";
		await fs.promises.copyFile(folder+"/"+code_ref[num].file,ide_root+"/history/"+code_ref[num].slot+".js").catch();
	}
	await api_call("load_code",{name:num,run:'',log:false,save:true},{promise:true});
	if(file_op_queue[num] && file_op_queue[num][0]=="save")
	{
		await save_code_file(file_op_queue[num][1],file_op_queue[num][2],file_op_queue[num][3]);
		delete file_op_queue[num];
	}
}

var file_op_queue={};
async function one_file_op(){
	if(ec_initial) return setTimeout(async function(){ await one_file_op(); },1600);
	var done=false;
	if(!done)
		for(var slot in file_op_queue)
		{
			var op=file_op_queue[slot];
			if(op[0]=="remove")
			{
				await remove_code_file(op[1]);
				done=true;
				delete file_op_queue[slot];
				break;
			}
		}
	if(!done)
		for(var slot in file_op_queue)
		{
			var op=file_op_queue[slot];
			if(op[0]=="save")
			{
				await save_code_file(op[1],op[2],op[3]);
				done=true;
				delete file_op_queue[slot];
				break;
			}
		}
	if(!done)
		for(var slot in file_op_queue)
		{
			var op=file_op_queue[slot];
			if(op[0]=="download")
			{
				await download_code_file(op[1],true);
				done=true;
				delete file_op_queue[slot];
				break;
			}
		}	
	setTimeout(async function(){ await one_file_op(); },1600);
}
setTimeout(async function(){ await one_file_op(); },1600);

async function process_file(folder,cdata)
{
	var new_m=null,change=true,deleted=false;
	await fs.promises.stat(folder+"/"+cdata.file).then((stats)=>{new_m=stats.mtimeMs;}).catch(()=>{ deleted=true; });
	if(deleted) // live update deletion
	{
		change=false;
		setTimeout(function(num,fname){
			return function(){
				if(code_ref[num] && code_ref[num].file==fname) // make sure it's not renamed
					show_confirm("Are you sure you want to delete "+cdata.file+"?",["#D06631","Yes"],"No!",function(slot){return function(){ api_call("save_code",{name:"DELETE",slot:slot,electron:true},{promise:true}); hide_modal(true);}}(num));
			}
		}(cdata.slot,cdata.file),5000);
	}
	else if(!code_ref[cdata.slot] && !X.codes[cdata.slot]) // new file
	{
		add_log("Uploading new code: "+cdata.file,"#5BAC57");
		flag_new_code[cdata.slot]=new Date();
		await fs.promises.readFile(folder+"/"+cdata.file,"utf8").then(async (data)=>{
			if(character && cdata.slot==code_slot) handle_information([{type:"code",code:data.toString()}]);
			if(data) await api_call("save_code",{code:data.toString(),slot:cdata.slot,name:cdata.name,auto:true,electron:true},{promise:true});
		}).catch(()=>{});
		code_ref[cdata.slot]=cdata; code_ref[cdata.slot].v=1; code_ref[cdata.slot].m=new_m;
		flag_new_code[cdata.slot]=new Date();
		await sleep(1200);
	}
	else if(code_ref[cdata.slot] && !X.codes[cdata.slot]) // deleted file
	{
		add_log("Moved to /history: "+cdata.file,"#8063A9");
		await fs.promises.copyFile(folder+"/"+cdata.file,ide_root+"/history/"+cdata.slot+".js").catch(()=>{});
		file_op[cdata.file]=new Date(); await fs.promises.unlink(folder+"/"+cdata.file); file_op[cdata.file]=new Date();
		delete code_ref[cdata.slot];
		await sleep(1200);
	}
	else if(code_ref[cdata.slot] && (code_ref[cdata.slot].m!=new_m || cdata.name!=X.codes[cdata.slot][0] || X.codes[cdata.slot][1]!=code_ref[cdata.slot].v)) // file changed or name changed or external update
	{
		if(code_ref[cdata.slot] && X.codes[cdata.slot][1]>code_ref[cdata.slot].v && code_ref[cdata.slot].m!=new_m) // clash
		{
			add_log("Moved to /clash: "+cdata.file,"#8063A9");
			await fs.promises.access(ide_root+"/adventureland/clash").catch(async function(){ await fs.promises.mkdir(ide_root+"/adventureland/clash"); });
			await fs.promises.copyFile(folder+"/"+cdata.file,ide_root+"/adventureland/clash/"+cdata.file+".c"+randomStr(10)).catch(()=>{});
			file_op[cdata.file]=new Date(); await fs.promises.unlink(folder+"/"+cdata.file); file_op[cdata.file]=new Date();
			delete code_ref[cdata.slot];
		}
		if(!code_ref[cdata.slot] || X.codes[cdata.slot][1]>code_ref[cdata.slot].v)
		{
			add_log("Remote update: "+cdata.file);
			await download_code_file(cdata.slot);
			if(cdata.file && cdata.name!=X.codes[cdata.slot][0])
			{
				add_log("Old file deleted: "+cdata.file); // delete old file name
				file_op[cdata.file]=new Date(); await fs.promises.unlink(folder+"/"+cdata.file).catch(); file_op[cdata.file]=new Date();
			}
		}
		else
		{
			// add_log("Uploading code: "+cdata.file);
			await fs.promises.readFile(folder+"/"+cdata.file,"utf8").then(async (data)=>{
				if(character && cdata.slot==code_slot) handle_information([{type:"code",code:data.toString()}]);
				if(data) await api_call("save_code",{code:data.toString(),slot:cdata.slot,name:cdata.name,auto:true,electron:true},{promise:true});
			}).catch(()=>{});
			code_ref[cdata.slot]=cdata; code_ref[cdata.slot].v=X.codes[cdata.slot][1]; code_ref[cdata.slot].m=new_m;
		}
		await sleep(1200);
	}
	else if(!code_ref[cdata.slot] && !ec_initial) // happens after rename
	{
		add_log("Uploading code: "+cdata.file,"#5BAC57");
		await fs.promises.readFile(folder+"/"+cdata.file,"utf8").then(async (data)=>{
			if(character && cdata.slot==code_slot) handle_information([{type:"code",code:data.toString()}]);
			if(data) await api_call("save_code",{code:data.toString(),slot:cdata.slot,name:cdata.name,auto:true,electron:true},{promise:true});
		}).catch(()=>{});
		code_ref[cdata.slot]=cdata; code_ref[cdata.slot].v=1; code_ref[cdata.slot].m=new_m;
		flag_new_code[cdata.slot]=new Date();
		await sleep(1200);
	}
	else change=false;
	if(!ec_initial && change) await fs.promises.writeFile(ide_root+"/data.json",JSON.stringify(code_ref),"utf8");
}

var code_ref={},found={},flag_new_code={},ec_initial=true;
var file_op={}; // to prevent race conditions
async function electron_code_sync_logic()
{
	try{
		if(!electron) electron=require('electron');
		if(!path) path=require('path');
		if(!fs) try{ fs=require('fs-extra'); }catch(e){ console.error("fs-extra import issue"); fs=require('fs'); };
		ide_root=path.join(electron.remote.app.getPath('appData'), electron.remote.app.getName());
		await fs.promises.access(ide_root+"/autosync"+user_id).catch(async function(){ await fs.promises.mkdir(ide_root+"/autosync"+user_id); });
		ide_root=ide_root+"/autosync"+user_id;
		await fs.promises.access(ide_root+"/adventureland").catch(async function(){ await fs.promises.mkdir(ide_root+"/adventureland"); });
		await fs.promises.access(ide_root+"/adventureland/characters").catch(async function(){ await fs.promises.mkdir(ide_root+"/adventureland/characters"); });
		await fs.promises.access(ide_root+"/adventureland/codes").catch(async function(){ await fs.promises.mkdir(ide_root+"/adventureland/codes"); });
		await fs.promises.access(ide_root+"/adventureland/libraries").catch(async function(){ await fs.promises.mkdir(ide_root+"/adventureland/libraries"); });
		await fs.promises.access(ide_root+"/history").catch(async function(){ await fs.promises.mkdir(ide_root+"/history"); });
		await fs.promises.readFile(ide_root+"/data.json","utf8").then((data)=>{code_ref=JSON.parse(data)||{};}).catch(()=>{code_ref={};});
		// console.log(code_ref);
		await fs.promises.readdir(ide_root+"/adventureland/characters").then(async (files)=>{
			for(var i=0;i<files.length;i++)
			{
				var fname=files[i];
				var cdata=filename_to_cdata(fname);
				if(cdata && found[cdata.slot])
				{
					add_log("You need to either delete "+found[cdata.slot]+" or "+fname+" when the game client is closed!","#A88690");
				}
				else if(cdata)
				{
					found[cdata.slot]=fname;
					await process_file(ide_root+"/adventureland/characters",cdata);
				}
				else if(fname && fname[0]!=".")
					add_log("Invalid filename: "+fname,"#A88690");
			}
		}).catch((e)=>{
			add_log("/adventureland/codes: "+e,"red");
		});
		await fs.promises.readdir(ide_root+"/adventureland/codes").then(async (files)=>{
			for(var i=0;i<files.length;i++)
			{
				var fname=files[i];
				var cdata=filename_to_cdata(fname);
				if(cdata && found[cdata.slot])
				{
					add_log("You need to either delete "+found[cdata.slot]+" or "+fname+" when the game client is closed!","#A88690");
				}
				else if(cdata)
				{
					found[cdata.slot]=fname;
					await process_file(ide_root+"/adventureland/codes",cdata);
				}
				else if(fname && fname[0]!=".")
					add_log("Invalid filename: "+fname,"#A88690");
			}
		}).catch((e)=>{
			add_log("/adventureland/codes: "+e,"red");
		});
		for(var slot in code_ref)
			if(!found[slot])
			{
				delete code_ref[slot]; // best to just ignore offline deleted files
			}
		ec_initial=false;
		await fs.promises.writeFile(ide_root+"/data.json",JSON.stringify(code_ref),"utf8");
		for(var slot in X.codes)
		{
			if(!code_ref[slot])
			{
				// add_log("X.Codes Missing: "+slot);
				file_op_queue[slot]=["download",slot,X.codes[slot][1]];
			}
		}
		if(storage_get("lib_version")!=VERSION+""+user_id)
		{
			api_call("load_libraries");
		}
		electron_start_watching();
	}
	catch(e)
	{
		console.log("electron_code_sync_logic: "+e);
	}
}

var watcher1=null,watcher2=null;
function electron_start_watching()
{
	if(watcher1) return;
	watcher1=fs.watch(ide_root+"/adventureland/characters",function(event,fname){
		if(file_op[fname] && mssince(file_op[fname])<3600) return;
		console.log("watcher1: "+fname);
		var cdata=filename_to_cdata(fname);
		if(cdata) process_file(ide_root+"/adventureland/characters",cdata);
		else add_log("Invalid filename: "+fname,"#A88690");
	});
	watcher2=fs.watch(ide_root+"/adventureland/codes",function(event,fname){
		if(file_op[fname] && mssince(file_op[fname])<3600) return;
		console.log("watcher2: "+fname);
		var cdata=filename_to_cdata(fname);
		if(cdata) process_file(ide_root+"/adventureland/codes",cdata);
		else add_log("Invalid filename: "+fname,"#A88690");
	});
}

function electron_stop_watching()
{
	if(watcher1) watcher1.close(),watcher2.close(),watcher1=watcher2=null;
}

function electron_open_codes()
{
	if(!electron) electron=require('electron');
	if(!path) path=require('path');
	var iroot=path.join(electron.remote.app.getPath('appData'), electron.remote.app.getName())+"/autosync"+user_id;
	show_alert("Import the 'adventureland' folder to your IDE. 'history' folder keeps only one previous local version. If you overwrite a code slot by mistake, you can recover it immediately from the 'history' folder.");
	const {shell} = require('electron');
	try{
		shell.openItem(iroot);
	}catch(e){
		shell.openExternal('file://'+iroot);
	}
}

function electron_reset()
{
	if(!electron) electron=require('electron');
	if(!path) path=require('path');
	if(!fs) try{ fs=require('fs-extra'); }catch(e){ console.error("fs-extra import issue"); fs=require('fs'); };
	getAppPath = path.join(electron.remote.app.getPath('appData'), electron.remote.app.getName());
	fs.unlink(getAppPath, function(){
		alert("App data cleared");
		electron.relaunch();
		electron.exit();
	});
}

// /pure_eval electron_dev_tools()
function electron_dev_tools()
{
	if(!electron) electron=require('electron');
	var ewindow = electron.remote.getCurrentWindow();
	ewindow.openDevTools({mode:'detach'});
}

var fullscreen=false;
function electron_fullscreen(val)
{
	if(val==undefined) val=!fullscreen;
	fullscreen=val;
	if(!electron) electron=require('electron');
	var ewindow = electron.remote.getCurrentWindow();
	ewindow.setFullScreen(fullscreen);
}

function electron_screenshot(opt,cb)
{
	cb = cb || function () {};
	if(!opt) opt={delay:0};
	if(!cb) cb=function(){ console.log('Screenshot taken!'); };
	if(!opt.filename) opt.filename="AL Screenshot "+(new Date())+".png";
	var remote;
	try {
		remote = require('' + 'electron').remote
	} catch (e) {
		remote = require('' + 'remote')
	}
	setTimeout(function () {
		remote.getCurrentWindow().capturePage(function handleCapture (img) {
		remote.require('fs').writeFile(opt.filename, img.toPNG(), cb)
		})
	}, opt.delay)
}

function electron_mas_receipt()
{
	try{
		if(!electron) electron=require('electron');
		var receipt=electron.remote.app.getPath('exe');
		receipt=receipt.split(".app/Contents/")[0]+".app/Contents/_MASReceipt/receipt";
		// console.log(receipt);
		return electron.remote.require('fs').readFileSync(receipt).toString("base64");
	}catch(e)
	{
		console.log(e);
	}
	return "";
}

function electron_steam_ticket()
{
	try{
		return storage_get("ticket")||"";
	}
	catch(e){
		console.log(e);
	}
	return "";
}

function electron_get_data()
{
	try{
		if(!electron) electron=require('electron');
		return electron.remote.getCurrentWindow().cdata||{};
	}catch(e)
	{
		return {};
	}
}

function electron_http_mode(val)
{
	if(val===undefined) val=true;
	storage_set("http_mode",val);
}

function electron_get_http_mode()
{
	try{
		return storage_get("http_mode");
	}
	catch(e){
		console.log(e);
	}
	return false;
}

function electron_is_main()
{
	try{
		if(!electron) electron=require('electron');
		if(electron.remote.getCurrentWindow().webContents.browserWindowOptions.sideWindow) return false;
	}
	catch(e){console.log(e);}
	return parent==window;
}

function electron_add_webview(url)
{
	if(!url) url="http://thegame.com/character/GG/in/EU/I/";
	$("body").append("<webview src='"+url+"' style='position: fixed; top: 0px; left: 0px; bottom: 0px; right: 0px' disablewebsecurity nodeintegration></webview>");
}