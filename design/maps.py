# 0 front, 1 left, 2 right, 3 back

#main7 - copy of the long-used production map [27/08/16]
#new_main2+new_main3 - floating shrine prototype
#main8 - main7 with castle + small path/island removed

maps={
	"old_main":{
		"key":"main5",
		"name":"Old Town",
		"npcs":
		[
			{"name":"Pots","id":"pots","position":[10,10]},
			{"name":"Come Scroll Away","id":"scrolls","position":[112,-152]},
			{"name":"Shrine of Gods","id":"shrine","position":[4,-155]},
			{"name":"Shrine of Combinations","id":"compound","position":[46,-155]},
			{"name":"Armorz","id":"armors","position":[-20,10]},
			{"name":"Weaponz","id":"weapons","position":[40,10]},
			{"name":"Transporter","id":"transporter","position":[180,-210]},
		],
		"monsters":[
			{"type":"goo","position":[-400,0],"radius":220,"count":10},
			{"type":"spider","position":[-300,100],"radius":180,"count":6},
			{"type":"scorpion","position":[-100,100],"radius":180,"count":12},
			{"type":"bat","position":[200,100],"radius":180,"count":5},
			{"type":"dknight2","position":[300,-100],"radius":160,"count":4},
			{"type":"phoenix","position":[0,0],"radius":1200,"count":1},
		],
		"spawns":[[100,100]],
		"ignore":True,
	},
	"original_main":{
		"ignore":True,
		"key":"main",
		"name":"Town",
		"npcs":[
			{"name":"Shrine of Gods","id":"shrine","position":[319,-178]}, #0 - server.js
			{"name":"Shrine of Combinations","id":"compound","position":[362,-178]}, #1 - server.js

			{"name":"Pots","id":"pots","position":[112,40]},

			#{"name":"Transporter","id":"transporter","position":[163,-197]},
			{"name":"Exchanger","id":"exchange","position":[163,-197]},
			{"name":"Come Scroll Away","id":"scrolls","position":[241,-215]},

			{"name":"Armorz","id":"armors","position":[-106,-211]},
			{"name":"Weaponz","id":"weapons","position":[61,-220]},
			#{"name":"Ship","id":"ship","position":[832,119]},

			# {"name":"Firstc","id":"firstc","position":[-106,-180]},

			{"name":"Lich","id":"lichteaser","position":[1352,64]},

			{"name":"Zen Girl","id":"appearance","position":[792,800]},

			{"id":"pvp","positions":[ [-375,-104],[-482,-10,2] ]}, #currently the direction is hard-coded at update_sprite [30/08/16]

			{"name":"Transporter","id":"transporter","position":[409,36]},
		],
		"old_monsters":[
			{"type":"goo","boundary":[-84,95,255,234],"count":12},
			#{"type":"pinkgoo","boundary":[-84,95,255,234],"count":1},
			#{"type":"goblin","boundary":[-84,95,255,234],"count":1},
			{"type":"squig","boundary":[279,201,718,333],"count":7},
			{"type":"bee","boundary":[464,37,744,190],"count":10},

			{"type":"armadillo","boundary":[-20,295,221,529],"count":6},
			{"type":"squigtoad","boundary":[50,473,534,676],"count":4},
			{"type":"bee","boundary":[440,377,752,567],"count":10},

			{"type":"spider","boundary":[1045,423,1371,713],"count":9},
			{"type":"scorpion","boundary":[997,733,1374,911],"count":9},
			#{"type":"dknight2","boundary":[820,165,1375,465],"count":6},
			{"type":"croc","boundary":[820,165,1375,465],"count":6},

			#{"type":"greenfairy","boundary":[690,745,895,850],"count":1},
			{"type":"greenfairy","boundary":[690,745,895,775],"count":1},
			{"type":"redfairy","boundary":[690,745,742,850],"count":1},
			{"type":"bluefairy","boundary":[840,745,895,850],"count":1},

			#{"type":"phoenix","boundaries":[["main",1042,155,1375,912],["main",820,160,1378,466],["batcave",-210,-170,342,185]],"count":1,"stype":"randomrespawn"},
		],
		"spawns":[
			[41,-71], #0-town
			[-271,-9,0], #1-cave exit
			[-376,-99,0], #2-arena exit
			[-460,63,2], #3-pvp death
			[224,48], #4-main death
			[600,-42],#5-bank-exit
			[408,62,3],#6-front of the transporter
		],
		"on_death":["original_main",4],
		"doors":[
			[-273,-25,24,30,"batcave",0,1],
			[-374,-113,24,30,"arena",0,2],
			[600,-69,32,40,"bank",0,5],
		],
		"quirks":[
			[664,-55,20,16,"sign","An Offshore Bank"],
		],
		"pvp":False,
		"drop_norm":700,
		"instance":True,
	},
	"test":{
		"key":"test_large",
		"key":"resort_default",
		"key":"jayson_PirateShip0",
		"key":"test",
		"name":"Test",
		"npcs":[
			{"name":"Transporter","id":"transporter","position":[-50,-50]},
		],
		"monsters":[],
		"spawns":[[0,0]],
		"no_bounds":True,
		"irregular":True,
		"day":True,
	},
	"crypt":{
		"key":"jayson_instance_dungeon1",
		"name":"The Crypt [Cave]",
		"npcs":[
		],
		"monsters":[
			{"type":"a1","boundary":[2243.92,325.27,2689.64,505.06],"count":1},
			{"type":"a7","boundary":[726.81,-1076.19,726.81,-1076.19],"count":1,"roam":True},
			{"type":"a3","boundary":[1790.79,-1480.39,1790.79,-1480.39],"count":1,"roam":True},
			{"type":"a6","boundary":[2746.91,-1734.86,2746.91,-1734.86],"count":1,"roam":True},
			{"type":"a5","boundary":[2736.38,-1090.91,2736.38,-1090.91],"count":1,"roam":True},
			{"type":"a2","boundary":[1109.81,-632.68,1109.81,-632.68],"count":1,"roam":True},
			{"type":"a4","boundary":[2745.11,-655.82,2745.11,-655.82],"count":1,"roam":True},
			{"type":"a8","boundary":[2042.91,-883.27,2042.91,-883.27],"count":1,"roam":True},
			{"type":"vbat","boundary":[903.57,-465.05,1479.2,-304.03],"count":7},
		],
		"spawns":[
			[0,0],
		],
		"on_death":["cave",2],
		"on_exit":["cave",2],
		"doors":[
			[-1.54,105.6,126.56,56.96,"cave",2,0],
		],
		"instance":True,
	},
	"goobrawl":{
		"key":"jayson_GooIsland",
		"name":"Goo Brawl!",
		"npcs":[
			{"id":"transporter","position":[-347,-483]},
		],
		"monsters":[
			{"type":"rgoo","boundary":[-432,-472,448,208],"count":0,"polygon":[[-344,192],[-288,192],[-288,208],[184,208],[376,208],[376,184],[416,184],[416,-96],[448,-96],[448,-240],[400,-240],[400,-344],[288,-344],[288,-264],[264,-264],[264,-240],[232,-240],[232,-184],[200,-184],[200,-152],[16,-152],[16,-128],[-128,-128],[-128,-168],[-192,-168],[-192,-216],[-248,-216],[-248,-240],[-288,-240],[-288,-408],[-320,-408],[-320,-472],[-408,-472],[-408,-416],[-432,-416],[-432,-112],[-400,-112],[-400,136],[-384,136],[-384,168],[-344,168]]},
		],
		"spawns":[
			[0,0],
		],
		"event":"goobrawl",
		"code":"join('goobrawl')",
		"on_death":["goobrawl",0],
		"doors":[
		],
		"outside":True,
		#"instance":True,
	},
	"abtesting":{
		"key":"jayson_vs_arena",
		"name":"A/B Testing",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[0,0],
			[0,-232],
			[-832,0,2,160], #scatter 100
			[832,0,1,160],
		],
		"on_death":["abtesting",1],
		"doors":[
		],
		"event":"abtesting",
		"code":"join('abtesting')",
		"pvp":True,
		"instance":True,
		"lux":0.8,
	},
	"dungeon0":{
		"key":"dungeon0",
		"name":"Dungeon",
		"npcs":[
		],
		"monsters":[
			{"type":"goo","boundary":[-50,-50,50,50],"count":5},
		],
		"spawns":[
			[0,0],
		],
		"on_death":["dungeon0",0],
		"doors":[
		],
		"pvp":True,
		"no_bounds":True,
		"instance":True,
		"lux":0.7,
	},
	"cgallery":{
		"key":"cgallery",
		"name":"Cosmetics Gallery",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[0,0],
		],
		"doors":[
		],
		"pvp":True,
		"no_bounds":True,
		"instance":True,
		"lux":1,
	},
	"old_bank":{
		"key":"bank0",
		"name":"The Bank",
		"npcs":[
			{"id":"goldnpc","position":[57,0]},
			{"id":"items0","position":[-24,49]}, #can be 48 too
			{"id":"items1","position":[128,49]},
		],
		"monsters":[
		],
		"spawns":[
			[56,129,3],
		],
		"doors":[
			[56,187,64,40,"main",5,0],
		],
		"quirks":[
			[56,-52,16,34,"log","It's time."],
		],
		"mount":True,
		"ignore":True,
	},
	"bank":{
		"key":"jayson_bank",
		"key":"jayson_bank0",
		#"key":"jayson_bank_xmas",
		#"key":"jayson_bank0.Xmas", #xmas
		"name":"The Bank",
		"npcs":[
			{"id":"goldnpc","position":[1,-416]},
			{"id":"items4","position":[-64,-415]},
			{"id":"items5","position":[64,-415]},
			{"id":"items6","position":[-128,-415]},
			{"id":"items7","position":[128,-415]},
			#bottom row
			{"id":"items0","position":[-64,-191]}, #can be 48 too
			{"id":"items1","position":[64,-191]},
			{"id":"items2","position":[-128,-191]},
			{"id":"items3","position":[128,-191]},
			{"id":"rewards","position":[155,-105,1]},
		],
		"monsters":[
		],
		"spawns":[
			[0,-37,3],
			[0.75,-435.79],
		],
		"doors":[
			[0,-8,40,20,"main",3,0],
			[0.13,-444.39,34.3,52.27,"bank_b",0,1,"ulocked"],
		],
		"quirks":[
			[-40.34,-448.85,26.77,42.69,"log","It's time."],
		],
		"on_exit":["main",3],
		"mount":True,
		"safe":True,
		"lux":0.8,
		#"ignore":True,
	},
	"bank_b":{
		"key":"jayson_theBank1",
		"name":"The Bank [Basement]",
		"npcs":[
			{"id":"items8","position":[-592.5,-300]},
			{"id":"items9","position":[-528,-318]},
			{"id":"items10","position":[-464,-333]},
			{"id":"items11","position":[-400.5,-350]},

			{"id":"items12","position":[-128.5,-429.5]},
			{"id":"items13","position":[-64.5,-413.5]},
			{"id":"items14","position":[-0.5,-398]},
			{"id":"items15","position":[63,-381.5]},

			{"id":"items16","position":[-480.5,50]},
			{"id":"items17","position":[-416.5,65.5]},
			{"id":"items18","position":[-352.5,81.5]},
			{"id":"items19","position":[-288.5,97.5]},

			{"id":"items20","position":[-16.5,-14]},
			{"id":"items21","position":[47.5,-14]},
			{"id":"items22","position":[111,-14]},
			{"id":"items23","position":[175,-14]},
		],
		"monsters":[
		],
		"spawns":[
			[-264.38,-411.81],
			[-103.51,-170.63],
		],
		"doors":[
			[-264.04,-421.14,66.84,65.15,"bank",1,0],
			[-104.49,-179.73,32.05,45.25,"bank_u",1,1,"ulocked"],
		],
		"quirks":[
		],
		"on_exit":["main",3],
		"lux":0.7,
		"mount":True,
		"safe":True,
	},
	"bank_u":{
		"key":"jayson_theBank2",
		"name":"The Bank [Underground]",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[-479.47,-25.02],
			[-0.4,-41.24],
		],
		"doors":[
			[-479.82,-36.54,31,49.64,"level2",6,0,"ulocked","complicated"],
			[0.22,-50.06,64.89,63.09,"bank_b",1,1,"ulocked"]
		],
		"quirks":[
		],
		"on_exit":["level2",6],
		"mount":True,
		"safe":True,
		"lux":0.6,
	},
	"ship0":{
		"key":"jayson_PirateShip0",
		"name":"The Pirate Ship",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[0,0],
		],
		"doors":[
		],
		"quirks":[
		],
		"event":"pirateship",
		"outside":True,
	},
	"d2":{ #prototype
		"key":"d2",
		"name":"Dark World",
		"npcs":[
		],
		"monsters":[
			{"type":"d_wiz","boundary":[-49,-679,51,-640],"count":1,"gatekeeper":True,"rage":[-172,-685,219,-437]},
		],
		"spawns":[
			[0,-15],
			[0,-671]
		],
		"doors":[
			[0,22,40,40,"d1",1,0],
			[0,-684,20,50,"d3",0,1,"protected"],
		],
		"quirks":[
		],
		"ignore":True,
	},
	"d_e":{
		"key":"jayson_pvpDungeonTest",
		"key":"jayson_pvpDungeon_entrance",
		"safe":True,
		"fx":"storm",
		"weather":"rain",
		"name":"Dungeon [Entrance]",
		"npcs":[
			{"id":"transporter","position":[-9,0]},
		],
		"monsters":[
		],
		"spawns":[
			[-9.2,-0.91],
			[0.08,-291.85],
		],
		"doors":[
			[-0.15,-299.63,35.39,51.17,"d_g",0,1],
		],
		"quirks":[
		],
		"world":"dungeon",
	},
	"d_g":{
		"key":"jayson_pvpDungeon_gateway",
		"name":"Dungeon [Gateway]",
		"npcs":[
		],
		"monsters":[
			#{"type":"bat","boundary":[-120,-207,108,17],"count":6},
		],
		"spawns":[
			[0.03,1.13,3],
			[-319.17,-102.09,3],
		],
		"doors":[
			[0.14,47.88,46.19,36.62,"d_e",1,0],
			[-320.6,-39.93,64.22,59.29,"d_b1",0,1],
		],
		"quirks":[
			[-320.64,-213.45,67.59,82.61,"log","The passage is blocked"],
		],
		"world":"dungeon",
	},
	"d_b1":{
		"key":"jayson_pvpDungeon_b1",
		"name":"Dungeon",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[-0.28,10.19,3],
			[-192.16,-1655.63],
		],
		"doors":[
			[0.09,83.59,66.6,63.26,"d_g",1,0],
			[-192.9,-1666.24,59.7,45.23,"d_a1",0,1],
		],
		"quirks":[
			[190.54,-1628.83,59.88,85.03,"log","The passage is blocked"],
		],
		"world":"dungeon",
		"traps":[
			{"type":"debuff","polygon":[[-336,-1136],[-192,-1136],[-192,-1160],[-168,-1160],[-168,-1152],[-120,-1152],[-120,-1168],[-112,-1168],[-112,-1240],[-72,-1240],[-72,-1256],[-56,-1256],[-56,-1288],[0,-1288],[0,-1272],[16,-1272],[16,-1208],[88,-1208],[88,-1088],[200,-1088],[200,-1128],[336,-1128],[336,-1368],[240,-1368],[240,-1336],[216,-1336],[216,-1320],[160,-1320],[160,-1400],[128,-1400],[128,-1448],[144,-1448],[144,-1512],[88,-1512],[88,-1496],[64,-1496],[64,-1440],[40,-1440],[40,-1432],[0,-1432],[0,-1464],[-40,-1464],[-40,-1480],[-64,-1480],[-64,-1512],[-144,-1512],[-144,-1560],[-176,-1560],[-176,-1576],[-216,-1576],[-216,-1544],[-264,-1544],[-264,-1480],[-288,-1480],[-288,-1456],[-296,-1456],[-296,-1432],[-328,-1432],[-328,-1152],[-336,-1152]]},
		]
	},
	"d_a1":{
		"key":"jayson_pvpDungeon_a1",
		"name":"Dungeon",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[-2.2,1.48,3],
			[255.6,-905.1],
		],
		"doors":[
			[0.21,79.75,54.39,66.5,"d_b1",1,0],
			[254.82,-916.88,61.73,99.0,"d_a2",0,1],
		],
		"quirks":[
		],
		"world":"dungeon",
	},
	"d_a2":{
		"key":"jayson_pvpDungeon_a2",
		"name":"Dungeon",
		"npcs":[
		],
		"monsters":[
		],
		"spawns":[
			[-2.12,-0.39,3]
		],
		"doors":[
			[0.6,77.16,56.2,64.21,"d_a1",1,0],
		],
		"quirks":[
		],
		"world":"dungeon",
	},
	"cave":{
		"key":"jayson_cave02",
		"name":"Cave of Darkness",
		"npcs":[
			#{"name":"Transporter","id":"transporter","position":[100,100]},
		],
		"monsters":[
			{"type":"bat","boundary":[-396,-594,8,-328],"count":6},
			{"type":"bat","boundary":[182,-1282,465,-932],"count":7},
			{"type":"bat","boundary":[1018,-940,1385,-624],"count":8},
			{"type":"bat","boundary":[1066,-132,1420,78],"count":5},
			{"type":"bat","boundary":[964,11,1252,107],"count":2},
			{"type":"mvampire","boundaries":[["cave",-367,-1296,-14,-1057],["cave",1068,-123,1420,78]],"count":1,"stype":"randomrespawn"},
			#{"type":"dknight2","boundary":[0,0,0,0],"count":1,"roam":True},
		],
		"spawns":[
			[0,0,3],
			[1877,-1078], #1-level1
			[-193.41,-1295.83], #2-crypt - HARD REFERENCED AT server.js
		], # 1 left, 2 right, 3 back
		"doors":[
			[0,33,36,20,"main",4,0], #.spawns[4]
			[1880,-1086,32,32,"level1",3,1],
			[-192.22,-1308.2,50.35,56.23,"crypt",0,2,"key","cryptkey"],
		],
		"quirks":[
			[-192,-1309,48,64,"log","Is this a gateway?"],
			[-193.41,-1295.83,0,0,"info","crypt"],
		],
		"drop_norm":4500,
		"lux":0.45,
	},
	"mtunnel":{
		"key":"jayson_mainlandTunnel",
		"name":"Underground [Tunnel]",
		"npcs":[
			#{"name":"Transporter","id":"transporter","position":[100,100]},
		],
		"monsters":[
		],
		"spawns":[
			[0,8], #0-entrance
			[671,-225,3], #1-main17
			[1169,-55,3], #1-main18
		], # 1 left, 2 right, 3 back
		"doors":[
			[0,-3,24,60,"main",16,0], #main16
			[656,-240,24,60,"main",17,1], #main17
			[1168,-65,24,60,"main",18,2], #main18
		],
		"quirks":[
		],
		"drop_norm":4500,
		"lux":0.6,
	},
	"main":{
		"key":"jayson_ALMap2_v2",
		#"key":"jayson_ALMap2_v2.Xmas",
		#"key":"jayson_ALMap2_v2.CNewYear",
		#"key":"jayson_ALMap2_v2_xmas", #xmas
		#"key":"jayson_ALMap2_v2.lunarNewYear",
		"name":"Mainland",
		"npcs":[
			#{"id":"newupgrade","position":[-203,-174]},
			{"id":"newupgrade","position":[-207,-220]},
			{"name":"Exchanger","id":"exchange","position":[-25,-478]},
			{"name":"Come Scroll Away","id":"scrolls","position":[-464,-96]},
			{"id":"lotterylady","position":[-341,168]},
			{"id":"fisherman","position":[-1572,552,1]},
			#{"id":"fancypots","position":[56,-169]},
			{"id":"fancypots","position":[-35,-162]},
			#{"id":"basics","position":[-56,-144]},
			{"id":"basics","position":[-89,-165]},
			{"id":"premium","position":[192,-564]},
			#{"id":"tavern","position":[-472,138]},
			#{"id":"transporter","position":[-551,-372]},
			{"id":"transporter","position":[-83,-441]},
			{"id":"standmerchant","position":[-193,680]},
			{"name":"Zen Girl","id":"appearance","position":[-361,-832]},
			{"id":"pvp","positions":[ [232,388],[325,499,1] ]}, #currently the direction is hard-coded at update_sprite [30/08/16]
			#{"id":"guard","position":[889,-664]}, #dungeon
			#{"id":"guard","position":[1588,-534]}, #dark forest 1
			#{"id":"guard","position":[1610,-534]}, #dark forest 2
			#{"id":"guard","position":[616,613]}, #mansion
			{"id":"craftsman","position":[92,670]},
			{"id":"pete","position":[-776,1256]},
			#{"id":"citizen0","position":[-152,152]},
			{"id":"citizen0","position":[0,0]},
			{"id":"citizen2","position":[0,0]},
			{"id":"citizen3","position":[0,0]},
			{"id":"citizen4","position":[0,0]},
			{"id":"antip2w","position":[274,-554]}, #shellsguy"
			{"id":"friendtokens","position":[120,-560]},
			{"id":"funtokens","position":[303,-87] or [105,-34] or [220,-151]},
			#{"id":"funtokens","position":[225,-105]},
			{"id":"bean","position":[74,-34],"boundary":[-100,-100,100,100]},
			#{"id":"bean","positions":[ [-94,-47],[98,-50],[5,83] ],"loop":True}, # ,"manual":True
			{"id":"secondhands","position":[106,-47] or [74,-34]},
			{"id":"pvptokens","position":[159,403]},
			{"id":"monsterhunter","position":[126,-413]},
			{"id":"mcollector","position":[81,-283,1]},
			#{"id":"newyear_tree","position":[64,-88]}, #xmas
		],
		"monsters":[
			#square
			#{"type":"tiger","boundary":[-118,-100,118,100],"count":1}, #,"rage":[-118,-100,118,100]},

			#beach
			{"type":"crab","boundary":[-1353,-254,-1052,122],"count":8,"grow":True},
			{"type":"squig","boundary":[-1353,126,-998,718],"count":6,"grow":True},
			{"type":"squigtoad","boundary":[-1353,126,-998,718],"count":2},
			{"type":"tortoise","boundary":[-1353,720,-896,1516],"count":6},
			{"type":"frog","boundary":[-1353,720,-896,1516],"count":2},
			{"type":"crabx","boundary":[-1256,1520,-712,2004],"count":5},
			{"type":"crabxx","boundary":[-1256,1520,-712,2004],"count":0},

			#targets
			{"type":"target","boundary":[-571,323,-571,323],"count":1},
			{"type":"target_a500","boundary":[-290,280,-290,280],"count":1},
			{"type":"target_a750","boundary":[-270,280,-270,280],"count":1},
			{"type":"target_r500","boundary":[-250,280,-250,280],"count":1},
			{"type":"target_r750","boundary":[-230,280,-230,280],"count":1},
			{"type":"target_ar900","boundary":[-210,280,-210,280],"count":1},
			{"type":"target_ar500red","boundary":[-150,400,-150,400],"count":1},

			#middle
			{"type":"goo","boundary":[-282,702,218,872],"count":9,"grow":True},
			#{"type":"slenderman","boundary":[-282,702,218,872],"count":1},
			#{"type":"chestm","boundary":[-282,702,218,872],"count":3},
			#{"type":"aqueen","boundary":[-282,702,218,872],"count":1},
			#{"type":"pinkgoo","boundary":[-282,702,218,872],"count":1},
			#{"type":"wabbit","boundary":[-282,702,218,872],"count":1},
			{"type":"bee","boundary":[424,1014,668,1104],"count":4,"grow":True},
			{"type":"bee","boundary":[418,994,570,1208],"count":3,"grow":True},
			{"type":"bee","boundary":[52,1426,252,1548],"count":5,"grow":True},
			{"type":"bee","boundary":[448,694,592,812],"count":3,"grow":True},
			{"type":"bee","boundary":[678,676,796,764],"count":2,"grow":True},
			{"type":"poisio","boundary":[-262,1198,20,1522],"count":5,"grow":True},
			{"type":"croc","boundary":[696,1498,906,1922],"count":6,"grow":True},
			{"type":"armadillo","boundary":[376,1696,676,1996],"count":6,"grow":True},
			{"type":"snake","boundary":[-254,1812,90,1990],"count":6,"grow":True},

			#final
			{"type":"bigbird","boundary":[1100,160,1586,336],"count":5},
			{"type":"spider","boundary":[700,-282,1196,-6],"count":7,"grow":True},
			{"type":"scorpion","boundary":[1485,-390,1670,54],"count":6,"grow":True},

			#phoenix
			{"type":"phoenix",
				"boundaries":[
					["main",708,-300,1668,-86],
					["main",378,1686,904,1920],
					["main",-1358,-118,-1010,1680],
					["halloween",-166,453,182,808],
					["cave",-375,-1287,14,-1041],
					#["tunnel",-210,-1291,238,-853]
				],"count":1,"stype":"randomrespawn"},
			#fairies
			{"type":"greenfairy","boundary":[-460,-908,-260,-710],"count":1},
			{"type":"redfairy","boundary":[-460,-908,-260,-710],"count":1},
			{"type":"bluefairy","boundary":[-460,-908,-260,-710],"count":1},
			#pets
			{"type":"puppy1","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"puppy2","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"puppy3","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"puppy4","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"kitty1","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"kitty2","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"kitty3","boundary":[-766,1072,-643,1210],"count":1},
			{"type":"kitty4","boundary":[-766,1072,-643,1210],"count":1},

			#tavern area
			#{"type":"porcupine","boundary":[-585,305,-146,547],"count":1},

			#little farm
			{"type":"hen","boundary":[-118,-317,-5,-247],"count":2},
			{"type":"rooster","boundary":[-118,-317,-5,-247],"count":1},
		],
		"doors":[
			[-965,-176,24,30,"woffice",0,1],
			[536,1665,64,32,"tunnel",0,2],
			[168,-149,32,40,"bank",0,3],
			[160,1370,24,32,"cave",0,4],
			[232,384,24,30,"arena",0,6],
			[-472,131,24,30,"tavern",0,8],
			[616,610,32,40,"mansion",0,10],
			[1936,-23,24,24,"level1",1,11],
			[169,-404,24,40,"hut",0,14],
			[1600,-547,60,40,"halloween",4,15],
			[312,-335,32,32,"mtunnel",0,16],
			[967,-584,32,32,"mtunnel",1,17],
			[1472,-434,32,32,"mtunnel",2,18],
		],
		"traps":[
			{"type":"spikes","position":[-472,286]},
		],
		"spawns":[
			[0,0,0,100],
			[-968,-163], #1-outside woffice
			[535,1677], #2-tunnel
			[168,-134], #3-outside the bank
			[160,1381], #4-outside the cave
			[-87,673], #5-on-death
			[232,397], #6-outside the arena <- this one was the un-bounded problem [232,388] Added a new line_distance logic now [19/07/18]
			[294,498], #7-arena death
			[-472,149], #8-tavern-exit
			#[-556,-271,3], #9-transporter-npc
			[-85,-389,3], #9-transporter-npc
			[616,621], #10-mansion
			[1937,-12], #11-underground
			[-1104,-924], #12-the island
			[-551,-375], #13-old teleporter - new empty area
			[169,-385], #14-hut
			[1600,-524], #15-forest
			[294,-347,1], #16-mtunnel
			[968,-577], #17-mtunnel
			[1471,-424], #18-mtunnel
		],
		"quirks":[
			[-236,-189,24,24,"upgrade"],
			[-179,-189,24,24,"compound"],
			[350,424,30,24,"list_pvp"],
			[-200,15,24,42,"log","A relic from an old era"],
			[200,15,24,42,"log","A relic from an old era"],
			[1689,-494,20,16,"note","The Dark Forest. A curious place."],
			[681,624,20,16,"sign","The Mansion"],
			[65,544,20,16,"sign","Welcome to The New Town!"],
			[-150,154,20,16,"sign","Town Square"],
			[-365,144,20,16,"sign","Tavern"],
		],
		"animatables":{
			"the_door":{"x":888,"y":-672,"position":"door0"},
		},
		"on_death":["main",5],
		"on_exit":["main",0],
		"drop_norm":1000,
		"ref":{
			"u_mid":[-235,-203],
			"c_mid":[-180,-203],
			"cx":[-479.65,-919.23,-240.96,-697.72],
		},
		"zones":[
			{
				"type":"fishing",
				"drop":"f1",
				"polygon":[[-880,-352],[-1064,-352],[-1064,-336],[-1080,-336],[-1080,-320],[-1096,-320],[-1096,-304],[-1224,-304],[-1224,-288],[-1368,-288],[-1368,-272],[-1384,-272],[-1384,600],[-1424,600],[-1424,456],[-1616,456],[-1616,592],[-1536,592],[-1536,680],[-1384,680],[-1384,1648],[-1368,1648],[-1368,1744],[-1352,1744],[-1352,1760],[-1336,1760],[-1336,1872],[-1320,1872],[-1320,1952],[-1304,1952],[-1304,2016],[-1288,2016],[-1288,2032],[-1208,2032],[-1208,2048],[-1064,2048],[-1064,2064],[-920,2064],[-920,2080],[-904,2080],[-904,2096],[-808,2096],[-808,2112],[-736,2112],[-728,2112],[-728,2128],[-456,2128],[-456,2032],[-424,2032],[-424,2440],[-1880,2440],[-1880,-528],[-872,-528],[-872,-352]],
			}
		],
		"outside":True,
	},
	"mansion":{
		"key":"jayson_Mansion",
		"name":"The Mansion",
		"npcs":[
			{"id":"pwincess","position":[0,-303]},
		],
		"monsters":[
			{"type":"rat","boundary":[-217,-272,200,-24],"count":5},
			{"type":"rat","boundary":[-408,-102,-158,27],"count":3},
			{"type":"rat","boundary":[160,-97,402,29],"count":3},
			{"type":"rat","boundary":[-388,-610,-282,-197],"count":3},
			{"type":"rat","boundary":[-388,-610,-282,-197],"count":3},
			{"type":"rat","boundary":[283,-604,382,-200],"count":3},
			{"type":"rat","boundary":[-240,-487,249,-401],"count":4},
		],
		"doors":[
			[-1,12,40,24,"main",10,0],
			[-0.05,-493.95,31.8,46.7,"tomb",0,1,"key","tombkey"]
		],
		"spawns":[
			[0,-21,3],
			[-0.18,-481.98]
		],
		"quirks":[
			[-335,-111,30,40,"log","Locked"],
			[338,-111,30,40,"log","Locked"],
			[-334,-618,30,40,"log","Locked"],
			[338,-618,30,40,"log","Locked"],
			[338,-618,30,40,"log","Hotdamn. This one is locked too..."],
			#[2,-490,30,40,"log","Locked."],
		],
		"drop_norm":1000,
		"lux":0.8,
	},
	"tomb":{
		"key":"jayson_MansionCrypt",
		"name":"The Tomb",
		"monsters":[
			{"type":"gredpro","boundary":[-484.75,-400.63,-165.11,-188.4],"count":1},
			{"type":"ggreenpro","boundary":[-378.79,44.16,-115.78,308.73],"count":1},
			{"type":"gbluepro","boundary":[198.5,-402.6,490.12,-43.68],"count":1},
			{"type":"gpurplepro","boundary":[-137.74,-531.49,235.49,-476.06],"count":1},
		],
		"doors":[
			[0,-68.83,33.4,57.5,"mansion",1,0]
		],
		"spawns":[
			[0.82,-53.5]
		],
		"instance":True,
		"lux":0.8,
	},
	"jail":{
		"key":"jayson_al_jail",
		"name":"Jail",
		"npcs":[
			{"id":"jailer","position":[191,-156]},
		],
		"monsters":[
			{"type":"jrat","boundary":[-223,-140,225,156],"count":3},
		],
		"doors":[
		],
		"quirks":[
			[-81,-165,30,40,"log","Locked"],
		],
		"spawns":[
			[-79,-153],
		],
		"drop_norm":1000,
		"irregular":True,
		"lux":0.5,
	},
	"cyberland":{
		"key":"cyberland",
		"name":"Cyberland",
		"npcs":[
		],
		"monsters":[
			{"type":"mechagnome","boundary":[-16,-88,-17,-89],"count":1},
			{"type":"mechagnome","boundary":[-6,-96,-7,-95],"count":1},
			{"type":"mechagnome","boundary":[8,-96,7,-95],"count":1},
			{"type":"mechagnome","boundary":[18,-88,17,-89],"count":1},
		],
		"doors":[
			[224,-162,16,16,"main",9,1],
		],
		"quirks":[
			[0,-100,80,30,"mainframe"],
		],
		"spawns":[
			[0,0,3],
			[224,-162,3],
		],
		"drop_norm":1000,
		"irregular":True,
		"lux":0.8,
	},
	"duelland":{
		"key":"jayson_arena_pvp",
		"key":"jayson_duel_arena",
		"name":"Duelland",
		"npcs":[
		],
		"monsters":[
		],
		"doors":[
			[0,16,32,20,"main",7,0],
		],
		"quirks":[
		],
		"spawns":[
			[0,0,3],
			[-712,-800,0,40],
			[712,-800,0,40],
		],
		"drop_norm":1000,
		"irregular":True,
		"instance":True,
		"pvp":True,
		"loss":False,
		"lux":0.8,
	},
	"hut":{
		"key":"jayson_smallHut",
		"name":"The Hut",
		"npcs":[
		],
		"monsters":[
		],
		"doors":[
			[0,17,32,24,"main",14,0],
		],
		"spawns":[
			[0,-9,3],
		],
		"drop_norm":1000,
		"safe":True,
		"lux":0.6,
	},
	"woffice":{
		"key":"jayson_smallNPCcave",
		"name":"Wizard's Crib",
		"npcs":[
			{"id":"lostandfound","position":[-24,-178]},
			{"id":"wnpc","position":[32,-178,3]},
		],
		"monsters":[
			{"type":"grinch","boundary":[-112,-142,60,-16],"count":1,"special":True},
		],
		"doors":[
			[-29,112,48,40,"main",1,0],
		],
		"spawns":[
			[-24,83,3],
		],
		"zones":[
			{
				"type":"mining",
				"drop":"m2",
				"polygon":[[-184,-232],[-128,-232],[-128,-184],[-184,-184]],
			}],
		"lux":0.6,
		"drop_norm":1000,
		"safe":True,
	},
	"tavern":{
		#"ignore":True,
		"key":"jayson_tavern02",
		"name":"The Tavern",
		"npcs":[
			{"id":"tbartender","position":[150,-202]},
			{"id":"bouncer","position":[208,-156]},
		],
		"monsters":[
		],
		"doors":[
			[1,23,48,20,"main",8,0],
			[272,-220,28,36,"resort_e",0,1],
		],
		"spawns":[
			[0,-8,3],
			[272,-200], #1-resort_e
		],
		"quirks":[
			[136,-215,32,40,"log","Impossible to reach. This is probably where they keep all the rare items."],
			[-103,-229,20,16,"tavern_info"],
		],
		"machines":[
			{
				"type":"dice",
				"set":"custom", #sprite
				"frames":[
					[0,16*16,5*16,44],
					[5*16,16*16,5*16,44],
					[10*16,16*16,5*16,44],
					[15*16,16*16,5*16,44],
					[20*16,16*16,5*16,44],
					[25*16,16*16,5*16,44],
				],
				"subframes":[
					[11,301,7,14], #0
					[11+11,301,7,14], #1
					[11+11*2,301,7,14], #2
					[11+11*3,301,7,14], #3
					[11+11*4,301,7,14], #4
					[11+11*5,301,7,14], #5
					[11+11*6,301,7,14], #6
					[11+11*7,301,7,14], #7
					[11+11*8,301,7,14], #8
					[11+11*9,301,7,14], #9
					[5,310,1,1], #. - manually calibrated all of these, it wasn't easy [07/02/18]
				],
				"x":-169,
				"y":-209,
			},
			{
				"type":"slots",
				"set":"custom",
				"frames":[
					[0,20*16,2*16,3*16],
					[2*16,20*16,2*16,3*16],
					[4*16,20*16,2*16,3*16],
				],
				"x":-272,
				"y":-216,
			},
			{
				"type":"wheel",
				"set":"custom",
				"frames":[
					[0,23*16,2*16,3*16],
					[2*16,23*16,2*16,3*16],
					[4*16,23*16,2*16,3*16],
				],
				"x":-64,
				"y":-216,
			}
		],
		"drop_norm":1000,
		"lux":0.8,
	},
	"resort_e":{
		#"ignore":True,
		"key":"resort_e",
		"name":"Holo Resort",
		"npcs":[
		],
		"animatables":{
			"the_lever":{"x":-8,"y":-92,"position":"lever0"},
		},
		"monsters":[
		],
		"doors":[
			[-8,120,40,24,"tavern",1,0],
		],
		"spawns":[
			[-8,91,3],
		],
		"quirks":[
			[-8,-92,20,24,"the_lever"],
		],
		"drop_norm":1000,
		"lux":1,
	},
	"resort":{
		#"ignore":True,
		"key":"resort",
		"name":"Holo Resort",
		"npcs":[
			{"id":"holo","position":[-8,-108]},
			#{"id":"lostandfound","position":[77,-96]},
			{"id":"holo0","position":[-8,0]},
			{"id":"holo1","position":[-8,0]},
			{"id":"holo2","position":[-8,0]},
			{"id":"holo3","position":[-8,0]},
			{"id":"holo4","position":[-8,0]},
			{"id":"holo5","position":[-8,0]},
		],
		"monsters":[
		],
		"doors":[
			[-8,120,40,24,"tavern",1,0],
		],
		"spawns":[
			[-8,91,3],
		],
		"quirks":[
		],
		"drop_norm":1000,
		"irregular":True,
		"lux":0.75,
	},
	"winter_inn":{
		"key":"jayson_winter_inn",
		"name":"Wanderers' Inn",
		"npcs":[
			{"id":"wbartender","position":[-143,-220]},
			{"id":"citizen1","position":[0,-5]},
			{"id":"citizen5","position":[0,-5]},
			{"id":"citizen6","position":[0,-5]},
			#{"id":"mistletoe","position":[94,-181,2]}, #xmas
		],
		"monsters":[
		],
		"doors":[
			[0,29,24,20,"winterland",2,0],
			[47,-228,28,36,"winter_inn_rooms",0,1],
		],
		"spawns":[
			[0,-5,3],
			[28,-208], #1-winter_inn_rooms
		],
		"quirks":[
			#[48,-232,26,36,"log","Locked"],
		],
		"drop_norm":1000,
		"lux":0.75,
	},
	"winter_inn_rooms":{
		"key":"jayson_winter_inn_room1",
		"name":"Rooms",
		"npcs":[
		],
		"monsters":[
		],
		"doors":[
			[0,25,24,20,"winter_inn",1,0],
		],
		"spawns":[
			[-0,-8,3],
		],
		"quirks":[
		],
		"drop_norm":1000,
		"unlist":True,
		"lux":0.6,
	},
	"winter_cave":{
		"key":"jayson_xmas_cave1",
		"name":"Frozen Cave",
		"npcs":[
		],
		"monsters":[
			{"type":"bbpompom","boundary":[-234,-300,336,-28],"count":6},
			{"type":"bbpompom","boundary":[-318,-1112,153,-786],"count":7},
		],
		"doors":[
			[3,41,36,20,"winterland",3,0],
			[-170,-1157,32.5,36.5,"winter_cove",0,1],
		],
		"spawns":[
			[0,11,3],
			[-169,-1144],
		],
		"quirks":[
		],
		"drop_norm":4000,
		"lux":0.5,
	},
	"winter_cove":{
		"key":"jayson_frozenCave",
		"name":"Frozen Cove",
		"npcs":[
		],
		"monsters":[
			{"type":"harpy","boundary":[-3.38,-398.22,273.25,-223.83],"count":5,"roam":True,"random":True},
			{"type":"rharpy","boundary":[-3.38,-398.22,273.25,-223.83],"count":1,"roam":True},
		],
		"doors":[
			[-9,64,51,37.5,"winter_cave",1,0],
		],
		"spawns":[
			[-7.5,9.5,3],
			[509.71,-228.7],
			[253.08,-1849],
			[59,-2242.92],
			[-216.35,-1952.95],
			[-695.12,-1935.26],
			[248.55,-1487.53],
			[37.21,-1338.83],
			[210.45,-1225.44],
			[71.03,-1143.93],
			[-154.29,-1355.28],
			[-285.29,-972.74],
			[-894.25,-485.67],
			[-590.74,-1532.24]

		],
		"quirks":[
		],
		"drop_norm":4000,
		"lux":0.5,
	},
	"winter_instance":{
		"key":"jayson_winterInstance",
		"name":"Lair of the Dark Mage",
		"npcs":[
		],
		"monsters":[
			{"type":"xmagefz","boundary":[-255.17,-261.64,239.07,221.4],"count":1},
			{"type":"xmagefi","boundary":[-255.17,-261.64,239.07,221.4],"count":0},
			{"type":"xmagen","boundary":[-255.17,-261.64,239.07,221.4],"count":0},
			{"type":"xmagex","boundary":[-255.17,-261.64,239.07,221.4],"count":0},
		],
		"on_exit":["winterland",5],
		"doors":[
			[-7.23,250.26,38.15,28.55,"winterland",5,0],
		],
		"spawns":[
			[-8,216,3],
		],
		"quirks":[
		],
		"drop_norm":4000,
		"instance":True,
		"lux":0.75,
	},
	"winterland":{
		#"key":"jayson_IceLandPrototype",
		"key":"jayson_WinterLandV2",
		"name":"Winterland",
		#"weather":"snow",
		"freeze_multiplier":1.5,
		"burn_multiplier":0.6,
		"npcs":[
			{"id":"leathermerchant","position":[262,-48.5]},
			{"id":"transporter","position":[-73,-393]},
			#{"id":"santa","position":[1242,-1631]}, #xmas
			#{"id":"ornaments","position":[-137,-193,1]}, #xmas
			{"id":"guard","position":[1065,-2015]},
			{"id":"citizen7","position":[-15,5]},
			{"id":"citizen8","position":[-15,5]},
			{"id":"citizen9","position":[-15,5]},
			{"id":"citizen10","position":[-15,5]},
		],
		"monsters":[
			{"type":"stompy","boundary":[30,-2954,836,-2536],"count":1},
			{"type":"wolf","boundary":[30,-2954,836,-2536],"count":7},
			#{"type":"rudolph","boundary":[1065,-1598,1418,-1449],"count":1}, #xmas
			{"type":"arcticbee","boundary":[682,-967,1482,-779],"count":10,"grow":True},
			{"type":"wolfie","boundary":[-367,-2234,29,-1819],"count":4},
			{"type":"wolfie","boundary":[236,-2232,460,-1847],"count":3},
			{"type":"boar","boundary":[-173,-1488,212,-730],"count":8},
			{"type":"iceroamer","boundary":[550,-240,1097,149],"count":5},
			{"type":"iceroamer","boundary":[1335,-71,1689,278],"count":4},
			{"type":"icegolem","boundary":[782.25,395.96,888.71,450.28],"count":0,"roam":True},
		],
		"doors":[
			[-280,-132,32,40,"winter_inn",0,2],
			[602,-1289,24,30,"winter_cave",0,3],
			[-864,-1570,24,24,"level2n",2,4],
			[1064.28,-2017.79,31.66,47.45,"winter_instance",0,5,"key","frozenkey"],
		],
		"spawns":[
			[0,0],
			[-8,-337,3], #1-transports NPC
			[-280,-123], #2-winter inn
			[600,-1275], #3-xmas_cave1
			[-864,-1614,3], #4-level2n
			[1063,-2007], #5-winter_instance - HARD REFERENCED at server.js
			[864.5,429.50], #6- ice golem
			[1018.5,401.5], #7- island
		],
		"quirks":[
			[-247,-73,20,16,"sign","The Wanderers' Inn"],
			[202,-56,20,16,"sign","Leather Shop. If I'm not outside, check inside!"],
			[65,-1601,20,16,"sign","Dangers Ahead. Beware!"],
			[465,-2296,20,16,"note","Stompy and his companions defeated me many times. However, I've discovered that If I stay just around the corner they can't even reach me! HAHA!"],
			[-230,95,20,16,"log","Old Man's House"],
			[168,-83,32,40,"log","Locked"],
			[138,223,32,40,"log","Locked. This is probably where the guards stay"],
			[413,-3080,24,30,"log","Can't reach. This might be Stompy's lair"],
			[600.5,-1273,0,0,"info","darkmage"],
		],
		"drop_norm":3000,
		"lux":0.9,
		"outside":True,
	},
	"desertland":{
		"key":"jayson_desertlandW",
		"freeze_multiplier":0.4,
		"burn_multiplier":1.6,
		"name":"Desertland",
		"npcs":[
			{"id":"transporter","position":[-14,-477]},
			{"id":"locksmith","position":[316,-270]},
		],
		"monsters":[
			{"type":"plantoid","boundary":[-1013,-472,-575,-130],"count":4},
			{"type":"plantoid","boundary":[-1013,-624,-762,-137],"count":4},
			{"type":"porcupine","boundary":[-992,-58,-666,328],"count":8,"grow":True},
			{"type":"ent","boundary":[-757,-2034,-70,-1888],"count":3},
			{"type":"fireroamer","boundary":[91,-952,353,-702],"count":4},
			{"type":"fireroamer","boundary":[161,-868,453,-697],"count":2},
			{"type":"scorpion","boundary":[220.31,-1569.2,561.04,-1275.72],"count":6},
			{"type":"bscorpion","boundary":[-522.44,-1340.19,-295.2,-1183.31],"count":1},
		],
		"spawns":[
			[0,0],
			[10,-386],
			[601,-2365], #2-desertland
		],
		"doors":[
			[600,-2383,40,40,"level2s",1,2],
		],
		#"irregular":True,
		"drop_norm":1000,
		"outside":True,
	},
	"shellsisland":{
		"key":"jayson_shells_island01",
		"name":"New Town!",
		"npcs":[
			{"id":"wizardrepeater","position":[-190,26]},
		],
		"monsters":[
			{"type":"kitty1","boundary":[123,-235,270,-176],"count":1},
			{"type":"kitty2","boundary":[123,-235,270,-176],"count":1},
			{"type":"kitty3","boundary":[123,-235,270,-176],"count":1},
			{"type":"kitty4","boundary":[123,-235,270,-176],"count":1},
			{"type":"puppy1","boundary":[211,-234,271,-100],"count":1},
			{"type":"puppy2","boundary":[211,-234,271,-100],"count":1},
			{"type":"puppy3","boundary":[211,-234,271,-100],"count":1},
			{"type":"puppy4","boundary":[211,-234,271,-100],"count":1},
		],
		"spawns":[
			[0,0],
		],
		"drop_norm":1000,
		"instance":True,
		"outside":True,
	},
	"halloween":{
		"key":"jayson_holloweenmap",
		"key":"jayson_SpookyForestV2.2",
		"name":"Spooky Forest",
		"npcs":[
			{"name":"Fancy Pots","id":"fancypots","position":[201,-180]},
			#{"name":"Transporter","id":"transporter","position":[582,-117]},
			{"name":"Transporter","id":"transporter","position":[-97,-330]},
			{"id":"witch","position":[858,-160]},
			{"id":"citizen11","position":[201,-160]},
			{"id":"citizen12","position":[201,-160]},
			{"id":"citizen13","position":[201,-160]},
		],
		"monsters":[
			{"type":"osnake","boundary":[-654,-384,-525,-287],"count":2},
			{"type":"osnake","boundary":[-620,-986,-356,-431],"count":4},
			#{"type":"snake","boundary":[-620,-986,-356,-431],"count":9,"grow":True},
			{"type":"snake","boundary":[-720,-820,-418,-203],"count":9,"grow":True},
			{"type":"greenjr","boundary":[-720,-820,-418,-203],"count":1},

			{"type":"minimush","boundary":[-166,453,182,808],"count":8,"grow":True},
			{"type":"mrpumpkin","boundary":[-671,571,-300,800],"count":1,"special":True},
			{"type":"xscorpion","boundary":[-671,571,-300,800],"count":6},

			{"type":"snake","boundary":[141,-792,552,-702],"count":6,"grow":True},
			{"type":"osnake","boundary":[141,-792,552,-702],"count":2},
			{"type":"tinyp","boundary":[141,-792,552,-702],"count":1},

			{"type":"ghost","boundary":[284,-1351,446,-1189],"count":5},
			{"type":"ghost","boundary":[54,-1277,237,-1078],"count":5},

			{"type":"fvampire","boundary":[-664,-1808,-147,-1477],"count":1},
			{"type":"ghost","boundary":[-664,-1808,-147,-1477],"count":9},
		],
		"spawns":[
			[0,0],
			[-38,-283,2], #1-teleporter
			#[103,-263,2], #2-spooky
			[784,-1060], #2-spooky
			[-1071,-1485], #3-level1
			[1212,101,3], #4-main
		],
		"doors":[
			#[108,-260,32,32,"spookytown",1,2],
			[784,-1085,80,40,"spookytown",1,2],
			[-1071,-1496,40,40,"level1",2,3],
			[1212,150,200,36,"main",15,4],
		],
		"quirks":[
			[-228,-178,32,40,"log","Locked but there are noises coming from inside"],
			[331,-210,32,40,"log","Locked"],
			[128,-251,20,16,"sign","Beware! Don't fall down!"],
		],
		#"filter":"halloween",
		"drop_norm":4000,
		"outside":True,
		"lux":0.9,
	},
	"spookytown":{
		"key":"jayson_holloweenmap2",
		"name":"Spooky Town",
		"npcs":[
			{"id":"citizen15","position":[300,-700],"boundary":[281,-836,508,-570]},
			#{"id":"citizen15","position":[200,-1400],"boundary":[31,-1571,480,-1293]},
			{"id":"citizen14","position":[0,0],"boundary":[-283,-222,289,234]},
		],
		"monsters":[
			{"type":"mummy","boundary":[31,-1571,480,-1293],"count":9,"rage":[-124,-1631,614,-1130]},
			{"type":"booboo","boundary":[286,-842,544,-562],"count":5,"rage":[286,-842,544,-562]},

			{"type":"stoneworm","boundary":[501,61,852,197],"count":4},
			{"type":"stoneworm","boundary":[773,-198,1216,-68],"count":4},

			{"type":"mrgreen","boundary":[524,860,748,1129],"count":1,"special":True},
			{"type":"jr","boundary":[-970,-413,-597,-189],"count":1},
		],
		"spawns":[
			[0,0],
			#[71,-68], #1-halloween
			[32,1404,3], #1-halloween
			[192,-194,1], #2-level2
		],
		"doors":[
			#[72,-80,32,40,"halloween",2,1],
			[34,1449,80,30,"halloween",2,1],
			[240,-181,48,32,"level2",5,2],
		],
		"quirks":[
			[-63,-44,30,24,"invisible_statue"],
		],
		"ref":{
			"poof":{"map":"spookytown","in":"spookytown","x":-63,"y":-44},
		},
		"drop_norm":4000,
		"outside":True,
		"lux":0.9,
	},
	"tunnel":{
		"key":"jayson_miningtunnel_new",
		"name":"Mining Tunnel",
		"npcs":[
			{"id":"gemmerchant","position":[-264,-96,2]},
		],
		"monsters":[
			{"type":"mole","boundary":[-210,-1291,238,-853],"count":8},
			{"type":"mole","boundary":[-238,-638,207,-21],"count":7},
		],
		"spawns":[[0,-16,3]], # 1 left, 2 right, 3 back
		"doors":[
			[2,18,64,32,"main",2,0], #.spawns[1]
		],
		"quirks":[
			[50,-678,20,16,"sign","Beware: Mole's Bite"],
			[64,-1341,24,30,"log","Gloomy"],
		],
		"drop_norm":5000,
		"zones":[
			{
				"type":"mining",
				"drop":"m1",
				"polygon":[[296,-16],[296,-128],[256,-128],[256,-280],[272,-280],[272,-360],[264,-360],[264,-520],[296,-520],[296,-680],[120,-680],[120,-840],[280,-840],[280,-904],[272,-904],[272,-1224],[296,-1224],[296,-1288],[280,-1288],[280,-1304],[200,-1304],[200,-1328],[-64,-1328],[-64,-1320],[-200,-1320],[-200,-1328],[-288,-1328],[-288,-1160],[-248,-1160],[-240,-1160],[-240,-952],[-288,-952],[-288,-840],[-152,-840],[-144,-840],[-144,-808],[-112,-808],[-112,-680],[-288,-680],[-288,-504],[-272,-504],[-272,-168],[-288,-168],[-288,8],[-424,8],[-424,-1440],[384,-1440],[384,-16]],
			}
		],
		"lux":0.65,
	},
	"batcave":{
		"ignore":True,
		"key":"batcave",
		"name":"Cave of Beginnings",
		"npcs":[
			#{"name":"Transporter","id":"transporter","position":[100,100]},
		],
		"monsters":[
			{"type":"bat","boundary":[-210,-170,342,185],"count":12},
			{"type":"mvampire","boundary":[-210,-170,342,185],"count":1},
		],
		"spawns":[[-200,190,3]], # 1 left, 2 right, 3 back
		"doors":[
			[-195,213,24,20,"main",1], #.spawns[1]
		],
		"drop_norm":4500,
	},
	"arena":{
		"key":"arena3",
		"name":"Arena",
		"npcs":[
			#{"name":"Transporter","id":"transporter","position":[-50,-50]},
		],
		"monsters":[
			{"type":"cgoo","boundary":[-376,-888,1144,48],"polygon":[[-376,48],[1144,48],[1144,-888],[248,-888],[248,-776],[520,-776],[520,-560],[248,-560],[248,-376],[288,-376],[288,-336],[328,-336],[328,-304],[480,-304],[480,-344],[512,-344],[512,-368],[720,-368],[720,-192],[688,-192],[688,-152],[608,-152],[608,-120],[272,-120],[272,-152],[104,-152],[104,-200],[-128,-200],[-128,-400],[240,-400],[240,-888],[-376,-888]],"count":32},
			{"type":"skeletor","boundary":[259,-764,500,-579],"count":1},
		],
		"spawns":[[151.6,40.82]],
		"doors":[
			[152.99,85.42,60.9,40.55,"main",6,0],
		],
		"on_death":["main",7], #pvp death main.spawns[3]
		"safe_pvp":True,
		"pvp":True,
		"drop_norm":2000,
		"lux":0.45,
	},
	# Name Ideas: The Entrance, Bog, The Depraved Waters, Underground Cove, Soul Nexus, Subterrane
	"level1":{
		"key":"jayson_underground_level1v2",
		"name":"Underground [Entrance]",
		"npcs":[
		],
		"monsters":[
			{"type":"prat","boundary":[-86,17,64,212],"count":5},
			{"type":"prat","boundary":[-308,629,0,762],"count":5},
		],
		"spawns":[
			[149,87,1],
			[0,9], #1-main
			[-408,-258,3], #2-halloween
			[-863,89,3], #3-cave
			[-327,511,3], #4-level2
		], # 1 left, 2 right, 3 back
		"doors":[
			[0,-4,20,50,"main",11,1],
			[-408,-275,20,50,"halloween",3,2],
			[-865,77,20,50,"cave",1,3],
			[-313,544,24,24,"level2",1,4],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"small_steps":True,
		"lux":0.4,
	},
	"level2":{
		"key":"jayson_underground_level2.2",
		#"key":"jayson_underground_level2",
		"name":"Underground [Passing]",
		"npcs":[
			{"id":"thief","position":[-133,-187]},
			{"id":"citizen16","position":[-46,-168]},
		],
		"monsters":[
		],
		"spawns":[
			[39,177,3], #0-level3
			[1,-5], #1-level1
			[-87,256,3], #2-level2s
			[216,170,1], #3-level2e
			[-303,-69,2], #4-level2w
			[75,56], #5-spookytown
			[-279.95,-249.15], #6-bank_u
		],
		"doors":[
			[40,219,24,24,"level3",0,0],
			[0,-20,20,50,"level1",4,1],
			[-87,300,80,40,"level2s",0,2],
			[247,193,40,110,"level2e",1,3],
			[-327,-45,40,110,"level2w",0,4],
			[79,41,20,50,"spookytown",2,5],
			[-280.14,-260.37,34.84,51.33,"bank_u",0,6,"ulocked","complicated"],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},
	"level2n":{
		"key":"jayson_underground_level2_northv2",
		"name":"Underground [North]",
		"npcs":[
		],
		"monsters":[
			{"type":"pppompom","boundary":[-621,-241,-234,-65],"count":6},
			{"type":"pppompom","boundary":[153,-303,432,-75],"count":7},
		],
		"spawns":[
			[0,0,3], #0-level2w
			[-416,0,3], #1-level2w
			[-112,-676], #2-winterland
		],
		"doors":[
			[0,38,120,45,"level2w",1,0],
			[-416,38,60,45,"level2w",2,1],
			[-112,-691,20,40,"winterland",4,2],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},
	"level2e":{
		"key":"jayson_underground_level2_eastv2",
		"name":"Underground [East]",
		"npcs":[
		],
		"monsters":[
			{"type":"pinkgoblin","polygon":[[384,-96],[464,-96],[464,-64],[608,-64],[608,144],[568,144],[568,304],[464,304],[464,328],[368,328],[368,208],[344,208],[344,160],[384,160]],"boundary":[344,-96,608,328],"count":3}
		],
		"spawns":[
			[18.5,459.5,2], #0-level2s
			[3.5,0,2], #1-level2
		],
		"doors":[
			[-7,502,40,140,"level2s",2,0],
			[-23,40,40,140,"level2",3,1],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},
	"level2s":{
		"key":"jayson_underground_level2_southv2",
		"name":"Underground [South]",
		"npcs":[
		],
		"monsters":[
			{"type":"cgoo","boundary":[-52.5,359.33,120.29,646.25],"count":8},
		],
		"spawns":[
			[0,-14], #0-level2
			[-240,681], #1-desertland
			[383,539,1], #2-level2e
		],
		"doors":[
			[0,-20,40,40,"level2",2,0],
			[-240,668,20,50,"desertland",2,1],
			[406,580,40,140,"level2e",0,2],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},
	"level2w":{
		"key":"jayson_underground_level2_westv2",
		"name":"Underground [West]",
		"npcs":[
		],
		"monsters":[
			{"type":"oneeye","boundary":[-447,9,-208,323],"count":5},
			{"type":"franky","boundary":[-447,9,-208,323],"count":0,"special":True},
		],
		"spawns":[
			[16,9,1], #0-level2
			[-96,-184], #1-level2n
			[-528,-184], #2-level2n
		],
		"doors":[
			[39,53,40,140,"level2",4,0],
			[-96,-197,60,40,"level2n",0,1],
			[-528,-197,60,40,"level2n",1,2],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},
	"level3":{
		"key":"jayson_underground_level3v2",
		"name":"Underground [Deeps]",
		"npcs":[
		],
		"monsters":[
			{"type":"mummy","boundary":[-451.21,-397.41,-240.59,-65.16],"count":3},
			{"type":"bbpompom","boundary":[131.97,-368.95,398.99,-56.88],"count":4},
		],
		"spawns":[
			[0,10], #0-level2
			[-28,-438,2], #1-level4
		],
		"doors":[
			[0,-5,20,50,"level2",0,0],
			[-8,-409,24,24,"level4",0,1],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},
	"level4":{
		"key":"jayson_underground_level4v2",
		"name":"Underground [Abyss]",
		"npcs":[
		],
		"monsters":[
			{"type":"cgoo","boundary":[-366.74,-395.74,-109.59,-152.68],"count":6},
			{"type":"mummy","boundary":[119.92,-4.27,378.46,338.17],"count":3},
		],
		"spawns":[
			[0,14],
			[291,-140], #jump point
		],
		"doors":[
			[0,-3,20,50,"level3",1,0],
		],
		"quirks":[
		],
		"drop_norm":5000,
		"unlist":True,
		"lux":0.4,
	},

}
for name in maps:
	if not maps[name].get("doors"): maps[name]["doors"]=[]
	if not maps[name].get("npcs"): maps[name]["npcs"]=[]