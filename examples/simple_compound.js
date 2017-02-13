// A Simple and Exhaustive Way to Combine Items - Uses 3 For Loops
var loops=0;

function locate_item(name)
{
	for(var i=0;i<42;i++)
	{
		if(character.items[i] && character.items[i].name==name) return i;
	}
	return -1;
}

setInterval(function(){
	// if(character.bank) return;
	loops+=1;
	if(!(loops%50)) // Every 50 loops, stock scrolls
	{
		if(locate_item("cscroll0")==-1 || locate_item("cscroll0").q<200) buy("cscroll0",200);
		if(locate_item("cscroll1")==-1 || locate_item("cscroll1").q<30) buy("cscroll1",30);
	}
	var done=false;
	for(var i=0;i<42;i++)
	{
		if(!character.items[i]) continue;
		var item=character.items[i];
		var def=G.items[item.name];
		if(!def.compound) continue; // check whether the item can be compounded
		for(var j=i+1;j<42;j++)
		{
			if(!character.items[j]) continue;
			if(character.items[j].name!=character.items[i].name) continue;
			if(character.items[j].level!=character.items[i].level) continue;
			for(var k=j+1;k<42;k++)
			{
				if(!character.items[k]) continue;
				if(character.items[k].name!=character.items[i].name) continue;
				if(character.items[k].level!=character.items[i].level) continue;
				if(!done) // to prevent combining multiple items in one loop
				{
					var offering=null;
					// if(item.level==2) offering=locate_item("offering");
					if(item_grade(item)==2) continue; // rare item
					if(item_grade(item)==0) compound(i,j,k,locate_item("cscroll0"),offering);
					if(item_grade(item)==1) compound(i,j,k,locate_item("cscroll1"),offering);
					done=true;
				}
			}
		}
	}
},200);
