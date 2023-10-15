// Mappings: config.py + Cloudflare
machines={
	"eud1":{
		"key":"~/thegame/design/docs/id_rsa.pem",
		"ip":"195.201.181.245",
		"user":"root",
		"map":"eud1",
	},
	"usd1":{
		"key":"~/thegame/design/docs/id_rsa.pem",
		"ip":"158.69.23.127",
		"user":"ubuntu",
		"map":"usd1",
	},
	// "eu1":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"35.246.244.105",
	// 	"user":"kaan",
	// 	"map":"eu1",
	// },
	// "eu2":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"35.228.96.241",
	// 	"user":"kaan",
	// 	"map":"eu2",
	// },
	// "eupvp":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"35.234.72.136",
	// 	"user":"kaan",
	// 	"map":"eupvp",
	// },
	// "asia1":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"35.187.255.184",
	// 	"user":"kaan",
	// 	"map":"asia1",
	// },
	// "us1":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"35.184.37.35",
	// 	"user":"kaan",
	// 	"map":"us1",
	// },
	// "us2":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"34.67.188.57",
	// 	"user":"kaan",
	// 	"map":"us2",
	// },
	// "us3":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"34.75.5.124",
	// 	"user":"kaan",
	// 	"map":"us3",
	// },
	// "uspvp":{
	// 	"key":"~/thegame/design/docs/id_rsa.pem",
	// 	"ip":"34.67.187.11",
	// 	"user":"kaan",
	// 	"map":"uspvp",
	// },
}
// ports: 443, 2053, 2083, 2087, 2096, 8443
// https://blog.cloudflare.com/cloudflare-now-supporting-more-ports/
servers=[
	{
		"region":"EU",
		"name":"I",
		"port":2053,
		"machine":"eud1",
	},
	{
		"region":"EU",
		"name":"II",
		"port":2083,
		"machine":"eud1",
	},
	{
		"region":"EU",
		"name":"PVP",
		"port":2087,
		"machine":"eud1",
	},
	// {
	// 	"region":"EU",
	// 	"name":"DUNGEON",
	// 	"port":2053,
	// 	"machine":"eupvp",
	// },
	{
		"region":"ASIA",
		"name":"I",
		"port":8443,
		"machine":"eud1",
	},
	{
		"region":"US",
		"name":"I",
		"port":2053,
		"machine":"usd1",
	},
	{
		"region":"US",
		"name":"II",
		"port":2083,
		"machine":"usd1",
	},
	{
		"region":"US",
		"name":"III",
		"port":2096,
		"machine":"usd1",
	},
	{
		"region":"US",
		"name":"PVP",
		"port":2087,
		"machine":"usd1",
	},
]