from config import *
from functions import *

def test():
	@after_this_request
	def add_header(response):
		response.headers['X-Foo'] = 'Parachute'
		return response

@app.route('/test', methods=['POST', 'GET'])
@app.route('/test/<name>', methods=['POST', 'GET'])
@ndb.toplevel
def serve_test(name=""):
	domain=gdi(request)
	if name=="hash":
		start=datetime.now()
		#logging.info(pbkdf2_hex("test","123456",iterations=160))
		logging.info(mssince(start))
	elif name=="levels":
		xp=200
		for i in xrange(100):
			html=""
			new_xp=xp
			while new_xp>=100: new_xp/=10
			new_xp=int(new_xp)
			while new_xp*10<=xp: new_xp*=10
			xp=new_xp
			html+="level %s %sxp %s worms %s 40K's<br />"%((i+1),xp,xp/200.0,xp/40000.0)
			xp*=1.25
		return html
	elif name.startswith("pixi_"):
		return shtml("utility/htmls/tests/%s.html"%name,domain=domain)
	elif name=="versions":
		html="GAE_ENV: "+os.getenv('GAE_ENV', '')+" <br />"
		html+="is_sdk: "+str(is_sdk)+" <br />"
		# html+=str(request.headers)
		return html
	else:
		request.response=make_response('Setting the cookie')
		#test()
		return request.response