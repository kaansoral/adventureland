from config import *
from functions import *

class Renderer(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		whtml(self,"utility/htmls/renderer.html",domain=gdi(self))
	def post(self): self.get()

class Events(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,tag):
		cursor=gdmul(self,"cursor")
		if not tag: tag="noteworthy"
		if tag=="all": events=Event.query().order(-Event.created)
		else: events=Event.query(Event.tag==tag).order(-Event.created)
		if cursor: events,ncursor,more=events.fetch_page(100,start_cursor=ndb.Cursor(urlsafe=cursor))
		else: events,ncursor,more=events.fetch_page(100)
		ncursor=more and ncursor.urlsafe()
		whtml(self,"utility/htmls/events.html",domain=gdi(self),events=events,ncursor=ncursor)
	def post(self,tag): self.get(tag)

def executor_task(the_code):
	self=None
	try:
		exec(the_code)
	except:
		#admin_email(domain,"executor_task failed")
		log_trace()

class Executor(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		whtml(self,"utility/htmls/executor.html",domain=gdi(self))
	@ndb.toplevel
	def post(self):
		the_none="the_none_output_48"
		the_code,is_task=gdmul(self,"code","is_task"); output=the_none; json_output=None; json_size=0; html_output=the_none; output_html=the_none; inspect=the_none; ess=datetime.now()
		logging=custom_logging()
		#logging=code_logs
		if is_task:
			deferred.defer(executor_task,the_code,_queue="default")
			output="executor_task triggered"
		else:
			try:
				exec(the_code)
			except DeadlineExceededError: logging.error("Deadline Exceeded")
			except:
				log_trace_i("",logging)
		if json_output!=None: json_size=olen(json_output); json_output=json.dumps(recursive_datetime_conversion(json_output))
		if html_output!=the_none: output_html=html_output
		whtml(self,"utility/htmls/executor_output.html",logs=logging.output(),created=datetime.now(),ess_ms=mssince(ess),
			output=output,json=json_output,json_size=json_size,html_output=output_html,inspector_output=(inspect!=the_none and ginspect(inspect,force_inspection=1)))

class CommunityMapEditor(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		if not name: return
		name=name.split("/")[0]
		#if not ((name in community_maps) or name.startswith("jayson_")): return
		domain=gdi(self); user=get_user(self,domain)
		#if name.startswith("jayson_") and (not user or (user.k()+"") not in inner_circle): return
		map=get_by_iid("map|%s"%name)
		whtml(self,"utility/htmls/map_editor.html",domain=domain,name="main",map=map,tilesets=tilesets,community=1)
	@ndb.toplevel
	def post(self,name):
		data=self.request.get("data")
		name=name.split("/")[0]
		if not ((name in community_maps) or name.startswith("jayson_")): return self.response.out.write("Not Permitted!")
		domain=gdi(self); user=get_user(self,domain)
		if name.startswith("jayson_") and (not user or (user.k()+"") not in inner_circle): return self.response.out.write("Not Permitted!")
		map=get_by_iid("map|%s"%name)
		if not map: map=Map(key=ndb.Key(Map,name),info=GG())
		map.info.data=json.loads(data)
		process_map(map)
		map.updated=datetime.now()
		map.put()
		copy_map(name,"test")
		self.response.out.write(to_pretty_num(olen(map.info.data)))

class MapEditor(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		if not name: self.redirect("/admin/map_editor/main"); return
		name=name.split("/")[0]
		map=get_by_iid("map|%s"%name)
		whtml(self,"utility/htmls/map_editor.html",domain=gdi(self),name="main",map=map,tilesets=tilesets)
	@ndb.toplevel
	def post(self,name):
		data=self.request.get("data")
		name=name.split("/")[0]
		map=get_by_iid("map|%s"%name)
		if not map: map=Map(key=ndb.Key(Map,name),info=GG())
		map.info.data=json.loads(data)
		process_map(map)
		map.updated=datetime.now()
		map.put()
		copy_map(name,"test")
		self.response.out.write(to_pretty_num(olen(map.info.data)))

class Selector(webapp.RequestHandler): #NOTICE: << Publicly available at /communityselector! >> [10/10/16]
	@ndb.toplevel
	def get(self,name):
		if not name: self.redirect("/admin/selector/pack_1a"); return
		name=name.split("/")[0]
		file=imagesets[name]["file"]
		size=imagesets[name]["size"]
		width=imagesets[name]["columns"]*size
		height=imagesets[name]["rows"]*size
		xs=[]; ys=[]
		for i in xrange(width/size): xs.append(i)
		for j in xrange(height/size): ys.append(j)
		whtml(self,"utility/htmls/selector.html",domain=gdi(self),name=name,file=file,size=size,width=width,height=height,xs=xs,ys=ys,scale=3)
	def post(self,name): self.get(name)

class PhotoUpload(blobstore_handlers.BlobstoreUploadHandler):
	@ndb.toplevel
	def post(self):
		domain=gdi(self); user=get_user(self,domain)
		if security_threat(self,domain): return
		upload_files = self.get_file_infos('image'); file_info = upload_files[0]; blob_key=blobstore.create_gs_key_async(file_info.gs_object_name)
		key=gdmul(self,"key");
		logging.info("Image Upload %s"%(key))
		upload=get_by_iid("upload|%s"%key); blob_key=blob_key.get_result()
		if not upload: upload=Upload(key=ndb.Key(Upload,key),info=GG())


		if file_info.content_type in ["image/jpg","image/jpeg","image/jpe","image/png","image/gif"]:
			if gf(upload,"blob_key"):
				try:
					blobstore.delete(blob_keys=upload.info.blob_key)
					logging.info("Old image deleted")
				except: log_trace()

			url=get_serving_url(blob_key,size=images.IMG_SERVING_SIZES_LIMIT)
			size=get_image_size(blob_key,encoding=filetype_to_image_encoding(file_info.content_type))
			
			upload.info.blob_key=blob_key
			upload.info.content_type=file_info.content_type
			upload.info.gs_object_name=file_info.gs_object_name
			upload.info.url=url
			upload.info.width=size.width
			upload.info.height=size.height

			self.response.out.write("{<br/>&nbsp;'%s':{'url':'%s','width':%s,'height':%s},<br />}"%(key,url,size.width,size.height))
			upload.put()
		else:
			blobstore.delete(blob_keys=blob_key)
			self.response.out.write("Not an image")
	def get(self): self.post()

class PhotoUploader(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		domain=gdi(self); user=get_user(self,domain)
		if security_threat(self,domain): return
		upload_url=blobstore.create_upload_url('/admin/upload/handler',gs_bucket_name=domain.gcs_bucket+"/files")
		whtml(self,"utility/htmls/uploader.html",domain=domain,upload_url=upload_url)

class Items(webapp.RequestHandler): #NOTICE: << Publicly available at /communityitems! >> [10/10/16]
	@ndb.toplevel
	def get(self):
		domain=gdi(self)
		#if not is_current_user_admin():
		#	user=get_user(self,domain)
		#	if not user or user.k()+"" not in [ellian_id,hello_id]: return
		mode,items=gdmul(self,"mode","items")
		whtml(self,"utility/htmls/items.html",domain=domain,mode=mode,items=items)
	def post(self): self.get()

class Backups(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,m,id):
		domain=gdi(self)
		backups=Backup.query(Backup.backup_item_id=="%s|%s"%(m,id)).order(-Backup.backup_created).fetch(50)
		whtml(self,"utility/htmls/backups.html",domain=domain,backups=backups)
	def post(self,m,id): self.get(m,id)

application = webapp.WSGIApplication([
	('/admin/renderer', Renderer),
	('/admin/executor', Executor),
	('/admin/items', Items),
	('/admin/upload', PhotoUploader),
	('/admin/upload/handler', PhotoUpload),
	('/admin/backups/(.*)/(.*)', Backups),
	('/admin/events/?(.*)', Events),
	('/admin/map_editor/?(.*)', MapEditor),
	('/admin/selector/?(.*)', Selector),
	('/admin/items', Items),
	],debug=is_sdk)