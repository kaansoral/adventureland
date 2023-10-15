function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.parentNode;
    }
    return {top: _y, left: _x};
}
function dge(x)
{
    return document.getElementById(x);
}
function pa(x)
{
    return parseInt(x);
}