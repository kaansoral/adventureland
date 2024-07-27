GAME_NAME = "Adventure Land"
APPENGINE_ID = "twodimensionalgame"
DOMAIN_NAME = "adventure.land"
#IMPORTANT: SPECIAL PAGE RULES ARE NEEDED: https://dash.cloudflare.com/b6f5a13bded5fdd273e4a1cd3777162d/adventure.land/page-rules - uss1 / eus1 was best
IP_TO_SUBDOMAIN = {
	"35.187.255.184":"asia1",
	"35.246.244.105":"eu1",
	"35.228.96.241":"eu2",
	"35.234.72.136":"eupvp",
	"35.184.37.35":"us1",
	"34.67.188.57":"us2",
	"34.75.5.124":"us3",
	"34.67.187.11":"uspvp",
	"195.201.181.245":"eud1",
	"158.69.23.127":"usd1"
}

# This is currently only used in SDK mode to map the hostname
REQUEST_IP_TO_HOSTNAME = {
	"172.20.0.4":"localhost", #EU1 docker internal ip
	"172.20.0.3":"localhost", #US1 docker internal ip
}