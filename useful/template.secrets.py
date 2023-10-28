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
