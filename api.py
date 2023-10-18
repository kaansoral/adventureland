from config import *
from functions import *

def signup_or_login_api(**args):
	#time.sleep(10)
	self,domain,email,password,only_login,only_signup,mobile=gdmuld(args,"self","domain","email","password","only_login","only_signup","mobile")
	logging.info("Signup or Login")
	
	try: email=purify_email(email)
	except: return jhtmle(self,"Invalid Email")

	if not password:
		jjson(self,{"type":"eval","code":"$('.passwordui').show()"})
		jhtmle(self,"No Password Entered");
		return

	existing=get_user(email=email,phrase_check=True)

	if existing and existing.server:
		if msince(existing.last_online)>15 and msince(gf(existing,"last_auth",really_old))>15: pass # [15/05/22]
		else: jhtmle(self,"Can't login while inside the bank"); return
	if not domain.electron and not only_login and not domain.is_sdk: jhtmle(self,"Can't signup on web"); return
	
	if existing and not only_signup:
		if existing.password==hash_password(password,gf(existing,"salt","5")):
			def login_transaction():
				user=get_by_iid(existing.k('i'))
				auth=get_new_auth(self,user,domain)
				user.put()
				return user,auth
			user=ndb.transaction(login_transaction,xg=True,retries=12)
			if user:
				user,auth=user
				set_cookie(self,"auth","%s-%s"%(user.k(),auth))
				if mobile:
					return jhtml(self,[{"type":"refresh"}]);
				jhtml(self,[
					{"type":"message","message":"Logged In!" },
					selection_info(self,user,domain),
					])
			else:
				jhtmle(self,"Login Failed. Please Retry Later.")
			return
		jjson(self,{"type":"eval","code":"$('.passwordui').show()"})
		jhtmle(self,"Wrong Password")
		return

	if not email: return jhtmle(self,"No Email Entered")

	if only_login: return jhtmle(self,"Email Not Found In Records")
	
	signupth=get_signupth()
	ip=get_ip_info(self)
	referrer=get_referrer(self,ip)

	if gf(ip,"limit_signups",0)>=3: return jhtmle(self,"Too many signups from this IP. Please wait a couple hours or use a non-public network")

	if only_signup and existing:
		return jhtmle(self,"Email already signed up! Please login instead.")

	def signup_transaction():
		markedphrase=get_by_iid("markedphrase|%s"%dgt("email",email))
		if markedphrase: return False
		salt=randomStr(20)
		hpassword=hash_password(password,salt)
		user=User(name="#%s"%signupth,password=hpassword,email=[email],info=cGG(gold=1000,salt=salt))
		user.referrer=(referrer and "%s"%referrer.k()) or ""
		user.info.signupth=signupth
		user.info.email=email
		user.info.ip=get_ip(self); user.info.country=get_country(self)
		user.info.characters=[]; user.info.slots=5
		if domain.electron: user.info.slots=8
		user.info.items=[]
		user.info.everification=randomStr(12)
		auth=get_new_auth(self,user,domain)
		user.put()
		mark_phrase(user,"email",email)
		return user,auth
	user=ndb.transaction(signup_transaction,xg=True,retries=12)

	if not user: return jhtmle(self,"Signup Failed")
	
	user,auth=user
	set_cookie(self,"auth","%s-%s"%(user.k(),auth))
	send_verification_email(domain,user)
	jhtml(self,[
		{"type":"success","message":"Signup Complete!" },
		selection_info(self,user,domain),
		])
	add_event(user,"signup",["new","noteworthy"],self=self,info=cGG(message="Signup %s"%(user.info.email)),async=True)
	increase_signupth()

	try:
		ip=get_ip_info(self)
		ip.info.limit_signups=gf(ip,"limit_signups",0)+1
		put_ip_info(ip,user=user)
	except:
		log_trace()

def settings_api(**args):
	self,domain,user,setting,value=gdmuld(args,"self","domain","user","setting","value")
	if not user: return
	if user.server: return jhtmle(self,"Can't make changes while inside the bank")
	def setting_transaction():
		nuser=get_by_iid(user.k('i'))
		if setting=="email":
			if value: nuser.info.dont_send_emails=False
			else: nuser.info.dont_send_emails=True
			domain.section="email"
		nuser.put()
		return nuser
	user=ndb.transaction(setting_transaction,xg=True,retries=0)
	jhtml(self,[
		{"type":"success","message":"Setting changed!" },
		selection_info(self,user,domain),
		])

def change_email_api(**args):
	self,domain,user,email=gdmuld(args,"self","domain","user","email")
	if not user: return

	try: email=purify_email(email)
	except: return jhtmle(self,"Invalid Email")

	existing=get_user(email=email,phrase_check=True)

	if existing:
		if existing.k()!=user.k(): return jhtmle(self,"Email might be registered to someone else")
		if gf(user,"verified",0): return jhtmle(self,"This email is already verified")

	if user.server: return jhtmle(self,"Can't make changes while inside the bank")
	if gf(user,"last_email_change") and hsince(gf(user,"last_email_change"))<18: jhtmle(self,"You can change your email once every 18 hours"); return
	def change_email_transaction():
		delete_phrase_mark("email",user.info.email)
		markedphrase=get_by_iid("markedphrase|%s"%dgt("email",email))
		if markedphrase: return False
		nuser=get_by_iid(user.k('i'))
		nuser.email=[email]
		nuser.info.email=email
		nuser.info.last_email_change=datetime.now()
		if gf(nuser,"verified",0): del nuser.info.verified
		nuser.info.everification=randomStr(12)
		nuser.put()
		mark_phrase(nuser,"email",email)
		return nuser

	user=ndb.transaction(change_email_transaction,xg=True,retries=2)
	if not user: return jhtmle(self,"Operation failed")
	send_verification_email(domain,user)
	jhtml(self,[
		{"type":"success","message":"Email changed! Verification email re-sent. Refresh the page."},
		selection_info(self,user,domain),
		])

def change_password_api(**args):
	self,domain,user,epass,newpass1,newpass2=gdmuld(args,"self","domain","user","epass","newpass1","newpass2")
	if not user: return
	if user.server: return jhtmle(self,"Can't make changes while inside the bank")
	if user.password!=epass and user.password!=hash_password(epass,gf(user,"salt","5")): jhtmle(self,"Wrong Password"); return
	if not newpass1 or newpass1!=newpass2: jhtmle(self,"Passwords don't match"); return
	def password_transaction():
		nuser=get_by_iid(user.k('i'))
		nuser.info.salt=randomStr(20)
		nuser.password=hash_password(newpass1,nuser.info.salt)
		nuser.put()
		return nuser
	user=ndb.transaction(password_transaction,xg=True,retries=0)
	jhtml(self,[
		{"type":"success","message":"Password changed!" },
		selection_info(self,user,domain),
		])

def reset_password_api(**args):
	self,domain,id,key,newpass1,newpass2=gdmuld(args,"self","domain","id","key","newpass1","newpass2")
	if not newpass1 or newpass1!=newpass2: jhtmle(self,"Passwords don't match"); return
	user=get_by_iid("user|%s"%id)
	if not user or gf(user,"password_key")!=key: jhtmle(self,"Invalid key"); return
	if user.server: return jhtmle(self,"Can't make changes while inside the bank")
	def password_transaction():
		nuser=get_by_iid(user.k('i'))
		nuser.info.salt=randomStr(20)
		nuser.password=hash_password(newpass1,nuser.info.salt)
		nuser.info.password_key=randomStr(20)
		nuser.put()
		return nuser
	user=ndb.transaction(password_transaction,xg=True,retries=0)
	jhtmls(self,"New password set!")

def password_reminder_api(**args):
	self,domain,email=gdmuld(args,"self","domain","email")
	try: email=purify_email(email)
	except: jhtmle(self,"Invalid Email"); return
	existing=get_user(email=email,phrase_check=True)
	if not existing: jhtmle(self,"Email not found"); return
	if existing.server: return jhtmle(self,"Can't make changes while inside the bank")
	if hsince(gf(existing,"last_password_reminder",really_old))<24: jhtmle(self,"Already sent a reminder recently (24 hours)"); return
	def pmark_transaction():
		user=get_by_iid(existing.k('i'))
		user.info.last_password_reminder=datetime.now()
		user.info.password_key=randomStr(20)
		user.put()
		return user
	user=ndb.transaction(pmark_transaction,xg=True,retries=2)
	send_password_reminder_email(domain,user)
	jhtmls(self,"Emailed password reset instructions")

def account_change_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	jhtmlm(self,"Coming Soon: Re-Verification, Email Change, Password Change - For now, if you need something, just email hello@adventure.land")

def log_error_api(**args):
	self,domain,user,server,type,err,info=gdmuld(args,"self","domain","user","server","type","err","info")
	logging.info(server)
	if user and type not in ["api_call_error"]: return
	if server and type not in ["appengine_call_error"]: return
	if user:
		add_event(user,"client_error",["error",type],self=self,info=cGG(message="[%s] %s"%(type,err),info=info))
	if server:
		add_event(server,"server_error",["error",type],self=self,info=cGG(message="[%s] %s"%(type,err),info=info))
	jhtml(self)

def servers_and_characters_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	if not user: jhtmle(self,"No User"); return

	user_data=get_user_data(user) #no need for async, as get_user prefetches the data

	characters_data=get_characters(user)
	characters=characters_to_client(characters_data)
	
	servers_data=get_servers()
	servers=servers_to_client(domain,servers_data)

	mail=gf(user_data,"mail",0)
	
	logging.info("servers_and_characters")
	jhtml(self,[{"type":"servers_and_characters","servers":servers,"characters":characters,"tutorial":data_to_tutorial(user_data),"code_list":gf(user_data,"code_list",{}),"mail":mail,"rewards":gf(user,"rewards",[])}])

def save_code_api(**args):
	self,domain,user,code,slot,name,log,auto,electron=gdmuld(args,"self","domain","user","code","slot","name","log","auto","electron")
	if not user: return
	to_delete=False; old_name=name; character=None
	data=get_user_data(user)
	if not gf(data,"code_list"): data.info.code_list={}
	if not code: code=""
	if not slot:
		jhtmle(self,"CODE save operation failed. No slot provided")
	try:
		slot=int(slot); found=False
		for c in gf(user,"characters",[]):
			if int(c["id"])==slot:
				found=True
				character=c["name"]
		if data.info.code_list.get(slot) and name=="DELETE": found=True
		if not found: slot=max(1,min(100,slot))
	except:
		return jhtmle(self,"Slot needs to be a number")
	if not name: name=data.info.code_list.get(slot,[None])[0]
	if not name: name="%s"%(character or slot)
	old_name=data.info.code_list.get(slot,[name])[0]
	name=to_filename(name)[:100] #without this, one could duplicate items [23/10/18]
	#if slot>2 and not gf(user,"code_unlocked"): jhtmlc(self,"An 'Ancient Computer' unlocks code slots 3 to 100. You can freely use slots 1 and 2.","#3386CF"); return
	try:
		def save_transaction():
			idata=get_user_data(user)
			if not gf(idata,"code_list"): idata.info.code_list={}
			if name=="DELETE":
				try:
					del idata.info.code_list[slot]
					ndb.Key(InfoElement,"USERCODE-%s-%s"%(user.k(),slot)).delete()
				except: pass
			else:
				InfoElement(key=ndb.Key(InfoElement,"USERCODE-%s-%s"%(user.k(),slot)),info=cGG(code=code)).put()
				idata.info.code_list[slot]=[name,int(idata.info.code_list.get(slot,[None,0])[1])+1]
				logging.info("Slot changed from %s to %s"%(idata.info.code_list.get(slot,None),name))
			idata.put()
			return idata
		result=ndb.transaction(save_transaction,xg=True,retries=2)
		if result: data=result
	except:
		log_trace()
		return jhtmle(self,"CODE save operation failed. If your CODE is larger than 1MB, you need to shrink it, otherwise retry in a minute.")
	if name=="DELETE":
		jjson(self,{"type":"code_info","num":slot,"delete":True});
		if not electron: jeval(self,"code_slot=0;code_change=false;")
		if log: jhtmlc(self,"Deleted %s.%s.js"%(old_name,slot),"gray")
		else: jhtmlchat(self,"Deleted %s.%s.js"%(old_name,slot),"gray")
	else:
		jjson(self,{"type":"code_info","num":slot,"name":data.info.code_list[slot][0],"v":data.info.code_list[slot][1]});
		if not electron: jeval(self,"code_slot=%s;code_change=false;"%(slot))
		if log: jhtmlc(self,"Saved %s.%s.js"%(name,slot),"#E13758")
		elif auto and character: jhtmlc(self,"Auto-saved [%s]"%(character),"#96E8A7")
		elif auto: jhtmlc(self,"Auto-saved %s.%s.js"%(name,slot),"#96E8A7")
		else: jhtmlchat(self,"Saved %s.%s.js"%(name,slot),"#E13758")

def load_code_api(**args):
	self,domain,user,name,run,log,pure,save=gdmuld(args,"self","domain","user","name","run","log","pure","save")
	name=to_filename("%s"%name)
	if not user: return
	data=get_user_data(user)
	if name in [0,"0"]:
		if pure: return shtml("htmls/contents/codes/default_code.js")
		jjson(self,{"type":"code","code":shtml("htmls/contents/codes/default_code.js"),"run":run,"slot":0,"save":save});
		if save: jhtml(self)
		elif log: jhtmlc(self,"Loaded the default code","#32A3B0")
		else: jhtmlchat(self,"Loaded the default code","#32A3B0")
		return
	for slot in gf(data,"code_list",{}):
		if str(slot)=="%s"%name or ("%s"%data.info.code_list[slot][0]).lower()==("%s"%name).lower():
			code=ndb.Key(InfoElement,"USERCODE-%s-%s"%(user.k(),slot)).get()
			if code:
				if pure: return code.info.code
				jjson(self,{"type":"code","code":code.info.code,"run":run,"slot":slot,"save":save,"name":data.info.code_list[slot][0],"v":data.info.code_list[slot][1]});
				if save: jhtml(self)
				elif log: jhtmlc(self,"Loaded %s.%s.js"%(data.info.code_list[slot][0],slot),"#32A3B0")
				else: jhtmlchat(self,"Loaded %s.%s.js"%(data.info.code_list[slot][0],slot),"#32A3B0")
				return
	if pure: return "say('Code not found'); set_status('Not Found')"
	jhtmlchat(self,"Not Found","#AD3844")

def load_libraries_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	jjson(self,{
		"type":"libraries",
		"default_code":shtml("htmls/contents/codes/default_code.js"),
		"runner_functions":shtml("htmls/contents/codes/runner_functions.js"),
		"runner_compat":shtml("htmls/contents/codes/runner_compat.js"),
		"common_functions":shtml("htmls/contents/codes/common_functions.js")
	});
	jhtml(self)

def tutorial_api(**args):
	self,domain,user,task,step=gdmuld(args,"self","domain","user","task","step")
	def data_transaction():
		data=get_user_data(user)
		if task:
			if task in docs["tasks"] and task not in data.info.completed_tasks:
				data.info.completed_tasks.append(task)
				data.put()
				return ["Task '%s' Complete!"%docs["tasks"][task],"#85C76B",data,1]
			else:
				if task in docs["tasks"]: return ["Task '%s' Complete!"%docs["tasks"][task],"gray",data,1]
				else: return ["Invalid task '%s'"%task,"gray",data,0]
		else:
			data.info.tutorial_step=int(step)
			data.put()
			return ["Lesson '%s' Complete!"%docs["tutorial"][int(step)-1]["title"],"#85C76B",data,2]
	result=ndb.transaction(data_transaction,xg=True,retries=2)
	if result:
		info=data_to_tutorial(result[2]);
		info["type"]="tutorial_data"
		if result[3]==1: info["success"]=True
		if result[3]==2: info["next"]=True
		jjson(self,info)
		jhtmlc(self,result[0],result[1])
	else:
		jhtmle(self,"Failed")

def reset_tutorial_api(**args):
	self,domain,user,task,step=gdmuld(args,"self","domain","user","task","step")
	def data_transaction():
		return reset_tutorial(user)
	result=ndb.transaction(data_transaction,xg=True,retries=2)
	if result:
		info=data_to_tutorial(result)
		info["type"]="tutorial_data"
		jjson(self,info)
		jhtmlc(self,"Tutorial Reset!","#F7B32F")
	else:
		jhtmle(self,"Failed")

def load_map_api(**args):
	self,domain,user,key=gdmuld(args,"self","domain","user","key")
	map=get_by_iid("map|%s"%key)
	if not map or not gf(map,"resort"): jhtmlc(self,"Deck not found","#AE384D")
	jjson(self,{"type":"map","data":map.info.data,"run":run})
	jhtml(self)

def load_article_api(**args):
	#logging.info(col)
	self,domain,user,name,func,tutorial,guide,url=gdmuld(args,"self","domain","user","name","func","tutorial","guide","url")
	if tutorial: jjson(self,{"type":"article","html":shtml("docs/tutorial/%s.html"%name),"tutorial":tutorial,"url":url}) 
	elif guide:
		from docs.directory import docs
		col=[]; prev=None; next=None; found=False
		def traverse(entry):
			if type(entry[0])==type([]):
				for e in entry:
					traverse(e)
			else:
				if len(entry)==5 and entry[4]:
					traverse(entry[4])
				else:
					col.append(entry[0])
		traverse(docs["guide"])
		#logging.info(col)
		for i in xrange(0,len(col)):
			if col[i]==name:
				found=True
				if i+1!=len(col): next=col[i+1]
				break
			prev=col[i]
		#logging.info([prev,next])
		try: jjson(self,{"type":"article","html":shtml("docs/guide/%s.html"%name),"guide":guide,"url":url,"prev":found and prev,"next":found and next}) 
		except: jjson(self,{"type":"article","html":shtml("docs/articles/%s.html"%name),"url":url,"prev":found and prev,"next":found and next})
	elif func: jjson(self,{"type":"article","html":shtml("docs/functions/%s.html"%name),"func":name,"url":url}) 
	else: jjson(self,{"type":"article","html":shtml("docs/articles/%s.html"%name),"url":url})
	jhtml(self)

def load_gcode_api(**args):
	self,domain,user,file,run=gdmuld(args,"self","domain","user","file","run")
	if run: jjson(self,{"type":"code","code":shtml("docs%s"%file),"run":True})
	else: jjson(self,{"type":"gcode","code":shtml("docs%s"%file)})
	jhtml(self)

def list_codes_api(**args):
	self,domain,user,purpose=gdmuld(args,"self","domain","user","purpose")
	if not user: return
	data=get_user_data(user)
	jhtml(self,[{"type":"code_list","purpose":purpose,"list":gf(data,"code_list",{})}])

def can_create_character(self,user):
	ip=get_ip_info(self)
	if user.pid: user.info.slots=max(gf(user,"slots",8),8)
	if gf(ip,"limit_create_character",0)>12: return False,"ip"
	if len(gf(user,"characters",[]))>=18: return False,"abs"
	if len(gf(user,"characters",[]))>=gf(user,"slots",5):
		if user.cash>=200: return True,True
		return False,"limit"
	return True,True

def is_name_allowed(name):
	try:
		if int(name): return False
	except: pass
	for c in name:
		if c not in allowed_name_characters:
			return False
	if len(name)<4: return False
	if len(name)>12: return False
	return True

def create_character_api(**args):
	self,domain,user,name,char,look=gdmuld(args,"self","domain","user","name","char","look")
	if char not in character_types: jhtmle(self,"Character type not allowed"); return
	if len(classes[char]["looks"])<=int(look): jhtmle(self,"Invalid look"); return
	#if gender not in gender_types: jhtmle(self,"Gender unknown"); return
	if not name: jhtmle(self,"Please enter a name"); return
	name=name.replace(" ","").replace("\t","")
	if not is_name_allowed(name): jhtmle(self,"Invalid character name, may be too short, too long, or include invalid characters"); return
	if get_character(name,phrase_check=True): jhtmlm(self,"%s is used"%name); return
	if user.server: return jhtmle(self,"Can't make changes while inside the bank")
	creatable,reason=can_create_character(self,user)
	if not creatable:
		if reason=="ip": jhtmle(self,"Too many characters from this IP. Please wait a couple hours or use a non-public network"); return
		if reason=="abs": jhtmle(self,"You can't create more than 18 characters"); return
		jhtmlm(self,"You've reached the current limit of free characters. You can freely create 5 characters. Delete a character you don't want to use. Recreate another character."); return
	characterth=get_characterth()
	def new_character_transaction():
		markedphrase=get_by_iid("markedphrase|%s"%dgt("character",simplify_name(name)))
		owner=get_by_iid(user.k('i'))
		if markedphrase: return False
		base=classes[char]
		character=Character(name=simplify_name(name),owner=user.k(),type=char,referrer=owner.referrer,info=GG())
		character.info.characterth=characterth
		character.info.name=name
		character.info.gold=0
		character.info.items=[{"name":"hpot0","q":200,"gift":1},{"name":"mpot0","q":200,"gift":1}]
		character.info.slots=copy.deepcopy(base["base_slots"])
		if 1:
			character.info.slots["helmet"]={"name":"helmet","level":0,"gift":1}
			character.info.slots["shoes"]={"name":"shoes","level":0,"gift":1}
		character.info.stats={}
		#character.info.gender=gender
		character.info.skin=base["looks"][look][0]
		character.info.cx=base["looks"][look][1]
		character.info.map="main"
		setattr(character.info,"in","main")
		character.info.x,character.info.y=maps["main"]["spawns"][maps["main"].get("on_death",["main",0])[1]]
		character.put()
		if not len(owner.info.characters): owner.name=name
		if len(owner.info.characters)>=gf(owner,"slots",5):
			owner.info.slots=gf(owner,"slots",5)+1
			owner.cash-=200
		owner.info.characters.append(character_to_dict(character))
		if not owner.name or owner.name.startswith("#"): owner.name=name
		if not gf(owner,"server_data"):
			logging.info("created Player for %s"%owner.k())

		owner.put()
		mark_phrase(character,"character",simplify_name(name))
		return character,owner
	character=ndb.transaction(new_character_transaction,xg=True,retries=12)
	if not character: jhtmle(self,"Creation Failed"); return
	character,owner=character
	try:
		ip=get_ip_info(self)
		ip.info.limit_create_character=gf(ip,"limit_create_character",0)+1
		put_ip_info(ip,user=user,character=character)
	except:
		log_trace()
	jhtml(self,[
		{"type":"success","message":"%s is alive!"%name },
		selection_info(self,owner,domain),
		])
	add_event(owner,"new_character",["characters","noteworthy"],self=self,info=cGG(message="New Character %s from %s"%(character.info.name,user.info.email)),backup=True,async=True)
	increase_characterth()

def sort_characters_api(**args):
	self,domain,user,l=gdmuld(args,"self","domain","user","characters")
	if not user: return
	rest=Character.query(Character.owner==user.k()).fetch(100)
	characters=[]
	for name in ("%s"%l).split(","):
		for c in rest:
			if simplify_name(name)==simplify_name(c.name):
				characters.append(c)
				rest.remove(c)
				break
	characters.extend(rest)
	# for c in characters:
	# 	logging.info(c.name)
	# jhtmls(self,"OK")
	def sort_transaction():
		owner=get_by_iid(user.k('i')); first=False; firstp=False
		owner.info.characters=[]
		for c in characters:
			if not first: owner.name=c.info.name; first=True
			if not firstp and not c.private: owner.name=c.info.name; firstp=True
			owner.info.characters.append(character_to_dict(c))
		owner.info.transfer_auth=randomStr(10)
		owner.put()
		return owner
	result=ndb.transaction(sort_transaction,xg=True,retries=1)
	if result:
		jhtml(self,[
			{"type":"message","message":"Done!"},
			selection_info(self,result,domain),
			])
	else:
		jhtmlm(self,"Something went wrong")

def is_name_xallowed(name):
	try:
		if int(name): return False
	except: pass
	for c in name:
		if c not in allowed_name_characters:
			return False
	if len(name)<1: return False
	if len(name)>12: return False
	return True

def quote_name_api(**args):
	self,domain,user,name,nname=gdmuld(args,"self","domain","user","name","nname")

	if not nname or not is_name_xallowed(nname): return jhtmle(self,"Invalid name")
	if get_character(nname,phrase_check=True): return jhtmle(self,"%s is used"%nname)

	character=get_character(name)

	price=400
	if len(nname)==1: price=160000
	elif len(nname)==2: price=48000
	elif len(nname)==3: price=24000
	elif len(nname)==4: price=2400
	else:
		if character and not gf(character,"last_rename",None) and (character.level<60 or hsince(character.created)<72): price=0
		price=640
	jeval(self,"show_alert('Costs %s shells')"%to_pretty_num(price)); jhtml(self)

def rename_character_api(**args):
	self,domain,user,name,nname=gdmuld(args,"self","domain","user","name","nname")

	character=get_character(name)
	if not character: return jhtmle(self,"No character with that name.")
	if character.owner!=user.k(): return jhtmle(self,"You don't own that character.")
	if is_in_game(character): return jhtmle(self,"Character is in game.")
	if hsince(gf(character,"last_rename",really_old))<32: return jhtmle(self,"You can rename once every 32 hours!")
	
	if not nname or not is_name_xallowed(nname): return jhtmle(self,"Invalid name")
	if get_character(nname,phrase_check=True): return jhtmle(self,"%s is used"%nname)

	if user.server: return jhtmle(self,"Can't make changes while inside the bank")

	price=400
	if len(nname)==1: price=160000
	elif len(nname)==2: price=48000
	elif len(nname)==3: price=24000
	elif len(nname)==4: price=2400
	else:
		if not gf(character,"last_rename",None) and (character.level<60 or hsince(character.created)<72): price=0
		price=640
		
	if user.cash<price: return jhtmle(self,"Not enough shells")

	def rename_character_transaction():
		if get_by_iid("markedphrase|%s"%dgt("character",simplify_name(nname))): return None
		owner=get_by_iid(user.k('i'))
		c=get_by_iid(character.k('i'))
		if c.name==simplify_name(nname): return None #Probably a fast double click
		i=0
		for ch in owner.info.characters:
			if simplify_name(ch["name"])==simplify_name(name):
				owner.info.characters[i]["name"]=nname
			i+=1
		if simplify_name(owner.name)==simplify_name(name):
			owner.name=nname
		owner.info.last_rename=datetime.now()
		owner.cash-=price
		owner.put()
		c.info.names=gf(c,"names",[])
		c.info.names.append(c.name)
		delete_phrase_mark("character",c.name)
		c.info.name=nname
		c.name=simplify_name(nname)
		c.info.last_rename=datetime.now()
		mark_phrase(character,"character",simplify_name(nname))
		if is_in_game(c): raise "gg"
		c.put()
		return owner
	result=ndb.transaction(rename_character_transaction,xg=True,retries=4)
	if result:
		add_event(character,"rename_character",["characters"],self=self,info=cGG(message="%s renamed to %s"%(name,nname)),backup=True)
		jhtml(self,[
			{"type":"message","message":"Spent %s shells"%to_pretty_num(price)},
			{"type":"message","message":"%s renamed to %s"%(name,nname)},
			selection_info(self,result,domain),
			])
	else:
		jhtmlm(self,"You can't ")

def transfer_character_api(**args):
	self,domain,user,name,id,auth=gdmuld(args,"self","domain","user","name","id","auth")
	character=get_character(name)
	if not character: jhtmle(self,"No character with that name."); return
	if character.owner!=user.k(): jhtmle(self,"You don't own that character."); return
	if is_in_game(character): jhtmle(self,"Character is in game."); return
	receiver=get_by_iid("user|%s"%id)
	if not receiver or gf(receiver,"transfer_auth")!=auth: return jhtmle(self,"Receiver not found or wrong auth")
	if user.server or receiver.server: return jhtmle(self,"Can't make changes while inside the bank")
	if user.cash<500: return jhtmle(self,"Not enough shells")
	def transfer_character_transaction():
		owner=get_by_iid(user.k('i'))
		c=get_by_iid(character.k('i'))
		if c.owner!=user.k(): return None #Probably a fast double click
		new_characters=[]
		for ch in owner.info.characters:
			if simplify_name(ch["name"])!=simplify_name(name):
				new_characters.append(ch)
		owner.info.characters=new_characters
		if simplify_name(owner.name)==simplify_name(name):
			if len(owner.info.characters): owner.name=owner.info.characters[0]["name"]
			else: owner.name="#%s"%owner.info.signupth
		owner.info.last_delete=datetime.now()
		owner.cash-=500
		owner.put()
		c.info.transfer=True
		c.owner=receiver.k()
		c.pid=""; c.platform=""
		try:
			if hasattr(c.info,"p"):
				if c.info.p.get("steam_id",0): del c.info.p["steam_id"]
				if c.info.p.get("mas_auth_id",0): del c.info.p["mas_auth_id"]
		except:
			log_trace()
		if is_in_game(c): raise "gg"
		c.put()
		nowner=get_by_iid(receiver.k('i'))
		nowner.info.characters.append(character_to_dict(c))
		nowner.put()
		return owner
	result=ndb.transaction(transfer_character_transaction,xg=True,retries=4)
	if result:
		add_event(character,"transfer_character",["characters"],self=self,info=cGG(message="%s transferred %s to %s"%(user.name,name,id)),backup=True)
		jhtml(self,[
			{"type":"message","message":"%s flew away ..."%name },
			selection_info(self,result,domain),
			])
	else:
		jhtmlm(self,"Something went wrong")

def delete_character_api(**args):
	self,domain,user,name=gdmuld(args,"self","domain","user","name")
	character=get_character(name)
	if not character: jhtmle(self,"No character with that name."); return
	if character.owner!=user.k(): jhtmle(self,"You don't own that character."); return
	if is_in_game(character): jhtmle(self,"Character is in game."); return
	if user.server: return jhtmle(self,"Can't make changes while inside the bank")
	if not is_sdk and msince(gf(user,"last_delete",really_old))<180: jhtmlm(self,"You have to wait %d minutes to delete another character."%(180-msince(gf(user,"last_delete",really_old)))); return
	character.deleted=True
	add_event(character,"delete_character",["characters"],self=self,info=cGG(message="%s deleted %s"%(user.name,name)),backup=True)
	def delete_character_transaction():
		phrase=get_by_iid("markedphrase|%s"%dgt("character",simplify_name(name)))
		if phrase: phrase.key.delete()
		owner=get_by_iid(user.k('i'))
		data=get_user_data(owner)
		new_characters=[]
		for c in owner.info.characters:
			if simplify_name(c["name"])!=simplify_name(name):
				new_characters.append(c)
		owner.info.characters=new_characters
		if simplify_name(owner.name)==simplify_name(name):
			if len(owner.info.characters): owner.name=owner.info.characters[0]["name"]
			else: owner.name="#%s"%owner.info.signupth
		try:
			del data.info.code_list[int(character.k())]
			data.put()
		except: pass
		character.key.delete()
		owner.info.last_delete=datetime.now()
		owner.put()
		return owner
	result=ndb.transaction(delete_character_transaction,xg=True,retries=4)
	if result:
		jhtml(self,[
			{"type":"message","message":"%s is no more ..."%name },
			selection_info(self,result,domain),
			])
	else:
		jhtmlm(self,"Something went wrong")

def edit_character_api(**args):
	self,domain,user,name,operation=gdmuld(args,"self","domain","user","name","operation")
	character=get_character(name)
	if not character: jhtmle(self,"No character with that name."); return
	if character.owner!=user.k(): jhtmle(self,"You don't own that character."); return
	if is_in_game(character): jhtmle(self,"Character is in game."); return
	def edit_character_transaction():
		element=get_by_iid(character.k('i'))
		if operation=="toggle_privacy":
			element.private=not element.private
		element.put()
		return element
	result=ndb.transaction(edit_character_transaction,xg=True,retries=2)
	if result:
		message="Done!"
		if operation=="toggle_privacy":
			if result.private:
				message="Character is now private"
				if simplify_name(user.name)==result.name:
					message="%s WARNING: SORT YOUR CHARACTERS ONCE TO AUTO-CHANGE YOUR ACCOUNT NAME"%message
			else: message="Character isn't private anymore"
		jhtml(self,[
			{"type":"message","message":message},
			selection_info(self,user,domain),
			])
	else:
		jhtmlm(self,"Something went wrong")

def disconnect_character_api(**args):
	self,domain,user,name,selection=gdmuld(args,"self","domain","user","name","selection")
	character=get_character(name)
	if not character: jhtmle(self,"No character with that name."); return
	if character.owner!=user.k(): jhtmle(self,"You don't own that character."); return
	if not is_in_game(character): jhtmle(self,"Character is not in game."); return
	character_eval(character,"player.socket.disconnect()")
	jjson(self,{"type":"message","message":"Sent the disconnect signal to the server"})
	if selection: jjson(self,selection_info(self,user,domain))
	jhtml(self)

def logout_everywhere_api(**args): #TODO: Probably re-visit this [10/07/18]
	self,domain,user=gdmuld(args,"self","domain","user")
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	if user.server: jhtml(self,{"failed":1,"reason":"inthebank"}); return
	def logout_transaction():
		element=get_by_iid(user.k('i'))
		element.info.auths=[]
		element.put()
		return element
	result=ndb.transaction(logout_transaction,xg=True,retries=2)
	if result:
		delete_cookie(self,"auth")
		jhtmlm(self,"Logged Out Everywhere")
	else:
		jhtmlm(self,"Something went wrong")

def user_operation_api(**args):
	self,domain,user,server,operation,key=gdmuld(args,"self","domain","user","server","operation","key")
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	if user.server: jhtml(self,{"failed":1,"reason":"inthebank"}); return
	if operation=="code_unlock" and gf(user,"code_unlocked"): jhtml(self,{"failed":1,"reason":"already"}); return
	def user_operation_transaction():
		element=get_by_iid(user.k('i'))
		if operation=="code_unlock": element.info.code_unlocked=datetime.now()
		if operation=="unlock": #doesn't make sense here
			element.info.unlocked=gf(element,"unlocked",{})
			element.info.unlocked[key]=datetime.now()
		element.put()
		return element
	result=ndb.transaction(user_operation_transaction,xg=False,retries=4)
	if result:
		logging.info(result)
		jhtml(self,{"done":1})
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def is_first_api(**args):
	self,domain,user,server,auth_id=gdmuld(args,"self","domain","user","server","auth_id")
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	
	def first_transaction():
		markedphrase=get_by_iid("markedphrase|%s"%dgt("auth",auth_id))
		if markedphrase: return False
		mark_phrase(user,"auth",auth_id)
		return True

	result=ndb.transaction(first_transaction,xg=False,retries=6)
	if result and hsince(user.created)<100:
		logging.info(result)
		jhtml(self,{"first":1})
	else:
		jhtml(self,{})


def broadcast_api(**args):
	self,domain,server,event,data=gdmuld(args,"self","domain","server","event","data")
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	servers_eval("broadcast(data.event,JSON.parse(data.data))",{"event":event,"data":data})
	jhtml(self,{"done":1})

def ban_user_api(**args):
	self,domain,server,name=gdmuld(args,"self","domain","server","name"); days=21
	if not server: jhtml(self,{"failed":1,"reason":"noserver","result":"failed"}); return
	logging.info("GM BAN!")
	result=block_account(name,days,reason="GM Ban",toggle=True)
	jhtml(self,{"result":result})

def cli_time_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	amount=29; reason="cli_time"
	if user.cli_time and dsince(user.cli_time)<-30: return jhtmlm(self,"You can't purchase if you have more than 30 days You have: %.2d"%(-dsince(user.cli_time)))
	if not user: return jhtmlm(self,"No user")
	if user.server and not override: return jhtmlm(self,"Can't purchase in the bank")
	def bill_user_transaction():
		element=get_by_iid(user.k('i'))
		if amount>0 and element.cash<amount: return False
		element.cash-=amount
		if not element.cli_time or element.cli_time<datetime.now(): element.cli_time=datetime.now()
		element.cli_time=element.cli_time+timedelta(hours=24*7)
		element.put()
		return element
	result=ndb.transaction(bill_user_transaction,xg=True,retries=4)
	if result:
		logging.info(result)
		return jhtmlm(self,"Purchased 7 more days of CLI time for %s shells! You have: %.2d"%(amount,-dsince(result.cli_time)))
		if amount>0: add_event(result,"bill",["cashflow"],self=self,info=cGG(message="%s [%s] spent %s shells for: %s"%(name,user.k(),amount,reason),amount=amount,reason=reason),async=True)
		else: add_event(result,"ishells",["cashflow"],self=self,info=cGG(message="%s [%s] received %s shells from: %s"%(name,user.k(),-amount,reason),amount=-amount,reason=reason),async=True)
		try: deferred.defer(update_characters,result)
		except: log_trace()
	else:
		jhtmlm(self,"Purchase failed")

def bill_user_api(**args):
	self,domain,user,server,amount,reason,name,override=gdmuld(args,"self","domain","user","server","amount","reason","name","override")
	#amount=max(0,int(amount))
	amount=int(amount)
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	if user.server and not override: jhtml(self,{"failed":1,"reason":"inthebank"}); return
	def bill_user_transaction():
		element=get_by_iid(user.k('i'))
		if amount>0 and element.cash<amount: return False
		element.cash-=amount
		element.put()
		return element
	result=ndb.transaction(bill_user_transaction,xg=True,retries=4)
	if result:
		logging.info(result)
		jhtml(self,{"done":1,"cash":result.cash})
		if amount>0: add_event(result,"bill",["cashflow"],self=self,info=cGG(message="%s [%s] spent %s shells for: %s"%(name,user.k(),amount,reason),amount=amount,reason=reason),async=True)
		else: add_event(result,"ishells",["cashflow"],self=self,info=cGG(message="%s [%s] received %s shells from: %s"%(name,user.k(),-amount,reason),amount=-amount,reason=reason),async=True)
		try: deferred.defer(update_characters,result)
		except: log_trace()
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def can_reload_api(**args):
	self,domain,user,pvp,region,name=gdmuld(args,"self","domain","user","pvp","region","name")
	if not user: return jhtml(self,[])
	servers=get_servers()
	for server in servers:
		if server.region==region and name==server.name and (pvp and gf(server,"pvp") or not pvp and not gf(server,"pvp")):
			return jhtml(self,[{"type":"reload","ip":server.ip,"port":server.port}])
	return jhtml(self,[])

def pull_guild_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	online_chars=[]; server_name={}
	if not user: return
	servers=get_servers()
	for server in servers:
		server_name[server.k()]=server.region+" "+server.name
	online=Character.query(Character.guild == ""+user.guild,Character.online == True)
	for character in online:
		if character.private: continue
		friend={"name":character.info.name,"level":character.level,"type":character.type,"afk":gf(character,"afk",False),"owner_name":gf(character,"owner_name"),"owner":character.owner}
		if server_name.get(character.server):
			friend["server"]=server_name.get(character.server)
			online_chars.append(friend)
	jhtml(self,[{"type":"guild","chars":online_chars}])

def pull_friends_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	online_chars=[]; server_name={}
	if not user: return
	servers=get_servers()
	for server in servers:
		server_name[server.k()]=server.region+" "+server.name
	online=Character.query(Character.friends == ""+user.k(),Character.online == True)
	for character in online:
		if character.private: continue
		friend={"name":character.info.name,"level":character.level,"type":character.type,"afk":gf(character,"afk",False),"owner_name":gf(character,"owner_name"),"owner":character.owner}
		if server_name.get(character.server):
			friend["server"]=server_name.get(character.server)
			online_chars.append(friend)
	jhtml(self,[{"type":"friends","chars":online_chars}])

def pull_merchants_api(**args):
	self,domain,user=gdmuld(args,"self","domain","user")
	online_chars=[]; server_name={}
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	servers=get_servers()
	for server in servers:
		server_name[server.k()]=server.region+" "+server.name
	online=Character.query(Character.type=="merchant",Character.online == True)
	for character in online:
		if not gf(character,"p",0) or not character.info.p.get("stand",0): continue
		#logging.info(character.info.p["stand"])
		friend={"name":character.info.name,"level":character.level,"afk":gf(character,"afk",False),"skin":character.info.skin,"cx":gf(character,"cx",{}),"stand":character.info.p["stand"],"x":character.info.x,"y":character.info.y,"map":character.info.map,"server":character.server}
		friend["slots"]={}
		for i in xrange(1,1+48):
			if character.info.slots.get("trade%d"%i):
				friend["slots"]["trade%d"%i]=simplify_item(character.info.slots["trade%d"%i])
		if server_name.get(character.server):
			friend["server"]=server_name.get(character.server)
			online_chars.append(friend)
	jhtml(self,[{"type":"merchants","chars":online_chars}])

def read_mail_api(**args):
	self,domain,user,mail_id=gdmuld(args,"self","domain","user","mail")
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	user_data=get_user_data(user)
	def mail_transaction():
		mail=get_by_iid("mail|%s"%mail_id)
		if mail and not mail.read and gf(mail,"receiver")==user.k():
			mail.read=True
			mail.put()
			return True
	if ndb.transaction(mail_transaction,retries=1) or 1:
		old=gf(user_data,"mail",-1)
		user_data.info.mail=max(0,len(Mail.query(Mail.owner==user.k(),Mail.read==False).fetch(100,keys_only=True))-1)
		if old!=user_data.info.mail: user_data.put_async()
	jhtml(self,[{"type":"unread","count":user_data.info.mail}])

def simplify_item(item):
	x=item
	if type(x)==type('') or type(x)==type(u''):
		x=json.loads(x)
		for p in ["grace","gf","list","o","oo","src"]: #"price","b","rid","giveaway"
			if p in x:
				del x[p]
		x="%s"%json.dumps(x)
	else:
		for p in ["grace","gf","list","o","oo","src"]:
			if p in x:
				del x[p]
	return x

def pull_mail_api(**args):
	self,domain,user,cursor=gdmuld(args,"self","domain","user","cursor")
	data={"type":"mail","mail":[],"more":False,"cursor":None,"cursored":False}; page=40
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	if cursor:
		mails,new_cursor,new_more=Mail.query(Mail.owner==user.k()).order(-Mail.created).fetch_page(page,start_cursor=ndb.Cursor(urlsafe=cursor))
		data["cursored"]=True
	else:
		mails,new_cursor,new_more=Mail.query(Mail.owner==user.k()).order(-Mail.created).fetch_page(page)
	for mail in mails:
		mail_data={"fro":mail.fro,"to":mail.to,"message":mail.info.message,"subject":mail.info.subject,"sent":"%s"%mail.created,"id":mail.k()}
		if mail.item:
			mail_data["item"]=simplify_item(mail.info.item)
			mail_data["taken"]=mail.taken
		data["mail"].append(mail_data)
	if new_cursor: data["cursor"]=new_cursor.urlsafe()
	if new_more: data["more"]=True
	jhtml(self,[data])

def take_item_from_mail_api(**args):
	self,domain,server,owner,mid=gdmuld(args,"self","domain","server","owner","mid")
	user=get_by_iid("user|%s"%owner);
	mail=get_by_iid("mail|%s"%mid)
	if not server: return jhtml(self,{"failed":1,"reason":"noserver"})
	if not user: return jhtml(self,{"failed":1,"reason":"nouser"})
	if not mail: return jhtml(self,{"failed":1,"reason":"nomail"})
	def retrieve_item_transaction():
		m=get_by_iid(mail.k('i'))
		if not m.item or m.taken: return False
		m.taken=True
		m.put()
		return m.info.item
	result=ndb.transaction(retrieve_item_transaction,xg=True,retries=1)
	if result:
		jhtml(self,{"success":1,"item":result})
	else:
		jhtml(self,{"failed":1,"reason":"failed"})

def delete_mail_api(**args):
	self,domain,user,mid=gdmuld(args,"self","domain","user","mid")
	mail=get_by_iid("mail|%s"%mid)
	if not user or not mail or not user.k() in mail.owner: return jhtmle(self,"Can't delete.")
	mail.key.delete()
	jhtmlm(self,"Mail deleted.")

def send_mail_api(**args):
	self,domain,fro,to,server,subject,message,rid,item,type=gdmuld(args,"self","domain","fro","to","server","subject","message","rid","item","type")
	if fro: frop=get_character(fro);
	top=get_character(to)
	if fro and not frop or not top: return jhtml(self,{"failed":1,"reason":"nocharacter","return":True})
	if fro: user1=get_by_iid_async("user|%s"%frop.owner);
	user2=get_by_iid("user|%s"%top.owner)
	ud2=get_user_data(user2,async=True); c2=Mail.query(Mail.owner==user2.k(),Mail.read==False).fetch_async(98,keys_only=True)
	if fro: user1=user1.get_result()
	if not server: return jhtml(self,{"failed":1,"reason":"noserver"})
	if fro and not user1 or not user2: return jhtml(self,{"failed":1,"reason":"nouser","return":True})
	try:
		subject=unicodedata.normalize('NFD',subject).encode('ascii','ignore')
		if len(subject)>72: subject=subject[:72]+".."
		message=unicodedata.normalize('NFD',message).encode('ascii','ignore')[:1000]
		if len(message)>1000: message=message[:1000]+"[truncated-too-long]"
	except:
		log_trace_i()
		return jhtml(self,{"failed":1,"reason":"englishification_failed","return":True})
	def send_mail_transaction():
		mail=ndb.Key(Mail,rid).get()
		if mail: return mail
		if type=="system":
			mail=Mail(fro="mainframe",to=to,type="system",owner=[user2.k()],info=cGG(message=message,subject=subject,sender="!",receiver=user2.k()),key=ndb.Key(Mail,rid))
		else:
			mail=Mail(fro=fro,to=to,type="mail",owner=[user1.k(),user2.k()],info=cGG(message=message,subject=subject,sender=user1.k(),receiver=user2.k()),key=ndb.Key(Mail,rid))
		if item:
			mail.item=True
			mail.info.item=item
			mail.taken=False
		mail.put()
		return mail
	result=ndb.transaction(send_mail_transaction,xg=True,retries=24)
	if result:
		ud2=ud2.get_result(); ud2=process_user_data(user2,ud2); ud2.info.mail=len(c2.get_result())+1; ud2.put_async()
		jhtml(self,{"success":1})
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def pull_messages_api(**args):
	self,domain,user,type,cursor=gdmuld(args,"self","domain","user","type","cursor")
	if not type: type="all"
	data={"type":"messages","messages":[],"more":False,"cursor":None,"cursored":False,"mtype":type}; page=200
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	query=Message.query()
	if type in ["private","party"]:
		query=query.filter(Message.owner==user.k())
		query=query.filter(Message.type==type)
	elif type=="all":
		query=query.filter(Message.owner==user.k())
	else:
		query=query.filter(Message.owner=="~%s"%type)
	query=query.order(-Message.created)
	if cursor:
		messages,new_cursor,new_more=query.fetch_page(page,start_cursor=ndb.Cursor(urlsafe=cursor))
		data["cursored"]=True
	else:
		messages,new_cursor,new_more=query.fetch_page(page)
	for message in messages:
		m_data={"fro":message.fro,"to":message.to,"message":message.info.message,"type":message.type,"id":message.k(),"server":message.server,"date":"%s"%message.created.strftime('%Y-%m-%dT%H:%M:%SZ')}
		data["messages"].append(m_data)
		#logging.info(m_data)
	if new_cursor: data["cursor"]=new_cursor.urlsafe()
	if new_more: data["more"]=True
	jhtml(self,[data])

def log_chat_api(**args):
	self,domain,server,fro,to,type,message,author=gdmuld(args,"self","domain","server","fro","to","type","message","author")
	if not server: return jhtml(self,{"failed":1,"reason":"noserver"})
	
	if type=="server":
		Message(owner="~%s"%server.k(),author=author,fro=fro,type="server",info=cGG(message=message),server=server.k()).put()
		Message(owner="~global",author=author,fro=fro,type="server",info=cGG(message=message),server=server.k()).put()
	elif type=="private":
		Message(owner=to[0],author=author,fro=fro,to=[to[1]],type=type,info=cGG(message=message),server=server.k()).put()
		if to[0]!=author:
			Message(owner=author,author=author,fro=fro,to=[to[1]],type=type,info=cGG(message=message),server=server.k()).put()
	elif type=="xprivate":
		to[0]=get_owner(to[1])
		if not to[0]: return jhtml(self,{"failed":1,"reason":"nocharacter"})
		to[0]="%s"%to[0].k(); character=get_character(to[1])
		if character.server: server_eval_safe(get_by_iid("server|%s"%character.server),"get_player(data.name).socket.emit('pm',{owner:data.owner,message:data.message,id:data.owner,xserver:true});",data={"owner":fro,"name":to[1],"message":message})
		Message(owner=to[0],author=author,fro=fro,to=[to[1]],type="private",info=cGG(message=message),server=server.k()).put()
		if to[0]!=author:
			Message(owner=author,author=author,fro=fro,to=[to[1]],type="private",info=cGG(message=message),server=server.k()).put()
	else:
		for on in to:
			owner,names=on
			Message(owner=owner,author=author,fro=fro,to=names,type=type,info=cGG(message=message),server=server.k()).put()

	jhtml(self,{"success":1})

def set_friends_api(**args):
	self,domain,user1,user2,server=gdmuld(args,"self","domain","user1","user2","server")
	user1=get_by_iid_async("user|%s"%user1); user2=get_by_iid("user|%s"%user2); user1=user1.get_result()
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user1 or not user2: jhtml(self,{"failed":1,"reason":"nouser"}); return
	# if ssince(user1,"last_change",really_old)<10 or ssince(user2,"last_change",really_old)<10: jhtml(self,{"failed":1,"reason":"wait"}); return
	if len(user1.friends)>=100 or len(user2.friends)>=100: jhtml(self,{"failed":1,"reason":"100limit"}); return
	if user1.server or user2.server: return jhtml(self,{"failed":1,"reason":"bank"})
	def set_friends_transaction():
		e1=get_by_iid(user1.k('i'))
		e2=get_by_iid(user2.k('i'))
		if ""+e2.k() not in e1.friends:
			e1.friends.append(""+e2.k())
			e1.put()
		if ""+e1.k() not in e2.friends:
			e2.friends.append(""+e1.k())
			e2.put()
		return [e1,e2]
	result=ndb.transaction(set_friends_transaction,xg=True,retries=0)
	if result:
		deferred.defer(update_characters,result[0],reason="friends",name=result[1].name)
		deferred.defer(update_characters,result[1],reason="friends",name=result[0].name)
		jhtml(self,{"success":1})
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def not_friends_api(**args):
	self,domain,user1,user2,server=gdmuld(args,"self","domain","user1","user2","server")
	u2=user2; user1=get_by_iid_async("user|%s"%user1); user2=get_by_iid("user|%s"%(user2 or "-")); user1=user1.get_result()
	if not user2:
		char=get_character(u2 or "-")
		if char: user2=get_by_iid("user|%s"%char.owner)
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user1 or not user2: jhtml(self,{"failed":1,"reason":"nouser"}); return
	if user1.server or user2.server: return jhtml(self,{"failed":1,"reason":"bank"})
	def unfriend_transaction():
		e1=get_by_iid(user1.k('i'))
		e2=get_by_iid(user2.k('i'))
		if ""+e2.k() in e1.friends:
			e1.friends.remove(""+e2.k())
			e1.put()
		if ""+e1.k() in e2.friends:
			e2.friends.remove(""+e1.k())
			e2.put()
		return [e1,e2]
	result=ndb.transaction(unfriend_transaction,xg=True,retries=0)
	if result:
		deferred.defer(update_characters,result[0],reason="not_friends",name=result[1].name)
		deferred.defer(update_characters,result[1],reason="not_friends",name=result[0].name)
		jhtml(self,{"success":1})
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def stripe_payment_api(**args): #TODO: Patch for .server checks [10/07/18]
	self,domain,user,response,usd=gdmuld(args,"self","domain","user","response","usd")
	if not user:
		jfunc(self,"stripe_result",["failed"])
		jhtmle(self,"User not found, credit card not charged.")
		return
	token=response and hasattr(response,"get") and response.get("id","")
	if not token or not usd:
		jfunc(self,"stripe_result",["failed"]);
		jhtmle(self,"Issue with token or usd, please email hello@adventure.land")
		return
	usd=max(1,int(usd))
	shells=usd*80
	if usd>=500: shells=int(shells*1.24)
	elif usd>=100: shells=int(shells*1.16)
	elif usd>=25: shells=int(shells*1.08)
	if extra_shells:
		shells=int(shells*(100+extra_shells)/100.0)
	try:
		charge = stripe.Charge.create(
			amount=int(usd*100), #Amount in cents
			currency="usd",
			description="%s SHELLS for %s USD"%(shells,usd),
			source=token)
		add_event(user,"stripe",["payments","cashflow"],self=self,info=cGG(message="STRIPE! %s spent %s USD!"%(user.name,usd),usd=usd,token=token,response=response),async=True)
		def stripe_transaction():
			element=get_by_iid(user.k('i'))
			element.cash+=int(shells)
			element.put()
			return element
		result=ndb.transaction(stripe_transaction,xg=True,retries=120)
		if result:
			add_event(result,"shells",["cashflow"],self=self,info=cGG(message="STRIPE! %s received %s SHELLS!"%(user.name,shells),usd=usd,token=token),async=True)
			jfunc(self,"stripe_result",["success",result.cash])
			jhtmls(self,"You received %s SHELLS!"%shells)
			try: deferred.defer(add_cash,result.k(),int(shells),referrer=True,only_referrer=True)
			except: log_trace()
			try: deferred.defer(add_sales_bonus,int(usd*0.16))
			except: log_trace()
			return
		else:
			pass
	except stripe.error.CardError as e:
		#The card has been declined
		logging.info("Card declined %s"%e)
		jfunc(self,"stripe_result",["declined"])
		jhtmle(self,"Your card has been declined.")
		return
	except stripe.error.StripeError as e:
		logging.info("Other Error %s"%e)
		jfunc(self,"stripe_result",["failed"])
		jhtmle(self,"Payment failed.")
		return
	except:
		log_trace()
		pass
	jfunc(self,"stripe_result",["failed"])
	jhtmlm(self,"An unforeseen issue, please email hello@adventure.land with details. Apologies.")

def mount_user_api(**args): #mounts the user into the bank of the server [01/09/16]
	#IDEA: a seperate unlock_user_api
	# time.sleep(10) - great way to test routines [17/08/18]
	self,domain,user,server,id,to=gdmuld(args,"self","domain","user","server","character","to")
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	if server.gameplay=="hardcore" or server.gameplay=="test": return
	if user.server:
		if gf(user,"mounted_to")=="character|%s"%id:
			time.sleep(6) #GTODO: #IMPORTANT: Re-fetch and check user here, without the ndb cache [09/09/16]
			logging.error("Force-mount routine character|%s"%id)
		else:
			character=get_by_iid(user.info.mounted_to)
			logging.info("%s is already in the bank"%(character and character.info.name))
			return jhtml(self,{"failed":1,"reason":"mounted","name":character and character.info.name})
	if to!="bank" and not (gf(user,"unlocked") and user.info.unlocked.get(to)):
		return jhtml(self,{"failed":1,"reason":"locked"})
	def mount_user_transaction():
		element=get_by_iid(user.k('i'))
		char=get_by_iid("character|%s"%id)
		if not char or char.server!=server.k(): return False
		if element.server and gf(element,"mounted_to")!="character|%s"%id: return False
		element.server=server.k()
		element.info.mounted_to="character|%s"%id
		element.put()
		return element
	result=ndb.transaction(mount_user_transaction,xg=True,retries=12)
	if result:
		jhtml(self,{"done":1,"user":user_to_server(result)})
	else:
		jhtml(self,{"failed":1,"reason":"already_mounted"})


def start_character_api(**args):
	self,domain,user,server,id,ip_a,secret,code_slot,auth=gdmuld(args,"self","domain","user","server","character","ip","secret","code_slot","auth"); guild=None; code=None; code_version=0
	blocked=None
	try: ip_a=ip_a.replace("::ffff:","")
	except:
		log_trace()
		jhtml(self,{"failed":1,"reason":"ip_ex"}); return
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user or auth.replace('"',"").split("-")[1] not in gf(user,"auths",[]): jhtml(self,{"failed":1,"reason":"nouser"}); return
	if user.pid: blocked=User.query(User.pid==user.pid,User.banned==True).get_async()
	user_data=get_user_data(user)
	characters=get_characters(user)
	stats=get_stats(characters)
	character=get_by_iid("character|%s"%id)
	if not character or character.owner!=user.k(): jhtml(self,{"failed":1,"reason":"nocharacter"}); return

	if gf(user,"blocked_until",really_old)>datetime.now():
		jhtml(self,{"failed":1,"reason":"Account Temporarily Blocked | Reason: %s | Remaining: %s | For appeals, explanations, email: hello@adventure.land"%(gf(user,"blocked_reason","None"),pretty_timeleft(gf(user,"blocked_until",really_old)))}); return
	if user.banned: user.banned=False; user.put()
	if blocked:
		blocked=blocked.get_result()
		if blocked:
			user.info.blocked_reason="blocked_account"
			user.info.blocked_until=datetime.now()+timedelta(seconds=int(40*365*24*60*60))
			user.banned=True
			user.put()
			send_email(domain,"kaansoral@gmail.com",html="%s %s"%(user.name,user.info.email),title="Adventure Land: Auto Block")
			jhtml(self,{"failed":1,"reason":"Account Temporarily Blocked | Reason: %s | Remaining: %s | For appeals, explanations, email: hello@adventure.land"%(gf(user,"blocked_reason","None"),pretty_timeleft(gf(user,"blocked_until",really_old)))});
			return

	if code_slot:
		logging.info(code_slot)
		if not gf(user_data,"code_list",{}).get(sint(code_slot)):
			filename=code_slot; code_slot=None
			for slot in gf(user_data,"code_list",{}):
				if user_data.info.code_list[slot][0]==to_filename(filename):
					logging.info(slot)
					code_slot=slot
		if code_slot:
			code_slot=int(code_slot)
			code_version=user_data.info.code_list[code_slot][1]
			code=ndb.Key(InfoElement,"USERCODE-%s-%s"%(user.k(),code_slot)).get_async()
	if server.gameplay=="hardcore" or server.gameplay=="test":
		data={"done":1,"character":character_to_info(character,user=user)}
		if code: code=code.get_result()
		if code:
			#logging.info(code.info.code)
			data["code"]=code.info.code
			data["code_slot"]=code_slot
			data["code_version"]=code_version
		return jhtml(self,data)
	if is_in_game(character): jhtml(self,{"failed":1,"reason":"ingame"}); return
	if not is_sdk and ssince(gf(character,"last_start",really_old))<40: jhtml(self,{"failed":1,"reason":"wait_%d_seconds"%(40-ssince(gf(character,"last_start",really_old)))}); return
	add_event(character,"start",["activity"],self=self,info=cGG(message="%s [LV.%s] logged into %s %s"%(character.info.name,character.level,server.region,server.name),server=server.k('i')),async=True)
	if user.guild: guild=get_by_iid_async("guild|%s"%user.guild)
	def start_character_transaction():
		element=get_by_iid(character.k('i'))
		if element.server and msince(character.last_sync)<12: return False
		element.server=server.k()
		if not arr_arr_same(user.friends,element.friends): element.friends=user.friends
		element.guild=user.guild
		element.last_sync=datetime.now()
		element.online=True
		element.info.afk=True #"code" was getting stuck [20/05/18]
		element.last_online=datetime.now()
		element.info.secret=secret
		element.info.last_start=datetime.now()
		element.put()
		return element
	result=ndb.transaction(start_character_transaction,xg=True,retries=12)
	if result:
		data={"done":1,"character":character_to_info(result,user=user,ip=get_ip_info(ip_a),guild=guild and guild.get_result()),"stats":stats}
		if code: code=code.get_result()
		if code:
			#logging.info(code.info.code)
			data["code"]=code.info.code
			data["code_slot"]=code_slot
			data["code_version"]=code_version
		jhtml(self,data)
		if result.friends and not result.private: deferred.defer(notify_friends,result,"%s %s"%(server_regions[server.region],server.name))
	else:
		jhtml(self,{"failed":1,"reason":"ingame_or_temporarily_stuck"})

def stop_character_api(**args):
	self,domain,user,server,id,data,user_data=gdmuld(args,"self","domain","user","server","character","data","user_data"); retries=6
	if user_data: retries=50
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user: logging.critical("No User"); jhtml(self,{"failed":1,"reason":"nouser"}); return
	character=get_by_iid("character|%s"%id)
	if not character or character.owner!=user.k(): jhtml(self,{"failed":1,"reason":"nocharacter","done":1}); return
	if character.server!=server.k(): jhtml(self,{"failed":1,"reason":"notingame","done":1}); return
	if server.gameplay=="hardcore" or server.gameplay=="test": return

	reward_referrer_logic(user)

	def stop_character_transaction():
		element=get_by_iid(character.k('i'))
		element.server=""
		element.online=False
		element.to_backup=True
		element.last_online=datetime.now()
		if not arr_arr_same(user.friends,element.friends): element.friends=user.friends
		if data:
			update_character(element,data,user) #if observer hangs up, no need to sync data
			update_pids(element,data,user)
		element.put()

		if user_data:
			owner=get_by_iid(user.k('i'))
			for i in xrange(len(owner.info.characters)):
				char=owner.info.characters[i]
				if element.k()==char["id"]: owner.info.characters[i]=character_to_dict(element)
			if gf(owner,"mounted_to")==element.k('i') and user_data:
				logging.info("Unmounting in stop")
				owner.server=""; owner.info.mounted_to=""
				update_user_data(owner,user_data)
			elif user_data and gf(owner,"mounted_to")!=element.k('i'):
				logging.error("Has user_data at stop but mounted to: %s"%gf(owner,"mounted_to"))
			elif not user_data and gf(owner,"mounted_to")==element.k('i'):
				logging.error("Don't have user_data at stop: %s"%gf(owner,"mounted_to"))
			owner.last_online=datetime.now()
			owner.to_backup=True
			owner.put()
		return element

	result=ndb.transaction(stop_character_transaction,xg=True,retries=retries)
	if result:
		character=result
		jhtml(self,{"done":1,"name":character.info.name})
		add_event(character,"stop",["activity"],self=self,info=cGG(message="%s [LV.%s] logged out of %s %s"%(character.info.name,character.level,server.region,server.name),server=server.k('i')),async=True)
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def sync_character_api(**args):
	self,domain,user,server,id,data,user_data,unmount=gdmuld(args,"self","domain","user","server","character","data","user_data","unmount"); retries=3
	if unmount:
		logging.info("Unmount mode")
		retries=16
	if not server: jhtml(self,{"failed":1,"reason":"noserver"}); return
	if not user: jhtml(self,{"failed":1,"reason":"nouser"}); return
	character=get_by_iid("character|%s"%id)
	if not character or character.owner!=user.k(): jhtml(self,{"failed":1,"reason":"nocharacter"}); return
	if character.server!=server.k(): jhtml(self,{"failed":1,"reason":"notingame"}); return
	if server.gameplay=="hardcore" or server.gameplay=="test": return
	def sync_character_transaction():
		element=get_by_iid(character.k('i'))
		if element.server!=server.k():
			logging.info("stop_character_api executed after")
			return False
		element.last_sync=datetime.now()
		element.last_online=datetime.now()
		if not arr_arr_same(user.friends,element.friends): element.friends=user.friends
		element.to_backup=True
		update_character(element,data,user)
		update_pids(element,data,user)
		element.put()

		if user_data:
			owner=get_by_iid(user.k('i'))
			for i in xrange(len(owner.info.characters)):
				char=owner.info.characters[i]
				if str(element.k())==str(char["id"]): owner.info.characters[i]=character_to_dict(element)
			if gf(owner,"mounted_to")==element.k('i') and user_data:
				#thanks to the gf(owner,"mounted_to")==element.k('i') check, the ordering isn't crucial in normal circumstances [18/09/16]
				if unmount:
					logging.info("Unmounting in sync")
					owner.server=""; owner.info.mounted_to=""
				update_user_data(owner,user_data)
			elif user_data and gf(owner,"mounted_to")!=element.k('i'):
				logging.error("Has user_data at sync but mounted to: %s"%gf(owner,"mounted_to"))
			elif not user_data and gf(owner,"mounted_to")==element.k('i'):
				logging.error("Don't have user_data at sync: %s"%gf(owner,"mounted_to"))
			owner.last_online=datetime.now()
			owner.to_backup=True
			owner.put()
		return element
	result=ndb.transaction(sync_character_transaction,xg=True,retries=retries)
	if result:
		jhtml(self,{"done":1})
	else:
		jhtml(self,{"failed":1,"reason":"unknown"})

def logout_api(**args): #TODO: Probably re-visit this [10/07/18]
	#time.sleep(10)
	self=gdmuld(args,"self")
	delete_cookie(self,"auth")
	jhtmlm(self,"Logged Out")

def reload_server_api(**args):
	self,domain,keyword=gdmuld(args,"self","domain","keyword")
	if keyword!=secrets.SERVER_MASTER: jhtml(self,{"failed":1}); return
	geometry={}
	for name in maps:
		key=maps[name]["key"]
		if maps[name].get("ignore"): continue
		geometry[name]=get_by_iid("map|%s"%key).info.data
	jhtml(self,{
		"game":{
			"version":game_version,
			"achievements":achievements,
			"animations":animations,
			"monsters":monsters,
			"sprites":sprites,
			"maps":maps,
			"geometry":geometry,
			"npcs":npcs,
			"tilesets":tilesets,
			"imagesets":imagesets,
			"items":items,
			"sets":sets,
			"craft":craft,
			"titles":titles,
			"tokens":tokens,
			"dismantle":dismantle,
			"conditions":conditions,
			"cosmetics":cosmetics,
			"emotions":emotions,
			"projectiles":projectiles,
			"classes":classes,
			"dimensions":dimensions,
			"levels":levels,
			"positions":positions,
			"skills":skills,
			"games":games,
			"events":events,
			"images":precomputed.images,
			"multipliers":multipliers,
			},
		"dynamics":{
			"upgrades":upgrades,
			"drops":drops,
			"compounds":compounds,
			"monster_gold":monster_gold,
			},
		})

def create_server_api(**args):
	self,domain,keyword,port,region,pvp,gameplay,sname=gdmuld(args,"self","domain","keyword","port","region","pvp","gameplay","name")
	if keyword!=secrets.SERVER_MASTER: jhtml(self,{"failed":1}); return
	actual_ip=ip=self.request.remote_addr; server_name="XX"
	if is_sdk: actual_ip=ip=domain.server_ip
	if domain.https_mode: ip="%s.%s.%s"%(ip_to_subdomain.get(ip,ip),live_domain[1],live_domain[2])
	lat,lon=(self.request.headers.get("X-Appengine-Citylatlong")or"0,0").split(",")
	try: lat,lon=float(lat),float(lon)
	except: lat,lon=0,0

	if lat==0 and lon==0:
		if region=="ASIA": lat,lon=[1.3, 103.8]
		if region=="US": lat,lon=[37, -100]
		if region=="EU": lat,lon=[50, 8]

	if 0:
		names=copy.copy(server_names)
		for e in Server.query(Server.online==True,Server.region==region):
			try: names.remove(e.name)
			except: pass
		for e in get_servers(): #memcache soft-pierces eventual consistency
			if e.region==region:
				try: logging.info("Name not found: %s"%e.name)
				except: pass
		if len(names): server_name=names[0]
		else: logging.error("ran out of server names, using XX")

		if gameplay=="hardcore": server_name="HARDCORE"
		elif gameplay=="test": server_name="TEST"
		elif int(port)==8091: server_name="PVP"
		elif int(port)==8098: server_name="TEST"
	else:
		server_name=sname

	data={}
	server=get_by_iid("server|%s%s"%(region,server_name))
	if server:
		if server.online and msince(server.last_update)<12: return jhtml(self,{"exists":True});
		data=server.info.data
	server=Server(key=ndb.Key(Server,"%s%s"%(region,server_name)),info=cGG(players=0,observers=0,total_players=0,lat=lat,lon=lon,pvp=pvp,data=data),name=server_name,region=region,version=to_str(game_version),ip=ip,actual_ip=actual_ip,port=int(port),online=True,gameplay=gameplay)
	server.info.auth=randomStr(20)
	server.put()
	geometry={}
	for name in maps:
		key=maps[name]["key"]
		if maps[name].get("ignore"): continue
		geometry[name]=get_by_iid("map|%s"%key).info.data
	jhtml(self,{
		"id":server.k(),
		"auth":server.info.auth,
		"name":server_name,
		"data":server.info.data,
		"game":{
			"version":game_version,
			"achievements":achievements,
			"animations":animations,
			"monsters":monsters,
			"sprites":sprites,
			"maps":maps,
			"geometry":geometry,
			"npcs":npcs,
			"tilesets":tilesets,
			"imagesets":imagesets,
			"items":items,
			"sets":sets,
			"craft":craft,
			"titles":titles,
			"tokens":tokens,
			"dismantle":dismantle,
			"conditions":conditions,
			"cosmetics":cosmetics,
			"emotions":emotions,
			"projectiles":projectiles,
			"classes":classes,
			"dimensions":dimensions,
			"levels":levels,
			"positions":positions,
			"skills":skills,
			"games":games,
			"events":events,
			"images":precomputed.images,
			"multipliers":multipliers,
			},
		"dynamics":{
			"upgrades":upgrades,
			"drops":drops,
			"compounds":compounds,
			"monster_gold":monster_gold,
			"odds":odds,
			},
		})

	try: set_servers(server)
	except: log_trace()

def update_server_api(**args):
	#dsfasdfsad=fasdfsadf
	self,domain,keyword,server_id,players,observers,merchants,total_players,data=gdmuld(args,"self","domain","keyword","id","players","observers","merchants","total_players","data")
	if keyword!=secrets.SERVER_MASTER: jhtml(self,{"failed":1}); return
	def update_server_transaction():
		revival=False
		server=get_by_iid("server|%s"%server_id)
		if not server.online:
			server.created=datetime.now()
			revival=True
		server.online=True
		server.info.players=players
		server.info.observers=observers
		server.info.merchants=merchants
		server.info.total_players=total_players
		server.info.data=data
		server.last_update=datetime.now()
		server.put()
		return server,revival
	server,set_to_online=ndb.transaction(update_server_transaction,xg=True,retries=4)
	if set_to_online:
		send_email(gdi(),"kaansoral@gmail.com",html="%s"%server,title="REVIVED SERVER")
	logging.info("Updated %s"%server)
	jhtml(self,{"done":1})

	try: set_servers()
	except: log_trace()

def stop_server_api(**args):
	self,domain,keyword,server_id,data=gdmuld(args,"self","domain","keyword","id","data")
	if keyword!=secrets.SERVER_MASTER: jhtml(self,{"failed":1}); return
	def close_server_transaction():
		server=get_by_iid("server|%s"%server_id)
		if not server: return False
		server.info.data=data
		server.online=False
		server.put()
		return server
	server=ndb.transaction(close_server_transaction,xg=True,retries=12)
	logging.info("Stopped %s"%server)
	jhtml(self,{"done":1})

	try: set_servers()
	except: log_trace()

def server_event_api(**args):
	self,domain,keyword,server_id,event,message,color=gdmuld(args,"self","domain","keyword","id","event","message","color")
	# event is "announcement"
	if keyword!=secrets.SERVER_MASTER: jhtml(self,{"failed":1}); return
	server=get_by_iid("server|%s"%server_id)
	if event in ["server_message","notice"]:
		message="%s %s: %s"%(server.region,server.name,message)
		if event=="notice":
			send_email(domain,"kaansoral@gmail.com",html=message,title="Adventure Land - SEVERE",text=message)
		add_event(server,event,["noteworthy"],info=cGG(message=message,color=color),self=self)
	if event in ["pvp","violation"]:
		add_event(server,event,[],info=cGG(message="%s %s: %s"%(server.region,server.name,message),color=color),self=self)
	jhtml(self,{"done":1})

def add_message_api(**args):
	self,domain,keyword,server_id,event,message,color=gdmuld(args,"self","domain","keyword","id","event","message","color")
	# event is "announcement"
	if keyword!=secrets.SERVER_MASTER: jhtml(self,{"failed":1}); return
	server=get_by_iid("server|%s"%server_id)
	if event in ["server_message","notice"]:
		message="%s %s: %s"%(server.region,server.name,message)
		if event=="notice":
			send_email(domain,"kaansoral@gmail.com",html=message,title="Adventure Land - SEVERE",text=message)
		add_event(server,event,["noteworthy"],info=cGG(message=message,color=color),self=self)
	if event in ["pvp","violation"]:
		add_event(server,event,[],info=cGG(message="%s %s: %s"%(server.region,server.name,message),color=color),self=self)
	jhtml(self,{"done":1})

def get_servers_api(**args):
	self,domain=gdmuld(args,"self","domain")
	server_list=get_servers(); servers=[]
	for server in server_list:
		servers.append({"ip":server.ip,"port":server.port,"region":server.region,"name":server.name,"pvp":server.info.pvp,"gameplay":server.gameplay})
	#return servers
	jhtmls(self,servers)

def copy_map_api(**args):
	self,user,server,domain,f,t=gdmuld(args,"self","user","server","domain","f","t")
	if not user or not gf(user,"map_editor"): return jhtmle(self,"Failed")
	for m in maps:
		if maps[m]["key"]==t:
			return jhtmle(self,"You can't copy over a map in use")
	copy_map(f,t)
	jhtml(self,[{"type":"success","message":"Done!"},selection_info(self,user,domain)])

def delete_map_api(**args):
	self,user,server,domain,n=gdmuld(args,"self","user","server","domain","n")
	if not user or not gf(user,"map_editor"): return jhtmle(self,"Failed")
	for m in maps:
		if maps[m]["key"]==n:
			return jhtmle(self,"You can't delete a map in use")
	map=get_by_iid("map|%s"%n)
	if map:
		backup_item(map)
		map.key.delete()
	jhtml(self,[{"type":"success","message":"Done!"},selection_info(self,user,domain)])

def test_api(**args):
	asdfdfsa=dsfafsd
	self,user,server,domain=gdmuld(args,"self","user","server","domain")
	logging.info("test")
	jfunc(self,"alert",["lol"])
	jhtmls(self,"test")

def simplify_args_for_logging(args):
	try:
		new_args={}
		for id in args:
			if id=="data" and args[id]:
				new_args["data"]={"redacted":True}
			elif id=="user_data" and args[id]:
				new_args["user_data"]={"redacted":True}
			else:
				new_args[id]=args[id]
		return new_args
	except:
		return args

class APICall(webapp.RequestHandler):
	@ndb.toplevel
	def post(self):
		domain=gdi(self)
		server=get_server(self,domain)
		args,method=gdmul(self,"arguments","method")
		if security_threat(self,domain): return
		user=get_user(self,domain,api_override=(server and method and method!="start_character")) # only "start_character" has an auth check, the rest doesn't re-check user auths #IMPORTANT! [09/08/20]
		method="%s_api"%method
		if args: args=json.loads(args)
		if not args: args={}
		logging.info("\n\nAPI Method Called: %s Arguments: %s\n"%(method,simplify_args_for_logging(args)))
		#logging.info(self.request.cookies.get("auth"))
		if not user and method not in ["log_error_api","signup_or_login_api","load_article_api","get_server_api","test_api","create_server_api","stop_server_api","update_server_api","reload_server_api","set_friends_api","not_friends_api","password_reminder_api","server_event_api","reset_password_api","ban_user_api","send_mail_api","log_chat_api","take_item_from_mail_api","broadcast_api"]:
			if self.request.get("server_auth"): jhtml(self,{"failed":1,"reason":"nouser"}); return
			jhtml(self,[{"type":"func","func":"add_log","args":["Not logged in."]}]); return
		function=globals().get(method)
		args["domain"]=domain
		args["user"]=user
		args["server"]=server
		args["self"]=self
		if user and not server and gf(user,"blocked_until",really_old)>datetime.now() and method not in ["logout_api_X"]: return jhtml(self,[{"type":"func","func":"add_log","args":["Blocked"]}])
		if function: function(**args)
		else:
			if args.get("dataType")=="json": jhtml(self,[{"type":"ui_log","message":"Invalid method"}])
			else: logging.error("no function")
		safe_commit(user); safe_commit(server); domain_routine(domain)

application = webapp.WSGIApplication([
	('/api.*',APICall),
    ],debug=is_sdk)
