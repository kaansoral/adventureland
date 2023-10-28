from config import *
from functions import *
from admin import CommunityMapEditor,Selector,Items
from api import load_code_api

class MainHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		domain=gdi(self)
		if 0 and "treasurehunter" in name:
			whtml(self,"examples/learningPixi/treasure_hunter.html")
		elif "runner" in name:
			whtml(self,"htmls/runner.html",domain=domain)
		elif "executor" in name:
			whtml(self,"htmls/executor.html",domain=domain)
		elif name=="info/cookies":
			self.response.out.write(repr(self.request.cookies))
		elif "logs" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/logs.html",domain=domain,user=user)
		elif "linux" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/linux.html",domain=domain,user=user)
		elif "macos" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/macos.html",domain=domain,user=user)
		elif "allnotes" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/allnotes.html",domain=domain,user=user)
		elif "roadmap" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/roadmap.html",domain=domain,user=user)
		elif "drm-free" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/drmfree.html",domain=domain,user=user)
		elif "it-is-what-it-is" in name:
			user=get_user(self,domain)
			whtml(self,"htmls/disclaimers.html",domain=domain,user=user)
		elif "gallery/for/ideas" in name:
			user=get_user(self,domain)
			whtml(self,"utility/htmls/gallery.html",domain=domain,user=user,gallery=gallery)
		else:
			if domain.electron and self.request.get("buildid") in ["",None] and 0:
				return self.response.out.write("<div style='color: gray'>Build expired</div>")
			user=get_user(self,domain)
			if not user and name.startswith("r/") and len(name.split("/"))>1:
				referrer=name.split("/")[1]
				referrer=get_by_iid("user|%s"%referrer)
				if referrer:
					logging.info("Referrer is %s"%referrer.k())
					set_cookie(self,"referrer",referrer.k())
					ip=get_ip_info(self); ip.referrer=referrer.k(); put_ip_info(ip)
				return self.redirect("/")
			if not user and name.startswith("c/") and len(name.split("/"))>1: #unused [19/11/18]
				char=name.split("/")[1]
				char=get_character(char)
				if char:
					logging.info("Referrer is %s"%char.owner)
					set_cookie(self,"referrer",char.owner)
					ip=get_ip_info(self); ip.referrer=char.owner; put_ip_info(ip)
			if not domain.https_mode:
				if not self.request.headers.get("Cf-Visitor") and self.request.scheme=="https" or self.request.headers.get("Cf-Visitor") and "https" in self.request.headers.get("Cf-Visitor"):
					return self.redirect(self.request.url.replace("https","http"))
			render_selection(self,user,domain)
	def post(self,name):
		self.get(name)

class CommHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		render_comm(self,user,domain)
	def post(self):
		self.get()

class CharacterHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		domain=gdi(self); user=get_user(self,domain)
		character=get_character(name)
		if not character: return whtml(self,"htmls/simple_message.html",domain=domain,message="Not Found")
		if not user:
			ref=character.private and name or character.owner
			logging.info("Referrer is %s"%ref)
			set_cookie(self,"referrer",ref)
			ip=get_ip_info(self); ip.referrer=ref; put_ip_info(ip)
		domain.title=character.info.name
		whtml(self,"htmls/character.html",domain=domain,character=character)
	def post(self,name):
		self.get(name)

class VCharacterHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		domain=gdi(self); user=get_user(self,domain)
		character=get_character(name)
		if not character: return whtml(self,"htmls/simple_message.html",domain=domain,message="Not Found")
		characters=[character]
		for c in Backup.query(Backup.backup_item_id==character.k('i')).order(-Backup.backup_created).fetch(80):
			c.name=c.info.name="%s%s"%(c.info.name,(datetime.now()-c.backup_created).days)
			logging.info(c.info.slots["mainhand"]["name"])
			characters.append(c)
		domain.title=character.info.name
		whtml(self,"htmls/player.html",domain=domain,characters=characters)
	def post(self,name):
		self.get(name)

class CharactersHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		characters=Character.query().order(-Character.level).fetch(500)
		domain.title="Characters"
		whtml(self,"htmls/player.html",domain=domain,characters=characters)
	def post(self):
		self.get()

class PlayerHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		domain=gdi(self); user=get_user(self,domain)
		character=get_character(name)
		if not character: return whtml(self,"htmls/simple_message.html",domain=domain,message="Not Found")
		player=get_by_iid("user|%s"%character.owner)
		if not player: return whtml(self,"htmls/simple_message.html",domain=domain,message="Not Found")
		if not user:
			ref=character.private and name or player.k()
			logging.info("Referrer is %s"%ref)
			set_cookie(self,"referrer",ref)
			ip=get_ip_info(self); ip.referrer=ref; put_ip_info(ip)
		domain.title=player.name
		characters=[]
		if character.private: entities=[character]; domain.title=character.info.name
		else: entities=Character.query(Character.owner==character.owner, Character.private==False).fetch()
		if not len(entities): entities=[character]; domain.title=character.info.name
		for c in gf(player,"characters",[]):
			for e in entities:
				if simplify_name(e.name)==simplify_name(c["name"]):
					characters.append(e)
		whtml(self,"htmls/player.html",domain=domain,characters=characters)
	def post(self,name):
		self.get(name)

class MerchantsHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		domain.title="All Online Merchants!"
		entities=Character.query(Character.online == True, Character.type == "merchant").fetch()
		whtml(self,"htmls/player.html",domain=domain,characters=entities,merchants=True)
	def post(self):
		self.get()

class CMainHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name,region,sname):
		logging.info("CMainHandler %s %s %s"%(name,region,sname))
		domain=gdi(self); level=80
		if domain.electron and self.request.get("buildid") in ["",None] and 0:
			return self.response.out.write("<div style='color: gray'>Build expired</dov>")
		if not domain.https_mode:
			if not self.request.headers.get("Cf-Visitor") and self.request.scheme=="https" or self.request.headers.get("Cf-Visitor") and "https" in self.request.headers.get("Cf-Visitor"):
				return self.redirect(self.request.url.replace("https","http"))
		servers=get_servers()
		user=get_user(self,domain)
		code=self.request.get("code")
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
		render_selection(self,user,domain,level=level)
	def post(self,name,region,sname):
		self.get(name,region,sname)

class SMainHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,region,sname):
		logging.info("CMainHandler %s %s %s"%(name,region,sname))
		domain=gdi(self); S=None
		if domain.electron and self.request.get("buildid") in ["",None] and 0:
			return self.response.out.write("<div style='color: gray'>Build expired</dov>")
		if not domain.https_mode:
			if not self.request.headers.get("Cf-Visitor") and self.request.scheme=="https" or self.request.headers.get("Cf-Visitor") and "https" in self.request.headers.get("Cf-Visitor"):
				return self.redirect(self.request.url.replace("https","http"))
		servers=get_servers()
		user=get_user(self,domain)
		for server in servers:
			if server.region==region and server.name==sname:
				S=server
		render_selection(self,user,domain,server=S)
	def post(self,region,sname):
		self.get(region,sname)

class EmailVerification(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,uid,v):
		domain=gdi(self)
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
		whtml(self,"htmls/simple_message.html",domain=domain,message=message)
	def post(self,uid,v):
		self.get(uid,v)

class PasswordReset(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,uid,key):
		domain=gdi(self)
		user=get_by_iid("user|%s"%uid)
		logging.info(user)
		if user and gf(user,"password_key","123")==key:
			whtml(self,"htmls/contents/password_reset.html",domain=domain,user=user,id=uid,key=key)
		else:
			message="Invalid Password Reset URL"
			whtml(self,"htmls/simple_message.html",domain=domain,message=message)
	def post(self,uid,v):
		self.get(uid,v)

class CodeJS(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain); code=None; name=self.request.get("name")
		if user:
			data=get_user_data(user)
			for slot in gf(data,"code_list",{}):
				if "%s"%slot=="%s"%name or ("%s"%data.info.code_list[slot][0]).lower()==("%s"%to_filename(name)).lower():
					code=ndb.Key(InfoElement,"USERCODE-%s-%s"%(user.k(),slot)).get()
					if code:
						self.response.out.write("%s"%code.info.code)
						return
		if self.request.get("xrequire"): self.response.out.write("throw('xrequire: Code not found')")
		else: self.response.out.write("game_log('load_code: Code not found',colors.code_error)")
	def post(self):
		self.get()

class DataJS(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); additional=""
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
		if self.request.get("reload"): additional="add_log('Game data reloaded','#32A3B0');\napply_backup()\n"
		self.response.out.write("var G=%s;\n%s"%(json.dumps(data),additional))
	def post(self):
		self.get()

class PaymentsHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		if not self.request.headers.get("Cf-Visitor") and self.request.scheme=="http" or self.request.headers.get("Cf-Visitor") and "https" not in self.request.headers.get("Cf-Visitor"):
			if not is_sdk: return self.redirect(self.request.url.replace("http","https"))
		domain=gdi(self); user=get_user(self,domain)
		#if security_threat(self,domain): return #commented out [23/04/20]
		servers=get_servers(); server=select_server(self,user,servers)
		domain.stripe_enabled=True
		whtml(self,"htmls/payments.html",domain=domain,user=user,server=server,extra_shells=extra_shells)
	def post(self):
		self.get()

class TileUpload(blobstore_handlers.BlobstoreUploadHandler):
	@ndb.toplevel
	def post(self):
		domain=gdi(self); user=get_user(self,domain)
		if security_threat(self,domain): return
		upload_files = self.get_file_infos('image'); file_info = upload_files[0]; blob_key=blobstore.create_gs_key_async(file_info.gs_object_name)
		key,name=gdmul(self,"key","iname")
		if name not in ["map","map_a"] or not user or not key.startswith(""+user.k()):
			if 0: return jhtmle(self,"Permission issue")
			else: return self.response.out.write("Permission issue")
		logging.info("Image Upload %s %s"%(key,name))
		map=get_by_iid("map|%s"%key); blob_key=blob_key.get_result()
		if not map: map=Map(key=ndb.Key(Map,key),info=GG())

		if file_info.content_type in ["image/jpg","image/jpeg","image/jpe","image/png","image/gif"]:
			if gf(map,"image_%s"%name):
				try: blobstore.delete(blob_keys=gf(map,"image_%s"%name).blob_key)
				except: log_trace()
			setattr(map.info,"image_%s"%name,cGG(blob_key=blob_key,
				content_type=file_info.content_type,gs_object_name=file_info.gs_object_name))
			if 0: jhtml(self,[{"type":"success","message":"Image uploaded"}])
			else: self.redirect("/map/"+key)
			map.put()
		else:
			blobstore.delete(blob_keys=blob_key)
			if 0: jhtmle(self,"Not an image")
			else: self.response.out.write("Not an image")
	def get(self): self.post()

class GCSServeHandler(blobstore_handlers.BlobstoreDownloadHandler):
	def get(self,resource):
		#resource = str(urllib.unquote(resource))
		#blob_key=blobstore.create_gs_key(resource)
		#self.send_blob(blob_key)
		logging.info("here")
		resource = str(urllib.unquote(resource))
		self.send_blob(resource)

class ResortEditor(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name,suffix):
		if not name: return
		name=name.split("/")[0]
		domain=gdi(self); user=get_user(self,domain)
		if security_threat(self,domain): return
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
		whtml(self,"utility/htmls/map_editor.html",domain=domain,name=name,map=map,upload_url=upload_url,tilesets=mtilesets,community=1,resort=1)
	def post(self,name,suffix):
		data=self.request.get("data")
		if not name: return
		name=name.split("/")[0]
		domain=gdi(self); user=get_user(self,domain)
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
		self.response.out.write(to_pretty_num(olen(map.info.data)))

class Redirector(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		self.response.out.write("<script>window.top.location='http://adventure.land'</script> <!-- This is temporary, until I can set up the FB version [04/NOV/16] -->")
	def post(self):
		self.get()

class WarmupHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		pass
	def post(self):
		self.get()

class MapLister(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,order):
		domain=gdi(self)
		def map_to_html(m):
			return "<div style='margin-bottom: 2px'><a href='%s/%s' target='_blank' style='color: white; font-weight: bold; text-decoration:none'>%s</a></div>"%(url,m.id(),m.id())
		html="<style> html{background-color:gray}</style>"
		if is_sdk: url="%s/admin/map_editor"%(domain.base_url)
		else: url="%s/%s"%(domain.base_url,"communitymaps")
		if order=="key":
			for m in Map.query().fetch(5000,keys_only=True): html+=map_to_html(m)
		else:
			for m in Map.query().order(-Map.updated).fetch(5000,keys_only=True): html+=map_to_html(m)
		self.response.out.write(html)
	def post(self):
		self.get()

class IPLister(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,order):
		domain=gdi(self)
		def ip_to_html(ip):
			return "<div style='margin-bottom: 2px'>%s {%s} [%s]</div>"%(ip.info.explanation,ip.random_id,ip.info.limit)
		html="<style> html{background-color:gray}</style>"
		for ip in IP.query(IP.exception==True).fetch(5000): html+=ip_to_html(ip)
		self.response.out.write(html)
	def post(self):
		self.get()

class PrivacyHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		whtml(self,"htmls/page.html",domain=domain,user=user,content="privacy")

class TermsHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		whtml(self,"htmls/page.html",domain=domain,user=user,content="terms")

class ContactHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		whtml(self,"htmls/page.html",domain=domain,user=user,content="contact")

class DocsHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,path):
		domain=gdi(self); user=get_user(self,domain); domain.title="Docs"
		if len(path):
			domain.title="Docs /%s"%path
		path=path.split("/")
		whtml(self,"htmls/docs.html",domain=domain,user=user,content="docs",dpath=path,extras=True)

class CreditsHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		whtml(self,"htmls/page.html",domain=domain,user=user,content="credits")

class RearmHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		if not is_sdk: return
		free_servers()
		unlock_all()

application = webapp.WSGIApplication([
	('/ev/(.*)/([^/]*)/?', EmailVerification),
	('/reset/(.*)/([^/]*)/?', PasswordReset),
	('/data.js', DataJS),
	('/code.js', CodeJS),
	('/upload/tileset.*',TileUpload),
	('/tileset/(.*)\.png',GCSServeHandler),
	('/maps/?(.*)',MapLister),
	('/ips/?(.*)',IPLister),
	('/docs/?(.*)',DocsHandler),
	('/map/(.*)/?(.*)',ResortEditor),
	('/communitymaps/?(.*)', CommunityMapEditor),
	('/communityselector/?(.*)', Selector),
	('/communityitems', Items),
	('/shells', PaymentsHandler),
	('/temporaryfbcanvas', Redirector),
	('/_ah/warmup',WarmupHandler),
	('/privacy.*',PrivacyHandler),
	('/terms.*',TermsHandler),
	('/contact.*',ContactHandler),
	('/credits.*',CreditsHandler),
	('/server/([^/]*)/([^/]*)/?', SMainHandler),
	('/character/([^/]*)/in/([^/]*)/([^/]*)/?', CMainHandler),
	('/character/([^/]*)/?', CharacterHandler),
	('/visualizeT2/([^/]*)/?', VCharacterHandler),
	('/player/([^/]*)/?', PlayerHandler),
	('/characters', CharactersHandler),
	('/merchants', MerchantsHandler),
	('/comm/?.*', CommHandler),
	('/rearm',RearmHandler),
	('/?(.*)', MainHandler),
	],debug=is_sdk)