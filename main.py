from config import *
from functions import *
from api import *
from admin import *
from crons import *
from tests import *
from tasks import *

@ndb.toplevel
@app.route('/comm')
def serve_comm():
	domain=gdi(request); user=get_user(request,domain)
	return render_comm(request,user,domain)

@app.route('/character/<name>')
def serve_character(name=""):
	domain=gdi(request); user=get_user(request,domain)
	character=get_character(name)
	if not character: return whtml(request,"htmls/simple_message.html",domain=domain,message="Not Found")
	if not user:
		ref=character.private and name or character.owner
		logging.info("Referrer is %s"%ref)
		set_cookie(request,"referrer",ref)
		ip=get_ip_info(request); ip.referrer=ref; put_ip_info(ip)
	domain.title=character.info.name
	return whtml(request,"htmls/character.html",domain=domain,character=character)

@ndb.toplevel
@app.route('/characters')
def server_characters():
	domain=gdi(request); user=get_user(request,domain)
	characters=Character.query().order(-Character.level).fetch(500)
	domain.title="Characters"
	return whtml(request,"htmls/player.html",domain=domain,characters=characters)

@app.route('/player/<name>')
def serve_player(name=""):
	domain=gdi(request); user=get_user(request,domain)
	character=get_character(name)
	if not character: return whtml(request,"htmls/simple_message.html",domain=domain,message="Not Found")
	player=get_by_iid("user|%s"%character.owner)
	if not player: return whtml(request,"htmls/simple_message.html",domain=domain,message="Not Found")
	if not user:
		ref=character.private and name or player.k()
		logging.info("Referrer is %s"%ref)
		set_cookie(request,"referrer",ref)
		ip=get_ip_info(request); ip.referrer=ref; put_ip_info(ip)
	domain.title=player.name
	characters=[]
	if character.private: entities=[character]; domain.title=character.info.name
	else: entities=Character.query(Character.owner==character.owner, Character.private==False).fetch()
	if not len(entities): entities=[character]; domain.title=character.info.name
	for c in gf(player,"characters",[]):
		for e in entities:
			if simplify_name(e.name)==simplify_name(c["name"]):
				characters.append(e)
	return whtml(request,"htmls/player.html",domain=domain,characters=characters)

@app.route('/merchants')
@ndb.toplevel
def serve_merchants():
	domain=gdi(request); user=get_user(request,domain)
	domain.title="All Online Merchants!"
	entities=Character.query(Character.online == True, Character.type == "merchant").fetch()
	return whtml(request,"htmls/player.html",domain=domain,characters=entities,merchants=True)

@ndb.toplevel
@app.route('/character/<name>/in/<region>/<sname>')
@app.route('/character/<name>/in/<region>/<sname>/')
def serve_server_and_character_selection(name="",region="",sname=""):
	logging.info("CMainHandler %s %s %s"%(name,region,sname))
	domain=gdi(request); level=80
	if domain.electron and request.values.get("buildid") in ["",None] and 0:
		return request.response.set_data("<div style='color: gray'>Build expired</dov>")
	if not domain.https_mode:
		if not request.headers.get("Cf-Visitor") and request.scheme=="https" or request.headers.get("Cf-Visitor") and "https" in request.headers.get("Cf-Visitor"):
			return redirect(request.url.replace("https","http"))
	servers=get_servers()
	user=get_user(request,domain)
	code=request.values.get("code")
	if code: domain.explicit_slot=code
	for c in gf(user,"characters",[]):
		if simplify_name(c["name"])==simplify_name(name):
			domain.character_name=c["name"]
			domain.url_character=c["id"]#so retry happens - this always gets set [05/01/18]
			level=c["level"]
	for server in servers:
		if server.region==region and server.name==sname:
			domain.url_ip=domain.https and server.ip or server.actual_ip
			domain.url_port=server.port
			logging.info("Set!")
	return render_selection(request,user,domain,level=level)

@ndb.toplevel
@app.route('/server/<region>/<sname>')
@app.route('/server/<region>/<sname>/')
def serve_server_selection(region="",sname=""):
	logging.info("CMainHandler %s %s %s"%(name,region,sname))
	domain=gdi(request); S=None
	if domain.electron and request.values.get("buildid") in ["",None] and 0:
		return request.response.set_data("<div style='color: gray'>Build expired</dov>")
	if not domain.https_mode:
		if not request.headers.get("Cf-Visitor") and request.scheme=="https" or request.headers.get("Cf-Visitor") and "https" in request.headers.get("Cf-Visitor"):
			return redirect(request.url.replace("https","http"))
	servers=get_servers()
	user=get_user(request,domain)
	for server in servers:
		if server.region==region and server.name==sname:
			S=server
	return render_selection(request,user,domain,server=S)

@app.route('/ev/<uid>/<v>')
@ndb.toplevel
def server_everify(uid,v):
	domain=gdi(request)
	user=get_by_iid("user|%s"%uid)
	logging.info(user)
	message="Email Verification Failed"
	if user and not gf(user,"verified"):
		if gf(user,"everification")==v:
			def verification_transaction():
				element=get_by_iid(user.k('i'))
				element.info.verified=True
				element.put()
				return element
			if ndb.transaction(verification_transaction,xg=True,retries=8): message="Your Email Is Now Verified"
	elif user:
		message="Your Email Is Already Verified"
	whtml(request,"htmls/simple_message.html",domain=domain,message=message)
	return request.response

@app.route('/reset/<uid>/<key>')
@ndb.toplevel
def server_reset(uid,key):
	domain=gdi(request)
	user=get_by_iid("user|%s"%uid)
	logging.info(user)
	if user and gf(user,"password_key","123")==key:
		whtml(request,"htmls/contents/password_reset.html",domain=domain,user=user,id=uid,key=key)
	else:
		message="Invalid Password Reset URL"
		whtml(request,"htmls/simple_message.html",domain=domain,message=message)
	return request.response

@app.route('/code.js',methods=['GET','POST'])
def serve_codejs():
	domain=gdi(request); user=get_user(request,domain); code=None; name=request.values.get("name")
	if user:
		data=get_user_data(user)
		for slot in gf(data,"code_list",{}):
			if "%s"%slot=="%s"%name or ("%s"%data.info.code_list[slot][0]).lower()==("%s"%to_filename(name)).lower():
				code=ndb.Key(InfoElement,"USERCODE-%s-%s"%(user.k(),slot)).get()
				if code:
					request.response.set_data("%s"%code.info.code)
					return request.response
	if request.values.get("xrequire"): request.response.set_data("throw('xrequire: Code not found')")
	else: request.response.set_data("game_log('load_code: Code not found',colors.code_error)")
	return request.response

@app.route('/data.js',methods=['GET','POST'])
@ndb.toplevel
def serve_datajs():
	domain=gdi(request); additional=""
	geometry={}
	for name in maps:
		key=maps[name]["key"]
		if maps[name].get("ignore"): continue
		#if name=="test" and not is_sdk: key="test"
		#logging.info(key)
		geometry[name]=get_by_iid("map|%s"%key).info.data
	data={
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
		"images":precomputed.images,
		"levels":levels,
		"positions":positions,
		"skills":skills,
		"events":events,
		"games":games,
		"multipliers":multipliers,
		#"codes":codes,
		"docs":docs,
		"drops":drops,
	}
	if request.values.get("reload"): additional="add_log('Game data reloaded','#32A3B0');\napply_backup()\n"
	request.response.set_data("var G=%s;\n%s"%(json.dumps(data),additional))
	return request.response


@ndb.toplevel
@app.route('/shells')
def serve_shells():
	if not request.headers.get("Cf-Visitor") and request.scheme=="http" or request.headers.get("Cf-Visitor") and "https" not in request.headers.get("Cf-Visitor"):
		if not is_sdk: return redirect(request.url.replace("http","https"))
	domain=gdi(request); user=get_user(request,domain)
	#if security_threat(request,domain): return #commented out [23/04/20]
	servers=get_servers(); server=select_server(request,user,servers)
	domain.stripe_enabled=True
	return whtml(request,"htmls/payments.html",domain=domain,user=user,server=server,extra_shells=extra_shells)


@app.route("/map/<name>",methods=['GET']) #Resort Map Editor
@app.route("/map/<name>/<suffix>",methods=['GET'])
def serve_resort_get(name="",suffix=""):
	if not name: return
	name=name.split("/")[0]
	domain=gdi(request); user=get_user(request,domain)
	if security_threat(request,domain): return
	if not user or (not name.startswith("%s_"%user.k()) and user.k() not in inner_circle): return
	number=name.split("_")[1]
	if number not in ["1","2","3","4","5","6","7","8","9","10"]: return
	map=get_by_iid("map|%s"%name)
	mtilesets=copy.copy(tilesets)
	if map and gf(map,"image_map"): mtilesets["this_map"]={"file":"/tileset/%s.png"%map.info.image_map.blob_key}
	if map and gf(map,"image_map_a"): mtilesets["this_map_a"]={"file":"/tileset/%s.png"%map.info.image_map_a.blob_key}
	if not mtilesets.get("this_map"): mtilesets["this_map"]={"file":"/images/tiles/map/resort_default.png"}
	if not mtilesets.get("this_map_a"): mtilesets["this_map_a"]={"file":"/images/tiles/map/resort_default_a.png"}
	upload_url=blobstore.create_upload_url('/upload/tileset',gs_bucket_name=domain.gcs_bucket+"/images")
	return whtml(request,"utility/htmls/map_editor.html",domain=domain,name=name,map=map,upload_url=upload_url,tilesets=mtilesets,community=1,resort=1)

@app.route("/map/<name>",methods=['POST'])
@app.route("/map/<name>/<suffix>",methods=['POST'])
def serve_resort_post(name="",suffix=""):
	data=request.values.get("data")
	if not name: return
	name=name.split("/")[0]
	domain=gdi(request); user=get_user(request,domain)
	if not user or not name.startswith("%s_"%user.k()): return
	number=name.split("_")[1]
	if number not in ["1","2","3","4","5","6","7","8","9","10"]: return
	map=get_by_iid("map|%s"%name)
	if not map: map=Map(key=ndb.Key(Map,name),info=GG())
	map.info.data=json.loads(data)
	process_map(map)
	map.player=True
	map.updated=datetime.now()
	map.put()
	return to_pretty_num(olen(map.info.data))

@app.route('/maps')
@app.route('/maps/<order>')
def serve_maps(order=""):
	domain=gdi(request)
	def map_to_html(m):
		return "<div style='margin-bottom: 2px'><a href='%s/%s' target='_blank' style='color: white; font-weight: bold; text-decoration:none'>%s</a></div>"%(url,m.id(),m.id())
	html="<style> html{background-color:gray}</style>"
	if is_sdk: url="%s/admin/map_editor"%(domain.base_url)
	else: url="%s/%s"%(domain.base_url,"communitymaps")
	if order=="key":
		for m in Map.query().fetch(5000,keys_only=True): html+=map_to_html(m)
	else:
		for m in Map.query().order(-Map.updated).fetch(5000,keys_only=True): html+=map_to_html(m)
	return html

@app.route('/privacy')
def serve_privacy():
	domain=gdi(request); user=get_user(request,domain)
	return whtml(request,"htmls/page.html",domain=domain,user=user,content="privacy")

@app.route('/terms')
def serve_terms():
	domain=gdi(request); user=get_user(request,domain)
	return whtml(request,"htmls/page.html",domain=domain,user=user,content="terms")

@app.route('/contact')
def serve_contact():
	domain=gdi(request); user=get_user(request,domain)
	return whtml(request,"htmls/page.html",domain=domain,user=user,content="contact")

@app.route('/credits')
def serve_credits():
	domain=gdi(request); user=get_user(request,domain)
	return whtml(request,"htmls/page.html",domain=domain,user=user,content="credits")

@app.route('/docs')
@app.route('/docs/<path>')
def serve_docs(path=""):
	domain=gdi(request); user=get_user(request,domain); domain.title="Docs"
	if len(path):
		domain.title="Docs /%s"%path
	path=path.split("/")
	return whtml(request,"htmls/docs.html",domain=domain,user=user,content="docs",dpath=path,extras=True)

@ndb.toplevel
@app.route('/rearm')
def serve_rearm():
	if not is_sdk: return ""
	free_servers()
	unlock_all()
	return "done!"

@ndb.toplevel
@app.route('/', methods=['POST', 'GET'])
@app.route('/<name>', methods=['POST', 'GET'])
def server_main(name=""):
	domain=gdi(request)
	if 0 and "treasurehunter" in name:
		whtml(request,"examples/learningPixi/treasure_hunter.html")
	elif "runner" in name:
		whtml(request,"htmls/runner.html",domain=domain)
	elif "executor" in name:
		whtml(request,"htmls/executor.html",domain=domain)
	elif name=="info/cookies":
		request.response.set_data(repr(request.cookies))
	elif "logs" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/logs.html",domain=domain,user=user)
	elif "linux" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/linux.html",domain=domain,user=user)
	elif "macos" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/macos.html",domain=domain,user=user)
	elif "allnotes" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/allnotes.html",domain=domain,user=user)
	elif "roadmap" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/roadmap.html",domain=domain,user=user)
	elif "drm-free" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/drmfree.html",domain=domain,user=user)
	elif "it-is-what-it-is" in name:
		user=get_user(request,domain)
		whtml(request,"htmls/disclaimers.html",domain=domain,user=user)
	elif "gallery/for/ideas" in name:
		user=get_user(request,domain)
		whtml(request,"utility/htmls/gallery.html",domain=domain,user=user,gallery=gallery)
	else:
		if domain.electron and request.values.get("buildid") in ["",None] and 0:
			request.response.set_data("<div style='color: gray'>Build expired</div>")
			return request.response
		user=get_user(request,domain)
		if not user and name.startswith("r/") and len(name.split("/"))>1:
			referrer=name.split("/")[1]
			referrer=get_by_iid("user|%s"%referrer)
			if referrer:
				logging.info("Referrer is %s"%referrer.k())
				set_cookie(request,"referrer",referrer.k())
				ip=get_ip_info(request); ip.referrer=referrer.k(); put_ip_info(ip)
			return redirect("/")
		if not user and name.startswith("c/") and len(name.split("/"))>1: #unused [19/11/18]
			char=name.split("/")[1]
			char=get_character(char)
			if char:
				logging.info("Referrer is %s"%char.owner)
				set_cookie(request,"referrer",char.owner)
				ip=get_ip_info(request); ip.referrer=char.owner; put_ip_info(ip)
		if not domain.https_mode:
			if not request.headers.get("Cf-Visitor") and request.scheme=="https" or request.headers.get("Cf-Visitor") and "https" in request.headers.get("Cf-Visitor"):
				return redirect(request.url.replace("https","http"))
		render_selection(request,user,domain)
	return request.response
