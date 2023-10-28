from config import *

shells_to_gold=multipliers["shells_to_gold"]
hp_multiplier=1 #currently the hp levels are a bit in turmoil [03/03/19]
def calculate_game_dynamics(): #I hope this will be an important function, should always stay at top [05/11/18]
	#decided to leave gold calculations at server_functions.js for now [06/11/18]
	for name in items.keys():
		current=items[name]
		# 1$ = 120 SHELLS
		# 1M = 2$ => 120 SHELLS = 500K 
		# Originally 240 SHELLS = 288K
		# Probably, 120 SHELLS = 160K = BEST - 320,000 / 120 = 1333 ~ 1375
		if current.get("cash"): current["g"]=current["cash"]*shells_to_gold #825 from 1375 [15/10/16] 1600 from 825 [22/11/16] 3200 from 1600 [16/12/16] 4800 from 3200 [08/11/17] 32000 from 4800 [03/02/18]
		if not current.get("g"):
			logging.error("%s doesn't have g!"%name)
			current["g"]=1
		if hp_multiplier!=1:
			if current.get("hp"):
				current["hp"]=round(hp_multiplier*current["hp"])
				if current.get("upgrade") and current["upgrade"].get("hp"):
					current["upgrade"]["hp"]=round(hp_multiplier*current["upgrade"]["hp"])
				if current.get("compound") and current["compound"].get("hp"):
					current["compound"]["hp"]=round(hp_multiplier*current["compound"]["hp"])

calculate_game_dynamics()

def monster_analysis(logging=None):
	if not logging: logging=globals()["logging"]
	for monster in monsters:
		current=monsters[monster]
		gold=monster_gold[monster]*drops["gold"]["base"]+monster_gold[monster]*drops["gold"]["random"]/2
		gold+=monster_gold[monster]*10*drops["gold"]["x10"]+monster_gold[monster]*50*drops["gold"]["x50"]
		logging.info("%s avg.gold: %.1f"%(monster,gold))
	for damage in [120,400,800,1600]:
		logging.info("\nfor %d damage/second in 1 hour"%damage)
		for monster in monsters:
			current=monsters[monster]
			gold=monster_gold[monster]*drops["gold"]["base"]+monster_gold[monster]*drops["gold"]["random"]/2
			gold+=monster_gold[monster]*10*drops["gold"]["x10"]+monster_gold[monster]*50*drops["gold"]["x50"]
			hits=math.ceil(current["hp"]*1.0/damage)
			kills=60.0*60/hits
			logging.info("%s kills: %.1f gold: %s xp: %s"%(monster,kills,to_pretty_num(gold*kills),to_pretty_num(current["xp"]*kills)))

def calculate_xvalue(name):
	drop_value=0
	for drop in drops[name]:
		prob=drop[0]
		name=drop[1]
		if name=="open": drop_value+=prob*calculate_xvalue(drop[2])
		elif name=="shells": drop_value+=prob*drop[2]*shells_to_gold
		else: drop_value+=items[name]["g"]
	return drop_value

def monster_analysis2(logging=None):
	if not logging: logging=globals()["logging"]
	for monster in monsters:
		current=monsters[monster]
		gold=monster_gold[monster]*drops["gold"]["base"]+monster_gold[monster]*drops["gold"]["random"]/2
		gold+=monster_gold[monster]*10*drops["gold"]["x10"]+monster_gold[monster]*50*drops["gold"]["x50"]
		mdrops=drops["monsters"].get(monster,[]); drop_value=0
		for drop in mdrops:
			prob=drop[0]
			name=drop[1]
			if name=="open": drop_value+=prob*calculate_xvalue(drop[2])
			elif name=="shells": drop_value+=prob*drop[2]*shells_to_gold
			else: drop_value+=prob*items[name]["g"]
		logging.info("%s 100*gold/hp: %s drops: %s totalgold/hp: %s"%(monster,100*gold/current["hp"],drop_value,100*(gold+drop_value)/current["hp"]))

def drop_analysis(logging=None,count=1000,only=None):
	if not logging: logging=globals()["logging"]
	for name in drops:
		try:
			if not is_array(drops[name]): continue
			if only and name!=only: continue
			current=drops[name]
			# if not current.get("e"): continue # Normally "items" was traversed instead of "drops"
			dropl=drops[name]; total=0; gold=0; loot={}
			for drop in dropl: total+=drop[0]
			for i in xrange(0,count):
				roll=random.uniform(0,total); current=0
				for drop in dropl:
					current+=drop[0]
					if roll<=current:
						if drop[1]=="open":
							if not loot.get(drop[2]): loot[drop[2]]=0
							loot[drop[2]]+=1
						else:
							if not loot.get(drop[1]): loot[drop[1]]=0
							loot[drop[1]]+=(len(drop)<3 and 1) or drop[2]
						break
			logging.info("%s drops: [x%s]"%(name,count))
			for name in loot:
				logging.info("\t%s %s"%(name,loot[name]))
			logging.info("\n")
		except:
			log_trace(logging)
			logging.info("\nAnalysis failed for %s\n"%name)

def item_value(item):
	gold=items[item["name"]]["g"]
	if item.get("q",0): gold*=item.get("q",0)
	level=item.get("level",0)
	if items[item["name"]].get("upgrade"):
		if is_sdk: level=min(level,12)
		gold*=[1,1,1.1,1.4,1.6,2,4,8,16,50,500,800,1600,20000][level]
	if items[item["name"]].get("compound"):
		if is_sdk: level=min(level,5)
		gold*=[1,3,9,27,81,243,800,3600,15000,50000][level]
	return gold

def total_xp(character):
	xp=character.xp
	for i in range(1,character.level):
		xp+=levels["%s"%i]
	return xp

def total_worth(element,characters=True):
	gold=element.info.gold
	i_list=["items"]
	for i in xrange(64): i_list.append("items%d"%i)
	for c in i_list:
		if not gf(element,c,[]): continue
		for item in gf(element,c,[]):
			if not item: continue
			gold+=item_value(item)
	if element.k(1).startswith("character|"):
		for slot in gf(element,"slots",{}):
			item=element.info.slots[slot]
			if not item: continue
			gold+=item_value(item)
	if characters:
		for c in gf(element,"characters",[]):
			character=get_by_iid("character|%s"%c["id"])
			if not character: continue
			gold+=total_worth(character)
	return gold

def log_items(element,name,logging=None):
	if type(element)==type(""): element=get_owner(element)
	logging.info("%s %s"%(element.k(1),element.name))
	i_list=["items"]
	for i in xrange(64): i_list.append("items%d"%i)
	for c in i_list:
		if not gf(element,c,[]): continue
		for item in gf(element,c,[]):
			if not item: continue
			if item["name"]==name: logging.info("STORAGE %s %s"%(c,item))
	if element.k(1).startswith("character|"):
		for slot in gf(element,"slots",{}):
			item=element.info.slots[slot]
			if not item: continue
			if item["name"]==name: logging.info("SLOT %s %s"%(element.name,item))
		if gf(element,"p") and element.info.p.get("trade_history"):
			for i in xrange(len(element.info.p["trade_history"])):
				if element.info.p["trade_history"][i][2]["name"]==name:
					logging.info("TRADE %s"%(element.info.p["trade_history"][i]))
	if not element.k(1).startswith("character|"):
		for c in gf(element,"characters",[]):
			character=get_by_iid("character|%s"%c["id"])
			if not character: continue
			log_items(character,name,logging)

def refactor_map(map):
	data=map.info.data
	if data.get("default") and type(data["default"])!=type(1):
		current=0; marked=False
		for tile in data.get("tiles",[]):
			if tile==data["default"]:
				data["default"]=current
				marked=True
			current+=1
		if not marked:
			data["tiles"].append(data["default"])
			data["default"]=len(data["tiles"])-1
	current=0
	for tile in data.get("tiles",[]):
		if type(tile[3])==type([]):
			tile.append(tile[3][1])
			tile[3]=tile[3][0]
	return data

def process_map(map):
	marked={}; last=0; current=0; new_tiles=[]; min_x=900; min_y=900; max_x=-900; max_y=-900; x_lines=[]; y_lines=[]
	data=map.info.data
	if data.get("x_lines"): data["x_lines"].sort()
	if data.get("y_lines"): data["y_lines"].sort()
	if data.get("default"): marked[data["default"]]=True
	for animation in data.get("animations",[]):
		marked[animation[0]]=True
	for animation in data.get("lights",[]):
		marked[animation[0]]=True
	for animation in data.get("nights",[]):
		marked[animation[0]]=True
	for group in data.get("groups",[]):
		for placement in group:
			if len(placement)==5 and placement[3]==placement[1] and placement[4]==placement[2]: del placement[3:]
			marked[placement[0]]=True
	for line in data.get("x_lines",[]):
		if line[1]!=line[2]: x_lines.append(line)
	#logging.info("%s / %s"%(len(data["x_lines"]),len(x_lines)))
	data["x_lines"]=x_lines
	for line in data.get("y_lines",[]):
		if line[1]!=line[2]: y_lines.append(line)
	#logging.info("%s / %s"%(len(data["y_lines"]),len(y_lines)))
	data["y_lines"]=y_lines
	for placement in data.get("placements",[]):
		marked[placement[0]]=True
		tile=data["tiles"][placement[0]]
		if len(placement)==5 and placement[3]==placement[1] and placement[4]==placement[2]: del placement[3:]
		if type(tile[3])==type([]): width,height=tile[3]
		else: width=height=tile[3]
		if placement[1]<min_x: min_x=placement[1]
		if placement[2]<min_y: min_y=placement[2]
		if len(placement)==5:
			if placement[3]+width>max_x: max_x=placement[3]+width
			if placement[4]+height>max_y: max_y=placement[4]+height
		else:
			if placement[1]+width>max_x: max_x=placement[1]+width
			if placement[2]+height>max_y: max_y=placement[2]+height
	for tile in data.get("tiles",[]):
		if not marked.has_key(current):
			logging.info("%s is unused"%current)
		else:
			marked[current]=last
			last+=1
			#logging.info("%s is %s"%(current,marked[current]))
			new_tiles.append(tile)
		current+=1
	data["tiles"]=new_tiles
	if data.get("default"): data["default"]=marked[data["default"]]
	for animation in data.get("animations",[]):
		animation[0]=marked[animation[0]]
	for animation in data.get("lights",[]):
		animation[0]=marked[animation[0]]
	for animation in data.get("nights",[]):
		animation[0]=marked[animation[0]]
	for group in data.get("groups",[]):
		for placement in group:
			placement[0]=marked[placement[0]]
	for placement in data.get("placements",[]):
		placement[0]=marked[placement[0]]
	if min_x>max_x:
		min_x=-10; max_x=10; min_y=-10; max_y=10
	data["min_x"]=min_x
	data["min_y"]=min_y
	data["max_x"]=max_x
	data["max_y"]=max_y

def render_selection(self,user,domain,level=80,server=None):
	servers=get_servers();
	if not server: server=select_server(self,user,servers);
	total=0; characters=[]; data=None
	for s in servers: total+=gf(s,"players") or 0
	if user:
		characters=get_characters(user)
		domain.characters=characters_to_client(characters)
		data=get_user_data(user);
	domain.servers=servers_to_client(domain,servers)
	if domain.is_cli and (not user or not user.cli_time or user.cli_time<datetime.now()) and level>=70:
		domain.is_cli=False; domain.harakiri=True
	start=datetime.now(); logging.info("User data in: %s"%ssince(start))
	#if domain.no_html=="bot" and self.request.get("auth"): set_cookie(self,"auth",self.request.get("auth"))
	whtml(self,"htmls/index.html",domain=domain,user=user,user_data=data,server=server,servers=servers,total=total,characters=characters)

def render_comm(self,user,domain):
	servers=get_servers(); server=select_server(self,user,servers); total=0; characters=[]; data={}
	for s in servers: total+=gf(s,"players") or 0
	domain.servers=servers_to_client(domain,servers)
	if user:
		characters=get_characters(user)
		domain.characters=characters_to_client(characters)
		data=get_user_data(user);
	whtml(self,"htmls/comm.html",domain=domain,user=user,user_data=data,server=server,servers=servers,total=total,characters=characters)

def selection_info(self,user,domain):
	servers=get_servers(); server=select_server(self,user,servers)
	return {"type":"content","html":shtml("htmls/contents/selection.html",user=user,domain=domain,server=server,servers=servers,characters=get_characters(user))}

def security_threat(self,domain):
	referer=self.request.headers.get('Referer') or self.request.headers.get('Origin') or ""
	if not referer: return False
	referer=referer.replace("http://","").replace("https://","")
	#referer="www.thegame2.com"
	logging.info(referer)
	if referer.startswith("127.0.0.1"): return False
	if referer.startswith("0.0.0.0"): return False
	if not (referer.startswith("%s.%s.%s/"%(domain.domain[0],domain.domain[1],domain.domain[2])) or referer.startswith("%s.%s/"%(domain.domain[1],domain.domain[2])) or referer=="%s.%s.%s"%(domain.domain[0],domain.domain[1],domain.domain[2]) or referer=="%s.%s"%(domain.domain[1],domain.domain[2])):
		self.response.out.write("Threat detected")
		return True
	# if is_production and domain.cf_always_on and not is_cloudflare(self):
	# 	conditional_response(self,domain,response,"cloudflare")
	# 	st_log(self,"cloudflare")
	# 	return True
	return False

def disable_email(email,logging=None):
	if not logging: logging=globals()["logging"]
	user=get_user(email=email)
	if not user: return logging.info("User not found")
	user.info.dont_send_emails=True
	user.put()
	logging.info("Disabled emails for %s"%user)

def get_user(self=None,domain=None,email=None,phrase_check=False,api_override=None):
	if email:
		try:
			email=purify_email(email)
			if phrase_check:
				mark=get_by_iid("markedphrase|email-%s"%email)
				if mark:
					user=get_by_iid("user|%s"%mark.owner)
					if user: return user
			return User.query(User.email == email).get()
		except:
			logTrace()
	elif self:
		auth=get_cookie(self,"auth") or self.request.get("auth")
		if auth:
			id,auth=auth.replace('"',"").split("-")
			get_user_data(id,async=True) #trigger the get
			user=get_by_iid("user|%s"%id)
			if user and (api_override or auth in gf(user,"auths",[])):
				return user

def character_in_transaction_routines(character,flags):
	if character.referrer and character.level>=50 and not gf(character,"rfreward_50"):
		character.info.rfreward_50=datetime.now()
		flags.rf50=character.referrer
	if character.referrer and character.level>=60 and not gf(character,"rfreward_60"):
		character.info.rfreward_60=datetime.now()
		flags.rf60=character.referrer
	if character.referrer and character.level>=70 and not gf(character,"rfreward_70"):
		character.info.rfreward_70=datetime.now()
		flags.rf60=character.referrer

def handle_character_flags(flags):
	if getattr(flags,"rf50"): pass

def send_verification_email(domain,user):
	url="%s/ev/%s/%s"%(domain.base_url,user.k(),user.info.everification)
	send_email(domain,user.info.email,html=shtml("htmls/email.html",purpose="verification",url=url,domain=domain,user=user),title="Welcome to %s! Verification Link + Early Game Suggestions Inside"%game_name,text="To Verify Your Email: %s"%url)

def send_password_reminder_email(domain,user):
	url="%s/reset/%s/%s"%(domain.base_url,user.k(),user.info.password_key)
	send_email(domain,user.info.email,html=shtml("htmls/email.html",purpose="password",domain=domain,url=url),title="Password Reminder from %s"%game_name,text="To reset your password, please visit: %s"%url)

def is_in_game(character):
	return character.server and hsince(character.last_sync)<=4 # 5 hours seem logical - instead of 18 hours
	return character.server and msince(character.last_sync)<12

def ip_in_range(ip,net):
	try:
		ipaddr = int(''.join([ '%02x' % int(x) for x in ip.split('.') ]), 16)
		netstr, bits = net.split('/')
		netaddr = int(''.join([ '%02x' % int(x) for x in netstr.split('.') ]), 16)
		mask = (0xffffffff << (32 - int(bits))) & 0xffffffff
		return (ipaddr & mask) == (netaddr & mask)
	except:
		log_trace()
		return False

def get_ip(self):
	ip=self.request.remote_addr
	cloudflare_ip=self.request.headers.get("CF-Connecting-IP")
	cloudflare_ranges=[
		'103.21.244.0/22',
		'103.22.200.0/22',
		'103.31.4.0/22',
		'104.16.0.0/12',
		'108.162.192.0/18',
		'131.0.72.0/22',
		'141.101.64.0/18',
		'162.158.0.0/15',
		'172.64.0.0/13',
		'173.245.48.0/20',
		'188.114.96.0/20',
		'190.93.240.0/20',
		'197.234.240.0/22',
		'198.41.128.0/17',
		]
	cloudflare_ranges_v6=[
		'2400:cb00::/32',
		'2405:b500::/32',
		'2606:4700::/32',
		'2803:f800::/32',
		'2c0f:f248::/32',
		'2a06:98c0::/29',
		]
	if cloudflare_ip:
		for crange in cloudflare_ranges:
			if ip.find(":")==-1 and ip_in_range(ip,crange): return cloudflare_ip
		for crange in cloudflare_ranges_v6:
			if ip.find(":")!=-1 and ip.startswith(crange[:7]): return cloudflare_ip #not sure 9 or 7 [25/08/13]
	return self.request.remote_addr

def get_country(self):
	return self.request.headers.get("Cf-Ipcountry") or self.request.headers.get("X-Appengine-Country") or "XX"

def get_character(id,phrase_check=False):
	if id.isdigit() and get_by_iid("character|%s"%id): return get_by_iid("character|%s"%id)
	else:
		id=simplify_name(id)
		if phrase_check:
			mark=get_by_iid("markedphrase|character-%s"%id)
			if mark:
				character=get_by_iid("character|%s"%mark.owner)
				if character: return character
		return Character.query(Character.name == id).get()

def get_owner(name):
	char=get_character(name)
	if char: return get_by_iid("user|%s"%char.owner)

def process_user_data(user,data):
	if hasattr(user,"k"): user=user.k()
	if not data: data=InfoElement(key=ndb.Key(InfoElement,"userdata-%s"%user),info=GG())
	if not gf(data,"completed_tasks"): data.info.completed_tasks=[] #completed tutorial tasks
	if not gf(data,"tutorial_step"): data.info.tutorial_step=0 #tutorial step
	calculate_tutorial_step(data)
	return data

def get_user_data(user,async=False):
	if hasattr(user,"k"): user=user.k()
	if async:
		return get_by_iid_async("infoelement|userdata-%s"%user)
	else:
		data=get_by_iid("infoelement|userdata-%s"%user)
		data=process_user_data(user,data)
		return data

def delete_user_data(user):
	if hasattr(user,"k"): user=user.k()
	ndb.Key(InfoElement,"userdata-%s"%user).delete()

def reset_tutorial(user):
	data=get_user_data(user,async=False)
	data.info.completed_tasks=[] #completed tutorial tasks
	data.info.tutorial_step=0 #tutorial step
	data.put()
	return data

def add_ip_exception(ip_a,limit=0,explanation=""):
	limit=max(1,min(limit,10))
	if limit==1: return remove_ip_exception(ip_a)
	ip=get_ip_info(ip_a)
	ip.info.limit=limit
	if not ip.random_id: ip.random_id=randomStr(20)
	ip.exception=True
	ip.last_exception=datetime.now()
	ip.info.explanation=explanation or "No Explanation Exception"
	ip.put()

def remove_ip_exception(ip_a):
	ip=get_ip_info(ip_a)
	ip.info.limit=1
	ip.exception=False
	ip.put()

def get_ip_info(ip):
	if type(ip) not in types.StringTypes: ip=get_ip(ip)
	info=get_by_iid("ip|%s"%ip)
	if not info: info=IP(key=ndb.Key(IP,ip),info=cGG(users=[],characters=[],metrics={},last_decay=datetime.now()))
	decay_ip_info(info)
	return info

def decay_ip_info(ip):
	hours=hsince(ip.info.last_decay)
	if hours>12:
		r=hours/24.0
		for k in dir(ip.info):
			if k.startswith("limit_"):
				if k=="limit_signups": r/=1.2
				setattr(ip.info,k,getattr(ip.info,k)-r)
				if getattr(ip.info,k)<0: setattr(ip.info,k,0)
		ip.info.last_decay=datetime.now()

def put_ip_info(ip,user=None,character=None):
	if user and (user.k() not in ip.info.users): ip.info.users.append(user.k())
	if character and (character.k() not in ip.info.characters): ip.info.characters.append(character.k())
	if len(ip.info.users)>100: ip.info.users=ip.info.users[1:]
	if len(ip.info.characters)>100: ip.info.characters=ip.info.characters[1:]
	ip.users=ip.info.users; ip.characters=ip.info.characters
	ip.put_async()

def characters_to_client(characters_data):
	characters=[]
	for character in characters_data:
		characters.append(character_to_dict(character))
	characters.sort(key=(lambda x: x["online"]),reverse=True)
	return characters

def servers_to_client(domain,servers_data):
	servers=[]
	for server in servers_data:
		servers.append({"name":server.name,"region":server.region,"players":server.info.players,"key":server.k(),"addr":domain.https and server.ip or server.actual_ip,"port":server.port})
	return servers

def get_characters(user,async=False):
	characters=[]
	for c in user.info.characters:
		characters.append(get_by_iid_async("character|%s"%c["id"]))
	if async: return characters
	for i in xrange(len(characters)):
		characters[i]=characters[i].get_result()
	return characters

def get_stats(characters):
	stats={"monsters":{}}
	for character in characters:
		monsters=gf(character,"p",{}).get("stats",{}).get("monsters",{})
		monsters_diff=gf(character,"p",{}).get("stats",{}).get("monsters_diff",{})
		for id in monsters:
			if monsters[id]+monsters_diff.get(id,0)>stats["monsters"].get(id,[0,0])[0]:
				stats["monsters"][id]=[monsters[id]+monsters_diff.get(id,0),character.info.name]
	return stats

def character_to_dict(character):
	data={"id":character.k(),"name":character.info.name,"level":character.level,"type":character.type,"online":0}
	if character.online:
		data["online"]=mssince(character.last_online)
		data["server"]=character.server
		data["secret"]=gf(character,"secret","12")
	if gf(character,"rip"):
		data["rip"]=character.info.rip
	data["skin"]=character.info.skin
	data["cx"]=gf(character,"cx",{})
	data["in"]=gf(character,"in",character.info.map)
	data["map"]=character.info.map
	data["x"]=character.info.x
	data["y"]=character.info.y
	if gf(character,"p") and character.info.p.has_key("home"):
		data["home"]=character.info.p["home"]

	return data

def update_user_data(user,data):
	user.info.gold=data["gold"]
	user.info.rewards=data.get("rewards",[])
	user.info.unlocked=data.get("unlocked",{})
	user.info.items0=data["items0"]
	user.info.items1=data["items1"]
	user.info.last_sync=datetime.now()
	for i in range(2,48):
		setattr(user.info,"items%d"%i,data.get("items%d"%i,False))

def user_to_server(user):
	info={
		"gold":gf(user,"gold",1000),
		"rewards":gf(user,"rewards",[]),
		"unlocked":gf(user,"unlocked",{}),
		"items0":gf(user,"items0",[]),
		"items1":gf(user,"items1",[]),
	}
	for i in range(2,48):
		info["items%d"%i]=gf(user,"items%d"%i,False)
	return info

def guild_to_info(guild):
	return {
		"id":guild.k(),
		"name":guild.name,
		"short":guild.short}

def update_character(character,data,owner):
	character.info.x=data["x"]
	character.info.y=data["y"]
	character.info.s=data["s"]
	character.info.q=data.get("q",{})
	#character.info.c=data["c"]
	character.info.map=data["map"]
	setattr(character.info,"in",data["in"])
	character.xp=int(data["xp"] or 0)
	character.level=int(data["level"])
	character.info.hp=data["hp"]
	character.info.mp=data["mp"]
	character.info.gold=data["gold"]
	character.info.items=data["items"]
	character.info.slots=data["slots"]
	#character.info.trades=data.get("trades")
	character.info.rip=data.get("rip")
	if data.get("p",0): character.info.p=data.get("p")
	character.info.skin=data.get("skin")
	character.info.cx=data.get("cx",{})
	character.info.afk=data.get("afk")
	character.private=data.get("private")
	character.info.owner_name=owner.name

def update_pids(character,data,owner):
	fresh=False; platform="web"; pid=""
	steam_id=data.get("p",0) and data["p"].get("steam_id","")
	mas_auth_id=data.get("p",0) and data["p"].get("mas_auth_id","")
	if data.get("p",0) and data["p"].get("platform","")=="steam" and steam_id:
		fresh=True
		platform="steam"
		pid=steam_id
	if data.get("p",0) and data["p"].get("platform","")=="mas" and mas_auth_id:
		fresh=True
		platform="steam"
		pid=mas_auth_id

	if steam_id:
		character.platform="steam"
		character.pid=steam_id
	elif mas_auth_id:
		character.platform="mas"
		character.pid=mas_auth_id

	if fresh and (owner.platform!=platform or owner.pid!=pid): #there's a chance that a player both have mas and steam accounts, so steam priority logic might be good here [03/05/19]
		user=get_by_iid(owner.k('i'))
		user.platform=platform
		user.pid=pid
		user.put()
		logging.info("costly operation - changed user platform/pid - %s"%user.k())
	elif not fresh and steam_id and not owner.pid:
		user=get_by_iid(owner.k('i'))
		user.platform="steam"
		user.pid=steam_id
		user.put()
		logging.info("costly operation - set steam user platform/pid - %s"%user.k())
	elif not fresh and mas_auth_id and not owner.pid:
		user=get_by_iid(owner.k('i'))
		user.platform="mas"
		user.pid=mas_auth_id
		user.put()
		logging.info("costly operation - set mas user platform/pid - %s"%user.k())
	elif not fresh and (owner.platform!=character.platform or owner.pid!=character.pid):
		character.platform=owner.platform
		character.pid=owner.pid

def character_to_info(character,user=None,ip=None,guild=None):
	drm=False
	drm_fail=False
	if user and user.created>datetime(2019,02,01,0,0) and not gf(user,"legacy_override"): drm=True
	if gf(user,"drm_fail_pid","not")==character.pid: drm_fail=True
	info={
		"id":character.k(),
		"name":character.info.name,
		"friends":character.friends,
		"level":character.level,
		#"gender":character.info.gender,
		"gold":character.info.gold,
		"type":character.type,
		"xp":character.xp,
		"items":character.info.items,
		"stats":character.info.stats,
		"slots":gf(character,"slots",{}),
		"skin":character.info.skin,
		"cx":gf(character,"cx",[]),
		"platform":character.platform,
		"pid":character.pid or user and user.pid,
		"drm":drm,
		"drm_fail":drm_fail,
		"x":character.info.x,
		"y":character.info.y,
		"map":character.info.map,
		"owner":character.owner,
		"private":character.private,
		"created":int(time.mktime(character.created.timetuple()))*1000,
		"hp":gf(character,"hp",0),
		"mp":gf(character,"mp",0),
		"afk":gf(character,"afk",0),
		"s":gf(character,"s",{}),
		"c":gf(character,"c",{}),
		"q":gf(character,"q",{}),
		#"trades":gf(character,"trades",0),
		"rip":gf(character,"rip",0),
		"p":gf(character,"p",{"dt":{}}) or {"dt":{}}, #or is to fix the temporary, pre-server update glitch [12/09/16]
		}
	if guild:
		info["guild"]=guild_to_info(guild)
	if ip and ip.exception:
		info["ipx"]=ip.info.limit
	if user:
		info["cash"]=user.cash
		info["verified"]=gf(user,"verified",0)
	return info

def character_emit(character,method,data):
	if character.server:
		server=get_by_iid("server|%s"%character.server)
		if server: server_eval_safe(server,"var p=players[name_to_id['%s']]; if(p) p.socket.emit('%s',data);"%(character.info.name,method),data=data)

def character_eval(character,code,data={}):
	if character.server:
		server=get_by_iid("server|%s"%character.server)
		if server: server_eval_safe(server,"var player=players[name_to_id['%s']]; if(player) { %s; }"%(character.info.name,code),data=data)

def notify_friends(character,server_name):
	server_list={}
	servers=get_servers()
	online=Character.query(Character.friends == character.owner,Character.online == True)
	for friend in online:
		if not friend.server: continue
		server_list[friend.server]=server_list.get(friend.server,[])
		server_list[friend.server].append(friend.info.name)
	for server in servers:
		if server_list.get(server.k()):
			server_eval(server,"notify_friends(data)",data={"list":server_list[server.k()],"name":character.info.name,"server":server_name})

def update_characters(user,reason=None,name=None,shells=0):
	def set_friends():
		c=get_by_iid(character.k('i'))
		c.friends=user.friends
		c.put()
	for character in Character.query(Character.online==True,Character.owner==user.k()):
		if character.server:
			try:
				server=get_by_iid("server|%s"%character.server)
				ip=server.actual_ip
				if is_sdk: ip="0.0.0.0"
				if not reason:
					fetch_url("http://%s:%s"%(ip,server.port),aevent="cupdate",spass=secrets.SERVER_MASTER,cash=user.cash,id=character.info.name,ncash=shells)
				elif reason=="friends":
					try: ndb.transaction(set_friends,xg=True,retries=0)
					except: log_trace_i()
					fetch_url("http://%s:%s"%(ip,server.port),aevent="new_friend",spass=secrets.SERVER_MASTER,name=name,friends=user.friends,id=character.info.name)
				elif reason=="not_friends":
					try: ndb.transaction(set_friends,xg=True,retries=0)
					except: log_trace_i()
					fetch_url("http://%s:%s"%(ip,server.port),aevent="lost_friend",spass=secrets.SERVER_MASTER,name=name,friends=user.friends,id=character.info.name)
					#character_emit(character,"friend",{"event":"update","friends":user.friends})
			except: log_trace()

def send_system_mail(user,subject,message,type=None,info=None):
	if not type: type="system"
	if not hasattr(user,"k"): user=get_by_iid("user|%s"%user)
	mail=Mail(fro="0",to=user.info.name,type=type,owner=["0",user.k()],info=cGG(message=message,subject=subject,sender="0",receiver=user.k()))
	mail.put()
	user_data=get_user_data(user)
	user_data.info.mail=max(0,gf(user_data,"mail",0)-1)
	user_data.put()

def pretty_timeleft(t):
	left=""
	minutes=int((t-datetime.now()).seconds/60.0)
	days=(t-datetime.now()).days
	if days:
		left="%d days"%days
	if minutes>60:
		left=left+" %d hours"%(int(minutes/60))
		minutes=minutes%(60)
	left=left+" %d minutes"%minutes
	return left

def gdpr_delete(self,user,logging=None):
	from api import delete_character_api
	if not logging: logging=globals()["logging"]
	if not hasattr(user,"k"): user=get_user(email=user)
	for c in gf(user,"characters",[]):
		user.info.last_delete=really_old
		delete_character_api(user=user,self=self,domain=gdi(self),name=c["name"])
		logging.info("Deleted %s"%c["name"])
	markedphrase=get_by_iid("markedphrase|%s"%dgt("email",user.info.email))
	if markedphrase: markedphrase.key.delete()
	user.key.delete()
	logging.info("Deleted %s"%user.info.email)

def block_account(name,days,reason="",toggle=False):
	character=get_character(name)
	if not character: return "no character"
	owner=get_by_iid("user|%s"%character.owner)
	if not owner: return "no owner"
	if toggle and gf(owner,"blocked_until") and owner.info.blocked_until>datetime.now(): days=-1
	if days<=0:
		owner.info.blocked_until=really_old
		owner.put()
		return "un-blocked %s"%owner.k()
	else:
		owner.info.blocked_until=datetime.now()+timedelta(seconds=int(days*24*60*60))
		owner.info.blocked_reason=reason
		owner.banned=True
		owner.put()
		servers=get_servers()
		for server in servers:
			server_eval(server,"for(var id in players) { if(players[id].owner=='%s') { players[id].socket.emit('disconnect_reason','blocked'); players[id].socket.disconnect(); } }"%owner.k())
		return "blocked %s for %s days"%(owner.k(),days)

def servers_eval(code,data={}):
	servers=get_servers()
	for server in servers:
		server_eval_safe(server,code,data=data)

def chat_analysis(name,logging=None):
	for m in Message.query(Message.author==get_owner("orlyowl").k()).order(-Message.created).fetch(100):
		logging.info("%s - %s"%(m.created,m.info.message))

def growth_analysis(name,logging=None,days=50,offset=0):
	if not logging: logging=globals()["logging"]
	owner=get_owner(name); owner_ki=owner.k('i')
	latest={}; last_gold=total_worth(owner,characters=False); last_pgold=owner.info.gold; last_xp=0
	logging.info("")
	logging.info("USER Gold: %s Cash: %s"%(to_pretty_num(owner.info.gold),to_pretty_num(owner.cash)))
	for character in Character.query(Character.owner == ""+owner.k()):
		#logging.info("%s[%s] %s"%(character.info.name,character.level,to_pretty_num(character.info.gold)))
		latest[character.k('i')]=character
		last_xp+=total_xp(character)
		last_gold+=total_worth(character)
		last_pgold+=character.info.gold
	logging.info("TODAY GOLD %s XP %s"%(to_pretty_num(last_gold),to_pretty_num(last_xp)))
	for i in range(1,days):
		cut_off=datetime.now()-timedelta(days=i+offset)
		b=Backup.query(Backup.backup_item_id==owner_ki).filter(Backup.backup_created <= cut_off).order(-Backup.backup_created).get()
		if b and (cut_off-b.backup_created).days*24+(cut_off-b.backup_created).seconds/3600<=24: owner=b
		c_xp=0; c_gold=total_worth(owner,characters=False); c_pgold=owner.info.gold
		for n in latest:
			ch=latest[n]
			c=Backup.query(Backup.backup_item_id==n).filter(Backup.backup_created <= cut_off).order(-Backup.backup_created).get()
			if c and (cut_off-c.backup_created).days*24+(cut_off-c.backup_created).seconds/3600<=24:
				latest[n]=c
				ch=c
			c_xp+=total_xp(ch)
			c_gold+=total_worth(ch)
			c_pgold+=ch.info.gold
		logging.info("D[%s] GOLD %s PURE GOLD %s XP %s"%(offset+i,to_pretty_num(last_gold-c_gold),to_pretty_num(last_pgold-c_pgold),to_pretty_num(last_xp-c_xp)))
		last_xp=c_xp
		last_gold=c_gold
		last_pgold=c_pgold



def character_analysis(name,logging=None):
	if not logging: logging=globals()["logging"]
	character=get_character(name)
	servers=get_servers(); players=[]; ip=""; owners=[character.owner]
	for server in servers:
		cip=server_eval(server,"var cip=''; for(var id in players) { var player=players[id]; if(player.name!='%s') continue; cip=get_ip(player); }; output=cip;"%name)
		if cip: ip=cip
	for server in servers:
		splayers=server_eval(server,"var list=[]; for(var id in players) { var player=players[id]; if(get_ip(player)!='%s') continue; list.push({owner:player.owner,name:player.name,ip:get_ip(player),server:region+' '+server_name,type:player.type,level:player.level,age:player.age,cgold:player.t.cgold,dgold:player.t.dgold,txp:player.t.xp,minutes:msince(player.t.start),dps:player.t.mdamage/ssince(player.t.start),gps:(player.t.cgold+player.t.dgold)/ssince(player.t.start),xps:player.t.xp/ssince(player.t.start)}); }; output=list;"%ip)
		for player in splayers:
			if player["owner"] not in owners:
				owners.append(player["owner"])
				logging.info("Secondary owner: %s"%player["owner"])
			players.append(player)
	for player in players:
		logging.info(player)

	l=[]
	for owner in owners:
		oos={}
		tos={}
		froms={}
		owner=get_by_iid("user|"+owner)
		logging.info("")
		logging.info("USER Gold: %s Cash: %s"%(to_pretty_num(owner.info.gold),to_pretty_num(owner.cash)))
		if owner.platform=="steam":
			result=fetch_url_async("https://partner.steam-api.com/ISteamUser/CheckAppOwnership/v2/",use_get=True,key=steam_publisher_web_apikey,appid="777150",steamid=owner.pid).get_result()
			if result.content.find('"ownsapp":true')!=-1:
				logging.info("Steam ownership: YES")
			else:
				logging.info(result.content)
		l.append(owner)
		l.append(get_user_data(owner))
		names={}
		characters=Character.query(Character.owner == ""+owner.k()).fetch(100)
		for character in characters: names[character.info.name]=True

		i_list=[]
		for i in xrange(64): i_list.append("items%d"%i)
		for c in i_list:
			if not gf(owner,c,[]): continue
			for item in gf(owner,c,[]):
				if not item: continue
				oo=None
				if item.get("gf") and item["gf"] not in names:
					oo=item["gf"]
				elif item.get("o") and item["o"] not in names:
					oo=item["o"]
				elif item.get("oo") and item["oo"] not in names:
					oo=item["oo"]
				if oo:
					logging.info(item)
					oos[oo]=[oos.get(oo,[0,0])[0]+1,oos.get(oo,[0,0])[1]+item_value(item)]

		for character in characters:
			l.append(character)

			for item in gf(character,"items",[]):
				if not item: continue
				oo=None
				if item.get("gf") and item["gf"] not in names:
					oo=item["gf"]
				elif item.get("o") and item["o"] not in names:
					oo=item["o"]
				elif item.get("oo") and item["oo"] not in names:
					oo=item["oo"]
				if oo:
					logging.info(item)
					oos[oo]=[oos.get(oo,[0,0])[0]+1,oos.get(oo,[0,0])[1]+item_value(item)]

			for slot in gf(character,"slots",{}):
				item=character.info.slots[slot]
				if not item: continue
				oo=None
				if item.get("gf") and item["gf"] not in names:
					oo=item["gf"]
				elif item.get("o") and item["o"] not in names:
					oo=item["o"]
				elif item.get("oo") and item["oo"] not in names:
					oo=item["oo"]
				if oo:
					logging.info(item)
					oos[oo]=[oos.get(oo,[0,0])[0]+1,oos.get(oo,[0,0])[1]+item_value(item)]

			logging.info("%s[%s] %s"%(character.info.name,character.level,to_pretty_num(character.info.gold)))
			for h in gf(character,"p",{}).get("history",[]):
				if h.get("from") and not names.has_key(h.get("from")):
					e=froms.get(h["from"],[0,0])
					e[0]+=1
					e[1]+=h.get("amount",0) or h.get("item","") and item_value({"name":h["item"],"level":h.get("level",0)}) or 0
					froms[h["from"]]=e
				if h.get("to") and not names.has_key(h.get("to")):
					e=tos.get(h["to"],[0,0])
					e[0]+=1
					e[1]+=h.get("amount",0) or h.get("item","") and item_value({"name":h["item"],"level":h.get("level",0)}) or 0
					tos[h["to"]]=e
		logging.info("OOS:")
		logging.info(oos)
		logging.info("FROMS:")
		logging.info(froms)
		logging.info("TOS:")
		logging.info(tos)
	return l

def game_analysis(logging=None):
	if not logging: logging=globals()["logging"]
	servers=get_servers(True); players=[]; ips={}
	for server in servers:
		try:
			splayers=server_eval(server,"var list=[]; for(var id in players) { var player=players[id]; list.push({owner:player.owner,name:player.name,ip:get_ip(player),type:player.type,level:player.level,age:player.age,map:player.map,gold:to_pretty_num(player.gold),server:region+' '+server_name,dps:player.t.mdamage/ssince(player.t.start),gps:(player.t.cgold+player.t.dgold)/ssince(player.t.start),xps:player.t.xp/ssince(player.t.start)}); }; output=list;")
			for player in splayers:
				#player["pvp"]=gf(server,"pvp")
				player["server"]="%s %s"%(server.region,server.name)
				players.append(player)
		except:
			log_trace_i()
	for player in players:
		if not ips.get(player["ip"]): ips[player["ip"]]=[]
		ips[player["ip"]].append(player)

	for server in servers:
		logging.info("%s %s - Gold: %s"%(server.region,server.name,to_pretty_num(gf(server,"data",{}).get("gold",0))))
	logging.info("")

	for ip in ips:
		logging.info("")
		owners=[]; dps=0.0001; gps=0
		for player in ips[ip]:
			if player["owner"] not in owners: owners.append(player["owner"])
		if len(owners)>1: logging.info("MULTIPLE PLAYERS FROM ONE IP")
		for player in ips[ip]:
			logging.info(player)
			dps+=player.get("dps",0)
			gps+=player.get("gps",0)
		logging.info("GPS / DPS: %s"%(gps/dps))

def enforce_limitations():
	servers=get_servers()
	players=[]; ips={}; mips={}; owners={}; mowners={}; ipx={}; ip_type={}

	to_ipdisconnect=[]; to_ownerdisconnect=[]; to_authdisconnect=[]

	for server in servers:
		if server.gameplay!="normal": continue
		try:
			splayers=server_eval(server,"var list=[]; for(var id in players) { var player=players[id]; list.push({owner:player.owner,name:player.name,ip:get_ip(player),type:player.type,bot:player.bot||'',free:player.p.free||player.s.licenced||player.role=='gm',ipx:player.ipx||1,temp_auth:player.temp_auth||'',auth_id:player.auth_id||''}); }; output=list;")
			for player in splayers:
				player["pvp"]=gf(server,"pvp")
				players.append(player)
			server.players=splayers
			#time.sleep(1) #best not to sleep here, otherwise a server change counts +1 [10/12/17]
		except:
			log_trace_i()
	#logging.info(players)
	for player in players: #count loop
		ip_type[player["ip"]]="real"
		if player["free"]: continue #the bot limitations should be enforced at launch - or re-visited later on [03/08/17]

		if player["auth_id"]:
			if player["type"]!="merchant":
				ips[player["ip"]]=ips.get(player["ip"],0)+1 #so steam/mas logins don't allow separate IP logins
			else:
				mips[player["ip"]]=mips.get(player["ip"],0)+1
			player["ip"]=player["auth_id"]
			player["ipx"]=1
			ip_type[player["ip"]]="auth"
		if player["temp_auth"]:
			if player["type"]!="merchant":
				ips[player["ip"]]=ips.get(player["ip"],0)+1 #so temporary mas logins don't allow separate IP logins
			else:
				mips[player["ip"]]=mips.get(player["ip"],0)+1
			player["ip"]=player.owner
			player["ipx"]=1
			ip_type[player["ip"]]="owner"

		ipx[player["ip"]]=max(ipx.get(player["ip"],0),player["ipx"])
		
		if player["type"]=="merchant":
			mowners[player["owner"]]=mowners.get(player["owner"],0)+1
			mips[player["ip"]]=mips.get(player["ip"],0)+1
		else:
			owners[player["owner"]]=owners.get(player["owner"],0)+1
			ips[player["ip"]]=ips.get(player["ip"],0)+1 #for 1+1+1, it makes more sense to use a global 2-ip limit

	#this new enforce loop handles every player individually, much simpler than previous ip/owner/auth loops [12/05/19]
	for server in servers: #enforce loop
		if server.gameplay!="normal": continue
		to_disconnect=[]
		for player in server.players:
			logging.info(player["name"])
			if player["free"]: continue
			#if player["type"]=="merchant": logging.info("%s mips %s mowners %s - ipx %s"%(player["ip"],mips[player["ip"]],mowners[player["owner"]],ipx[player["ip"]]))
			if player["type"]=="merchant" and (mips[player["ip"]]>1 or mowners[player["owner"]]>1) and player["name"] not in to_disconnect:
				to_disconnect.append(player["name"])
				continue
			if player["type"]!="merchant" and (ips[player["ip"]]>3*ipx[player["ip"]] or owners[player["owner"]]>3) and player["name"] not in to_disconnect:
				to_disconnect.append(player["name"])
				continue

		if len(to_disconnect):
			server_eval(server,"%s.forEach(function(name){ var player=get_player(name); if(!player) return; player.socket.emit('disconnect_reason','limits'); player.socket.disconnect(); });"%json.dumps(to_disconnect))
			time.sleep(1)
		del server.players

def verify_steam_installs():
	logging.info("verify_steam_installs")
	owners=[]; bans=[]; checks={}
	for c in Character.query(Character.platform=="steam").order(-Character.last_online).fetch(1000):
		if hsince(c.last_online)>=4: break
		if c.owner not in owners:
			owners.append(c.owner)
			checks[c.owner]=fetch_url_async("https://partner.steam-api.com/ISteamUser/CheckAppOwnership/v2/",use_get=True,key=steam_publisher_web_apikey,appid="777150",steamid=c.pid)
	for id in checks:
		try:
			result=checks[id].get_result()
			if result.content.find('"ownsapp":true')!=-1:
				logging.info("%s yes!"%id)
			elif result.content.find('"ownsapp":false')!=-1:
				logging.error("%s no!"%id)
			else:
				logging.error("%s Unhandled output %s"%(id,result.content))
		except:
			log_trace()



def server_eval(server,code,data={}):
	ip=server.actual_ip
	if is_sdk: ip="0.0.0.0"
	return json.loads(fetch_url("http://%s:%s"%(ip,server.port),aevent="eval",spass=secrets.SERVER_MASTER,code=code.replace("+","%2B"),data=json.dumps(data).replace("+","%2B")))

def server_eval_safe(server,code,data={}):
	try:
		ip=server.actual_ip
		if is_sdk: ip="0.0.0.0"
		return json.loads(fetch_url("http://%s:%s"%(ip,server.port),aevent="eval",spass=secrets.SERVER_MASTER,code=code.replace("+","%2B"),data=json.dumps(data).replace("+","%2B")))
	except:
		log_trace()
		return None

def reward_referrer_logic(user):
	if user.referrer and user.platform in ["steam","mas"] and not gf(user,"reward") and user.pid:
		def reward_transaction():
			entity=get_by_iid(user.k('i'))
			if not gf(entity,"reward"):
				entity.info.reward=True
				entity.put()
				return True
			return False

		if ndb.transaction(reward_transaction,xg=True,retries=0):
			deferred.defer(add_cash,user.referrer,200,rcash=True,rreward=user.k())

def add_referred(referrer,user,selfic=None):
	referrer=get_by_iid("user|%s"%referrer)
	user=get_by_iid("user|%s"%user)
	def add_referred_transaction():
		a=get_by_iid(referrer.k('i'))
		
		a.put()
	ndb.transaction(add_referred_transaction,xg=True,retries=0)

def add_referrer_manually(referred_email,referrers_email,logging=None):
	if not logging: logging=globals()["logging"]
	a=get_user(email=referred_email)
	if not a: return logging.info("Referred doesn't exit!")
	b=get_user(email=referrers_email)
	if not b: return logging.info("Referrer doesn't exist!")
	if a.created<b.created: return logging.info("Referred came earlier than referrer!")
	if a.referrer:
		if a.referrer!="%s"%b.k(): return logging.info("Referred has been referred by someone else!")
		else: return logging.info("Already referred")
	a.referrer="%s"%b.k()
	a.put()
	reward_referrer_logic(a)
	logging.info("Done!")
	

def add_sales_bonus(amount):
	user=get_by_iid("user|%s"%get_character("Oragon").owner)
	def add_bonus_transaction():
		owner=get_by_iid(user.k('i'))
		owner.info.sales=True
		owner.info.sales_bonus=gf(owner,"sales_bonus",0)+amount
		owner.put()
	user=ndb.transaction(add_bonus_transaction,xg=True,retries=100)

def add_cash(uid,cash,referrer=False,only_referrer=False,rcash=False,rreward=False):
	if hasattr(uid,"k"): user=uid
	else: user=get_by_iid("user|%s"%uid)
	if not user: return logging.warning("NO USER AT add_cash %s"%uid)
	referred=None
	if rreward:
		referred=get_by_iid("user|%s"%rreward)
		if not referred:
			logging.error("rreward user|%s was missing"%rreward);
			return
	if rreward and get_by_iid("infoelement|rrewardmark-%s"%referred.pid):
		ecode="rreward user|%s triggered the re-reward routine, pid: %s"%(rreward,referred.pid)
		logging.error(ecode)
		send_email(gdi(),"kaansoral@gmail.com",html=ecode,title="REFERRER CHEAT DETECTED")
		return
	if rreward:
		add_event(user,"referred",["referrer"],selfic=[],info=cGG(message="%s referred %s %s"%(user.name,referred.name,referred.info.email),id=referred.k()),rowner=user.k())
		send_email(gdi(),"kaansoral@gmail.com",html="%s to %s"%(rreward,user.k()),title="REFERRER REWARD %s to %s"%(referred.name,user.name))
	referrer=True #cash items can never be converted back to cash with this in place [20/11/18]
	if not only_referrer:
		def add_cash_transaction():
			owner=get_by_iid(user.k('i'))
			if rreward:
				owner.info.referred=gf(owner,"referred",0)+1
				owner.info.referrer_events=gf(owner,"referrer_events",0)+1

				mail=Mail(fro="mainframe",to=owner.name,type="system",owner=[owner.k()],info=cGG(subject="A Friend Token!",message="For inviting %s to Adventure Land!"%referred.name,sender="!",receiver=owner.k()),key=ndb.Key(Mail,"%s-rewards-%s"%(referred.k(),owner.k())))
				mail.item=True
				mail.info.item=json.dumps({"name":"friendtoken","q":1});
				mail.taken=False
				mail.put()

				ud=get_user_data(owner)
				ud=process_user_data(owner,ud)
				ud.info.mail=gf(ud,"mail",0)+1
				ud.put()
			if rcash:
				owner.info.rcash=gf(owner,"rcash",0)+int(cash)
				owner.info.referrer_events=gf(owner,"referrer_events",0)+1
			owner.cash+=int(cash)
			owner.put()
			return owner
		user=ndb.transaction(add_cash_transaction,xg=True,retries=100)
	if user:
		try:
			if only_referrer: update_characters(user,shells=cash)
			else: deferred.defer(update_characters,user,shells=cash)
		except: log_trace()
		try:
			if referrer and user.referrer and int(cash)>=20:
				referrer=get_by_iid("user|%s"%user.referrer)
				if referrer:
					add_event(referrer,"referrer_cash",["cashflow","referrer"],info=cGG(message="Referrer: %s received %s shells from %s[%s]"%(referrer.name,int(round(cash*0.10)),user.name,user.k()),source=user.k()))
					add_cash(referrer,int(round(cash*0.10)),rcash=True)
		except: log_trace()
		try:
			if rreward:
				InfoElement(key=ndb.Key(InfoElement,"rrewardmark-%s"%referred.pid),info=GG()).put()
				logging.info("RREWARD EVENT %s"%rreward)
				add_event(user,"referrer_reward",["cashflow","referrer"],info=cGG(message="Referrer: %s received %s reward shells from %s[%s]"%(user.name,200,referred.name,referred.k()),source=referred.k()))
		except: log_trace()
		return 1
	else:
		raise "WTF"

def get_characters_old(user):
	keys=[]
	for c in gf(user,"characters",[]):
		keys.append(ndb.Key(Character,to_id(c["id"])))
	return ndb.get_multi(keys)

def select_server(self,user,servers):
	if not len(servers): return None
	#servers.sort(key=lambda server: server.region+server.name)
	min_dist=99999999999; the_server=None; max_rank=-99999; u_server=""
	if user and len(gf(user,"characters",[])):
		for c in gf(user,"characters",[]):
			if c.has_key("home"):
				u_server=c["home"]
				break;
	logging.info(u_server)
	try:
		country=get_country(self)
		latlon=c_to_ll.get(country.lower(),[0,0])
		latlon[0],latlon[1]=float(latlon[0]),float(latlon[1])
		for server in servers:
			dist=abs(server.info.lat-latlon[0])**2+abs(server.info.lon-latlon[1])**2
			rank=100+server.info.players/10000.0
			if server.info.players>50: rank=10-server.info.players/10000.0
			if server.info.pvp: rank=1; dist+=19999999999
			if server.port==8098: rank=-1000; dist+=29999999999
			logging.info("user %s server %s %s"%(latlon,[server.info.lat,server.info.lon],rank))
			if server.region+server.name==u_server: dist=-1; rank=99999999
			if dist<min_dist or dist==min_dist and rank>max_rank:
				min_dist=dist; the_server=server
				max_rank=rank
		if the_server: return the_server
	except: log_trace()
	return servers[0]

def get_servers(no_cache=False):
	servers=memcache.get("servers")
	if not servers or no_cache:
		servers=[]
		for server in Server.query(Server.online == True):
			if msince(server.last_update)<5:
				servers.append(server)
	servers.sort(key=lambda s: (s.region=="EU" and "1" or s.region=="US" and "2" or s.region=="ASIA" and "3")+s.name)
	#logging.info(servers)
	return servers

def set_servers(current=None):
	servers=[]
	if current: servers.append(current)
	for server in Server.query(Server.online == True):
		if msince(server.last_update)<5 and server.online and not (current and current.k()==server.k()):
			del server.info.data # otherwise easily exceeds 1MB [13/06/19]
			servers.append(server)
	memcache.set("servers",servers)

def check_servers():
	offlines=[]; servers=[]
	for server in Server.query(Server.online == True):
		if not server.last_update or msince(server.last_update)>4:
			logging.error("Server Unexpectedly Offline: %s"%server)
			server.online=False
			server.put()
			offlines.append(server.k())
			if 0:
				logging.info("Freeing Players")
				for player in Character.query(Character.server == server.k()):
					player.server=""
					player.put()
					logging.info("Freed %s"%player.name)
			else:
				logging.error("Player Freeing Routine is Manually Disabled")
		else:
			del server.info.data
			servers.append(server)
			logging.info("Server Alive: %s"%server)
	memcache.set("servers",servers)
	if offlines:
		send_email(gdi(),"kaansoral@gmail.com",html="%s"%offlines,title="OFFLINE SERVERS DETECTED")
	enforce_limitations()

def free_servers():
	if not is_sdk: return
	for server in Server.query(Server.online == True):
		server.online=False
		server.put()

def refactor_all():
	for character in Character.query():
		if character.type=="wizard":
			character.type="mage"
			character.put()

def unlock_all():
	for character in Character.query():
		character.server=""
		character.put()

def delete_all():
	if not is_sdk: return
	for user in User.query():
		user.key.delete()
	for character in Character.query():
		character.key.delete()
	for mark in MarkedPhrase.query():
		mark.key.delete()
	for server in Server.query():
		server.key.delete()
	ndb.Key(InfoElement,"main").delete()

def refactor_item(current):
	if current and (items[current["name"]].get("upgrade","") or items[current["name"]].get("compound","")) and not current.get("level",""):
		current["level"]=0
	if current and items[current["name"]].get("s",""):
		current["q"]=current.get("quantity",current.get("q",1))
		if current.has_key("quantity"): del current["quantity"]

def refactor_character_items(character):
	for i in range(0,len(character.info.items)):
		current=character.info.items[i]
		refactor_item(current)
	for slot in character.info.slots:
		refactor_item(character.info.slots[slot])

def update_all_characters():
	for character in Character.query():
		refactor_character_items(character)
		character.put()

def send_map(name):
	if not is_sdk: return
	post_task("m=Map(key=ndb.Key(Map,element.key.id()),info=element.info); m.put()",element=get_by_iid("map|%s"%name))

def send_maps():
	if not is_sdk: return
	for m in Map.query():
		post_task("m=Map(key=ndb.Key(Map,element.key.id()),info=element.info); m.put()",element=m)

def download_map(name,sdk_name=""):
	if not is_sdk: return
	if not sdk_name: sdk_name=name
	element=download_by_iid("map|%s"%name)
	if element: Map(key=ndb.Key(Map,sdk_name),info=element.info).put()

def download_maps():
	if not is_sdk: return
	for m in maps:
		element=download_by_iid("map|%s"%m)
		if element: Map(key=ndb.Key(Map,m),info=element.info).put()

def copy_map(fr,to):
	fr=get_by_iid("map|%s"%fr)
	m=Map(key=ndb.Key(Map,to),info=fr.info); m.put()

def get_server(self,domain):
	auth=self.request.get("server_auth")
	if auth:
		logging.info("get_server auth: %s"%auth)
		id,auth=auth.split("-")
		server=get_by_iid("server|%s"%id)
		if server and gf(server,"auth")==auth: return server

def get_referrer(self,ip):
	referrer=get_cookie(self,"referrer") or ip.referrer
	if referrer and referrer.replace('"',"")[0] in ["0","1","2","3","4","5","6","7","8","9"]: referrer=get_by_iid("user|%s"%referrer.replace('"',""))
	elif referrer: referrer=get_owner(referrer.replace('"',""))
	return referrer

def get_signupth():
	main=get_by_iid("infoelement|main")
	if not main: return 1
	return gf(main,"signupth",1)

def increase_signupth():
	main=get_by_iid("infoelement|main")
	if not main:
		main=InfoElement(key=ndb.Key(InfoElement,"main"),info=GG())
		main.info.signupth=2
	else:
		main.info.signupth=gf(main,"signupth",1)+1
	try: main.put()
	except: logTrace()

def get_characterth():
	main=get_by_iid("infoelement|main")
	if not main: return 1
	return gf(main,"characterth",1)

def increase_characterth():
	main=get_by_iid("infoelement|main")
	if not main: main=InfoElement(key=ndb.Key(InfoElement,"main"),info=GG())
	main.info.characterth=gf(main,"characterth",1)+1
	try: main.put()
	except: logTrace()

def get_new_auth(self,user,domain):
	auth=randomStr(20)
	user.info.auths=gf(user,"auths",[])
	user.info.last_auth=datetime.now()
	if len(user.info.auths)>200:
		user.info.auths=[]
	user.info.auths.append(auth)
	return auth

def download_by_iid(iid):
	result=urlfetch.fetch(url="https://twodimensionalgame.appspot.com/tasks/download",payload=urllib.urlencode({"password":ELEMENT_PASSWORD,"iid":iid}),
		method=urlfetch.POST,headers={'Content-Type':'application/x-www-form-urlencoded'},validate_certificate=False)
	return cPickle.loads(result.content)

def post_task(task,element=None,element2=None,element3=None,logging=None):
	if not logging: logging=globals()["logging"]
	if not is_sdk: logging.error("sdk only")
	element=element and cPickle.dumps(element) or ""
	element2=element2 and cPickle.dumps(element2) or ""
	element3=element3 and cPickle.dumps(element3) or ""
	result=urlfetch.fetch(url="https://twodimensionalgame.appspot.com/tasks/post",payload=urllib.urlencode({"p":SDK_UPLOAD_PASSWORD,"operation":"upload","obj1":element,"obj2":element2,"obj3":element3,"task_code":task}),
		method=urlfetch.POST,headers={'Content-Type': 'application/x-www-form-urlencoded'},validate_certificate=False)
	result=cPickle.loads(str(result.content))
	logging.info("post_task result: %s"%result)
	return result

def safe_commit(element):
	pass #GTODO: Implement

def domain_routine(domain):
	pass #GTODO: Implement

def delete_phrase_mark(type,phrase,async=False):
	ndb.Key(MarkedPhrase,dgt(type,phrase)).delete()

def mark_phrase(owner,phrase_type,phrase,async=False):
	MarkedPhrase(key=ndb.Key(MarkedPhrase,dgt(phrase_type,phrase)),type=phrase_type,phrase=str_or_unicode(phrase),owner=to_string_key(owner)).put()

def marker_check(id):
	def marker_transaction():
		if ndb.Key(Marker,id).get(): return False
		Marker(key=ndb.Key(Marker,id)).put()
		return True
	return ndb.transaction(marker_transaction,xg=True,retries=12)

def whtml(self,path,**dct):
	#path = os.path.join(os.path.dirname(__file__), pth)
	start_time=datetime.now()
	template = j2.get_template(path)
	if mssince(start_time)>250: logging.warning("JINJA2 WARNING %s took %s ms"%(path,mssince(start_time)))
	response=template.render(dct)
	if dct.get("domain","") and dct["domain"].electron:
		if dct["domain"].https:
			response=response.replace('="/','="%s/'%dct["domain"].secure_base_url).replace("='/","='%s/"%dct["domain"].secure_base_url)
		else:
			response=response.replace('="/','="%s/'%dct["domain"].base_url).replace("='/","='%s/"%dct["domain"].base_url)
	self.response.out.write(response)

def shtml(path,**dct):
	#path = os.path.join(os.path.dirname(__file__), pth)
	start_time=datetime.now()
	template = j2.get_template(path)
	if mssince(start_time)>250: logging.warning("JINJA2 WARNING %s took %s ms"%(path,mssince(start_time)))
	#html=template.render(dct)
	#if dct.pop("convert_onclicks",""): html=html.replace('onclick="','ontap="') #experimental [28/05/15]
	return template.render(dct)

def pre_put_hook(self):
	try:
		if hasattr(self,"random_number") and not self.random_number:
			self.random_number=random.randrange(1,101)
			if hasattr(self,"has_scatter") and random.randrange(0,10000)==12:
				self.has_scatter=True
		if hasattr(self,"server") and hasattr(self,"online"):
			if self.server: self.online=True
			else: self.online=False
	except:
		logging.error("pre_put_hook exception")

def arr_arr_same(ar1,ar2):
	if len(ar1)!=len(ar2): return False
	d={}
	for e in ar1: d[e]=1
	for e in ar2:
		if not d.get(e): return False
	return True

def delete_phrase_mark(type,phrase,async=False):
	ndb.Key(MarkedPhrase,dgt(type,phrase)).delete()

def mark_phrase(owner,phrase_type,phrase,async=False):
	MarkedPhrase(key=ndb.Key(MarkedPhrase,dgt(phrase_type,phrase)),type=phrase_type,phrase=str_or_unicode(phrase),owner=to_string_key(owner)).put()

def to_id(id):
	if id=="": id="8" #to prevent the empty key exceptions [22/07/14]
	if type(id)==type({}):
		if id.get("a_t"): id=id.get("a")
		else: id=id.get("id")
	if hasattr(id,"k"): id=has_key(id)
	id=to_str(id)
	if id.isdigit(): return int(id)
	return id

def k_factory(self,t=""):
	if t=="h":
		the_key=self.key.id()
		if type(the_key) in [types.IntType,types.LongType]: return the_key
		return string_to_int(the_key)
	if t=="e": return "%s"%has_key(self) or "-1" #as a placeholder mainly for the StuffHandler routines [28/08/14]
	if t=="s": the_key=has_key(self)
	else: the_key=self.key.id()
	try: u"%s"%the_key
	except: the_key=the_key.decode("utf-8")
	if t in ["i","s",1]: return dmt(model_name(self),the_key)
	return unicode(the_key)

def to_model(string):
	d=globals()
	if d.has_key(string.title()): return d[string.title()]
	for e in d.keys():
		try:
			if len(e) and e[0].isupper() and e.lower()==string.lower(): return d[e]
		except: pass

def dgt(*list,**dct):
	lst=[]
	for i in range(0,len(list)): lst.append(to_str(list[i]))
	if dct.has_key("sort"): lst.sort()
	return "-".join(lst)

def dge(*list,**dct):
	lst=[]
	for i in range(0,len(list)): lst.append(to_str(list[i]))
	if dct.has_key("sort"): lst.sort()
	return "".join(lst)

def dse(*list,**dct):
	lst=[]
	for i in range(0,len(list)): lst.append(to_str(list[i]))
	if dct.has_key("sort"): lst.sort()
	return " ".join(lst)

def dmt(*list,**dct):
	lst=[]
	for i in range(0,len(list)): lst.append(to_str(list[i]))
	if dct.has_key("sort"): lst.sort()
	return "|".join(lst)

def to_string_key(element):
	if type(element) in [types.IntType,types.LongType]: return str(element)
	if type(element) in types.StringTypes: return element
	return element.k()

def str_or_unicode(s):
	try: return str(s)
	except:
		try: return unicode(s)
		except: return s.decode("utf-8")

def model_name(item):
	if type(item)==type({}):
		if item.get("a_t"): return "action"
		return item.get("base_type",item.get("type",""))
	return item._class_name().lower()

def is_array(a):
	if hasattr(a, "__len__"): return True

@jrf
def get_cx(c):
	cx=gf(c,"cx",{})
	return json.dumps(cx)

@jrf
def sshorten(name): #Character Selection Name Shortening [20/06/18]
	if len(name)>9:
		return name[:9]+".."
	return name

@jrf
def get_online_character(domain,key):
	keys={1:None,2:None,3:None,"merchant":None}
	order=1
	for character in domain.characters:
		if not character["online"]: continue
		if character["type"]=="merchant":
			keys["merchant"]=character
		else:
			keys[order]=character
			order+=1
	return keys[key]


@jrf
def is_user_newb(user):
	if not user: return True
	for c in gf(user,"characters",[]):
		if c.get("level",0)>47: return False
	return True

@jrf
def sales_percent(domain):
	return "%.2f"%(domain.sales*100/10000.0)

@jrf
def to_slots(data):
	slots={}
	for id in data:
		if id.startswith("trade") or not data[id]: continue
		current={"name":data[id]["name"]}
		if "level" in data[id]: current["level"]=data[id]["level"]
		if "stat_type" in data[id]: current["stat_type"]=data[id]["stat_type"]
		if "p" in data[id]: current["p"]=data[id]["p"]
		slots[id]=current
	return json.dumps(slots)

def calculate_tutorial_step(user_data):
	marked={}
	for key in user_data.info.completed_tasks:
		marked[key]=True
	for i in xrange(len(docs["tutorial"])):
		done=True
		for key in docs["tutorial"][i]["tasks"]:
			if not marked.has_key(key): done=False
		if not done and user_data.info.tutorial_step>i:
			user_data.info.tutorial_step=i
			break

@jrf
def to_tutorial(user_data):
	return json.dumps(data_to_tutorial(user_data))

def data_to_tutorial(user_data):
	try:
		if user_data:
			if user_data.info.tutorial_step>=len(docs["tutorial"]): return {"step":user_data.info.tutorial_step,"completed":[],"finished":True,"task":False,"progress":100}
			arr=[]; task=False; percent=100
			for key in docs["tutorial"][user_data.info.tutorial_step]["tasks"]:
				if key in user_data.info.completed_tasks:
					arr.append(key)
				elif not task:
					task=key
			if task: percent=round(100*len(arr)/len(docs["tutorial"][user_data.info.tutorial_step]["tasks"]))
			return {"step":user_data.info.tutorial_step,"task":task,"completed":arr,"progress":percent}
	except:
		log_trace()
	return {"step":0,"completed":[]}

@jrg
def tutorial_data(key):
	for info in docs["tutorial"]:
		if info["key"]==key:
			return info

@jrg
def task_name(key):
	return docs["tasks"].get(key,key.title())

@jrf
def to_json(e):
	return json.dumps(e)

@jrf
def to_repr(e):
	return "%s"%repr(e)

def to_str(s):
	try: return unicode(s)
	except: 0 and logging.info("unicode fail %s"%repr(s)); pass
	try: return s.decode("utf-8")
	except: 0 and logging.info("decode utf-8 fail %s"%repr(s)); pass
	try: return str(s)
	except: 0 and logging.info("str fail %s"%repr(s)); pass
	return s

def split_iid(s):
	return s.split("|",1)

def get_by_iid(iid,async=False,no_cache=False):
	mname,id=split_iid(iid)
	try:
		k=ndb.Key(to_model(mname),to_id(id))
		if async: return k.get_async()
		else:
			if no_cache: return k.get(use_cache=False)
			return k.get()
	except:
		log_trace()
		return None

def get_by_iid_async(iid):
	return get_by_iid(iid,async=True)

def purify_email(email,check=True):
	email=email.replace(" ","").replace("\t","").replace("\n","").replace("\r","")
	email=email.lower()
	if check and not mail.is_email_valid(email): raise Exception
	name,domain=email.split("@")
	if check and len(domain.split("."))<2: raise Exception
	if check and len(domain.split(".")[1])<2: raise Exception
	if domain in ["gmail.com","googlemail.com"]:
		domain="gmail.com"; name=name.replace(".","")
		email="%s@%s"%(name,domain)
	logging.info("purify_email %s"%email)
	return email

def gf(element,name,default=None): # as in getattr info fast :)
	if not hasattr(element,"info") or type(element.info)!=types.InstanceType: return getattr(element,name,default)
	return getattr(element.info,name,default)

def gt(element,name,default=None):
	return getattr(element,name,default)

def gdmul(self,*lst):
	gg=[]
	for l in lst:
		gg.append(self.request.get(l))
	if len(gg)==1: return gg[0]
	return gg

def gdmuld(self,*lst):
	gg=[]
	for l in lst:
		gg.append(self.get(l))
	if len(gg)==1: return gg[0]
	return gg

def jfunc(self,func,args=[]):
	if not self: return
	if not getattr(self,"_cjsons",0): self._cjsons=[]
	self._cjsons.append({"type":"func","func":func,"args":args})

def jeval(self,func):
	if not self: return
	if not getattr(self,"_cjsons",0): self._cjsons=[]
	self._cjsons.append({"type":"eval","code":func})

def jjson(self,jsn):
	if not self: return
	if not getattr(self,"_cjsons",0): self._cjsons=[]
	self._cjsons.append(jsn)

def jjsons(self,jsns):
	if not self: return
	if not getattr(self,"_cjsons",0): self._cjsons=[]
	self._cjsons.extend(jsns)
	
def jsuccess(self,message,duration=0):
	if not self: return
	if not getattr(self,"_cjsons",0): self._cjsons=[]
	self._cjsons.append({"type":"success","message":message,"duration":duration})

def jhtml(self,jsn=[]):
	if not self: return
	if getattr(self,"_cjsons",0):
		self._cjsons.extend(jsn)
		#logging.info("CJSONS %s"%self._cjsons)
		self.response.out.write(json.dumps(self._cjsons))
	else:
		self.response.out.write(json.dumps(jsn))

def jhtmle(self,err):
	if not self: return
	jhtml(self,[{"type":"ui_error","message":err}])

def jhtmlchat(self,s,c=""):
	if not self: return
	jhtml(self,[{"type":"chat_message","message":s,"color":c}])

def jhtmlm(self,s):
	if not self: return
	jhtml(self,[{"type":"message","message":s}])

def jhtmlc(self,s,c):
	if not self: return
	jhtml(self,[{"type":"message","message":s,"color":c}])
	
def jhtmls(self,s):
	if not self: return
	jhtml(self,[{"type":"success","message":s}])

@jrf
def dsince(t,ref=None):
	if not ref: ref=datetime.now()
	if type(t)==date: t=datetime(t.year,t.month,t.day,0,0)
	return (ref-t).total_seconds()/(24*3600.0)

@jrf
def hsince(t,ref=None):
	if not ref: ref=datetime.now()
	if type(t)==date: t=datetime(t.year,t.month,t.day,0,0)
	return (ref-t).total_seconds()/3600.0

@jrf
def msince(t,ref=None):
	if not ref: ref=datetime.now()
	if type(t)==date: t=datetime(t.year,t.month,t.day,0,0)
	return (ref-t).total_seconds()/60.0

@jrf
def ssince(t,ref=None):
	if not ref: ref=datetime.now()
	if type(t)==date: t=datetime(t.year,t.month,t.day,0,0)
	return (ref-t).total_seconds()
def seconds_since(t):
	return ssince(t)

@jrf
def mssince(t,ref=None):
	if not ref: ref=datetime.now()
	if type(t)==date: t=datetime(t.year,t.month,t.day,0,0)
	return (ref-t).total_seconds()*1000

def log_trace_i(place="",logger=None):
	if not logger: logger=logging
	if place: place="[%s] "%place
	(exc_type, exc_value, exc_traceback) = sys.exc_info()
	logger.info("\n\n<<<<<<<<<< log_trace_i %s %s>>>>>>>>>>"%(exc_type,place),exc_info=sys.exc_info())
	logger.info("\n")

def log_trace(place="",logger=None):
	if not logger: logger=logging
	if place: place="[%s] "%place
	(exc_type, exc_value, exc_traceback) = sys.exc_info()
	logger.error("\n\n<<<<<<<<<< log_trace %s %s>>>>>>>>>>"%(exc_type,place),exc_info=sys.exc_info())
	logger.error("\n")

def get_domain(self=None,url=None):
	if self or url:
		if self: url=self.request.url
		try: url=url[0:url.index("/",8)+1] #in case the url doesn't end with / [25/09/15]
		except: pass
		url=url.replace("http://",""); url=url.replace("https://",""); url=url.replace("/",""); url=url.split(".")
		if len(url)==2: return ["www",url[0],url[1]]
		return [url[-3],url[-2],url[-1]] #to prevent the www.geobird.com.test.com-like url's [25/09/15]
	else:
		if not is_sdk: return live_domain
		else: return sdk_domain

def get_cookie(self,name):
	return self.request.cookies.get(name)

def set_cookie(self,name,value):
	subdomain,domainname,toplevel=get_domain(self)
	self.response.set_cookie(name,to_str(value),max_age=86400*365*5, path='/',domain='.%s.%s'%(domainname,toplevel),secure=secure_cookies)

def delete_cookie(self,name):
	subdomain,domainname,toplevel=get_domain(self)
	self.response.delete_cookie(name,path='/',domain='.%s.%s'%(domainname,toplevel))

class StrLogHandler(logging.Handler):
	def __init__(self, output):
		logging.Handler.__init__(self)
		self.output=output
	def emit(self, record):
		if hasattr(record,"msg"): self.output["output"]=(self.output.get("output") or "")+"\n"+"%s"%(record.msg,)
		if record.exc_info:
			(exc_type, exc_value, exc_traceback) = record.exc_info
			self.output["output"]=(self.output.get("output") or "")+"\n"+"%s"%exc_type
			self.output["output"]=(self.output.get("output") or "")+"\n"+"%s"%exc_value
			self.output["output"]=(self.output.get("output") or "")+"\n"+"%s"%exc_traceback

def custom_logging():
	logs={}
	log_handler=StrLogHandler(logs)
	custom=logging.getLogger('code_logs')
	custom.setLevel(logging.INFO)
	custom.addHandler(log_handler)
	custom.output=lambda: logs.get("output") or ""
	return custom

def to_filename(name):
	f=""
	for c in ("%s"%name):
		if c in "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz_-.+ ":
			f=f+c
	return f

def simplify_name(name):
	return name.lower()

def sint(num):
	try:
		return int(num)
	except:
		return 9999999998

@jrf
def to_pretty_num(num):
	if not num: return 0
	pretty=""; prefix=""
	if num<0:
		prefix="-";
		num=-num
	num=int(math.floor(num))
	while num:
		current=num%1000
		if not current: current="000"
		elif current<10 and current!=num: current="00%s"%current
		elif current<100 and current!=num: current="0%s"%current
		if not pretty: pretty=current
		else: pretty="%s,%s"%(current,pretty)
		num=int(num/1000.0)
	return "%s%s"%(prefix,pretty)

@jrg
def randomStr(length,digits_only=False,lowercase_only=False):
	chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; s=""
	if digits_only: chars="0123456789"
	if lowercase_only: chars="abcdefghijklmnopqrstuvwxyz"
	for i in range(0,length+1): s+=chars[random.randrange(0,len(chars))]
	return s

def add_event(element,type,tags,info=None,backup=False,async=False,self=None,rowner=None,selfic=None):
	logging.info("add_event %s %s %s"%(element and element.k('i'),type,tags))
	if backup and element: backup=backup_item(element,async=True)
	else: backup=None
	if not info: info=GG()
	if type not in tags: tags.append(type)
	event=Event(type=type,tag=tags,info=info,expire_at=datetime.now()+timedelta(days=30*5))
	if rowner: event.rowner=rowner #referrer event owner
	if self:
		event.info.ip=get_ip(self)
		event.info.country=get_country(self)
	if selfic: event.info.ip,event.info.country=selfic
	if element:
		event.item_id=element.k('i')
		if hasattr(element,"region"): event.info.e_name="%s %s"%(element.region,element.name)
		elif hasattr(element,"name"): event.info.e_name=element.name
	if async: return event.put_async()
	else:
		if backup: backup.wait()
		event.put()
		return event

def backup_item(element,rkey=None,async=False):
	logging.info("backup_item %s"%element.k('i'))
	#if not has_key(element): logging.error("Backup: Element doesn't have a key"); return
	if rkey: backup=Backup(key=ndb.Key(Backup,rkey))
	else: backup=Backup(expire_at=datetime.now()+timedelta(days=30*5))
	backup.backup_item_id=element.k('i')
	# element=copy.deepcopy(element) might be needed
	for k in element._properties.keys():
		i=getattr(element,k)
		if k.startswith("_") or callable(i) or k=="key" or k in []: continue
		if type(i) == rdatetime.date: i=datetime.combine(i, rdatetime.time(0,0))
		#logging.info("%s -> %s"%(k,type(i)))
		setattr(backup,k,i)
	backup.backup_info=cGG(original_properties=element._properties)
	backup.backup_created=datetime.now()
	if async: return backup.put_async()
	else:
		backup.put()
		return backup

def restore_backup(backup):
	if not hasattr(backup,"key"): backup=get_by_iid("backup|%s"%backup)
	if not backup: return logging.error("Backup Not Found!")
	item_id=backup.backup_item_id
	element=to_model(item_id.split("|")[0])(key=ndb.Key(to_model(item_id.split("|")[0]),item_id.split("|")[1]))
	for k in backup._properties.keys():
		i=getattr(backup,k)
		if k.startswith("_") or k.startswith("backup_") or callable(i) or k=="key" or k in []: continue
		if type(i) == rdatetime.date: i=datetime.combine(i, rdatetime.time(0,0))
		#logging.info("%s -> %s"%(k,type(i)))
		setattr(element,k,i)
	element.put()

_base_js_escapes = (
	('\\', r'\u005C'),
	('\'', r'\u0027'),
	('"', r'\u0022'),
	('>', r'\u003E'),
	('<', r'\u003C'),
	('&', r'\u0026'),
	('=', r'\u003D'),
	('-', r'\u002D'),
	(';', r'\u003B'),
	(u'\u2028', r'\u2028'),
	(u'\u2029', r'\u2029')
)

# Escape every ASCII character with a value less than 32.
_js_escapes = (_base_js_escapes +
			   tuple([('%c' % z, '\\u%04X' % z) for z in range(32)]))

@jrf
def escapejs(value):
	"""Hex encodes characters for use in JavaScript strings."""
	if not isinstance(value, basestring):
		value = str(value)

	for bad, good in _js_escapes:
		value = value.replace(bad, good)

	return value

@jrf
def to_date(created):
	utc2=created+timedelta(hours=3)
	return "%.2d/%.2d/%.4d"%(utc2.day,utc2.month,utc2.year)

@jrf
def to_hour(created):
	utc2=created+timedelta(hours=3)
	return "%.2d:%.2d:%.2d"%(utc2.hour,utc2.minute,utc2.second)

def he(s):
	return s.replace("<","&lt;").replace(">","&gt;").replace("&","&amp;")

def recursive_datetime_conversion(d):
	if not type(d)==type({}): return d
	for key,e in d.items():
		if type(e)==type(datetime.now()): d[key]="%s"%e
		elif type(e)==type({}): recursive_datetime_conversion(e)
	return d

def olen(el):
	#TODO: consider sys.getsizeof [27/10/13]
	return len(cPickle.dumps(el,-1))

def size_of(el):
	size=len(cPickle.dumps(el,-1))
	if size>1000000: return "%.2fMB"%(size/1000000.0)
	if size>1000: return "%.2fKB"%(size/1000.0)
	return "%dB"%size

def ssize_of(el):
	try: return size_of(el)
	except: return -1

def safelen(e):
	try: return len(e)
	except: return 0

def glenhandle(e):
	ll=safelen(e)
	if ll: return "[%s]"%ll;
	else: return ""

def ginspect(o,id="root",force_inspection=0):
	if force_inspection==3: force_inspection=0
	if id=="root": style=""
	else: style="display: none; "
	str=u"<div style='%s margin-left: 20px' id='%s'>"%(style,id);
	#for e in range(0,indent*5): tabs=tabs+"<span> </span>"
	if type(o)==type([]):
		str+="<ul>"
		for e in o:
			str+="<li><b>"+size_of(e)+"</b> "+ginspect(e)+"</li>"
		str+="</ul>"
	elif type(o)==type({}):
		str+="<ul>"
		keys=o.keys(); keys.sort()
		for k in keys:
			e=o[k]
			cid=randomStr(20)
			ll=glenhandle(e)
			str+="<li> <a href='#' onclick='$(\"#%s\").toggle(); return false'>KEY_%s (%s) %s</a>: "%(cid,he(to_str(k)),ssize_of(e),ll)+ginspect(e,cid)+"</li>"
		str+="</ul>"
	elif type(o) in [type(''),type(u'')]:
		try:
			str+=he(o)
		except:
			str+="Exception for: "+he(repr(o));
	elif type(o) in [type(datetime.now())]:
		str+="Datetime %s || %s seconds ago || %s minutes ago"%(o,ssince(o),ssince(o)/60.0)
	else:
		try:
			strf=""
			if issubclass(o.__class__,ndb.Expando) or issubclass(o.__class__,ndb.Model): intentional_bug
			elif hasattr(o,"__str__"): strf+=o.__str__()
			elif hasattr(o,"__format__"): strf+=o.__format__()
			elif hasattr(o,"__repr__"): strf+=o.__repr__()
			else: goto_except
			if type(o)==type(type): strf+=o.__doc__
			if force_inspection: str+="<div><b>"+strf+"</b></div>"; goto_except
			else: str+=strf
		except:
			str+="<ul>"
			elements=dir(o); elements.sort(); additional=[]; others=[]
			try:
				for v in getattr(o,"_values",{}).keys():
					if v not in elements: additional.append(v)
				additional.sort()
				elements.extend(additional)
			except: log_trace()
			for e in elements:
				try:
					cid=randomStr(20)
					if not callable(getattr(o,e)) and e not in ["__doc__","__module__"] and not e.startswith("_"):
						ll=glenhandle(getattr(o,e))
						#logging.info(e)
						rep="EL"
						if e in additional: rep="DE"
						str+="<li> <a href='#' onclick='$(\"#%s\").toggle(); return false'>%s_%s (%s) %s</a>: "%\
							(cid,rep,he(to_str(e)),ssize_of(getattr(o,e)),ll)+ginspect(getattr(o,e),cid,force_inspection=force_inspection and (force_inspection+1))+"</li>"
					elif force_inspection and e not in ["__doc__","__module__"] and not e.startswith("_"): others.append(e)
				except: log_trace_i()
			for e in others:
				try:
					cid=randomStr(20)
					str+="<li> <a href='#' onclick='$(\"#%s\").toggle(); return false'>%s_%s (%s)</a>: "%\
						(cid,"F",he(to_str(e)),0)+"<div style='display: none; text-decoration: none' id='%s'>%s</div>"%(cid,getattr(o,e).__doc__)+"</li>"
				except: log_trace_i()
			str+="</ul>"
	return str+"</div>"

def get_image_size_advanced(blob_key):
	#TODO: Improve the image routines to eliminate the need to manually reverse the dimensions [26/06/14]
	size=cGG(metadata={},location=None,exception=False)
	img=images.Image(blob_key=blob_key)
	img.im_feeling_lucky()
	img.execute_transforms(output_encoding=images.JPEG,parse_source_metadata=True)
	logging.info(img.get_original_metadata())
	size.width=img.width
	size.height=img.height
	try:
		size.metadata=img.get_original_metadata()
		if size.metadata.get("orientation",size.metadata.get("Orientation",None)) in [5,6,7,8,"5","6","7","8"]:
			t=size.width; size.width=size.height; size.height=t; size.reversal=True
	except: log_trace()
	return size

def get_image_size_simple(blob_key):
	size=cGG(metadata={},location=None,exception=False)
	data = blobstore.fetch_data(blob_key, 0, 50000)
	img=images.Image(image_data=data)
	size.width=img.width; size.height=img.height
	return size

def filetype_to_image_encoding(filetype):
	if filetype in ["image/png","image/gif"]: return images.PNG
	return images.JPEG

def get_image_size(blob_key,encoding=images.JPEG,exception=True):
	try:
		if encoding!=images.JPEG: # or is_appengine:
			try:
				return get_image_size_simple(blob_key)
			except:
				log_trace_i()
				return get_image_size_advanced(blob_key)
		else:
			try:
				return get_image_size_advanced(blob_key)
			except:
				log_trace_i()
				return get_image_size_simple(blob_key)
	except:
		log_trace()
		if exception: raise Exception
	return cGG(width=images.IMG_SERVING_SIZES_LIMIT,height=images.IMG_SERVING_SIZES_LIMIT,exception=True,location=None,metadata={})

def handle_image_url(url):
	url=url.replace("localhost","thegame.com").replace("127.0.0.1","thegame.com").replace("0.0.0.0","thegame.com").replace(" ","").replace(":8080","").replace(":80","")
	gg=re.findall("=s.*",url)
	if gg: url=url.replace(gg[0],"")
	return url

def get_serving_url(blob_key,**dct):
	for i in xrange(3):
		try:
			url=images.get_serving_url(blob_key,**dct)
			logging.info(url)
			return handle_image_url(url)
		except: (i==2 and log_trace()) or log_trace_i(); time.sleep(2)
	raise "improved_get_serving_url failed"

def encode_unicodes(args):
	if args and type(args)==type({}):
		for key,value in args.items():
			if type(value)==type(u""):
				args[key]=value.encode("utf-8")

def fetch_url(url_u,**dct):
	if url_u.startswith("/"):
		if is_sdk: url_u="http://thegame.com"+url_u
		else: url_u="https://adventure.land"+url_u
	if dct or dct.pop("use_post",""):
		encode_unicodes(dct)
		data = urllib.urlencode(dct)
		return urlfetch.fetch(url=url_u,payload=data,method=urlfetch.POST,validate_certificate=is_production).content
	else:
		return urlfetch.fetch(url=url_u,method=urlfetch.GET,validate_certificate=is_production).content

def fetch_url_async(url_u,**dct):
	rpc=urlfetch.create_rpc(deadline=40)
	if dct.pop("use_get",""):
		urlfetch.make_fetch_call(rpc,url_u+"?"+urllib.urlencode(dct),method=urlfetch.GET,validate_certificate=False)
	else:
		data = urllib.urlencode(dct)
		urlfetch.make_fetch_call(rpc,url_u,payload=data,method=urlfetch.POST,headers={'Content-Type': 'application/x-www-form-urlencoded'},validate_certificate=False)
	return rpc

def send_email(domain,email="kaansoral@gmail.com",title="Default Title",html="Default HTML",text="An email from the game",sender="hello@adventure.land",reply_to=""):
	logging.info("send_email %s - %s - %s"%(email,sender,title))
	if not reply_to: reply_to="hello@adventure.land"
	if is_sdk:
		message=amazon_ses.EmailMessage()
		message.subject=title
		message.bodyHtml=html
		message.bodyText=text
		ses=amazon_ses.AmazonSES(secrets.amazon_ses_user,secrets.amazon_ses_key)
		#logging.info(ses.listVerifiedEmailAddresses().members)
		try: ses.sendEmail("pr@createandspread.com","kaansoral@gmail.com",message)
		except amazon_ses.AmazonError,e:
			logging.info(e.errorType); logging.info(e.code); logging.info(e.message);
			log_trace()
	elif always_amazon_ses:
		message=amazon_ses.EmailMessage()
		message.subject=title
		message.bodyHtml=html
		message.bodyText=text
		ses=amazon_ses.AmazonSES(secrets.amazon_ses_user,secrets.amazon_ses_key)
		#logging.info(ses.listVerifiedEmailAddresses().members)
		try: ses.sendEmail("hello@adventure.land",email,message)
		except amazon_ses.AmazonError,e:
			logging.info(e.errorType); logging.info(e.code); logging.info(e.message);
			log_trace()
	else:
		try:
			mail.send_mail(sender,email,title,text,html=html,reply_to=reply_to)
		except: log_trace()

import hmac,hashlib
from struct import Struct
from operator import xor
from itertools import izip, starmap
_pack_int = Struct('>I').pack

#https://code.google.com/p/googleappengine/issues/detail?id=5303 and https://github.com/mitsuhiko/python-pbkdf2/blob/master/pbkdf2.py
def pbkdf2_hex(data, salt, iterations=1000, keylen=24, hashfunc=None):
	"""Like :func:`pbkdf2_bin` but returns a hex encoded string."""
	return pbkdf2_bin(data, salt, iterations, keylen, hashfunc).encode('hex')

def pbkdf2_bin(data, salt, iterations=1000, keylen=24, hashfunc=None):
	"""Returns a binary digest for the PBKDF2 hash algorithm of `data`
	with the given `salt`.  It iterates `iterations` time and produces a
	key of `keylen` bytes.  By default SHA-1 is used as hash function,
	a different hashlib `hashfunc` can be provided.
	"""
	hashfunc = hashfunc or hashlib.sha1
	mac = hmac.new(data, None, hashfunc)
	def _pseudorandom(x, mac=mac):
		h = mac.copy()
		h.update(x)
		return map(ord, h.digest())
	buf = []
	for block in xrange(1, -(-keylen // mac.digest_size) + 1):
		rv = u = _pseudorandom(salt + _pack_int(block))
		for i in xrange(iterations - 1):
			u = _pseudorandom(''.join(map(chr, u)))
			rv = starmap(xor, izip(rv, u))
		buf.extend(rv)
	return ''.join(map(chr, buf))[:keylen]

def hash_password(password,salt):
	password=password.replace(" ","").encode('utf8')
	return pbkdf2_hex(password,salt,iterations=160)

def cGG(**dct):
	gg=GG()
	for k,e in dct.items(): setattr(gg,k,e)
	return gg

from models import *