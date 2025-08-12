var c_version=2;
var EPS=0.00000001; // 144-Number.EPSILON was 144 at the time :| [17/07/18]
var ZEPS=0.00000001; //z-index EPS
var REPS=((Number&&Number.EPSILON)||EPS);
var CINF=999999999999999;
var really_old=new Date(); really_old.setYear(1970);
var colors={
	"range":"#93A6A2",
	"armor":"#5C5D5E",
	"resistance":"#6A5598",
	"attack":"#DB2900",
	"str":"#F07F2F",
	"int":"#3E6EED",
	"dex":"#44B75C",
	"for":"#5F3085",
	"speed":"#36B89E",
	"cash":"#5DAC40",
	"hp":"#FF2E46",
	//"mp":"#365DC5",
	"mp":"#3A62CE",
	"stat_xp":"#4570B1",
	"party_xp":"#AD73E0",
	"xp":"#CBFFFF",
	"luck":"#2A9A3D",
	"gold":"gold",
	"male":"#43A1C6",
	"female":"#C06C9B",
	"server_success":"#85C76B",
	"server_failure":"#C7302C",
	"poison":"#41834A",
	"ability":"#ff9100", // nice-green #66ad0f - neon-orange #ff9100
	"xmas":"#C82F17",
	"xmasgreen":"#33BF6D",
	"code_blue":"#32A3B0",
	"code_pink":"#E13758",
	"code_error":"#E13758",
	"A":"#39BB54",
	"B":"#DB37A3",
	"npc_white":"#EBECEE",
	"white_positive":"#C3FFC0",
	"white_negative":"#FFDBDC",
	"positive_greeb":"#85C76B",
	"serious_red":"#BC0004",
	"serious_green":"#428727",
	"heal":"#EE4D93",
	"lifesteal":"#9A1D27",
	"manasteal":"#353C9C",
	"inspect":"#7F75CA",
	"property":"#EF7A4D",
	"string":"#D3637E",
}
var trade_slots=[],check_slots=["elixir"];
for(var i=1;i<=48;i++) trade_slots.push("trade"+i),check_slots.push("trade"+i);
var bank_packs={
	"items0":["bank",0,0],
	"items1":["bank",0,0],
	"items2":["bank",75000000,600],
	"items3":["bank",75000000,600],
	"items4":["bank",100000000,800],
	"items5":["bank",100000000,800],
	"items6":["bank",112500000,900],
	"items7":["bank",112500000,900],
	"items8":["bank_b",0,0],
	"items9":["bank_b",475000000,1000],
	"items10":["bank_b",675000000,1150],
	"items11":["bank_b",825000000,1150],
	"items12":["bank_b",975000000,1200],
	"items13":["bank_b",975000000,1200],
	"items14":["bank_b",975000000,1200],
	"items15":["bank_b",975000000,1200],
	"items16":["bank_b",975000000,1200],
	"items17":["bank_b",1075000000,1200],
	"items18":["bank_b",1175000000,1200],
	"items19":["bank_b",1275000000,1200],
	"items20":["bank_b",1375000000,1200],
	"items21":["bank_b",1475000000,1200],
	"items22":["bank_b",1575000000,1200],
	"items23":["bank_b",1675000000,1200],
	"items24":["bank_u",0,0],
	"items25":["bank_u",2075000000,1350],
	"items26":["bank_u",2075000000,1350],
	"items27":["bank_u",2075000000,1350],
	"items28":["bank_u",2075000000,1350],
	"items29":["bank_u",3075000000,1350],
	"items30":["bank_u",3075000000,1350],
	"items31":["bank_u",3075000000,1350],
	"items32":["bank_u",3075000000,1350],
	"items33":["bank_u",3075000000,1350],
	"items34":["bank_u",3075000000,1350],
	"items35":["bank_u",4075000000,1450],
	"items36":["bank_u",5075000000,1450],
	"items37":["bank_u",6075000000,1450],
	"items38":["bank_u",7075000000,1450],
	"items39":["bank_u",8075000000,1450],
	"items40":["bank_u",9075000000,1650],
	"items41":["bank_u",9075000000,1650],
	"items42":["bank_u",9975000000,1650],
	"items43":["bank_u",9975000000,1650],
	"items44":["bank_u",9975000000,1650],
	"items45":["bank_u",9975000000,1850],
	"items46":["bank_u",9975000000,1850],
	"items47":["bank_u",9995000000,1850],
};
var character_slots=["ring1","ring2","earring1","earring2","belt","mainhand","offhand","helmet","chest","pants","shoes","gloves","amulet","orb","elixir","cape"];
var attire_slots=["helmet","chest","pants","shoes","gloves","cape"];
var riches_slots=["ring1","ring2","earring1","earring2","amulet"];
var booster_items=["xpbooster","luckbooster","goldbooster"];
var doublehand_types=["axe","basher","great_staff"];
var offhand_types={
	"quiver":"Quiver",
	"shield":"Shield",
	"misc_offhand":"Misc Offhand",
	"source":"Source"
};
var weapon_types={
	"sword":"Sword",
	"short_sword":"Short Sword",
	"great_sword":"Great Sword",
	"axe":"Axe",
	"wblade":"Magical Sword",
	"basher":"Basher",
	"dartgun":"Dart Gun",
	"bow":"Bow",
	"crossbow":"Crossbow",
	"rapier":"Rapier",
	"spear":"Spear",
	"fist":"Fist Weapon",
	"dagger":"Dagger",
	"stars":"Throwing Stars",
	"mace":"Mace",
	"pmace":"Priest Mace",
	"staff":"Staff",
	"wand":"Wand",
};
var cxtype_to_slot={
	"armor":"skin",
	"body":"skin",
	"character":"skin",
	"face":"face",
	"makeup":"makeup",
	"a_makeup":"makeup",
	"beard":"chin",
	"mask":"chin",
	"tail":"tail",
	"s_wings":"back",
	"wings":"back",
	"hat":"hat",
	"a_hat":"hat",
	"head":"head",
	"hair":"hair",
	"gravestone":"gravestone",
};
var free_cx=["makeup105","makeup117","mmakeup00","fmakeup01","fmakeup02","fmakeup03"];
var can_buy={};
var T={}; // sprite-type

function process_game_data()
{
	G.quests={};
	for(var name in G.monsters)
	{
		if(G.monsters[name].charge) continue;
		if(G.monsters[name].speed>=60) G.monsters[name].charge=round(G.monsters[name].speed*1.20);
		else if(G.monsters[name].speed>=50) G.monsters[name].charge=round(G.monsters[name].speed*1.30);
		else if(G.monsters[name].speed>=32) G.monsters[name].charge=round(G.monsters[name].speed*1.4);
		else if(G.monsters[name].speed>=20) G.monsters[name].charge=round(G.monsters[name].speed*1.6);
		else if(G.monsters[name].speed>=10) G.monsters[name].charge=round(G.monsters[name].speed*1.7);
		else G.monsters[name].charge=round(G.monsters[name].speed*2);
		G.monsters[name].max_hp=G.monsters[name].hp; // So default value adoption logic is easier [16/04/18]
	}
	for(var c in G.classes)
	{
		if(!G.classes[c].xcx) G.classes[c].xcx=[];
		free_cx.forEach(function(cx){ if(!G.classes[c].xcx.includes(cx)) G.classes[c].xcx.push(cx); });
		G.classes[c].looks.forEach(function(l){
			if(!G.classes[c].xcx.includes(l[0])) G.classes[c].xcx.push(l[0]);
			for(var slot in l[1])
			{
				if(!G.classes[c].xcx.includes(l[1][slot])) G.classes[c].xcx.push(l[1][slot]);
			}
		})
	}
	for(var s in G.sprites)
	{
		var current=G.sprites[s],matrix=current.matrix;
		if(current.skip) continue;
		for(var i=0;i<matrix.length;i++)
			for(var j=0;j<matrix[i].length;j++)
			{
				if(!matrix[i][j]) continue;
				T[matrix[i][j]]=current.type||"full";
			}
	}
	for(var name in G.maps)
	{
		var map=G.maps[name];
		if(map.ignore) continue;
		// var M=map.data={x_lines:(G.geometry[name].x_lines||[]).slice(),y_lines:(G.geometry[name].y_lines||[]).slice()},LD=5;
		var M=map.data=G.geometry[name];
		// Instead of extending lines, applied the emulated move forward logic everywhere [18/07/18]
		// G.geometry[name].x_lines=[]; G.geometry[name].y_lines=[]; // New system [17/07/18]
		// map.data.x_lines.forEach(function(line){
		// 	G.geometry[name].x_lines.push([line[0]-LD,line[1]-LD,line[2]+LD]);
		// 	G.geometry[name].x_lines.push([line[0]+LD,line[1]-LD,line[2]+LD]);
		// });
		// G.geometry[name].x_lines.sort(function(a,b){return (a[0] > b[0]) ? 1 : ((b[0] > a[0]) ? -1 : 0);});
		// map.data.y_lines.forEach(function(line){
		// 	G.geometry[name].y_lines.push([line[0]-LD,line[1]-LD,line[2]+LD]);
		// 	G.geometry[name].y_lines.push([line[0]+LD,line[1]-LD,line[2]+LD]); // The extra 4px is roughly the size of character shoes
		// });
		// G.geometry[name].y_lines.sort(function(a,b){return (a[0] > b[0]) ? 1 : ((b[0] > a[0]) ? -1 : 0);});
		map.items={};
		map.merchants=[];
		map.ref=map.ref||{};
		(map.npcs||[]).forEach(function(npc){
			if(!npc.position) return;
			var coords={map:name,"in":name,x:npc.position[0],y:npc.position[1],id:npc.id},data=G.npcs[npc.id];
			if(data.items)
			{
				map.merchants.push(coords);
				data.items.forEach(function(name){
					if(!name) return;
					if(G.items[name].cash)
					{
						G.items[name].buy_with_cash=true;
						if(!G.items[name].p2w) return;
					}
					map.items[name]=map.items[name]||[];
					map.items[name].push(coords);
					can_buy[name]=true;
					G.items[name].buy=true;
				});
			}
			map.ref[npc.id]=coords;
			if(data.role=="newupgrade") map.upgrade=map.compound=coords; // Refactored the NPC's, but decided to leave these [26/06/18]
			if(data.role=="exchange") map.exchange=coords;
			if(data.quest) G.quests[data.quest]=coords;

		});
	}
	for(var id in G.items)
		G.items[id].id=id;
}

function test_logic()
{
	for(var id in G.items)
	{
		G.items[id].cash=0;
		G.items[id].g=G.items[id].g||1; // actual values now
	}
	for(var id in G.monsters)
	{
		G.monsters[id].xp=0;
	}
}

function map_cx(player)
{
	var cx={};
	for(var c in (player.p&&player.p.acx||player.acx||{}))
	{
		if(G.cosmetics.bundle[c])
			G.cosmetics.bundle[c].forEach(function(cc){ cx[cc]=c; })
		else if(G.cosmetics.map[c])
			cx[G.cosmetics.map[c]]=c;
		else
			cx[c]=c;
	}
	return cx;
}

function all_cx(player,send)
{
	var cx={};
	for(var c in (player.p&&player.p.acx||player.acx||{}))
	{
		if(G.cosmetics.bundle[c])
			G.cosmetics.bundle[c].forEach(function(cc){ cx[cc]=(cx[cc]||0)+1; })
		else if(G.cosmetics.map[c])
			cx[G.cosmetics.map[c]]=(cx[G.cosmetics.map[c]]||0)+1;
		else
			cx[c]=(cx[c]||0)+1;
	}
	if(send)
	{
		for(var s in (player.cx||{}))
		{
			var c=player.cx[s];
			if(G.cosmetics.bundle[c])
				G.cosmetics.bundle[c].forEach(function(cc){ cx[cc]=(cx[cc]||0)-1; })
			else if(G.cosmetics.map[c])
				cx[G.cosmetics.map[c]]=(cx[G.cosmetics.map[c]]||0)-1;
			else
				cx[c]=(cx[c]||0)-1;
		}
		[player.skin].forEach(function(c){
			if(G.cosmetics.bundle[c])
				G.cosmetics.bundle[c].forEach(function(cc){ cx[cc]=(cx[cc]||0)-1; })
			else if(G.cosmetics.map[c])
				cx[G.cosmetics.map[c]]=(cx[G.cosmetics.map[c]]||0)-1;
			else
				cx[c]=(cx[c]||0)-1;
		});
	}
	(player.p&&player.p.xcx||player.xcx||[]).forEach(function(c){
		if(G.cosmetics.bundle[c])
			G.cosmetics.bundle[c].forEach(function(cc){ cx[cc]=(cx[cc]||0)+0.01; })
		else if(G.cosmetics.map[c])
			cx[G.cosmetics.map[c]]=(cx[G.cosmetics.map[c]]||0)+0.01;
		else
			cx[c]=(cx[c]||0)+0.01;
	});
	(G.classes[player.ctype||player.type].xcx||[]).forEach(function(c){
		if(G.cosmetics.bundle[c])
			G.cosmetics.bundle[c].forEach(function(cc){ cx[cc]=(cx[cc]||0)+0.01; })
		else if(G.cosmetics.map[c])
			cx[G.cosmetics.map[c]]=(cx[G.cosmetics.map[c]]||0)+0.01;
		else
			cx[c]=(cx[c]||0)+0.01;
	});
	return cx;
}

function prune_cx(cx,skin)
{
	if(skin && cx.upper && cx.upper=="skin") delete cx.upper;
	for(var sname in cx)
	{
		if(!cx[sname] || sname=="upper" && T[cx[sname]]!="body" && T[cx[sname]]!="armor" || sname!="upper" && cxtype_to_slot[T[cx[sname]]]!=sname)
		{
			delete cx[sname];
			continue;
		}
	}
}

function hx(color)
{
	return eval("0x"+color.replace("#",""));
}

function hardcore_logic()
{
	for(var id in G.items)
	{
		// if(G.items[id].tier==2) G.items[id].a=0;
	}
	G.npcs.premium.items[3]="computer";
	G.npcs.premium.items[4]="tracker";
	G.npcs.premium.items.forEach(function(item){
		if(item)
		{
			G.items[item].cash=0;
			G.items[item].g=parseInt(G.items[item].g*2);
		}
	});
	for(var id in G.monsters)
	{
		if(G.monsters[id].respawn!=-1)
			G.monsters[id].respawn=1;
	}
	for(var id in G.tokens)
	{
		for(var m in G.tokens[id])
		{
			G.tokens[id][m]=1;
		}
	}
	G.tokens.monstertoken.fieldgen0=20;
	G.items.offering.g=parseInt(G.items.offering.g/2);
	G.items.xptome.g=99999999;
	G.items.computer.g=1;
	G.items.tracker.g=1;
	G.items.gemfragment.e=10;
	G.items.leather.e=5;
	G.maps.main.monsters.push({"type":"wabbit","boundary":[-282,702,218,872],"count":1});
	G.npcs.scrolls.items[9]="vitscroll";
	G.monsters.wabbit.evasion=96.0;
	G.monsters.wabbit.reflection=96.0;
	G.monsters.phoenix.respawn=1;
	G.monsters.mvampire.respawn=1;
	delete G.items.test_orb.upgrade;
	G.items.test_orb.compound={};
	// G.items.gem0.a=0;
	// G.items.gem1.a=0;
	// G.items.armorbox.a=0;
	// G.items.weaponbox.a=0;
}

function can_stack(a,b,d,args)
{
	if(a && b && a.name && G.items[a.name].s && a.name==b.name && a.q+b.q+(d||0)<=(G.items[a.name].s===true&&9999||G.items[a.name].s))
	{
		if((a.p || b.p) && a.p!=b.p) return false; // property
		if(a.name=="cxjar" && a.data!=b.data) return false;
		if(a.name=="emotionjar" && a.data!=b.data) return false;
		if(!args || !args.ignore_pvp) if(a.v && !b.v || !a.v && b.v) return false; // pvp
		if(a.l || b.l || a.b || b.b) return false; // blocked and locked
		return true;
	}
	return false;
}

function can_add_item(player,new_item,args) // long requested feature [18/10/18]
{
	if(!args) args={};
	if(!new_item.name) new_item=create_new_item(new_item,args.q||1);
	if(is_array(player)) // for "bank"/"swap"
	{
		player={items:player};
		for(var i=0;i<42;i++) if(!player.items[i]) return true;
	}
	if(player.esize>0) return true;
	if(G.items[new_item.name].s)
	{
		for(var i=0;i<player.items.length;i++)
		{
			var item=player.items[i];
			if(can_stack(item,new_item))
			{
				return true;
			}
		}
	}
	return false;
}

function can_add_items(player,items,args)
{
	if(!args) args={};
	var needed=items.length,overhead=[];
	if(player.esize+(args.space||0)>=needed || !needed) return true;
	items.forEach(function(new_item){
		if(G.items[new_item.name].s)
		{
			for(var i=0;i<player.items.length;i++)
			{
				var item=player.items[i];
				if(can_stack(item,new_item,overhead[i]||0))
				{
					overhead[i]=(overhead[i]||0)+new_item.q;
					needed--;
				}
			}
		}
	});
	if(player.esize+(args.space||0)>=needed) return true;
	return false;
}

var RESOLVE_ALL=false;
var deferreds={},current_deferred=null;
function deferred()
{
	var self=this;
	this.promise=new Promise(function(resolve,reject){
		self.reject = reject;
		self.resolve = resolve;
	});
}

function push_deferred(name)
{
	var current=new deferred();
	if(["attack","heal"].includes(name))
		current.start=new Date();
	if(!deferreds[name]) deferreds[name]=[];
	deferreds[name].push(current);
	if(deferreds[name].length>3200) deferreds[name].shift(); // outbreak
	return current.promise;
}

function push_deferreds(name,count)
{
	var deferreds=[];
	for(var i=0;i<count;i++)
		deferreds.push(push_deferred(name));
	return deferreds;
}

function resolve_deferreds(name,data)
{
	while(deferreds[name] && deferreds[name].length) resolve_deferred(name,data);
	delete deferreds[name];
}

function reject_deferreds(name,data)
{
	while(deferreds[name] && deferreds[name].length) reject_deferred(name,data);
	delete deferreds[name];
}

function resolve_deferred(name,data)
{
	if(!data) data={success:true};
	if(data.success!==false && !data.failed) data.success=true;
	if(is_sdk) console.log(["resolve",name,data]);
	// if(name=="attack" && (!deferreds.attack || !deferreds.attack.length) && deferreds.heal && deferreds.heal.length) name="heal"; // cupid logic [23/09/19]
	// if(name=="heal" && (!deferreds.heal || !deferreds.heal.length) && deferreds.attack && deferreds.attack.length) name="attack"; // ~impossible to perfectly predict the call/result
	if(!deferreds[name] || !deferreds[name].length) return console.error("Weird resolve_deferred issue: "+name),console.log("If you emit socket events manually, ignore this message");
	current_deferred=deferreds[name].shift();
	if(!deferreds[name].length)	delete deferreds[name];
	if(0) // bad idea to start with, regular pings to the server is a better idea [08/10/21]
	{
		if(deferreds[name] && deferreds[name].length && deferreds[name][deferreds[name].length-1].start) push_ping(mssince(deferreds[name][deferreds[name].length-1].start)); // if there's a promise bug, this covers the .ping outbreak issue
		else if(current_deferred.start) push_ping(mssince(current_deferred.start));
	}
	try{
		current_deferred.resolve(data);
	}catch(e){
		try{
			// never called in chrome because resolve exceptions are automatically chained as secondary rejects
			call_code_function("game_log","resolve_callback_exception: "+e,colors.code_error);
			current_deferred.reject({exception:"resolve_callback_exception",reason:"exception"});
		}catch(e){
		};
	}
	current_deferred=null
}

function reject_deferred(name,data)
{
	if(!data) data={failed:true};
	data.failed=true;
	if(RESOLVE_ALL) return resolve_deferred(name,data);
	if(!deferreds[name] || !deferreds[name].length) return console.error("Weird reject_deferred issue: "+name),console.log("If you emit socket events manually, ignore this message");
	current_deferred=deferreds[name].shift();
	if(!deferreds[name].length)	delete deferreds[name];
	try{
		current_deferred.reject(data);
	}catch(e){
		try{
			// reject exceptions are automatically chained as secondary rejects too
			call_code_function("game_log","reject_callback_exception: "+e,colors.code_error);
			current_deferred.reject({exception:"reject_callback_exception",reason:"exception"});
		}catch(e){};
	}
	current_deferred=null
}

function rejecting_promise(data)
{
	if(!data) data={failed:true};
	if(!data.reason) data.reason="unknown";
	data.failed=true;
	return new Promise(function(resolve,reject){ if(RESOLVE_ALL) resolve(data); else reject(data); });
}

function resolving_promise(data)
{
	if(!data) data={success:true};
	if(data.success!==false && !data.failed) data.success=true;
	return new Promise(function(resolve,reject){ resolve(data); });
}

function object_sort(o,algorithm)
{
	function lexi(x,y)
	{
		if(x[0]<y[0]) return -1;
		return 1;
	}
	function random(x,y)
	{
		return 0.5-Math.random();
	}
	function vsort(x,y)
	{
		if(x[1]<y[1]) return -1;
		else if(x[1]==y[1] && x[0]<y[0]) return -1;
		return 1;
	}
	function gsort(x,y)
	{
		// console.log(x);
		if(G.items[x[0]].g<G.items[y[0]].g) return -1;
		else if(G.items[x[0]].g<G.items[y[0]].g && x[0]<y[0]) return -1;
		return 1;
	}
	function hpsort(x,y)
	{
		if(x[1].hp!=y[1].hp) return x[1].hp-y[1].hp;
		if(x[0]<y[0]) return -1;
		return 1;
	}
	var a=[];
	for(var id in o) a.push([id,o[id]]);
	if(algorithm=="hpsort") a.sort(hpsort);
	else if(algorithm=="random") a.sort(random);
	else if(algorithm=="value") a.sort(vsort);
	else if(algorithm=="gold_value") a.sort(gsort);
	else a.sort(lexi);
	return a;
}

function direction_logic(entity,target,mode)
{
	if(entity!=target)
	{
		entity.a_angle=Math.atan2(get_y(target)-get_y(entity),get_x(target)-get_x(entity))*180/Math.PI;
		// if(is_server && entity.moving) return; // maybe add the is_server [06/10/19]
		entity.angle=entity.a_angle;
	}
	if(is_game && !new_attacks && entity.moving) return;
	set_direction(entity,entity.moving&&"soft"||mode);
}

function within_xy_range(observer,entity)
{
	if(observer['in']!=entity['in']) return false
	if(!observer.vision) return false;
	var x=get_x(entity),y=get_y(entity),o_x=get_x(observer),o_y=get_y(observer);
	if(o_x-observer.vision[0]<x && x<o_x+observer.vision[0] && o_y-observer.vision[1]<y && y<o_y+observer.vision[1]) return true;
	return false;
}

function distance(a, b) {
	// https://discord.com/channels/238332476743745536/1025784763958693958
	if (!a || !b) return 99999999;
	if ("in" in a && "in" in b && a.in != b.in) return 99999999;
	if ("map" in a && "map" in b && a.map != b.map) return 99999999;

	const a_x = get_x(a);
	const a_y = get_y(a);
	const b_x = get_x(b);
	const b_y = get_y(b);

	const aHalfWidth = get_width(a) / 2;
	const aHeight = get_height(a);
	const bHalfWidth = get_width(b) / 2;
	const bHeight = get_height(b);

	// Compute bounds of each rectangle
	const aLeft = a_x - aHalfWidth;
	const aRight = a_x + aHalfWidth;
	const aTop = a_y - aHeight;
	const aBottom = a_y;

	const bLeft = b_x - bHalfWidth;
	const bRight = b_x + bHalfWidth;
	const bTop = b_y - bHeight;
	const bBottom = b_y;

	const dx = Math.max(bLeft - aRight, aLeft - bRight, 0);
	const dy = Math.max(bTop - aBottom, aTop - bBottom, 0);

	return Math.sqrt(dx * dx + dy * dy);
}

function random_away(x,y,R) // https://stackoverflow.com/a/5838055/914546
{
	var t=2*Math.PI*Math.random();
	var u=Math.random()*2;
	var r=u>1&&(2-u)||u;
	return [x+R*r*Math.cos(t),y+R*r*Math.sin(t)];
}

function can_transport(entity)
{
	return can_walk(entity);
}

function can_walk(entity)
{
	if(entity.s && entity.s.dash) return false;
	if(is_game && entity.me && transporting && ssince(transporting)<8 && !entity.c.town) return false;
	if(is_code && entity.me && parent.transporting && ssince(parent.transporting)<8 && !entity.c.town) return false;
	return !is_disabled(entity);
}

function is_silenced(entity)
{
	if(!entity || is_disabled(entity) || (entity.s && entity.s.silenced)) return true;
}

function is_disabled(entity)
{
	if(!entity || entity.rip || (entity.s && (entity.s.stunned || entity.s.fingered || entity.s.stoned || entity.s.deepfreezed || entity.s.sleeping))) return true;
}

function calculate_item_grade(def,item)
{
	if(!(def.upgrade || def.compound)) return 0;
	if((item&&item.level||0)>=(def.grades||[9,10,11,12])[3]) return 4;
	if((item&&item.level||0)>=(def.grades||[9,10,11,12])[2]) return 3;
	if((item&&item.level||0)>=(def.grades||[9,10,11,12])[1]) return 2;
	if((item&&item.level||0)>=(def.grades||[9,10,11,12])[0]) return 1;
	return 0;
}

function calculate_item_value(item,m)
{
	if(!item) return 0;
	if(item.gift) return 1;
	var def=G.items[item.name]||G.items.placeholder_m,value=def.cash&&def.g||def.g*(m||0.6),divide=1; // previously 0.8
	if(def.markup) value/=def.markup;
	if(def.compound && item.level)
	{
		var grade=0,grades=def.grades||[11,12],s_value=0;
		for(var i=1;i<=item.level;i++)
		{
			if(i>grades[1]) grade=2;
			else if(i>grades[0]) grade=1;
			if(def.cash) value*=1.5;
			else value*=3.2;
			if(def.type!="booster") value+=G.items["cscroll"+grade].g/2.4;
			else value*=0.75;
		}
	}
	if(def.upgrade && item.level)
	{
		var grade=0,grades=def.grades||[11,12],s_value=0;
		for(var i=1;i<=item.level;i++)
		{
			if(i>grades[1]) grade=2;
			else if(i>grades[0]) grade=1;
			s_value+=G.items["scroll"+grade].g/2;
			if(i>=7) value*=3,s_value*=1.32;
			else if(i==6) value*=2.4;
			else if(i>=4) value*=2;
			if(i==9) value*=2.64,value+=400000;
			if(i==10) value*=5;
			//if(i==11) value*=2;
			if(i==12) value*=0.8;
		}
		value+=s_value;
	}
	if(item.expires) divide=8;
	return round(value/divide)||0;
}

var prop_cache={}; // reset at reload_server

function damage_multiplier(defense) // [10/12/17]
{
	return	min(1.32,max(0.05,1-(max(0,min(100,defense))*0.00100+
			max(0,min(100,defense-100))*0.00100+
			max(0,min(100,defense-200))*0.00095+
			max(0,min(100,defense-300))*0.00090+
			max(0,min(100,defense-400))*0.00082+
			max(0,min(100,defense-500))*0.00070+
			max(0,min(100,defense-600))*0.00060+
			max(0,min(100,defense-700))*0.00050+
			max(0,defense-800)*0.00040)+
			max(0,min(50,0-defense))*0.00100+ // Negative's / Armor Piercing
			max(0,min(50,-50-defense))*0.00075+
			max(0,min(50,-100-defense))*0.00050+
			max(0,-150-defense)*0.00025
			));
}

function dps_multiplier(defense) // [10/12/17]
{
	return	1-(max(0,min(100,defense))*0.00100+
			max(0,min(100,defense-100))*0.00100+
			max(0,min(100,defense-200))*0.00095+
			max(0,min(100,defense-300))*0.00090+
			max(0,min(100,defense-400))*0.00082+
			max(0,min(100,defense-500))*0.00070+
			max(0,min(100,defense-600))*0.00060+
			max(0,min(100,defense-700))*0.00050+
			max(0,defense-800)*0.00040)+
			max(0,min(50,0-defense))*0.00100+ // Negative's / Armor Piercing
			max(0,min(50,-50-defense))*0.00075+
			max(0,min(50,-100-defense))*0.00050+
			max(0,-150-defense)*0.00025
}

function adopt_extras(def,ex)
{
	for(var p in ex)
	{
		if(p=='upgrade' || p=='compound')
		{
			for(var pp in ex)
			{
				def[p][pp]=(def[p][pp]||0)+ex[p][pp];
			}
		}
		else
			def[p]=(def[p]||0)+ex[p];
	}
}

function calculate_item_properties(item,args)
{
	if(!args) args={};
	var def=args.def||G.items[item.name],cls="",map="";
	if(args['class'] && def[args['class']]) cls=args['class'];
	if(args['map'] && def[args['map']]) map=args['map'];
	var prop_key=def.name+item.name+(def.card||"")+"|"+item.level+"|"+item.stat_type+"|"+item.p+"|"+cls+"|"+map;
	if(prop_cache[prop_key]) return prop_cache[prop_key];
	if(cls || map) def=clone(def);
	if(cls) adopt_extras(def,def[cls]);
	if(map) adopt_extras(def,def[map]);
	//#NEWIDEA: An item cache here [15/11/16]
	var prop={
		"gold":0,
		"luck":0,
		"xp":0,
		"int":0,
		"str":0,
		"dex":0,
		"vit":0,
		"for":0,
		"charisma":0,
		"cuteness":0,
		"awesomeness":0,
		"bling":0,
		"hp":0,
		"mp":0,
		"attack":0,
		"range":0,
		"armor":0,
		"incdmgamp":0,
		"resistance":0,
		"pnresistance":0,
		"firesistance":0,
		"fzresistance":0,
		"phresistance":0,
		"stresistance":0,
		"stun":0,
		"blast":0,
		"explosion":0,
		"breaks":0,
		"stat":0,
		"speed":0,
		"level":0,
		"evasion":0,
		"miss":0,
		"reflection":0,
		"lifesteal":0,
		"manasteal":0,
		"attr0":0,
		"attr1":0,
		"rpiercing":0,
		"apiercing":0,
		"crit":0,
		"critdamage":0,
		"dreturn":0,
		"frequency":0,
		"mp_cost":0,
		"mp_reduction":0,
		"output":0,
		"courage":0,
		"mcourage":0,
		"pcourage":0,
		"set":null,
		"class":null,
	};
	var mult={
		"gold":0.5,
		"luck":1,
		"xp":0.5,
		"int":1,
		"str":1,
		"dex":1,
		"vit":1,
		"for":1,
		"armor":2.25,
		"resistance":2.25,
		"speed":0.325,
		"evasion":0.325,
		"reflection":0.150,
		"lifesteal":0.15,
		"manasteal":0.040,
		"rpiercing":2.25,
		"apiercing":2.25,
		"crit":0.125,
		"dreturn":0.5,
		"frequency":0.325,
		"mp_cost":-0.6,
		"output":0.175,
	};
	if(item.p=="shiny")
	{
		if(def.attack)
		{
			prop.attack+=4;
			if(doublehand_types.includes(G.items[item.name].wtype)) prop.attack+=3;
		}
		else if(def.stat)
		{
			prop.stat+=2;
		}
		else if(def.armor)
		{
			prop.armor+=12;
			prop.resistance=(prop.resistance||0)+10;
		}
		else
		{
			prop.dex+=1;
			prop['int']+=1;
			prop.str+=1;
		}
	}
	else if(item.p=="glitched")
	{
		var roll=Math.random();
		if(roll<0.33)
		{
			prop.dex+=1;
		}
		else if(roll<0.66)
		{
			prop['int']+=1;
		}
		else
		{
			prop.str+=1;
		}
	}
	else if(item.p && G.titles[item.p])
	{
		for(var p in G.titles[item.p])
			if(p in prop)
				prop[p]+=G.titles[item.p][p];
	}
	if(def.upgrade||def.compound)
	{
		var u_def=def.upgrade||def.compound;
		level=item.level||0;
		prop.level=level;
		for(var i=1;i<=level;i++)
		{
			var multiplier=1;
			if(def.upgrade)
			{
				if(i==7) multiplier=1.25;
				if(i==8) multiplier=1.5;
				if(i==9) multiplier=2;
				if(i==10) multiplier=3;
				if(i==11) multiplier=1.25;
				if(i==12) multiplier=1.25;
			}
			else if(def.compound)
			{
				if(i==5) multiplier=1.25;
				if(i==6) multiplier=1.5;
				if(i==7) multiplier=2;
				if(i>=8) multiplier=3;
			}
			for(p in u_def)
			{
				if(p=="stat") prop[p]+=round(u_def[p]*multiplier);
				else prop[p]+=u_def[p]*multiplier; // for weapons with float improvements [04/08/16]
				if(p=="stat" && i>=7) prop.stat++;
			}
		}

	}
	if(item.level==10 && prop.stat && def.tier && def.tier>=3) prop.stat+=2;
	for(p in def)
		if(prop[p]===null) prop[p]=def[p];
		else if(prop[p]!=undefined) prop[p]+=def[p];
	if(item.p=="legacy" && def.legacy)
	{
		for(var name in def.legacy)
		{
			if(def.legacy[name]===null) delete prop[name];
			else prop[name]=(prop[name]||0)+def.legacy[name];
		}
	}
	for(p in prop)
		if(!in_arr(p,["evasion","miss","reflection","dreturn","lifesteal","manasteal","attr0","attr1","crit","critdamage","set","class","breaks"])) prop[p]=round(prop[p]);
	if(def.stat && item.stat_type)
	{
		prop[item.stat_type]+=prop.stat*mult[item.stat_type];
		prop.stat=0;
	}
	// for(p in prop) prop[p]=floor(prop[p]); - round probably came after this one, commenting out [13/09/16]
	prop_cache[prop_key]=prop;
	return prop;
}

function random_one(arr)
{
	if(!is_array(arr)) return random_one(Object.values(arr));
	if(!arr.length) return null;
	return arr[parseInt(arr.length*Math.random())];
}

function floor_f2(num)
{
	return parseInt(num*100)/100.0;
}

function to_pretty_float(num)
{
	return (0 + Math.trunc((num||0) * 100) / 100).toLocaleString("en-US");
	if(!num) return "0";
	var hnum=floor_f2(num).toFixed(2),num=parseFloat(hnum);
	if(parseFloat(hnum)==parseFloat(num.toFixed(1))) hnum=num.toFixed(1);
	if(parseFloat(hnum)==parseFloat(parseInt(num))) hnum=parseInt(num);
	return hnum;
}

function to_pretty_num(num)
{
	return (Math.floor(num||0) + 0).toLocaleString("en-US");
	if(!num) return "0";
	num=round(num);
	var pretty="";
	while(num)
	{
		var current=num%1000;
		if(!current) current="000";
		else if(current<10 && current!=num) current="00"+current;
		else if(current<100 && current!=num) current="0"+current;
		if(!pretty) pretty=current;
		else pretty=current+","+pretty;
		num=(num-num%1000)/1000;
	}
	return ""+pretty;
}

function smart_num(num,edge)
{
	if(!edge) edge=10000;
	if(num>=edge) return to_pretty_num(num);
	return num;
}

function to_shrinked_num(num)
{
	if(!num) return "0";
	num=round(num);
	if(num<1000) return ""+num;
	var arr=[[1000,"K"],[1000000,"M"],[1000000000,"B"],[1000000000000,"T"]];
	for(var i=0;i<arr.length;i++)
	{
		var current=arr[i];
		if(num>=1000*current[0]) continue;
		var whole=floor(num/current[0]);
		var remainder=floor((num%current[0])/(current[0]/10));
		var pretty=whole+"."+remainder;
		pretty=pretty.substr(0,3);
		if(pretty.endsWith(".00")) pretty=pretty.replace(".00","");
		if(pretty.endsWith(".0")) pretty=pretty.replace(".0","");
		if(pretty.endsWith(".")) pretty=pretty.replace(".","");
		return pretty+current[1];
	}
	return "LOTS";
}

var valid_file_chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz_-.+ ";
function to_filename(name)
{
	var c="",v=valid_file_chars.split("");
	(""+name).split("").forEach(function(ch){
		if(v.includes(ch)) c+=ch;
	})
	return c;
}

function e_array(num)
{
	var array=[];
	for(var i=0;i<num;i++) array.push(null);
	return array;
}
function set_xy(entity,x,y)
{
	if("real_x" in entity) entity.real_x=x,entity.real_y=y;
	else entity.x=x,entity.y=y;
}

function get_xy(e)
{
	return [get_x(e),get_y(e)];
}

function get_x(e)
{
	if("real_x" in e) return e.real_x;
	return e.x;
}

function get_y(e)
{
	if("real_y" in e) return e.real_y;
	return e.y;
}

function get_width(e) // visual width
{
	if(e.proxy_character) return e.awidth;
	if("awidth" in e) return e.awidth;
	return (e.width||0)/(e.mscale||1);
}

function get_height(e) // visual height
{
	if(e.proxy_character) return e.aheight;
	if("aheight" in e) return e.aheight;
	return (e.height||0)/(e.mscale||1);
}

function simple_distance(a,b)
{
	var a_x=get_x(a),a_y=get_y(a),b_x=get_x(b),b_y=get_y(b);
	if(a.map && b.map && a.map!=b.map) return 9999999;
	return Math.sqrt((a_x-b_x)*(a_x-b_x)+(a_y-b_y)*(a_y-b_y))
}

function calculate_vxy(monster,speed_mult)
{
	if(!speed_mult) speed_mult=1;
	monster.ref_speed=monster.speed;
	var total=0.0001+sq(monster.going_x-monster.from_x)+sq(monster.going_y-monster.from_y);
	total=sqrt(total);
	monster.vx=monster.speed*speed_mult*(monster.going_x-monster.from_x)/total;
	monster.vy=monster.speed*speed_mult*(monster.going_y-monster.from_y)/total;
	if(1 || is_game) monster.angle=Math.atan2(monster.going_y-monster.from_y,monster.going_x-monster.from_x)*180/Math.PI; // now the .angle is used on .resync [03/08/16]
	// -90 top | 0 right | 180/-180 left | 90 bottom
	// if(monster==character) console.log(monster.angle);
}

function recalculate_vxy(monster)
{
	if(monster.moving && monster.ref_speed!=monster.speed)
	{
		if(is_server) monster.move_num++;
		calculate_vxy(monster);
	}
}

function is_in_front(observer,entity)
{
	var angle=Math.atan2(get_y(entity)-get_y(observer),get_x(entity)-get_x(observer))*180/Math.PI;
	// console.log(angle+" vs existing "+observer.angle);
	if(observer.angle!==undefined && Math.abs(observer.angle-angle)<=45) return true; // drawn at notebook 2, based on those drawings [11/09/16]
	return false;
}

function calculate_movex(map, cur_x, cur_y, target_x, target_y) {
	if(target_x==Infinity) target_x=CINF;
	if(target_y==Infinity) target_y=CINF;
	//console.log(cur_x+" "+cur_y+" "+target_x+" "+target_y);

	var going_down = cur_y < target_y;
	var going_right = cur_x < target_x;

	var x_lines = map.x_lines || [];
	var y_lines = map.y_lines || [];

	var min_x = min(cur_x, target_x);
	var max_x = max(cur_x, target_x);
	var min_y = min(cur_y, target_y);
	var max_y = max(cur_y, target_y);

	var dx = target_x - cur_x;
	var dy = target_y - cur_y;

	var dydx = dy / (dx + REPS);
	//console.log(dydx);
	var dxdy = 1 / dydx;

	var XEPS=10*EPS; // 1 EPS isn't enough, can's move along line[0]+EPS with can_move


	for (var i = bsearch_start(x_lines,min_x); i < x_lines.length; i++) {
		var line = x_lines[i];
		var line_x = line[0],line_xE=line_x+XEPS;
		if(going_right) line_xE=line_x-XEPS;

		if(max_x < line_x) break;
		if (max_x < line_x || min_x > line_x || max_y < line[1] || min_y > line[2]) {
			continue;
		}

		var y_intersect = cur_y + (line_x - cur_x) * dydx;

		if(eps_equal(cur_x,target_x) && eps_equal(cur_x,line_x)) // allows you to move parallelly right into the lines
		{
			line_xE=line_x;
			if (going_down) y_intersect=min(line[1],line[2])-XEPS, target_y=min(target_y, y_intersect), max_y = target_y;
			else y_intersect=max(line[1],line[2])+XEPS, target_y=min(target_y, y_intersect), min_y = target_y;
			continue;
		}


		if (y_intersect < line[1] || y_intersect > line[2]) {
			continue;
		}

		
		if (going_down) {
			target_y = min(target_y, y_intersect);
			max_y = target_y;
		} else {
			target_y = max(target_y, y_intersect);
			min_y = target_y;
		}

		if (going_right) {
			target_x = min(target_x, line_xE); // Can never be directly on the lines themselves
			max_x = target_x;
		} else {
			target_x = max(target_x, line_xE);
			min_x = target_x;
		}
	}

	for (var i = bsearch_start(y_lines,min_y); i < y_lines.length; i++) {
		var line = y_lines[i];
		var line_y = line[0],line_yE=line_y+XEPS;
		if(going_down) line_yE=line_y-XEPS;

		if(max_y < line_y) break;
		if (max_y < line_y || min_y > line_y || max_x < line[1] || min_x > line[2]) {
			continue;
		}

		var x_intersect = cur_x + (line_y - cur_y) * dxdy;

		if(eps_equal(cur_y,target_y) && eps_equal(cur_y,line_y))
		{
			line_yE=line_y;
			if (going_right) x_intersect=min(line[1],line[2])-XEPS, target_x=min(target_x, x_intersect), max_x = target_x;
			else x_intersect=max(line[1],line[2])+XEPS, target_x=min(target_x, x_intersect), min_x = target_x;
			continue;
		}

		if (x_intersect < line[1] || x_intersect > line[2]) {
			continue;
		}

		
		if (going_right) {
			target_x = min(target_x, x_intersect);
			max_x = target_x;
		} else {
			target_x = max(target_x, x_intersect);
			min_x = target_x;
		}

		if (going_down) {
			target_y = min(target_y, line_yE);
			max_y = target_y;
		} else {
			target_y = max(target_y, line_yE);
			min_y = target_y;
		}
	}

	// console.log(target_x+" "+target_y);
	return {
		x: target_x,
		y: target_y
	};
}

function set_base(entity)
{
	var type=entity.mtype||entity.type;
	entity.base={h:8,v:7,vn:2};
	if(G.dimensions[type] && G.dimensions[type][3])
	{
		entity.base.h=G.dimensions[type][3];
		entity.base.v=min(9.9,G.dimensions[type][4]); // v+vn has to be <12
	}
	else
	{
		entity.base.h=min(12,(get_width(entity)||0)*0.80);
		entity.base.v=min(9.9,(get_height(entity)||0)/4.0);
		if(!entity.base.h) entity.base.h=8,entity.base.v=7;
	}
}

function calculate_move_v2(map, cur_x, cur_y, target_x, target_y) // improved, v2 - all movements should originate from cur_x and cur_y
{
	if(target_x==Infinity) target_x=CINF;
	if(target_y==Infinity) target_y=CINF;
	var move=calculate_movex(map, cur_x, cur_y, target_x, target_y);
	if(move.x!=target_x && move.y!=target_y) // this is a smooth move logic - if a line hit occurs, keeps moving in the movable direction
	{
		var move2=calculate_movex(map, cur_x,cur_y, target_x, move.y);
		if(move2.x==move.x)
		{
			var move2=calculate_movex(map, cur_x,cur_y, move2.x, target_y);
		}
		return move2;
	}
	// return move_further(cur_x,cur_y,move.x,move.y,100);
	return move;
}

var m_calculate=false,m_line_x=false,m_line_y=false,line_hit_x=null,line_hit_y=null,m_dx,m_dy; // flags so can_calculate and can_move work in synergy

function calculate_move(entity,target_x,target_y) // v5, calculate 4 edges, choose the minimal move [18/07/18]
{
	// -8,+8 left/right 0,-7 down/up
	m_calculate=true;
	var map=entity.map,cur_x=get_x(entity),cur_y=get_y(entity);
	var corners=[[0,0]];
	var moves=[[target_x,target_y]],x_moves=[]; 
	if(entity.base) corners=[[-entity.base.h,entity.base.vn],[entity.base.h,entity.base.vn],[-entity.base.h,-entity.base.v],[entity.base.h,-entity.base.v]];
	// Test the movement limits of all 4 corners of an entity, and record the [mmx,mmy] at the limit
	corners.forEach(function(mxy){
		for(var i=0;i<3;i++)
		{
			var mx=mxy[0],my=mxy[1];
			var dx=target_x+mx,dy=target_y+my;
			if(i==1) dx=cur_x+mx;
			if(i==2) dy=cur_y+my;
			var cmove=calculate_movex(G.geometry[map]||{},cur_x+mx,cur_y+my,dx,dy);
			var cdist=point_distance(cur_x+mx,cur_y+my,cmove.x,cmove.y);
			// add_log(cdist,"orange");
			
			mx=cmove.x-mx;
			my=cmove.y-my;
			// add_log("mx/y: "+mx+","+my);

			if(!in_arrD2([mx,my],moves)) moves.push([mx,my]);
			// New logic, just check all possibilities, original logic just checked the min cdist
			// Sometimes the minimum move is just a stuck corner in another move angle, so all possibilities need to be checked
			// if(Math.abs(mx-round(mx))<40*EPS && !in_arrD2([mx,cur_y],moves)) moves.push([mx,cur_y]);
			// x- if(Math.abs(mx-round(mx))<40*EPS && !in_arrD2([mx,target_y],moves) || 1) moves.push([mx,target_y]);
			// if(Math.abs(my-round(my))<40*EPS && !in_arrD2([cur_x,my],moves)) moves.push([cur_x,my]);
			// x- if(Math.abs(my-round(my))<40*EPS && !in_arrD2([target_x,my],moves) || 1) moves.push([target_x,my]);
		}
	});
	// console.log(moves);
	var max=-1,move={x:cur_x,y:cur_y},min=CINF;
	// Test all boundary coordinates, if none of them work, don't move
	function check_move(xy)
	{ // This is the smooth move logic, even if you hit a line, you might still move along that line
		var x=xy[0],y=xy[1];
		if(can_move({map:map,x:cur_x,y:cur_y,going_x:x,going_y:y,base:entity.base}))
		{
			// var cdist=point_distance(cur_x,cur_y,x,y);
			// if(cdist>max)
			// {
			// 	max=cdist;
			// 	move={x:x,y:y};
			// }
			var cdist=point_distance(target_x,target_y,x,y);
			// #IDEA: If the angle difference between intended angle, and move angle is factored in too, the selected movement could be the most natural one [20/07/18] 
			if(cdist<min)
			{
				min=cdist;
				move={x:x,y:y};
			}
		}
		if(line_hit_x!==null) x_moves.push([line_hit_x,line_hit_y]),line_hit_x=null,line_hit_y=null;
	}
	moves.forEach(check_move);
	// console.log(x_moves);
	x_moves.forEach(check_move);
	//add_log("Intention: "+target_x+","+target_y);
	//add_log("Calculation: "+move.x+","+move.y+" ["+max+"]");
	//add_log(point_distance(cur_x,cur_y,move.x,move.y),"#FC5066");
	if(point_distance(cur_x,cur_y,move.x,move.y)<10*EPS) move={x:cur_x,y:cur_y}; // The new movement has a bouncing effect, so for small moves, just don't move
	m_calculate=false;
	return move;
}

// Why are there so many imperfect, mashed up movement routines? [17/07/18]
// First of all there is no order to lines, the map maker inserts lines randomly, so they are not polygons etc.
// Even if they were polygons, there are non-movable regions inside movable regions
// So all in all, the game evolved into a placeholder, non-perfect, not well-thought line system, that became permanent
// One other challenge is visuals, the x,y of entities and their bottom points, so if they move too close to the lines, the game doesn't look appealing
// Anyway, that's pretty much what's going on here, the latest iterations are pretty complex in a bad way, but they account for all the issues and challenges, include improvements
// If there's even a slightest mismatch, any edge case not handled, it will cause a player or monster to walk out the lines, be jailed, and mess up the game
// [19/07/18] - Finally solved all the challenges, by considering entities as 4 cornered rectangles, and making sure all 4 corners can move

// Caveats of the 4-corner - if there's a single line, for example a fence line, the player rectangle can be penetrated

function point_distance(x0,y0,x1,y1)
{
	return Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0))
}

function recalculate_move(entity)
{
	move=calculate_move(entity,entity.going_x,entity.going_y);
	entity.going_x=move.x;
	entity.going_y=move.y;
}

function bsearch_start(arr,value)
{
	var start=0,end=arr.length-1,current;
	while(start<end-1)
	{
		current=parseInt((start+end)/2);
		if(arr[current][0]<value) start=current;
		else end=current-1;
	}
	// while(start<arr.length && arr[start][0]<value) start++;
	// If this line is added, some of the can_move + calculate_movex conditions can be removed [19/07/18]
	return start;
}

function base_points(x,y,base)
{
	return [[x-base.h,y+base.vn],[x+base.h,y+base.vn],[x-base.h,y-base.v],[x+base.h,y-base.v]];
}

function can_move(monster,based)
{
	// An XY-tree would be ideal, but the current improvements should be enough [16/07/18]
	var GEO=G.geometry[monster.map]||{},c=0;
	var x0=monster.x,y0=monster.y,x1=monster.going_x,y1=monster.going_y,next,minx=min(x0,x1),miny=min(y0,y1),maxx=max(x0,x1),maxy=max(y0,y1);
	if(!based && monster.base) // If entity is a rectangle, check all 4 corner movements
	{
		var can=true;
		[[-monster.base.h,monster.base.vn],[monster.base.h,monster.base.vn],[-monster.base.h,-monster.base.v],[monster.base.h,-monster.base.v]].forEach(function(mxy){
			var mx=mxy[0],my=mxy[1];
			if(!can || !can_move({map:monster.map,x:x0+mx,y:y0+my,going_x:x1+mx,going_y:y1+my},1)) can=false;
		});
		if(1) // fence logic, orphan lines - at the destination, checks whether we can move from one rectangle point to the other, if we can't move, it means a line penetrated the rectangle
		{ // [20/07/18]
			var px0=monster.base.h,px1=-monster.base.h; m_line_x=max;// going left
			if(x1>x0) px0=-monster.base.h,px1=monster.base.h,mcy=m_line_x=min; // going right
			var py0=monster.base.vn,py1=-monster.base.v; m_line_y=max; // going up
			if(y1>y0) py0=-monster.base.v,py1=monster.base.vn,m_line_y=min; // going down

			m_dx=-px1; m_dy=-py1; // Find the line hit, then convert to actual coordinates
			if(!can || !can_move({map:monster.map,x:x1+px1,y:y1+py0,going_x:x1+px1,going_y:y1+py1},1)) can=false;
			if(!can || !can_move({map:monster.map,x:x1+px0,y:y1+py1,going_x:x1+px1,going_y:y1+py1},1)) can=false;
			m_line_x=m_line_y=false;

		}
		return can;
	}
	function line_hit_logic(ax,ay,bx,by)
	{
		line_hit_x=m_line_x(ax,bx),line_hit_x=m_line_x(line_hit_x+6*EPS,line_hit_x-6*EPS)+m_dx;
		line_hit_y=m_line_y(ay,by),line_hit_y=m_line_y(line_hit_y+6*EPS,line_hit_y-6*EPS)+m_dy;
	}
	for(var i=bsearch_start(GEO.x_lines||[],minx);i<(GEO.x_lines||[]).length;i++)
	{
		if(is_server) perfc.roam_ops+=1;
		var line=GEO.x_lines[i]; // c++;
		if(line[0]==x1 && (line[1]<=y1 && line[2]>=y1 || line[0]==x0 && y0<=line[1] && y1>line[1])) // can't move directly onto lines - or move over lines, parallel to them
		{
			if(m_line_y) line_hit_logic(line[0],line[1],line[0],line[2]);
			return false;
		}
		if(minx>line[0]) continue; // can be commented out with: while(start<arr.length && arr[start][0]<value) start++;
		if(maxx<line[0]) break; // performance improvement, we moved past our range [16/07/18]
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+REPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue; // Fixed EPS [16/07/18]
		//add_log("line clash")
		if(m_line_y) line_hit_logic(line[0],line[1],line[0],line[2]);
		return false;
	}
	for(var i=bsearch_start(GEO.y_lines||[],miny);i<(GEO.y_lines||[]).length;i++)
	{
		if(is_server) perfc.roam_ops+=1;
		var line=GEO.y_lines[i]; // c++;
		if(line[0]==y1 && (line[1]<=x1 && line[2]>=x1 || line[0]==y0 && x0<=line[1] && x1>line[1]))
		{
			if(m_line_x) line_hit_logic(line[1],line[0],line[2],line[0]);
			return false;
		}
		if(miny>line[0]) continue;
		if(maxy<line[0]) break;
		next=x0+(x1-x0)*(line[0]-y0)/(y1-y0+REPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue;
		if(m_line_x) line_hit_logic(line[1],line[0],line[2],line[0]);
		return false;
	}
	// console.log(c);
	return true;
}

function closest_line(map,x,y)
{
	var min=16000;
	[[0,16000],[0,-16000],[16000,0],[-16000,0]].forEach(function(mxy){
		var mx=mxy[0],my=mxy[1];
		var move=calculate_move({map:map,x:x,y:y},x+mx,y+my);
		// console.log(move);
		var cdist=point_distance(x,y,move.x,move.y);
		if(cdist<min) min=cdist;
	});
	return min;
}

function unstuck_logic(entity) // handles the case where you can blink onto a line
{
	if(!can_move({map:entity.map,x:get_x(entity),y:get_y(entity),going_x:get_x(entity),going_y:get_y(entity)+EPS/2,base:entity.base}))
	{
		var fixed=false;
		if(can_move({map:entity.map,x:get_x(entity),y:get_y(entity)+8.1,going_x:get_x(entity),going_y:get_y(entity)+8.1+EPS/2,base:entity.base}))
		{
			set_xy(entity,get_x(entity),get_y(entity)+8.1); fixed=true;
		}
		else if(can_move({map:entity.map,x:get_x(entity),y:get_y(entity)-8.1,going_x:get_x(entity),going_y:get_y(entity)-8.1-EPS/2,base:entity.base}))
		{
			set_xy(entity,get_x(entity),get_y(entity)-8.1); fixed=true;
		}
		if(!fixed) console.log("#CRITICAL: Couldn't fix blink onto line issue");
		else console.log("Blinked onto line, fixed");
	}
}

function stop_logic(monster)
{
	if(!monster.moving) return;
	var x=get_x(monster),y=get_y(monster);
	// old: if((monster.from_x<=monster.going_x && x>=monster.going_x) || (monster.from_x>=monster.going_x && x<=monster.going_x) || abs(x-monster.going_x)<0.3 || abs(y-monster.going_y)<0.3)
	if(((monster.from_x<=monster.going_x && x>=monster.going_x-0.1) || (monster.from_x>=monster.going_x && x<=monster.going_x+0.1)) &&
		((monster.from_y<=monster.going_y && y>=monster.going_y-0.1) || (monster.from_y>=monster.going_y && y<=monster.going_y+0.1)))
	{
		set_xy(monster,monster.going_x,monster.going_y);

		//monster.going_x=undefined; - setting these to undefined had bad side effects, where a character moves in the client side, stops in server, and going_x becoming undefined mid transit client side [18/06/18]
		//monster.going_y=undefined;

		if(monster.loop)
		{
			monster.going_x=monster.positions[(monster.last_m+1)%monster.positions.length][0];
			monster.going_y=monster.positions[(++monster.last_m)%monster.positions.length][1];
			monster.u=true;
			start_moving_element(monster);
			return;
		}
		
		monster.moving=monster.amoving||false;
		monster.vx=monster.vy=0; // added these 2 lines, as the character can walk outside when setTimeout ticks at 1000ms's [26/07/16]
		// if(monster.me) console.log(monster.real_x+","+monster.real_y);
		if(monster.s && monster.s.dash)
		{
			delete monster.s.dash;
			if(is_server) resend(monster,"u+cid");
		}
		if(monster.name_tag) stop_name_tag(monster);
		if(monster.me)
		{
			resolve_deferreds("move",{reason:"stopped"});
			showhide_quirks_logic();
		}
		if(monster.is_monster && !monster.target && is_server && E.schedule.night && Math.random()<0.4)
		{
			monster.s.sleeping={"ms":3000+5000*Math.random()};
			monster.u=true; monster.cid++;
		}
	}
}

function is_door_close(map,door,x,y)
{
	var def=G.maps[map],spawn=def.spawns[door[6]];
	if(point_distance(x,y,spawn[0],spawn[1])<40)
		return true;
	if(distance({x:x,y:y,width:26,height:35},{x:door[0],y:door[1],width:door[2],height:door[3]})<40)
		return true;
	return false;
}

function can_use_door(map,door,x,y) // this one is costly, so only check when is_door_close [14/09/18]
{
	var def=G.maps[map],spawn=def.spawns[door[6]];
	if(point_distance(x,y,spawn[0],spawn[1])<40 && can_move({map:map,x:x,y:y,going_x:spawn[0],going_y:spawn[1]}))
	{
		//console.log("SPAWNACCESS"+spawn);
		return true;
	}
	if(distance({x:x,y:y,width:26,height:35},{x:door[0],y:door[1],width:door[2],height:door[3]})<40)
	{
		var can=false;
		[
			[0,0],
			[-door[2]/2,0],
			[door[2]/2,0],
			[-door[2]/2,-door[3]],
			[door[2]/2,-door[3]],
			[0,-door[3]],
		].forEach(function(mxy){
			var mx=mxy[0],my=mxy[1];
			if(can_move({map:map,x:x,y:y,going_x:door[0]+mx,going_y:door[1]+my}))
			{
				//console.log("DOORLINEACCESS"+(door[0]+mx)+","+(door[1]+my));
				can=true;
			}
		})
		if(can) return true;
	}
	return false;
}

function is_point_inside(p,polygon)
{
	var isInside = false;
	var minX = polygon[0][0], maxX = polygon[0][0];
	var minY = polygon[0][1], maxY = polygon[0][1];
	for (var n = 1; n < polygon.length; n++) {
		var q = polygon[n];
		minX = Math.min(q[0], minX);
		maxX = Math.max(q[0], maxX);
		minY = Math.min(q[1], minY);
		maxY = Math.max(q[1], maxY);
	}

	if (p[0] < minX || p[0] > maxX || p[1] < minY || p[1] > maxY) {
		return false;
	}

	var i = 0, j = polygon.length - 1;
	for (i, j; i < polygon.length; j = i++) {
		if ( (polygon[i][1] > p[1]) != (polygon[j][1] > p[1]) &&
				p[0] < (polygon[j][0] - polygon[i][0]) * (p[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0] ) {
			isInside = !isInside;
		}
	}

	return isInside;
}

function random_point(polygon,base)
{
	var minX = polygon[0][0], maxX = polygon[0][0];
	var minY = polygon[0][1], maxY = polygon[0][1];
	var defX = polygon[0][0], defY = polygon[0][1]
	for (var n = 1; n < polygon.length; n++) {
		var q = polygon[n];
		if(q[0] < minX || q[0]==minX && q[1]>defY)
		{

		}
		maxX = Math.max(q[0], maxX);
		minY = Math.min(q[1], minY);
		maxY = Math.max(q[1], maxY);
	}
	for(var i=0;i<200;i++)
	{
		var rX=minX+Math.random()*(maxX-minX);
		var rY=minY+Math.random()*(maxY-minY);
		if(is_point_inside([rX,rY],polygon))
		{
			var valid=true;
			if(base)
				base_points(rX,rY,base).forEach(function(xy){
					if(!is_point_inside([xy[0],xy[1]],polygon)) valid=false;
				})
			if(valid) return [rX,rY];
		}
	}
	if(base) return [defX,defY];
	return [defX,defY];
}

function trigger(f)
{
	setTimeout(f,0);
}

function to_number(num)
{
	try{
		num=round(parseInt(num));
		if(num<0) return 0;
		if(!num) num=0;
	}catch(e){num=0};
	return num;
}

function is_nun(a)
{
	if(a===undefined || a===null) return true;
	return false;
}

function nunv(a,b)
{
	if(a===undefined || a===null) return b;
	return a;
}

function is_number(obj)
{
	try{
		if(!isNaN(obj) && 0+obj===obj) return true;
	}catch(e){}
	return false;
}

function is_string(obj)
{ try{
  return Object.prototype.toString.call(obj) == '[object String]';
} catch(e){} return false; }

function is_array(a)
{ try{
	if (Array.isArray(a)) return true;
} catch(e){} return false; }

function is_function(f)
{ try{
	var g = {};
	return f && g.toString.call(f) === '[object Function]';
} catch(e){} return false; }

function is_object(o)
{ try{
	return o!==null && typeof o==='object';
} catch(e){} return false; }

function clone(obj,args) {
	// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
	if(!args) args={};
	if(!args.seen && args.seen!==[]) args.seen=[]; // seen modification - manual [24/12/14]
	if(null == obj) return obj;
	if(args.simple_functions && is_function(obj)) return "[clone]:"+obj.toString().substring(0,40);
	if ("object" != typeof obj) return obj;
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}
	if (obj instanceof Array) {
		args.seen.push(obj);
		var copy = [];
		for (var i = 0; i < obj.length; i++) {
			copy[i] = clone(obj[i],args);
		}
		return copy;
	}
	if (obj instanceof Object) {
		args.seen.push(obj);
		var copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr))
			{
				if(args.seen.indexOf(obj[attr])!==-1) { copy[attr]="circular_attribute[clone]"; continue; }
				copy[attr] = clone(obj[attr],args);
			}
		}
		return copy;
	}
	throw "type not supported";
}

function safe_stringify(obj,third) // doesn't work for Event's - clone also doesn't work [31/08/15]
{
	var seen = [];
	try{
		if(obj===undefined) return "undefined";
		var result=JSON.stringify(obj, function(key, val) {
			if (val != null && typeof val == "object") {
				if (seen.indexOf(val) >= 0) {
					return;
				}
				seen.push(val);
				if("x" in val) // amplify - also in functions.js game_stringify
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
			if("x" in obj) // amplify - also in functions.js game_stringify
			{
				result=JSON.parse(result);
				result.x=obj.x;
				result.y=obj.y;
				result=JSON.stringify(result);
			}
		}catch(e){}
		return result;
	}
	catch(e)
	{
		return "safe_stringify_exception";
	}
}

function smart_eval(code,args)
{
	// window[cur.func] usages might execute the corresponding string and cause an exception - highly unlikely [22:32]
	if(!code) return;
	if(args && !is_array(args)) args=[args];
	if(is_function(code))
	{
		if(args) code.apply(this,clone(args)); // if args are not cloned they persist and cause irregularities like mid persistence [02/08/14]
		else code();
	}
	else if(is_string(code)) eval(code);
}

function is_substr(a,b)
{
	if(is_array(b))
	{
		for(var i=0;i<b.length;i++)
		{
			try{ if(a && a.toLowerCase().indexOf(b[i].toLowerCase())!=-1) return true; } catch(e){}
		}
	}
	else{
		try{ if(a && a.toLowerCase().indexOf(b.toLowerCase())!=-1) return true; } catch(e){}
	}
	return false;
}

function seed0() // as a semi-persistent seed
{
	return parseInt((new Date()).getMinutes()/10.0)
}

function seed1() // as a semi-persistent seed
{
	return parseInt((new Date()).getSeconds()/10.0)
}

function to_title(str)
{
	return str.replace(/\w\S*/g,function(txt){return txt.charAt(0).toUpperCase()+txt.substr(1).toLowerCase();});
}

function ascending_comp(a, b)
{
	return a-b;
}

function delete_indices(array,to_delete)
{
	to_delete.sort(ascending_comp);
	for (var i=to_delete.length-1;i>=0;i--)
		array.splice(to_delete[i],1);
}

function array_delete(array,entity) // keywords: remove, from
{
	var index=array.indexOf(entity);
	if (index > -1) {
		array.splice(index, 1);
	}
}

function in_arr(i,kal)
{
	if(is_array(i))
	{
		for(var j=0;j<i.length;j++)
			for(var el in kal) if(i[j]===kal[el]) return true;
	}
	for(var el in kal) if(i===kal[el]) return true;
	return false;
}

function in_arrD2(el,arr)
{
	for(var i=0;i<arr.length;i++)
	{
		if(el[0]==arr[i][0] && el[1]==arr[i][1]) return true;
	}
	return false;
}


function c_round(n)
{
	if(window.floor_xy) return Math.floor(n);
	if(!window.round_xy) return n;
	return Math.round(n);
}

function round_float(f)
{
	return Math.round(f*100)/100;
}
rf=round_float;

function round(n)
{
	return Math.round(n);
}

function sq(n)
{
	return n*n;
}

function sqrt(n)
{
	return Math.sqrt(n);
}

function floor(n)
{
	return Math.floor(n);
}

function ceil(n)
{
	return Math.ceil(n);
}

function eps_equal(a,b)
{
	return Math.abs(a-b)<5*EPS;
}

function abs(n)
{
	return Math.abs(n);
}

function min(a,b)
{
	return Math.min(a,b);
}

function max(a,b)
{
	return Math.max(a,b);
}

function shuffle(a)
{
	var j, x, i;
	for (i = a.length;i;i--)
	{
		j = Math.floor(Math.random() * i);
		x = a[i - 1];
		a[i - 1] = a[j];
		a[j] = x;
	}
	return a;
}

function cshuffle(a)
{
	var b=a.slice();
	shuffle(b);
	return b;
}

function random_binary()
{
	var s="";
	for(var i=0;i<2+parseInt(Math.random()*12);i++)
	{
		if(Math.random()<0.5) s+="0";
		else s+="1";
	}
	return s;
}

function random_binaries()
{
	var s="";
	for(var i=0;i<7+parseInt(Math.random()*23);i++)
	{
		s+=random_binary()+" ";
	}
	return s;
}

function randomStr(len) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",schars="ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var str = '';
	for (var i=0; i<len; i++) {
		if(i==0)
		{
			var rnum = Math.floor(Math.random() * schars.length);
			str += schars.substring(rnum,rnum+1);
		}
		else
		{
			var rnum = Math.floor(Math.random() * chars.length);
			str += chars.substring(rnum,rnum+1);
		}
	}
	return str;
}

function lstack(arr,el,limit) // used for logging purposes, last entry becomes first element
{
	arr.unshift(el);
	while(arr.length>limit) arr.pop();

}

String.prototype.toTitleCase = function () {
	return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

String.prototype.replace_all = function (find, replace) {
	var str = this;
	return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

function html_escape(html)
{
	var escaped = ""+html;
	var findReplace = [[/&/g, "&amp;"], [/</g, "&lt;"], [/>/g, "&gt;"], [/"/g, "&quot;"]];
	for(var item in findReplace)
		escaped = escaped.replace(findReplace[item][0], findReplace[item][1]);
	return escaped;
}
/*"*/
function he(html){return html_escape(html);}

function future_ms(ms) {
	return new Date(Date.now() + ms);
}
function future_s(s) {
	return future_ms(s * 1000);
}
function future_m(m) {
	return future_ms(m * 60000);
}
function future_h(h) {
	return future_ms(h * 3600000);
}

function mssince(t, ref = Date.now()) {
	return ref instanceof Date ? ref.getTime() - t.getTime() : ref - t.getTime();
}
function ssince(t, ref) {
	return mssince(t, ref) / 1000;
}
function msince(t, ref) {
	return mssince(t, ref) / 60000;
}
function hsince(t, ref) {
	return mssince(t, ref) / 3600000;
}

function sleep(ms)
{
	return new Promise(resolve=>setTimeout(resolve,ms));
}

function log_trace(place,err)
{
	console.log('\n====================');
	if(typeof err==='object')
	{
		if(err.message) console.log('Exception['+place+']:\n'+err.message);
		if (err.stack)
		{
			console.log('Stacktrace:');
			//console.log('====================');
			console.log(err.stack);
			//console.log(Object.keys(err.stack));
		}
	}
	else console.log('log_trace: argument is not an object on :'+place);
	console.log('====================\n');
}

var TYPE_MIN = 'min';
var TYPE_MAX = 'max';

function Heap(array, type, compareFunction) {
	// https://gist.github.com/fabianuribe/5eeeaf5370d03f66f739
	var x={
		buildHeap: function () {
			var last = this.array.length - 1;
			var middle = Math.floor(last/2);
			var i;
			for (i = middle; i >= 0; i -= 1) {
				this._heapify(i);
			}
		},
		sort: function () {
			var limit = this._getLastIdx();
			while (limit > 0) {
				this._swap(0, limit);
				limit -= 1;
				if (limit) {
					this._heapify(0, limit);
				}
			}
		},
		insert: function (element) {
			this.array.push(element);
			this._bubbleUp(this._getLastIdx());
		},
		removeTop: function () {
			var top = this.array[0];
			this._swap(0, this._getLastIdx());
			this.array.pop();
			this._heapify(0);
			return top;
		},
		defaultCompareFunction: function (a, b) {
			if (a > b) {
				return 1;
			}
			if (b > a) {
				return -1;
			}
			return 0;
		},
		_heapify: function (startIdx, limitIdx) {
			limitIdx = limitIdx || this._getLastIdx();
			var topIdx = startIdx;
			var top = this.array[topIdx];
			var leftIdx = this._getLeftChild(startIdx, limitIdx);
			var rightIdx = this._getRightChild(startIdx, limitIdx);
			var left = leftIdx && this.array[leftIdx];
			var right = rightIdx && this.array[rightIdx];

			if (startIdx > limitIdx) {
				return;
			}

			if (left &&
				((this.type === TYPE_MIN && this.compare(left, top) < 0) ||
				(this.type === TYPE_MAX && this.compare(left, top) > 0))) {
				topIdx = leftIdx;
				top = left;
			}

			if (right &&
				((this.type === TYPE_MIN && this.compare(right, top) < 0) ||
				(this.type === TYPE_MAX && this.compare(right, top) > 0))) {
				topIdx = rightIdx;
				top = right;
			}

			if (startIdx !== topIdx) {
				this._swap(startIdx, topIdx);
				this._heapify(topIdx, limitIdx);
			}
		},
		_swap: function (a, b) {
			var temp = this.array[a];
			this.array[a] = this.array[b];
			this.array[b] = temp;
		},
		_bubbleUp: function(index) {
			var parentIdx = this._getParent(index);
			var parent = (parentIdx >= 0) ? this.array[parentIdx] : null;
			var value = this.array[index];

			if (parent === null) {
				return;
			}
			if ((this.type === TYPE_MIN && this.compare(value, parent) < 0) ||
				(this.type === TYPE_MAX && this.compare(value, parent) > 0)) {
				this._swap(index, parentIdx);
				this._bubbleUp(parentIdx);
			}
		},
		_getLeftChild: function (parent, limit) {
			limit = limit || this._getLastIdx();
			var childIndex = parent * 2 + 1;
			return (childIndex <= limit) ? childIndex : null;
		},
		_getRightChild: function (parent, limit) {
			limit = limit || this._getLastIdx();
			var childIndex = parent * 2 + 2;
			return (childIndex <= limit) ? childIndex : null;
		},
		_getParent: function (index) {
			if (index % 2) {
				// Is left child
				return (index - 1)/2;
			}
			// Is right child
			return (index/2) - 1;
		},
		_getLastIdx: function () {
			var size = this.array.length;
			return size > 1 ? size - 1 : 0;
		}
	};
	x.array = array || [];
	x.type = type === TYPE_MIN ? TYPE_MIN : TYPE_MAX;
	x.compare = (typeof compareFunction === 'function') ? compareFunction : this.defaultCompareFunction;
	x.buildHeap();
	return x;
}

function vHeap()
{
	return Heap([],'min',function (a, b) {
		if (a.value > b.value) {
			return 1;
		}
		if (b.value > a.value) {
			return -1;
		}
		return 0;
	});
}

// try{
// 	asadasdasd=asdasdda;
// }
// catch(e){log_trace("test",e);}

function rough_size( object ) {
	//reference: http://stackoverflow.com/a/11900218/914546
	var objectList = [];
	var stack = [ object ];
	var bytes = 0;

	while ( stack.length ) {
		var value = stack.pop();

		if ( typeof value === 'boolean' ) {
			bytes += 4;
		}
		else if ( typeof value === 'string' ) {
			bytes += value.length * 2;
		}
		else if ( typeof value === 'number' ) {
			bytes += 8;
		}
		else if
		(
			typeof value === 'object'
			&& objectList.indexOf( value ) === -1
		)
		{
			objectList.push( value );

			for( var i in value ) {
				stack.push( value[ i ] );
			}
		}
	}
	return bytes;
}