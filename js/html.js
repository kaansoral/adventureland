var u_item=null,u_scroll=null,u_offering=null,c_items=e_array(3),c_scroll=null,c_offering=null,c_last=0,e_item=null,p_item=null,l_item=null,cr_items=e_array(9),cr_last=0,ds_item=null;

var settings_shown=0;
function show_settings()
{
	show_modal($(".basicsettings").html(),{wrap:false,styles:"width:600px",hideinbackground:true});
}

var docked=[],cwindows=[];

function close_chat_window(type,id)
{
	var cid=type+(id||"");
	$("#chatw"+cid).remove();
	array_delete(docked,cid);
	array_delete(cwindows,cid);
	redock();
}

function toggle_chat_window(type,id)
{
	var cid=type+(id||"");
	if(in_arr(cid,docked))
	{
		array_delete(docked,cid);
		$(".chatb"+cid).html("#");
		$("#chatw"+cid).css("bottom","auto");
		$("#chatw"+cid).css("top",400);
		$("#chatw"+cid).css("left",400);
		$("#chatw"+cid).css("z-index",70+cwindows.length-docked.length);
		$("#chatw"+cid).draggable();
		$("#chatt"+cid).removeClass("newmessage");
	}
	else
	{
		$(".chatb"+cid).html("+");
		$("#chatw"+cid).draggable("destroy");
		$("#chatw"+cid).css("top","auto");
		$("#chatw"+cid).css("left",0);
		docked.push(cid);
	}
	redock();
}

function chat_title_click(type,id)
{
	var cid=type+(id||"");
	if(in_arr(cid,docked)) toggle_chat_window(type,id)
}

function redock()
{
	for(var i=0;i<docked.length;i++)
	{
		var cid=docked[i];
		$("#chatw"+cid).css("bottom",15+i*32);
		$("#chatw"+cid).css("z-index",70-i);
	}
}

function open_chat_window(type,id,open)
{
	if(no_html) return;
	if(!id) id="";
	var name=id,cid=type+id,zindex=70+cwindows.length-docked.length,onkeypress='last_say=\"'+cid+'\"; if(event.keyCode==13) private_say(\"'+id+'\",$(this).rfval())';
	if(type=="party") name="Party",onkeypress='last_say=\"'+cid+'\"; if(event.keyCode==13) party_say($(this).rfval())';
	var html="<div style='position:fixed; bottom: 0px; left: 0px; background: black; border: 5px solid gray; z-index: "+zindex+"' id='chatw"+cid+"' onclick='last_say=\""+cid+"\"'>";
		html+="<div style='border-bottom: 5px solid gray; text-align: center; font-size: 24px; line-height: 24px; padding: 2px 6px 2px 6px;'><span style='float:left' class='clickable chatb"+cid+"'\
		 onclick='toggle_chat_window(\""+type+"\",\""+id+"\")'>+</span> <span id='chatt"+cid+"' onclick='chat_title_click(\""+type+"\",\""+id+"\")'>"+name+"</span> <span style='float: right' class='clickable' onclick='close_chat_window(\""+type+"\",\""+id+"\")'>x</span></div>";
		html+="<div id='chatd"+cid+"' class='chatlog'></div>";
		html+="<div style=''><input type='text' class='chatinput' id='chati"+cid+"' onkeypress='"+onkeypress+"' autocomplete='nope'/></div>";
	html+="</div>";
	$("body").append(html);
	docked.push(cid);
	cwindows.push(cid);
	if(open) toggle_chat_window(type,id);
	redock();
}

function hide_settings()
{
	$("#content").html("");
	settings_shown=0;
}

function prop_line(prop,value,args)
{
	var color="",bold="";
	if(!args) args={};
	if(args.bold) bold="font-weight: bold;";
	if(is_string(args)) color=args,args={};
	if(!color) color=args.color||"grey";
	return "<div><span style='color: "+color+"; "+bold+"'>"+prop+"</span>: "+value+"</div>"
}

function prop_remains(remains)
{
	if(remains<=1/60.0) return bold_prop_line("Seconds",to_pretty_float(remains*3600),"gray");
	else if(remains<1) return bold_prop_line("Minutes",to_pretty_float(remains*60),"gray");
	else return bold_prop_line("Hours",to_pretty_float(remains),"gray");
}

function bold_prop_line(prop,value,args)
{
	if(!args) args={};
	if(is_string(args)) args={color:args};
	if(window.is_bold) args.bold=true;
	return prop_line(prop,value,args);
}

function render_party_old(list)
{
	var html="<div style='background-color: black; border: 5px solid gray; padding: 6px; font-size: 24px; display: inline-block' class='enableclicks'>";
	if(list)
	{
		html+="<div class='slimbutton block'>PARTY</div>";
		list.forEach(function(name){
			html+="<div class='slimbutton block mt5' style='border-color:#703987' onclick='party_click(\""+name+"\")'>"+name+"</div>";
		});
		html+="<div class='slimbutton block mt5'"; //style='border-color:#875045'
		html+="onclick='socket.emit(\"party\",{event:\"leave\"})'>LEAVE</div>";
	}
	html+="</div>";
	$("#partylist").html(html);
	if(!list.length) $("#partylist").hide();
	else $("#partylist").css("display","inline-block");
}

function render_party()
{
	var html="";
	for(var name in party)
	{
		var member=party[name];
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); party_click(\""+name+"\")'>";
		html+=sprite(member.skin,{cx:member.cx||[],rip:member.rip,scale:2,height:50,overflow:true});
		if(member.rip) html+="<div style='color:gray; margin-top: 1px'>RIP</div>";
		else html+="<div style='margin-top: 1px'>"+name.substr(0,3).toUpperCase()+"</div>";
		html+="</div>";
	}
	$("#newparty").html(html);
	if(!party_list.length) $("#newparty").hide();
	else $("#newparty").show();
}

function duel_click(name)
{
	var sm_target=null;
	I.A.forEach(function(member){ if(member.name==name) sm_target=member; });
	I.B.forEach(function(member){ if(member.name==name) sm_target=member; });
	if(sm_target) call_code_function_f("smart_move",sm_target);
}

function render_member(member,space)
{
	var html="";
	if(space) html+="<div style='margin-left: 4px; display: inline-block'></div>";
	html+="<div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 0px; line-height: 0px; text-align: center' onclick='pcs(event); duel_click(\""+member.name+"\")'>";
	html+=sprite(member.skin,{cx:member.cx||{},rip:member.rip});
	if(member.rip || !member.active)
	{
		html+="<div style='color:gray; margin-top: 1px; font-size: 24px; line-height: 18px'>RIP</div>";
		html+="<div style='width: 99%; background: gray; height: 4px; margin-top: 2px; display: inline-block'></div>";
	}
	else
	{
		html+="<div style='margin-top: 1px; font-size: 24px; line-height: 18px'>"+member.name.substr(0,3).toUpperCase()+"</div>";
		var percent=member.hp/member.max_hp*99;
		html+="<div style='width: "+percent+"%; background: "+colors.hp+"; height: 4px; margin-top: 2px; display: inline-block'></div>";
	}
	html+="</div>";
	return html;
}

function render_map()
{
	// Note: new_map_logic() - includes the initial messages
	if(current_map=="abtesting" && S.abtesting && !window.abtesting)
	{
		$("#topmid").append("<div id='abtesting'><div class='gamebutton' style='border-color: "+colors.A+"'>A <span class='scoreA'>"+S.abtesting.A+"</span></div> <div class='gamebutton abtime'>5:00</div> <div class='gamebutton' style='border-color: "+S.abtesting.B+"'>B <span class='scoreB'>0</span></div></div>"); reposition_ui();
		window.abtesting=true;
	}
	else if(current_map!="abtesting" && window.abtesting)
	{
		$("#abtesting").remove();
		window.abtesting=false;
	}

	if(events.duel && (!I || !I.id || I.id!=events.duel))
	{
		events.duel=false;
		$("#duelui").remove();
		$(".badplaceforaui").html("");
	}
	if(current_map=="duelland" && !events.duel)
	{
		events.duel=I.id;
		$("#topmid").append("<div id='duelui'><div class='gamebutton dueltime'>0:60</div></div>");
		reposition_ui();
	}
	if(events.duel)
	{
		if(I.seconds) $(".dueltime").html("0:"+("00"+I.seconds).slice(-2));
		else $(".dueltime").remove();

		var html="";
		m_first=true; I.A.forEach(function(member){ html+=render_member(member,!m_first); m_first=false; });
		html+="<div></div><div class='gamebutton gamebutton-small' style='margin-top: 3px; margin-bottom: 3px'>vs</div><div></div>";
		m_first=true; I.B.forEach(function(member){ html+=render_member(member,!m_first); m_first=false; });
		$(".badplaceforaui").html(html);

	}

}

function wabbit_click()
{
	if(!S.wabbit.live)
		add_log("Wabbit spawns in "+parseInt(round(-msince(new Date(S.wabbit.spawn))))+" minutes");
	else
		add_log("Engage Wabbit? <span class='clickable' onclick='pcs(event); call_code_function_f(\"smart_move\",{x:S.wabbit.x,y:S.wabbit.y,map:S.wabbit.map});' style='color: #A78059'>Go</span>","gray");
}

function emonster_click(id)
{
	if(!S[id] || !S[id].live && !S[id].spawn)
		add_log(G.monsters[id].name+" hasn't spawned yet!");
	else if(!S[id].live)
		add_log(G.monsters[id].name+" spawns in "+parseInt(round(-msince(new Date(S[id].spawn))))+" minutes");
	else
		add_log("Engage "+G.monsters[id].name+"? <span class='clickable' onclick='pcs(event); call_code_function_f(\"smart_move\",S."+id+");' style='color: #A78059'>Go</span>","gray");
}

function render_rewards()
{
	show_json(S.rewards);
}

function render_server()
{
	var html="",content=false;
	if(quirks.crypt)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"dungeon-crypt\",\"/docs/ref/dungeon-crypt\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:G.items.cryptkey.skin,bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(quirks.darkmage)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"dungeon-darkmage\",\"/docs/ref/dungeon-darkmage\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:G.items.frozenkey.skin,bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(quirks.fishing)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"skill-fishing\",\"/docs/ref/skill-fishing\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:G.items.rod.skin,bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(quirks.mining)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"skill-mining\",\"/docs/ref/skill-mining\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:G.items.pickaxe.skin,bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(gameplay=="hardcore")
	{
		$(".rewardsbutton").css("display","inline-block");
		$(".minutesui").css("display","inline-block");
		var hours="0"+parseInt(S.minutes/60);
		var minutes=S.minutes%60; if(!minutes) minutes="00"; else if(minutes<10) minutes="0"+minutes;
		$(".minutesui").html(hours+":"+minutes);
	}
	["crabxx","goobrawl","abtesting","franky","icegolem"].forEach(function(type){
		if(S[type])
		{
			var scolor="#ECECEC",lcolor="#ECECEC",lphrase="EVENT!",s=type;
			if(type=="goobrawl") lcolor="#FF5D34",s="rgoo";
			if(type=="abtesting") lcolor="#E10029",s="thehelmet";
			else if(G.monsters[type] && G.monsters[type].announce) lcolor=G.monsters[type].announce;
			html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-"+type+"\",\"/docs/ref/event-"+type+"\")'>";
			html+=sprite(s,{overflow:true});
			html+="<div style='color:"+lcolor+"; margin-top: 1px'>"+lphrase+"</div>";
			html+="</div>";
			content=true;
		}
	});
	["wabbit","mrpumpkin","mrgreen","snowman","dragold","grinch","pinkgoo","slenderman","tiger"].forEach(function(type){
		if(S[type])
		{
			var scolor="#ECECEC",lcolor="#ECECEC",lphrase="LIVE";
			if(type=="snowman") lcolor=colors.xmasgreen,scolor=colors.xmas;
			if(type=="grinch") scolor=colors.xmasgreen,lcolor=colors.xmas,lphrase="BEWARE";
			html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); emonster_click(\""+type+"\")'>";
			html+=sprite(type,{overflow:true});
			if(!S[type].live)
				html+="<div style='color:"+scolor+"; margin-top: 1px'>"+parseInt(round(-msince(new Date(S[type].spawn))))+"M</div>";
			else if(S[type].target)
				html+="<div style='color:"+lcolor+"; margin-top: 1px'>JOIN</div>";
			else
				html+="<div style='color:"+lcolor+"; margin-top: 1px'>"+lphrase+"</div>";
			html+="</div>";
			content=true;
		}
	});
	if(S.halloween)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-halloween\",\"/docs/ref/halloween\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:"candy0",bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(S.holidayseason)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-holidayseason\",\"/docs/ref/holidayseason\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:"candycane",bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(S.lunarnewyear)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-lunarnewyear\",\"/docs/ref/lunarnewyear\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:"greenenvelope",bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(S.egghunt)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-egghunt\",\"/docs/ref/egghunt\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:"basketofeggs",bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	if(S.valentines)
	{
		html+=" <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-valentines\",\"/docs/ref/valentines\")'>";
		html+="<div style='margin-top: -1px; margin-left: -3px; margin-right: -3px'>"+item_container({skin:"cupid",bcolor:"black"})+"</div>";
		html+="<div style='color:#CFD1D1; margin-top: 1px'>INFO</div>";
		html+="</div>";
		content=true;
	}
	$("#serverinfo").html(html);
	if(!content) $("#serverinfo").hide();
	else $("#serverinfo").show();
}

function render_character_sheet()
{
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: left' class='disableclicks'>";
		html+="<div><span style='color:gray'>Class:</span> "+to_title(character.ctype)+"</div>";
		html+="<div><span style='color:gray'>Level:</span> "+character.level+"</div>";
		html+="<div><span style='color:gray'>XP:</span> "+to_pretty_num(character.xp)+" / "+to_pretty_num(character.max_xp)+"</div>";
		var divider=1,disclaimer="";
		if(pvp && !(!is_pvp && G.maps[character.map].safe_pvp)) divider=10,disclaimer="<span style='color:#605B85'>(PVP)</span>";
		var lost_xp=floor(min(max(character.max_xp*0.01/divider,character.xp*0.02/divider),character.xp));
		if(character.ctype!="merchant") html+="<div><span style='color:gray'>Max XP Loss:</span> "+to_pretty_num(lost_xp)+" "+disclaimer+"</div>";
		if(character.party && party && party[character.name]) html+="<div><span style='color:"+colors.party_xp+"'>Party:</span> "+round(party[character.name].share*100)+"% <span style='color:gray'>(Your Share)</span></div>";
		if(character.ctype=="merchant") html+="<div><span style='color:gray'>Tax:</span> "+(character.tax*100)+"%</div>";
		if(character.ctype=="priest")
		{
			html+="<div><span style='color:gray'>Heal:</span> "+character.attack+"</div>";
			html+="<div><span style='color:gray'>Attack:</span> "+round(character.attack*0.4)+"</div>";
		}
		else html+="<div><span style='color:gray'>Attack:</span> "+character.attack+"</div>";
		html+="<div><span style='color:gray'>Attack Speed:</span> "+round(character.frequency*100)+"</div>";
		html+="<div><span style='color:gray'>Strength:</span> "+character.str+"</div>";
		html+="<div><span style='color:gray'>Intelligence:</span> "+character['int']+"</div>";
		html+="<div><span style='color:gray'>Dexterity:</span> "+character.dex+"</div>";
		html+="<div><span style='color:gray'>Vitality:</span> "+character.vit+"</div>";
		html+="<div><span style='color:gray'>Fortitude:</span> "+character['for']+" <span style='color:gray'>("+parseInt((1-damage_multiplier(character['for']*5))*10000.0)/100.0+"%)</span></div>";
		html+="<div><span style='color:gray'>Armor:</span> "+character.armor+" <span style='color:gray'>("+parseInt((1-damage_multiplier(character.armor))*10000.0)/100.0+"%)</span></div>";
		html+="<div><span style='color:gray'>Resistance:</span> "+character.resistance+" <span style='color:gray'>("+parseInt((1-damage_multiplier(character.resistance))*10000.0)/100.0+"%)</span></div>";
		html+="<div><span style='color:gray'>Courage:</span> "+character.courage+" <span style='color:gray'>|</span> "+character.mcourage+" <span style='color:gray'>|</span> "+character.pcourage+"</div>";
		html+="<div><span style='color:gray'>Speed:</span> "+character.speed+"</div>";
		html+="<div><span style='color:gray'>MP Cost:</span> "+character.mp_cost+"</div>";
		if(character.lifesteal) html+="<div><span style='color:gray'>Lifesteal:</span> "+to_pretty_float(character.lifesteal)+"%</div>";
		if(character.manasteal) html+="<div><span style='color:gray'>Manasteal:</span> "+to_pretty_float(character.manasteal)+"%</div>";
		if(character.dreturn) html+="<div><span style='color:gray'>Damage Return:</span> "+to_pretty_float(character.dreturn)+"%</div>";
		if(character.reflection) html+="<div><span style='color:gray'>Reflection:</span> "+to_pretty_float(character.reflection)+"%</div>";
		if(character.evasion) html+="<div><span style='color:gray'>Evasion:</span> "+to_pretty_float(character.evasion)+"%</div>";
		if(character.miss) html+="<div><span style='color:gray'>Miss:</span> "+to_pretty_float(character.miss)+"%</div>";
		if(character.crit) html+="<div><span style='color:gray'>Crit:</span> "+to_pretty_float(character.crit)+"%</div>";
		if(character.critdamage) html+="<div><span style='color:gray'>Critical Damage:</span> "+to_pretty_float(200+character.critdamage)+"%</div>";
		if(character.apiercing) html+="<div><span style='color:gray'>Armor Piercing:</span> "+character.apiercing+"</div>";
		if(character.rpiercing) html+="<div><span style='color:gray'>Resistance Piercing:</span> "+character.rpiercing+"</div>";
		if(character.goldm!=1)
		{
			if(character.party && party && party[character.name] && party[character.name].gold)
				html+="<div><span style='color:gray'>Gold:</span> "+round(character.goldm*100-party[character.name].gold)+"% <span style='color:"+colors.gold+"'>+"+party[character.name].gold+"%</span></div>";
			else html+="<div><span style='color:gray'>Gold:</span> "+round(character.goldm*100)+"%</div>";
		}
		if(character.xpm!=1)
		{
			if(character.party && party && party[character.name] && party[character.name].xp)
				html+="<div><span style='color:gray'>Experience:</span> "+round(character.xpm*100-party[character.name].xp)+"% <span style='color:"+colors.stat_xp+"'>+"+party[character.name].xp+"%</span></div>";
			else html+="<div><span style='color:gray'>Experience:</span> "+round(character.xpm*100)+"%</div>";
		}
		if(character.luckm!=1)
		{
			if(character.party && party && party[character.name] && party[character.name].luck)
				html+="<div><span style='color:gray'>Luck:</span> "+round(character.luckm*100-party[character.name].luck)+"% <span style='color:"+colors.luck+"'>+"+party[character.name].luck+"%</span></div>";
			else html+="<div><span style='color:gray'>Luck:</span> "+round(character.luckm*100)+"%</div>";
		}
	html+="</div>";
	$("#rightcornerui").html(html);
	topright_npc="character";
}

function render_conditions(player)
{
	var html="<div style='margin-top: 5px; margin-bottom: -5px; margin-left: -2px' class='rconditions'>",current=0,rids=[];
	for(var condition in player.s)
	{
		if(G.skills[condition] && G.skills[condition].ui)
		{
			console.log("here");
			var def=G.skills[condition],rid=randomStr(30);
			html+=item_container({skin:def.skin,loader:"cplc"+rid});
			rids.push([rid,24000,player.s[condition].ms]);
			current+=1;
			continue;
		}
		var prop=G.conditions[condition],actual=player.s[condition];
		if(!actual.skin && (!prop || (!prop.ui && (!actual.s || actual.s<20)))) continue;
		if(player.type=="monster" && condition=="poisonous") continue;
		if(current>0 && !(current%2)) html+="<div></div>";
		current+=1;
		html+=item_container({skin:actual.skin||prop.skin,onclick:"condition_click('"+condition+"')"},actual);
	}
	for(var event in (player.q||{}))
	{
		if(event=="exchange")
		{
			var level=0;
			var name=player.q.exchange.name;
			var q=undefined;
			// if(player.q.exchange.s) level=player.q.exchange.s;
			// if(player.q.exchange.q>1) q=player.q.exchange.q;
			current+=1;
			html+=item_container({skin:G.items[name].skin,bcolor:"#E9973A"},{name:name,level:level,q:q});
		}
	}
	html+="</div>";
	if(current)
	{
		if($('.rconditions').length) $('.rconditions').replaceWith(html);
		else $(".renderedinfo").append(html);
		if(rids.length)
		{
			for(var i=0;i<rids.length;i++)
			{
				$(".loadercplc"+rids[i][0]).css("opacity",0.5);
				add_tint(".loadercplc"+rids[i][0],{ms:rids[i][2],start:future_ms(rids[i][2]-rids[i][1]),type:"progress"});
			}
		}
	}
	else
		$('.rconditions').remove();
}

var mimickers={};
function render_mimickers()
{
	if(!window.is_sdk || 1) return;
	var new_mimickers={};
	$(".tomimick").each(function(){
		var $this=$(this),key=$this.offset().top+"|"+$this.offset().left+"|"+$this.outerWidth()+"|"+$this.outerHeight();
		// if(!isElementInViewport(this)) return; // #TODO: auto hide with overlay check
		if(window.inside!="game" || window.modal_count || !$this.is(":visible")) return;
		if(mimickers[key]) return new_mimickers[key]=mimickers[key];
		mimickers[key]=new_mimickers[key]=$("<div class='mimicker' style='top: "+$this.offset().top+"px; left: "+$this.offset().left+"px; width: "+$this.outerWidth()+"px; height: "+$this.outerHeight()+"px'></div>").appendTo("body").click(function(event){
			event.stopPropagation();
			event.preventDefault();
			var elements=document.elementsFromPoint(event.pageX,event.pageY);
			for(var i=0;i<elements.length;i++)
			{
				if(!elements[i]['class']!='mimicker' && (elements[i].onclick || elements[i].classList.contains('clickable')))
				{
					elements[i].click();
					break;
				}
			}
		});
	});
	for(var key in mimickers)
	{
		if(!new_mimickers[key])
		{
			mimickers[key].remove();
			delete mimickers[key];
		}
	}
}

function render_npc(npc)
{
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top;' class='renderedinfo'>";
	html+=bold_prop_line("NPC",npc.name,"gray");
	html+=bold_prop_line("LEVEL",npc.level,"orange");
	html+="</div>";
	$("#topleftcornerui").html(html);
}

function render_monster(monster)
{
	var def=G.monsters[monster.mtype],styles=def.explanation&&"max-width: 200px"||"",name=def.name;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; "+styles+"' class='renderedinfo'>";
	if(monster.dead) name+=" X",monster.hp=0;
	if(monster.level>1) name+=" Lv."+monster.level;
	var hp=monster.hp,max_hp=monster.max_hp,xp=monster.xp;
	if(max_hp>=1000000) hp=to_pretty_num(hp),max_hp=to_pretty_num(max_hp);
	if(xp>=1000000) xp=to_pretty_num(xp);
	html+=info_line({line:name,color:"gray",onclick:"render_monster_info('"+monster.mtype+"')"});
	html+=info_line({name:"HP",color:colors.hp,value:hp+"/"+max_hp,cursed:monster.s.cursed,stunned:!monster.attack&&monster.s.stunned,poisoned:!monster.attack&&monster.s.poisoned});
	html+=info_line({name:"XP",color:"green",value:xp});
	if(monster.attack) html+=info_line({name:"ATT",color:"#316EE6",value:smart_num(monster.attack,10000),stunned:monster.s.stunned,poisoned:monster.s.poisoned});
	if(def.avoidance) html+=info_line({name:"AVOIDANCE",color:"gray",value:def.avoidance+"%"});
	if(def.evasion) html+=info_line({name:"EVASION",color:"gray",value:def.evasion+"%"});
	if(def.reflection) html+=info_line({name:"REFLECT.",color:"gray",value:def.reflection+"%"});
	if(def.dreturn) html+=info_line({name:"D.RETURN",color:"gray",value:def.dreturn+"%"});
	if(monster.armor) html+=info_line({name:"ARMOR",color:"gray",value:monster.armor});
	if(monster.resistance) html+=info_line({name:"RESIST.",color:"gray",value:monster.resistance});
	if(def.rpiercing) html+=info_line({name:"PIERCE.",color:"gray",value:def.rpiercing});
	if(def.apiercing) html+=info_line({name:"PIERCE.",color:"gray",value:def.apiercing});
	if(def.explosion) html+=info_line({name:"EXPL.",color:"gray",value:def.explosion});
	if(monster.lifesteal) html+=info_line({name:"LIFESTEAL",color:colors.lifesteal,value:monster.lifesteal+"%"});
	if(monster["1hp"]) html+=info_line({line:"1HP HITS",color:"#AEAEAE"});
	if(monster.cooperative) html+=info_line({line:"COOPERATIVE",color:"#AEAEAE"});
	if(def.immune) html+=info_line({line:"IMMUNE",color:"#AEAEAE"});
	if(def.peaceful) html+=info_line({line:"PEACEFUL",color:"#54B25F"});
	if(def.supporter) html+=info_line({line:"SUPPORTER",color:"#CA5931"});
	if(def.spawns) html+=info_line({line:"SPAWNS",color:"#AEAEAE"});
	if(def.abilities)
	{
		for(var id in def.abilities)
		{
			if(!G.skills[id]) continue;
			html+=info_line({name:def.abilities[id].aura&&"AURA"||"ABILITY",color:"#FC5F39",value:G.skills[id].name.toUpperCase(),onclick:"dialogs_target=xtarget||ctarget; render_skill('#topleftcornerdialog','"+id+"')"});
		}
	}
	if(def.spawns)
	{
		def.spawns.forEach(function(s){
			html+=info_line({name:"SPAWNS",color:"#237B2A",value:G.monsters[s[1]].name.toUpperCase(),onclick:"render_monster_info('"+s[1]+"')"});
		})
	}
	if(monster.target) html+=info_line({name:"TRG",color:"orange",value:monster.target});
	if(monster.pet)
	{
		html+=info_line({name:"NAME",value:monster.name,color:"#5CBD97"});
		html+=info_line({name:"PAL",value:monster.owner,color:"#CF539B"});
	}
	if(monster.heal)
	{
		html+=info_line({line:"SELF HEALING",color:"#9E6367"});
	}
	if(character)
	{
		var diff=calculate_difficulty(monster);
		if(diff>=2) html+=info_line({name:"DIFF.",color:"gray",value:"Hard",vcolor:"#ED4047"});
		else if(diff) html+=info_line({name:"DIFF.",color:"gray",value:"Challenging",vcolor:"#EF9232"});
		else html+=info_line({name:"DIFF.",color:"gray",value:"Easy",vcolor:"#8BF54D"});
	}
	if(def.poisonous)
	{
		html+=info_line({line:"POISONOUS",color:colors.poison});
	}
	if(def.explanation)
	{
		html+=info_line({line:def.explanation,color:"gray"});
	}
	html+=button_line({name:"<span style='color:gray'>{}</span><span style='color:white'>:</span> INSPECT",onclick:"ui_inspect(xtarget||ctarget)",color:colors.inspect});
	html+="</div>";
	$("#topleftcornerui").html(html);
	render_conditions(monster);
}

var cache_bid=-1;
function render_character(player)
{
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top;' class='renderedinfo' data-id='"+player.id+"'>",cccx=$('.cccx').length,ihtml="",bhtml="",xhtml="",already=false;
	if($('.renderedinfo').length && $('.renderedinfo').data('id')==player.id) already=true;
	html+=info_line({name:player.role&&player.role.toUpperCase()||"NAME",color:player.role&&"#E14F8B"||"gray",value:player.name,onclick:"render_cosmetics(xtarget||ctarget,{toggle:true})"});
		html+="<div class='ihtml'>";
			ihtml+=info_line({name:"LEVEL",color:"orange",value:player.level,afk:player.afk});
			ihtml+=info_line({name:"HP",color:colors.hp,value:player.hp+"/"+player.max_hp});
			ihtml+=info_line({name:"MP",color:"#365DC5",value:player.mp+"/"+player.max_mp});
			if(player.heal) ihtml+=info_line({name:"HEAL",color:"#CB83AC",value:round(player.heal)});
			ihtml+=info_line({name:"ATT",color:"green",value:round(player.attack),cursed:player.s.cursed});
			ihtml+=info_line({name:"ATTSPD",color:"gray",value:round(player.frequency*100),poisoned:player.s.poisoned});
			ihtml+=info_line({name:"RANGE",color:"gray",value:player.range});
			ihtml+=info_line({name:"RUNSPD",color:"gray",value:round(player.speed)});
			ihtml+=info_line({name:"ARMOR",color:"gray",value:player.armor||0});
			ihtml+=info_line({name:"RESIST.",color:"gray",value:player.resistance||0});

			if(player.code) ihtml+=info_line({name:"CODE",color:"gold",value:"Active"});
			if(player.party) ihtml+=info_line({name:"PARTY",color:"#FF4C73",value:player.party});
			html+=ihtml;
		html+="</div>";
		html+="<div class='xhtml'>";
			xhtml+=button_line({name:"<span style='color:gray'>{}</span><span style='color:white'>:</span> INSPECT",onclick:"ui_inspect(xtarget||ctarget)",color:colors.inspect});
			html+=xhtml;
		html+="</div>";
	var bid=player.party+"|"+player.stand+"|"+(character.slots.trade1!==undefined);
		html+="<div class='bhtml'>";
			if(!player.party && character && !player.me && !player.stand)
				bhtml+=button_line({name:"PARTY",onclick:"socket.emit('party',{event:'invite',id:'"+player.id+"'}); push_deferred('party')",color:"#6F3F87",pm_onclick:"cpm_window('"+(player.controller||player.name)+"')"});
			if(character && !player.me && (character.party && player.party==character.party && party_list.indexOf(character.name)<party_list.indexOf(player.name)))
				bhtml+=button_line({name:"KICK",onclick:"socket.emit('party',{event:'kick',name:'"+player.name+"'}); push_deferred('party')",color:"#875045"});
			if(character && !player.me && !character.party && player.party)
				bhtml+=button_line({name:"REQUEST",onclick:"socket.emit('party',{event:'request',id:'"+player.id+"'}); push_deferred('party')",color:"#6F3F87",pm_onclick:"cpm_window('"+(player.controller||player.name)+"')"});

			if(player.me) bhtml+=button_line({name:"COSMETICS",onclick:"render_cosmetics(xtarget||ctarget,{toggle:true})",color:"#A99A5B"});

			if(player.me && !character.stand && character.slots.trade1!==undefined)
				bhtml+=button_line({name:"HIDE",onclick:"socket.emit('trade',{event:'hide'});",color:"#A99A5B"});
			if(player.me && !character.stand && character.slots.trade1===undefined)
				bhtml+=button_line({name:"TRADE",onclick:"socket.emit('trade',{event:'show'});",color:"#A99A5B"});
			if(player.stand)
				bhtml+=button_line({name:"TOGGLE",onclick:"$('.cmerchant').toggle(); if(ctoggled==(xtarget||ctarget).name) ctoggled=null; else ctoggled=(xtarget||ctarget).name;",color:"#A99A5B",pm_onclick:!player.me&&"cpm_window('"+(player.controller||player.name)+"')"});

			if(character && !player.me && character.slots.gloves && character.slots.gloves.name=="poker")
				bhtml+=button_line({name:"POKE!",onclick:"socket.emit('poke',{name:'"+player.name+"'})",color:"#DF962B"});
			html+=bhtml;
		html+="</div>";
	html+="</div>";
	if(already)
	{
		$(".ihtml").html(ihtml);
		if(bid!=cache_bid) $(".bhtml").html(bhtml);
	}
	else $("#topleftcornerui").html(html);
	render_conditions(player);
	render_slots(player,{cx:true});
	// if(ctoggled==player.name) $('.cmerchant').toggle();
	if(cccx) render_cosmetics(player);
	cache_bid=bid;
}

function info_line(info)
{
	var color=info.color||"white",addition="",html="";
	if(info.onclick) info.value="<span class='clickable tomimick inline-block' onclick=\""+info.onclick+"\" ontouchstart=\""+info.onclick+"\">"+info.value+"</span>";
	if(info.afk && info.afk=="bot") addition=" <span class='gray'>[BOT]</span>";
	else if(info.afk && info.afk=="code") addition=" <span class='gray'>[CODE]</span>";
	else if(info.afk) addition=" <span class='gray'>[AFK]</span>";
	if(info.cursed) addition=" <span style='color: #7D4DAA'>[C]</span>";
	if(info.poisoned) addition=" <span style='color: #45993F'>[P]</span>";
	if(info.stunned) addition=" <span style='color: #FF9601'>[STUN]</span>";
	if(info.line)
	{
		if(info.onclick) info.line="<span class='clickable tomimick inline-block' onclick=\""+info.onclick+"\" ontouchstart=\""+info.onclick+"\">"+info.line+"</span>";
		html+="<span class='cbold' style='color: "+color+"'>"+info.line+"</span>"+addition+"<br />";
	}
	else if(info.vcolor) html+="<span class='cbold' style='color: "+color+"'>"+info.name+"</span>: <span style='color: "+info.vcolor+"'>"+info.value+addition+"</span><br />";
	else html+="<span class='cbold' style='color: "+color+"'>"+info.name+"</span>: "+info.value+addition+"<br />";
	return html;
}

function button_line(button,no_newline)
{
	var html="",color=button.color||"white";
	html+="<span style='color: "+color+"' class='clickable tomimick cbold inline-block' onclick=\""+button.onclick+"\">"+button.name+"</span> ";
	if(button.pm_onclick) html+=" <span style='color: "+("#A255BA"||"#276bc5"||color)+"' class='clickable tomimick cbold inline-block' onclick=\""+button.pm_onclick+"\">PM</span> ";
	if(!no_newline) html+="<br />";
	return html;
}

var cache_slots={},cache_sid=-1;
function render_slots(player,args)
{
	if(!args) args={};
	function render_slot(slot,shade,op)
	{
		var ecolor=undefined,chtml="",cached=cache_slots&&cache_slots[slot],cid='slot'+slot; // empty border color
		if(!window.mode || mode.empty_borders_darker) ecolor="#222424",ecolor="#292929"; //,ecolor="black";
		if(!op) op=0.4;
		if(player.slots[slot])
		{
			var current=player.slots[slot];
			var id='item'+randomStr(10),item=G.items[current.name];
			if(!item) item=G.items.placeholder_m;
			var skin=current.skin||item.skin;
			if(current.expires) skin=item.skin_a;
			if((current.name=="tristone" || current.name=="darktristone") && (player.skin.startsWith("mm_") || player.skin.startsWith("mf_") || player.skin.startsWith("tm_") || player.skin.startsWith("tf_"))) skin=item.skin_a;
			chtml+=item_container({skin:skin,
				onclick:args.merchant&&"mslot_click('"+player.name+"','"+slot+"')"||args.gallery&&window['slots'+player.name]&&"pslot_click('"+player.name+"','"+slot+"')"||args.gallery&&"render_item_info('"+current.name+"',"+current.level+")"||"slot_click('"+slot+"')",
				def:item,id:id,cid:cid,draggable:player.me,
				sname:player.me&&slot,shade:shade,s_op:op,slot:slot},current); // num:slot is new [06/08/16]
		}
		else if(in_arr(slot,trade_slots) && player.me) chtml+=item_container({size:40,draggable:player.me,shade:shade,s_op:op,slot:slot,cid:cid,onclick:"wishlist_click('"+slot+"')",bcolor:ecolor});
		else chtml+=item_container({size:40,draggable:player.me,shade:shade,s_op:op,slot:slot,cid:cid,bcolor:ecolor});
		html+=chtml;
		if(already && !ui_items_same(cached,current))
			$('#slot'+slot).replaceWith(chtml);
	}
	var my_slots=(player.me && player.slots.trade1!==undefined || (player.slots.trade1||player.slots.trade2||player.slots.trade3||player.slots.trade4)) && !player.stand;
	var draggable=player.me,already=false,sid=player.stand+"|"+my_slots;
	if(!args.pure && $('.slots').length && $('.slots').data('id')==player.id && sid==cache_sid) already=true; else cache_slots={};
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; margin-left: 5px' class='slots' data-id='"+player.id+"'>";
	if(args.pure) html="";
	if(player.stand)
	{
		var row=4,col=4,found=false;
		for(var t=30;t>=25;t--)
			if(("trade"+t) in player.slots) row=5,col=6,found=true;
		for(var t=24;t>=17;t--)
			if(!found && ("trade"+t) in player.slots) row=4,col=6,found=true;
		html+="<div class='cmerchant'>"
			for(var i=0;i<row;i++)
			{
				html+="<div>";
				for(var j=0;j<col;j++)
				{
					render_slot("trade"+((i*col)+j+1),"shade_gold",0.20); // 0.25 with the 16x16 original one
				}
				html+="</div>";
			}
		html+="</div>";
	}
	if(player.stand) html+="<div class='cmerchant hidden'>";
		html+="<div>";
			render_slot("earring1","shade_earring");
			render_slot("helmet","shade_helmet",0.5);
			render_slot("earring2","shade_earring");
			render_slot("amulet","shade_amulet");
		html+="</div>";
		html+="<div>";
			render_slot("mainhand","shade_mainhand",0.36);
			render_slot("chest","shade_chest");
			render_slot("offhand","shade_offhand");
			render_slot("cape","shade20_cape");
		html+="</div>";
		html+="<div>";
			render_slot("ring1","shade_ring");
			render_slot("pants","shade_pants",0.5);
			render_slot("ring2","shade_ring");
			render_slot("orb","shade20_orb");
		html+="</div>";
		html+="<div>";
			render_slot("belt","shade_belt");
			render_slot("shoes","shade_shoes",0.5);
			render_slot("gloves","shade_gloves");
			render_slot("elixir","shade20_elixir");
		html+="</div>";
		if(my_slots)
		{
			html+="<div>";
			render_slot("trade1","shade_gold",0.20);
			render_slot("trade2","shade_gold",0.20);
			render_slot("trade3","shade_gold",0.20);
			render_slot("trade4","shade_gold",0.20);
			html+="</div>";
		}
	if(player.stand) html+="</div>";
	// if(args.cx) html+="<div style='float: left; color: "+colors.inspect+"; font-size: 16px; line-height: 0px; margin-top: 7px; margin-bottom: -7px' class='clickable' onclick='show_json((xtarget||ctarget).slots)'>{}</div>"
	if(args.cx && 0) html+="<div style='float: right; font-size: 16px; line-height: 0px; margin-top: 7px; margin-bottom: -7px' class='clickable' onclick='render_cosmetics(xtarget||ctarget,{toggle:true})'>COSMETICS</div>"
	if(!args.pure) html+="</div>";
	if(!args.pure && !already)
	{
		if($('.slots').length) $('.slots').replaceWith(html);
		else $("#topleftcornerui").append(html);
	}
	cache_slots=Object.assign({},player.slots); cache_sid=sid;
	return html; // for character.html [19/11/18]
	// console.log(JSON.stringify(collection));
}

function render_transports_npc()
{
	reset_inventory(1);
	topleft_npc="transports"; rendered_target=topleft_npc;
	e_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top;'>";
		html+="<div class='clickable' onclick='transport_to(\"main\",9)'>&gt; Mainland</div>";
		html+="<div class='clickable' onclick='transport_to(\"winterland\",1)'>&gt; Winterland</div>"; // <span style='color: "+colors.xmas+"'>XMAS!!</span>
		// html+="<div class='clickable' onclick='transport_to(\"main2\")'>&gt; New Town <span style='color: "+colors.xmasgreen+"'>[Very Soon!]</span></div>";
		// html+="<div class='clickable' onclick='transport_to(\"underworld\")'>&gt; Underworld</div>"; // <span style='color: #D23F3A'>[Soon!]</span>
		html+="<div class='clickable' onclick='transport_to(\"desertland\",1)'>&gt; Desertland</div>"; //  <span style='color: #D2CB7E'>[Soon!]</span>
		// html+="<div class='clickable' onclick='transport_to(\"halloween\",1)'>&gt; Spooky Forest</div>"; //  <span style='color: #D26D1E'>[Halloween!]</span>
	if(S.duels)
	{
		for(var name in S.duels)
		{
			var duel=S.duels[name];
			html+="<div class='clickable' onclick='socket.emit(\"enter\",{place:\"duelland\",name:\""+duel.instance+"\"}); push_deferred(\"enter\")'>&gt; Duelland <span style='color:gray'>"+duel.challenger+"</span> vs <span style='color:gray'>"+duel.vs+"</span></div>";
		}
	}
	html+="</div>";
	$("#topleftcornerui").html(html);
}

function send_mainframe_command()
{
	var command=$(".maincommand").html();
	command=command.replace("&nbsp;","");
	//show_json(command);
	socket.emit("eval",{command:command});
	$(".maincommand").html("");
	setTimeout(function() {
		$(".maincommand").cfocus();
	},0);
}

function render_mainframe()
{
	reset_inventory(1);
	topleft_npc="mainframe"; rendered_target=topleft_npc;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top;'>";
		html+="<div>mainframe&gt; connected</div>";
		html+="<div><span class='commander clickable' onclick='$(\".maincommand\").cfocus()'>mainframe&gt;</span> <div class='inline-block maincommand editable' contenteditable=true data-default='\u00a0'> </div></div>";
		html+="<div class='clickable' onclick='socket.emit(\"leave\"); push_deferred(\"leave\")'>logout</div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	$(".maincommand").keydown(function(e){
		if(e.keyCode===13)
		{
			send_mainframe_command();
			return false;
		}
	});
	setTimeout(function() {
		$(".maincommand").cfocus();
	},0);
}


function render_gold_npc()
{
	reset_inventory(1);
	topleft_npc="gold"; rendered_target=topleft_npc;
	e_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center' onclick='stpr(event); cfocus(\".npcgold\")'>";
		html+="<div style='font-size: 36px; margin-bottom: 10px' class='clickable' onclick='$(\".npcgold\").html(to_pretty_num(max(character.bank.gold,character.gold)))'><span style='color:gold'>GOLD:</span> "+(character.user&&to_pretty_num(character.user.gold)||"Unavailable")+"</div>";
		html+="<div style='font-size: 36px; margin-bottom: 10px'><span class='gray clickable' onclick='$(\".npcgold\").cfocus()'>Amount:</span> <div contenteditable='true' class='npcgold inline-block' data-default='0'>0</div></div>";
		html+="<div>";
		if(options.bank_max) html+="<div class='gamebutton clickable mr5' onclick='$(\".npcgold\").html(max(character.bank.gold,character.gold))'>MAX</div>";
		html+="<div class='gamebutton clickable mr5' onclick='deposit()'>DEPOSIT</div><div class='gamebutton clickable' onclick='withdraw()'>WITHDRAW</div></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	cfocus('.npcgold');
}

var last_rendered_items="items0";
function render_items_npc(pack)
{
	if(!character.user) return;
	if(!pack) pack=last_rendered_items;
	if(pack && !character.user[pack])
	{
		render_interaction("unlock_"+pack,undefined,{pack:pack});
		topleft_npc="items"; rendered_target=topleft_npc; last_rendered_items=pack; // needs to be after render_interaction
		return;
	}
	last_rendered_items=pack;
	reset_inventory(1);
	topleft_npc="items"; rendered_target=topleft_npc;
	var collection=[],last=0,items=character.user[pack]||[];
	var html="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block' class='dcontain'>";
	for(var i=0;i<Math.ceil(max(character.isize,items.length)/7);i++)
	{
		html+="<div>"
		for(var j=0;j<7;j++)
		{
			var current=null;
			if(last<items.length) current=items[last++];
			else last++;
			if(current)
			{
				var id='citem'+(last-1),item=G.items[current.name],skin=item.skin;
				if(current.expires) skin=item.skin_a;
				html+=item_container({skin:skin,
					def:item,id:"str"+id,draggable:true,strnum:last-1,snum:last-1},current);
				collection.push({id:id,item:item,name:current.name,actual:current,num:last-1,npc:true});
			}
			else
			{
				html+=item_container({size:40,draggable:true,strnum:last-1});
			}
		}
		html+="</div>";
	}
	html+="</div><div id='storage-item' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-left: 5px'></div>";
	$("#topleftcornerui").html(html);
	for(var i=0;i<collection.length;i++)
	{
		var entity=collection[i];
		function item_click(entity)
		{
			return function(){
				render_item("#storage-item",entity);
			}
		}
		$("#str"+entity.id).on("click",item_click(entity)).addClass('clickable');
	}
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

function ui_items_same(cached,current)
{
	if(cached==-1) return false;
	if(!cached && !current || cached && current && cached.name==current.name && cached.q==current.q && cached.level==current.level && (!cached.expires)==(!current.expires)) return true;
	return false;
}

var cache_i=[];

function update_inventory()
{
	var last=0,rids=[];
	for(var i=0;i<Math.ceil(max(character.isize,character.items.length)/7);i++)
	{
		for(var j=0;j<7;j++)
		{
			var current=null,id='citem'+last,cc_id='c'+id,html="",cached=cache_i[last];
			if(last<character.items.length) current=character.items[last];
			if(ui_items_same(cached,current)) { last++; continue;}
			if(current)
			{
				var item=G.items[current.name]||{"skin":"test","name":"Unrecognized Item"},skin=current.skin||item.skin;
				if(current.expires) skin=item.skin_a;
				if(current.name=="placeholder")
				{
					var rid=randomStr(8);
					var name=current.p && current.p.name || "placeholder_m";
					html=item_container({shade:G.items[name].skin,onclick:"inventory_click("+last+",event)",onmousedown:"inventory_middle("+last+",event)",def:item,id:id,cid:cc_id,draggable:false,num:last,cnum:last,s_op:0.5,bcolor:"gray ",loader:"qplc"+rid,level:current.p&&current.p.level||undefined,iname:name});
					rids[last]=rid;
				}
				else
				{
					html=item_container({skin:skin,onclick:"inventory_click("+last+",event)",onmousedown:"inventory_middle("+last+",event)",def:item,id:id,cid:cc_id,draggable:true,num:last,cnum:last},current);
				}
			}
			else
			{
				html=item_container({size:40,draggable:true,cnum:last,cid:cc_id});
			}
			$('#ccitem'+last).replaceWith(html);
			last++;
		}
	}
	$(".cashnum").html(to_pretty_num(character.cash||0));
	$(".goldnum").html(to_pretty_num(character.gold));
	cache_i=character.items.slice();
	["upgrade","compound","exchange"].forEach(function(e){
		if(character.q[e] && rids[character.q[e].num])
		{
			$(".loaderqplc"+rids[character.q[e].num]).css("opacity",0.4);
			add_tint(".loaderqplc"+rids[character.q[e].num],{ms:character.q[e].ms,start:future_ms(character.q[e].ms-character.q[e].len),type:"progress"});
		}
	});
}

function render_inventory(reset)
{
	var last=0,right_style='text-align: right',rids=[];
	if(inventory && !reset) { $("#bottomleftcorner").html(''); /*$("#theinventory").remove();*/ inventory=false; return; }
	else if(reset && !inventory) reset=false;
	if(!reset) unread_chat=0;
	if(reset) return update_inventory(); // new [15/02/20]
	inventory_opened_for=null;
	var html="",columns=7;
	if(is_comm) columns=5;
	var character=window.character; if(is_comm) character=observing;
	if(!reset && !is_comm) html+="<div style='background-color: black; border: 5px solid gray; margin-bottom: -5px; padding: 2px 16px 2px 16px; font-size: 24px; vertical-align: bottom; display: none; color: #FCB136' class='newchatui clickable' onclick='stpr(event); render_inventory()'>12 new chat messages!</div><div></div>";
	if(is_comm) html+="<div onclick='hide_modal()'>";
	html+="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block; vertical-align: bottom; "+(is_comm&&"margin-top: 40px; margin-bottom: 40px"||"")+"' class='dcontain theinventory'>";
	if(c_enabled)
	{
		if(is_comm)
		{
			html+="<div style='padding: 4px; display: inline-block;'>"; // '
			html+="<span class='cbold' style='color: "+colors.cash+"'>SHELLS</span>: <span class='cashnum'>"+to_pretty_num(character.cash||0)+"</span></div>";
			html+="<div style='border-bottom: 5px solid gray; margin-bottom: 2px; margin-left: -5px; margin-right: -5px'></div>";
			right_style="";
		}
		else if(is_electron)
		{
			html+="<div style='padding: 4px; display: inline-block' class='clickable' onclick='pcs(event); show_shells_info()'>"; // '
			html+="<span class='cbold' style='color: "+colors.cash+"'>SHELLS</span>: <span class='cashnum'>"+to_pretty_num(character.cash||0)+"</span></div>";
			right_style=" display: inline-block; float: right";
		}
		else
		{
			html+="<div style='padding: 4px; display: inline-block' class='clickable'>"; // onclick='shells_click()'
			html+="<a href='https://adventure.land/shells' class='cancela' target='_blank'><span class='cbold' style='color: "+colors.cash+"'>SHELLS</span>: <span class='cashnum'>"+to_pretty_num(character.cash||0)+"</span></a></div>";
			right_style=" display: inline-block; float: right";
		}
	}
	html+="<div style='padding: 4px;"+right_style+"'><span class='cbold' style='color: gold'>GOLD</span>: <span class='goldnum'>"+to_pretty_num(character.gold)+"</span></div>";
	html+="<div style='border-bottom: 5px solid gray; margin-bottom: 2px; margin-left: -5px; margin-right: -5px'></div>";
	for(var i=0;i<Math.ceil(max(character.isize,character.items.length)/columns);i++)
	{
		html+="<div>"
		for(var j=0;j<columns;j++)
		{
			var current=null,id='citem'+last,cc_id='c'+id;
			if(last<character.items.length) current=character.items[last];
			if(current)
			{
				var item=G.items[current.name]||{"skin":"test","name":"Unrecognized Item"},skin=current.skin||item.skin;
				if(current.expires) skin=item.skin_a;
				if(current.name=="placeholder")
				{
					var rid=randomStr(8);
					var name=current.p && current.p.name || "placeholder_m";
					html+=item_container({shade:G.items[name].skin,onclick:"inventory_click("+last+",event)",onmousedown:"inventory_middle("+last+",event)",def:item,id:id,cid:cc_id,draggable:false,num:last,cnum:last,s_op:0.5,bcolor:"gray ",loader:"qplc"+rid,level:current.p&&current.p.level||undefined,iname:name});
					rids[last]=rid;
				}
				else
				{
					html+=item_container({skin:skin,onclick:"inventory_click("+last+",event)",onmousedown:"inventory_middle("+last+",event)",def:item,id:id,cid:cc_id,draggable:true,num:last,cnum:last},current);
				}
			}
			else
			{
				html+=item_container({size:40,draggable:true,cnum:last,cid:cc_id});
			}
			last++;
		}
		html+="</div>";
	}
	html+="</div>";
	if(is_comm) html+="</div>";
	cache_i=character.items.slice();
	if(is_comm) return show_modal(html,{wrap:false});
	inventory=true;
	if(!reset)
	{
		html+="<div class='inventory-item' style='display: inline-block; vertical-align: top; margin-left: 5px'></div>";
		$("#bottomleftcorner").html(html);
	}
	else
	{
		$(".theinventory").replaceWith(html);
	}
	["upgrade","compound","exchange"].forEach(function(e){
		if(character.q[e] && rids[character.q[e].num])
		{
			$(".loaderqplc"+rids[character.q[e].num]).css("opacity",0.4);
			add_tint(".loaderqplc"+rids[character.q[e].num],{ms:character.q[e].ms,start:future_ms(character.q[e].ms-character.q[e].len),type:"progress"});
		}
	});
}

function render_craftsman()
{
	var shade="stick",button="CRAFT";
	reset_inventory(1);
	topleft_npc="craftsman"; rendered_target=topleft_npc;
	cr_items=e_array(9),cr_last=0
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
		/*html+="<div class='ering ering1 mb10'>";
			html+="<div class='ering ering2'>";
				html+="<div class='ering ering3'>";
					//html+="<div class='ering ering4'>";*/
					html+="<div>";
						html+=item_container({shade:shade,cid:'critem0',s_op:0.36,draggable:false,droppable:true});
						html+=item_container({shade:shade,cid:'critem1',s_op:0.36,draggable:false,droppable:true});
						html+=item_container({shade:shade,cid:'critem2',s_op:0.36,draggable:false,droppable:true});
					html+="</div>";
					html+="<div>";
						html+=item_container({shade:shade,cid:'critem3',s_op:0.36,draggable:false,droppable:true});
						html+=item_container({shade:shade,cid:'critem4',s_op:0.36,draggable:false,droppable:true});
						html+=item_container({shade:shade,cid:'critem5',s_op:0.36,draggable:false,droppable:true});
					html+="</div>";
					html+="<div class='mb5'>";
						html+=item_container({shade:shade,cid:'critem6',s_op:0.36,draggable:false,droppable:true});
						html+=item_container({shade:shade,cid:'critem7',s_op:0.36,draggable:false,droppable:true});
						html+=item_container({shade:shade,cid:'critem8',s_op:0.36,draggable:false,droppable:true});
					html+="</div>";
					//html+="</div>";
				/*html+="</div>";
			html+="</div>";
		html+="</div>";*/
		html+="<div><div class='gamebutton clickable' onclick='draw_trigger(function(){ render_craftsman(); reset_inventory(); });'>RESET</div> <div class='gamebutton clickable' onclick='craft()'>"+button+"</div></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

function render_dismantler()
{
	var shade="fclaw",button="DISMANTLE";
	reset_inventory(1);
	topleft_npc="dismantler"; rendered_target=topleft_npc;
	ds_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
		/*html+="<div class='ering ering1 mb10'>";
			html+="<div class='ering ering2'>";
				html+="<div class='ering ering3'>";
					//html+="<div class='ering ering4'>";*/
					html+="<div>";
						html+=item_container({shade:shade,cid:'dsitem',s_op:0.36,draggable:false,droppable:true});
					html+="</div>";
					//html+="</div>";
				/*html+="</div>";
			html+="</div>";
		html+="</div>";*/
		html+="<div style='margin-top: 12px'><div class='gamebutton clickable' onclick='dismantle()'>"+button+"</div></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

var last_lmode="lock";
function render_locksmith(mode)
{
	if(!mode) mode=last_lmode; last_lmode=mode;
	var button="LOCK",f="lock_item",shade="shade_seal";
	if(mode=="unlock") button="UNLOCK",f="unlock_item",shade="shade_unlock";
	if(mode=="seal") button="SEAL",f="seal_item",shade="shade_lock";
	reset_inventory(1);
	topleft_npc="locksmith"; rendered_target=topleft_npc;
	l_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
		/*html+="<div class='ering ering1 mb10'>";
			html+="<div class='ering ering2'>";
				html+="<div class='ering ering3'>";
					//html+="<div class='ering ering4'>";*/
					html+="<div>";
						html+=item_container({shade:shade,cid:'litem',s_op:0.4,draggable:false,droppable:true});
					html+="</div>";
					//html+="</div>";
				/*html+="</div>";
			html+="</div>";
		html+="</div>";*/
		html+="<div style='margin-top: 12px'><div class='gamebutton clickable' onclick='"+f+"()'>"+button+"</div></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

function render_recipe(element,type,name)
{
	last_selector="#recipe-item";
	var html;
	if(type!="dismantle")
	{
		html=render_item("html",{item:G.items[name],name:name,craft:true});
	}
	else
	{
		html=render_item("html",{item:G.items[name],name:name,dismantle:true});
	}
	if(element)
		$("#recipe-item").html(html);
	else
		show_modal(html,{wrap:false,hideinbackground:true});
}

var r_page={};
function render_recipes(type)
{
	if(!type) type="";
	reset_inventory(1);
	topleft_npc="recipes"; rendered_target=topleft_npc;
	var last=0,items=[];
	var html="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block'>";
	if(type=="dismantle")
	{
		object_sort(G.dismantle,"gold_value").forEach(function(e){
			items.push(e[0]);
		});
	}
	else
	{
		object_sort(G.craft,"gold_value").forEach(function(e){
			if((e[1].quest||"")!=type) return;
			items.push(e[0]);
		});
	}
	r_page[type]=r_page[type]||0;
	if(r_page[type]>=1) last+=19+(r_page[type]-1)*18;
	for(var i=0;i<4;i++)
	{
		html+="<div>"
		for(var j=0;j<5;j++)
		{
			if(i==3 && j==0 && r_page[type]!=0) html+=item_container({skin:"left",onclick:"r_page['"+type+"']="+(r_page[type]-1)+"; render_recipes('"+type+"');"},{q:r_page[type],left:true});
			else if(i==3 && j==4 && last<items.length-1) html+=item_container({skin:"right",onclick:"r_page['"+type+"']="+(r_page[type]+1)+"; render_recipes('"+type+"');"},{q:r_page[type]+2});
			else if(last<items.length && items[last++])
			{
				var current=items[last-1];
				var id='item'+randomStr(10),item=G.items[current];
				html+=item_container({skin:item.skin_a||item.skin,def:item,id:id,draggable:false,onclick:"render_recipe(this,'"+type+"','"+current+"')"},{name:current});
			}
			else
			{
				html+=item_container({size:40,draggable:false,droppable:true});
			}
		}
		html+="</div>";
	}
	html+="</div>";
	html+="<div id='recipe-item' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-left: 5px'>"+(next_side_interaction&&render_interaction(next_side_interaction,"return_html")||" ")+"</div>";
	next_side_interaction=null;
	$("#topleftcornerui").html(html);
}

function render_recipes_old(quest)
{
	topleft_npc="recipes"; rendered_target=topleft_npc; i=0;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
	html+="<div class='clickable' onclick='render_craftsman()'>CRAFT</div>";
	object_sort(G.craft).forEach(function(io){
		if(io[1].quest!=quest) return;
		var name=io[0];
		html+=item_container({skin:G.items[name].skin,onclick:"render_recipe(null,'craft','"+name+"')"},{name:name});
		i+=1;
		if(!(i%6)) html+="<div></div>";
	});
	html+="<div class='clickable' onclick='render_dismantler()'>DISMANTLE</div>"; i=0;
	object_sort(G.dismantle).forEach(function(io){
		if(io[1].quest!=quest) return;
		var name=io[0];
		html+=item_container({skin:G.items[name].skin,onclick:"render_recipe(null,'dismantle','"+name+"')"},{name:name});
		i+=1;
		if(!(i%6)) html+="<div></div>";
	});
	html+="</div><div id='recipe-item' style='display: inline-block; vertical-align: top; margin-left: 5px'></div>";
	$("#topleftcornerui").html(html);
}

function render_exchange_shrine(type)
{
	var shade="shade_exchange",button="EXCHANGE";
	var originals=[e_item];
	reset_inventory(1);
	topleft_npc="exchange"; rendered_target=topleft_npc; exchange_type=type;
	if(type=="leather") shade="leather",button="GIVE";
	if(type=="lostearring") shade="lostearring",button="PROVIDE";
	if(type=="mistletoe") shade="mistletoe",button="GIVE IT";
	if(type=="candycane") shade="candycane",button="FEED";
	if(type=="ornament") shade="ornament",button="GIVE";
	if(type=="seashell") shade="seashell",button="GIVE";
	if(type=="gemfragment") shade="gemfragment",button="PROVIDE";
	if(type=="cx") shade="cosmo0",button="SHAZAM";
	e_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
		html+="<div class='ering ering1 mb10'>";
			html+="<div class='ering ering2'>";
				html+="<div class='ering ering3'>";
					//html+="<div class='ering ering4'>";
						if(character.q.exchange)
						{
							var level=character.q.exchange.s||0;
							var name=character.q.exchange.name;
							var q=undefined;
							if(character.q.exchange.q>1) q=character.q.exchange.q;
							html+=item_container({cid:'eitem',draggable:false,droppable:false,skin:G.items[name].skin},{name:name,level:level,q:q});
						}
						else html+=item_container({shade:shade,cid:'eitem',s_op:0.5,draggable:false,droppable:true});
					//html+="</div>";
				html+="</div>";
			html+="</div>";
		html+="</div>";
		html+="<div><div class='gamebutton clickable' onclick='exchange()'>"+button+"</div></div>";
	html+="</div>";
	html+="<div id='exc-ui' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-left: 5px'>"+"</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
	return !character.q.exchange&&originals||[];
}

function render_pet_shrine()
{
	var button="RELEASE";
	var originals=[e_item];
	reset_inventory(1);
	e_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
		html+="<div class='ering ering1 mb10'>";
			html+="<div class='ering ering2'>";
				html+="<div class='ering ering3'>";
					//html+="<div class='ering ering4'>";
						if(character.q.exchange)
						{
							var level=character.q.exchange.s||0;
							var name=character.q.exchange.name;
							var q=undefined;
							if(character.q.exchange.q>1) q=character.q.exchange.q;
							html+=item_container({cid:'eitem',draggable:false,droppable:false,skin:G.items[name].skin},{name:name,level:level,q:q});
						}
						else
						{
							html+=item_container({shade:"pball",cid:'eitem',s_op:0.5,draggable:false,droppable:true});
							html+=item_container({shade:"chry",cid:'eitem',s_op:0.5,draggable:false,droppable:true});
						}
					//html+="</div>";
				html+="</div>";
			html+="</div>";
		html+="</div>";
		html+="<div><div class='gamebutton clickable' onclick='exchange()'>RELEASE</div></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
	return !character.q.exchange&&originals||[];
}

function render_none_shrine(type)
{
	var shade="cape0",button="POOF";
	reset_inventory(1);
	topleft_npc="none"; rendered_target=topleft_npc;
	p_item=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: center'>";
		html+="<div class='ering ering1 mb10'>";
			html+="<div class='ering ering2'>";
				html+="<div class='ering ering3'>";
					//html+="<div class='ering ering4'>";
						html+=item_container({shade:shade,cid:'pitem',s_op:0.5,draggable:false,droppable:true});
					//html+="</div>";
				html+="</div>";
			html+="</div>";
		html+="</div>";
		html+="<div><div class='gamebutton clickable' onclick='poof()'>"+button+"</div></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

function render_shells_buyer()
{
	topleft_npc="buyshells"; rendered_target=topleft_npc;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top; text-align: left'>",prefix="";
		html+="<div><span style='color: #5DAC40'>10</span> Shells = <span style='color: gold'>1,500,000</span> <span style='color: #71AF83' class='clickable' onclick='buy_shells(10)'>BUY</span></div>";
		html+="<div><span style='color: #5DAC40'>100</span> Shells = <span style='color: gold'>15,000,000</span> <span style='color: #71AF83' class='clickable' onclick='buy_shells(100)'>BUY</span></div>";
		html+="<div><span style='color: #5DAC40'>500</span> Shells = <span style='color: gold'>75,000,000</span> <span style='color: #71AF83' class='clickable' onclick='buy_shells(500)'>BUY</span></div>";
		html+="<div><span style='color: #5DAC40'>1,000</span> Shells = <span style='color: gold'>150,000,000</span> <span style='color: #71AF83' class='clickable' onclick='buy_shells(1000)'>BUY</span></div>";
		if(!is_electron) prefix="<a href='https://adventure.land/shells' class='cancela' target='_blank'><span class='clickable' onclick='rendered_target=null;' style='color: #359ECF'>Buy With $</span></a> | "
		html+="<div>"+prefix+"<span class='clickable' onclick='topleft_npc=false;' style='color: #555556'>Nope</span></div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

function render_upgrade_shrine(explicit)
{
	reset_inventory(1);
	var originals=[u_item,u_scroll,u_offering],already=(topleft_npc=="upgrade");
	topleft_npc="upgrade"; rendered_target=topleft_npc;
	u_item=null,u_scroll=null,u_offering=null;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top'>",rid=randomStr(6),core="";
		html+="<div class='mb5' align='center' id='core'>";
			if(character.q.upgrade && character.items[character.q.upgrade.num] && character.items[character.q.upgrade.num].name=="placeholder")
			{
				var def=character.items[character.q.upgrade.num].p;
				core+="<div>";
					core+=item_container({skin:G.items[def.name].skin,pui:def},{name:def.name,level:def.level});
				core+="</div>";
				core+="<div>";
					if(def.offering) core+=item_container({skin:G.items[def.offering].skin,loader:!def.scroll&&"theuitem"+rid},{name:def.offering});
					else core+=item_container({shade:"shade_offering",s_op:0.36});
					if(def.scroll) core+=item_container({skin:G.items[def.scroll].skin,loader:"theuitem"+rid},{name:def.scroll});
					else core+=item_container({draggable:false,droppable:true,shade:"shade_scroll",cid:'uscroll',s_op:0.36});
				core+="</div>";
			}
			else
			{
				core+="<div>";
					core+=item_container({draggable:false,droppable:true,shade:"shade_uweapon",cid:'uweapon',s_op:0.36,pui:true});
				core+="</div>";
				core+="<div>";
					core+=item_container({draggable:false,droppable:true,shade:"shade_offering",cid:'uoffering',s_op:0.36}); // previously 0.24
					core+=item_container({draggable:false,droppable:true,shade:"shade_scroll",cid:'uscroll',s_op:0.36});
				core+="</div>";
			}
			html+=core;
		html+="</div>";
		html+="<div class='gamebutton clickable' onclick='draw_trigger(function(){ render_upgrade_shrine(1); reset_inventory(); });'>RESET</div>";
		html+="<div class='gamebutton clickable ml5' onclick='upgrade(u_item,u_scroll,u_offering);'>UPGRADE</div>";
	html+="</div>";
	if(already) $("#core").html(core);
	else $("#topleftcornerui").html(html);
	if(character.q.upgrade)
	{
		$(".loadertheuitem"+rid).css("opacity",0.8);
		add_tint(".loadertheuitem"+rid,{ms:character.q.upgrade.ms,start:future_ms(character.q.upgrade.ms-character.q.upgrade.len),type:"progress",upgrade:true});
	}
	if(!inventory && explicit) render_inventory(),inventory_opened_for=topleft_npc;
	return !character.q.upgrade&&originals||[];
}

function render_compound_shrine(explicit)
{
	reset_inventory(1);
	var originals=[c_items[0],c_items[1],c_items[2],c_scroll,c_offering],already=(topleft_npc=="compound");
	topleft_npc="compound"; rendered_target=topleft_npc;
	c_items=e_array(3),c_scroll=null,c_offering=null; c_last=0;
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top'>",rid=randomStr(6),core="";
		html+="<div class='mb5' align='center'>";
			html+="<div align='left' style='display: inline-block' id='core'>"; // for pui:true [13/06/19]
				if(character.q.compound && character.items[character.q.compound.num] && character.items[character.q.compound.num].name=="placeholder")
				{
					var def=character.items[character.q.compound.num].p;
					core+="<div>";
						core+=item_container({skin:G.items[def.name].skin},{name:def.name,level:def.level});
						core+=item_container({skin:G.items[def.name].skin},{name:def.name,level:def.level});
						core+=item_container({skin:G.items[def.name].skin},{name:def.name,level:def.level});
					core+="</div>";
					core+="<div>";
						if(def.offering) core+=item_container({skin:G.items[def.offering].skin},{name:def.offering});
						else core+=item_container({shade:"shade_offering",s_op:0.36});
						core+=item_container({skin:G.items[def.scroll].skin,pui:def,loader:"theuitem"+rid},{name:def.scroll});
					core+="</div>";
				}
				else
				{
					core+="<div>";
						core+=item_container({draggable:false,droppable:true,shade:"shade_cring",cid:'compound0',s_op:0.36});
						core+=item_container({draggable:false,droppable:true,shade:"shade_cring",cid:'compound1',s_op:0.36});
						core+=item_container({draggable:false,droppable:true,shade:"shade_cring",cid:'compound2',s_op:0.36});
					core+="</div>";
					core+="<div>";
						core+=item_container({draggable:false,droppable:true,shade:"shade_offering",cid:'coffering',s_op:0.36});
						core+=item_container({draggable:false,droppable:true,shade:"shade_cscroll",cid:'cscroll',s_op:0.36,pui:true});
					core+="</div>";
				}
				html+=core;
			html+="</div>";
		html+="</div>";
		html+="<div class='gamebutton clickable' onclick='draw_trigger(function(){ render_compound_shrine(1); reset_inventory(); });'>RESET</div>";
		html+="<div class='gamebutton clickable ml5' onclick=' compound(c_items[0],c_items[1],c_items[2],c_scroll,c_offering);'>COMBINE</div>";
	html+="</div>";
	if(already) $("#core").html(core);
	else $("#topleftcornerui").html(html);
	if(character.q.compound)
	{
		$(".loadertheuitem"+rid).css("opacity",0.8);
		add_tint(".loadertheuitem"+rid,{ms:character.q.compound.ms,start:future_ms(character.q.compound.ms-character.q.compound.len),type:"progress",compound:true});
	}
	if(!inventory && explicit) render_inventory(),inventory_opened_for=topleft_npc;
	return !character.q.compound&&originals||[];
}

var dice_bet={active:false,dir:1};
function on_dice_change()
{
	if(topleft_npc!="dice") return;
	var num=min(99.99,max(0,parseFloat($(".dicenum").html()))),mult;
	var gold=parseInt($(".dicegold").html().replace_all(",",""));
	if(!gold) gold=100000; gold=max(10000,gold);
	$(".dicegold").html(to_pretty_num(gold)); dice_bet.gold=gold;
	var hnum=num.toFixed(2);
	if(hnum.length!=5) hnum="0"+hnum;
	$(".dicenum").html(hnum); dice_bet.num=hnum; num=parseFloat(hnum);
	if(dice_bet.dir==1)
	{
		mult=100.0/(100.0-num);
		$(".diceup").css("border-color","#A7C16D"); $(".dicedown").css("border-color","gray");
	}
	else
	{
		mult=100.0/num;
		$(".diceup").css("border-color","gray"); $(".dicedown").css("border-color","#A7C16D");
	}
	mult=min(mult,10000);
	$(".dicexx").html("FOR "+to_pretty_float(mult)+"X");
	if(dice_bet.active) $(".diceb").css("border-color","gold");
	else $(".diceb").css("border-color","gray");
}

function on_dice_bet()
{
	var num=min(99.99,max(0,parseFloat($(".dicenum").html())));
	var gold=parseInt($(".dicegold").html().replace_all(",",""));
	dice(dice_bet.dir,num,gold);
}

function render_dice()
{
	var num=dice_bet.num||"50.00";
	var gold=dice_bet.gold||100000;
	reset_inventory(1);
	topleft_npc="dice"; rendered_target=topleft_npc
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 32px; display: inline-block; vertical-align: top'>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span class='gray clickable' onclick='$(\".dicenum\").cfocus()'>NUMBER:</span> <div class='inline-block dicenum' contenteditable=true onblur='on_dice_change()'>"+num+"</div></div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span class='gold clickable' onclick='$(\".dicegold\").cfocus()'>GOLD:</span> <div class='inline-block dicegold' contenteditable=true onblur='on_dice_change()'>"+to_pretty_num(gold)+"</div></div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div class='gamebutton clickable diceup' onclick='dice_bet.dir=1; on_dice_change()' style='width: 64px;'>UP</div>";
			html+="<div class='gamebutton clickable ml5 dicedown' onclick='dice_bet.dir=2; on_dice_change()' style='width: 64px'>DOWN</div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div class='gamebutton clickable diceb' onclick='on_dice_bet()' style='width: 200px;'>BET <span class='gray dicexx'>FOR 2X</span></div>";
		html+="</div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
	on_dice_change();
}

function render_tavern_info(data)
{
	topleft_npc="info"; rendered_target=topleft_npc
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 32px; display: inline-block; vertical-align: top'>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span class='gray'>House Edge</span></div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span>"+data.edge.toFixed(2)+"%</span></div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span class='gray'>Max. Net Win</span></div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span class='gold'>"+to_pretty_num(data.max)+"</span></div>";
		html+="</div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
}

function on_donate_change()
{
	if(topleft_npc!="donate") return;
	var gold=parseInt($(".dgold").html().replace_all(",",""));
	if(!gold) gold=100000; gold=max(1,gold);
	$(".dgold").html(to_pretty_num(gold)); dice_bet.gold=gold;
}

function render_donate()
{
	var gold=10000000;
	reset_inventory(1);
	topleft_npc="donate"; rendered_target=topleft_npc
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 32px; display: inline-block; vertical-align: top'>";
		html+="<div class='mb5' align='center'>";
			html+="<div><span class='gold clickable' onclick='$(\".dgold\").cfocus()'>GOLD:</span> <div class='inline-block dgold' contenteditable=true onblur='on_donate_change()'>"+to_pretty_num(gold)+"</div></div>";
		html+="</div>";
		html+="<div class='mb5' align='center'>";
			html+="<div class='gamebutton clickable diceb' onclick='donate()' style='width: 160px; margin-top: 20px'>DONATE</div>";
		html+="</div>";
	html+="</div>";
	$("#topleftcornerui").html(html);
	if(!inventory) render_inventory(),inventory_opened_for=topleft_npc;
	on_donate_change();
}

function render_merchant(npc,premium)
{
	reset_inventory(1);
	topleft_npc="merchant"; rendered_target=topleft_npc; merchant_id=npc.id;
	var last=0,collection=[];
	var html="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block'>",f="buy_with_gold";
	if(premium) f="buy_with_shells";
	for(var i=0;i<4;i++)
	{
		html+="<div>"
		for(var j=0;j<5;j++)
		{
			if(last<npc.items.length && npc.items[last++] && (c_enabled || !G.items[npc.items[last-1]].cash))
			{
				var current=npc.items[last-1];
				var id='item'+randomStr(10),item=G.items[current];
				html+=item_container({skin:item.skin_a||item.skin,def:item,id:id,draggable:false,on_rclick:f+"('"+current+"')"});
				if(premium) collection.push({id:id,item:item,name:current,value:item.g,cash:item.cash});
				else if(item.cash) collection.push({id:id,item:item,name:current,value:item.g*G.inflation});
				else collection.push({id:id,item:item,name:current,value:item.g});
			}
			else
			{
				html+=item_container({size:40,draggable:false,droppable:true});
			}
		}
		html+="</div>";
	}
	html+="</div>";
	html+="<div id='merchant-item' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-left: 5px'>"+(next_side_interaction&&render_interaction(next_side_interaction,"return_html")||" ")+"</div>";
	next_side_interaction=null;
	$("#topleftcornerui").html(html);
	for(var i=0;i<collection.length;i++)
	{
		var entity=collection[i];
		function item_click(entity)
		{
			return function(){
				render_item("#merchant-item",entity);
			}
		}
		$("#"+entity.id).on("click",item_click(entity)).addClass('clickable');
	}
}

var t_page={};
function render_token_exchange(token)
{
	reset_inventory(1);
	topleft_npc="token_exchange"; rendered_target=topleft_npc;
	var last=0,collection=[],items=[token];
	var html="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block'>";
	object_sort(G.tokens[token],"value").forEach(function(e){
		items.push(e[0]);
	});
	t_page[token]=t_page[token]||0;
	if(t_page[token]>=1) last+=19+(t_page[token]-1)*18;
	for(var i=0;i<4;i++)
	{
		html+="<div>"
		for(var j=0;j<5;j++)
		{
			if(i==3 && j==0 && t_page[token]!=0) html+=item_container({skin:"left",onclick:"t_page['"+token+"']="+(t_page[token]-1)+"; render_token_exchange('"+token+"');"},{q:t_page[token],left:true});
			else if(i==3 && j==4 && last<items.length-1) html+=item_container({skin:"right",onclick:"t_page['"+token+"']="+(t_page[token]+1)+"; render_token_exchange('"+token+"');"},{q:t_page[token]+2});
			else if(last<items.length && items[last++])
			{
				var current=items[last-1],data=undefined;
				if(current.search("-")!=-1){ data=current.split("-")[1]; current=current.split("-")[0]; }
				var id='item'+randomStr(10),item=G.items[current];
				html+=item_container({skin:item.skin_a||item.skin,def:item,id:id,draggable:false});
				collection.push({id:id,item:item,name:current,token:token,key:items[last-1],actual:{name:current,level:0,q:1,data:data}});
			}
			else
			{
				html+=item_container({size:40,draggable:false,droppable:true});
			}
		}
		html+="</div>";
	}
	html+="</div>";
	html+="<div id='merchant-item' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-left: 5px'>"+(next_side_interaction&&render_interaction(next_side_interaction,"return_html")||" ")+"</div>";
	next_side_interaction=null;
	$("#topleftcornerui").html(html);
	for(var i=0;i<collection.length;i++)
	{
		var entity=collection[i];
		function item_click(entity)
		{
			return function(){
				render_item("#merchant-item",entity);
			}
		}
		$("#"+entity.id).on("click",item_click(entity)).addClass('clickable');
	}
}

function monster_x(name)
{
	show_snippet("smart_move(\""+name+"\")");
}

function render_drop(def,mult,color)
{
	var html="";
	if(def[1]=="open")
	{
		var total=0;
		G.drops[def[2]].forEach(function(d){ total+=d[0]; });
		G.drops[def[2]].forEach(function(d){
			html+=render_drop(d,mult*def[0]/total,color);
		});
		return html;
	}
	html+="<div style='position: relative; white-space: nowrap;'>";
		var skin="",actual=undefined;	
		if(G.items[def[1]])
		{
			skin=G.items[def[1]].skin;
			actual={name:def[1],q:def[2],data:def[3]};
		}
		else if(def[1]=="empty")
		{
			html+="<div style='z-index: 1; background-color:#575983; border: 2px solid #9F9FB0; position: absolute; top: -2px; left: -2px; color:#C5C7E0; font-size: 16px; display: inline-block; padding: 1px 1px 1px 3px;'>ZILCH</div>";
		}
		else if(def[1]=="shells")
		{
			html+="<div style='z-index: 1; background-color:#575983; border: 2px solid #9F9FB0; position: absolute; top: -2px; left: -2px; color:#8DE33B; font-size: 16px; display: inline-block; padding: 1px 1px 1px 3px;'>"+to_shrinked_num(def[2])+"</div>";
			skin="shells";
		}
		else if(def[1]=="gold")
		{
			html+="<div style='z-index: 1; background-color:#575983; border: 2px solid #9F9FB0; position: absolute; top: -2px; left: -2px; color:gold; font-size: 16px; display: inline-block; padding: 1px 1px 1px 3px;'>"+to_shrinked_num(def[2])+"</div>";
			skin="gold";
		}
		if(def[1]=="cx") html+=cx_sprite(def[2],{mright:4});
		else if(def[1]=="cxbundle")
		{
			G.cosmetics.bundle[def[2]].forEach(function(cid){
				html+=cx_sprite(cid,{mright:4});
			});
		}
		else html+="<span class='clickable' onclick='pcs(event); render_item_info(\""+def[1]+"\",0,\""+(actual&&actual.data||"")+"\")'>"+item_container({skin:skin},actual)+"</span>";
		if(def[0]*mult>=1) html+="<div style='vertical-align: middle; display: inline-block; font-size: 24px; line-height: 50px; height: 50px; margin-left: 5px; margin-right: 8px'>"+to_pretty_float(def[0]*mult)+" / 1</div>";
		else if(1/(def[0]*mult)>=1.1 && 1/(def[0]*mult)<10 && parseInt(1/(def[0]*mult))*10!=parseInt(10/(def[0]*mult))) html+="<div style='vertical-align: middle; display: inline-block; font-size: 24px; line-height: 50px; height: 50px; margin-left: 5px; margin-right: 8px'>10 / "+to_pretty_num(round(10/(def[0]*mult)))+"</div>";
		else html+="<div style='vertical-align: middle; display: inline-block; font-size: 24px; line-height: 50px; height: 50px; margin-left: 5px; margin-right: 8px'>1 / "+(((1/(def[0]*mult))>=2)&&to_pretty_num(round(1/(def[0]*mult)))||to_pretty_float(1/(def[0]*mult)))+"</div>";
	html+="</div>";
	return html;
}

function smart_smart_move(type,id)
{
	if(type=="npc")
	{
		var npc=G.npcs[id];
		show_confirm("Smart move to "+npc.name+"?","Yes","Cancel",function(){ hide_modals(); call_code_function_f("smart_move",id); });
	}
	else if(type=="monster")
	{
		var m=G.monsters[id];
		show_confirm("Smart move to "+m.name+"'s?","Yes","Cancel",function(){ hide_modals(); call_code_function_f("smart_move",id); });
	}
	else if(type=="map")
	{
		var m=G.maps[id];
		show_confirm("Smart move to "+m.name+"?","Yes","Cancel",function(){ hide_modals(); call_code_function_f("smart_move",id); });
	}
}

function render_equip_info(name)
{
	var def=G.items[name],html="";
	html+="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 360px;' class='buyitem'>";
	html+="<div style='padding: 4px; margin: 4px; text-align: center; color: #CDCAB7'>"+(weapon_types[def.wtype]||offhand_types[def.type]||def.wtype||def.type).toTitleCase()+"</div>";
	["ranger","rogue","warrior","mage","priest","paladin","merchant"].forEach(function(ctype)
	{
		var color="#DDDDDD";
		if(window.character && character.ctype==ctype) color="#36813A";
		else if(window.character) color="#666870";
		if(G.classes[ctype].mainhand[def.wtype||def.type])
		{
			html+="<div style='border: 2px dotted gray; padding: 14px; margin: 4px'>";
				html+="<div style='color:"+color+"'>["+ctype.toTitleCase()+"] Mainhand</div>";
				var s=render_item("html",{item:{},prop:G.classes[ctype].mainhand[def.wtype||def.type],pure:true});
				if(!s) html+="<div style='color: #788783'>No Modifier</div>";
				else html+=s;
			html+="</div>";
		}
		if(G.classes[ctype].doublehand[def.wtype||def.type])
		{
			html+="<div style='border: 2px dotted gray; padding: 14px; margin: 4px'>";
				html+="<div style='color:"+color+"'>["+ctype.toTitleCase()+"] Doublehand</div>";
				var s=render_item("html",{item:{},prop:G.classes[ctype].doublehand[def.wtype||def.type],pure:true});
				if(!s) html+="<div style='color: #788783'>No Modifier</div>";
				else html+=s;
				html+="<div style='margin-bottom: 5px'></div>";
			html+="</div>";
		}
		if(G.classes[ctype].offhand[def.wtype||def.type])
		{
			html+="<div style='border: 2px dotted gray; padding: 14px; margin: 4px'>";
				html+="<div style='color:"+color+"'>["+ctype.toTitleCase()+"] Offhand</div>";
				var s=render_item("html",{item:{},prop:G.classes[ctype].offhand[def.wtype||def.type],pure:true});
				if(!s) html+="<div style='color: #788783'>No Modifier</div>";
				else html+=s;
				html+="<div style='margin-bottom: 5px'></div>";
			html+="</div>";
		}
	});
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true});
}

function render_item_help(container,name,level,pure)
{
	var html="",names=[name];
	html+="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 240px;' class='buyitem'>";
	for(var depth=0;depth<3;depth++)
	{
		for(var dname in G.drops)
		{
			if(in_arr(dname,names) || dname=="glitch" || dname=="lglitch") continue;
			var table=G.drops[dname];
			for(var i=0;i<table.length;i++)
			{
				if(in_arr(table[i][1],names))
				{
					names.push(dname);
				}
			}
		}
	}
	var npcs=[];
	for(var nname in G.npcs)
	{
		var done=false;
		(G.npcs[nname].items||[]).forEach(function(item){
			if(!done && item && item==name)
				done=true,npcs.push(nname);
		});
	}
	var monsters=[];
	for(var mname in G.drops.monsters)
	{
		var table=G.drops.monsters[mname];
		for(var i=0;i<table.length;i++)
		{
			if(table[i][1]==name || table[i][1]=="open" && in_arr(table[i][2],names))
			{
				monsters.push([mname,table[i][1]!="open"&&table[i][0]]);
				break;
			}
		}
	}
	var maps=[];
	for(var mname in G.drops.maps)
	{
		var table=G.drops.maps[mname];
		if(mname!="global" && (!G.maps[mname] || G.maps[mname].ignore)) continue;
		for(var i=0;i<table.length;i++)
		{
			if(table[i][1]==name || table[i][1]=="open" && in_arr(table[i][2],names))
			{
				maps.push(mname);
				break;
			}
		}
	}
	var items=[];
	for(var iname in G.items)
	{
		if(!G.items[iname].e) continue;
		var levels=[0],item=G.items[iname];
		if(item.upgrade || item.compound) levels=[0,1,2,3,4,5,6,7,8,9,10,11,12];
		for(var l=0;l<levels.length;l++)
		{
			var tname=iname;
			if(l) tname+=l;
			if(G.drops[tname])
			{
				var table=G.drops[tname];
				for(var i=0;i<table.length;i++)
				{
					if(table[i][1]==name) // || table[i][1]=="open" && in_arr(table[i][2],names)) # There was an objection to this and seems logical [18/07/22]
					{
						items.push([iname,l]);
						break;
					}
				}
			}
		}
	}
	var tokens=[];
	for(var tname in G.tokens)
	{
		for(var iname in G.tokens[tname])
			if(iname==name)
			{
				tokens.push(tname);
				break;
			}
	}
	var collecting=[],crafting=[];
	for(var iname in G.craft)
	{
		var done=false;
		G.craft[iname].items.forEach(function(ii){
			if(!done && ii[1]==name)
			{
				if(G.craft[iname].quest=="mcollector") collecting.push(iname);
				else crafting.push(iname);
				done=true;
			}
		})
	}
	if(npcs.length)
	{
		html+="<div style='color:#DDDDDD'>Buyable From:</div>";
		npcs.forEach(function(nname){
			var npc=G.npcs[nname];
			if(npc.ignore) return;
			html+="<div style='display:inline-block; text-align: center; margin-right: 5px' class='clickable' onclick='smart_smart_move(\"npc\",\""+nname+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
		});
	}
	if(G.items[name].type=="token")
	{
		html+="<div style='color:#DDDDDD'>Spend At:</div>";
		var npc={},npc_id=null;
		for(var nname in G.npcs)
			if(G.npcs[nname].token==name)
				npc=G.npcs[nname],npc_id=nname;
		html+="<div>";
			html+="<div style='display:inline-block; text-align: center; margin-right: 5px' class='clickable' onclick='smart_smart_move(\"npc\",\""+npc_id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
		html+="</div>";
	}
	if(tokens.length)
	{
		html+="<div style='color:#DDDDDD'>Acquirable From:</div>";
		tokens.forEach(function(token){
			var npc={},npc_id=null;
			for(var nname in G.npcs)
				if(G.npcs[nname].token==token)
					npc=G.npcs[nname],npc_id=nname;
			html+="<div>";
				html+="<div style='display:inline-block; text-align: center; margin-right: 5px' class='clickable' onclick='smart_smart_move(\"npc\",\""+npc_id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
				html+="<div style='display:inline-block; vertical-align: top; line-height: 50px'>with</div>";
				html+=item_container({skin:G.items[token].skin,onclick:"stpr(event); render_item_popup('"+token+"')"},{name:token});
			html+="</div>";
		});
	}
	if(G.items[name].e)
	{
		var npc=G.npcs.exchange,phrase="Exchange From",id="exchange";
		for(var nname in G.npcs)
			if(G.items[name].quest && G.npcs[nname].quest==G.items[name].quest) npc=G.npcs[nname],phrase="Bring To",id=nname;
		html+="<div style='color:#DDDDDD'>"+phrase+":</div>";
		html+="<div style='display:inline-block; text-align: center' class='clickable' onclick='smart_smart_move(\"npc\",\""+id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
		html+="<div style='color:#DDDDDD'>Drop Table:</div>";
		html+=item_container({skin:G.items[name].skin,onclick:"stpr(event); render_exchange_info('"+(name+((G.items[name].upgrade||G.items[name].compound)&&(level||"0")||""))+"')"},{name:name,level:(G.items[name].upgrade||G.items[name].compound)&&level});
	}
	if(G.items[name].upgrade || G.items[name].compound)
	{
		var npc=G.npcs.newupgrade,phrase="Upgrade At",id="newupgrade";
		if(G.items[name].compound) phrase="Combine 3 At";
		html+="<div style='color:#DDDDDD'>"+phrase+":</div>";
		html+="<div style='display:inline-block; text-align: center' class='clickable' onclick='smart_smart_move(\"npc\",\""+id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
		var phrase="Buy Scrolls From",npc=G.npcs.scrolls,id="scrolls";
		html+="<div style='color:#DDDDDD'>"+phrase+":</div>";
		html+="<div style='display:inline-block; text-align: center' class='clickable' onclick='smart_smart_move(\"npc\",\""+id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
	}
	if(crafting.length)
	{
		html+="<div style='color:#DDDDDD'>Used For Crafting:</div>";
		crafting.forEach(function(i){
			html+=item_container({skin:G.items[i].skin,onclick:"stpr(event); render_recipe(null,'','"+i+"')"},{name:i});
		});
	}
	if(collecting.length)
	{
		html+="<div style='color:#DDDDDD'>Collectable For:</div>";
		collecting.forEach(function(i){
			html+=item_container({skin:G.items[i].skin,onclick:"stpr(event); render_recipe(null,'mcollector','"+i+"')"},{name:i});
		});
	}
	if(G.craft[name])
	{
		var phrase="Craftable At",npc=G.npcs.craftsman,id="craftsman",rphrase="Recipe";
		if(G.craft[name].quest=="mcollector") phrase="Obtainable From",npc=G.npcs.mcollector,id="mcollector",rphrase="Materials";
		if(G.craft[name].quest=="witch") phrase="Concoctiable At",npc=G.npcs.witch,id="witch",rphrase="Materials";
		html+="<div style='color:#DDDDDD'>"+phrase+":</div>";
		html+="<div style='display:inline-block; text-align: center' class='clickable' onclick='smart_smart_move(\"npc\",\""+id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
		html+="<span class='clickable' onclick='stpr(event); show_recipe(\""+name+"\")'>"+bold_prop_line("Show",rphrase,"#6F75DC")+"</span>";
	}
	if(G.dismantle[name])
	{
		html+="<div style='color:#DDDDDD'>Dismantle At:</div>";
		var npc=G.npcs.craftsman,id="craftsman";
		html+="<div style='display:inline-block; text-align: center' class='clickable' onclick='smart_smart_move(\"npc\",\""+id+"\")'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
	}
	if(monsters.length)
	{
		html+="<div style='color:#DDDDDD'>Drops From:</div>";
		monsters.forEach(function(mo){
			var m=mo[0];
			html+="<div style='display:inline-block; text-align: center' class='clickable hspace5' onclick='smart_smart_move(\"monster\",\""+m+"\")'>";
				html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; display: inline-block; margin: 2px; /*"+m+"*/'>";
				html+=sprite(m,{scale:1.5});
				html+="</div>";
				if(mo[1]) html+="<div>"+to_pretty_fraction(mo[1])+"</div>";
				// html+="<div></div><div class='tinybutton' style='margin-top: -9px'>"+G.monsters[m].name+"</div>";
			html+="</div>";
		});
	}
	if(maps.length)
	{
		html+="<div style='color:#DDDDDD'>Global Drop At:</div>";
		maps.forEach(function(map){
			if(map=="global")
				html+="<div style='color:#DD3177' onclick='stpr(event); render_all_monsters()' class='clickable'>Everywhere</div>";
			else
				html+="<div style='color:#47A642' onclick='render_travel(\""+map+"\")' class='clickable'>"+G.maps[map].name+"</div>";
		});
	}
	if(items.length)
	{
		html+="<div style='color:#DDDDDD'>Obtainable From:</div>";
		items.forEach(function(i){
			html+=item_container({skin:G.items[i[0]].skin,onclick:"stpr(event); render_item_popup('"+i[0]+"',"+i[1]+")"},{name:i[0],level:i[1]});
		});
	}
	html+="<span class='clickable' onclick='stpr(event); show_json(G.items[\""+name+"\"],{prefix:\"G.items.\",name:\""+name+"\"})'>"+bold_prop_line("Show","G.items.<span style='color:"+colors.property+";'>"+name+"</span>",colors.inspect)+"</span>";
	html+="</div>";
	// $(container).parent().replaceWith(html);
	if(pure) return html;
	show_modal(html,{wrap:false,hideinbackground:true});
}

function render_item_popup(name,level)
{
	var html="";
	html+=render_item("html",{item:G.items[name],actual:{name:name,level:level},name:name});
	show_modal(html,{wrap:false,hideinbackground:true});
}

function render_item_info(name,level,data)
{
	var html="<div style='font-size: 24px; max-width: 800px; text-align: center' onclick='hide_modal()'>";
	if(name=="empty")
	{
		html+=render_item("html",{item:{name:"Empty",explanation:"Nothing, nada, zilch."},prop:{}});
	}
	else if(name=="shells")
	{
		html+=render_item("html",{item:{name:"Shells",explanation:"Premium currency, can be used to buy cosmetics, extra bank storage, or for account operations like transferring a character."},prop:{}});
	}
	else if(name=="gold")
	{
		html+=render_item("html",{item:{name:"Gold",explanation:"Just gold"},prop:{}});
	}
	else if(level!==undefined)
	{
		html+=render_item("html",{item:G.items[name],actual:{level:level,name:name,data:data},guide:true});
	}
	else if(G.items[name].compound)
	{
		for(var i=0;i<=15;i++)
		{
			html+="<div style='display: inline-block; margin: 5px'>"+render_item("html",{item:G.items[name],actual:{level:i,name:name},guide:true})+"</div>";
			if(calculate_item_grade(G.items[name],{level:i})==4) break;
		}
	}
	else if(G.items[name].upgrade)
	{
		for(var i=0;i<=15;i++)
		{
			html+="<div style='display: inline-block; margin: 5px'>"+render_item("html",{item:G.items[name],actual:{level:i,name:name},guide:true})+"</div>";
			if(calculate_item_grade(G.items[name],{level:i})==4) break;
		}
	}
	else
	{
		html+=render_item("html",{item:G.items[name],name:name,actual:{name:name},guide:true});
	}
	html+="<div></div><div style='display: inline-block; margin: 5px'>"+render_item_help(null,name,level,true)+"</div>";
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/items/"+name});
}

function render_monster_info(name)
{
	var html="<div style='font-size: 24px'>",parsed={},count=0,mcount=0,diff=0,mowner="";
	html+="<div class='clickable' onclick='smart_smart_move(\"monster\",\""+name+"\")'>"+sprite(name,{full:true,scale:3})+"</div>";
	var RF=Object.keys(tracker).length&&tracker||G&&G.drops||{monsters:{},maps:{}},MR=Object.keys(tracker).length&&tracker&&tracker.drops||RF.monsters;
	if(tracker && tracker.monsters)
	{
		count=tracker.monsters[name]||0;
		diff=tracker.monsters_diff[name]||0;
		if(tracker.max.monsters[name]) mcount=tracker.max.monsters[name][0],mowner=tracker.max.monsters[name][1];
	}
	html+=render_item("html",{pure:true,item:G.monsters[name],prop:G.monsters[name],monster:name,count:count,mcount:mcount,score:count+diff,mowner:mowner});
	if(MR && MR[name] && MR[name].length)
	{
		html+="<div style='margin-top: 6px; margin-bottom: 3px; color:#2A9A3D'>Drops:</div>";
		MR[name].forEach(function(drop){
			html+=render_drop(drop,1,"#858B8E");
		});
	}
	object_sort(G.maps).forEach(function(io){
		var map=io[1],mname=io[0];
		if(map.ignore || !(RF.maps&&RF.maps[mname]||[]).length) return;
		(map.monsters||[]).forEach(function(pack){
			if(parsed[mname]) return;
			if(pack.type==name)
			{
				parsed[mname]=true;
				html+="<div style='margin-top: 6px; margin-bottom: 3px; color:#929943'>"+map.name+":</div>";
				RF.maps[mname].forEach(function(drop){
					html+=render_drop(drop,G.monsters[name].hp/1000.0,"#858B8E");
				});
			}
		});
	});
	if(RF.maps && RF.maps.global_static && RF.maps.global_static.length || RF.maps && RF.maps.global && RF.maps.global.length)
	{
		var mult=1;
		if(G.monsters[name]["1hp"]) mult=1000;
		html+="<div style='margin-top: 6px; margin-bottom: 3px; color:#2A9A3D'>Global:</div>";
		RF.maps.global_static.forEach(function(drop){
			html+=render_drop(drop,1*mult,"#858B8E");
		});
		RF.maps.global.forEach(function(drop){
			html+=render_drop(drop,G.monsters[name].hp*mult/1000.0,"#858B8E");
		});
	}
	html+="</div>";
	show_modal(html,{wwidth:240,hideinbackground:true,url:"/docs/guide/all/monsters/"+name});
}

function render_exchange_info(name,count)
{
	var html="<div style='font-size: 24px'>";
	html+=render_drop([1,"open",name],1,"#858B8E");
	html+="</div>";
	show_modal(html,{wwidth:240,styles:'max-width: 460px',hideinbackground:true});
}

function render_tracker()
{
	var html="";
	html+="<div style='font-size: 32px'>";
		html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; display: inline-block; margin: 2px; padding: 6px;' class='clickable' onclick='pcs(event); $(\".trackers\").hide(); $(\".trackerm\").show();'>Monsters</div>";
		html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; display: inline-block; margin: 2px; padding: 6px;' class='clickable' onclick='pcs(event); $(\".trackers\").hide(); $(\".trackere\").show();'>Exchanges and Quests</div>";
	html+="</div>";
	html+="<div class='trackers trackerm'>";
	object_sort(G.monsters,"hpsort").forEach(function(e){
		if((e[1].stationary || e[1].cute) && !e[1].achievements || e[1].unlist) return;
		var count=(tracker.monsters[e[0]]||0)+(tracker.monsters_diff[e[0]]||0),color="#50ADDD";
		if(tracker.max.monsters[e[0]] && tracker.max.monsters[e[0]][0]>count)
		{
			count=tracker.max.monsters[e[0]][0];
			color="#DCC343";
		}
		html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; position: relative; display: inline-block; margin: 2px; /*"+e[0]+"*/' class='clickable' onclick='pcs(event); render_monster_info(\""+e[0]+"\")'>";
		html+=sprite(e[0],{scale:1.5});
		if(!count)
		{
			//html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; position: absolute; top: -2px; left: -2px; color:#FD8C3A; display: inline-block; padding: 1px 1px 1px 3px;'>?</div>";
		}
		else
		{
			html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; position: absolute; top: -2px; left: -2px; color:"+color+"; display: inline-block; padding: 1px 1px 1px 3px;'>"+to_shrinked_num(count)+"</div>";
		}
		if(tracker.drops && tracker.drops[e[0]] && tracker.drops[e[0]].length)
			html+="<div style='background-color:#FD79B0; border: 2px solid #9F9FB0; position: absolute; bottom: -2px; right: -2px; display: inline-block; padding: 1px 1px 1px 1px; height: 2px; width: 2px'></div>";
		html+="</div>";
	});
	html+="</div>";
	html+="<div class='trackers trackere hidden' style='margin-top: 3px'>";
	object_sort(G.items).forEach(function(e){
		if(e[1].e && !e[1].ignore)
		{
			var list=[[e[0],e[0],undefined]];
			if(e[1].upgrade || e[1].compound)
			{
				list=[];
				for(var i=0;i<13;i++)
					if(G.drops[e[0]+i]) list.push([e[0],e[0]+i,i]);
			}
			list.forEach(function(d){
				html+="<div style='margin-right: 3px; margin-bottom: 3px; display: inline-block; position: relative;'";
				if(G.drops[d[1]]) html+=" class='clickable' onclick='pcs(event); render_exchange_info(\""+d[1]+"\","+(tracker.exchanges[d[1]]||0)+")'>";
				else html+=">";
					html+=item_container({skin:G.items[d[0]].skin},{name:d[0],level:d[2]});
					if(tracker.exchanges[d[1]])
						html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; position: absolute; top: -2px; left: -2px; color:#ED901C; font-size: 16px; display: inline-block; padding: 1px 1px 1px 3px;'>"+to_shrinked_num(tracker.exchanges[d[1]])+"</div>";
				html+="</div>";
			});
		}
	});
	html+="</div>";
	show_modal(html,{wwidth:578,hideinbackground:true});
}

function render_computer($element)
{
	var html="";
	html+="<div style=\"color: #32A3B0\">CONNECTED.</div>";
	html+="<div onclick='render_upgrade_shrine()' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> UPGRADE</div>"; // style='color: #C3C3C3' style='color: #D6D6D6'
	html+="<div onclick='render_compound_shrine()' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> COMPOUND</div>";
	html+="<div onclick='render_exchange_shrine()' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> EXCHANGE</div>";
	html+="<div onclick='render_interaction({auto:true,dialog:\"locksmith\",skin:\"asoldier\"});' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> LOCKSMITH</div>";
	html+="<div onclick='render_interaction(\"crafting\");' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> CRAFTING</div>";
	html+="<div onclick='render_merchant(G.npcs.pots)' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> POTIONS</div>";
	html+="<div onclick='render_merchant(G.npcs.scrolls)' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> SCROLLS</div>";
	html+="<div onclick='render_merchant(G.npcs.basics)' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> BASICS</div>";

	html+="<div onclick='render_merchant(G.npcs.premium,false)' class='clickable' style='color: #E4E4E4'><span style='color: #BA61A4'>&gt;</span> PREMIUM</div>";

	$element.html(html);
}

function render_skill(selector,skill_name,args)
{
	if(!args) args={};
	var actual=args.actual||{},html="";
	var skill=G.skills[skill_name];
	html+="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 240px; "+(args.styles||"")+"'>"
	if(!skill) html+=skill_name;
	else
	{
		html+="<div style='color: #4EB7DE; display: inline-block; border-bottom: 2px dashed gray; margin-bottom: 3px' class='cbold'>"+skill.name+"</div>";
		if(skill.explanation)
		{
			html+="<div style='color: #C3C3C3'>"+skill.explanation+"</div>";
			if(skill.mp) html+=bold_prop_line("MP",skill.mp,colors.mp);
			if(skill.duration) html+=bold_prop_line("Duration",(skill.duration/1000.0)+" seconds","gray");
			if(skill.cooldown && (skill.cooldown/1000.0)) html+=bold_prop_line("Cooldown",(skill.cooldown/1000.0)+" seconds","gray");
			if(skill.reuse_cooldown && (skill.reuse_cooldown/1000.0)) html+=bold_prop_line("R.Use Cooldown",(skill.reuse_cooldown/1000.0)+" seconds","gray");
			if(skill.share) html+=bold_prop_line("Cooldown",to_pretty_float(skill.cooldown_multiplier||1)+"X of "+G.skills[skill.share].name,"gray");
			if(skill.range) html+=bold_prop_line("Range",skill.range,"gray");
			if(skill.use_range) html+=bold_prop_line("Range","Character Range","gray");
			if(skill.range_multiplier && skill.range_bonus) html+=bold_prop_line("Range",to_pretty_float(skill.range_multiplier||1)+"X + "+skill.range_bonus,"gray");
			else if(skill.range_multiplier) html+=bold_prop_line("Range",to_pretty_float(skill.range_multiplier||1)+"X of Character Range","gray");
			if(skill.level) html+=bold_prop_line("Level Requirement",skill.level,"gray");
			if(skill.max) html+=bold_prop_line("Max",skill.max,"gray");
			if(skill.type=="passive") html+="<div><span style='color: #696C68;'>Passive</span></div>";
			if(skill.damage_type)
			{
				if(skill.damage_type=="pure") html+=bold_prop_line("Damage Type","Pure","#AA9B55");
				else if(skill.damage_type=="magical") html+=bold_prop_line("Damage Type","Magical","#8998AA");
				else if(skill.damage_type=="physical") html+=bold_prop_line("Damage Type","Physical","#93AB98");
			}
			if(skill.condition && G.conditions[skill.condition])
			{
				html+=info_line({name:"Condition",color:"#A59FFF",value:G.conditions[skill.condition].name,onclick:"dialogs_target=xtarget||ctarget; show_json(G.conditions."+skill.condition+",{name:'G.conditions."+skill.condition+"'})"});
			}
			(skill.levels||[]).forEach(function(lv){
				var level=lv[0],value=lv[1];
				html+=bold_prop_line("Output",value+(level>0&&(" (Lv. "+level+")")),"gray");
			});
			for(var requirement in (skill.requirements||{}))
			{
				var amount=skill.requirements[requirement];
				html+=bold_prop_line("Required "+requirement.toTitleCase(),amount,"gray");
			}
			if(skill.consume)
			{
				html+="<div style='margin: 4px 0px 0px -2px;'>"+item_container({skin:G.items[skill.consume].skin,def:G.items[skill.consume]});+"</div>"
			}
			html+="<div class='clickable' onclick='show_json(G.skills."+skill_name+",{prefix:\"G.skills.\",name:\""+skill_name+"\"})'><span style='color: #44A8D4;'>Show:</span> <span style='color:gray'>G.skills.</span>"+skill_name+"</div>";
		}
	}
	html+="</div>";
	if(modal_count) show_modal(html,{wrap:false});
	else $(selector).html(html);
}

function render_computer_network(selector)
{
	var html="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 240px;' class='buyitem'><div class='computernx'></div></div>";
	$(selector).html(html);
	render_computer($(".computernx"));
}

function render_secondhands(type)
{
	reset_inventory(1);
	topleft_npc="secondhands";
	if(type) topleft_npc=type;
	rendered_target=topleft_npc; // merchant_id=npc.id;
	var last=0,collection=[],f="sh_click";
	var html="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block'>";
	var items=secondhands;
	if(type)
	{
		items=lostandfound;
		if(l_page>=1) last+=19+(l_page-1)*18;
		f="lf_click";
	}
	else
	{
		if(s_page>=1) last+=19+(s_page-1)*18;
	}
	for(var i=0;i<4;i++)
	{
		html+="<div>"
		for(var j=0;j<5;j++)
		{
			if(!type && i==3 && j==0 && s_page!=0) html+=item_container({skin:"left",onclick:"s_page="+(s_page-1)+"; render_secondhands();"},{q:s_page,left:true});
			else if(!type && i==3 && j==4 && last<items.length-1) html+=item_container({skin:"right",onclick:"s_page="+(s_page+1)+"; render_secondhands();"},{q:s_page+2});
			else if(type && i==3 && j==0 && l_page!=0) html+=item_container({skin:"left",onclick:"l_page="+(l_page-1)+"; render_secondhands('lostandfound');"},{q:l_page,left:true});
			else if(type && i==3 && j==4 && last<items.length-1) html+=item_container({skin:"right",onclick:"l_page="+(l_page+1)+"; render_secondhands('lostandfound');"},{q:l_page+2});
			else if(last<items.length && items[last++])
			{
				var current=items[last-1];
				var id='secondhand'+(last-1),item=G.items[current.name];
				html+=item_container({skin:item.skin,
				onclick:f+"("+(last-1)+")",
				def:item,id:id,draggable:false,droppable:false},current);
			}
			else
			{
				html+=item_container({size:40,draggable:false,droppable:false});
			}
		}
		html+="</div>";
	}
	html+="</div>";
	html+="<div id='merchant-item' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-left: 5px'>"+(next_side_interaction&&render_interaction(next_side_interaction,"return_html")||" ")+"</div>";
	next_side_interaction=null;
	$("#topleftcornerui").html(html);
}

function old_render_gallery()
{
	var html="";
	G.codes.forEach(function(section){
		html+="<div class='gamebutton'>"+(section.name||section.key)+"</div>";
	});
	html+="<div style='border: 4px gray solid;'>";
	G.codes[0].list.forEach(function(def){
		html+="<div onclick='api_call(\"load_gcode\",{file:\""+def[0]+"\"});'>"+def[1]+"</div>";
	});
	html+="</div>";
	show_modal(html);
}

function old_render_stepv1(args)
{
	if(!args) args={};
	args.title="[1/24] Move";
	args.main="Welcome to the first step of the tutorial. In this step, we are going to move! Now move your character near the green goo's by clicking on the map and walking below the town!";
	args.code="Using the CODE feature. You can use the `move` function, or, the more costly `smart_move` function.";
	var html="";
	if(args.title) html+="<div style='border: 5px solid #65A7E6; background-color: #E6E6E6; color: #333333; margin: 3px; padding: 5px; font-size: 24px; display: inline-block'>"+args.title+"</div>";
	if(args.main) html+="<div style='border: 5px solid gray; background-color: #E6E6E6; color: #333333; margin: 3px; padding: 5px; font-size: 24px;'>"+args.main+"</div>";
	if(args.code) html+="<div style='border: 5px solid #E4738A; background-color: #E6E6E6; color: #333333; margin: 3px; padding: 5px; font-size: 24px;'>"+args.code+"</div>";
	show_modal(html);

}

function load_documentation(name)
{
	if(in_arr(name,G.docs.documented)) api_call("load_article",{name:name,func:true});
	else if(name=="character") show_json(game_stringify(character,'\t'));
	else if(in_arr(name,G.docs.functions)) render_function_reference(name);
	else
	{
		$(".codesearch").val(name);
		csearch_logic("ui");
	}
}

function open_article(name,url)
{
	api_call("load_article",{name:name,url:url});
}

function open_guide(name,url)
{
	api_call("load_article",{name:name,guide:true,url:url});
}

function open_tutorial()
{
	api_call("load_article",{name:G.docs.tutorial[X.tutorial.step].key,tutorial:""+X.tutorial.step});
}

var last_rendered_step=0;
function render_tutorial(article,step,url)
{
	hide_modals(); last_rendered_step=step;
	var tutorial=G.docs.tutorial[step],cphrase="CONTINUE";
	if(step==G.docs.tutorial.length-1) cphrase="COMPLETE";

	var html="<div style='background: #E5E5E5; color: #010805; border: 5px solid gray; min-width: 640px; max-width: 960px; padding: 24px; font-size: 32px; text-align: justify'><div style='margin-top:-15px'></div>";
		html+="<div style='margin-bottom: 8px;'><span style='color:#2B9EC9'>"+tutorial.title+"</span> <div style='float:right; color: #585859; color: #906CB4'>["+(step+1)+"/"+G.docs.tutorial.length+"]</div></div>";
		html+="<div style='margin-left:-24px; margin-right: -24px; border-bottom: 5px solid gray'></div>";
		html+=article;
		html+="<div style='margin-left:-24px; margin-right: -24px; border-bottom: 5px solid gray'></div>";
		html+="<div style='margin-top: 8px; margin-bottom: -16px'><span style='color: #D67D23'>Completion: <span class='tutprogress'>"+0+"</span>%</span> <div style='float: right; color: gray' class='tutincomplete'>INCOMPLETE</div><div style='float: right; color: #73BD6D' class='clickable tutcontinue' onclick='btc(event); api_call(\"tutorial\",{step:"+(step+1)+"}); hide_modal()'>"+cphrase+"</div></div>";
	html+="</div>";
	
	show_modal(html,{wrap:false,url:url});
	update_tutorial_ui();
	$(".code").codemirror({trim:true});
	position_modals();
}

function render_learn_article(article,args)
{
	var html="<div style='background: #E5E5E5; color: #010805; border: 5px solid gray; min-width: 640px; max-width: 960px; padding: 24px; font-size: 32px; text-align: justify'><div style='margin-top:-15px'></div>";
		html+=article;
		html+="<div style='margin-bottom:-15px'></div>";
		if(args.prev) html+="<div class='gamebutton' style='position: absolute; top: -30px; left: -30px' onclick='hide_modal(); open_guide(\""+args.prev+"\",\"/docs/guide/"+args.prev+"\")'>&lt; Previous</div>";
		if(args.next) html+="<div class='gamebutton' style='position: absolute; bottom: -30px; right: -20px' onclick='hide_modal(); open_guide(\""+args.next+"\",\"/docs/guide/"+args.next+"\")'>Next &gt;</div>";
	html+="</div>";
	show_modal(html,{wrap:false,url:args&&args.url});
	$(".code").codemirror({trim:true});
	position_modals();
}

var render_function_html="";
function render_function_reference(n,f,c)
{
	// hide_modal();
	if(n=="character") return show_json(game_stringify(character,'\t'));
	if(!c)
	{
		code_eval("parent.render_function_reference(\""+n+"\",window['"+n+"'],1);");
		return;
	}
	if(!f && !window[n])
	{
		render_function_html="";
		return add_log('Reference not found','gray');
	}
	else if(!f) f=window[n];
	var html="",rid=randomStr(10);
	if(render_function_html)
	{
		render_learn_article(render_function_html+"<textarea class='codemirror"+rid+"'></textarea>",{url:"/docs/code/functions/"+n});
		$(".codemirror"+rid).codemirror({value:"//Source code of: "+n+"\n"+f.toString(),hints:true});
		render_function_html="";
	}
	else
	{
		html+="<textarea class='codemirror"+rid+"'></textarea>";
		show_modal(html,{wwidth:min($(window).width()-60,1200),url:"/docs/code/functions/"+n});
		$(".codemirror"+rid).codemirror({value:"//Source code of: "+n+"\n"+f.toString(),hints:true});
		position_modals();
	}
}

function render_functions_directory()
{
	// hide_modal();
	var html="<div style='background-color: black; border: 5px solid gray; padding: 24px; min-width: 272px'>";
	G.docs.functions.forEach(function(n){
		if(in_arr(n,G.docs.documented))
			html+="<div style='display: block; margin-bottom: 4px; font-size: 32px' class='clickable' onclick='api_call(\"load_article\",{name:\""+n+"\",func:true});'>"+n+"</div>";
		else
			html+="<div style='display: block; margin-bottom: 4px; font-size: 32px' class='clickable' onclick='render_function_reference(\""+n+"\")'>"+n+"</div>";
	});
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/code/functions"});
}

function render_all_recipes()
{
	var html="<div style='border: 5px solid gray; background-color: black; padding: 10px; width: 734px; font-size: 32px'>";
	// html+="<div style='padding: 10px; color: #CC863B; text-align: center'>Work in Progress</div>";
	var xprev=false;
	object_sort(G.craft,"gold_value").forEach(function(r)
	{
		if(xprev) html+="<div style='border-top: 4px solid gray; margin-left: -12px; margin-right: -12px'></div>";
		var prev=false,name=r[0],recipe=r[1];
		html+="<div style='line-height: 50px; vertical-align: middle; padding: 12px'>";
		html+=item_container({skin:G.items[name].skin,onclick:"render_item_info('"+name+"')"},{name:name});
		html+=" <span style='color: #00DE51'>&lt;=</span> ";
		recipe.items.forEach(function(i){
			if(prev) html+=" <span style='color: gray'>+</span> ";
			html+=item_container({skin:G.items[i[1]].skin,onclick:"render_item_info('"+i[1]+"')"},{name:i[1],q:i[0],level:i[2]});
			prev=true;
		});
		if(recipe.cost) html+=" <span style='color: gray'>+</span> <span style='color: gold'>"+to_pretty_num(recipe.cost)+"</span>";
		html+="</div>";
		xprev=true;
	});
	object_sort(G.dismantle,"gold_value").forEach(function(r)
	{
		if(xprev) html+="<div style='border-top: 4px solid gray; margin-left: -12px; margin-right: -12px'></div>";
		var prev=false,name=r[0],recipe=r[1];
		html+="<div style='line-height: 50px; vertical-align: middle; padding: 12px'>";
		html+=item_container({skin:G.items[name].skin,onclick:"render_item_info('"+name+"')"},{name:name});
		html+=" <span style='color: #E73900'>=&gt;</span> ";
		recipe.items.forEach(function(i){
			if(prev) html+=" <span style='color: gray'>+</span> ";
			html+=item_container({skin:G.items[i[1]].skin,onclick:"render_item_info('"+i[1]+"')"},{name:i[1],q:i[0],level:i[2]});
			prev=true;
		});
		if(recipe.cost) html+=" <span style='color: gray'>-</span> <span style='color: gold'>"+to_pretty_num(recipe.cost)+"</span>";
		html+="</div>";
		xprev=true;
	});
	html+="</div>"
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/recipes"});
}

function show_recipe(name)
{
	var html="<div style='font-size: 24px'>";
	var prev=false,recipe=G.craft[name];
		html+="<div style='line-height: 50px; vertical-align: middle; padding: 12px'>";
		html+=item_container({skin:G.items[name].skin,onclick:"render_item_info('"+name+"')"},{name:name});
		html+=" <span style='color: #00DE51'>&lt;=</span> ";
		recipe.items.forEach(function(i){
			if(prev) html+=" <span style='color: gray'>+</span> ";
			html+=item_container({skin:G.items[i[1]].skin,onclick:"render_item_info('"+i[1]+"')"},{name:i[1],q:i[0],level:i[2]});
			prev=true;
		});
		if(recipe.cost) html+=" <span style='color: gray'>+</span> <span style='color: gold'>"+to_pretty_num(recipe.cost)+"</span>";
		html+="</div>";
	html+="</div>";
	show_modal(html,{hideinbackground:true});
}

function render_cx_info(name)
{
	var html="<div style='border: 5px solid gray; background-color: black; padding: 10px;'>";
	html+="<div style='float:left; margin-right: 10px'>"+cx_sprite(name,{mleft:4})+"</div>";
	html+=" <span class='gray'>ID:</span> "+name+"<br /><span class='gray'>Type:</span> "+T[name]+" <br /><span class='gray'>Slot:</span> "+cxtype_to_slot[T[name]];
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/cosmetics"});
}

function render_all_cosmetics()
{
	precompute_image_positions();
	var types=[
		["hair","Hairs",[]],
		["hat","Hats",[]],
		["chin","Chins",[]],
		["face","Accents",[]],
		["head","Skins",[]],
		["armor","Armors",[]],
		["body","Bodies",[]],
		["character","Characters",[]],
		["back","Back",[]],
		["gravestone","Gravestones",[]],
		["","Others",[]],
	];
	var visited={},html="<div style='border: 5px solid gray; background-color: black; padding: 10px; width: 456px'>";
	object_sort(T).forEach(function(ti){
		var val=ti[1],cid=ti[0];
		for(var i=0;i<types.length;i++)
		{
			if(!types[i][0] || val==types[i][0] || types[i][0]=="chin" && ["beard","mask"].includes(val) || types[i][0]=="hat" && ["hat","a_hat"].includes(val) || types[i][0]=="face" && ["face","makeup","a_makeup"].includes(val) || types[i][0]=="back" && ["s_wings","tail"].includes(val))
			{
				types[i][2].push(cid);
				break;
			}
		}
	});
	types.forEach(function(type){
		html+="<div class='gamebutton gamebutton-small' style='margin-bottom: 5px'>"+type[1]+"</div>";
		html+="<div style='margin-bottom: 10px'>";
			type[2].forEach(function(cid){
				html+="<span class='clickable' onclick='render_cx_info(\""+cid+"\")'>"+cx_sprite(cid,{mright:4,labels:true})+"</span>";
			});
		html+="</div>";
	});
	html+="</div>"
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/cosmetics"});
}

function render_all_items()
{
	var types=[
		["helmet","Helmets",[]],
		["chest","Armors",[]],
		["pants","Underarmors",[]],
		["gloves","Gloves",[]],
		["shoes","Shoes",[]],
		["cape","Capes",[]],
		["ring","Rings",[]],
		["earring","Earrings",[]],
		["amulet","Amulets",[]],
		["belt","Belts",[]],
		["orb","Orbs",[]],
		["weapon","Weapons",[]],
		["shield","Shields",[]],
		["offhand","Offhands",[]],
		["elixir","Elixirs",[]],
		["pot","Potions",[]],
		["scroll","Scrolls",[]],
		["material","Crafting and Collecting",[]],
		["exchange","Exchangeables",[]],
		["key","Keys",[]],
		["","Others",[]],
	];
	var visited={},html="<div style='border: 5px solid gray; background-color: black; padding: 10px; width: 434px'>";
	object_sort(G.items,"gold_value").forEach(function(item){
		if(item[1].ignore) return;
		for(var i=0;i<types.length;i++)
		{
			if(!types[i][0] || item[1].type==types[i][0] || types[i][0]=="offhand" && in_arr(item[1].type,["source","quiver","misc_offhand"]) || types[i][0]=="scroll" && in_arr(item[1].type,["cscroll","uscroll","pscroll","offering"]) || types[i][0]=="exchange" && G.items[item[0]].e || types[i][0]=="key" && item[1].type.indexOf("key")!=-1)
			{
				types[i][2].push(item);
				break;
			}
		}
	});
	types.forEach(function(type){
		html+="<div class='gamebutton gamebutton-small' style='margin-bottom: 5px'>"+type[1]+"</div>";
		html+="<div style='margin-bottom: 10px'>";
			type[2].forEach(function(item){
				html+=item_container({skin:G.items[item[0]].skin,onclick:"render_item_info('"+item[0]+"')"},{name:item[0]});
			});
		html+="</div>";
	});
	html+="</div>"
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/items"});
}

function render_all_monsters()
{
	var html="";
	html+="<div style='width: 480px'>";
	object_sort(G.monsters,"hpsort").forEach(function(e){
		if((e[1].stationary || e[1].cute) && !e[1].achievements || e[1].hide) return;
		html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; position: relative; display: inline-block; margin: 2px; /*"+e[0]+"*/' class='clickable' onclick='pcs(event); render_monster_info(\""+e[0]+"\")'>";
		html+=sprite(e[0],{scale:1.5});
		if(G.drops && G.drops.monsters && G.drops.monsters[e[0]] && G.drops.monsters[e[0]].length)
			html+="<div style='background-color:#FD79B0; border: 2px solid #9F9FB0; position: absolute; bottom: -2px; right: -2px; display: inline-block; padding: 1px 1px 1px 1px; height: 2px; width: 2px'></div>";
		html+="</div>";
	});
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/monsters"});
}

function render_all_events()
{
	function event_html(e,key)
	{
		var ehtml="";
		ehtml+=" <div class='gamebutton mb5' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='pcs(event); open_guide(\"event-"+key+"\",\"/docs/ref/event-"+key+"\")'>";
		ehtml+=sprite(e.sprite,{overflow:true});
		ehtml+="<div style='color:"+e.color+"; margin-top: 1px'>"+e.name+"</div>";
		ehtml+="</div>";
		return ehtml;
	}
	var html="";
	html+="<div style='width: 480px; text-align: center'>";
		html+="<div class='block gamebutton gamebutton-small mb5'>Daily Events</div>";
			object_sort(G.events).forEach(function(e){
				if(e[1].type=="daily")
					html+=event_html(e[1],e[0]);
			});
		html+="<div class='block gamebutton gamebutton-small mb5'>Nightly Events</div>";
			object_sort(G.events).forEach(function(e){
				if(e[1].type=="nightly")
					html+=event_html(e[1],e[0]);
			});
		// html+="<div class='block gamebutton gamebutton-small mb5'>Random Events</div>";
		// 	object_sort(G.events).forEach(function(e){
		// 		if(e[1].type=="random")
		// 			html+=event_html(e[1],e[0]);
		// 	});
		html+="<div class='block gamebutton gamebutton-small mb5'>Seasonal Events</div>";
			object_sort(G.events).forEach(function(e){
				if(e[1].type=="seasonal")
					html+=event_html(e[1],e[0]);
			});
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/events"});
}

function render_guide(path,title,color)
{
	var more=false,ref=false,suffix="";
	docs=G.docs.guide;
	if(!path || is_string(path))
	{
		path=[],more=true,ref=true;
	}
	else
	{
		path.forEach(function(step){
			for(var i=0;i<docs.length;i++)
				if(docs[i][0]==step)
				{
					docs=docs[i][4];
					break;
				}
			suffix+="/"+step;
		});
	}
	// hide_modal();
	var html="<div style='/*background-color: black; border: 5px solid gray; padding: 4px; */ width: 360px; text-align: center'>";
	var index=0;
	if(ref)
	{
		html+="<div style='margin-bottom: 4px; height: 56px'>";
			html+="<div class='gamebutton' style='background-color: #E5E5E5; color: #010805; float: left; width: 145px' onclick='render_all_items()'><span style='color: #328355'>[I]</span> All Items</div>";
			html+="<div class='gamebutton' style='background-color: #E5E5E5; color: #010805; float: right; width: 145px' onclick='render_all_monsters()'><span style='color: #7F2D2A'>[M]</span> All Monsters</div>";
		html+="</div>";
		html+="<div style='margin-bottom: 4px; height: 56px'>";
			html+="<div class='gamebutton' style='background-color: #E5E5E5; color: #010805; float: left; width: 145px' onclick='render_all_skills_and_conditions()'><span style='color: #2A98AD'>[S]</span> All Skills &amp; C.</div>";
			html+="<div class='gamebutton' style='background-color: #E5E5E5; color: #010805; float: right; width: 145px' onclick='render_all_recipes()'><span style='color: #ED8131'>[C]</span> All Recipes</div>";
		html+="</div>";
	}
	if(title)
	{
		html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; background-color: #E5E5E5; color: #010805;'><span style='color: "+color+"'>["+title[0]+"]</span> "+title+"</div>";
	}
	docs.forEach(function(n){
		if(n[4])
		{
			path.push(n[0]);
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='render_guide("+JSON.stringify(path).replace_all("'",'"')+",\""+n[1]+"\",\""+n[3]+"\")'><span style='color: "+n[3]+"'>["+n[1][0]+"]</span> "+n[1]+" <span style='color: #96979E'>["+n[4].length+"]</span></div>";
			path.pop();
		}
		else
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='open_guide(\""+n[0]+"\",\"/docs/guide"+suffix+"/"+n[0]+"\")'><span style='color: "+n[3]+"'>["+n[1][0]+"]</span> "+n[1]+"</div>";
		index++;
	});
	if(ref && inside!="docs")
	{
			// html+="<div class='gamebutton' style='background-color: #E5E5E5; color: #010805; float: left; width: 145px' onclick='hide_modal(); render_code_articles()'><span style='color: #4FB7E5'>[C]</span> Code Guide</div>";
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; background-color: #E5E5E5; color: #010805;' onclick='hide_modal(); render_code_docs()'><span style='color: #D8C14F'>[X]</span> Code Docs</div>";
	}
	if(more) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; color: #85C76B'>Guide is a Work in Progress!</div>";
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide"+suffix});
}

function render_code_articles(path,title,color)
{
	var more=false,suffix="";
	docs=G.docs.articles;
	if(!path) path=[],more=true;
	else
	{
		path.forEach(function(step){
			for(var i=0;i<docs.length;i++)
				if(docs[i][0]==step)
				{
					docs=docs[i][3];
					break;
				}
			suffix+="/"+step;
		});
	}
	// hide_modal();
	var html="<div style='/*background-color: black; border: 5px solid gray; padding: 4px; */min-width: 320px; text-align: center'>";
	var index=0;
	if(title)
	{
		html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; background-color: #E5E5E5; color: #010805;'><span style='color: "+color+"'>["+title[0]+"]</span> "+title+"</div>";
	}
	docs.forEach(function(n){
		if(n[3])
		{
			path.push(n[0]);
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='render_code_articles("+JSON.stringify(path).replace_all("'",'"')+",\""+n[1]+"\",\""+n[2]+"\")'><span style='color: "+n[2]+"'>["+n[1][0]+"]</span> "+n[1]+" <span style='color: #96979E'>["+n[3].length+"]</span></div>";
			path.pop();
		}
		else
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='open_article(\""+n[0]+"\",\"/docs/code/learn"+suffix+"/"+n[0]+"\")'><span style='color: "+n[2]+"'>["+n[1][0]+"]</span> "+n[1]+"</div>";
		index++;
	});
	if(more) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; color: #85C76B'>More Articles Coming Soon!</div>";
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/code/learn"+suffix});
}

function render_objects_reference(docs)
{
	// hide_modal();
	var html="<div style='/*background-color: black; border: 5px solid gray; padding: 4px; */min-width: 320px'>";
	var index=0;
	G.docs.objects.forEach(function(n){
		html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='open_article(\""+n[0]+"\")'>"+n[1]+"</div>";
		index++;
	});
	html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; color: #85C76B'>Work in Progress</div>";
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true});
}

function render_useful_links()
{
	// hide_modal();
	var html="<div style='/*background-color: black; border: 5px solid gray; padding: 4px; */width: 400px'>";
		html+="<a class='gamebutton eexternal' style='display: block; margin-bottom: 4px; border-color: #4B95B2' target='_blank' href='https://jsconsole.com'>JSConsole.com</a>";
		html+='<div class="mt4 blockbutton" style="text-align: left; margin-bottom: 4px">A very practical website to play with Javascript in a Console.</div>';
		html+="<a class='gamebutton eexternal' style='display: block; margin-bottom: 4px; border-color: #4B95B2' target='_blank' href='https://www.codecademy.com/learn/learn-javascript'>Code Academy: Javascript</a>";
		html+='<div class="mt4 blockbutton" style="text-align: left; margin-bottom: 4px">Code Academy\'s Javascript course - If you want to learn Javascript properly first, Code Academy\'s refined course will hopefully be more helpful :]</div>';
		html+="<a class='gamebutton eexternal' style='display: block; margin-bottom: 4px; border-color: #4B95B2' target='_blank' href='https://github.com/kaansoral/adventureland/blob/master/runner_functions.js'>Adventure Land's Github</a>";
		html+='<div class="mt4 blockbutton" style="text-align: left; margin-bottom: 4px">#TODO: Create a gallery of player\'s Github repos</div>';
		html+="<a class='gamebutton eexternal' style='display: block; margin-bottom: 4px; border-color: #4B95B2' target='_blank' href='https://discord.gg/X3QyCJd'>#code_beginner on Discord</a>";

	html+="</div>";
	show_modal(html,{wrap:false,url:"/docs/code/links"});
}

function render_data_reference(path,id)
{
	// if(!id) hide_modal();
	if(!id) path=[];
	else path.push(id);
	var data=G,str="G",suffix="";
	path.forEach(function(p){
		data=data[p];
		str=str+"."+p;
		if(!suffix) suffix+="/"+p;
	});
	if(is_object(data) && path.length<2 && !in_arr(id,["levels"]))
	{
		// var html="<div style='/*background-color: black; border: 5px solid gray; padding: 6px;*/ min-width: 320px'>";
		var html="<div style='background-color: black; border: 5px solid gray; padding: 24px; min-width: 272px'>";
		object_sort(data).forEach(function(nd){
			var n=nd[0];
			// html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='render_data_reference("+JSON.stringify(path)+",\""+n+"\")'>"+str+"."+n+"</div>";
			html+="<div style='display: block; margin-bottom: 4px; font-size: 32px' class='clickable' onclick='render_data_reference("+JSON.stringify(path)+",\""+n+"\")'>"+str+"."+n+"</div>";
		});
		html+="</div>";
		show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/code/data"+suffix});
	}
	else
	{
		show_json(game_stringify_simple(data,'\t'));
	}
}

var csearch_value=undefined,codesearch_value=undefined;
function csearch_logic(place)
{
	var value="",one=false;
	if(place=="ui")
	{
		value=$('.codesearch').val();
		if(value==codesearch_value) return;
		codesearch_value=value;
	}
	else
	{
		value=$('.csearchi').val()
		if(value==csearch_value) return;
		csearch_value=value;
	}
	if(value.length || place=="ui")
	{
		var html="";
		if(place=="ui")
		{

		}
		else
		{
			$('.cdocsbuttons').hide();
			$('.cdocssearch').show();
		}
		G.docs.references.forEach(function(ref){
			if(ref[2].search(value)!==-1 || place=="ui" && !value)
			{
				one=true;
				if(!place) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; text-align: left' onclick='open_guide(\""+ref[0]+"\",\"/docs/guide/"+ref[0]+"\")'><span style='color:#69BE86'>[REFERENCE]</span> "+ref[1]+"</div>";
				else html+="<div class='clickable' onclick='open_guide(\""+ref[0]+"\",\"/docs/guide/"+ref[0]+"\")'><span style='color:#69BE86'>[R]</span> "+ref[1]+"</div>";
			}
		});
		var articles=[];
		function parse_articles(article)
		{
			if(is_array(article[0]))
			{
				article.forEach(function(a){
					parse_articles(a);
				});
			}
			else
			{
				if(!article[4]) articles.push(article);
				else parse_articles(article[4]);
			}
		}
		parse_articles(G.docs.guide);
		// console.log(articles);
		articles.forEach(function(article){
			if(!article[2]) return;
			if(article[2].search(value)!==-1 || place=="ui" && !value)
			{
				one=true;
				if(!place) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; text-align: left' onclick='open_guide(\""+article[0]+"\",\"/docs/guide/"+article[0]+"\")'><span style='color:#E78E4E'>[ARTICLE]</span> "+article[1]+"</div>";
				else html+="<div class='clickable' onclick='open_guide(\""+article[0]+"\",\"/docs/guide/"+article[0]+"\")'><span style='color:#E78E4E'>[A]</span> "+article[1]+"</div>";
			}
		});
		G.docs.javascript.forEach(function(ref){
			if(ref[1].search(value)!==-1 || place=="ui" && !value)
			{
				one=true;
				if(!place) html+="<div><a class='gamebutton eexternal' style='display: block; margin-bottom: 4px; text-align: left' href='"+ref[2]+"' target='_blank'><span style='color:#A6B7C9'>[MDN]</span> "+ref[0]+"</a></div>";
				else html+="<div><a class='cancela eexternal' href='"+ref[2]+"' target='_blank'><span style='color:#A6B7C9'>[J]</span> "+ref[0]+"</a></div>";
			}
		});
		for(var name in G)
		{
			if(name.search(value)!==-1 || value=="[G]" || place=="ui" && !value)
			{
				one=true;
				if(!place) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; text-align: left' onclick='render_data_reference([],\""+name+"\")'><span style='color:#8468BB'>[GAMEDATA]</span> G."+name+"</div>";
				else html+="<div class='clickable' onclick='render_data_reference([],\""+name+"\")'><span style='color:#8468BB'>[G]</span> G."+name+"</div>";
			}
		}
		G.docs.functions.forEach(function(n){
			if(n.search(value)==-1 && value!="[F]" && !(place=="ui" && !value)) return;
			if(in_arr(n,G.docs.documented))
			{
				if(!place) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; text-align: left' onclick='api_call(\"load_article\",{name:\""+n+"\",func:true});'><span style='color:#d6d135'>[FUNCTION]</span> "+n+"</div>";
				else html+="<div class='clickable' onclick='api_call(\"load_article\",{name:\""+n+"\",func:true});'><span style='color:#d6d135'>[F]</span> "+n+"</div>";
			}
			else
			{
				if(!place) html+="<div class='gamebutton' style='display: block; margin-bottom: 4px; text-align: left' onclick='render_function_reference(\""+n+"\")'><span style='color:#d6d135'>[FUNCTION]</span> "+n+"</div>";
				else html+="<div class='clickable' onclick='render_function_reference(\""+n+"\")'><span style='color:#d6d135'>[F]</span> "+n+"</div>";
			}
			one=true;
		});
		if(!one && !place)
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px'><span style='color:#575455'>[NONE FOUND]</span></div>";
		else if(!one)
			html+="<div style='color:#575455'>[NONE FOUND]</div>";
		if(place=="ui")
		{
			last_hint=undefined;
			$('#codehint').remove()
			$('#codelog').html(html);
		}
		else $('.cdocssearch').html(html);
	}
	else
	{
		$('.cdocsbuttons').show();
		$('.cdocssearch').hide();
		position_modals();
	}
}

function render_code_docs()
{
	csearch_value=undefined;
	var html="<div style='width:400px'>";
		//html+="<div class='gamebutton' style='display: block; border-color: #EDF259; margin-bottom: 4px' onclick='render_code_articles()'>Learn [Basic to Advanced]</div>";
		html+="<div class='gamebutton' style='display: block; /*border-color: #A79674;*/ margin-bottom: 4px'><span style='color:#37DBC1'>[SEARCH]</span> <input type='text' class='csearchi' style='font-family:Pixel; font-size:24px; margin-bottom: -8px; width: 150px; margin-left: 5px'></div>";
		html+="<div class='cdocssearch hidden'>";
		html+="</div>";
		html+="<div class='cdocsbuttons'>"
			html+="<div class='gamebutton' style='display: block; /*border-color: #A79674;*/ margin-bottom: 4px' onclick='pcs(); $(\".csearchi\").val(\"[F]\"); csearch_logic();/*render_functions_directory()*/'><span style='color:#B7BE45'>[F]</span> Available Functions</div>";
			html+="<div class='gamebutton' style='display: block; /*border-color: #0AAFF1;*/ margin-bottom: 4px' onclick='pcs(); $(\".csearchi\").val(\"[G]\"); csearch_logic();/*render_data_reference()*/'><span style='color:#8468BB'>[G]</span> Game Data</div>";
			// html+="<div class='gamebutton' style='display: block; /*border-color: #EF688C;*/ margin-bottom: 4px' onclick='pcs(); render_objects_reference()'>Objects Reference <span style='color:#64B454'>[WIP]</span></div>";
			html+="<div class='gamebutton' style='display: block; /*border-color: #EF688C;*/ margin-bottom: 4px' onclick='pcs(); open_article(\"data-character\",\"/docs/code/character/reference\")'><span style='color:#64B454'>[C]</span> Character Reference</div>";
			html+="<div class='gamebutton' style='display: block; /*border-color: #EF688C;*/ margin-bottom: 4px' onclick='pcs(); open_article(\"data-monster\",\"/docs/code/monster/reference\")'><span style='color:#58A1B0'>[M]</span> Monster Reference</div>";
			//html+="<div class='gamebutton' style='display: block; /*border-color: #F0924A;*/ margin-bottom: 4px' onclick='pcs(); add_log(\"Coming soon!\")'>Javascript Events <span style='color:gray'>[Soon]</span></div>";
			html+="<div class='gamebutton' style='display: block; /*border-color: #F0924A;*/ margin-bottom: 4px' onclick='pcs(); open_article(\"events-game\",\"/docs/code/game/events\")'><span style='color:#8468BB'>[E]</span> Game Events</div>";
			html+="<div class='gamebutton' style='display: block; /*border-color: #F0924A;*/ margin-bottom: 4px' onclick='pcs(); open_article(\"events-character\",\"/docs/code/character/events\")'><span style='color:#E36B1A'>[C]</span> Character Events</div>";
			html+="<div class='gamebutton' style='display: block; /*border-color: #A5A5A5;*/ margin-bottom: 4px' onclick='pcs(); render_useful_links()'><span style='color:#B9495B'>[U]</span> Useful Links</div>";
			html+='<div class="mt4 blockbutton" style="text-align: left">Note: CODE Documentation is a work in progress. You can use Discord/#feedback for ideas/requests.</div>';
		html+="</div>"
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/code"});
	$('.csearchi').bind("propertychange change click keyup input paste", function(event){ csearch_logic(); });
}

function render_others()
{
	var html="<div style='width:400px'>";
		//html+="<div class='gamebutton' style='display: block; border-color: #EDF259; margin-bottom: 4px' onclick='render_code_articles()'>Learn [Basic to Advanced]</div>";
		html+="<div>"
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='pcs(); show_modal($(\"#keymapguide\").html(),{url:\"/docs/ref/keymapping\"})'><span style='color:#F96527'>[S]</span> Skillbar and Keymapping</div>";
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='pcs(); show_modal($(\"#boosterguide\").html(),{url:\"/docs/ref/boosters\"})'><span style='color:#52B3FC'>[B]</span> Using Boosters</div>";
			html+="<div class='gamebutton' style='display: block; margin-bottom: 4px' onclick='pcs(); show_modal($(\"#shellsinfo\").html(),{url:\"/docs/ref/shells\"})'><span style='color:#47BA4E'>[$]</span> About Shells</div>";
		html+="</div>"
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/ref"});
}

function render_wishlist(num,page)
{
	var html="<div style='background-color: black; border: 5px solid gray; padding: 12px 20px 20px 20px; font-size: 24px; display: inline-block'>";
	html+="<div style='color: #f1c054; border-bottom: 2px dashed #C7CACA; margin-bottom: 3px; margin-left: 3px; margin-right: 3px' class='cbold'>Wishlist</div>";
	var items=[],last=0;
	for(var name in G.items)
		if(!G.items[name].ignore) items.push([name,G.items[name],G.items[name].g||0]);
	items.sort(function(a,b){return b[2]-a[2];});
	if(page>=1) last+=19+(page-1)*18;
	for(var i=0;i<4;i++)
	{
		html+="<div>"
		for(var j=0;j<5;j++)
		{
			if(i==3 && j==0 && page!=0) html+=item_container({skin:"left",onclick:"render_wishlist("+num+","+(page-1)+");"},{q:page,left:true});
			else if(i==3 && j==4 && last<items.length-1) html+=item_container({skin:"right",onclick:"render_wishlist("+num+","+(page+1)+");"},{q:page+2,left:true});
			else if(last<items.length && items[last++])
			{
				var id='wishlist'+(last-1),item=items[last-1][1],name=items[last-1][0];
				html+=item_container({skin:item.skin,
				onclick:"wishlist_item_click('"+name+"',"+num+")",
				def:item,id:id,draggable:false,droppable:false},null);
			}
			else
			{
				html+=item_container({size:40,draggable:false,droppable:false});
			}
		}
		html+="</div>";
	}
	html+="</div>";
	$("#topleftcornerdialog").html(html);
	dialogs_target=character;
}

var last_selector="";
function render_item(selector,args)
{
	if(args && args.actual) args.name=args.actual.name;
	var item=args.item||{"skin":"test","name":"Unrecognized Item","explanation":"Hmm. Curious."},name=args.name,color="gray",value=args.value,cash=args.cash,item_name=item.name,trade_item=false;
	var actual=args&&args.actual;
	if(selector && selector!="html") last_selector=selector; else if(selector!="html") selector=last_selector;
	var prop=args.prop||calculate_item_properties(actual||{},{def:item,'class':window.character&&character.ctype,'map':window.character&&character.map}),grade=calculate_item_grade(item,actual||{});
	var html="";
	if(!args.pure) html+="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 240px; "+(args.styles||"")+"' class='buyitem'>";
	if(!item) html+="ITEM";
	else
	{
		if(item.type=="tarot" && item.minor) html+="<img style='display: inline-block; margin: -8px 2px -6px -8px;' src='/images/cards/tarot/minor_arcana/tarot__"+item.minor+".png' />";
		else if(item.type=="tarot")  html+="<img style='display: inline-block; margin: -8px 2px -6px -8px;' src='/images/cards/tarot/major_arcana/tarot__"+item.major+".png' />";
		color="#E4E4E4"; // previously gray [16/08/16]
		if(item.grade=="mid") color="blue"; // lol - must be old [13/04/20]
		if(actual && actual.p && G.titles[actual.p]) item_name=G.titles[actual.p].title+" "+item_name;
		else if(actual && actual.p) item_name=actual.p.toTitleCase()+" "+item_name;
		if(prop.level)
		{
			if(item.upgrade && prop.level==12) item_name+=" +Z";
			else if(item.upgrade && prop.level==11) item_name+=" +Y";
			else if(item.upgrade && prop.level==10) item_name+=" +X";
			else if(item.compound && prop.level==7) item_name+=" +R";
			else if(item.compound && prop.level==6) item_name+=" +S";
			else if(item.compound && prop.level==5) item_name+=" +V";
			else item_name+=" +"+prop.level;
		}
		if(args.thumbnail)
		{
			html+="<div style='margin-left:-2px'>"+item_container({skin:item.skin,def:item})+"</div>";
		}
		if(item.card)
		{
			html+="<div style='display:inline-block; vertical-align: top'>";
				html+="<div style='color: "+color+"; display: inline-block; border-bottom: 2px dashed gray; margin-bottom: 3px' class='cbold'>"+item_name+"</div><div></div>";
				html+="<div style='color: "+color+"; display: inline-block; border-bottom: 2px dashed gray; margin-bottom: 3px; color: #AB7951' class='cbold'>"+item.card+"</div>";
			html+="</div>";
		}
		else if(!args.pure)
		{
			html+="<div style='color: "+color+"; display: inline-block; border-bottom: 2px dashed gray; margin-bottom: 3px' class='cbold'>"+item_name+"</div>";
		}
		if(prop.miss && item.type=="elixir") html+=bold_prop_line("Alcohol",prop.miss+"%","#7CAAF6");
		(item.gives||[]).forEach(function(prop){
			if(prop[0]=="hp" && prop[1]<0) html+=bold_prop_line("HP",to_pretty_num(prop[1]),colors.hp);
			else if(prop[0]=="hp") html+=bold_prop_line("HP","+"+to_pretty_num(prop[1]),colors.hp);
			if(prop[0]=="mp") html+=bold_prop_line("MP","+"+to_pretty_num(prop[1]),colors.mp);
		});
		if(item.debuff) html+=bold_prop_line("Effect","Debuff","#343792");
		if(args.monster)
		{
			html+=bold_prop_line("Name",item.name);
			html+="<span class='clickable' onclick='show_json(G.monsters."+args.monster+",{prefix:\"G.monsters.\",name:\""+args.monster+"\"})'>"+bold_prop_line("Show","G.monsters.<span style='color:"+colors.property+";'>"+args.monster+"</span>",colors.inspect)+"</span>";
			html+="<span class='clickable' onclick='monster_x(\""+args.monster+"\")'>"+bold_prop_line("Find","<span style='color:"+colors.string+";'>\""+args.monster+"\"</span>","#7AD963")+"</span>";
		}
		if(prop.gold) html+=bold_prop_line("Gold",(prop.gold>0&&"+"||"")+prop.gold+"%","gold");
		if(prop.luck) html+=bold_prop_line("Luck",(prop.luck>0&&"+"||"")+prop.luck+"%","#5DE376");
		if(prop.xp) html+=bold_prop_line("XP",(!args.monster&&prop.xp>0&&"+"||"")+prop.xp+(!args.monster&&"%"||""),"#1E73DE");
		if(prop.lifesteal) html+=bold_prop_line("Lifesteal",to_pretty_float(prop.lifesteal)+"%",colors.lifesteal);
		if(prop.manasteal) html+=bold_prop_line("Manasteal",to_pretty_float(prop.manasteal)+"%",colors.manasteal);
		if(item.goldsteal) html+=bold_prop_line("Goldsteal","Dynamic","gold");
		if(prop.evasion) html+=bold_prop_line("Evasion",to_pretty_float(prop.evasion)+"%","#7AC0F5");
		if(prop.avoidance) html+=bold_prop_line("Avoidance",to_pretty_float(prop.avoidance)+"%","#7AC0F5");
		if(prop.miss && item.type!="elixir") html+=bold_prop_line("Miss",prop.miss+"%","#F36C6E");
		if(prop.reflection) html+=bold_prop_line("Reflection",to_pretty_float(prop.reflection)+"%","#B484E5");
		if(prop.dreturn) html+=bold_prop_line("D.Return",to_pretty_float(prop.dreturn)+"%","#E94959");
		if(prop.crit) html+=bold_prop_line("Crit",to_pretty_float(prop.crit)+"%","#E52967");
		if(prop.critdamage) html+=bold_prop_line("Crit Damage","+"+to_pretty_float(prop.critdamage)+"%","#A8214E");
		if(prop.attack) html+=bold_prop_line("Damage",prop.attack,colors.attack);
		if(item.damage_type)
		{
			if(item.damage_type=="pure") html+=bold_prop_line("Type","Pure","#AA9B55");
			else if(item.damage_type=="magical") html+=bold_prop_line("Type","Magical","#8998AA");
			else if(item.damage_type=="physical") html+=bold_prop_line("Type","Physical","#93AB98");
		}
		if(prop.range) html+=bold_prop_line("Range",(!args.monster&&"+"||"")+prop.range,colors.range);
		if(prop.hp) html+=bold_prop_line("HP",prop.hp,colors.hp);
		if(prop.str) html+=bold_prop_line("Strength",prop.str,colors.str);
		if(prop['int']) html+=bold_prop_line("Intelligence",prop['int'],colors['int']);
		if(prop.dex) html+=bold_prop_line("Dexterity",prop.dex,colors.dex);
		if(prop.vit) html+=bold_prop_line("Vitality",prop.vit,colors.hp);
		if(prop['for']) html+=bold_prop_line("Fortitude",prop['for'],colors['for']);
		if(prop.mp) html+=bold_prop_line("MP",prop.mp,colors.mp);
		if(prop.mp_cost>0) html+=bold_prop_line("Attack MP Cost","+"+prop.mp_cost,colors.mp);
		else if(prop.mp_cost) html+=bold_prop_line("Attack MP Cost",prop.mp_cost,colors.mp);
		if(prop.mp_reduction>0) html+=bold_prop_line("Skill MP Reduction","%"+prop.mp_reduction,colors.mp);
		else if(prop.mp_reduction) html+=bold_prop_line("Skill MP Increase","%"+(-prop.mp_reduction),colors.mp);
		if(prop.stat) html+=bold_prop_line("Stat",prop.stat);
		if(prop.armor) html+=bold_prop_line("Armor",prop.armor,colors.armor);
		if(prop.apiercing) html+=bold_prop_line("A.Piercing",prop.apiercing,colors.armor);
		if(prop.rpiercing) html+=bold_prop_line("R.Piercing",prop.rpiercing,colors.resistance);
		if(prop.resistance) html+=bold_prop_line("Resistance",prop.resistance,colors.resistance);
		if(prop.pnresistance) html+=bold_prop_line("Poison Res.",prop.pnresistance,"#68B84B");
		if(prop.firesistance) html+=bold_prop_line("Fire Res.",prop.firesistance,"#B42B22");
		if(prop.fzresistance) html+=bold_prop_line("Freeze Res.",prop.fzresistance,"#69B1B6");
		if(prop.phresistance) html+=bold_prop_line("Impact Res.",prop.phresistance,"#69B1B6");
		if(prop.stresistance) html+=bold_prop_line("Status Res.",prop.stresistance,"#9FA7B6");
		if(item.wspeed) html+=bold_prop_line("Speed",item.wspeed.toTitleCase(),"gray");
		if(prop.speed) html+=bold_prop_line(item.wtype&&"Run Speed"||"Speed",(!args.monster&&(prop.speed>0)&&"+"||"")+prop.speed,colors.speed);
		if(prop.frequency || args.monster) html+=bold_prop_line("A.Speed",(prop.frequency||1)*(args.monster&&100||1),"#3BE681");
		if(prop.output) html+=bold_prop_line("Damage Output",(prop.output>0&&"+"||"")+prop.output+"%","#D93319");
		if(prop.incdmgamp) html+=bold_prop_line("Incoming Damage",prop.incdmgamp+"%","#D93319");
		if(prop.stun) html+=bold_prop_line("Stun",prop.stun+"%","#784224");
		if(prop.explosion) html+=bold_prop_line("Explosion",prop.explosion+"%","#782D33");
		if(prop.blast) html+=bold_prop_line("Blast",prop.blast+"%","#685079");
		if(prop.breaks && prop.breaks>0) html+=bold_prop_line("Breaks",to_pretty_float(prop.breaks)+"%","#782D33");
		if(prop.charisma) html+=bold_prop_line("Charisma",prop.charisma,"#4DB174");
		if(prop.awesomeness) html+=bold_prop_line("Awesomeness",prop.awesomeness,"#FFDE2F");
		if(prop.bling) html+=bold_prop_line("Bling",prop.bling,"#A4E6FF");
		if(prop.cuteness) html+=bold_prop_line("Cuteness",prop.cuteness,"#FD82F0");
		if(prop.intensity) html+=bold_prop_line("Intensity",prop.intensity,"#786D6A");
		if(prop.courage) html+=bold_prop_line("Courage",prop.courage,"#9E1813");
		if(prop.mcourage) html+=bold_prop_line("M.Courage",prop.mcourage,"#4628A0");
		if(prop.pcourage) html+=bold_prop_line("P.Courage",prop.pcourage,"#D19D32");
		if(grade==1 && item.type!="booster") html+=bold_prop_line("Grade","High","#696354");
		if(grade==2 && item.type!="booster") html+=bold_prop_line("Grade","Rare","#6668AC");
		if(grade==3 && item.type!="booster") html+=bold_prop_line("Grade","Legendary","#39A868");
		if(grade==4 && item.type!="booster") html+=bold_prop_line("Grade","Exalted","#2875F9"); // gold: "#E5A818" purple: #8B3EE6" dark-pink: #e84664
		if(prop.poisonous) html+="<div style='color: "+colors.poison+"'>Poisonous</div>";
		if(prop.cooperative) html+="<div style='color: #aeaeae'>Cooperative</div>";
		if(prop.peaceful) html+="<div style='color: #54B25F'>Peaceful</div>";
		if(prop.supporter) html+="<div style='color: #CA5931'>Supporter</div>";
		if(prop.abilities)
		{
			for(var id in prop.abilities)
			{
				if(!G.skills[id]) continue;
				html+=info_line({name:prop.abilities[id].aura&&"Aura"||"Ability",color:"#FC5F39",value:G.skills[id].name,onclick:"dialogs_target=xtarget||ctarget; render_skill('#topleftcornerdialog','"+id+"')"});
			}
		}
		if(prop.spawns)
		{
			prop.spawns.forEach(function(s){
				html+=info_line({name:"Spawns",color:"#237B2A",value:G.monsters[s[1]].name,onclick:"render_monster_info('"+s[1]+"')"});
			})
		}
		for(var mname in G.maps)
			if(item[mname])
			{
				html+="<div><span style='color: #7738E8;'>Bonus</span>: <span class='clickable' onclick='stpr(event); show_json("+JSON.stringify(item[mname])+")'>"+G.maps[mname].name+" [Only]"+"</span></div>";
			}
		for(var cname in G.classes)
			if(item[cname])
			{
				html+="<div><span style='color: #7738E8;'>Bonus</span>: <span class='clickable' onclick='stpr(event); show_json("+JSON.stringify(item[cname])+")'>"+cname.toTitleCase()+" [Only]"+"</span></div>";
			}
		if(args.count) html+=bold_prop_line("Kills",to_pretty_num(args.count),"#7D0C15");
		if(args.score) html+=bold_prop_line("Score",to_pretty_num(args.score),"#C38737");
		if(args.mcount) html+=bold_prop_line("Max Score",to_pretty_num(args.mcount)+" <span class='gray'>["+args.mowner+"]</span>","#DCC343");
		if(args.monster && G.base_gold)
		{
			for(mname in G.base_gold[args.monster])
			{
				if(!G.maps[mname] || G.maps[mname].ignore) continue;
				html+=bold_prop_line("Base Gold",G.base_gold[args.monster][mname]+" <span class='gray'>("+G.maps[mname].name+")</span>","gold");
			}
		}
		if(prop['class']) html+=bold_prop_line("Class",function(a){ var s=""; a.forEach(function(x){if(s.length) s+=", "; s+=x.toTitleCase()}); return(s) }(prop['class']),"gray");
		if(actual && item.type=="elixir" && args.slot=="elixir")
		{
			var remains=-msince(new Date(actual.expires))/60.0;
			// html+="<div style='color: #C3C3C3'>"+remains+" hours</div>";
			html+=prop_remains(remains);
		}
		else if(item.type=="elixir")
		{
			html+=prop_remains(item.duration);
		}
		if(item.achievements) //args.monster
		{
			html+="<div class='ilsu' style='margin-top: 5px'>Achievements:</div>";
			item.achievements.forEach(function(a){
				var acolor="white";
				if(max(args.score,args.mcount)>=a[0]) acolor="#2EA436";
				var an=a[2];
				if(an=="frequency") an="a.speed";
				html+="<div><span style='color:"+acolor+"'>["+to_pretty_num(a[0])+"]</span> <span style='color:"+(colors[a[2]]||"gray")+"'>"+an.toUpperCase()+"</span> "+a[3]+"</div>";
			});
			if(args.count<100 && 0)
			{
				html+="<div style='margin-top: 5px; color:#848987'>Insight: [LOCKED]</div>";
				html+="<div><span style='color:#DAE2DF'>100 kills are needed to discover the monster specific droprates.</span></div>";
			}
		}
		if(item.ability)
		{
			if(item.ability=="bash")
			{
				html+=bold_prop_line("Ability","Bash",colors.ability);
				html+="<div style='color: #C3C3C3'>"+"Stuns the opponent for "+prop.attr1+" seconds with "+prop.attr0+"% chance.</div>";
			}
			else if(item.ability=="freeze")
			{
				html+=bold_prop_line("Ability","Freeze","#2EBCE2");
				html+="<div style='color: #C3C3C3'>"+"Freezes the opponent with a "+prop.attr0+"% chance.</div>";
			}
			else if(item.ability=="burn")
			{
				html+=bold_prop_line("Ability","Burn","#E03D31");
				html+="<div style='color: #C3C3C3'>"+"Burns the opponent with a "+prop.attr0+"% chance. Deals damage over time.</div>";
			}
			else if(item.ability=="weave")
			{
				html+=bold_prop_line("Ability","Weave","#AAA9D2");
				html+="<div style='color: #C3C3C3'>Each hit slows the opponent more and more.</div>";
			}
			else if(item.ability=="secondchance")
			{
				html+=bold_prop_line("Ability","Second Chance",colors.ability);
				html+="<div style='color: #C3C3C3'>"+"Avoid death with a "+prop.attr0+"% chance.</div>";
			}
			else if(item.ability=="sugarrush")
			{
				html+=bold_prop_line("Ability","Sugar Rush","#D64770");
				html+="<div style='color: #C3C3C3'>"+"Trigger a Sugar Rush on attack with 0.25% chance. Gain 240 Attack Speed for 10 seconds!</div>";
			}
			else if(item.ability=="restore_mp")
			{
				html+=bold_prop_line("Ability","Restore MP","#5D9ED9");
			html+="<div style='color: #C3C3C3'>"+"Instead of using MP, skills restore 2X the amount with "+prop.attr0+"% chance.</div>";
			}
			else if(G.skills[item.ability])
			{
				html+=bold_prop_line("Ability",G.skills[item.ability].name,"#E1924D");
				if(prop.attr0) html+=bold_prop_line("Chance","%"+prop.attr0);
				html+="<div style='color: #C3C3C3'>"+"Activate the ability from the 'SKILLS' system.</div>";
			}
		}
		if(item.aura)
		{
			if(G.conditions[item.aura])
			{
				html+=bold_prop_line("Aura",G.conditions[item.aura].name,"#E1924D");
				if(prop.attr0) html+=bold_prop_line("Amount","%"+prop.attr0);
			}
		}
		if(actual && item.charge && !actual.b)
		{
			html+=bold_prop_line("Charge",to_pretty_float((actual.charges||0)/item.charge*100)+"%","#7433A7");
		}
		if(item.explanation)
		{
			html+="<div style='color: #C3C3C3'>"+item.explanation+"</div>";
		}
		else if(item.type=="material")
		{
			html+="<div style='color: #C3C3C3'>An unknown material, as in, you have no idea what to do with it!</div>";
		}
		if(item.multiplier && item.multiplier!=1) html+=bold_prop_line("Multiplier",item.multiplier,"gray");
		if(prop.set)
		{
			html+="<div><span style='color: #f1c054;'>Set</span>: <span class='clickable' onclick='stpr(event); render_set(\""+prop.set+"\")'>"+G.sets[prop.set].name+"</span></div>";
		}
		if(args.minutes!==undefined)
		{
			html+=prop_remains(args.minutes/60.0);
		}

		if(actual && actual.l)
		{
			if(actual.l=="s") html+="<div class='ilsu'>Sealed</div>";
			else if(actual.l=="u") html+="<div class='iluu'>Unsealing</div>";
			else html+="<div style='color: #404141'>Locked</div>";
		}

		if(actual && actual.acl)
		{
			html+="<div style='color: #ADA68E'>Account Bound <span class='clickable' style='color: #C49F8D' onclick='show_alert(\"Unbind the item? [Soon]\")'>[X]</span></div>";
		}

		if(!(args && args.prop))
		{
			var phrase="Information";
			if(item.e) phrase="Exchangeable";
			else if(item.upgrade && (!actual || actual.level<10)) phrase="Upgradeable";
			else if(item.compound) phrase="Compoundable";
			else
			{
				var done=false;
				for(var iname in G.craft)
				{
					if(G.craft[iname].quest!="mcollector") continue;
					G.craft[iname].items.forEach(function(i){
						if(i[1]==iname) done=true,phrase="Collectable";
					});
				}
				if(!done)
				{
					for(var iname in G.craft)
					{
						if(G.craft[iname].quest=="mcollector") continue;
						G.craft[iname].items.forEach(function(i){
							if(i[1]==iname) done=true,phrase="Useable";
						});
					}
				}
			}
			if(item.type=="weapon" || offhand_types[item.type])
			{
					
				var t="",color="#CC3837";
				if(0 && parseInt(item.tier)<item.tier) t+="T"+parseInt(item.tier)+"+ "+(weapon_types[item.wtype]||offhand_types[item.wtype]||(item.wtype||item.type).toTitleCase());
				else t+="T"+to_pretty_float(item.tier)+" "+(weapon_types[item.wtype]||offhand_types[item.wtype]||(item.wtype||item.type).toTitleCase());

				if(!window.character || G.classes[character.ctype].mainhand[item.wtype||item.type] || G.classes[character.ctype].doublehand[item.wtype||item.type] || G.classes[character.ctype].offhand[item.wtype||item.type])
					color="#56A244";

				
				html+="<div style='color: gray;' class='clickable' onclick='stpr(event); render_equip_info(\""+args.name+"\")'>Type<span style='color:white'>:</span><span style='color: "+color+";'> "+t+"</span></div>";
			}
			html+="<div style='color: gray;' class='clickable' onclick='stpr(event); render_item_help(this,\""+args.name+"\","+(actual&&actual.level||0)+")'>[i]<span style='color: white'>: "+phrase+"</span></div>";
		}
		if(args.inventory_ui!==undefined)
		{
			html+=button_line({name:"<span style='color:gray'>{}</span><span style='color:white'>:</span> Inspect",onclick:"show_json(character.items["+args.inventory_ui+"],{inventory_ui:"+args.inventory_ui+"})",color:colors.inspect});
		}
		

		if(args.trade && actual && character.slots.helmet && character.slots.helmet.name.startsWith("ghat"))
		{
			var svalue=2*calculate_item_value(actual);
			html+="<div style='margin-top: 5px'>";
				if((actual.q||1)>1)
				{
					html+="<div><span class='gray clickable' onclick='$(\".tradenum\").cfocus()'>Q:</span> <div class='inline-block tradenum' contenteditable=true>"+actual.q+"</div></div>"
				}
				html+="<div><span class='clickable' style='color:#35AD4B' onclick='$(\".sellmins\").focus()'>MINUTES:</span> <div class='inline-block sellmins editable' contenteditable=true>20</div></div>";
				html+="<div><span class='clickable' style='color:#EF5EA8' onclick='giveaway(\""+args.slot+"\",\""+args.num+"\",$(\".tradenum\").shtml(),$(\".sellmins\").shtml())'>GIVEAWAY!</span></div>"; // style='color:#A99A5B'
				html+="</div>";
		}
		else if(args.trade && actual)
		{
			var svalue=2*calculate_item_value(actual);
			html+="<div style='margin-top: 5px'>";
				if((actual.q||1)>1)
				{
					html+="<div><span class='gray clickable' onclick='$(\".tradenum\").cfocus()'>Q:</span> <div class='inline-block tradenum' contenteditable=true>"+actual.q+"</div></div>"
				}
				html+="<div><span class='gold clickable' onclick='$(\".sellprice\").focus()'>GOLD"+(((actual.q||1)>1)&&" [EACH]"||"")+":</span> <div class='inline-block sellprice editable' contenteditable=true>"+to_pretty_num(svalue)+"</div></div>";
				html+="<div><span class='clickable' onclick='trade(\""+args.slot+"\",\""+args.num+"\",$(\".sellprice\").shtml(),$(\".tradenum\").shtml())'>PUT UP FOR SALE</span></div>"; // style='color:#A99A5B'
			html+="</div>";
		}
		if(actual && actual.name=="cxjar")
		{
			precompute_image_positions();
			if(!actual.data)
			{
				html+="<div style='color: #C3C3C3'>Empty / Anomaly</div>";
			}
			else if(!T[actual.data])
			{
				html+="<div style='color: #C3C3C3'>Invalid / "+actual.data+"</div>";
			}
			else
			{
				html+="<div class='clickable' onclick='render_cx_info(\""+actual.data+"\")'>"+cx_sprite(actual.data)+"</div>";
			}
		}
		if(actual && actual.name=="emotionjar")
		{
			if(!G.emotions[actual.data])
			{
				html+="<div style='color: #C3C3C3'>Invalid / "+actual.data+"</div>";
			}
			else
				html+="<div><span class='clickable' onclick='stpr(event); show_json(G.emotions."+actual.data+",{prefix:\"G.emotions.\",name:\""+actual.data+"\"})'>"+bold_prop_line("Includes","G.emotions.<span style='color:"+colors.property+";'>"+actual.data+"</span>",colors.inspect)+"</span></div>";
		}
		if(in_arr(args.slot,trade_slots) && actual && actual.price && args.from_player && !actual.b && !actual.giveaway)
		{
			trade_item=true;
			if((actual.q||1)>1)
			{
				html+="<div><span class='gray clickable' onclick='$(\".tradenum\").cfocus()'>Q:</span> <div class='inline-block tradenum' contenteditable=true>1</div></div>";
			}
			html+="<div style='color: gold'>"+to_pretty_num(actual.price)+" GOLD"+((actual.q||1)>1&&" <span style='color: white'>[EACH]</span>"||"")+"</div>";
			html+="<div><span class='clickable itu' onclick='trade_buy(\""+args.slot+"\",\""+args.from_player+"\",\""+(actual.rid||'')+"\",$(\".tradenum\").html())'>BUY</span></div>";
		}
		if(in_arr(args.slot,trade_slots) && actual && args.from_player && actual.giveaway)
		{
			trade_item=true;
			if(actual.list.length)
			{
				html+="<div><span style='color:#42A0DC'>PARTICIPANTS:</span> "+actual.list.join(", ")+"</div>";
			}
			html+="<div><span class='clickable' style='color:#35AD4B' onclick='$(\".sellmins\").focus()'>MINUTES:</span> "+actual.giveaway+"</div>";
			html+="<div><span class='clickable itu' onclick='join_giveaway(\""+args.slot+"\",\""+args.from_player+"\",\""+(actual.rid||'')+"\")'>JOIN!</span></div>";
		}
		if(in_arr(args.slot,trade_slots) && actual && actual.price && args.from_player && actual.b)
		{
			var q=false; if((actual.q||1)>1 && item.s) q=true;
			trade_item=true;
			if(q)
			{
				html+="<div><span class='gray clickable' onclick='$(\".tradenum\").cfocus()'>Q:</span> <div class='inline-block tradenum' contenteditable=true>1</div></div>";
			}
			html+="<div style='color: gold'>"+to_pretty_num(actual.price)+" GOLD"+(q&&" <span style='color: white'>[EACH]</span>"||"")+"</div>";
			html+="<div><span class='clickable ibu' onclick='trade_sell(\""+args.slot+"\",\""+args.from_player+"\",\""+(actual.rid||'')+"\",$(\".tradenum\").html())'>SELL</span></div>";
		}
		if(args.secondhand)
		{
			var mult=2;
			if(item.cash) mult=3;
			trade_item=true;
			html+="<div style='color: gold'>"+to_pretty_num(calculate_item_value(actual)*mult*(actual.q||1))+" GOLD</div>";
			html+="<div><span class='clickable' onclick='secondhand_buy(\""+(actual.rid||'')+"\")'>BUY</span></div>";
		}
		if(args.lostandfound)
		{
			trade_item=true;
			html+="<div style='color: gold'>"+to_pretty_num(calculate_item_value(actual)*4*(actual.q||1))+" GOLD</div>";
			html+="<div><span class='clickable' onclick='lostandfound_buy(\""+(actual.rid||'')+"\")'>BUY</span></div>";
		}
		if(value)
		{
			var f="buy_with_gold";
			if(item.days) html+="<div style='color: #C3C3C3'>Lasts 30 days</div>";

			if(cash) html+="<div style='color: "+colors.cash+"'>"+to_pretty_num(item.cash)+" SHELLS</div>",f="buy_with_shells";
			else html+="<div style='color: gold'>"+to_pretty_num(value)+" GOLD</div>";
			if(cash && character && item.cash>=character.cash)
			{
				if(is_electron)
				{
					html+="<div style='border-top: solid 2px gray; margin-bottom: 2px; margin-top: 3px; margin-left: -1px; margin-right: -1px'></div>";
					html+="<div style='color: #C3C3C3'>You can find SHELLS from gems, monsters. In future, from achievements.</div>";
				}
				else
				{
					html+="<div style='border-top: solid 2px gray; margin-bottom: 2px; margin-top: 3px; margin-left: -1px; margin-right: -1px'></div>";
					html+="<div style='color: #C3C3C3'>You can find SHELLS from gems, monsters. In future, from achievements. For the time being, to receive SHELLS and support our game:</div>";
					html+="<a href='https://adventure.land/shells' class='cancela' target='_blank'><span class='clickable' style='color: #EB8D3F'>BUY or EARN SHELLS</span></a> "; // onclick='shells_click(); $(this).parent().remove()'
					// #EB8D3F  nice orange - #33BBD6 meh blue - #54C8C1 ok teal
				}
			}
			else
			{
				if(item.s)
				{
					var q=1;
					if(item.gives) q=100;
					html+="<div style='margin-top: 5px'><!--<input type='number' value='1' class='buynum itemnumi'/> -->";
					html+="<span class='gray clickable' onclick='$(\".buynum\").cfocus()'>Q:</span> <div class='inline-block buynum' contenteditable=true>"+q+"</div> <span class='gray'>|</span> "
					html+="<span class='clickable' onclick='"+f+"(\""+name+"\",parseInt($(\".buynum\").html()))'>BUY</span> ";
					html+="</div>";
				}
				else
					html+="<div><span class='clickable' onclick='"+f+"(\""+name+"\")'>BUY</span></div>";
			}
		}
		else if(args.guide && actual)
		{
			html+="<div style='color: gold'>"+to_pretty_num(calculate_item_value(actual,1))+" GOLD</div>";
		}

		if(args.token && args.key && args.key!=args.token)
		{
			var color="#B6A786",phrase="TOKENS";
			var text="#D3D5E0";
			if(args.token=="funtoken") color="#AA6AB3";
			else if(args.token=="pvptoken") text="#CCAE08";
			else if(args.token=="monstertoken") text="#6C531B";
			else if(args.token=="friendtoken") text="#AA6AB3";
			if(G.tokens[args.token][args.key]==1) phrase="TOKEN";
			if(G.tokens[args.token][args.key]<1) html+="<div><span class='clickable' style='color: "+color+"' onclick='exchange_buy(\""+args.token+"\",\""+args.key+"\")'>EXCHANGE "+(1/G.tokens[args.token][args.key])+" <span style='color:"+text+"'>[1 TOKEN]</span></span></div>";
			else html+="<div><span class='clickable' style='color: "+color+"' onclick='exchange_buy(\""+args.token+"\",\""+args.key+"\")'>EXCHANGE <span style='color:"+text+"'>["+G.tokens[args.token][args.key]+" "+phrase+"]</span></span></div>";
		}

		if(args.sell && actual)
		{
			var value=calculate_item_value(actual);
			html+="<div style='color: gold'>"+to_pretty_num(value)+" GOLD</div>";
			if(item.s && actual.q)
			{
				var q=actual.q;
				html+="<div style='margin-top: 5px'>";
				html+="<span class='gray clickable' onclick='$(\".sellnum\").cfocus()'>Q:</span> <div class='inline-block sellnum' contenteditable=true>"+q+"</div> <span class='gray'>|</span> "
				html+="<span class='clickable' onclick='var inum=\""+args.num+"\"; if(character.items[inum].name==\""+actual.name+"\") sell(inum,parseInt($(\".sellnum\").html()))'>SELL</span> ";
				html+="</div>";
			}
			else
				html+="<div><span class='clickable' onclick='var inum=\""+args.num+"\"; if(character.items[inum].name==\""+actual.name+"\") sell(inum)'>SELL</span></div>";
		}
		if(args.cancel)
		{
			html+="<div class='clickable' onclick='$(this).parent().remove()'>CLOSE</div>"
		}
		if(in_arr(name,booster_items))
		{
			if(actual && actual.expires)
			{
				var remains=round((-msince(new Date(actual.expires)))/(6*24))/10.0;
				html+="<div style='color: #C3C3C3'>"+remains+" days</div>";
			}
			if(!args.sell) html+="<div class='clickable' onclick=\"btc(event); show_modal($('#boosterguide').html())\" style=\"color: #D86E89\">HOW TO USE</div>";
		}
		if(!value && !args.sell && actual && !trade_item && !args.trade && !args.npc)
		{
			if(item.action)
			{
				var id=args&&args.slot||args&&args.num;
				html+='<div><span data-id="'+id+'" class="clickable" style="color: '+(item.acolor||color)+'" onclick="'+item.onclick+'"">'+item.action+'</span></div>';
			}
			if(item.type=="computer")
			{
				html+="<div class='clickable' onclick='add_log(\"Beep. Boop.\")' style=\"color: #32A3B0\">NETWORK</div>";
			}
			if(item.type=="stand")
			{
				html+="<div class='clickable' onclick='socket.emit(\"trade_history\",{}); $(this).parent().remove()' style=\"color: #44484F\">TRADE HISTORY</div>";
			}
			if(0 && item.type=="computer" && (actual.charges===undefined || actual.charges) && gameplay=="normal")
			{
				html+="<div class='clickable' onclick='socket.emit(\"unlock\",{name:\"code\",num:\""+args.num+"\"});' style=\"color: #BA61A4\">UNLOCK</div>";
			}
			if(item.type=="computer")
			{
				html+="<div class='clickable' onclick='render_computer($(this).parent())' style=\"color: #32A3B0\">NETWORK</div>";
			}
			if(item.type=="stand" && !character.stand)
			{
				html+="<div class='clickable' onclick='open_merchant(\""+args.num+"\"); $(this).parent().remove()' style=\"color: #8E5E2C\">OPEN</div>";
			}
			if(item.type=="stand" && character.stand)
			{
				html+="<div class='clickable' onclick='close_merchant(); $(this).parent().remove()' style=\"color: #8E5E2C\">CLOSE</div>";
			}
			if(item.type=="elixir" && !args.from_player)
			{
				var phrase="DRINK";
				if(item.eat) phrase="EAT";
				html+="<div class='clickable' onclick='socket.emit(\"equip\",{num:\""+args.num+"\"}); push_deferred(\"equip\"); $(this).parent().remove()' style=\"color: #D86E89\">"+phrase+"</div>";
			}
			if((item.type=="licence" || item.type=="spawner") && !args.from_player)
			{
				html+="<div class='clickable' onclick='socket.emit(\"equip\",{num:\""+args.num+"\"}); push_deferred(\"equip\"); $(this).parent().remove()' style=\"color: #574F58\">USE</div>";
			}
			if(in_arr(actual.name,["stoneofxp","stoneofgold","stoneofluck"]))
			{
				html+="<div class='clickable' onclick='socket.emit(\"convert\",{num:\""+args.num+"\"});' style=\"color: "+colors.cash+"\">CONVERT TO SHELLS</div>";
			}
			if(in_arr(actual.name,booster_items))
			{
				if(actual.expires)
					html+="<div class='clickable' onclick='shift(\""+args.num+"\",\""+booster_items[(booster_items.indexOf(actual.name)+1)%3]+"\"); $(this).parent().remove()' style=\"color: #438EE2\">SHIFT</div>";
				else
					html+="<div class='clickable' onclick='activate(\""+args.num+"\",\"activate\"); $(this).parent().remove()' style=\"color: #438EE2\">ACTIVATE</div>";
			}
		}
		if(args.craft)
		{
			var i=0,phrase="Recipe",action="CRAFT",ecolor="#419FBE";
			if(G.craft[name].quest) phrase="Collect",action="EXCHANGE",ecolor="#4DC353";
			html+="<div style='margin-top: 5px'></div>";
			html+="<div style='color: "+color+"; display: inline-block; border-bottom: 2px dashed gray; margin-bottom: 3px' class='cbold'>"+phrase+"</div>";
			html+="<div></div>";
			G.craft[name].items.forEach(function(item){
				var q=undefined;
				if(item[0]!=1) q=item[0];
				html+=item_container({skin:G.items[item[1]].skin,onclick:"render_item_by_name('"+item[1]+"')"},{name:item[1],q:q,level:item[2]});
				i+=1;
				if(!(i%4)) html+="<div></div>";
			});
			if(G.craft[name].cost) html+=bold_prop_line("Cost",to_pretty_num(G.craft[name].cost),"gold");
			html+="<div class='clickable' onclick='auto_craft(\""+name+"\")' style=\"color: "+ecolor+"\">"+action+"</div>";
		}
		if(args.dismantle)
		{
			var i=0;
			html+="<div style='margin-top: 5px'></div>";
			html+="<div style='color: "+color+"; display: inline-block; border-bottom: 2px dashed gray; margin-bottom: 3px' class='cbold'>Dismantles-to</div>";
			html+="<div></div>";
			G.dismantle[name].items.forEach(function(item){
				var q=undefined;
				if(item[0]!=1) q=item[0];
				html+=item_container({skin:G.items[item[1]].skin,onclick:"render_item_by_name('"+item[1]+"')"},{name:item[1],q:q});
				i+=1;
				if(!(i%4)) html+="<div></div>";
			});
			if(G.dismantle[name].cost) html+=bold_prop_line("Cost",to_pretty_num(G.dismantle[name].cost),"gold");
		}
		if(args.condition && args.condition.sn) html+=bold_prop_line("Server",args.condition.sn,"#BED4DE");
		if(args.condition && args.condition.f) html+=bold_prop_line("From",args.condition.f,"#BED4DE");
		if(args.condition && args.condition.c) html+=bold_prop_line("Count",args.condition.c+" left","#891C13");
		if(args.condition && args.condition.sn && args.condition.id)
		{
			html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; position: relative; display: inline-block; margin: 2px;' class='clickable' onclick='pcs(event); monster_x(\""+args.condition.id+"\")'>"+sprite(args.condition.id)+"</div>";
		}
	}
	// html+=JSON.stringify(actual);
	if(!args.pure) html+="</div>";
	if(selector=="html") return html;
	else if(modal_count) show_modal(html,{wrap:false});
	else $(selector).html(html);
}

function render_item_by_name(name)
{
	render_item_popup(name);
	// render_item(null,{skin:G.items[name].skin,item:G.items[name],name:name});
}

function wishlist_form(num,name)
{
	wishlist(num,name,$('.wprice').shtml(),$('.wnumq').shtml(),$('.wlevel').shtml());
}

function render_wishlist_item(name,num)
{
	var def=G.items[name],html="";
	html+="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 240px; min-width:200px;' class='buyitem'>";
		html+="<div style='margin-left:-2px; display:inline-block; vertical-align:middle'>"+item_container({skin:def.skin,def:def})+"</div>";
		html+="<div style='display:inline-block; vertical-align:top; margin-left: 4px'>"
			html+="<div style='color: #f1c054; border-bottom: 2px dashed #C7CACA; margin-bottom: 3px; margin-left: 3px; margin-right: 3px; display: inline-block' class='cbold'>Wishlist</div>";
			html+="<div></div>";
			html+="<div style='color: #E4E4E4; border-bottom: 2px dashed gray; margin-bottom: 3px; display: inline-block' class='cbold'>"+def.name+"</div>";
		html+="</div>";
		
		html+="<div><span class='gray clickable' onclick='$(\".wnumq\").cfocus()'>Q:</span> <div class='inline-block wnumq' contenteditable=true>1</div></div>";
		html+="<div><span class='gold clickable' onclick='$(\".wprice\").cfocus()'>GOLD"+(def.s&&" [EACH]"||"")+":</span> <div class='inline-block wprice editable' contenteditable=true>"+(calculate_item_value({name:name})+1)+"</div></div>";
		if(def.compound||def.upgrade)
			html+="<div><span style='color:#9E7BCA' class='clickable' onclick='$(\".wlevel\").cfocus()'>LEVEL:</span> <div class='inline-block wlevel editable' contenteditable=true data-default='0'>0</div></div>";
		html+="<div><span class='clickable' onclick='wishlist_form("+num+",\""+name+"\")'>WISHLIST</span></div>";
	
	html+="</div>";
	$("#topleftcornerdialog").html(html);
	dialogs_target=character;
}

function render_set(name)
{
	var set=G.sets[name],selector=last_selector;
	var html="<div style='background-color: black; border: 5px solid gray; font-size: 24px; display: inline-block; padding: 20px; line-height: 24px; max-width: 280px;' class='buyitem'>";
		html+="<div style='color: #f1c054; border-bottom: 2px dashed #C7CACA; margin-bottom: 3px' class='cbold'>"+set.name+"</div>";
			html+="<div style='margin-left:-2px; margin-right:-2px;'>"
				set.items.forEach(function(i){
					html+=item_container({skin:G.items[i].skin});
				});
		html+="</div>";
	[1,2,3,4,5,6,7,8].forEach(function(num){
		var rep=num;
		if(num!=set.items.length) rep=num+"+";
		if(set[num] && Object.keys(set[num]).length) html+="<div><span style='color:#8A8D8F'>["+rep+" Equipped]</span> "+render_item("html",{pure:true,item:set[num],prop:set[num]})+"</div>";
	});
	if(set.explanation)
	{
		html+="<div style='color: #C3C3C3'>"+set.explanation+"</div>";
	}
	html+="</div>";
	if(modal_count) show_modal(html,{wrap:false,hideinbackground:true});
	else $(selector).html(html);
}

function render_condition(selector,name)
{
	var def=G.conditions[name],minutes=0,condition=undefined,target=xtarget||ctarget;
	if(target && target.s[name] && target.s[name].ms) minutes=target.s[name].ms/6000.0/10.0;
	if(target && target.s[name])
	{
		def=!def&&{}||clone(def);
		condition=target.s[name];
		for(var p in target.s[name])
		{
			def[p]=target.s[name][p];
		}
	}
	render_item(selector,{skin:condition&&condition.skin||def&&def.skin,item:def,prop:def,minutes:minutes,condition:condition});
}

function render_item_selector(selector,args)
{
	if(args && !args.purpose) purpose="buying";
	var items=[],row=0,html="<div style='border: 5px solid gray; height: 400px; overflow: scroll; background: black'>";
	for(var id in G.items)
		if(!G.items[id].ignore) items.push(G.items[id]);
	items.sort(function(a,b){return b.g-a.g;});
	for(var i=0;i<items.length;i++)
	{
		var current=items[i];
		html+=item_container({skin:current.skin,def:current,onclick:"gallery_click('"+current.id+"')"});
		row++;
		if(!(row%5)) html+="<br />";
	}
	html+="</div>";
	$(selector).html(html);
}

function allow_drop(event)
{
	if(event.preventDefault) event.preventDefault();
	if(event.stopPropagation) event.stopPropagation();
}

function on_drag_start(event)
{
	last_drag_start=new Date();
	event.dataTransfer.setData("text",event.target.id);
}

function on_rclick(current)
{
	var $current=$(current),inum=$current.data("inum"),snum=$current.data("snum"),sname=$current.data("sname"),on=$current.data("onrclick");
	if(on) smart_eval(on);
	else if(sname!==undefined) { socket.emit('unequip',{slot:sname}); push_deferred("unequip"); }
	else if(snum!==undefined) { socket.emit('bank',{operation:"swap",inv:-1,str:snum,pack:last_rendered_items,reopen:false}); push_deferred("bank"); }
	else if(inum!==undefined)
	{
		if(topleft_npc=="items")
		{
			tut("store");
			socket.emit('bank',{operation:"swap",inv:inum,str:-1,pack:last_rendered_items,reopen:false});
			push_deferred("bank");
		}
		else if(topleft_npc=="merchant")
		{
			var actual=character.items[parseInt(inum)];
			if(!actual) return;
			render_item("#merchant-item",{item:G.items[actual.name],name:actual.name,actual:actual,sell:1,num:parseInt(inum)})
		}
		else if(topleft_npc=="exchange")
		{
			var current=character.items[inum],def=null;
			if(current) def=G.items[current.name];
			if(!def || character.q.exchange) return;
			if(def.quest && exchange_type!=def.quest) return;
			if(def.e)
			{
				if(e_item!==null) return;
				e_item=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				$("#citem"+inum).parent().html("");
				$("#eitem").html(html);
			}
		}
		else if(topleft_npc=="none")
		{
			var current=character.items[inum],def=null;
			if(current) def=G.items[current.name];
			if(!def) return;
			if(p_item!==null) return;
			p_item=inum; cache_i[inum]=-1;
			var html=$("#citem"+inum).all_html();
			$("#citem"+inum).parent().html("");
			$("#pitem").html(html);
		}
		else if(topleft_npc=="locksmith")
		{
			var current=character.items[inum],def=null;
			if(current) def=G.items[current.name];
			if(!def) return;
			if(l_item!==null) return;
			l_item=inum; cache_i[inum]=-1;
			var html=$("#citem"+inum).all_html();
			$("#citem"+inum).parent().html("");
			$("#litem").html(html);
		}
		else if(topleft_npc=="upgrade")
		{
			var current=character.items[inum],def=null;
			if(current) def=G.items[current.name];
			if(!def || character.q.upgrade) return;
			if(def.upgrade)
			{
				if(u_item!==null) return;
				u_item=inum; cache_i[inum]=-1;
				// alert($("#citem"+inum).all_html());
				var html=$("#citem"+inum).all_html();
				$("#citem"+inum).parent().html("");
				// $("#uweapon").html(html);
				$("#uweapon").replaceWith(item_container({draggable:false,droppable:false,cid:'uweapon',pui:true,skin:G.items[character.items[u_item].name].skin},character.items[u_item]));
				if(u_scroll!==null || u_offering!==null) upgrade(u_item,u_scroll,u_offering,null,true);
			}
			if(def.type=="uscroll" || def.type=="pscroll")
			{
				if(u_scroll!==null) return;
				u_scroll=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				if((character.items[inum].q||1)<2)
					$("#citem"+inum).parent().html("");
				$("#uscroll").html(html);
				if(u_item!==null) upgrade(u_item,u_scroll,u_offering,null,true);
			}
			if(def.type=="offering" || def.offering!==undefined)
			{
				if(u_offering!==null) return;
				u_offering=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				if((character.items[inum].q||1)<2)
					$("#citem"+inum).parent().html("");
				$("#uoffering").html(html);
				if(u_item!==null) upgrade(u_item,u_scroll,u_offering,null,true);
			}
		}
		else if(topleft_npc=="compound")
		{
			var current=character.items[inum],def=null;
			if(current) def=G.items[current.name];
			if(!def || character.q.compound) return;
			if(def.compound && c_last<3)
			{
				c_items[c_last]=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				$("#citem"+inum).parent().html("");
				$("#compound"+c_last).html(html);
				c_last++;
				if(c_last==3 && c_scroll!==null) compound(c_items[0],c_items[1],c_items[2],c_scroll,c_offering,null,true);
			}
			if(def.type=="cscroll")
			{
				if(c_scroll!==null) return;
				c_scroll=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				if((character.items[inum].q||1)<2)
					$("#citem"+inum).parent().html("");
				// $("#cscroll").html(html);
				$("#cscroll").replaceWith(item_container({draggable:false,droppable:false,cid:'cscroll',pui:true,skin:G.items[character.items[c_scroll].name].skin},character.items[c_scroll]));
				if(c_last==3 && c_scroll!==null) compound(c_items[0],c_items[1],c_items[2],c_scroll,c_offering,null,true);
			}
			if(def.type=="offering")
			{
				if(c_offering!==null) return;
				c_offering=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				if((character.items[inum].q||1)<2)
					$("#citem"+inum).parent().html("");
				$("#coffering").html(html);
				if(c_last==3 && c_scroll!==null) compound(c_items[0],c_items[1],c_items[2],c_scroll,c_offering,null,true);
			}
		}
		else if(topleft_npc=="craftsman")
		{
			var current=character.items[inum],def=null;
			if(current) def=G.items[current.name];
			if(!def) return;
			if(cr_last<9)
			{
				cr_items[cr_last]=inum; cache_i[inum]=-1;
				var html=$("#citem"+inum).all_html();
				$("#citem"+inum).parent().html("");
				$("#critem"+cr_last).html(html);
				cr_last++;
			}
		}
		else if(topleft_npc=="dismantler")
		{
			if(ds_item!==null) return;
			ds_item=inum; cache_i[inum]=-1;
			var html=$("#citem"+inum).all_html();
			if((character.items[inum].q||1)<2)
				$("#citem"+inum).parent().html("");
			$("#dsitem").html(html);
		}
		else
		{
			inum=parseInt(inum,10);
			if(0 && character && character.items[inum] && G.items[character.items[inum].name].type=="elixir") return;
			socket.emit('equip',{num:inum});
			push_deferred("equip");
		}
	}
}

// original_on_drop=on_drop; on_drop=function(event){ event.stopPropagation(); original_on_drop(event); }

function on_drop(event) {
	if(event.preventDefault) event.preventDefault();
	if(event.stopPropagation) event.stopPropagation();
	var data = event.dataTransfer.getData("text"),swap=false,move=false;
	var element=$(document.getElementById(data)),target=$(event.target);
	while(target && target.parent() && target.attr('ondrop')==undefined) target=target.parent();
	var cnum=target.data("cnum"),slot=target.data("slot"),strnum=target.data("strnum"),trigrc=target.data("trigrc"),skid=target.data("skid"); // containers
	var inum=element.data("inum"),sname=element.data("sname"),snum=element.data("snum"),skname=element.data("skname"); // items + skills

	// console.log(cnum+" "+inum+" "+slot+" "+sname+" skid: "+skid+" skname: "+skname);

	if(inum!=undefined && character.items[parseInt(inum)] && character.items[parseInt(inum)].name=="placeholder")
		return false;
	if(cnum!=undefined && character.items[parseInt(cnum)] && character.items[parseInt(cnum)].name=="placeholder")
		return false;
	

	if(inum!==undefined && skid!==undefined)
	{
		inum=parseInt(inum);
		if((inum || inum===0) && character.items[inum])
		{
			keymap[skid]={"type":"item","name":character.items[inum].name};
			set_setting(real_id,"keymap",keymap);
			render_skills(); render_skills();
		}
	}
	else if(skname!==undefined && skid!==undefined)
	{
		if(skname=="eval") keymap[skid]={"name":"eval","code":"add_log('Empty eval','gray')"};
		else if(skname=="snippet") keymap[skid]={"name":"snippet","code":"game_log('Empty snippet','gray')"};
		else if(skname=="throw")
		{
			var num=0,change=true;
			while(change) { change=false; for(var id in keymap) if(keymap[id] && keymap[id].name && keymap[id].name=="throw" && keymap[id].num==num) num++,change=true; }
			keymap[skid]={"name":"throw","num":num};
		}
		else keymap[skid]=skname;
		set_setting(real_id,"keymap",keymap);
		render_skills(); render_skills();
	}
	else if(trigrc!=undefined && inum!=undefined)
	{
		on_rclick(element.get(0));
	}
	else if(snum!=undefined && strnum!=undefined) // render_items_npc swap - storage to storage
	{
		socket.emit("bank",{operation:"move",a:snum,b:strnum,pack:last_rendered_items});
		swap=true;
		push_deferred("bank");
	}
	else if(strnum!=undefined && inum!=undefined) // inventory to storage
	{
		socket.emit("bank",{operation:"swap",inv:inum,str:strnum,pack:last_rendered_items});
		move=true;
		tut("store");
		push_deferred("bank");
	}
	else if(cnum!=undefined && snum!=undefined) // storage to inventory
	{
		socket.emit("bank",{operation:"swap",inv:cnum,str:snum,pack:last_rendered_items});
		move=true;
		push_deferred("bank");
	}
	else if(cnum!==undefined && cnum==inum)
	{
		if(is_mobile && mssince(last_drag_start)<300) inventory_click(parseInt(inum));
	}
	else if(cnum!=undefined && inum!=undefined)
	{
		socket.emit("imove",{a:cnum,b:inum}); push_deferred("imove");
		swap=true;
		cache_i[cnum]=cache_i[inum]=-1;
	}
	else if(sname!==undefined && sname==slot) // drop in the same slot
	{
		if(is_mobile && mssince(last_drag_start)<300) slot_click(slot);
	}
	else if(cnum!=undefined && sname!=undefined)
	{
		socket.emit('unequip',{slot:sname,position:cnum}); push_deferred("unequip");
		// swap=true; #GTODO: Implement position
	}
	else if(slot!=undefined && inum!=undefined)
	{
		if(in_arr(slot,trade_slots))
		{
			if(character.slots[slot]) return;
			try{
				var actual=character.items[parseInt(inum)];
				render_item("#topleftcornerdialog",{trade:1,item:G.items[actual.name],actual:actual,num:parseInt(inum),slot:slot});
				$(".editable").focus();
				dialogs_target=xtarget||ctarget;
			}catch(e)
			{
				console.log("TRADE-ERROR: "+e);
			}
		}
		else
		{
			socket.emit('equip',{num:inum,slot:slot}),move=true,cache_slots[slot]=-1;
			push_deferred("equip");
		}
	}

	if(swap)
	{
		var e_html=element.all_html(),t_html=target.html();
		target.html('');
		element.parent().html(t_html);
		target.html(e_html);
	}

	if(move)
	{
		target.html(element.all_html());
	}
}

function item_container(item,actual)
{
	var html="",styles="",space=3,item_prop="",container_prop="",rclick="",cnum="",bcolor=item.bcolor||"gray",xbcolor="#C5C5C5",classes="",size=item.size||40,def=null,pompous=false,xstyles="";
	if(actual && actual.name) def=G.items[actual.name]||G.items.placeholder_m;
	if(actual && def)
	{
		if((def.upgrade && actual.level>8 || def.compound && actual.level>4)) bcolor=xbcolor;
		if(bcolor=="gray" && (def.special || calculate_item_grade(actual)==2 || calculate_item_value(actual)>5000000))
		{
			bcolor=xbcolor;
			pompous=true;
		}
	}
	if(def && actual && def.type=="booster" && actual.level) bcolor=xbcolor;

	if(item.draggable || !("draggable" in item))
	{
		item_prop+=" draggable='true' ondragstart='on_drag_start(event)'";
		container_prop+="ondrop='on_drop(event)' ondragover='allow_drop(event)'";
	}
	if(item.droppable)
	{
		item.trigrc=true;
		container_prop+="ondrop='on_drop(event)' ondragover='allow_drop(event)'";
	}
	if(item.onclick)
	{
		if(item.draggable)
		{
			container_prop+=' onclick="'+item.onclick+'" class="clickable" ';
			if(item.onmousedown) container_prop+=' onmousedown="'+item.onmousedown+'"'; // to handle middle clicks
		}
		else container_prop+=' onmousedown="'+item.onclick+'" ontouchstart="'+item.onclick+'" class="clickable" ';
	}

	// cls="rotate12";
	if(item.cnum!=undefined) cnum="data-cnum='"+item.cnum+"' ";
	if(item.trigrc!=undefined) cnum="data-trigrc='1'"; // on_drop, just trigger on_rclick
	if(item.strnum!=undefined) cnum="data-strnum='"+item.strnum+"' "; // render_items_npc - slot
	if(item.slot!=undefined) cnum="data-slot='"+item.slot+"' ";
	if(item.skid!=undefined) cnum="data-skid='"+item.skid+"' ";
	if(item.cid) container_prop+=" id='"+item.cid+"' ";

	if(!item.skin && item.loader) xstyles="overflow: hidden;"

	html+="<div "+cnum+"style='position: relative; display:inline-block; margin: 2px; border: 2px solid "+bcolor+"; height: "+(size+2*space)+"px; width: "+(size+2*space)+"px; background: black; vertical-align: top; "+xstyles+"' "+container_prop+">";

	if(item.pui)
	{
		var chance="%??.??",ccolor="#299C4C",roll="#00.00";
		if(item.pui.chance)
		{
			var res=set_uchance(item.pui.chance,true);
			ccolor=res[0]; chance=res[1];
			roll=set_uroll(item.pui,true);
		}
		//html+="<div style='position: absolute; top: -2px; left: 52px; font-size: 16px; border: 2px solid gray; width: 38px; padding: 2px; color: "+ccolor+"' class='uchance'>"+chance+"</div>";
		//html+="<div style='position: absolute; top: 23px; left: 52px; font-size: 16px; border: 2px solid gray; width: 38px; padding: 2px; color: gray' class='uroll'>"+roll+"</div>";
		html+="<div style='position: absolute; top: -2px; left: 52px; font-size: 24px; width: 50px; border: 2px solid gray; line-height: 16px; text-align: right; padding: 2px; color: "+ccolor+"' class='uchance'>"+chance+"</div>";
		html+="<div style='position: absolute; top: 24px; left: 52px; font-size: 24px; width: 50px; border: 2px solid gray; line-height: 16px; text-align: right; padding: 2px; color: gray' class='uroll'>"+roll+"</div>";
	}

	if(item.skid && !item.skin) html+="<div class='truui' style='border-color: gray; color: white'>"+item.skid+"</div>"; // Skill ID

	if(item.shade)
	{
		if(!G.positions[item.shade]) item.shade="placeholder";
		var spack=G.imagesets[G.positions[item.shade][0]||"pack_20"],sscale=size/spack.size;
		var sx=G.positions[item.shade][1],sy=G.positions[item.shade][2];
		html+="<div style='position: absolute; top: -2px; left: -2px; padding:"+(space+2)+"px;'>";
			html+="<div style='overflow: hidden; height: "+(size)+"px; width: "+(size)+"px;'>";
			// Previous default s_op was 0.2 [12/07/18]
			html+="<img style='width: "+(spack.columns*spack.size*sscale)+"px; height: "+(spack.rows*spack.size*sscale)+"px; margin-top: -"+(sy*size)+"px; margin-left: -"+(sx*size)+"px; opacity: "+(item.s_op||0.36)+";' src='"+spack.file+"' draggable='false' />";
			html+="</div>";
		html+="</div>";
	}

	if(item.skin)
	{
		if(!G.positions[item.skin]) item.skin="placeholder";
		var pack=G.imagesets[G.positions[item.skin][0]||"pack_20"],x=G.positions[item.skin][1],y=G.positions[item.skin][2];
		var scale=size/pack.size
		if(actual && actual.level && actual.level>7) classes+=" glow"+min(item.level,10);
		if(item.num!=undefined) rclick="class='rclick"+classes+"' data-inum='"+item.num+"'";
		if(item.snum!=undefined) rclick="class='rclick"+classes+"' data-snum='"+item.snum+"'";// render_items_npc - item
		if(item.sname!=undefined) rclick="class='rclick"+classes+"' data-sname='"+item.sname+"'";
		if(item.skname!=undefined) rclick="class='rclick"+classes+"' data-skname='"+item.skname+"'";
		if(item.on_rclick) rclick="class='rclick"+classes+"' data-onrclick=\""+item.on_rclick+'"';
		html+="<div "+rclick+" style='background: black; position: absolute; bottom: -2px; left: -2px; border: 2px solid "+bcolor+";";
		html+="padding:"+(space)+"px; overflow: hidden' "+("id='"+(item.id||("rid"+randomStr(12)))+"'")+" "+item_prop+">"; // overflow:hidden for .skidloader
		// the "rid" / random id seems to be needed, on_drop gets elements by id - couldn't work around it without a deep re-analysis [22/06/18]
			html+="<div style='overflow: hidden; height: "+(size)+"px; width: "+(size)+"px;'>";
			html+="<img style='width: "+(pack.columns*pack.size*scale)+"px; height: "+(pack.rows*pack.size*scale)+"px; margin-top: -"+(y*size)+"px; margin-left: -"+(x*size)+"px;' src='"+pack.file+"' draggable='false' />";
			html+="</div>";
			if(actual && actual.name=="monsterbox")
			{
				var xx=G.positions["egg2"][1],yy=G.positions["egg2"][2]
				html+="<div style='overflow: hidden; height: "+(size/2)+"px; width: "+(size/2)+"px; z-index: 1; position: absolute; top: 3px; left: 13px'>";
				html+="<img style='width: "+(pack.columns*pack.size*scale/2)+"px; height: "+(pack.rows*pack.size*scale/2)+"px; margin-top: -"+(yy*size/2)+"px; margin-left: -"+(xx*size/2)+"px;' src='"+pack.file+"' draggable='false' />";
				html+="</div>";
			}
		if(actual)
		{
			var prefix="u";
			if(def && def.compound) prefix="c";
			if(actual.c)
			{
				html+="<div class='iuui' style='color: white'>"+actual.c+"</div>";
			}
			else if(actual.q && actual.left)
			{
				html+="<div class='iuui' style='color: white'>"+actual.q+"</div>";
			}
			else if(actual.q && actual.q!=1)
			{
				if(actual.b) html+="<div class='iqui gray'>"+actual.q+"</div>";
				else if(def && def.debuff) html+="<div class='iqui iqdbf'>"+actual.q+"</div>";
				else if(def && def.gives && def.gives[0] && def.gives[0][0]=="hp") html+="<div class='iqui iqhp'>"+actual.q+"</div>";
				else if(def && def.gives && def.gives[0] && def.gives[0][0]=="mp") html+="<div class='iqui iqmp'>"+actual.q+"</div>";
				else html+="<div class='iqui'>"+actual.q+"</div>";
			}
			if(actual.level)
			{
				var level=actual.level,clevel=level;
				if(def.type=="booster") clevel=level=(actual.level==1&&"A"||actual.level==2&&"B"||actual.level==3&&"C"||actual.level==4&&"D"||actual.level==5&&"E"||actual.level>5&&"W");
				if(pompous && def.compound && clevel==3) clevel=4;
				if(pompous && def.upgrade && clevel==7) clevel=8;
				html+="<div class='iuui "+prefix+"level"+(min(clevel,def.compound&&5||12)||clevel)+"' style='border-color: "+bcolor+"'>"+(level==10&&"X"||level==11&&"Y"||level==12&&"Z"||level==5&&prefix=="c"&&"V"||level==6&&prefix=="c"&&"S"||level==7&&prefix=="c"&&"R"||level)+"</div>";
			}
			if(actual.s) html+="<div class='iqui'>"+actual.s+"</div>";
		}
		if(item.slot && in_arr(item.slot,trade_slots) || item.trade_for_ui)
		{
			if(actual && actual.giveaway) html+="<div class='truui igu' style='border-color: "+bcolor+";'>@</div>";
			else if(actual && actual.b) html+="<div class='truui ibu' style='border-color: "+bcolor+";'>?</div>";
			else html+="<div class='truui itu' style='border-color: "+bcolor+";'>$</div>";//€
		}
		else if(actual && actual.l && !item.slot)
		{
			if(actual.l=="s") html+="<div class='truui ilsu' style='border-color: "+bcolor+";'>S</div>";
			else if(actual.l=="u") html+="<div class='truui iluu' style='border-color: "+bcolor+";'>U</div>";
			else html+="<div class='truui ixu' style='border-color: "+bcolor+";'>X</div>";
		}
		if(actual && actual.v) html+="<div class='trruui ivu' style='border-color: "+bcolor+"; line-height: 7px'><br />^</div>";
		else if(actual && actual.m) html+="<div class='trruui imu' style='border-color: "+bcolor+";'>M</div>";
		if(item.loader)
		{
			html+="<div class='loader"+item.loader+"' style='position: absolute; bottom: 0px; right: 0px; width: 3px; height: 0px; background-color: yellow'></div>"
		}
		if(item.skid) // Skill ID
		{
			html+="<div class='skidloader"+item.skid+"' style='position: absolute; bottom: 0px; right: 0px; width: 4px; height: 0px; background-color: yellow'></div>"
			html+="<div class='truui' style='border-color: gray; color: white'>"+item.skid+"</div>";
			if(actual && actual.name=="throw")
			{
				html+="<div class='iqui'>["+(actual.num||0)+"]</div>";
			}
		}
		html+="</div>";
	}

	if(!item.skin && item.loader)
	{
		html+="<div class='loader"+item.loader+"' style='position: absolute; bottom: 0px; left: 0px; width: 52px; height: 0px; background-color: yellow;'></div>"
	}


	if(!item.skin && item.level)
	{
		var level=item.level,clevel=level,def=G.items[item.iname],prefix="u";
		if(def && def.compound) prefix="c";
		if(def.type=="booster") clevel=level=(level==1&&"A"||level==2&&"B"||level==3&&"C"||level==4&&"D"||level==5&&"E"||level>5&&"W");
		if(pompous && def.compound && clevel==3) clevel=4;
		if(pompous && def.upgrade && clevel==7) clevel=8;
		html+="<div class='iuui "+prefix+"level"+(min(clevel,def.compound&&5||12)||clevel)+"' style='border-color: "+bcolor+"'>"+(level==10&&"X"||level==11&&"Y"||level==12&&"Z"||level==5&&prefix=="c"&&"V"||level)+"</div>";
	}

	html+="</div>";
	return html;
}

function render_skillbar(empty)
{
	if(empty){ $("#skillbar").html("").hide(); return; }
	// $("#topmid").html("");
	var html="<div style='background-color: black; border: 5px solid gray; padding: 2px; display: inline-block' class='enableclicks'>",i=0;
	skillbar.forEach(function(id){
		var current=keymap[id],skin=current;
		if(current)
		{
			if(current && current.skin) skin=current.skin;
			else if(current.type=="item" && G.items[current.name]) skin=G.items[current.name].skin;
			else if(G.skills[current.name||current]) skin=G.skills[current.name||current].skin;
			html+=item_container({skid:id,skin:skin||"",draggable:false,droppable:true,onclick:"on_skill('"+id+"')"},current);
		}
		else html+=item_container({skid:id,draggable:false,droppable:true});
		if(!(skillbar.length>=8 && !(skillbar.length%2) && !(i%2))) html+="<div></div>";
		i++;
	});
	html+="</div>"
	$("#skillbar").html(html).css("display","inline-block");
	restart_skill_tints();
	// $("#topmid").show().html(html);
}

function skill_click(slot)
{
	if(skillsui && keymap[slot]) render_skill("#skills-item",keymap[slot].name||keymap[slot],keymap[slot]);
	if(G.skills[slot]) render_skill("#skills-item",slot);
}

var skills_page="I";
function render_skills()
{
	if(skillsui)
	{
		$(".skillsui").hide();
		$("#theskills").remove();
		skillsui=false;
		render_skillbar();
		return;
	}
	var last=0,right_style='text-align: right';
	var html="<div id='skills-item' class='rendercontainer' style='display: inline-block; vertical-align: top; margin-right: 5px'></div>"
	html+="<div style='background-color: black; border: 5px solid gray; padding: 2px; font-size: 24px; display: inline-block'>";
		html+="<div class='textbutton' style='margin-left: 5px'><span  onclick='btc(event); show_snippet()'>MAPPING</span> <span style='color: "+(skills_page=="I"&&"#76BDE5"||"#7C7C7C")+";' class='clickable' onclick='btc(event); skills_page=\"I\"; render_skills(); render_skills();'>1</span> <span style='color: "+(skills_page=="II"&&"#E38241"||"#7C7C7C")+";' class='clickable' onclick='btc(event); skills_page=\"II\"; render_skills(); render_skills();'>2</span> <span style='color: "+(skills_page=="U"&&"#8FCE72"||"#7C7C7C")+";' class='clickable' onclick='btc(event); skills_page=\"U\"; render_skills(); render_skills();'>U</span><!-- <span style='float:right; color: #7C7C7C; margin-right: 5px' class='clickable' onclick='btc(event); show_json(keymap)'><span style='color:#DECE31'>&gt;</span> DATA <span style='color:#DECE31'>&lt;</span></span>--></div>";
		var km1=["1","2","3","4","5","6","7"],km2=["Q","W","E","R","X","T","B"];
		if(skills_page=="II") km1=["8","9","0","G","H","J","K"],km2=["SHIFT","Z","V","M","P","D","BACK"];
		if(skills_page=="U") km1=["ESC","A","C","F","I","TAB","ENTER"],km2=["UP","LEFT","DOWN","RIGHT",",","S","U"];
		html+="<div>";
			km1.forEach(function(N){
				var current=keymap[N],skin=current;
				if(current && current.skin) skin=current.skin;
				else if(current && current.type=="item" && G.items[current.name]) skin=G.items[current.name].skin;
				else if(current && G.skills[current.name||current]) skin=G.skills[current.name||current].skin;
				html+=item_container({skid:N,skin:skin||"",onclick:"on_skill('"+N+"')"},current);
			});
		html+="</div>";
		html+="<div>";
			km2.forEach(function(N){
				var current=keymap[N],skin=current;
				if(current && current.skin) skin=current.skin;
				else if(current && current.type=="item" && G.items[current.name]) skin=G.items[current.name].skin;
				else if(current && G.skills[current.name||current]) skin=G.skills[current.name||current].skin;
				html+=item_container({skid:N,skin:skin||"",onclick:"on_skill('"+N+"')"},current);
			});
		html+="</div>";
		html+="<div class='textbutton' style='margin-left: 5px'><span class='clickable' onclick='btc(event); show_json(G.skills)'>SKILLS</span><!-- <span style='float:right; color: #7C7C7C; margin-right: 5px' class='clickable' onclick='btc(event); show_modal($(\"#keymapguide\").html())'><span style='color:#60B8C7'>&gt;</span> CONFIG <span style='color:#60B8C7'>&lt;</span></span>--></div>";
		var s=[],slast=0,a=[],alast=0;
		object_sort(G.skills).forEach(function(io){
			var name=io[0],skill=io[1];
			if(skill.slot)
			{
				var found=false;
				skill.slot.forEach(function(p){
					if(character.slots[p[0]] && character.slots[p[0]].name==p[1]) found=true;
				});
				if(!found) return;
			}
			if(skill.inventory)
			{
				var found=false;
				skill.inventory.forEach(function(p){
					for(var i=0;i<42;i++)
					{
						if(character && character.items[i] && character.items[i].name==p)
							found=true;
					}
				});
				if(!found) return;
			}
			if(skill.type=="skill" && (!skill['class'] || in_arr(character.ctype,skill['class']) || character.role=="gm"))
				s.push({name:name});
			if(skill.type=="passive" && (!skill['class'] || in_arr(character.ctype,skill['class']) || character.role=="gm"))
				s.push({name:name});
			if(skill.type=="ability" && (!skill['class'] || in_arr(character.ctype,skill['class']) || character.role=="gm"))
				a.push({name:name});
			if(skill.type=="utility" && skill.ui!==false && (!skill['class'] || in_arr(character.ctype,skill['class'])))
				a.push({name:name});
		});
		if(character.role=="gm") a.push({name:"gm"});
		// html+="<div style='border-bottom: 5px solid gray; margin-bottom: 2px; margin-left: -5px; margin-right: -5px'></div>";
		for(var i=0;i<10;i++)
		{
			html+="<div>"
			for(var j=0;j<7;j++)
			{
				if(slast<s.length) html+=item_container({skin:G.skills[s[slast].name].skin,onclick:"skill_click('"+s[slast].name+"')",skname:s[slast].name},s[slast]);
				else html+=item_container({});
				slast++;
			}
			html+="</div>";
			if(slast>=s.length) break; // i && 
		}
		html+="<div class='textbutton' style='margin-left: 5px' onclick='btc(event); show_json(G.skills)'>ABILITIES</div>";
		// html+="<div style='border-bottom: 5px solid gray; margin-bottom: 2px; margin-left: -5px; margin-right: -5px'></div>";
		for(var i=0;i<10;i++)
		{
			html+="<div>"
			for(var j=0;j<7;j++)
			{
				if(alast<a.length) html+=item_container({skin:G.skills[a[alast].name].skin,onclick:"skill_click('"+a[alast].name+"')",skname:a[alast].name},a[alast]);
				else html+=item_container({});
				alast++;
			}
			html+="</div>";
			if(alast>=a.length) break;
		}
	html+="</div>";
	skillsui=true;
	render_skillbar(1);
	$("body").append("<div id='theskills' style='position: fixed; z-index: 310; bottom: 0px; right: 0px' class='disableclicks bpclicks'></div>");
	$(".skillsui").show();
	$("#theskills").html(html);
	restart_skill_tints();
}

function show_condition(name)
{
	var def=G.conditions[name];
	show_modal(render_item("html",{skin:def.skin,item:def,prop:def}),{wrap:false});
}

function render_all_skills_and_conditions()
{
	var last=0,right_style='text-align: right';
	var html="";
	html+="<div style='background-color: black; border: 5px solid gray; padding: 14px; font-size: 24px; display: inline-block; max-width: 640px'>";
	// html+="<div style='padding: 10px; color: #CC863B; text-align: center'>Work in Progress</div>";
	["ranger","rogue","warrior","mage","priest","paladin","merchant"].forEach(function(ctype){
		html+="<div>"+ctype.toTitleCase()+"</div>";
		object_sort(G.skills).forEach(function(s){
			var name=s[0],skill=s[1];
			if(skill['class'] && skill['class'].includes(ctype))
			{
				html+=item_container({skin:skill.skin,onclick:"render_skill('','"+s[0]+"')"});
			}
		});
	});
	html+="<div>Item Skills</div>";
	object_sort(G.skills).forEach(function(s){
		var name=s[0],skill=s[1];
		if(skill.slot)
		{
			html+=item_container({skin:skill.skin,onclick:"render_skill('','"+s[0]+"')"});
		}
	});
	html+="<div>Abilities and Utilities</div>";
	object_sort(G.skills).forEach(function(s){
		var name=s[0],skill=s[1];
		if(skill.type=="ability" || skill.type=="utility")
		{
			html+=item_container({skin:skill.skin,onclick:"render_skill('','"+s[0]+"')"});
		}
	});
	function render_cnd(name,condition)
	{
		html+="<div style='display: inline-block; width: 280px'>"+item_container({skin:condition.skin,onclick:"show_condition('"+name+"')"})+"<div style='display: inline-block'>"+condition.name+"<br /><span style='color: gray'>\""+name+"\"</span></div></div>";
	}
	html+="<div>Buffs</div>";
	object_sort(G.conditions).forEach(function(c){
		var name=c[0],condition=c[1];
		if(condition.buff)
			render_cnd(name,condition);
	});
	html+="<div>Debuffs</div>";
	object_sort(G.conditions).forEach(function(c){
		var name=c[0],condition=c[1];
		if(condition.debuff)
			render_cnd(name,condition);
	});
	html+="<div>Conditions</div>";
	object_sort(G.conditions).forEach(function(c){
		var name=c[0],condition=c[1];
		if(!condition.debuff && !condition.buff && !condition.technical)
			render_cnd(name,condition);
	});
	html+="<div>Technical</div>";
	object_sort(G.conditions).forEach(function(c){
		var name=c[0],condition=c[1];
		if(condition.technical)
			render_cnd(name,condition);
	});
	html+="</div>";
	show_modal(html,{wrap:false,hideinbackground:true,url:"/docs/guide/all/skills_and_conditions"});
}

function render_teleporter()
{
	var html="<div style='max-width: 420px; text-align: center' class='cxmodalteleporter'>";
	for(var id in G.maps)
	{
		if(!G.maps[id].ignore && !G.maps[id].instance)
		{
			html+="<div class='gamebutton' style='margin-left: 5px; margin-bottom: 5px' onclick='socket.emit(\"transport\",{to:\""+id+"\"}); push_deferred(\"transport\")'>"+G.maps[id].name+"</div>";
		}
	}
	html+="</div>";
	if(!$('.cxmodalteleporter').length) show_modal(html,{wrap:false});
}

function render_travel(the_map)
{
	var html="<div style='max-width: 420px; text-align: center' class='cxmodalteleporter' onclick='hide_modal()'>";
	var one=false,places=false;
	if(!the_map) the_map=character['map'],places=true;
	(G.maps[the_map].npcs||[]).forEach(function(def){
		var npc=G.npcs[def.id];
		if(!in_arr(npc.role,["citizen","guard","pvp_announcer"]))
		{
			if(!one)
			{
				one=true;
				html+="<div class='gamebutton' onclick='stpr(event);' style='cursor:inherit !important'>NPCs in "+G.maps[the_map].name+"</div><div></div>";
			}
			var position=def.position||def.positions[0];
			html+="<div style='display:inline-block; margin: 5px; text-align: center' class='clickable' onclick='hide_modal(); code_move("+position[0]+","+(position[1]+20)+");'><div style='border: 2px solid gray; background-color: #464973; height: 54px; width: 54px; display: inline-block'>"+sprite(npc.skin,{width:50,height:50,cx:npc.cx})+"</div><div></div><div class='tinybutton' style='margin-top: -6px'>"+npc.name+"</div></div>";
		}
	});
	var parsed={},packs={};
	object_sort(G.maps,"random").forEach(function(e){
		var name=e[0],map=e[1];
		if(map.ignore) return;
		cshuffle(map.monsters||[]).forEach(function(pack){
			if(name!=the_map && !pack.boundaries || parsed[pack.type]) return;
			if(pack.boundaries)
			{
				cshuffle(pack.boundaries).forEach(function(b){
					if(b[0]!=the_map || parsed[pack.type]) return;
					parsed[pack.type]=true;
					packs[pack.type]={type:pack.type,x:b[1],y:b[2],hp:G.monsters[pack.type].hp}
				});
			}
			else
			{
				parsed[pack.type]=true;
				packs[pack.type]={type:pack.type,x:pack.boundary[0],y:pack.boundary[1],hp:G.monsters[pack.type].hp};
			}
		});
	});
	if(Object.keys(packs).length)
	{
		html+="<div></div><div class='gamebutton' onclick='stpr(event);' style='cursor:inherit !important'>Monsters in "+G.maps[the_map].name+"</div><div></div>";
		html+="<div style='margin: 8px'>";
			object_sort(packs,"hpsort").forEach(function(e){
				if((G.monsters[e[0]].cute || G.monsters[e[0]].stationary) && !G.monsters[e[0]].achievements) return;
				html+="<div style='display:inline-block'>";
					html+="<div style='background-color:#575983; border: 2px solid #9F9FB0; display: inline-block; margin: 2px; /*"+e[0]+"*/' class='clickable' onclick='pcs(event); code_move("+e[1].x+","+e[1].y+")'>";
					html+=sprite(e[0],{scale:1.5});
					html+="</div>";
					html+="<div></div><div class='tinybutton' style='margin-top: -6px'>"+G.monsters[e[0]].name+"</div>";
				html+="</div>";
			});
		html+="</div>";
	}
	if(places)
	{
		html+="<div></div><div class='gamebutton' onclick='stpr(event);' style='cursor:inherit !important'>Places</div><div></div>";
		object_sort(G.maps).forEach(function(io){
			var id=io[0];
			if(!G.maps[id].ignore && !G.maps[id].unlist && !G.maps[id].instance && !G.maps[id].irregular && (G.maps[id].world||"")==(window.world||"") && (!G.maps[id].event || (G.maps[id].event||"")==(window.current_event||"")))
			{
				html+="<div class='gamebutton' style='margin: 4px' onclick='hide_modal(); code_travel(\""+id+"\");'>"+G.maps[id].name+"</div>";
			}
		});
	}
	html+="</div>";
	if(!$('.cxmodalteleporter').length) show_modal(html,{wrap:false}); //true,styles:"background-color:#ABACB6",wwidth:420});
}

function render_gtravel() // gm monster travel
{
	var html="<div style='max-width: 420px; text-align: center' class='cxmodalteleporter'>",f="render_spawns";
	object_sort(G.maps).forEach(function(io){
		var id=io[0];
		if(!G.maps[id].ignore && !G.maps[id].instance)
		{
			html+="<div class='gamebutton' style='margin-left: 5px; margin-bottom: 5px' onclick='hide_modal(); "+f+"(\""+id+"\");'>"+G.maps[id].name+"</div>";
		}
	});
	html+="</div>";
	if(!$('.cxmodalteleporter').length) show_modal(html,{wrap:false});
}

function render_gmonsters(t)
{
	var html="<div style='max-width: 420px; text-align: center'>";
	object_sort(G.monsters).forEach(function(io){
		var id=io[0];
		html+="<div class='gamebutton' style='margin-left: 5px; margin-bottom: 5px' onclick='hide_modal(); socket.emit(\"gm\",{action:\"mjump\",monster:\""+id+"\"});'>"+G.monsters[id].name+"</div>";
	});
	html+="</div>";
	show_modal(html,{wrap:false});
}

function render_spawns(id)
{
	var html="<div style='max-width: 420px; text-align: center'>",i=0;
	G.maps[id].spawns.forEach(function(io){
		html+="<div class='gamebutton' style='margin-left: 5px; margin-bottom: 5px' onclick='direct_travel(\""+id+"\",\""+i+"\"); hide_modal()'>"+id+"["+i+"]</div>";
		i++;
	});
	html+="</div>";
	show_modal(html,{wrap:false});
}


function render_interaction(type,sub_type,args)
{
	if(!args) args={};
	if(sub_type!="return_html")
	{
		topleft_npc="interaction"; rendered_target=topleft_npc; rendered_interaction=type;
	}
	var left=0,top=0,file="/images/tiles/characters/npc1.png",img_type="normal",pass=false;
	var html="<div style='background-color: #E5E5E5; color: #010805; border: 5px solid gray; padding: 6px 12px 6px 12px; font-size: 30px; display: inline-block; max-width: 420px'>";

	//face
	if(type.auto) // likely, this will be the future method [25/07/17]
	{
		file=FC[type.skin];
		left=FM[type.skin][1];
		top=FM[type.skin][0];
		img_type=T[type.skin];
		if(type.dialog) type=type.dialog;
	}
	else if(in_arr(type,["wizard","hardcoretp"]))
	{
		left=2; top=0; file="/images/tiles/characters/chara8.png";
	}
	else if(in_arr(type,["santa","candycane_success"]))
	{
		left=0; top=0; file="/images/tiles/characters/animationc.png"; img_type="animation";
	}
	else if(in_arr(type,["leathers","leather_success"]))
	{
		left=1; top=0; file="/images/tiles/characters/npc5.png";
	}
	else if(in_arr(type,["lostearring","lostearring_success"]))
	{
		left=3; top=0; file="/images/tiles/characters/chara8.png";
	}
	else if(in_arr(type,["mistletoe","mistletoe_success"]))
	{
		left=0; top=0; file="/images/tiles/characters/chara8.png";
	}
	else if(in_arr(type,["crafting"]))
	{
		left=0; top=0; file="/images/tiles/characters/npc5.png";
	}
	else if(in_arr(type,["ornaments","ornament_success"]))
	{
		left=1; top=0; file="/images/tiles/characters/chara8.png";
	}
	else if(in_arr(type,["jailer","guard","blocker","test"]))
	{
		left=3; top=0; file="/images/tiles/characters/chara5.png";
	}
	else if(in_arr(type,["seashells","seashell_success"]))
	{
		left=0; top=1; file="/images/tiles/characters/npc1.png";
	}
	else if(in_arr(type,["lottery"]))
	{
		left=3; top=0; file="/images/tiles/characters/npc6.png";
	}
	else if(in_arr(type,["newupgrade"]))
	{
		left=3; top=1; file="/images/tiles/characters/chara8.png";
	}
	else if(type=="tavern")
	{
		left=0; top=1; file="/images/tiles/characters/custom1.png";
	}
	else if(type=="standmerchant")
	{
		left=3; top=0; file="/images/tiles/characters/npc5.png";
	}
	else if(type=="subscribe")
	{
		left=3; top=1; file="/images/tiles/characters/chara7.png";
	}
	else if(in_arr(type,["gemfragments","gemfragment_success"]))
	{
		left=2; top=1; file="/images/tiles/characters/npc1.png";
	}
	else if(in_arr(type,["buyshells","noshells","yesshells"]))
	{
		left=0; top=1; file="/images/tiles/characters/dwarf2.png";
	}
	else if(in_arr(type,["unlock_items2","unlock_items3","unlock_items4","unlock_items5","unlock_items6","unlock_items7"]))
	{
		left=3; top=1; file="/images/tiles/characters/npc4.png";
		if(type=="unlock_items2") top=1,left=0;
		if(type=="unlock_items3") top=1,left=0;
		if(type=="unlock_items4") top=1,left=2;
		if(type=="unlock_items5") top=1,left=2;
		if(type=="unlock_items6") top=0,left=1;
		if(type=="unlock_items7") top=0,left=1;
	}
	else if(type.startsWith("unlock_")) pass=true;
	else return;
	
	if(pass);
	else if(img_type=="normal" || img_type=="full") html+="<div style='float: left; margin-top: -20px; width: 104px; height: 92px; overflow: hidden'><img style='margin-left: -"+(104*(left*3+1))+"px; margin-top: -"+(144*(top*4))+"px; width: 1248px; height: 1152px;' src='"+file+"'/></div>";
	else html+="<div style='float: left; margin-top: -20px; width: 104px; height: 98px; overflow: hidden'><img style='margin-left: -"+(188*left+40)+"px; margin-top: -"+(200*top+50)+"px; width: 2256px; height: 1600px;' src='"+file+"'/></div>";


	if(type.auto)
	{
		html+=type.message;
		if(type.button) interaction_onclick=type.onclick,html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='interaction_onclick()'>"+type.button+"</div></span>";
		if(type.button2) interaction_onclick2=type.onclick2,html+="<span style='float: right; margin-top: 5px; margin-right: 5px'><div class='slimbutton' onclick='interaction_onclick2()'>"+type.button2+"</div></span>";
	}
	else if(type=="seashells")
	{
		html+="Ah, I love the sea, so calming. As a kid, I loved spending time on the beach. Collecting seashells. If you happen to find some, I would love to add them to my collection.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"seashell\")'>I HAVE 20!</div></span>";
	}
	else if(type=="buyshells")
	{
		html+="Yo dawg, I can hook you up with some shells If you want. I get these directly from Wizard in bulk so they are legit.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_shells_buyer()'>HMM, SURE...</div></span>";
	}
	else if(type=="noshells")
	{
		html+="Ugh, maybe go farm more gold. It's not like they grow on trees. Just kill some puny monsters, you'll have plenty!";
	}
	else if(type=="yesshells")
	{
		html+="Please doing business with you! You'll have your shells in a couple of milliseconds!";
	}
	else if(type=="hardcoretp")
	{
		html+="Aww, are you stuck here? I can take you places. If you want!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_teleporter()'>TELEPORT</div></span>";
	}
	else if(type=="seashell_success")
	{
		if(Math.random()<0.001) html+="Awww. Ty. Ty. Ty. Xoxo.";
		else html+="How kind of you! Please accept this small gift in return.";
		d_text("+1",get_npc("fisherman"),{color:"#DFE9D9"});
	}
	else if(type=="subscribe")
	{
		html+="It's that time of the day! Are you in?!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='socket.emit(\"signup\")'>SIGN ME UP!</div></span>";
	}
	else if(type=="tavern")
	{
		html+="Tavern. A place for adventurers to relax, drink, unwind, play games, wager, challenge each other in friendly games. Currently under construction.";
	}
	else if(type=="test")
	{
		html+="Greetings! Looking for a good deal on weapons and armor? Then you came to the right place! No one sells better gear than me!";
	}
	else if(type=="newupgrade")
	{
		html+="Adventurer! I can upgrade your weapons or armors. Combine 3 accessories to make a stronger one! Tho, beware, the process isn't perfect. Sometimes the items are ... lost.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_upgrade_shrine(1)'>UPGRADE</div> <div class='slimbutton' onclick='render_compound_shrine(1)'>COMBINE</div></span>";
	}
	else if(type=="locksmith")
	{
		html+="Lock - Prevents anything that can destroy an item, selling, upgrading, you name it! Seal - Locks the item in a way that unlocking it takes two days. Unlock - Frees it. Got it? Good. Cost? 250 big ones.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_locksmith(\"lock\")'>LOCK</div> <div class='slimbutton' onclick='render_locksmith(\"seal\")'>SEAL</div> <div class='slimbutton' onclick='render_locksmith(\"unlock\")'>UNLOCK</div></span>";
	}
	else if(type=="crafting")
	{
		html+="I can craft or dismantle items for you. Price differs from item to item. Check out my recipes if you are interested!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_recipes()'>RECIPES</div> <div class='slimbutton' onclick='render_recipes(\"dismantle\")'>RECYCLING</div> <div class='slimbutton' onclick='render_craftsman()'>CRAFT</div> <div class='slimbutton' onclick='render_dismantler()'>DISMANTLE</div></span>";
	}
	else if(type=="wizard")
	{
		html+="Well, Hello there! I'm Wizard, I made this game. Hope you enjoy it. If you have any issues, suggestions, feel free to email me at hello@adventure.land!";
	}
	else if(type=="santa")
	{
		html+="Happy holidays! Please excuse my companion, he is a bit grumpy. If you happen to find any candy canes, that might cheer him up!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"candycane\")'>I HAVE ONE!</div></span>";
	}
	else if(type=="standmerchant")
	{
		html+="Anyone can become a merchant and start trading. You only need a merchant stand to display your items on!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_merchant(get_npc(\"standmerchant\"))'>LET ME BUY ONE!</div></span>";
	}
	else if(type=="candycane_success")
	{
		html+="Ah! Thanks for cheering him up. Here's something for you in return!";
	}
	else if(type=="lostearring")
	{
		html+="Ewww. Ewww. Ewww. These wretched things ate my earrings. Kill them, kill them all. Bring my earrings back!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"lostearring\")'>AS YOU WISH</div></span>";
	}
	else if(type=="lostearring_success")
	{
		html+="You did well. Here's something left from one of my old husbands...";
	}
	else if(type=="mistletoe")
	{
		html+="You know, It gets boring in here sometimes ... I'm looking for some excitement. Uhm, Do you have a Mistletoe?";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"mistletoe\")'>OH MY, I DO!</div></span>";
	}
	else if(type=="mistletoe_success")
	{
		html+="Haha! You thought I was going to give you a kiss?! You wish... Take this instead!";
	}
	else if(type=="ornaments")
	{
		html+="Hmm. We should decorate these trees. I need some Ornaments tho. If you happen to collect "+G.items.ornament.e+" of them, let me know!";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"ornament\")'>YOU GOT IT!</div></span>";
	}
	else if(type=="ornament_success")
	{
		html+="Thank you! Here's something in return."; //Great idea! 
	}
	else if(type=="gemfragment_success")
	{
		html+="Bwahahahahah *cough* Ehem.. Thanks! You got a good deal. Keep bringing these fragments to me, don't give them to anyone else.";
		d_text("+1",get_npc("gemmerchant"),{color:"#E78295"});
	}
	else if(type=="gemfragments")
	{
		html+="Back in the day we had miners, then came the moles, they work for free yet retrieving the gems is a challenge. Bring me "+G.items.gemfragment.e+" gem fragments and I can give you something exciting in return, no questions asked.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"gemfragment\")'>I GOT "+G.items.gemfragment.e+"!</div></span>";
	}
	else if(type=="leathers")
	{
		html+="Hey, hey, hey! What brings you to this cold land? I personally love it here, ideal for my work. If you can bring me "+G.items.leather.e+" Leathers, I can give you one of my products in return.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='render_exchange_shrine(\"leather\")'>I HAVE "+G.items.leather.e+"!</div></span>";
	}
	else if(type=="leather_success")
	{
		html+="Here you go! Enjoy! Keep bringing leathers to me, I have a lot to offer!";
		d_text("+1",get_npc("leathermerchant"),{color:"#DFE9D9"});
	}
	else if(type=="jailer")
	{
		html+="Tu-tu-tu. Have you been a bad "+(Math.random()<0.5&&"boy"||"girl")+"? No worries. The lawmakers must see the potential in you, so instead of getting rid of you, they sent you here. You are free to leave whenever you want. But please don't repeat your mistake.";
		html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='pcs(); socket.emit(\"leave\"); push_deferred(\"leave\")'>LEAVE</div></span>";
	}
	else if(type=="blocker" || type=="guard")
	{
		var roll=Math.random();
		if(roll<0.5) html+="Hmm. hmm. hmm. Can't let you pass. Check again later tho!";
		else html+="There's some work going on inside. Maybe check back later!";
	}
	else if(type=="lottery")
	{
		html+="Hi Dear! The lottery tickets for this week haven't arrived yet. Apologies :)";
	}
	else if(type.startsWith("unlock_"))
	{
		var pack=args.pack,gold=bank_packs[pack][1],shells=bank_packs[pack][2];
		if(is_electron)
		{
			html+="Hello! You don't seem to have an account open with me. Would you like to open one? It costs "+to_pretty_num(gold)+" Gold. We hold onto your items forever.";
			html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='socket.emit(\"bank\",{operation:\"unlock\",gold:1,pack:\""+pack+"\"}); push_deferred(\"bank\");' style='margin-right: 5px;'>PAY "+to_pretty_num(gold)+" GOLD</div></span>";
		}
		else
		{
			html+="Hello! You don't seem to have an account open with me. Would you like to open one? It costs "+to_pretty_num(gold)+" Gold or "+to_pretty_num(shells)+" Shells. We hold onto your items forever.";
			html+="<span style='float: right; margin-top: 5px'><div class='slimbutton' onclick='socket.emit(\"bank\",{operation:\"unlock\",gold:1,pack:\""+pack+"\"}); push_deferred(\"bank\");' style='margin-right: 5px;'>USE GOLD</div><div class='slimbutton' onclick='socket.emit(\"bank\",{operation:\"unlock\",shells:1,pack:\""+pack+"\"}); push_deferred(\"bank\");'>USE SHELLS</div></span>";
		}
	}
	else return;

	html+="</div>";
	if(sub_type=="return_html") return html;
	$("#topleftcornerui").html(html);
}

function load_nearby(fallback)
{
	friends_inside="nearby";
	var html="",someone=false;
	html+=render_com_buttons();
	for(var id in entities)
	{
		var player=entities[id]; if(!is_player(player)) continue;
		someone=true;
	}
	if(someone)
	{
		html+="<table style='margin: 5px; text-align: center'>";
		html+="<tr style='color: gray; text-decoration: underline'><th style='width: 100px'>Name</th><th style='width: 60px'>Level</th><th style='width: 100px'>Class</th><th style='width: 60px'>Age</th><th style='width: 100px'>Status</th><th style='width: 120px'>Actions</th></tr>";
		var l=Object.values(entities);
		l.sort(function(a,b){ if(!a.afk && b.afk) return -1; if(a.afk && !b.afk) return 1; if(a.age<b.age) return -1; if(a.age>b.age) return 1; if(a.name<b.name) return -1; return 1; });
		l.forEach(function(player)
		{
			var afk="AFK",actions=""; if(!is_player(player)) return;
			if(!player.afk) afk="<span style='color: #34bf15'>ACTIVE</span>";
			else if(player.afk=="code") afk="<span style='color: gray'>CODE</span>";
			else if(player.afk=="bot") afk="<span style='color: gray'>BOT</span>";
			//if(!player.party) actions+=" <span style='color: #2799DD'>PM</span>";
			if(player.owner && in_arr(player.owner,friends)) actions+=" <span style='color: #EC82C4'>FRIENDS!</span>";
			else actions+=" <span style='color: #2799DD' class='clickable' onclick='socket.emit(\"friend\",{event:\"request\",name:\""+player.name+"\"}); push_deferred(\"friend\")'>+FRIEND</span>";
			if(!actions) actions="None";
			html+="<tr><td class='clickable' onclick='target_player(\""+player.name+"\")'>"+player.name+"</td><td>"+player.level+"</td><td>"+player.ctype.toUpperCase()+"</td><td>"+player.age+"</td><td>"+afk+"</td><td>"+actions+"</td></tr>";
		});
		html+="</table>";
	}
	else
	{
		if(fallback) return load_server_list();
		html+="<div style='margin-top: 8px'>There is no one nearby.</div>";
	}
	$(".friendslist").html(html);
	$(".friendslist").parent().find(".active2").removeClass("active2");
	$(".fnearby").addClass("active2");
	$(".fnearbyx").addClass("active3");
}

function load_friends(info)
{
	if(info)
	{
		if(friends_inside!="friends") return;
		var html="";
		html+=render_com_buttons();
		if(!info.chars.length && !friends.length) html+="<div style='margin-top: 8px'>You don't have any friends but it's ok. Hang in there! Be kind to other players, get to know them, then friend them from the 'Nearby' tab. Afterwards, you can see when they are online and where they are.</div>";
		else if(!info.chars.length) html+="<div style='margin-top: 8px'>No one online.</div>";
		else
		{
			html+="<table style='margin: 5px; text-align: center'>";
			html+="<tr style='color: gray; text-decoration: underline'><th style='width: 100px'>Name</th><th style='width: 60px'>Level</th><th style='width: 100px'>Class</th><th style='width: 100px'>Status</th><th style='width: 120px'>Server</th></tr>";
			info.chars.sort(function(a,b){ if(!a.afk && b.afk) return -1; if(a.afk && !b.afk) return 1; if(a.age<b.age) return -1; if(a.age>b.age) return 1; if(a.name<b.name) return -1; return 1; });
			info.chars.forEach(function(player){
				var afk="AFK";
				if(!player.afk) afk="<span style='color: #34bf15'>Active</span>";
				html+="<tr><td>"+player.name+"</td><td>"+player.level+"</td><td>"+player.type.toUpperCase()+"</td><td>"+afk+"</td><td>"+player.server+"</td></tr>";
			});
			html+="</table>";
		}
		$(".friendslist").html(html);
	}
	else
	{
		friends_inside="friends";
		api_call("pull_friends");
		//$(".friendslist").html("<div style='margin-top: 8px'>Loading ...</div>");
		$(".friendslist").html(html);
	}
	$(".friendslist").parent().find(".active2").removeClass("active2");
	$(".ffriends").addClass("active2");
	$(".ffriendsx").addClass("active3");
}

function load_server_list(info)
{
	if(info)
	{
		if(friends_inside!="server") return;
		var html="";
		html+=render_com_buttons();
		if(!info.length) html+="<div style='margin-top: 8px'>No one discoverable.</div>";
		else
		{
			html+="<table style='margin: 5px; text-align: center'>";
			html+="<tr style='color: gray; text-decoration: underline'><th style='width: 100px'>Name</th><th style='width: 60px'>Level</th><th style='width: 100px'>Class</th><th style='width: 60px'>Age</th><th style='width: 100px'>Status</th><th style='width: 120px'>Party</th>";
			if(is_pvp) html+="<th style='width: 120px'>Kills</th>";
			html+="</tr>";
			info.sort(function(a,b){ if(!a.afk && b.afk) return -1; if(a.afk && !b.afk) return 1; if(a.age<b.age) return -1; if(a.age>b.age) return 1; if(a.name<b.name) return -1; return 1; });
			info.forEach(function(player){
				var afk="AFK",party=player.party,name=player.name;
				if(!player.afk) afk="<span style='color: #34bf15'>ACTIVE</span>";
				else if(player.afk=="code") afk="<span style='color: gray'>CODE</span>";
				else if(player.afk=="bot") afk="<span style='color: gray'>BOT</span>";
				if(!player.party && player.name!=character.name && player.name!="Hidden")
					party="<span style='color: #34BCAF' class='clickable' onclick='parent.socket.emit(\"party\",{event:\"invite\",name:\""+player.name+"\"}); push_deferred(\"party\")'>Invite</span>";
				else if(player.name=="Hidden") party="<span style='color: #999999'>None</span>";
				else if(!player.party) party="<span style='color: #999999'>You</span>";
				else party="<span style='color: #9F68C0' class='clickable' onclick='parent.socket.emit(\"party\",{event:\"request\",name:\""+player.name+"\"}); push_deferred(\"party\")'>"+player.party+"</span>";
				if(player.name!=character.name && player.name!="Hidden") party+=" <span style='color: #A255BA' class='clickable' onclick='hide_modal(); cpm_window(\""+player.name+"\");'>PM</span>";
				if(name=="Hidden") name="<span style='color:gray'>Hidden</span>";
				html+="<tr><td>"+name+"</td><td>"+player.level+"</td><td>"+player.type.toUpperCase()+"</td><td>"+player.age+"</td><td>"+afk+"</td><td>"+party+"</td>";
				if(is_pvp) html+="<td>"+to_pretty_num(player.kills)+"</td>";
				html+="</tr>";
			});
			html+="</table>";
		}
		$(".friendslist").html(html);
	}
	else
	{
		friends_inside="server";
		socket.emit("players");
		//$(".friendslist").html("<div style='margin-top: 8px'>Loading ...</div>");
		$(".friendslist").html(html);
	}
	$(".friendslist").parent().find(".active2").removeClass("active2");
	$(".fserver").addClass("active2");
	$(".fserverx").addClass("active3");
}

function load_merchants(info)
{
	if(info)
	{
		if(friends_inside!="servers") return;
		var html="";
		if(!info.chars.length) html="<div style='margin-top: 8px'>No merchants with a stand online.</div>";
		else
		{
			html+="<div style='text-align: left; margin: 20px'>";
				info.chars.sort(function(a,b){ if(!a.afk && b.afk) return -1; if(a.afk && !b.afk) return 1; if(a.age<b.age) return -1; if(a.age>b.age) return 1; if(a.name<b.name) return -1; return 1; });
				info.chars.forEach(function(player){
					merchants[player.name]=player;
					html+="<div style='margin-bottom: 20px'>";
						html+="<div style='display: inline-block; margin-right: 20px'>";
							html+=render_slots(player,{pure:true,gallery:true,merchant:true});
						html+="</div>";
						html+="<div style='display: inline-block; vertical-align: top; margin-top: 20px'>";
							html+=sprite(player.skin,{cx:player.cx,scale:2,height:64,width:42});
							html+="<div>"+player.name+"</div>";
							html+="<div>"+G.maps[player.map].name+": <span style='color: gray'>"+parseInt(player.x)+","+parseInt(player.y)+"</span></div>";
							html+="<div style='color: #8AB272'>"+player.server+"</div>";
						html+="</div>";
					html+="</div>";
				});
			html+="</div>"
		}
		$(".friendslist").html(html);
	}
	else
	{
		friends_inside="servers";
		api_call("pull_merchants");
		$(".friendslist").html("");
		$(".friendslist").parent().find(".active2").removeClass("active2");
		$(".fservers").addClass("active2");
	}
}

function load_servers_list(info)
{
	friends_inside="servers";
	var html="<div style='text-align:center'><div style='width:240px; display:inline-block'>";
	html+="<table style='margin: 5px; text-align: left' class='sslist'>";
	html+="<tr style='color: gray; text-decoration: underline'><th style='width: 120px'>Name</th><th style='width: 40px'>#</th><th style='width: 60px'>Action</th>";
	html+="</tr>";
	html+="<tr><td style='color: #B7587D'><span class='clickable' onclick='load_merchants()'>All Merchants</span></td><td><span style='color:#929C99'>N</span></td><td style='color: #2699AF'><span class='clickable' onclick='load_merchants()'>Show</span></td></tr>";
	X.servers.forEach(function(server){
		var action="<span style='color:gray'>Here</span>";
		if(!(server_region==server.region && server.name==server_identifier)) action="<a href='/character/"+character.name+"/in/"+server.region+"/"+server.name+"/' class='cancela' style='color: #4C9BC8'>Switch</span>";
		html+="<tr><td>"+server_regions[server.region]+" "+server.name+"</td><td><span style='color:"+colors.server_success+"'>"+server.players+"</span></td><td>"+action+"</td></tr>";
	});
	html+="</table></div></div>";
	$(".friendslist").html(html);
	$(".friendslist").parent().find(".active2").removeClass("active2");
	$(".fservers").addClass("active2");
}

function load_character_list()
{
	friends_inside="characters";
	var html="";
	html+="<table style='margin: 5px; text-align: center' class='cclist'>";
	html+="<tr style='color: gray; text-decoration: underline'><th style='width: 140px'>Name</th><th style='width: 70px'>Level</th><th style='width: 120px'>Class</th><th style='width: 120px'>Status</th><th style='width: 120px'>Deploy</th>";
	html+="</tr>";
	X.characters.forEach(function(player){
		var afk="AFK",party=player.party,name=player.name,online=false;
		if(player.online) afk="<span style='color: #34bf15'>ONLINE</span>",link="<span class='gray'>Deployed</span>";
		else afk="<span style='color: gray'>OFFLINE</span>",link="<a href='/character/"+player.name+"/in/"+server_region+"/"+server_identifier+"/' target='_blank' class='cancela' style='color: #4C9BC8'>Deploy</span>";
		if(player.name!=character.name && player.name!="Hidden") party+=" <span style='color: #A255BA' class='clickable' onclick='hide_modal(); cpm_window(\""+player.name+"\");'>PM</span>";
		if(name=="Hidden") name="<span style='color:gray'>Hidden</span>";
		html+="<tr><td>"+name+"</td><td>"+player.level+"</td><td>"+player.type.toUpperCase()+"</td><td>"+afk+"</td>";
		html+="<td>"+link+"</td>";
		html+="</tr>";
	});
	html+="</table>";
	$(".friendslist").html(html);
	$(".friendslist").parent().find(".active2").removeClass("active2");
	$(".fcharacters").addClass("active2");
}

function show_delete_mail(id)
{
	show_confirm("Delete the mail?","Yes","Cancel",function(){ api_call('delete_mail',{mid:id}); hide_modal(); setTimeout(function(){ hide_modal(); },20); setTimeout(function(){ load_mail() },1600); });
}

function render_mail(id)
{
	var mail=window.mail[id];
	var html="<div style='font-size: 24px'>";
		html+="<div class='clickable' style='color: #DB090A; float: right' onclick='show_delete_mail(\""+id+"\");'>Delete</div>";
		html+="<div class='mailsubject'><span style='color: gray'>From:</span> "+mail.fro+"</div>";
		html+="<div class='mailsubject'><span style='color: gray'>To:</span> "+mail.to+"</div>";
		html+="<div class='mailsubject'><span style='color: gray'>Subject:</span> "+html_escape(mail.subject)+"</div>";
		html+="<div class='mailsubject'>"+html_escape(mail.message).replace_all("\r\n","<br />").replace_all("\n","<br />").replace_all("\t","&nbsp;&nbsp;")+"</div>";
		if(mail.item)
		{
			var item=JSON.parse(mail.item);
			var take="";
			if(!mail.taken) take=" <span class='clickable takeitem' style='color: #6DAD47' onclick='parent.socket.emit(\"mail_take_item\",{id:\""+id+"\"})'> TAKE </span>";
			html+="<div class='mailsubject'><span style='color: gray'>Item:</span> "+item_container({skin:G.items[item.name].skin,def:G.items[item.name],draggable:false},item)+take+"</div>";
		}
	html+="</div>";
	show_modal(html);
	api_call("read_mail",{mail:id},{silent:true});
}

function load_mail(info)
{
	var html="";
	html+="<div class='gamebutton gamebutton-small' onclick='pcs(); show_mail_modal()'>Send Mail <span style='color: gray'>Cost:</span> <span style='color: gold'>48,000</span></div>";
	if(info)
	{
		if(friends_inside!="mail") return;
		if(info.cursored) html+="<div style='margin-top: 8px; margin-bottom: 8px'>(Previous emails not shown)</div>";
		if(!info.mail.length && info.cursored) html+="<div style='margin-top: 8px'>End of mail.</div>";
		else if(!info.mail.length) html+="<div style='margin-top: 8px'>No mail yet.</div>";
		else
		{
			html+="<div style='text-align: left; margin: 20px'>";
				window.mail={};
				info.mail.forEach(function(mail){
					var item_html="";
					window.mail[mail.id]=mail;
					if(mail.item && !mail.taken)
					{
						var item=JSON.parse(mail.item);
						item_html+=" <span style='color: #6DAD47'>ITEM!</span> ";
					}
					html+="<div class='mailsubject clickable' onclick='pcs(); render_mail(\""+mail.id+"\")'><span style='color: gray'>From:</span> "+mail.fro+" <span style='color: gray'>To:</span> "+mail.to+" <span style='color: gray'>Subject:</span> "+html_escape(mail.subject)+item_html+"</div>";
				});
			html+="</div>"
			if(!(info.cursor && info.more)) html+="<div style='margin-top: 8px'>End of mail.</div>";
			else html+="<div style='margin-top: 8px' class='clickable' onclick='api_call(\"pull_mail\",{cursor:\""+info.cursor+"\"});'>Load More</div>";
		}
		$(".friendslist").html(html);
	}
	else
	{
		friends_inside="mail";
		api_call("pull_mail");
		$(".friendslist").html(html);
		$(".friendslist").parent().find(".active2").removeClass("active2");
		$(".fmail").addClass("active2");
	}
}

function load_chat(info,type)
{
	var html="";
	if(!type) type="all";
	html+="<div class='gamebutton gamebutton-small "+(type=="global"&&"gamebutton-active"||"")+"' style='color: #CDD584' onclick='pcs(); load_chat(null,\"global\")'>Global</div> ";
	html+="<div class='gamebutton gamebutton-small "+(type=="party"&&"gamebutton-active"||"")+"' style='color: #3B8ED2' onclick='pcs(); load_chat(null,\"party\")'>Party</div> ";
	html+="<div class='gamebutton gamebutton-small "+(type=="private"&&"gamebutton-active"||"")+"' style='color: #D0598B' onclick='pcs(); load_chat(null,\"private\")'>Private</div> ";
	html+="<div class='gamebutton gamebutton-small "+(type=="all"&&"gamebutton-active"||"")+"' style='color: #717171' onclick='pcs(); load_chat(null)'>All Incoming</div> ";
	X.servers.forEach(function(server){
		html+="<div class='gamebutton gamebutton-small "+(type==(server.region+server.name)&&"gamebutton-active"||"")+"' style='color: #CFD5EB' onclick='pcs(); load_chat(null,\""+server.region+server.name+"\")'>"+server.region+" "+server.name+"</div> ";
	});
	// html+="<div class='gamebutton gamebutton-small' style='color: #88D69A' onclick='pcs(); show_alert(\"Soon\")'>Pull</div> ";
	if(info)
	{
		if(friends_inside!="chat") return;
		if(info.cursored) html+="<div style='margin-top: 8px; margin-bottom: 8px'>(Previous messages not shown)</div>";
		if(!info.messages.length && info.cursored) html+="<div style='margin-top: 8px'>End of chat.</div>";
		else if(!info.messages.length) html+="<div style='margin-top: 8px'>No messages yet.</div>";
		else
		{
			html+="<div style='text-align: left; margin: 20px'>";
				window.messages={};
				info.messages.forEach(function(message){
					var item_html="",server="";
					window.messages[message.id]=message;
					var color="gray";
					if(message.type=="private") color="#CD7879",server=" <span style='color: #505259'>["+message.to[0]+"]</span>";
					if(message.type=="party") color="#5B8DB0";
					if(message.type=="ambient" || type=="global") server=" <span style='color: #505259'>["+message.server+"]</span>";
					html+="<div title='"+message.date+"'>"+html_escape(message.fro)+":"+" <span style='color: "+color+"'>"+html_escape(message.message)+server+"</span></div>";
				});
			html+="</div>"
			if(!(info.cursor && info.more)) html+="<div style='margin-top: 8px'>End of messages.</div>";
			else html+="<div style='margin-top: 8px' class='clickable' onclick='api_call(\"pull_messages\",{cursor:\""+info.cursor+"\"});'>Load More</div>";
		}
		$(".friendslist").html(html);
	}
	else
	{
		friends_inside="chat";
		api_call("pull_messages",{type:type});
		$(".friendslist").html(html);
		$(".friendslist").parent().find(".active2").removeClass("active2");
		$(".fchat").addClass("active2");
	}
}

function load_pvp_list(list)
{
	console.log(list);
	var html="<div style='font-size: 24px; text-align: center; padding: 6px; line-height: 24px;'>",pwn=false;
	list.forEach(function(a_t){
		html+="<div>"+a_t[0]+" pwned "+a_t[1]+"</div>"; pwn=true;
	});
	if(!pwn) html+="<div>Noone pwned Anyone</div>";
	html+="</div>";
	show_modal(html,{wwidth:400});
}

function load_coming_soon(num)
{
	var message="Coming Sooner!";
	$(".friendslist").parent().find(".active2").removeClass("active2");
	if(num==1) $(".fserver").addClass("active2");
	else if(num==2) $(".fguild").addClass("active2"),message="Coming Soon!";
	else if(num==3) $(".fleaders").addClass("active2"),message="Planned, along with achievements, character statistics, weekly, monthly leaderboards";
	else if(num==4) $(".fmail").addClass("active2"),message="Coming Soon!";
	$(".friendslist").html("<div style='margin-top: 8px'>"+message+"</div>");
}

var friends_inside="nearby";
function render_com()
{
	var html="";
	var c_count=0;
	api_call("servers_and_characters");
	X.characters.forEach(function(c){if(c.online) c_count+=1;});
	html+="<div style='text-align: center'>";
		//html+="<div class='gamebutton ffriends' onclick='load_friends()'>Friends</div>";
		//html+=" <div class='gamebutton fnearby' onclick='load_nearby()'>Nearby</div>";
		//html+=" <div class='gamebutton fserver' onclick='load_server_list();'>Server</div>";
		html+=" <div class='gamebutton ffriends fserver fnearby' onclick='load_server_list();'>Comrades</div>";
		html+=" <div class='gamebutton fservers' onclick='load_servers_list();'>Realm</div>";
		html+=" <div class='gamebutton fcharacters' onclick='load_character_list();'>Characters [<span class='ccount'>"+c_count+"</span>/4]</div>";
		html+=" <div class='gamebutton fchat' onclick='load_chat();'>Chat</div>";
		html+=" <div class='gamebutton fmail' onclick='load_mail();'>Mail [<span class='mcount'>"+(window.X && X.unread || 0)+"</span>]</div>";
		// html+=" <div class='gamebutton fguild' onclick='load_coming_soon(2)'>Guild</div> <div class='gamebutton fmail' onclick='load_coming_soon(4)'>Mail</div> <div class='gamebutton fleaders' onclick='load_coming_soon(3)'>Leaderboards</div>";
	html+="<div class='friendslist mt5' style='height: 400px; border: 5px solid gray; font-size: 24px; overflow: scroll; padding: 6px'></div>";
	html+="<div style='font-size: 16px; margin-top: 5px; color: gray; text-align: center'>NOTE: The Communicator is an evolving protoype</div>";
	// html+="<div class='gamebutton mt5' style='display: block'>Refresh</div>";
	html+="</div>";
	show_modal(html,{}); //styles:"background: #CACACA; border-color: #4C4C4C"
	load_nearby(1);
}

function render_com_buttons()
{
	var html="<div style='text-align: center'>";
	html+="<div class='gamebutton gamebutton-small ffriendsx' onclick='load_friends()'>Friends</div>";
	html+=" <div class='gamebutton gamebutton-small fnearbyx' onclick='load_nearby()'>Nearby</div>";
	html+=" <div class='gamebutton gamebutton-small fserverx' onclick='load_server_list();'>Server</div>";
	html+="</div>"
	return html;
}

var IID=null;

function precompute_image_positions()
{
	// G.images is new [25/09/18]
	if(IID) return;
	if(!window.SS) window.SS={},window.SSU={};
	if(!Object.keys(T).length) process_game_data(); 
	IID={}; // IID is reset after game loads, so actual dimensions are live
	for(var name in G.sprites)
	{
		var s_def=G.sprites[name];
		if(s_def.skip) continue;
		var row_num=4,col_num=3,s_type="full";
		if(in_arr(s_def.type,["animation"])) row_num=1,s_type=s_def.type;
		if(in_arr(s_def.type,["tail"])) col_num=4,s_type=s_def.type;
		if(in_arr(s_def.type,["v_animation","head","hair","hat","s_wings","face","makeup","beard"])) col_num=1,s_type=s_def.type;
		if(in_arr(s_def.type,["a_makeup","a_hat"])) col_num=3,s_type=s_def.type;
		if(in_arr(s_def.type,["wings","body","armor","skin","character"])) s_type=s_def.type;
		if(in_arr(s_def.type,["emblem","gravestone"])) row_num=1,col_num=1,s_type=s_def.type;
		var matrix=s_def.matrix;
		var width=G.images[s_def.file.split("?")[0]]&&G.images[s_def.file.split("?")[0]].width||s_def.width||window.C&&C[s_def.file]&&C[s_def.file].width||312;
		var height=G.images[s_def.file.split("?")[0]]&&G.images[s_def.file.split("?")[0]].height||s_def.height||window.C&&C[s_def.file]&&C[s_def.file].height||288;
		// if(s_def.columns!=4 || s_def.rows!=2) continue;
		for(var i=0;i<matrix.length;i++)
			for(var j=0;j<matrix[i].length;j++)
			{
				var name=matrix[i][j];
				if(!name) continue;
				// 0 total-width,  1 total-height, 2 X-start, 3 Y-start, 4 width, 5 height, 6 col_num, 7 file, 8 type
				IID[name]=[width,height,j*width/s_def.columns,i*height/s_def.rows,width/(s_def.columns*col_num),height/(s_def.rows*row_num),col_num,s_def.file,s_type];
				T[name]=s_def.type;
				SSU[name]=SS[name]=s_def.size||"normal";
				if(G.cosmetics.prop[name] && G.cosmetics.prop[name].includes("slender")) SSU[name]+="slender";
				if(G.dimensions[name])
				{
					//IID[name][4]=G.dimensions[name][0]; - not for here, maybe to replace the default 39 50
					//IID[name][5]=G.dimensions[name][1];
					IID[name][2]=IID[name][2]+(G.dimensions[name][2]||0); // instead of 6 width-disp
				}
			}
	}
	if(0)
		for(var name in IID)
		{
			for(var j=0;j<IID[name].length-1;j++) IID[name][j]*=1.5;
		}
}

function sprite_image(name,args)
{
	try{
		precompute_image_positions();
		if(!args) args={};
		args.p=args.p||0;
		args.rheight=args.rheight||0; // height reduction for cx.upper
		if(!IID[name]) name="naked";
		var scale=args.scale||1,css='';
		// previously, the default width/height was 39px/50px [26/09/18]
		var width=IID[name][4],w_disp=0,l_disp=0,j=args.j||0;
		var height=IID[name][5];
		if(G.dimensions[name]) width=G.dimensions[name][0],height=G.dimensions[name][1];
		if(args.cwidth) l_disp=(args.cwidth-width*scale)/2;
		// l_disp=parseInt(l_disp); // currently, on Chrome, -0.25, 0.5 px corrections etc. look bad [02/10/18]
		if(IID[name][6]==1) w_disp=width;
		if(args.opacity && args.opacity!=1) css+="opacity: "+args.opacity+";"
		return "<div style='display: inline-block; width: "+(width*scale)+"px; height: "+((height-args.rheight)*scale)+"px; overflow: hidden; position: absolute; left: "+l_disp+"px; bottom: "+((args.p+args.rheight)*scale)+"px; "+css+"'>\
			<img style='\
			margin-left: "+((-IID[name][2]-IID[name][4]+w_disp-(IID[name][4]-width+(args.x_disp||0))/2)*scale)+"px; \
			margin-top: "+((-IID[name][3]-IID[name][5]-IID[name][5]*j+height)*scale)+"px; \
			width: "+(IID[name][0]*scale)+"px; \
			height: "+(IID[name][1]*scale)+"px;' \
		src='"+IID[name][7]+"'/></div>";
		// Math.ceil((IID[name][4]-width)/2)
	}
	catch(e){
		console.log(e);
	}
	return "";
}

function sprite(name,args)
{
	try{
		if(!args) args={};
		if(is_string(args)) args={cx:args};
		if(is_string(args.cx)) args.cx=args.cx.split(",");
		if(!args.cx) args.cx={};
		if(!args.scale) args.scale=1.5;
		if(G.monsters[name] && G.monsters[name].size) args.scale-=1-G.monsters[name].size;
		precompute_image_positions();
		if(!IID[name] && G.items[name]) return item_container({skin:name,bcolor:"black"});
		if(G.monsters[name] && G.monsters[name].skin) name=G.monsters[name].skin;
		prune_cx(args.cx,name);
		if(!args.width) args.width=40;
		if(!args.height) args.height=50;
		if(!args.rx_disp) args.rx_disp=0;
		if(args.full)
		{
			if(G.dimensions[name]) args.width=(G.dimensions[name][0]+4)*args.scale,args.height=(G.dimensions[name][1]+5)*args.scale;
			else args.width=IID[name][4]*args.scale,args.height=IID[name][5]*args.scale;
		}
		if(G.dimensions[name] && G.dimensions[name][3]) args.rx_disp=-G.dimensions[name][3]*args.scale;
		var html="<div style='height: "+args.height+"px; width: "+args.width+"px; position: relative; text-align: center; overflow:"+(args.overflow&&"visible"||"hidden")+"; display: inline-block'>";
		var head_y=G.cosmetics.default_head_place;
		var hair_y=G.cosmetics.default_hair_place;
		var hat_y=G.cosmetics.default_hat_place;
		var skin=null,rip=false,cxs=[name],cx_prop={};
		for(var n in args.cx) cxs.push(n);
		cxs.forEach(function(cid){
			if(G.cosmetics.prop[cid])
				G.cosmetics.prop[cid].forEach(function(p){
					cx_prop[p]=true;
				})
		});
		var body_type="full";
		if(T[name]=="armor") body_type="armor";
		else if(T[name]=="body") body_type="body";
		else if(T[name]=="character") body_type="character";
		if(args.rip)
		{
			// originally opacity=0.4
			html+=sprite_image(args.cx.gravestone||"gravestone",{cwidth:args.width,scale:args.scale})+"</div>";
			return html;
		}
		var opacity=1,j=args.j||0;
		if(body_type!="full" && !args.cx.head) args.cx.head="makeup117";
		if(body_type!="character" && !args.cx.head) args.cx.head="makeup117";
		// console.log(!(IID[name][4]%2)+" "+args.x_disp);
		var head_dy={"large":2,"tall":1,"normal":0,"small":-1,"xsmall":-3,"xxsmall":-4}[SS[name]]; head_y+=head_dy;
		var head_dh=G.cosmetics.head[args.cx.head]&&G.cosmetics.head[args.cx.head][3]||0;
		var hair_dy=G.cosmetics.hair[args.cx.hair]&&G.cosmetics.hair[args.cx.hair][0]||0; hair_dy+=head_dh+head_dy; hair_y+=hair_dy;
		var hair_dh=G.cosmetics.hair[args.cx.hair]&&G.cosmetics.hair[args.cx.hair][1]||0; hat_y+=hair_dh+head_dy;
		var hat_dy=G.cosmetics.hat[args.cx.hat]||0; hat_dy+=head_dh; hat_y+=hat_dy;
		var hidden_head=j==3||G.cosmetics.prop[name]&&G.cosmetics.prop[name].includes("covers");
		var cx={};
		for(var place in args.cx)
		{
			var cid=args.cx[place];
			if(!cid || !cid.length || !IID[cid]) continue;
			if(place=="head")
			{
				if(body_type!="full" && body_type!="character") cx.head=cid;
			}
			else if(place=="hair")
			{
				if(body_type!="full" && body_type!="character" && !cx_prop.no_hair) cx.hair=cid;
			}
			else if(place=="upper")
			{
				if(body_type!="full" && T[cid]=="armor" && SSU[cid]==SSU[name]) cx.upper=cid;
			}
			else
				cx[place]=cid;
		}
		if(cx.head && !skin)
		{
			skin={
				"small":G.cosmetics.head[cx.head]&&G.cosmetics.head[cx.head][0]||"sskin1a",
				"normal":G.cosmetics.head[cx.head]&&G.cosmetics.head[cx.head][1]||"mskin1a",
				"tall":G.cosmetics.head[cx.head]&&G.cosmetics.head[cx.head][1]||"mskin1a",
				"large":G.cosmetics.head[cx.head]&&G.cosmetics.head[cx.head][2]||"lskin1a"}[SS[name]];
		}
		if(cx.head && hidden_head) html+=sprite_image(cx.head,{p:head_y,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(cx.back && j!=3) html+=sprite_image(cx.back,{cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(skin) html+=sprite_image(skin,{cwidth:args.width,scale:args.scale,opacity:opacity,j:j,x_disp:args.x_disp});
		if(!(IID[name][4]%2)) html+=sprite_image(name,{cwidth:args.width,scale:args.scale,opacity:opacity,j:j,x_disp:args.rx_disp+-0.5});// old 26px width frame
		else html+=sprite_image(name,{cwidth:args.width,scale:args.scale,opacity:opacity,j:j,x_disp:args.rx_disp});
		if(cx.upper) html+=sprite_image(cx.upper,{cwidth:args.width,scale:args.scale,opacity:opacity,j:j,rheight:8});
		if(cx.head && !hidden_head) html+=sprite_image(cx.head,{p:head_y,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(j!=3 && cx.makeup) html+=sprite_image(cx.makeup,{p:head_y+G.cosmetics.default_makeup_position,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(cx.hair) html+=sprite_image(cx.hair,{p:hair_y,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(j!=3 && cx.face) html+=sprite_image(cx.face,{p:head_y+G.cosmetics.default_face_position,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(j!=3 && cx.chin) html+=sprite_image(cx.chin,{p:head_y+G.cosmetics.default_beard_position,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(cx.tail) html+=sprite_image(cx.tail,{p:0,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(cx.hat) html+=sprite_image(cx.hat,{p:hat_y,cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(cx.back && j==3) html+=sprite_image(cx.back,{cwidth:args.width,scale:args.scale,opacity:opacity,j:j});
		if(rip) html+=sprite_image(rip,{cwidth:args.width,scale:args.scale,j:j});
		html+="</div>";
		return html;
	}catch(e){
		console.log(e)
	}
	return "";
}

function cx_sprite(name,args)
{
	if(!args) args={};
	function render_cosmetic(slot,rargs)
	{
		if(!rargs) rargs={};
		if(!rargs.color && (cx[slot] || slot=="skin")) rargs.color="#17B8E3";
		else if(!rargs.color) rargs.color="#5DBA50";
		rargs.bg="#D5D5D5";
		rargs.bg="#504254";
		var width=rargs.width||49,height=48,labels="";
		if(rargs.rip) height=48;
		rargs.scale=rargs.scale||2;
		rargs.j=rargs.j||0;
		if(args.labels)
		{
			var drop=false,mdrop=false,ccx=false,icx=false;
			for(var dname in G.drops)
			{
				if(!(G.items[dname] && G.items[dname].e)) continue;
				G.drops[dname].forEach(function(t){
					if(t[1]=="cx" && t[2]==name)
						drop=true;
				})
			}
			for(var mname in G.monsters)
			{
				if(!(G.drops && G.drops.monsters && G.drops.monsters[mname])) continue;
				G.drops.monsters[mname].forEach(function(t){
					if(t[1]=="cxjar" && t[3]==name)
						mdrop=true;
				})
			}
			for(var cname in G.classes)
			{
				if((G.classes[cname].xcx||[]).includes(name)) ccx=true;
			}
			for(var iname in G.items)
			{
				if((G.items[iname].xcx||[]).includes(name)) icx=true;
			}
			if(drop) labels+="<span style='color:#3696CE'>E</span>";
			if(mdrop) labels+="<span style='color:#896CF7'>M</span>";
			if(ccx) labels+="<span style='color:#61C14A'>C</span>";
			if(icx) labels+="<span style='color:#BDB094'>I</span>";
			if(!labels) labels+="<span style='color:gray'>X</span>";
		}
		html+="<div style='display: inline-block; margin-left: "+(args.mleft||0)+"px; margin-right: "+(args.mright||0)+"px; vertical-align: middle; margin-bottom: 4px; vertical-align: bottom'>";
			html+="<div style='background-color: "+(rargs.bg||"#504254")+"; border: 2px solid gray; font-size: 0px; vertical-align: top; overflow: hidden; width: "+width+"px; height: "+(height+(rargs.aheight||0)+16)+"px; text-align: center; position: relative'>";
				if(args.labels) html+="<div style='font-size: 16px; text-align: center; background: black; display: inline-block; border: 2px solid gray; position: absolute; top: -2px; left: -2px; z-index:1; padding: 0px 0px 0px 2px'>"+labels+"</div>";
				html+="<div style='margin-top: "+((rargs.top||0)-2-20*rargs.scale)+"px; margin-left: 0px; display: inline-block;'>"+sprite(rargs.skin,{cx:rargs.cx,scale:rargs.scale,height:rargs.height*rargs.scale+20*rargs.scale,j:rargs.j,width:width,rip:rargs.rip})+"</div>";
				html+="<div style='font-size: 16px; line-height: 14px; text-align: center; background: black; display: inline-block; border: 2px solid gray; position: absolute; bottom: -2px; left: -2px; right: -2px'>"+(rargs.text||slot).toUpperCase()+"</div>";
			html+="</div>"
		html+="</div>";
	}
	var html="";
	precompute_image_positions();
	if(["hair","face","head","makeup","a_makeup"].includes(T[name]))
	{
		var cx={head:T[name]=="head"&&name||"bwhead"};
		cx[cxtype_to_slot[T[name]]]=name;
		render_cosmetic(T[name],{skin:T[name]=="head"&&"nothing"||"mabw",top:50+(T[name]=="head"&&-6||0),scale:3,cx:cx,height:16,aheight:4});
		return html;
	}
	else if(["hat","a_hat"].includes(T[name]))
	{
		var cx={head:"bwhead"};
		cx[cxtype_to_slot[T[name]]]=name;
		render_cosmetic(T[name],{skin:"mabw",top:50,scale:3,cx:cx,height:16,aheight:4});
		return html;
	}
	else if(["beard","mask"].includes(T[name]))
	{
		var cx={head:"bwhead"};
		cx[cxtype_to_slot[T[name]]]=name;
		render_cosmetic(T[name],{skin:"mabw",top:30,scale:3,cx:cx,height:16});
		return html;
	}
	else if(["armor","body","character"].includes(T[name]))
	{
		var cx={head:"bwhead"};
		cx[cxtype_to_slot[T[name]]]=name;
		render_cosmetic(T[name]=="character"&&"char"||T[name],{skin:name,top:-7,scale:2,cx:cx,height:36,aheight:16});
		return html;
	}
	else if(["gravestone"].includes(T[name]))
	{
		var cx={head:"bwhead"};
		cx[cxtype_to_slot[T[name]]]=name;
		render_cosmetic("stone",{skin:"mabw",top:-7,scale:2,cx:cx,height:36,aheight:16,rip:true});
		return html;
	}
	else if(["s_wings","tail"].includes(T[name]))
	{
		var cx={head:"bwhead"};
		cx[cxtype_to_slot[T[name]]]=name;
		render_cosmetic(T[name],{skin:"mabw",j:3,top:-7,width:59,scale:2,cx:cx,height:36,aheight:16});
		return html;
	}
	else
	{
		return sprite(name,{cx:{head:"bwhead"}});
	}
}

function cx_move(x,y)
{
	last_cx_d[0]+=x;
	last_cx_d[1]+=y;
	var skin=character.skin,cx=character.cx;
	if(!textures.naked) generate_textures("naked","full");
	character.skin="naked"; character.cx={};
	cosmetics_logic(character);
	character.skin=skin; character.cx=cx;
	cosmetics_logic(character);
	for(var n in character.cxc)
	{
		if(character.cxc[n].skin==last_cx_name)
		{
			character.cxc[n].x+=last_cx_d[0];
			character.cxc[n].y+=last_cx_d[1];
			character.cxc[n].moved=true;
		}
	}
	var log=last_cx_name+":";
	if(!last_cx_d[0] && !last_cx_d[1]) log+=" default position";
	if(last_cx_d[0]<0) log+=" [move left "+(-last_cx_d[0])+"px]";
	if(last_cx_d[0]>0) log+=" [move right "+(last_cx_d[0])+"px]";
	if(last_cx_d[1]<0) log+=" [move up "+(-last_cx_d[1])+"px]";
	if(last_cx_d[1]>0) log+=" [move down "+(last_cx_d[1])+"px]";
	add_log(log,"#BD6BB6");
}

function insert_cx_tuners()
{
	var html="<div style='left: "+$(window).width()/2+"px; top: "+$(window).height()/2+"px; width: 0px; height: 0px; position: fixed; z-index: 100; overflow: visible'>";
		html+="<div style='position: absolute; top: -130px; left: -35px; text-align: center; width: 50px;' class='gamebutton gamebutton-small' onclick='cx_move(0,-1)'>UP</div>";
		html+="<div style='position: absolute; top: 20px; left: -35px; text-align: center; width: 50px;' class='gamebutton gamebutton-small'  onclick='cx_move(0,1)'>DOWN</div>";
		html+="<div style='position: absolute; top: -20px; left: -110px; text-align: center; width: 50px;' class='gamebutton gamebutton-small' onclick='cx_move(-1,0)'>LEFT</div>";
		html+="<div style='position: absolute; top: -20px; left: 40px; text-align: center; width: 50px;' class='gamebutton gamebutton-small' onclick='cx_move(1,0)'>RIGHT</div>";
	html+="</div>"
	$("body").append(html);
}

var last_cx_slot="",last_cx_name="",last_cx_d=[0,0];
function render_cgallery(skin,cx,slot)
{
	cx=clone(cx);
	var html="",types=[],a=[],b=[],n=null,s,old=null,j=0,cx_count=all_cx(character,1),cx_map=map_cx(character),me=false;
	if((xtarget||target).me) me=true;
	var bg="#504254";
	function render_cosmetic(reset)
	{
		var width=47,height=64,html="";
		var aheight=32;
		if(cx.hat || reset && slot=="hat") height+=12,aheight+=6;
		if(slot=="gravestone") height=48;
		var scale=2,found=false,onclick="onclick='if(!(xtarget||target).me) socket.emit(\"send\",{name:(xtarget||target).name,cx:\""+s[0]+"\"}),push_deferred(\"send\"); else socket.emit(\"cx\",{slot:\""+slot+"\",name:\""+s[0]+"\"}),last_cx_slot=\""+slot+"\",last_cx_name=\""+s[0]+"\",last_cx_d=[0,0],push_deferred(\"cx\"); hide_modal();' class='clickable'";
		if(!me && cx_map[s[0]] && cx_count[cx_map[s[0]]]>0 || me && cx_count[s[0]]!==undefined || me && character.role==="cx" || reset) found=true;
		else onclick="";
		html+="<div style='display: inline-block; margin: 4px;'>";
			if(mode.cosmetics) html+="<div style='font-size: 16px; text-align: center'>"+s[0]+"</div>";
			html+="<div style='background-color: "+(reset&&"#CA8171"||!found&&"#615F6A"||"#639F6C")+"; border: 2px solid gray; font-size: 0px; vertical-align: top; overflow: hidden; width: "+width+"px; height: "+height+"px; text-align: center' "+onclick+">";
				html+="<div style='margin-top: "+(0-2-20*scale)+"px; margin-left: 0px; display: inline-block;'>"+sprite(skin,{cx:cx,scale:scale,height:aheight*scale+20*scale,j:j,width:width,rip:(slot=="gravestone")})+"</div>";
			html+="</div>"
		html+="</div>";
		if(reset) n=html;
		else if(found) a.push(html);
		else b.push(html);
	}
	for(var cxt in cxtype_to_slot)
	{
		if(cxtype_to_slot[cxt]==slot) types.push(cxt);
	}

	if(slot=="upper") types=["body","armor"];
	if(slot=="back") types.push("tail");  // synced with server.js/'cx'
	if(slot=="face") types.push("makeup"),types.push("a_makeup");

	if(slot=="tail" || slot=="back") j=3;
	object_sort(T).forEach(function(x){
		s=x;
		if(in_arr(s[1],types))
		{
			if(T[skin]=="full" && slot=="head") return;
			if(slot=="upper" && (T[skin]=="full" || SSU[s[0]]!=SSU[skin] || skin==s[0] || T[s[0]]!="armor")) return;
			if(cxtype_to_slot[s[1]]=="skin") skin=s[0];
			else if(slot=="upper") cx.upper=s[0];
			else
			{
				types.forEach(function(t){ delete cx[cxtype_to_slot[t]]; })
				cx[cxtype_to_slot[s[1]]]=s[0];
			}
			render_cosmetic();
		}
	});
	if((a.length || b.length) && slot!="skin")
	{
		s=[""];
		types.forEach(function(t){ delete cx[cxtype_to_slot[t]]; })
		render_cosmetic(1);
	}
	if(a.length || b.length)
	{
		a.forEach(function(h){html+=h;});
		if(n) html+=n;
		b.forEach(function(h){html+=h;});
		show_modal(html,{wrap:false,styles:"max-width:400px"});
	}
	else show_modal("<div style='background-color: "+bg+"; border: 2px solid gray; vertical-align: top; overflow: hidden; text-align: center; padding: 12px; font-size: 32px'>No Alternatives</div>",{wrap:false,styles:"max-width:400px"});
}

var last_cx={},last_skin="";
function render_cosmetics(player,args)
{
	if(!args) args={}; last_cx=player.cx; last_skin=player.skin;
	if(args.toggle && $('.cccx').html()) return $("#topleftcornerdialog").html("");
	function render_cosmetic(slot,rargs)
	{
		if(!rargs) rargs={};
		if(!rargs.color && (player.cx[slot] || slot=="skin")) rargs.color="#17B8E3";
		else if(!rargs.color) rargs.color="#5DBA50";
		rargs.bg="#D5D5D5";
		rargs.bg="#504254";
		var width=39,height=48;
		if(rargs.size=="big")
		{
			rargs.scale=3;
			width=91,height=118;
			rargs.top=12;
		}
		if(rargs.rip) height=48;
		rargs.scale=rargs.scale||2;
		rargs.j=rargs.j||0;
		html+="<div style='display: inline-block; margin-left: "+(rargs.mleft||0)+"px;'>";
			html+="<div style='font-size: 16px; text-align: center'>"+(rargs.text||slot).toUpperCase()+"</div>";
			html+="<div style='background-color: "+(rargs.bg||"#504254")+"; border: 2px solid gray; font-size: 0px; vertical-align: top; overflow: hidden; width: "+width+"px; height: "+height+"px; text-align: center'";
				if(player.me || player.owner==character.owner) html+=" onclick='render_cgallery(last_skin,last_cx,\""+slot+"\")' class='clickable'>";
				else html+=">";
				html+="<div style='background: "+rargs.color+"; height: 2px; z-index: 10; position: relative'></div>";
				html+="<div style='margin-top: "+((rargs.top||0)-2-20*rargs.scale)+"px; margin-left: 0px; display: inline-block;'>"+sprite(player.skin,{cx:rargs.cx,scale:rargs.scale,height:player.aheight*rargs.scale+20*rargs.scale,j:rargs.j,width:width,rip:rargs.rip})+"</div>";
			html+="</div>"
		html+="</div>";
	}
	var html="<div style='background-color: black; border: 5px solid gray; padding: 20px; font-size: 24px; display: inline-block; vertical-align: top;' class='cccx'>";
	var color="";
		html+="<div style='display: inline-block; vertical-align: top'>";
			html+="<div style='margin-top: -5px'>";
				if(IID[player.skin][8]=="full") color="#BB2242";
				render_cosmetic("head",{text:"skin",top:-9,scale:3,color:color,cx:{head:player.cx.head}});
				render_cosmetic("hair",{top:6,scale:3,mleft:8,color:color,cx:{head:player.cx.head,hair:player.cx.hair||"bwhair"}});
				color="";
				render_cosmetic("hat",{top:12,scale:3,mleft:8,color:color,cx:{head:player.cx.head,hair:player.cx.hair,hat:player.cx.hat||"bwhat"}});
			html+="</div>";
			html+="<div>";
				render_cosmetic("face",{top:-9,scale:3,cx:{head:player.cx.head,hair:player.cx.hair,face:player.cx.face||"bwglasses"}});
				var cx=clone(player.cx); delete cx.upper; delete cx.back;
				render_cosmetic("skin",{text:"ATTIRE",top:-12,scale:2,mleft:8,cx:cx});
				if(IID[player.skin][8]=="full") color="#BB2242";
				var cx=clone(player.cx); delete cx.back;
				render_cosmetic("upper",{top:-5,scale:2,mleft:8,color:color,cx:cx});
				color="";
			html+="</div>";
			html+="<div>";
				render_cosmetic("chin",{top:-20,scale:3,cx:{head:player.cx.head,hair:player.cx.hair,chin:player.cx.chin||"beard112"}});
				render_cosmetic("special",{top:10,text:"sp. fx",cx:player.cx,scale:1,mleft:8,bg:"#E3B245"});
				var cx=clone(player.cx); delete cx.tail;
				render_cosmetic("back",{top:-2,j:3,scale:1.5,mleft:8,cx:cx});
				//var cx=clone(player.cx); delete cx.back;
				//render_cosmetic("tail",{top:-20,j:3,scale:2,mleft:8,cx:cx});
			html+="</div>";
		html+="</div>";
		html+="<div style='display: inline-block; vertical-align: top'>";
			html+="<div style='margin-top: -5px'>";
				render_cosmetic("skin",{text:"looks",cx:player.cx,size:"big",mleft:8});
			html+="</div>";
			html+="<div>";
				render_cosmetic("gravestone",{text:"RIP",top:-16,scale:1.75,mleft:8,cx:cx,rip:true,bg:"#8cb0bb"});
				render_cosmetic("EMOTES",{top:10,j:3,scale:1,mleft:8,cx:cx,bg:"#8756ff"});
			html+="</div>";
		html+="</div>";
	html+="</div>";
	dialogs_target=xtarget||ctarget;
	$("#topleftcornerdialog").html(html);
}

function load_class_info(name,look)
{
	var html="";
	name=name||window.chartype||"warrior";
	if(!G.classes[name]) return;
	look=nunv(look,nunv(window.thelooks,0));
	if(!G.classes[name].looks[look]) look=0;

	//html+="<div style='float: left; margin-right: 10px; margin-top: -10px; width: 52px; height: 72px; overflow: hidden'><img style='margin-top: -"+(72*4)+"px; margin-left: -"+(52*4)+"px; width: 624px; height: 576px;' src='/images/tiles/characters/chara7.png'/></div>";
	html+="<div style='float: left; margin-right: 10px; margin-top: -10px; margin-bottom: -3px'>"+sprite(G.classes[name].looks[look][0],{cx:G.classes[name].looks[look][1],scale:2,height:72,width:52})+"</div>";
	html+="<div><span style='color: white'>Class:</span> <span style='color: "+colors.male+"'>"+name.toTitleCase()+"</span></div>";
	html+="<div><span style='color: white'>Primary Attribute:</span> <span style='color: "+colors[G.classes[name].main_stat]+"'>"+G.classes[name].main_stat.toTitleCase()+"</span></div>";
	if(G.classes[name].side_stat) html+="<div><span style='color: white'>Secondary Attribute:</span> <span style='color: "+colors[G.classes[name].side_stat]+"'>"+G.classes[name].side_stat.toTitleCase()+"</span></div>";
	html+="<div><span style='color: white'>Description:</span> <span style='color: gray'>"+G.classes[name].description+"</span></div>";

	$("#features").css("height",208).html(html);
	// $(".salesui").css("bottom",208+36);
}

function to_pretty_fraction(num)
{
	var html="IMPL";
	[[1000000000,"1B","#B30000"],[100000000,"100M","#825CD5"],[10000000,"10M","#825CD5"],[1000000,"1M","#825CD5"],[100000,"100K","#5090D3"],[10000,"10K","#5090D3"],[1000,"1K","#5090D3"],[100,"100","#909090"],[10,"10","#909090"],[1,"1","#64C287"]].forEach(function(l){
		if(num*l[0]>1)
			html=to_pretty_float(num*l[0])+"<span style='color:"+l[2]+"'>/"+l[1]+"</span>";
	});
	return html;
}



