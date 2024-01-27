from config import *
from functions import *

@app.route('/tasks/download')
@ndb.toplevel
def serve_map_download(request):
	password,iid=gdmul(request,"password","iid")
	if password!=ELEMENT_PASSWORD: logging.error("breach attempt"); return
	element=get_by_iid(iid)
	return cPickle.dumps(element)

@app.route('/tasks/post',methods=['GET','POST'])
@ndb.toplevel
def serve_post(request):
	domain=gdi(request)
	password=gdmul(request,"p")
	if password==SDK_UPLOAD_PASSWORD:
		logging.info("received a post_task")
		task_code,obj1,obj2,obj3=gdmul(request,"task_code","obj1","obj2","obj3"); element=None; element2=None; result=""
		if obj1: element=cPickle.loads(str(obj1))
		if obj2: element2=cPickle.loads(str(obj2))
		if obj3: element2=cPickle.loads(str(obj3))
		exec(task_code)
		logging.info(result)
		request.response.headers.add_header('Content-Type','application/x-www-form-urlencoded')
		if request.response.out.body and not result:
			result=request.response.out.body
		request.response.out.clear()
		request.response.set_data(cPickle.dumps(result))
		return request.response
	else:
		return "password_issue"