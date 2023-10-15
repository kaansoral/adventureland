for(var i=0;i<10;i++)
{
    function callLater(i)
    {
	return (function(){console.log(i);});
    }
    var gg=callLater(i);
    setTimeout(gg,1000);
}