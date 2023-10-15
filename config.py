# This Python file uses the following encoding: utf-8
from __future__ import with_statement
import os,logging,cgi
if os.environ.get('SERVER_SOFTWARE', '').startswith('Dev'):
	try:
		from google.appengine.tools.dev_appserver import HardenedModulesHook
		HardenedModulesHook._WHITE_LIST_C_MODULES += ['_ctypes', 'gestalt']
	except: pass
import sys,json,random,time,re,math,copy,base64,cPickle,jinja2,types,urllib,operator,pickle,unicodedata
import gc as gbc
from lxml import etree as lxmletree
import datetime as rdatetime
import time as rtime
from datetime import datetime,timedelta,date
from google.appengine.api.users import is_current_user_admin
from google.appengine.ext.webapp import blobstore_handlers # template,util,
from google.appengine.api import memcache,urlfetch,urlfetch_errors,mail,taskqueue,images,files,namespace_manager,search,modules,logservice
from google.appengine.ext import webapp,ndb,blobstore,deferred
from google.appengine.runtime import DeadlineExceededError
from google.appengine.runtime.apiproxy_errors import DeadlineExceededError as DeadlineExceededError2
from google.appengine.datastore.datastore_query import Cursor

class mj2u(jinja2.Undefined):
	def __str__(self): 0 and logging.info("Non existing variable"); return ""
	def __call__(self,*a,**d): 0 and logging.info("Non existing variables non existing call with a %s d %s"%(a,d)); return "";mj2u()
	def __getattr__(self,*d,**f):
		return mj2u()
j2_loader=jinja2.FileSystemLoader(os.path.dirname(__file__))
class GG(): pass

import secrets

from libraries.country_to_latlon import c_to_ll
from libraries import stripe
from libraries import amazon_ses
#from libraries import get_image_size

if os.environ.get('SERVER_SOFTWARE', '').startswith('Dev'):
	is_sdk=True; is_production=is_appengine=False
	stripe.verify_ssl_certs = False
	stripe.api_key=secrets.stripe_test_api_key
	stripe_pkey=secrets.stripe_test_pkey
else:
	is_sdk=False; is_production=is_appengine=True
	stripe.api_key=secrets.stripe_pkey #secret-key
	stripe_pkey=secrets.stripe_api_key #publishable-key
steam_web_apikey=secrets.steam_web_apikey #for domain adventure.land: https://partner.steamgames.com/doc/webapi_overview/auth#create_publisher_key
steam_publisher_web_apikey=secrets.steam_publisher_web_apikey #from: https://partner.steamgames.com/pub/group/48241/61965/

from design.animations import *
from design.achievements import *
from design.game import *
from design.sprites import *
from design.dimensions import *
from design.monsters import *
from design.maps import *
from design.npcs import *
from design.items import *
from design.classes import *
from design.levels import *
from design.upgrades import *
from design.drops import *
from design.skills import *
from design.events import *
from design.recipes import *
from design.titles import *
from design.tokens import *
from design.games import *
from design.conditions import *
from design.cosmetics import *
from design.emotions import *
from design.projectiles import *
from design.multipliers import *
import design.precomputed as precomputed
from docs.directory import *
from utility.gallery import *

if is_production:
	#maps["desertland"]["key"]="jayson_desertland_copy"
	pass

game_version=779
SALES=4+5+388+5101+125/20 #donation+manual+macos+steam+sales
update_notes=[
	"Halloween Event!",
	"Last Update [October 13th]",
	"Open sourcing the game this weekend!",
]
ip_to_subdomain={ #IMPORTANT: SPECIAL PAGE RULES ARE NEEDED: https://dash.cloudflare.com/b6f5a13bded5fdd273e4a1cd3777162d/adventure.land/page-rules - uss1 / eus1 was best
	"35.187.255.184":"asia1",
	"35.246.244.105":"eu1",
	"35.228.96.241":"eu2",
	"35.234.72.136":"eupvp",
	"35.184.37.35":"us1",
	"34.67.188.57":"us2",
	"34.75.5.124":"us3",
	"34.67.187.11":"uspvp",
	"195.201.181.245":"eud1",
	"158.69.23.127":"usd1",
}
HTTPS_MODE=True #IMPORTANT: converts server IP's to subdomain urls at create_server_api [17/11/18]
always_amazon_ses=True
SCREENSHOT_MODE=is_sdk and False
game_name="Adventure Land"
appengine_id="twodimensionalgame"
live_domain=["www","adventure","land"]
sdk_domain=["www","thegame","com"]
SDK_UPLOAD_PASSWORD=ELEMENT_PASSWORD=secrets.sdk_password

def gdi(self=None):
	domain=GG()
	if is_sdk:
		domain.base_url=self and "http://%s"%self.request.headers.get("Host") or "http://%s.%s"%(sdk_domain[1],sdk_domain[2])
		domain.pref_url=self and "http://%s"%self.request.headers.get("Host") or "http://%s.%s"%(sdk_domain[1],sdk_domain[2])
		domain.server_ip="192.168.1.125"
		domain.stripe_pkey=stripe_pkey
		domain.stripe_enabled=False
		domain.https_mode=False
		domain.domain=self and ["www",self.request.headers.get("Host").split(".")[0],self.request.headers.get("Host").split(".")[1]] or sdk_domain
	else:
		protocol="http"
		if self and "https" in (self.request.headers.get("Cf-Visitor") or ""): protocol="https"
		domain.base_url="%s://%s.%s"%(protocol,live_domain[1],live_domain[2])
		domain.pref_url="https://%s.%s"%(live_domain[1],live_domain[2])
		domain.stripe_pkey=stripe_pkey
		domain.stripe_enabled=False
		domain.https_mode=HTTPS_MODE
		domain.domain=live_domain
	domain.imagesets=imagesets #for caching [12/07/20]
	domain.sales=SALES
	domain.ip_to_subdomain=ip_to_subdomain
	domain.https=False
	domain.secure_base_url=domain.base_url.replace("http://","https://")
	domain.discord_url="https://discord.gg/44yUVeU"
	domain.is_sdk=is_sdk
	domain.io_version="4.2.0" #upgraded from 1.4.5 now [18/03/17] upgraded from 1.7.2 now [31/12/17] upgraded from 2.1.0 now [20/06/19] 2.3.0 [28/06/20] 4.0.0 [18/03/21]
	domain.cm_version="5.65.1"
	domain.jquery_version="3.2.0" #for some reason the previous version was 2.2.4 instead of 3.1.0 [10/04/17]
	domain.howler_version="2.0.13"
	domain.pixi_version="4.8.2-roundpixels" # Re-visit #PIXI's at updates + TOWN/Server change to test - 4.0.3-dev has weird click
	# LTS: "4.8.2-roundpixels"
	# 4.8.9-custom has an artifact appearing on t2bow
	domain.pixi_fversion=""
	domain.pixi_display_version="v4"
	domain.pixi_layers_version="0.1.7.2"
	domain.pixi_lights_version="2.0.3"
	domain.pixi_filters_version="3.1.1" and "2.6.0c0"
	domain.interact_version="1.2.6"
	domain.gcs_bucket="2dimages"
	domain.v=game_version
	domain.cash=True
	domain.name=game_name
	domain.title=domain.name
	domain.gender_types=gender_types
	domain.character_types=character_types
	domain.screenshot=SCREENSHOT_MODE
	domain.recording_mode=False
	domain.music_on=False
	domain.sfx_on=False
	domain.perfect_pixels=True
	domain.fast_mode=True
	domain.engine_mode=""
	domain.d_lines=True
	domain.sd_lines=True
	domain.newcomer_ui=False
	domain.new_attacks=True
	domain.no_html=False
	domain.is_bot=False
	domain.is_cli=False
	domain.no_graphics=False
	domain.border_mode=False
	domain.purchase_mode=True
	domain.tutorial=True
	domain.boost=0
	domain.access_master=secrets.ACCESS_MASTER
	domain.servers=[]
	domain.characters=[]
	try: domain.scale=int(float(self and self.request.get("scale") or 2))
	except: domain.scale=2
	try: domain.times=int(self and self.request.get("times") or 0)
	except: domain.times=0
	domain.load_character=self and self.request.get("load") or ""
	domain.electron=False
	domain.platform="web"
	domain.update_notes=update_notes
	if self:
		if "Electron" in self.request.headers.get("User-Agent",""):
			domain.electron=True
			if self.request.get("buildid") and "win32" in self.request.get("buildid"): domain.platform="steam"
			if self.request.get("buildid") and "darwin" in self.request.get("buildid"): domain.platform="mac"
			if self.request.cookies.get("music")!="off": domain.music_on=True
			if self.request.cookies.get("sfx")!="off": domain.sfx_on=True
		domain.url=self.request.url
		domain.section=self.request.get("section")
		if self.request.get("test_clicks"): domain.test_clicks=True; domain.pixi_version="4.0.2"
		if self.request.get("no_cache"): domain.v=100000+random.randrange(0,100000000)
		if self.request.get("no_html"): domain.no_html=True
		if self.request.get("no_html")=="bot": domain.no_html="bot"
		if self.request.get("is_bot"): domain.is_bot=True
		if self.request.get("is_cli"): domain.is_cli=True
		if self.request.get("recording_mode"): domain.recording_mode=True; domain.boost=20; domain.sfx_on=False; domain.music_on=False
		if self.request.get("no_graphics") or domain.no_html:
			domain.no_graphics=True;
			domain.pixi_version="fake" #NOGTODO is the hashtag
			domain.pixi_fversion="?v=%s"%game_version
		if self.request.get("borders") or self.request.get("border_mode"): domain.border_mode=True
		if self.request.cookies.get("perfect_pixels_off") and not SCREENSHOT_MODE:
			domain.perfect_pixels=False
		if self.request.cookies.get("d_lines_off"):
			domain.d_lines=False
		if self.request.cookies.get("no_tutorial"):
			domain.tutorial=False
		if self.request.cookies.get("no_fast_mode"):
			domain.fast_mode=False
		if self.request.get("engine") or self.request.cookies.get("engine_mode"):
			domain.engine_mode=self.request.get("engine") or self.request.cookies.get("engine_mode")
		if self.request.cookies.get("sd_lines_off"):
			domain.sd_lines=False
		if self.request.cookies.get("pro_mode"):
			domain.newcomer_ui=False
		if self.request.cookies.get("no_weapons"):
			domain.new_attacks=False
		if self.request.cookies.get("manual_reload"):
			domain.auto_reload="off"
		else:
			domain.auto_reload="auto"
		if self.request.scheme=="https" or self.request.headers.get("Cf-Visitor") and self.request.headers.get("Cf-Visitor").find("https")!=-1:
			domain.https=True
	return domain
secure_cookies=False #not is_sdk

if SCREENSHOT_MODE:
	update_notes=[
		"Last Update [Nth of Month]",
		"Update notes appear here",
		"Usually weekly or daily updates"
	]

j2=jinja2.Environment(loader=j2_loader,undefined=mj2u,autoescape=True,auto_reload=is_sdk,cache_size=-1)

def jrf(f): #jinja_register_filter
	j2.filters[f.__name__]=f
	return f

def jrg(f): #jinja_register_global [21/12/14]
	j2.globals[f.__name__]=f
	return f

really_old=datetime(1970,1,1)
distant_future=datetime(2048,1,1)