var last_focus=new Date();
setInterval(function(){
	if($(":focus").length) last_focus=new Date();
},120);

function touch_startify()
{
	return;
	$('[onclick]').each(function(){
		var $this=$(this);
		$this.attr("ontouchstart",$this.attr("onclick"));
		$this.removeAttr("onclick");
	})
}

function toggle_ui()
{
	if(socket && observing && $('.serversuic').is(":visible"))
	{
		$('.charactersui').hide();
		$('.serversui').hide();
	}
	else if($('.charactersuic').is(":visible"))
	{
		$('.charactersui').hide(); $('.serversui').css('display','inline-block');
	}
	else
	{
		$('.serversui').hide(); $('.charactersui').css('display','inline-block');
	}
}

function hide_nav()
{
	$('.charactersui').hide(); $('.serversui').hide();
}

var rc_cache="-1";
function render_characters()
{
	var html="",key="";
	X.characters.forEach(function(char){
		key+=char.name+" "+char.level+" "+char.server+" "+char.rip+" "+char.skin+" "+char.cx+"|";
	});
	if(key==rc_cache) return;
	rc_cache=key;
	X.characters.forEach(function(char){
		if(char.online)
		{
			html+="<div class='gamebutton mb5 mr5' onclick='if(bc(this)) return; observe_character(\""+char.name+"\");' style='text-align: left; width: 172px'>";
				html+="<span style='float:left; margin-right: 5px; margin-top: -5px; margin-left: -4px; margin-bottom: -7px;'>"+sprite(char.skin,{cx:char.cx,rip:char.rip})+"</span>";
				html+=char.name.length<=8&&char.name||char.name.substr(0,8)+"..";
				html+=" <span style='color: #F3A05D'>["+char.server+"]</span>";
				html+="<br />";
				html+="Lv."+char.level+" <span class='gray'>"+char.type.toTitleCase()+"</span>";
			html+="</div>";
		}
	});
	if(!html) html+="<div class='gamebutton mb5'>ALL OFFLINE</div>";
	$(".charactersuic").html(html);
	touch_startify();
}

var sl_cache="-1";
function render_servers()
{
	var html="",key="";
	X.servers.forEach(function(server){
		key+=server.name+" "+server.players+"|";
	});
	if(key==sl_cache) return;
	sl_cache=key;
	X.servers.forEach(function(server){
		html+="<div class='gamebutton mb5 mr5' onclick='if(bc(this)) return; server_addr=\""+server.addr+"\"; server_port=\""+server.port+"\"; init_socket();'>";
			html+=server.region+" "+server.name+" <span style='color: #85C76B'>["+server.players+"]</span>";
		html+="</div>";
	});
	if(!html) html+="<div class='gamebutton mb5'>GAME OFFLINE</div>";
	$(".serversuic").html(html);
	touch_startify();
}