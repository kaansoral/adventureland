CodeMirror=function(a,b){
	this.value=b.value;
	this.on=function(){}
	this.setValue=function(x){
		this.value=x;
	};
	this.getValue=function(){
		return this.value;
	}
	this.focus=function(){};
	this.clearHistory=function(){};
	return this;
}