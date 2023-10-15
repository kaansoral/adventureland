# This Python file uses the following encoding: utf-8
from config import *
from functions import *

def send_halloween_email(user):
	domain=gdi()
	send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="halloween",domain=domain,user=user),title=u"🎃 Hey Adventurer! Check out our new Halloween Zone! 🎃",text="Adventure Land has a new Halloween Zone!")

def send_xmas_email(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="xmas",domain=domain,user=user),title=u"🎄 Hey Adventurer! Winterland is Here. Xmas Drops are Everywhere! +Steam Greenlight 🎄",text="Adventure Land's Xmas Event is Here'!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_xmas2_email(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="xmas2",domain=domain,user=user),title=u"🎄 Hey Adventurers! Our Xmas Event is Live! 🎄",text="Adventure Land's Xmas Event is Here'!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_xmas3_email(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="xmas3",domain=domain,user=user),title=u"🎄 Hey Adventurers! Our Holiday Season Event is Here and We have Snowballs Now! ☃️",text="Adventure Land's Holiday Season Event is Here'!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_cvalentines_email(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="cvalentines",domain=domain,user=user),title=u"⛩️ Chinese New Year + Valentine's Day Events! Grand Prize: Dragon Armor 💘",text="Adventure Land's Chinese New Year Event is Here'!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_easter_email(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="easter",domain=domain,user=user),title=u"🐰 🥚  Easter Event on Adventure Land! +Map Editor 🗺️ 🐰",text="Adventure Land's Easter Event is Here'!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_easter_email2(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="easter2",domain=domain,user=user),title=u"🐰 Adventure Land's Easter Event is Here! 🥚",text="Adventure Land's Easter Event is Here!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_anniversary_email(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="anniversary",domain=domain,user=user),title=u"🎂 🎁  Anniversary Event on Adventure Land! 🎉 🍰",text="Adventure Land's Anniversary Event is Here'!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_halloween_email2(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="halloween2",domain=domain,user=user),title=u"New Map: Spooky Town on Adventure Land, Mummies, Franky, Ghosts, New Drops! Test 🎃 😱",text="Adventure Land has a new map!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()

def send_halloween_email3(user):
	try:
		domain=gdi()
		send_email(domain,user.info.email,html=shtml("htmls/contents/announcement_email.html",purpose="halloween3",domain=domain,user=user),title=u"Halloween Event on Adventure Land! New Cooperative Boss: Franky 🎃",text="Adventure Land has a new boss!")
	except:
		logging.info("Email failed: %s"%user.k())
		log_trace()


def all_user_cron(num):
	rpcs=[]
	for user in User.query(User.random_number==num):
		#logging.info(user)
		if len(user.info.characters):
			user.name=user.info.characters[0]["name"]
		else:
			user.name="#%s"%user.info.signupth
		rpcs.append(user.put_async())
		if len(rpcs)>=50: #SDK-old
			for rpc in rpcs: rpc.wait()
			rpcs=[]
	for rpc in rpcs: rpc.wait() #SDK-old

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		if not gf(user,"salt"):
			user.info.salt=randomStr(20)
			user.password=hash_password(user.password,user.info.salt)
			user.put()
			logging.info("Converted %s"%user.name)
		else:
			logging.info("Skipped %s"%user.name)

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		#deferred.defer(send_xmas_email,user,_countdown=random.randrange(0,4200))
		if not gf(user,"dont_send_emails") and gf(user,"verified",0):
			deferred.defer(send_easter_email2,user,_countdown=random.randrange(0,6*60*60)) #6 hours

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		element=user; data=get_user_data(user)
		if gf(data,"code_list"): user.info.code_list=data.info.code_list #can be re-run to convert filenames
		user.info.code_list=gf(user,"code_list",{})
		for slot in gf(user,"code_list",{}):
			if type(user.info.code_list[slot])!=type([]):
				user.info.code_list[slot]=[user.info.code_list[slot],0]
			user.info.code_list[slot][0]=to_filename(user.info.code_list[slot][0])
		data.info.code_list=user.info.code_list
		delattr(user.info,"code_list")
		r=data.put_async()
		element.put()
		r.wait()

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		#deferred.defer(send_xmas_email,user,_countdown=random.randrange(0,4200))
		if not gf(user,"dont_send_emails") and gf(user,"verified",0):
			deferred.defer(send_xmas3_email,user,_countdown=random.randrange(0,24*60*60)) #24 hours

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		element=user; change=False
		i_list=["items"]
		for i in xrange(64): i_list.append("items%d"%i)
		for c in i_list:
			if not gf(element,c,[]): continue
			for i in xrange(len(gf(element,c,[]))):
				item=gf(element,c,[])[i]
				if item and item["name"].endswith("booster") and not item.get("expires"):
					gf(element,c,[])[i]=None
					change=True
		if change: element.put()

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		element=user; change=False
		i_list=["items"]
		for i in xrange(64): i_list.append("items%d"%i)
		for c in i_list:
			if not gf(element,c,[]): continue
			for i in xrange(len(gf(element,c,[]))):
				item=gf(element,c,[])[i]
				if item and not item.get("oo"):
					item["oo"]=element.name
					change=True
		if change: element.put()

def all_user_cron(num): #<<NEW
	for user in User.query(User.random_number==num):
		if gf(user,"blocked_until",really_old)>datetime.now():
			user.banned=True
			user.put()

def all_character_cron(num):
	for character in Character.query(Character.random_number==num):
		if gf(character,"map") in ["main","batcave"]:
			character.info.map="main"
			character.info.x=0
			character.info.y=0
			character.put()

def all_character_cron(num):
	for character in Character.query(Character.random_number==num):
		element=character; change=False
		if gf(element,"p") and element.info.p.get("acx") and element.info.p["acx"].get("wing102"):
			del element.info.p["acx"]["wing102"]
			change=True
		for slot in gf(element,"slots",{}):
			item=element.info.slots[slot]
			if item and item["name"].endswith("booster") and not item.get("expires"):
				element.info.slots[slot]=None
				#item["level"]=max(0,int(item["level"]/2)-1)
				change=True
		for i in xrange(len(gf(element,"items",[]))):
			item=gf(element,"items",[])[i]
			if item and item["name"].endswith("booster") and not item.get("expires"):
				gf(element,"items",[])[i]=None
				#item["level"]=max(0,int(item["level"]/2)-1)
				change=True
		if change: element.put()

def all_character_cron(num):
	for character in Character.query(Character.random_number==num):
		element=character; change=False
		for slot in gf(element,"slots",{}):
			item=element.info.slots[slot]
			if item and not item.get("oo"):
				item["oo"]=element.info.name
			 	change=True
		for i in xrange(len(gf(element,"items",[]))):
			item=gf(element,"items",[])[i]
			if item and not item.get("oo"):
				item["oo"]=element.info.name
			 	change=True
		if change: element.put()

def all_cbackup_cron(num):
	rpcs=[]
	for character in Character.query(Character.random_number==num,Character.to_backup==True):
		def backup_transaction():
			element=get_by_iid(character.k('i'))
			element.to_backup=False
			element.put()
		rpcs.append(backup_item(character,async=True))
		rpcs.append(ndb.transaction_async(backup_transaction,retries=0))
	for rpc in rpcs: rpc.wait()

def all_process_cron(num):
	rpcs=[]
	for character in Character.query(Character.random_number==num,Character.to_backup==True):
		def backup_transaction():
			element=get_by_iid(character.k('i'))
			element.to_backup=False
			element.put()
		rpcs.append(backup_item(character,async=True))
		rpcs.append(ndb.transaction_async(backup_transaction,retries=0))
	for rpc in rpcs: rpc.wait()

def all_ubackup_cron(num):
	rpcs=[]
	for user in User.query(User.random_number==num,User.to_backup==True):
		def backup_transaction():
			element=get_by_iid(user.k('i'))
			element.to_backup=False
			element.put()
		rpcs.append(backup_item(user,async=True))
		rpcs.append(ndb.transaction_async(backup_transaction,retries=0))
	for rpc in rpcs: rpc.wait()

class AllCron(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,mname):
		if mname=="user":
			for n in range(1,101):
				deferred.defer(all_user_cron,n,_queue="important")
		if mname=="mail":
			for n in range(1,101):
				deferred.defer(all_mail_cron,n,_queue="important")
		if mname=="character":
			for n in range(1,101):
				deferred.defer(all_character_cron,n,_queue="important")
		if mname=="backups":
			#originally, backups were on-access, but they need to be all at the same time, so a reversal restores the ~whole state of the game [19/11/18]
			for n in range(1,101):
				deferred.defer(all_ubackup_cron,n,_queue="important")
				deferred.defer(all_cbackup_cron,n,_queue="important")
		if mname=="process_backups":
			for n in range(1,101):
				deferred.defer(all_process_cron,n,_queue="important")
	def post(self,mname): self.get(mname)

class CheckServers(webapp.RequestHandler):
	@ndb.toplevel
	def get(self): check_servers()
	def post(self): self.get()

class UnstuckPlayers(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		servers=get_servers()
		for server in servers:
			if msince(server.created)>10: #no widespread network issue
				characters=Character.query(Character.online==True, Character.server == server.k(), Character.last_sync < datetime.now()-timedelta(minutes=30)).fetch()
				for character in characters:
					m=msince(character.last_sync)
					character.online=False
					character.server=""
					character.put()
					send_email(gdi(),"kaansoral@gmail.com",html="Stuck for %s minutes"%m,title="UNSTUCK %s from %s"%(character.name,server.k()))

	def post(self): self.get()

class Hourly(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		deferred.defer(verify_steam_installs)
		return
		if random.randrange(0,20)==2:
			user=get_by_iid("user|%s"%get_character("Wizard").owner)
			if random.randrange(0,20)==2:
				add_cash(user,100*random.randrange(1,50))
			else:
				add_cash(user,200)
		if random.randrange(0,20)==2:
			user=get_by_iid("user|%s"%get_character("Oragon").owner)
			if random.randrange(0,20)==2:
				add_cash(user,100*random.randrange(1,50))
			else:
				add_cash(user,200)
		#user=get_by_iid("user|%s"%get_character("Trexnamedtod").owner)
		#add_cash(user,25)
		#user=get_by_iid("user|%s"%get_character("Emerald").owner)
		#add_cash(user,5)
	def post(self): self.get()

application = webapp.WSGIApplication([
	('/cr/check_servers', CheckServers),
	('/cr/hourly', Hourly),
	('/cr/unstuck', UnstuckPlayers),
	('/cr/all/([^/]*)/?', AllCron),
	],debug=is_sdk)