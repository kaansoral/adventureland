from config import *
from facebook import *
from functions import *
from models import *
from modelclasses import *
from rpgapp.functionz import *

class Handler(webapp.RequestHandler):
    def get(self,appid):
	permissions="email"
	app=RApp(appid)
	info=login(self,app,permissions)
	if not info.logged:
	    return
	facebook=GraphAPI(info.access_token)
	appuser=RUser(app.db,info.id,facebook,permissions,app,the_webapp=self)
        if getattr(appuser,"login",0): self.response.out.write(appuser.login); return
        if not appuser.admin:
            return
        adminuser=get_cached(User,appuser.appuser.id)
        usage=len(app.db.info)
        usage=usage/10000.0
        usage="%.2f%%"%usage
	path = os.path.join(os.path.dirname(__file__), "htmls/admin.html")
	self.response.out.write(template.render(path,dict(usage=usage,adminuser=adminuser,app=app,user=appuser,inside="/admin")))
        appuser.ssave()
        app.ssave()
    def post(self,appid):
	self.get(appid)
