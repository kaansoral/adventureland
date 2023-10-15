from config import *
from functions import *

class MainHandler(webapp.RequestHandler):
	@ndb.toplevel
	def get(self,name):
		domain=gdi(self)
		if name=="hash":
			start=datetime.now()
			logging.info(pbkdf2_hex("test","123456",iterations=160))
			logging.info(mssince(start))
		elif name=="levels":
			xp=200
			for i in xrange(100):
				new_xp=xp
				while new_xp>=100: new_xp/=10
				new_xp=int(new_xp)
				while new_xp*10<=xp: new_xp*=10
				xp=new_xp
				self.response.out.write("level %s %sxp %s worms %s 40K's<br />"%((i+1),xp,xp/200.0,xp/40000.0))
				xp*=1.25
		elif name.startswith("pixi_"):
			whtml(self,"utility/htmls/tests/%s.html"%name,domain=domain)
		else:
			self.response.out.write("test")
	def post(self,name):
		self.get(name)

application = webapp.WSGIApplication([
	('/test/?(.*)', MainHandler)
	],debug=is_sdk)