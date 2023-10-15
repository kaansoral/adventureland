from config import *
from functions import *

class DownloadHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self):
		password,iid=gdmul(self,"password","iid")
		if password!=ELEMENT_PASSWORD: logging.error("breach attempt"); return
		element=get_by_iid(iid)
		self.response.out.write(cPickle.dumps(element))
	def post(self): self.get()

class PostTaskHandler(webapp.RequestHandler):
	@ndb.toplevel
	def post(self):
		domain=gdi(self)
		password=gdmul(self,"p")
		if password==SDK_UPLOAD_PASSWORD:
			logging.info("received a post_task")
			task_code,obj1,obj2,obj3=gdmul(self,"task_code","obj1","obj2","obj3"); element=None; element2=None; result=""
			if obj1: element=cPickle.loads(str(obj1))
			if obj2: element2=cPickle.loads(str(obj2))
			if obj3: element2=cPickle.loads(str(obj3))
			exec(task_code)
			logging.info(result)
			self.response.headers.add_header('Content-Type','application/x-www-form-urlencoded')
			if self.response.out.body and not result:
				result=self.response.out.body
			self.response.out.clear()
			self.response.out.write(cPickle.dumps(result))
	def get(self): self.post()

class PaymentwallHandler(webapp.RequestHandler):
	@ndb.toplevel
	def post(self):
		domain=gdi(self)
		self.response.out.write("1")
	def get(self): self.post()

class SuperRewardsHandler(webapp.RequestHandler):
	@ndb.toplevel
	def post(self):
		domain=gdi(self)
		id,uid,oid,new,total,sig=gdmul(self,"id","uid","oid","new","total","sig")
		logging.info("super_rewards %s"%([id,uid,oid,new,total,sig]))
		if not marker_check("superrewards-%s-%s"%(id,uid)):
			add_event(None,"superrewards_repeated",[],info=cGG(message="Super Rewards: callback repeated %s %s %s"%(uid,id,new),id=id,uid=uid,oid=oid,new=new,total=total,sig=sig))
			self.response.out.write("1")
			return
		user=get_by_iid("user|%s"%uid)
		if not user:
			add_event(None,"superrewards_no_user",[],info=cGG(message="Super Rewards: user not found for %s %s %s"%(uid,id,new),id=id,uid=uid,oid=oid,new=new,total=total,sig=sig))
			self.response.out.write("4") #http://docs.superrewards.com/docs/notification-postbacks
			return
		add_event(user,"superrewards_cash",["cashflow","payments"],info=cGG(message="Super Rewards: %s received %s shells"%(user.name,new),id=id,uid=uid,oid=oid,new=new,total=total,sig=sig))
		add_cash(user,int(math.ceil(int(new))),referrer=1)
		self.response.out.write("1")
	def get(self): self.post()

application = webapp.WSGIApplication([
	('/tasks/download.*', DownloadHandler),
	('/tasks/post.*', PostTaskHandler),
	('/tasks/pwallping.*', PaymentwallHandler),
	('/tasks/srcallback.*', SuperRewardsHandler),
	],debug=is_sdk)