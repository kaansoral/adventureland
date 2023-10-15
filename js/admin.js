function drop_to_html(def,mult,color)
{
	var html="";
	if(def[1]=="open")
	{
		D.drops[def[2]].forEach(function(d){
			html+=drop_to_html(d,mult*def[0],color);
		});
		return html;
	}
	html+="<div style='display: inline-block; margin-right: 10px; border: 2px solid "+color+"; padding: 4px 8px 4px 8px'>";
	var skin="",prob=parseInt(1/(def[0]*mult));	
	if(G.items[def[1]]) skin=G.items[def[1]].skin;
	else if(def[1]=="shells") skin="shells";
	else if(def[1]=="gold") skin="gold";
	html+=item_container({skin:skin});
	html+="<div style='vertical-align: middle; font-size: 24px'>1 / "+to_pretty_num(prob)+"</div>";
	html+="</div>";
	return html;
}

function item_analysis()
{
	var html="";
	["weapon","shield","offhand","helmet"].forEach(function(type){
		var items=[];
		for(var id in G.items)
		{
			if(G.items[id].type==type)
				items.push(id);
		}
		html+="<div class='gamebutton'>"+type+"</div>";
		items.forEach(function(id){
			html+=item_container({skin:G.items[id].skin},{name:id});
		})
	});
	show_modal(html);
}

function visualize()
{
	if(!window.D) return pull_D();
	var html="<div style='text-align: center'>";
	object_sort(G.maps).forEach(function(io){
		var mname=io[0],map=G.maps[mname],pc={},mc={},m={},first=false,mx=false;
		if(!(D.drops.maps[mname] || map.monsters && map.monsters.length) || G.maps[mname].ignore) return;
		html+="<div class='gamebutton gamebutton-large' style='display:block; margin-bottom: 4px'>"+map.name+"</div>";
		for(var i=0;i<(D.drops.maps[mname]||[]).length;i++)
		{
			html+=drop_to_html(D.drops.maps[mname][i],1,"#858B8E"); mx=true;
		}
		if(mx) html+="<div style='display: inline-block; margin-left: -10px;'></div>";
		html+="<div style='margin-bottom: 2px'></div>";
		for(var i=0;i<(map.monsters||[]).length;i++)
		{
			var m_def=map.monsters[i],monster=G.monsters[m_def.type];
			pc[m_def.type]=(pc[m_def.type]||0)+1;
			mc[m_def.type]=(mc[m_def.type]||0)+m_def.count;
		}
		for(var i=0;i<(map.monsters||[]).length;i++)
		{
			var m_def=map.monsters[i],monster=G.monsters[m_def.type],drop=false;
			if(m[m_def.type]) continue;
			if(!monster) alert("no "+JSON.stringify(m_def));
			html+="<div class='gamebutton' style='margin-bottom: 6px; margin-top: 4px; border-color: #6C0001'><div xstyle='border: 2px solid gray; padding: 2px; display: inline-block'>"+sprite(monster.skin)+"</div>"+monster.name+" ["+mc[m_def.type]+"]</div>";
			html+="<div></div>";
			for(var j=0;j<(D.drops.monsters[m_def.type]||[]).length;j++)
			{
				html+=drop_to_html(D.drops.monsters[m_def.type][j],1,"#858B8E");
				drop=true;
			}
			if(!drop) html+="<div style='color: orange; font-size: 24px'>No Drop</div>";
			else html+="<div style='display: inline-block; margin-left: -10px;'></div>";
			html+="<div style='margin-bottom: 6px'></div>";
			m[m_def.type]=true;
		}
		if(!first) html+="<div style='margin-bottom: 15px'></div>"; first=true;
	});
	html+="</div>"
	show_modal(html);
}