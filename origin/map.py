from config import *
from facebook import *
from functions import *
from appcomponents.library import *
from models import *
from modelclasses import *
from rpgapp.functionz import *

class Handler(webapp.RequestHandler):
    def get(self,mapkey=None):
	if not mapkey:
	    return
	map=RPGMap.get_by_key_name(mapkey)
	if not map:
	    map=RPGMap(key_name=mapkey,adventure=mapkey.split("-")[0])
	mapinfo=cPickle.loads(map.info)
	mapinfo.rep=getattr(mapinfo,"rep","{}")
	if self.request.get("map_rep"):
	    logging.info("Saving Map ...")
	    mapinfo.rep=self.request.get("map_rep")
	    map.info=cPickle.dumps(mapinfo)
	    map.put()
	    ln=len(map.info);ln=ln/10000.0;ln="%.3lf%%"%ln
	    self.response.out.write(ln)
	    return
	path = os.path.join(os.path.dirname(__file__), "htmls/mapeditor.html")
        self.response.out.write(template.render(path,dict(info=mapinfo,mapkey=mapkey)))
    def post(self,adv=None):
	self.get(adv)

class MapGetter(webapp.RequestHandler):
    def get(self,mapkey=None):
	if not mapkey:
	    return
	map=RPGMap.get_by_key_name(mapkey)
	if not map:
	    map=RPGMap(key_name=mapkey,adventure=mapkey.split("-")[0])
	mapinfo=cPickle.loads(map.info)
	mapinfo.rep=getattr(mapinfo,"rep","{}")
        self.response.out.write(mapinfo.rep)
    def post(self,adv=None):
	self.get(adv)