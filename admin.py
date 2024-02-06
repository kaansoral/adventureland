from config import *
from functions import *

@app.route('/admin/make')
@ndb.toplevel
def serve_admin_maker():
	domain=gdi(request); user=get_user(request,domain)
	if not user or user.info.email!="your_email_here": return "no permission"
	user.admin=True
	user.put()
	return "done!"

@app.route('/admin/renderer')
@ndb.toplevel
def serve_render():
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	return shtml("utility/htmls/renderer.html",domain=gdi(request))

@app.route('/admin/events/<tag>')
@ndb.toplevel
def serve_events(tag):
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	cursor=gdmul(request,"cursor")
	if not tag: tag="noteworthy"
	if tag=="all": events=Event.query().order(-Event.created)
	else: events=Event.query(Event.tag==tag).order(-Event.created)
	if cursor: events,ncursor,more=events.fetch_page(100,start_cursor=ndb.Cursor(urlsafe=cursor))
	else: events,ncursor,more=events.fetch_page(100)
	ncursor=more and ncursor.urlsafe()
	return whtml(request,"utility/htmls/events.html",domain=gdi(request),events=events,ncursor=ncursor)

def executor_task(the_code):
	request=None
	try:
		exec(the_code)
	except:
		#admin_email(domain,"executor_task failed")
		log_trace()

@app.route('/admin/executor',methods=['GET'])
@ndb.toplevel
def serve_executor_get():
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	return whtml(request,"utility/htmls/executor.html",domain=gdi(request))

@app.route('/admin/executor',methods=['POST'])
@ndb.toplevel
def serve_executor_post():
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	the_none="the_none_output_48"
	the_code,is_task=gdmul(request,"code","is_task"); output=the_none; json_output=None; json_size=0; html_output=the_none; output_html=the_none; inspect=the_none; ess=datetime.now()
	logging=custom_logging()
	#logging=code_logs
	if is_task:
		deferred.defer(executor_task,the_code,_queue="default")
		output="executor_task triggered"
	else:
		try:
			if 1/2!=0:
				ld={}
				exec(the_code,globals(),ld)
				output=ld.get("output",output)
				json_output=ld.get("json_output",json_output)
				html_output=ld.get("html_output",html_output)
				output_html=ld.get("output_html",output_html)
				inspect=ld.get("inspect",inspect)
			else: exec(the_code)
		except DeadlineExceededError: logging.error("Deadline Exceeded")
		except:
			log_trace_i("",logging)
	if json_output!=None: json_size=olen(json_output); json_output=json.dumps(recursive_datetime_conversion(json_output))
	if html_output!=the_none: output_html=html_output
	return whtml(request,"utility/htmls/executor_output.html",logs=logging.output(),created=datetime.now(),ess_ms=mssince(ess),
		output=output,json=json_output,json_size=json_size,html_output=output_html,inspector_output=(inspect!=the_none and ginspect(inspect,force_inspection=1)))


@app.route('/communitymaps/<name>',methods=['GET'])
def serve_community_maps_get(name=""):
	if not name: return "no map"
	name=name.split("/")[0]
	domain=gdi(request); user=get_user(request,domain)
	map=get_by_iid("map|%s"%name)
	return whtml(request,"utility/htmls/map_editor.html",domain=domain,name="main",map=map,tilesets=tilesets,community=1)

@ndb.toplevel
@app.route('/communitymaps/<name>',methods=['POST'])
def serve_community_maps_post(name=""):
	data=request.values.get("data")
	name=name.split("/")[0]
	if not ((name in community_maps) or name.startswith("jayson_")): return make_response("Not Permitted!")
	domain=gdi(request); user=get_user(request,domain)
	if name.startswith("jayson_") and (not user or (user.k()+"") not in inner_circle): return make_response("Not Permitted!")
	map=get_by_iid("map|%s"%name)
	if not map: map=Map(key=ndb.Key(Map,name),info=GG())
	map.info.data=json.loads(data)
	process_map(map)
	map.updated=datetime.now()
	map.put()
	copy_map(name,"test")
	return make_response(to_pretty_num(olen(map.info.data)))

@app.route('/editmap')
def serve_map_editor_redirect():
	return redirect(url_for('editmap/main'))

# from /admin/executor set the user.info.map_editor flag to True for artists, this also unlocks the interface in the game menu
@app.route('/editmap/<name>',methods=['GET'])
def serve_editmap_get(name=""):
	if not name: return "no map"
	name=name.split("/")[0]
	domain=gdi(request); user=get_user(request,domain)
	if not user or not (gf(user,"map_editor") or getattr(user,"admin",False)): return make_response("Not Permitted!")
	map=get_by_iid("map|%s"%name)
	return whtml(request,"utility/htmls/map_editor.html",domain=domain,name=name,map=map,tilesets=tilesets,community=1)

@ndb.toplevel
@app.route('/editmap/<name>',methods=['POST'])
def serve_editmap_post(name=""):
	data=request.values.get("data")
	name=name.split("/")[0]
	domain=gdi(request); user=get_user(request,domain)
	if not user or not (gf(user,"map_editor") or getattr(user,"admin",False)): return make_response("Not Permitted!")
	map=get_by_iid("map|%s"%name)
	if not map: map=Map(key=ndb.Key(Map,name),info=GG())
	map.info.data=json.loads(data)
	process_map(map)
	map.updated=datetime.now()
	map.put()
	copy_map(name,"test")
	return make_response(to_pretty_num(olen(map.info.data)))

@app.route('/admin/selector')
@app.route('/communityselector')
def serve_selector_options():
	return whtml(request,"utility/htmls/imagesets/select-imageset.html",domain=gdi(request),imagesets=imagesets)

@app.route('/admin/selector/<name>')
@app.route('/communityselector/<name>') #NOTICE: << Publicly available at /communityselector! >> [10/10/16]
def serve_selector(name=""):
	name=name.split("/")[0]
	file=imagesets[name]["file"]
	size=imagesets[name]["size"]
	width=imagesets[name]["columns"]*size
	height=imagesets[name]["rows"]*size
	xs=[]; ys=[]
	for i in xrange(width/size): xs.append(i)
	for j in xrange(height/size): ys.append(j)
	return whtml(request,"utility/htmls/imagesets/selector.html",domain=gdi(request),name=name,file=file,size=size,width=width,height=height,xs=xs,ys=ys,scale=3)

#TODO: Re-implement uploaders at uploaders.py

@app.route('/admin/items')
@app.route('/communityitems') #NOTICE: << Publicly available at /communityitems! >> [10/10/16]
def serve_items():
	domain=gdi(request)
	#if not is_current_user_admin():
	#	user=get_user(self,domain)
	#	if not user or user.k()+"" not in [ellian_id,hello_id]: return
	mode,items=gdmul(request,"mode","items")
	return whtml(request,"utility/htmls/items.html",domain=domain,mode=mode,items=items)

@app.route('/admin/backups/<m>/<id>')
@ndb.toplevel
def serve_backups(m,id):
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	backups=Backup.query(Backup.backup_item_id=="%s|%s"%(m,id)).order(-Backup.backup_created).fetch(50)
	whtml(request,"utility/htmls/backups.html",domain=domain,backups=backups)

@app.route('/admin/ips')
def serve_ips():
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	def ip_to_html(ip):
		return "<div style='margin-bottom: 2px'>%s {%s} [%s]</div>"%(ip.info.explanation,ip.random_id,ip.info.limit)
	html="<style> html{background-color:gray}</style>"
	for ip in IP.query(IP.exception==True).fetch(5000): html+=ip_to_html(ip)
	return html

@app.route('/admin/visualize/<name>')
def serve_visualize(name=""):
	domain=gdi(request); user=get_user(request,domain)
	if not user or not getattr(user,"admin",False): return "no permission"
	character=get_character(name)
	if not character: return whtml(request,"htmls/simple_message.html",domain=domain,message="Not Found")
	characters=[character]
	for c in Backup.query(Backup.backup_item_id==character.k('i')).order(-Backup.backup_created).fetch(80):
		c.name=c.info.name="%s%s"%(c.info.name,(datetime.now()-c.backup_created).days)
		logging.info(c.info.slots["mainhand"]["name"])
		characters.append(c)
	domain.title=character.info.name
	return whtml(request,"htmls/player.html",domain=domain,characters=characters)
