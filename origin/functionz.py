import random
from functions import *
from modelclasses import *
import json as simplejson

class RApp(XApp):
    def __init__(self,appid):
        XApp.__init__(self,appid)
	self.appid=appid
	self.adventure=getattr(self,"adventure","adventure1")

class RUser(SUser):
    def __init__(self, application, id, facebook, permissions,app=None,additional_info="",the_webapp=None):
	SUser.__init__(self, application, id, facebook, permissions,app,additional_info,the_webapp)
        if getattr(self,"login",0): return
	self.credits=getattr(self,"credits",0)
	self.rpguser.third_party_id=getattr(self.me,"third_party_id",0)
	self.rpguser.name=getattr(self.me,"name","Secret")
	if getattr(self.rpguser,"password","GG")=="GG":
	    setattr(self.rpguser,"password",randomStr(10))

def nick_good(nick):
    if nick.isalnum():
	return True

def nick_available(nick,adv):
    nn=nick.lower()
    q=RPGChar.all()
    q.filter("adventure =",adv)
    q.filter("nrep =",nn)
    qq=q.get()
    if qq:
	return False
    return True