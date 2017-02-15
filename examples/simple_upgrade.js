// A Simple Script to Upgrade Basic Items In Your Inventory
var loops=0;

function locate_item(name)
{
	for(var i=0;i<42;i++)
	{
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return -1;
}

function return_item(name)
{
	for(var i=0;i<42;i++)
	{
		if(character.items[i] && character.items[i].name==name) return character.items[i];
	}
	return -1;
}

setInterval(function(){
	// if(character.bank) return;
	loops+=1;
	if(!(loops%50)) // Every 50 loops, stock scrolls
	{
		if(locate_item("scroll0")==-1 || return_item("scroll0").q<200) buy("scroll0",200);
		if(locate_item("scroll1")==-1 || return_item("scroll1").q<100) buy("scroll1",100);
	}
	for(var i=0;i<42;i++)
	{
		if(!character.items[i]) continue;
		var item=character.items[i];
		var def=G.items[item.name];
		if(!def.upgrade) continue; // check whether the item is upgradeable
		if(item_grade(item)==2) continue; // rare item
		if(item_grade(item)==0) upgrade(i,locate_item("scroll0"));
		if(item_grade(item)==1) upgrade(i,locate_item("scroll1"));
		break;
	}
},200);
