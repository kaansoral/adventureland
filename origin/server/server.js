var DEBUG=1;
var http = require('http');

function getClient(){
    try{
	if(!DEBUG)  return http.createClient(80, "createnspread.appspot.com");
	return http.createClient(80, "lordkaan.com");
    }
    catch(err)
    {
	console.log(err);
	return getClient();
    }
}

var host = "0.0.0.0";
var port = 1080;
var http_server = http.createServer(httpHandler);
var io = require("socket.io").listen(http_server);
http_server.listen(port, host);

io.configure(function () {
  io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
});


var adventure="adventure1";
var game_version=-1;
var waiting=new Object();
var players=new Array();
var maps=new Object();
var gameDyn=0;
var gdata="";


downloadGame();
function initMap(name)
{
    console.log("GOT MAP "+name);
    maps[name]=eval("("+maps[name].tdata+")");
}

function downloadMap(name)
{
    var GAE=getClient();
    GAE.on("error",function(err){
	console.log(err);
	setTimeout(function(){downloadMap(name);},500);
    });
    var request = GAE.request('GET', "/rpgapp/getmap/"+adventure+"-"+name);
    maps[name]=new Object();
    maps[name].tdata="";
    request.end();
    request.on('response', function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
	    maps[name].tdata+=chunk;
	});
	response.on('close',function(){
	    console.log("CLOSED AMK: "+name);
	    setTimeout(function(){downloadMap(name);},500);
	});
	response.on('end',function(){initMap(name);});
    });
}

function downloadMaps()
{
    var dene=123;
    gameDyn=eval("("+gdata+")");
    for(var i=0;i<gameDyn.maps.length;i++)
    {
	downloadMap(gameDyn.maps[i]);
    }
}

function downloadGame()
{
    var GAE=getClient();
    GAE.on("error",function(err){
	console.log(err);
	setTimeout(function(){downloadGame();},500);
    });
    var request = GAE.request('GET', "/rpgapp/getdyn/"+adventure);
    request.end();
    request.on('response', function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
	    gdata+=chunk;
      });
      response.on('close',function(){
	    console.log("CLOSED AMK - GAME ");
	    setTimeout(function(){downloadGame();},500);
	});
	response.on('end',function(){downloadMaps();});
    });
}

function savePlayers(plrs)
{
    
}

function saveGame()
{
    var slen=50;
    for(i=0;i<players.length;i+=slen)
    {
	savePlayers(players.slice(i,i+50));
    }
}

setTimeout(function(){
	setInterval(sendWorld,100);
	setInterval(gameLogic,10);
	setInterval(saveGame,60000);
    },30000);

io.sockets.on('connection', function (socket) {

    socket.on('setuser', function (data) {
    socket.set('user', data, function () {

	handle_player(data["id"],data["char"],data["pass"],data["appid"],socket);
      
    });
  });


  socket.on('msg', function (msg) {
      console.log('Chat message !!!!!!!!!!!!!');
      io.sockets.emit('msg', { msg: msg});
  });

  socket.on('coord', function (c) {
      socket.get("user",function(err,user){
      for(var i=0;i<players.length;i++)
	  if(players[i].id==user.id)
	  {
	      players[i].x=c.x;
	      players[i].y=c.y;
	      players[i].d=c.d;
	      players[i].m=c.m;
	  }
      });
  });

   socket.on('disconnect', function () {
    socket.get("user",function(err,user){
      for(var i=0;i<players.length;i++)
	  if(players[i].id==user.id)
	    players.splice(i,1);
    });
  });




});

function gameLogic()
{
    for(var i=0;i<players.length;i++)
    {
	var cur=players[i];
	if(!cur.x)
	{
	    cur.x=maps[cur.map].spawn.x;
	    cur.y=maps[cur.map].spawn.y;
	    cur.d=0;
	    cur.m=0;
	}
    }
}

function sendWorld()
{
    var world=new Object();
    world.players=players;
    io.sockets.volatile.emit("world",world);
}

function check_user(user,chr,pass,appid,socket)
{
    data=eval('('+waiting[user].data+')');
    if(data.error)
    {
	socket.emit("disconnect");
	return;
    }
    if(!data.map)
	data.map="start";
    if(!data.character)
    {
	if(data.gender=="female")
	    data.chtype="deffemale";
	else
	    data.chtype="defmale";
    }
    data.character=gameDyn.characters[data.chtype];
    players.push(data);
    socket.emit('ready',data);
}

function handle_player(user,chr,pass,appid,socket)
{
    var GAE=getClient();
    GAE.on("error",function(err){
	console.log(err);
	setTimeout(function(){handle_player(user,chr,pass,appid,socket);},500);
    });
    var request = GAE.request('GET', "/rpgapp/"+appid+"/ackuser/"+user+"/"+chr+"/"+pass+"/");
    request.end();
    request.on('response', function (response) {
      response.setEncoding('utf8');
      waiting[user]=new Object();
      waiting[user].data="";
      response.on('data', function (chunk) {
	    waiting[user].data+=chunk;
      });
      response.on('close',function(){
	 console.log("CLOSED USER: "+user);
	 setTimeout(function(){handle_player(user,chr,pass,appid,socket);},500);
      });
      response.on('end',function(){check_user(user,chr,pass,appid,socket);});
    });
}

function httpHandler(request, response)
{
    console.log("WHY THE FUCK?");

}


process.on('uncaughtException', function (err) {
    console.log(err);
});

