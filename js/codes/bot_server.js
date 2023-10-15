var server_password="adventureland";
var account_email="hello@adventure.land";
var account_password="gg123456";
var server_port=9012;

var url=require('url');
var app=require('http').createServer(http_handler);
app.listen(server_port);

function http_handler(request,response)
{
	var body = [];
	request.on('error', function(err) {
		console.log("http_err: "+err,1);
	}).on('data', function(chunk) {
		body.push(chunk);
	}).on('end', function() {
		body = Buffer.concat(body).toString();
		try{
			var url_parts=url.parse(request.url,true),args=url_parts.query,cookies={},output="";

			(body||"").split("&").forEach(function(pv){
				var pvp=pv.split("=");
				args[pvp[0]]=pvp[1];
			});

			if(cookies.password!=server_password)
			{
				response.writeHead(200);
				response.end(html_password());
			}
			response.writeHead(200);
			response.end(output);
		}catch(e){
			console.log("chttp_err: "+e,1);
		}
	});
}

function html_password()
{
	return "What is the password?";
}