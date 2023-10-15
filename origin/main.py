from config import *
from facebook import *
from functions import *
from appcomponents.library import *
from models import *
from modelclasses import *
from rpgapp.functionz import *
import rpgapp.admin as admin
import rpgapp.map as map
import rpgapp.dyn as dyn

class MainHandler(webapp.RequestHandler):
    def get(self,appid):
	permissions="email"
	app=RApp(appid)
	info=login(self,app,permissions)
	if not info.logged:
	    return
	facebook=GraphAPI(info.access_token)
	appuser=RUser(app.db,info.id,facebook,permissions,app,the_webapp=self)
        if getattr(appuser,"login",0): self.response.out.write(appuser.login); return
	rpginfo=cPickle.loads(appuser.rpguser.info)
	chars=getattr(rpginfo,"%s_chars"%app.adventure,[])
	path = os.path.join(os.path.dirname(__file__), "htmls/index.html")
        self.response.out.write(template.render(path,dict(app=app,user=appuser,chars=chars)))
	appuser.ssave()
    def post(self,appid):
	self.get(appid)

class GameHandler(webapp.RequestHandler):
    def get(self,appid,server_id=0):
	permissions="email"
	app=RApp(appid)
	info=login(self,app,permissions)
	if not info.logged:
	    return
	facebook=GraphAPI(info.access_token)
	appuser=RUser(app.db,info.id,facebook,permissions,app,the_webapp=self)
        if getattr(appuser,"login",0): self.response.out.write(appuser.login); return
	rpginfo=cPickle.loads(appuser.rpguser.info)
	chars=getattr(rpginfo,"%s_chars"%app.adventure,[])
	current=0
	path = os.path.join(os.path.dirname(__file__), "htmls/index.html")
	try:
	    if self.request.get("char"):
		logging.info("Creating a new character")
		nick=self.request.get("char")
		if not nick_good(nick):
		    self.response.out.write(template.render(path,dict(app=app,user=appuser,error="Nickname should only consist of characters and numbers")))
		    return
		if not nick_available(nick,app.adventure):
		    self.response.out.write(template.render(path,dict(app=app,user=appuser,error="Nickname is not available")))
		    return
		ch=GG()
		ch.id=randomStr(30)
		ch.nick=nick
		ch.adventure=app.adventure
		chh=RPGChar(key_name=dgt(appuser.appuser.id,ch.id),id=appuser.appuser.id,nrep=nick.lower(),nick=nick,adventure=app.adventure)
		if isAppengine(): db.put_async(chh)
		else: chh.put()
		chars.append(ch)
		setattr(rpginfo,"%s_chars"%app.adventure,chars)
		appuser.rpguser.info=cPickle.dumps(rpginfo)
		appuser.tosave=1
		current=ch
	    elif self.request.get("schar"):
		current=chars[0]
		for ch in chars:
		    if ch.id==self.request.get("schar"):
			tch=ch
	    else:
		current=chars[0]
	except:
	    logTrace()
	    self.response.out.write(template.render(path,dict(app=app,user=appuser,error="A problem occured")))
	    return
	path = os.path.join(os.path.dirname(__file__), "htmls/game.html")
        self.response.out.write(template.render(path,dict(app=app,user=appuser,char=current)))
	appuser.ssave()
    def post(self,appid,server_id=0):
	self.get(appid,server_id)

class AckHandler(webapp.RequestHandler):
    def get(self,appid,user=0,char=0,passw=0):
	app=RApp(appid)
	path = os.path.join(os.path.dirname(__file__), "htmls/ack.html")
	rpgchar=RPGChar.get_by_key_name(dgt(user,char))
	if not rpgchar:
	    self.response.out.write(template.render(path,dict(app=app,error=1)))
	    return
        self.response.out.write(template.render(path,dict(app=app,rpgchar=rpgchar)))
    def post(self,appid,user=0,char=0,passw=0):
	self.get(appid,server_id)

application = webapp.WSGIApplication([
    ('/rpgapp/getdyn/(.*)/', dyn.Handler),
    ('/rpgapp/getdyn/(.*)', dyn.Handler),
    ('/rpgapp/getmap/(.*)/', map.MapGetter),
    ('/rpgapp/getmap/(.*)', map.MapGetter),
    ('/rpgapp/map/(.*)/', map.Handler),
    ('/rpgapp/map/(.*)', map.Handler),
    ('/rpgapp/(\d*)/game/(.*)/', GameHandler),
    ('/rpgapp/(\d*)/game/.*', GameHandler),
    ('/rpgapp/(\d*)/ackuser/(.*)/(.*)/(.*)/', AckHandler),
    ('/rpgapp/(\d*)/ackuser/(.*)/(.*)/(.*)', AckHandler),
    ('/rpgapp/(\d*)/admin/?.*', admin.Handler),
    ('/rpgapp/(\d*)/?.*', MainHandler),
    ],debug=not isAppengine())
