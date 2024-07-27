# This Python file uses the following encoding: utf-8
from __future__ import with_statement
# Python3 compatibility [06/01/24]
from __future__ import print_function
import os,logging,cgi
if os.environ.get('SERVER_SOFTWARE', '').startswith('Dev') or not os.getenv('GAE_ENV', '').startswith('standard'):
	try:
		from google.appengine.tools.dev_appserver import HardenedModulesHook
		HardenedModulesHook._WHITE_LIST_C_MODULES += ['_ctypes', 'gestalt']
	except: pass
import sys,json,random,time,re,math,copy,base64,jinja2,types,urllib,operator,pickle,unicodedata
import gc as gbc
from lxml import etree as lxmletree
import datetime as rdatetime
import time as rtime
from datetime import datetime,timedelta,date
from google.appengine.api.users import is_current_user_admin
if 1/2 == 0: #python2
	from urlparse import urlparse
	urlencode=urllib.urlencode
	# webapp/blobstore_handlers is for photo upload and resort tileset upload - so that the python2 sdk still retains upload capabilities [27/01/24]
	from google.appengine.ext import webapp,vendor
	from google.appengine.ext.webapp import blobstore_handlers
	from google.appengine.api import files,logservice # I don't think these were originally used
	vendor.add('lib')
	from libraries import stripe
	from libraries import amazon_ses
	import cPickle
else: #python3
	basestring=str
	xrange=range
	from urllib.parse import urlparse
	urlencode= urllib.parse.urlencode
	from google.appengine.api import wrap_wsgi_app
	from libraries import stripe3 as stripe
	from libraries import amazon_ses3 as amazon_ses
	import _pickle as cPickle

from google.appengine.api import memcache,urlfetch,urlfetch_errors,mail,taskqueue,images,namespace_manager,search,modules
from google.appengine.ext import ndb,blobstore,deferred
from google.appengine.runtime import DeadlineExceededError
from google.appengine.runtime.apiproxy_errors import DeadlineExceededError as DeadlineExceededError2
from google.appengine.datastore.datastore_query import Cursor

def from_base_type(self, value):
	try:
		return pickle.loads(value)
	except:
		return pickle.loads(value,encoding='latin1')
ndb.model.PickleProperty._from_base_type=from_base_type

from flask import Flask, render_template, request, make_response, redirect

app = Flask(__name__)
# app = ndb.toplevel(app) # sadly doesn't work this way

if 1/2 != 0:
	app.wsgi_app = wrap_wsgi_app(app.wsgi_app, use_deferred=True)

class mj2u(jinja2.Undefined):
	def __str__(self): 0 and logging.info("Non existing variable"); return ""
	def __call__(self,*a,**d): 0 and logging.info("Non existing variables non existing call with a %s d %s"%(a,d)); return "";mj2u()
	def __getattr__(self,*d,**f):
		return mj2u()
j2_loader=jinja2.FileSystemLoader(os.path.dirname(__file__))
class GG(): pass

import secrets
import environment

from libraries.country_to_latlon import c_to_ll
#from libraries import get_image_size

if os.environ.get('SERVER_SOFTWARE', '').startswith('Dev') or not os.getenv('GAE_ENV', '').startswith('standard'):
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

game_version=798
SALES=4+5+388+5101+125/20 #donation+manual+macos+steam+sales
update_notes=[
	"Last Update [April 25th]",
	"Cost reduction trial"
]
ip_to_subdomain=environment.IP_TO_SUBDOMAIN
HTTPS_MODE=True #IMPORTANT: converts server IP's to subdomain urls at create_server_api [17/11/18]
always_amazon_ses=True
SCREENSHOT_MODE=is_sdk and False
game_name=environment.GAME_NAME
appengine_id=environment.APPENGINE_ID
live_domain=environment.DOMAIN_NAME
sdk_domain=environment.DOMAIN_NAME
SDK_UPLOAD_PASSWORD=ELEMENT_PASSWORD=secrets.sdk_password

def init_request(request):
	if request and not getattr(request,"response",None):
		request.response=make_response("")
		# this way cookies etc. can be set from the request object ahead of time
		# otherwise the Flask flow is limiting as it doesn't let you do these things from function calls ahead of response creation [25/01/24]

def gdi(request=None):
	init_request(request)
	domain=GG()
	if is_sdk:
		if request:
			url=urlparse(request.url)
			protocol=url.scheme
			hostname=url.hostname
		else:
			protocol="http"
			hostname=sdk_domain

		domain.base_url=protocol + "://" + hostname
		domain.pref_url=domain.base_url
		# domain.server_ip="192.168.1.125" # See environment.py
		domain.stripe_pkey=stripe_pkey
		domain.stripe_enabled=False
		domain.https_mode=False
		domain.domain=hostname
	else:
		protocol="http"
		if request and "https" in (request.headers.get("Cf-Visitor") or ""): protocol="https"
		domain.base_url=protocol + "://" + live_domain
		domain.pref_url=domain.base_url
		domain.stripe_pkey=stripe_pkey
		domain.stripe_enabled=False
		domain.https_mode=HTTPS_MODE
		domain.domain=live_domain
	domain.imagesets=imagesets #for caching [12/07/20]
	domain.sales=SALES
	domain.ip_to_subdomain=ip_to_subdomain
	domain.https=False
	domain.secure_base_url=domain.base_url.replace("http://","https://")
	domain.discord_url=secrets.DISCORD["URL"]["WELCOME"]
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
	try: domain.scale=int(float(request and request.values.get("scale") or 2))
	except: domain.scale=2
	try: domain.times=int(request and request.values.get("times") or 0)
	except: domain.times=0
	domain.load_character=request and request.values.get("load") or ""
	domain.electron=False
	domain.platform="web"
	domain.update_notes=update_notes
	if request:
		if "Electron" in request.headers.get("User-Agent",""):
			domain.electron=True
			if request.values.get("buildid") and "win32" in request.values.get("buildid"): domain.platform="steam"
			if request.values.get("buildid") and "darwin" in request.values.get("buildid"): domain.platform="mac"
			if request.cookies.get("music")!="off": domain.music_on=True
			if request.cookies.get("sfx")!="off": domain.sfx_on=True
		domain.url=request.url
		domain.section=request.values.get("section")
		if request.values.get("test_clicks"): domain.test_clicks=True; domain.pixi_version="4.0.2"
		if request.values.get("no_cache"): domain.v=100000+random.randrange(0,100000000)
		if request.values.get("no_html"): domain.no_html=True
		if request.values.get("no_html")=="bot": domain.no_html="bot"
		if request.values.get("is_bot"): domain.is_bot=True
		if request.values.get("is_cli"): domain.is_cli=True
		if request.values.get("recording_mode"): domain.recording_mode=True; domain.boost=20; domain.sfx_on=False; domain.music_on=False
		if request.values.get("no_graphics") or domain.no_html:
			domain.no_graphics=True;
			domain.pixi_version="fake" #NOGTODO is the hashtag
			domain.pixi_fversion="?v=%s"%game_version
		if request.values.get("borders") or request.values.get("border_mode"): domain.border_mode=True
		if request.cookies.get("perfect_pixels_off") and not SCREENSHOT_MODE:
			domain.perfect_pixels=False
		if request.cookies.get("d_lines_off"):
			domain.d_lines=False
		if request.cookies.get("no_tutorial"):
			domain.tutorial=False
		if request.cookies.get("no_fast_mode"):
			domain.fast_mode=False
		if request.values.get("engine") or request.cookies.get("engine_mode"):
			domain.engine_mode=request.values.get("engine") or request.cookies.get("engine_mode")
		if request.cookies.get("sd_lines_off"):
			domain.sd_lines=False
		if request.cookies.get("pro_mode"):
			domain.newcomer_ui=False
		if request.cookies.get("no_weapons"):
			domain.new_attacks=False
		if request.cookies.get("manual_reload"):
			domain.auto_reload="off"
		else:
			domain.auto_reload="auto"
		if request.scheme=="https" or request.headers.get("Cf-Visitor") and request.headers.get("Cf-Visitor").find("https")!=-1:
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