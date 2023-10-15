from config import *
from functions import *

class User(ndb.Expando):
	name=ndb.StringProperty()
	email=ndb.StringProperty(repeated=True)
	password=ndb.StringProperty(indexed=False)
	credits=ndb.IntegerProperty(default=0)
	created=ndb.DateTimeProperty(auto_now_add=True)
	banned=ndb.BooleanProperty(default=False)
	referrer=ndb.StringProperty()
	timezone=ndb.IntegerProperty(default=0) #0-23 utc offset
	cash=ndb.IntegerProperty(default=0)
	worth=ndb.IntegerProperty(default=0) #total gold worth - including characters
	language=ndb.StringProperty(default="en")
	platform=ndb.StringProperty() # web, steam, mas
	pid=ndb.StringProperty() # platform id
	info=ndb.PickleProperty()
	guild=ndb.StringProperty()
	server=ndb.StringProperty()#for "The Bank" [02/09/16]
	friends=ndb.StringProperty(repeated=True)
	#online=ndb.BooleanProperty(default=False)
	last_online=ndb.DateTimeProperty(auto_now_add=True)
	cli_time=ndb.DateTimeProperty()
	to_backup=ndb.BooleanProperty(default=False)
	popularity=ndb.FloatProperty(default=0.0)
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Guild(ndb.Expando):
	realm=ndb.StringProperty(default="main")
	name=ndb.StringProperty()
	short=ndb.StringProperty()
	members=ndb.StringProperty(repeated=True)
	created=ndb.DateTimeProperty(auto_now_add=True)
	info=ndb.PickleProperty()
	server=ndb.StringProperty()
	last_sync=ndb.DateTimeProperty(auto_now_add=True)
	to_backup=ndb.BooleanProperty(default=False)
	popularity=ndb.FloatProperty(default=0.0)
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Character(ndb.Expando):
	realm=ndb.StringProperty(default="main")
	name=ndb.StringProperty()
	type=ndb.StringProperty()
	level=ndb.IntegerProperty(default=1)
	worth=ndb.IntegerProperty(default=0) #total gold worth
	xp=ndb.IntegerProperty(default=0)
	owner=ndb.StringProperty()
	referrer=ndb.StringProperty()
	created=ndb.DateTimeProperty(auto_now_add=True)
	platform=ndb.StringProperty() # web, steam, mas
	pid=ndb.StringProperty() # platform id
	info=ndb.PickleProperty()
	private=ndb.BooleanProperty(default=False)
	online=ndb.BooleanProperty(default=False)
	server=ndb.StringProperty()
	guild=ndb.StringProperty()
	friends=ndb.StringProperty(repeated=True)
	last_sync=ndb.DateTimeProperty(auto_now_add=True)
	last_online=ndb.DateTimeProperty(auto_now_add=True)
	to_backup=ndb.BooleanProperty(default=False)
	popularity=ndb.FloatProperty(default=0.0)
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Server(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	last_update=ndb.DateTimeProperty(auto_now_add=True)
	online=ndb.BooleanProperty(default=False)
	gameplay=ndb.StringProperty(default="normal")
	realm=ndb.StringProperty(default="main")
	name=ndb.StringProperty()
	region=ndb.StringProperty()
	actual_ip=ndb.StringProperty()
	ip=ndb.StringProperty()
	port=ndb.IntegerProperty()
	version=ndb.StringProperty()
	info=ndb.PickleProperty()
	#utilities
	k=k_factory; _pre_put_hook=pre_put_hook

class Message(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	owner=ndb.StringProperty()
	author=ndb.StringProperty() #player.owner
	fro=ndb.StringProperty()
	to=ndb.StringProperty(repeated=True)
	type=ndb.StringProperty() # ambient, private, party, server
	server=ndb.StringProperty()
	info=ndb.PickleProperty()
	#utilities
	k=k_factory; _pre_put_hook=pre_put_hook

class Mail(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	owner=ndb.StringProperty(repeated=True)
	read=ndb.BooleanProperty(default=False)
	item=ndb.BooleanProperty(default=False); taken=ndb.BooleanProperty(default=False)
	fro=ndb.StringProperty()
	to=ndb.StringProperty()
	type=ndb.StringProperty() # system, mail
	info=ndb.PickleProperty()
	#utilities
	k=k_factory; _pre_put_hook=pre_put_hook

class Event(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	expire_at=ndb.DateTimeProperty()
	tag=ndb.StringProperty(repeated=True)
	item_id=ndb.StringProperty()
	type=ndb.StringProperty()
	info=ndb.PickleProperty()
	#utilities
	k=k_factory; _pre_put_hook=pre_put_hook

class Backup(ndb.Expando):
	backup_item_id=ndb.StringProperty()
	backup_created=ndb.DateTimeProperty(auto_now_add=True)
	expire_at=ndb.DateTimeProperty()
	backup_info=ndb.PickleProperty()
	info=ndb.PickleProperty()
	#utilities
	random_number=ndb.IntegerProperty()
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Map(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	updated=ndb.DateTimeProperty(auto_now_add=True)
	player=ndb.BooleanProperty(default=False)
	info=ndb.PickleProperty()
	#utilities
	k=k_factory; _pre_put_hook=pre_put_hook

class InfoElement(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	info=ndb.PickleProperty()
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Upload(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	type=ndb.StringProperty(default="photo")
	info=ndb.PickleProperty()
	#utilities
	k=k_factory; _pre_put_hook=pre_put_hook

class IP(ndb.Expando):
	created=ndb.DateTimeProperty(auto_now_add=True)
	info=ndb.PickleProperty()
	users=ndb.StringProperty(repeated=True)
	characters=ndb.StringProperty(repeated=True)
	random_id=ndb.StringProperty()
	referrer=ndb.StringProperty()
	exception=ndb.BooleanProperty(default=False)
	last_exception=ndb.DateTimeProperty()
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Marker(ndb.Expando):
	pass #just to mark things

class MarkedPhrase(ndb.Expando):
	type=ndb.StringProperty()
	phrase=ndb.StringProperty()
	owner=ndb.StringProperty()
	created=ndb.DateTimeProperty(auto_now_add=True)
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook

class Player(ndb.Expando): #forgot what this was even for, it's unused [19/09/18] - to make User high level, and Player realm based, bank is on the Player entity [19/11/18]
	realm=ndb.StringProperty(default="main")
	name=ndb.StringProperty()
	credits=ndb.IntegerProperty(default=0)
	created=ndb.DateTimeProperty(auto_now_add=True)
	referrer=ndb.StringProperty()
	timezone=ndb.IntegerProperty(default=0) #0-23 utc offset
	cash=ndb.IntegerProperty(default=0)
	info=ndb.PickleProperty()
	server=ndb.StringProperty()#for "The Bank" [02/09/16]
	friends=ndb.StringProperty(repeated=True)
	#online=ndb.BooleanProperty(default=False)
	last_online=ndb.DateTimeProperty(auto_now_add=True)
	#utilities
	random_number=ndb.IntegerProperty() #for cron scaling
	has_scatter=ndb.BooleanProperty(indexed=False)
	k=k_factory; _pre_put_hook=pre_put_hook