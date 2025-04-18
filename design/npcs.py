# This Python file uses the following encoding: utf-8
npcs={
	"pots":{
		"role":"merchant",
		"items":[
			"hpot0","mpot0","hpot1","mpot1",None,
			None,None,None,None,None,
			None,None,None,None,None,
			None,None,None,None,None,
		],
		"skin":"yellowlady",
		"atype":"once",
		"stopframe":1,
		"says":"Oh, Hello",
		"ignore":True,
	},
	"standmerchant":{
		"role":"standmerchant",
		"items":[
			"stand0",None,None,"ghatb","ghatp",
			None,None,None,None,None,
			None,None,None,None,None,
			None,None,None,None,"test_orb",
		],
		"skin":"purplelady",
		#"atype":"once",
		#"stopframe":1,
		"type":"fullstatic",
		"cx":{"hat":"hat221"},
		"says":"Huu Huu",
		"color":"#3FEEA2",
		"name":"Divian",
	},
	"pvptokens":{
		"role":"pvptokens",
		"skin":"pvptokens",
		"token":"pvptoken",
		"says":"Grrr",
		"color":"#9C201C",
		#"atype":"flow",
		"stand":"wstand_texture",
		"aspeed":"slow",
		"name":"Gn. Spence",
		"side_interaction":{"auto":True,"skin":"pknight","message":"These tokens of honor represent victory. Make sure to join all the PVP events and spend some time in PVP realms. Glorious!"},
	},
	"funtokens":{
		"role":"funtokens",
		"skin":"funtokens",
		"token":"funtoken",
		"says":"Hihihi",
		"color":"#92D467",
		"atype":"flow",
		"stand":"standg_texture",
		"aspeed":"slow",
		"name":"Tricksy",
		"side_interaction":{"auto":True,"skin":"ftokener","message":"Bring your fun tokens to me and I'll give you some exciting items!"},
	},
	"friendtokens":{
		"role":"friendtokens",
		"skin":"xxschar2h",
		"token":"friendtoken",
		"says":"Hihihi",
		"color":"#92D467",
		"atype":"flow",
		"stand":"fstand_texture",
		"aspeed":"slow",
		"name":"Fvona",
		"side_interaction":{"auto":True,"skin":"xxschar2h","message":"Invite your friends to Adventure Land to win some of these goodie goodies!"},
	},
	"shellsguy":{
		"role":"shells",
		"name":"Mr. Dworf",
		"skin":"fancyd",
		"type":"fullstatic",
		"says":"Sup",
	},
	"monsterhunter":{
		"role":"monstertokens",
		"token":"monstertoken",
		"name":"Daisy",
		"skin":"daisy",
		"type":"fullstatic",
		"says":"Hi!",
		"color":"#B4FAA0",
	},
	"mcollector":{
		"role":"mcollector",
		"quest":"mcollector",
		"name":"Cole",
		"skin":"proft",
		"type":"fullstatic",
		"says":"Hmm",
		"color":"#67A464",
	},
	"thief":{
		"role":"merchant",
		"items":[
			"licence",None,None,None,None,
			None,None,None,None,None,
			None,None,None,None,None,
			None,None,None,"scroll3","cscroll3",
		],
		"skin":"thief",
		#"skin":"test_a",
		"type":"fullstatic",
		"says":"Careful",
		"color":"#E7E2E7",
		"name":"Crun",
	},
	"fancypots":{
		"role":"merchant",
		"items":[
			"hpot0","mpot0","hpot1","mpot1",None,
			None,None,None,None,None,
			None,None,None,None,None,
			None,None,None,None,None,
		],
		"skin":"fancypots",
		#"skin":"test_a",
		"atype":"flow",
		"says":"Woo. Hic.",
		"color":"#E57636",
		"name":"Ernis",
		"side_interaction":{"auto":True,"skin":"potiongirl","message":"Hello there. Are you injured or in need of some potions? My family and I pride ourselves with having the best quality potions and elixirs around. Take as much as you need. *hic*"},
	},
	"tbartender":{
		"role":"merchant",
		"items":[
			"whiskey","wine","ale",None,None,
			"pico","blue",None,None,None,
			"espresso",None,None,None,None,
			None,None,None,None,"xshot",
		],
		"skin":"showoffi",
		"type":"fullstatic",
		"says":"Hello there",
		"color":"#EBECEE",
		"name":"Jaqk",
		"side_interaction":{"auto":True,"skin":"showoffi","message":"Hello there, partner! Care for a drink? Good luck on the games! Don't lose all your gold at once, heh."},
	},
	"wbartender":{
		"role":"merchant",
		"items":[
			"hpot0","mpot0","hpot1","mpot1",None,
			"elixirluck",None,None,None,None,
			None,None,None,None,None,
			None,None,None,None,None,
		],
		"skin":"npc63",
		"says":"Welcome!",
		"color":"#67CCB2",
		"type":"fullstatic",
		"name":"Warin",
	},
	"scrolls":{
		"role":"merchant",
		"items":[
			"scroll0","cscroll0","strscroll","intscroll","dexscroll",
			"scroll1","cscroll1",None,None,None,
			#None,None,None,None,None,
			"scroll2","cscroll2",None,None,
		],
		"skin":"scrolls",
		"says":"Good Luck",
		"name":"Lucas",
	},
	"secondhands":{
		"role":"secondhands",
		"skin":"blingbling",
		"type":"fullstatic",
		"says":"There's some good stuff in here",
		"color":"#7E65D3",
		"name":"Ponty",
		"side_interaction":{"auto":True,"skin":"blingbling","message":"They sell them. I buy them. You buy them from me for higher prices. Win win. I win. Bling!"},
	},
	"rewards":{
		"role":"rewards",
		"skin":"marmor9h",
		"cx":{
			"head": "makeup107",
			"hair": "hairdo518",
			"face": "coolblueg",
			"hat": "hat400"
		},
		"type":"fullstatic",
		"says":"Rewards!",
		"color":"#7E65D3",
		"name":"Werdars",
	},
	"lostandfound":{
		"role":"lostandfound",
		"skin":"goblin",
		"type":"fullstatic",
		"says":"Finders keepers",
		"color":"#7E65D3",
		"name":"Ron",
	},
	"holo":{
		"role":"resort",
		"skin":"holo",
		"type":"fullstatic",
		"says":u"△ ▽ ▲ ▼",
		"color":"#EBECEE",
		"name":"Z",
	},
	"tavern":{
		"role":"tavern",
		"skin":"showoffi",
		"type":"fullstatic",
		"says":"Hi",
		"color":"#EBECEE",
		"name":"Jaqk",
	},
	"pete":{
		"name":"Pete",
		"role":"petkeeper",
		"skin":"lionsuit",
		"type":"fullstatic",
		"says":"Purr",
		"color":"#EBECEE",
	},
	"guard":{
		"name":"Guard",
		"role":"guard",
		"says":"...",
		"skin":"thehelmet",
		"type":"fullstatic",
	},
	"ship":{
		"role":"ship",
		"skin":"ship",
		"says":"Ahoy",
		"aspeed":"slower",
		"atype":"flow",
	},
	"newyear_tree":{
		"role":"newyear_tree",
		"skin":"newyear_tree",
		"says":"*Tin* *Tin* *Tin* *Tin*",
		"aspeed":"fast",
		"atype":"flow",
		"color":"#B7161F",
		"name":"New Year Tree",
	},
	"lotterylady":{
		"role":"lottery",
		"skin":"llady",
		"type":"fullstatic",
		"says":"Hi Dear",
		"color":"#DF5AC5",
		"name":"Rose",
	},
	"mistletoe":{
		"role":"quest",
		"quest":"mistletoe",
		"skin":"pink",
		"type":"fullstatic",
		"says":"Uhhh",
		"color":"#E376E5",
		"name":"Faith",
	},
	"ornaments":{
		"role":"quest",
		"quest":"ornament",
		"skin":"splithair",
		"type":"fullstatic",
		"says":"Hmm. Hmm. Hmm.",
		"color":"#E56D39",
		"name":"Jayson",
	},
	"santa":{
		"role":"santa",
		"quest":"candycane",
		"skin":"santa",
		"says":"Ho Ho Ho",
		"color":"#DF2A2F",
		"name":"Santa",
	},
	"witch":{
		"role":"witch",
		"quest":"witch",
		"skin":"brewingwitch",
		"says":"Brew Brew Brew",
		"color":"#AF6AE2",
		"aspeed":"slow",
		"name":"Witch",
	},
	"jailer":{
		"role":"jailer",
		"skin":"thehelmet",
		"type":"fullstatic",
		"says":"Tu-tu-tu",
		"color":"#62C3DF",
		"name":"Jailord",
	},
	"leathermerchant":{
		"role":"quest",
		"quest":"leather",
		"skin":"lmerchant",
		"type":"fullstatic",
		"says":"Have leathers?",
		"color":"#6E4430",
		"name":"Landon",
	},
	"gemmerchant":{
		"role":"quest",
		"quest":"gemfragment",
		"skin":"gemmerchant",
		"type":"fullstatic",
		"says":"Bling",
		"color":"#A058DF",
		"name":"Mine Heathcliff",
	},
	"fisherman":{
		"role":"quest",
		"quest":"seashell",
		"skin":"fisherman",
		"type":"fullstatic",
		"says":"Beautiful",
		"color":"#429DDF",
		"name":"Tristian",
	},
	"pwincess":{
		"role":"quest",
		"quest":"lostearring",
		"skin":"pwincess",
		"type":"fullstatic",
		"says":"eek",
		"color":"#FECDF7",
		"name":"Wynifreed",
	},
	"firstc":{
		"role":"companion",
		"says":["I've heard goos drop amulets.","I'm strictly on a goo-only diet."],
		"skin":"lady1",
		"type":"fullstatic",
	},
	"pvpblocker":{
		"role":"blocker",
		"says":"I will leave when there are* 4 people around.",
		"skin":"thehelmet",
		"type":"fullstatic",
	},
	"pvp":{
		"role":"pvp_announcer",
		"name":"Ace",
		"allow":False,
		"speed":40,
		"hp":5000,
		"skin":"thehelmet",
		"type":"fullstatic",
	},
	"bean":{
		"role":"events",
		"name":"Bean",
		"allow":False,
		"speed":30,
		"hp":3200,
		"skin":"lionsuit",
		"type":"fullstatic",
		"moving":True,
	},
	"citizen0":{
		"name":"Kane", #can't change this name, hardcoded to server_loot
		"role":"citizen",
		"skin":"greencap",
		"type":"fullstatic",
		"seek":"thrill",
		"says":"Hello",
		"speed":30,
		#"speed":3200,
		"hp":3200,
		"delay":1200,
		#"delay":0,
		"level":12,
		"says":["Heyoo","Greetings","I want a Puppy!","I want a Kitten!","Sup","Nice day","I wonder why everyone's sitting on my head all of a sudden ..."],
		"interaction":["Hey There! This town is the safest place around. Outside can be dangerous.","Heyo, I don't understand how those shop owners can just stand around all day. I got to be moving. Kind of restless.","Just finished school and I've got to go get a real job now. I might become an adventurer since they seem to make a lot of money.","A friend of mine said the frog thingies in the beach drop some old money or sth like that."],
		"aura":{
			"luck":200,
		},
	},
	"citizen1":{
		"name":"Kilgore",
		"role":"citizen",
		"skin":"fxrogue",
		"type":"fullstatic",
		"says":"Grrrr",
		"speed":40,
		"hp":13200,
		"delay":1200,
		"steps":12, #defaultis 40, the walking multiplier
		"level":120,
		"says":["What is your name","Bartender give me your strongest liquor","How are you stranger","I wonder what my wife is doing at home","This inns food isn't as good homemade","Don't buy the food here","Do I smell","Good day","Greetings","Hello Stranger","Welcome","Its warm in here","*rubs beard*","Id like a beer","What beer should I buy","I need to rent a room","This place is pretty nice","Hi there"],
		"interaction":["If you don't have a beer in your hand then what are you doing in here!?","Sit down and tell me a tale!","If you can't handle the cold then stay inside.. not saying I can't handle the cold.."],
	},
	"citizen2":{
		"name":"Stewart",
		"role":"citizen",
		"skin":"oldcitizen",
		"type":"fullstatic",
		"says":["Freaking youngens","Go away - Kill some monsters","Stop","Someone needs to fix this place up","I don't have time for this","I need to go take a nap","Uhhh","Mmmehh","Ugg","Noob","Young yipper snappers"],
		"speed":10,
		"hp":2400,
		"delay":12000,
		"level":32,
		"interaction":["Ehh. Back in my day we didn't have all these fancy additions in town, we had the essentials and that's it."],
	},
	"citizen3":{
		"name":"Reny",
		"role":"citizen",
		"skin":"renaldo",
		"type":"fullstatic",
		"says":["Do you even lift bro","Broooo","Yah I work out","Sup","I need to buy some protein","Lap 203","Grind 24/7 all day everyday","You like my headband","Where are my shoes at","Where is the gym at","Nice day to work out","Wanna work out","Red headband for the win","Winners are not losers and I'm a winner","No I never give up"],
		"speed":55,
		"hp":3200,
		"delay":3600,
		"level":32,
		"interaction":["I Grind 24 hours a day! 7 days a week! Never Stop! Never Give up! Always Training!!","My body fat ratio is just 18%. Can you believe it? Yes!","Do you even lift Bro.","Hi, I do laps around this town all the time. Gotta stay in shape."],
	},
	"citizen4":{
		"name":"Angel",
		"role":"citizen",
		"skin":"angel",
		"type":"fullstatic",
		"seek":"gold",
		"says":["Ohh look who walked into my life","Single and ready to mingle","No um I don't own a shop","Such a nice town","*fixes dress*","*gets flustered*","Would you like a potion sorry","Ohh look who walked into my life","Single and ready to mingle","No um I don't own a shop","Such a nice town","*fixes dress*","*gets flustered*","Would you like a potion sorry","No potion for you","Stop cat calling","*rolls eyes*Hey sweetie","Nice day","Sweet thing are you lost","Oh hi there cutie","Lovely weather today","Do you like my dress","Welcome to the town"],
		"speed":20,
		"hp":24000,
		"delay":6000,
		"level":80,
		"interaction":["I used to sell potions around here, but I decided to retire.","Always nice to see smiling new faces.","Are you new here? Welcome.","This town has grown a lot, I was around when it was just one small block of land."],
		"aura":{
			"gold":200,
		},
		"modal":"npc-angel",
	},
	"citizen5":{
		"name":"Grundur",
		"role":"citizen",
		"skin":"generalg",
		"type":"fullstatic",
		"says":["I remember the battle of the beards","Hello","Greetings","Good day","Pretty cold outside ay","Do you like my outfit","Hi there","Tomorrow is a new day","Ive seen some real shit","Back in my day ...","Stompy better die","*yawns*","So much snow around here","*drinks beer*",],
		"speed":30,
		"hp":18600,
		"delay":1200,
		"steps":12,
		"level":90,
		"interaction":["It is pretty cold outside. I should invest in a hat.","I came here to pursue a beast called \"Stompy\". I've heard this creature lives in the Ice Mountains nearby.","I came here for adventure, but now I'm stuck in this bar due to the cold."],
	},
	"citizen6":{
		"name":"Fredric",
		"role":"citizen",
		"skin":"mailman",
		"type":"fullstatic",
		"says":["*searches through mail bag*","*hums to self*","*whisles*","Are you new here","Ohh you're an adventurer","Good day adventurer","I like love letters they are sweet","Um I don't read your letters","Hey stranger"],
		"speed":30,
		"hp":18600,
		"delay":1200,
		"steps":12,
		"level":90,
		"interaction":["Hi, I'm a mail man! But no one sends mail out here much. So I guess it's a pretty easy job.","Careful it's cold outside. But it's nice and warm in here."],
	},
	"citizen7":{
		"name":"Lucy",
		"role":"citizen",
		"skin":"lucy",
		"type":"fullstatic",
		"says":["Do you like my scarf","My mom made my scarf","Do you know who santa is","I wonder where santa lives","I'm used to the cold here","Hi","Im going to move to a warmer place one day","This scarf makes me warm","Don't hit on me","I have a boyfriend","The leather guy is my boyfriend","I think Stompy is just misunderstood"],
		"speed":30,
		"hp":3200,
		"delay":1200,
		"level":48,
		"interaction":["Hi! Would you like to know a secret? I love the snow.","Make sure you keep moving, don't want to catch a cold out here.","I have heard that Santa sometimes visits here during Xmas!"],
	},
	"citizen8":{
		"name":"Wyr",
		"role":"citizen",
		"skin":"frozenrogue",
		"type":"fullstatic",
		"says":["How are you","*wipes snow off himself*","It's cold here","*shivers*","This is a pretty small village","I've meet a real elf","Don't go swimming here it's cold"],
		"speed":38,
		"hp":16000,
		"delay":1200,
		"level":78,
		"interaction":["Are you here to kill Stompy too? Well I guess let the best adventurer get to him first!","My hair was actually black, before it happened."],
	},
	"citizen9":{
		"name":"Lilith",
		"role":"citizen",
		"skin":"lilith",
		"type":"fullstatic",
		"says":["Oh you like my hair","Are you here to serve","I'm sure I can fight off stompy","Stompy doesn't scare me","Wizard is my boss","Good day","Oh it's snowing","Snow is nice","Don't bother the guards building","Don't flirt with me","I protect and serve","I'm a commander","Greetings stranger","Hello stranger","Hi stranger","I serve the mighty Wizard","I was instructed to keep this village safe","The cold doesn't bother me"],
		"speed":32,
		"hp":12000,
		"delay":1200,
		"level":92,
		"interaction":["Greetings Adventurer, are you here to kill some monsters? Great! Always looking for help keeping this land safe.","Believe it or not. I am the highest ranking officer in these parts. I work hard to keep this town operating and safe."],
	},
	"citizen10":{
		"name":"Caroline",
		"role":"citizen",
		"skin":"pink",
		"type":"fullstatic",
		"says":["Hi","My coat keeps me super warm","Stompy used to be my favorite boar","I wish stompy would come home","That inn over there is always a great place","I want to be everyone's friend","Do you need a hug","Hugs keep you warm","*gives you a hug*","Free hugs","This village is mostly boar farmers","Hey","Hello","*wiggles in pink coat*","Pink is my favorite color","I'd love to work for Santa"],
		"speed":28,
		"hp":12000,
		"delay":1200,
		"level":92,
		"heal":2400,
		"seek":"cuteness",
		"class":"priest",
		"interaction":["Hey Hey guess what! I like the color Pink! I bet you couldn't guess that.","If Santa ever comes back, I hope I could be his little helper.","Make sure you wear warm clothes, it's a little chilly out here."],
	},
	"citizen11":{
		"name":"Baron",
		"role":"citizen",
		"skin":"baron",
		"class":"priest",
		"seek":"low_hp",
		"type":"fullstatic",
		"says":["Stranger","Where is mother","Cursed land","Stay clear","Go away","Back away","*stares blankly*","*stares coldly*","...",".....","........","Halt","Must protect","Never forget","Defend","Protect","For honor"],
		"speed":28,
		"attack":1800,
		"range":320,
		"hp":120000,
		"delay":12000,
		"level":120,
		"interaction":["Guard.    Village.    Protect.    Innocents.","Brothers.     Rest.     Here.    Protect.    Over.    Their.    Graves.","Remember.    The.    Fallen.    Never.    Forget.  Their.    Sacrifices.","Heal.    The.    Fallen."],
	},
	"citizen12":{
		"name":"Marven",
		"role":"citizen",
		"skin":"marven",
		"type":"fullstatic",
		"says":["I'd hate to find you dead *wink*","Bloody hell","What are you doing here","Who the hell would like living here","Where is my shovel","Stay out of the graveyard","Go home kid","Seen any good junk around","Whatca looking for","Go away","This isn't the place for you","Ever heard of minding your own business","Ever seen a dead man","Hhehehe","Finders keepers"],
		"speed":32,
		"hp":1200,
		"delay":3200,
		"level":42,
		"interaction":["I watch over the graves. Sometimes people leave 'gifts' on a grave. Ehhh, sometimes I clean the graves of these items."],
	},
	"citizen13":{
		"name":"Divian",
		"role":"citizen",
		"skin":"grogue",
		"type":"fullstatic",
		"says":["I see dead people","Ghosts speak to me","Are zombies real","R.I.P. Such nice letters","*evil glare*","I serve Death","Death is my leader","All Hail Death","Danger awaits you","Dracul please take me as your bride","Death isn't the end","Do you know of any cults","Wizard could go to hell I serve Death","It never rains here, I'm only happy when it rains","My eyes are blood red","My favorite color is red","I'd like to meet my demons"],
		"speed":32,
		"hp":1200,
		"delay":3200,
		"level":42,
		"interaction":["I am a firm believer that the dark arts would solve a lot of problems if it was acceptable to practice them.","Did you know that Ms. Dracul used to be a member of this village... before she transcended the limitations of mankind. I wish I had the courage to do the rituals required.","Dracul is a very well-known name around these parts. I wish I could be like them..","I heard there is a way to get +13 items, anything can turn into one, but you can't even see it ..."],
	},
	"citizen14":{
		"name":"Violet",
		"role":"citizen",
		"skin":"spkw",
		"type":"fullstatic",
		"speed":28,
		"hp":4000,
		"delay":4000,
		"level":70,
		"says":["Hello there","Where's that boy?","SON!!!","Play time is over!","Welcome","Same old same old","Ohh a visitor","Well hi there","It's getting late","Home sweet home","Are you hungry?"],
		"interaction":["Have you seen my son? He should be around here somewhere.","It's not a very nice neighborhood around here, But the rent is cheap!","I heard somewhere that's there's some sort of pumpkin person walking around? That just sounds silly to me"],
	},
	"citizen15":{
		"name":"Timmy",
		"role":"citizen",
		"skin":"spkc",
		"type":"fullstatic",
		"speed":16,
		"hp":200,
		"delay":200,
		"level":4,
		"says":["I think I saw a pumpkin move!!","I like pumpkins","Size doesn't matter!","You found me","Boo!!","Weee","Hello","*Mumble Mumble*"],
		"interaction":["Be careful around here? It's really dangerous up to the north.","I like to play with the pumpkins, but sometimes they don't want to play and just walk away..","My imaginary friend is real! And a pumpkin!!"],
	},
	"citizen16":{
		"name":"Cunn",
		"role":"citizen",
		"skin":"cunn",
		"class":"ranger",
		"seek":"dragondagger",
		"transport":True,
		"type":"fullstatic",
		"slots":{
			"mainhand":{"name":"crossbow","level":7},
		},
		"says":["Yo"],
		"speed":36,
		"attack":1200,
		"range":320,
		"hp":12000,
		"delay":1000,
		"level":72,
		"interaction":["What? What? WHAT?!","I don't really have much tolerance for anyone.","I follow only the most badass!"],
	},
	"holo0":{
		"name":"Green",
		"role":"citizen",
		"skin":"greengreen",
		"type":"fullstatic",
		"speed":24,
		"hp":6000,
		"delay":5000,
		"level":0,
		"says":["rbin"],
		"interaction":["rbin"],
	},
	"holo1":{
		"name":"Pink",
		"role":"citizen",
		"skin":"pinkie",
		"type":"fullstatic",
		"speed":24,
		"hp":6000,
		"delay":5000,
		"level":0,
		"says":["rbin"],
		"interaction":["rbin"],
	},
	"holo2":{
		"name":"Purple",
		"role":"citizen",
		"skin":"purpo",
		"type":"fullstatic",
		"speed":30,
		"hp":6000,
		"delay":7000,
		"level":0,
		"says":["rbin"],
		"interaction":["rbin"],
	},
	"holo3":{
		"name":"Scarf",
		"role":"citizen",
		"skin":"scarf",
		"type":"fullstatic",
		"speed":24,
		"hp":6000,
		"delay":3000,
		"level":0,
		"says":["rbin"],
		"interaction":["rbin"],
	},
	"holo4":{
		"name":"Twig",
		"role":"citizen",
		"skin":"twig",
		"type":"fullstatic",
		"speed":48,
		"hp":6000,
		"delay":24000,
		"level":0,
		"says":["rbin"],
		"interaction":["rbin"],
	},
	"holo5":{
		"name":"Bobo",
		"role":"citizen",
		"skin":"bobo",
		"type":"fullstatic",
		"speed":16,
		"hp":6000,
		"delay":8000,
		"level":0,
		"says":["rbin"],
		"interaction":["rbin"],
	},
	"princess":{
		"name":"Princess",
		"role":"citizen",
		"skin":"princess",
		"type":"fullstatic",
		"speed":24,
		"hp":6000,
		"delay":5000,
		"level":72,
		"says":["Oh, Hello!"],
		"interaction":["Wanna taste my daggers?"],
	},
	"bouncer":{
		"name":"Wogue",
		"role":"bouncer",
		"skin":"bouncer",
		"type":"fullstatic",
		"level":88,
		"says":["What?","BOUNCE"],
		"interaction":["Wanna taste my daggers? One move out of line. And you will!","Come on! One sexist word out of your mouth. Just one. Let's see what your tombstone looks like."],
	},
	"goldnpc":{
		"name":"Mr. Rich",
		"role":"gold",
		"skin":"goblin_a",
		"says":"GOLD!",
		"color":"#E0B427",
		"aspeed":"slow",
	},
	"wizardrepeater":{
		"name":"Wizard",
		"role":"repeater",
		"skin":"wizard",
		"color":"#66BB52",
		"says":"SHELLS!",
		"type":"fullstatic",
		"interval":3000,
	},
	"wnpc":{
		"name":"Wizard",
		"role":"thesearch",
		"quest":"glitch",
		"skin":"wizard",
		#"color":"#23B0AB",
		#"says":"Hmm",
		"color":"#D96643",
		"says":"Help",
		"type":"fullstatic",
	},
	"craftsman":{
		"name":"Joe",
		"role":"craftsman",
		"skin":"npcc",
		"color":"#9EACAE",
		"says":"Give it to me",
		"type":"fullstatic",
		"name":"Leo",
	},
	"items0":{
		"name":"Gabrielle",
		"role":"items",
		"pack":"items0",
		"skin":"gabrielle",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items1":{
		"name":"Gabriella",
		"role":"items",
		"pack":"items1",
		"skin":"gabrielle",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items2":{
		"name":"Ledia",
		"role":"items",
		"pack":"items2",
		"skin":"lady3",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items3":{
		"name":"Lidia",
		"role":"items",
		"pack":"items3",
		"skin":"lady3",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items4":{
		"name":"Christie",
		"role":"items",
		"pack":"items4",
		"skin":"lady4",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items5":{
		"name":"Christina",
		"role":"items",
		"pack":"items5",
		"skin":"lady4",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items6":{
		"name":"Jane",
		"role":"items",
		"pack":"items6",
		"skin":"lady2",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"items7":{
		"name":"Janet",
		"role":"items",
		"pack":"items7",
		"skin":"lady2",
		#"skin":"goblin_a",
		"color":"#E0D8A5",
		"type":"fullstatic",
	},
	"basics":{
		"role":"merchant",
		"items":[
			"helmet","shoes","gloves","pants","coat",
			"blade","claw","staff","bow","wshield",
			"wand","mace","wbasher",
		],
		"skin":"daggers",
		"says":"Blades, blades, blades",
		"atype":"flow",
		"name":"Gabriel",
	},
	"premium":{
		"old_role":"premium",
		"role":"merchant",
		"items":[
			"xpbooster","goldbooster","luckbooster",None,None,
			"xptome","offering",None,None,None,
			"qubics",None,None,None,None,
			None,None,None,None,None
			
		],
		"skin":"pflow",
		"says":"MMM",
		"atype":"flow",
		"name":"Garwyn",
	},
	"antip2w":{
		"old_role":"merchant",
		"role":"premium",
		"old_items":[
			"xpbooster","goldbooster","luckbooster",None,None,
			"xptome","offering",None,None,None,
			"qubics",None,None,None,
			
		],
		#"items":["cosmo0","cosmo1","cosmo2",None,None,"cosmo3","cosmo4"],
		"items":["cosmo0","cosmo2","cosmo3"],
		"skin":"fancyd",
		"says":"Sup",
		"type":"fullstatic",
		"name":"Mr. Dworf",
		"old_side_interaction":{"auto":True,"skin":"fancyd","message":"I'm the Anti-P2W Authority around here. Making sure all critical items can be bought with gold. Prices can fluctuate based on inflation."},
		"side_interaction":{"auto":True,"skin":"fancyd","message":"Hey there, good looking fellow. Would you be interested in looking better?"},
	},
	"armors":{
		"role":"merchant",
		"items":[
			#"helmet","shoes","gloves","pants","coat",
		],
		"skin":"armorguy",
		"says":"YESS",
		"atype":"flow",
	},
	"weapons":{
		"role":"merchant",
		"items":[
			"blade","claw","staff","bow",
		],
		"skin":"daggers",
		"says":"Blades, blades, blades",
		"atype":"flow",
		"ignore":True,
	},
	"exchange":{
		"role":"exchange",
		"skin":"magic",
		"says":"Good Luck!",
		"name":"Xyn",
	},
	"shrine":{
		"role":"shrine",
		"skin":"shrine",
		"type":"static",
	},
	"compound":{
		"role":"compound",
		"skin":"shrine2",
		"type":"static",
	},
	"newupgrade":{
		"role":"newupgrade",
		"skin":"newupgrade",
		"says":"+1",
		"atype":"flow",
		"name":"Cue",
	},
	"locksmith":{
		"role":"locksmith",
		"skin":"asoldier",
		"says":"X",
		"type":"fullstatic",
		"name":"Smith",
	},
	"scrollsmith":{
		"role":"scrollsmith",
		"skin":"bsoldier",
		"says":"X",
		"type":"fullstatic",
		"name":"Sir Bob",
	},
	"transporter":{
		"role":"transport",
		"skin":"spell",
		"says":"Woo",
		"color":"#7965C6",
		"places":{
			"winterland":1,
			"main":9,
			#"halloween":1,
			"desertland":1,
			"cyberland":0,
			"test":0,
			"d_e":0,
		},
		"name":"Alia",
	},
	"appearance":{
		"role":"cx",
		"quest":"cx",
		"skin":"zengirl",
		"says":"Now!",
		"name":"Haila",
		"color":"#D95CB4",
		"aspeed":"slow",
	},
	"lichteaser":{
		"role":"tease",
		"skin":"lichteaser",
		"type":"static",
		"says":"Soon",
		"color":"#5A1D7F",
	},
}
for i in range(8,48):
	npcs["items%d"%i]={
		"name":"X%d"%i,
		"role":"items",
		"pack":"items%d"%i,
		"skin":"mabw",
		"cx":{"head":"bwhead"},
		"color":"#E0D8A5",
		"type":"fullstatic",
	}
for npc in npcs:
	npcs[npc]["id"]=npc
