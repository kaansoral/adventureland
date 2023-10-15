from config import *
from facebook import *
from functions import *
from appcomponents.library import *
from models import *
from modelclasses import *
from rpgapp.functionz import *


class Handler(webapp.RequestHandler):
    def get(self,adv=None):
	path = os.path.join(os.path.dirname(__file__), "htmls/dyn.html")
        self.response.out.write(template.render(path,dict()))
    def post(self,adv=None):
	self.get(adv)


class SaverHandler(webapp.RequestHandler):
    def get(self,adv):
	pass
    def post(self,adv):
	self.get(adv)