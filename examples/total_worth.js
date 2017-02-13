var gold=0,slots_gold=0,items_gold=0,bank_gold=0,bank_items_gold=0;
gold+=character.gold;
for(var name in character.slots) // traverse an object
{
	gold+=calculate_item_value(character.slots[name]);
	slots_gold+=calculate_item_value(character.slots[name]);
}
character.items.forEach(function(item){ // traverse an array with .forEach
	gold+=calculate_item_value(item);
	items_gold+=calculate_item_value(item);
});
if(character.bank)
{
	for(var name in character.bank)
	{
		if(name=="gold")
		{
			gold+=character.bank.gold;
			bank_gold=character.bank.gold;
		}
		else // name is "items0",...,"items7"
		{
			character.bank[name].forEach(function(item){
				gold+=calculate_item_value(item);
				bank_items_gold+=calculate_item_value(item);
			});
		}
	}
}
if(bank_items_gold) game_log("Bank Items' Worth: "+to_pretty_num(bank_items_gold),"gold");
game_log("Total Worth: "+to_pretty_num(gold),"gold"); // "gold" is the color
