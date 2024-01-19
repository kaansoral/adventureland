stripe_test_api_key="sk_test_"
stripe_test_pkey="pk_test_"
stripe_api_key="pk_live_"
stripe_pkey="sk_live_"
steam_web_apikey="B4XXXXXXXXXXXXXX..."
steam_publisher_web_apikey="F9XXXXXXXXXXXX..."
sdk_password="123"
amazon_ses_user='AKXXXXXXXX...'
amazon_ses_key='aAXXXXXXXXX...'

#Master Passwords
ACCESS_MASTER="123" #this key is the master key of all servers, gives access to data/eval/render, most juicy key [03/08/17]
BOT_MASTER="123" #this key lets bots identify themselves as bots [03/08/17]
SERVER_MASTER="123" #this key lets servers identify themselves as servers [03/08/17]
#IMPORTANTNOTE: also edit the "keyword"/"master"/"bot_key" with SERVER_MASTER/ACCESS_MASTER/BOT_MASTER in /node/variables.js and /node/live_variables.js [04/08/17]
MAC_APPLICATION_LOADER="aaaa-bbbb-cccc-..."

"""
ssh-keygen -o #Doesn't work
ssh-keygen -t rsa -b 4096
"""

https_mode = False # Set to false if you dont want to run the server in https mode. # Default True
always_amazon_ses = False # Set to true if you want to always use amazon ses for emails. # Default True
game_name = "Adventure land" # Default "Adventure Land"
appengine_id = "twodimensionalgame" # Default "twodimensionalgame"
live_domain = "0.0.0.0" # Default "adventure.land"
sdk_domain = "0.0.0.0" # Default "thegame.com"
base_url = "http://appserver:8080" # Base server url. Location of the dev appserver. This is defined in the dockerFile or defined how you manually start the dev appserver
server_ip = "0.0.0.0" # Default "192.168.1.125"
