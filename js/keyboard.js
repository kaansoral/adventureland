var up_pressed=0,down_pressed=0,left_pressed=0,right_pressed=0,z_pressed=0,x_pressed=0,y_pressed=0,cmd_pressed=0,c_pressed=0,f_pressed=0,n_pressed=0,v_pressed=0,l_pressed=0,t_pressed=0,a_pressed=0,b_pressed=0;
// Copy-paste to the "blur" event below
var pressed={};
var last_press=1,total_mousemoves=0,last_cmd=new Date();
var K={
	48:"0",
	49:"1",
	50:"2",
	51:"3",
	52:"4",
	53:"5",
	54:"6",
	55:"7",
	56:"8",
	57:"9",
	65:"A",
	66:"B",
	67:"C",
	68:"D",
	69:"E",
	70:"F",
	71:"G",
	72:"H",
	73:"I",
	74:"J",
	75:"K",
	76:"L",
	77:"M",
	78:"N",
	79:"O",
	80:"P",
	81:"Q",
	82:"R",
	83:"S",
	84:"T",
	85:"U",
	86:"V",
	87:"W",
	88:"X",
	89:"Y",
	90:"Z",
	37:"LEFT",
	38:"UP",
	39:"RIGHT",
	40:"DOWN",
	9:"TAB",
	27:"ESC",
	16:"SHIFT",
	32:"SPACE",
	13:"ENTER",
	8:"BACK",
	188:",",
	189:"-",
	220:"\\",
	9000:"\\2",
};
function keyboard_logic()
{
	if(window.no_html) return;
	window.addEventListener(
		"keydown", function(event){
			// console.log("KEYPRESS "+event.keyCode+" STATE: "+pressed[event.keyCode]);
			var state=pressed[event.keyCode];
			pressed[event.keyCode]=last_press++;
			last_interaction=new Date();
			if($('input:focus').length>0 || $('textarea:focus').length>0 || event.target && event.target.hasAttribute("contenteditable"))
			{
				if(!(event.keyCode==27 && window.character)) return; // not ESC
			}

			if(event.keyCode==37 || window.map_editor && event.keyCode==65) { left_pressed=last_press++; }
			if(event.keyCode==38 || window.map_editor && event.keyCode==87) { up_pressed=last_press++; }
			if(event.keyCode==39 || window.map_editor && event.keyCode==68) { right_pressed=last_press++; }
			if(event.keyCode==40 || window.map_editor && event.keyCode==83) { down_pressed=last_press++; }
			if(event.keyCode==90) { z_pressed=last_press++; }
			if(event.keyCode==89) { y_pressed=last_press++; }
			if(event.keyCode==88) { x_pressed=last_press++; }
			if(event.keyCode==67) { c_pressed=last_press++; }
			if(event.keyCode==78) { n_pressed=last_press++; }
			if(event.keyCode==86) { v_pressed=last_press++; }
			if(event.keyCode==70) { f_pressed=last_press++; }
			if(event.keyCode==76) { l_pressed=last_press++; }
			if(event.keyCode==84) { t_pressed=last_press++; }
			if(event.keyCode==65) { a_pressed=last_press++; }
			if(event.keyCode==66) { b_pressed=last_press++; }
			if(event.keyCode==91 || event.keyCode==17) cmd_pressed=true,last_cmd=new Date(); // 17 ctrl - 91 cmd [22/06/18]

			if(window.character && !state && (!cmd_pressed || ssince(last_cmd)>5))
			{
				if(event.keyCode==65 && window.socket) socket.emit("interaction",{key:"A"});
				if(event.keyCode==66 && window.socket) socket.emit("interaction",{key:"B"});
				if(K[event.keyCode]) on_skill(K[event.keyCode],event);
			}

			if(event.keyCode==27 && window.map_editor && set) destroy_tileset();
			if(event.keyCode==27 && window.inside=="selection") $(".onbackbutton").click();
			// turns out event.preventDefault helps all kinds of things [OLD]
			if(window.stkp) if(!cmd_pressed || window.ssince && ssince(last_cmd)>5) stkp(event); // NEW [21/06/18]
		}, false
	);
	window.addEventListener(
		"keyup", function(event){
			//console.log("KEYUP "+event.keyCode);
			pressed[event.keyCode]=0;
			if(event.target && event.target.hasAttribute("contenteditable") && !$(event.target).html()) $(event.target).html(" ");
			if($('input:focus').length>0 || $('textarea:focus').length>0 || event.target && event.target.hasAttribute("contenteditable")) return;
			if(event.keyCode==37 || window.map_editor && event.keyCode==65) { left_pressed=0; }
			if(event.keyCode==38 || window.map_editor && event.keyCode==87) { up_pressed=0; }
			if(event.keyCode==39 || window.map_editor && event.keyCode==68) { right_pressed=0; }
			if(event.keyCode==40 || window.map_editor && event.keyCode==83) { down_pressed=0; }
			if(event.keyCode==90) { z_pressed=0; }
			if(event.keyCode==89) { y_pressed=0; }
			if(event.keyCode==88) { x_pressed=0; }
			if(event.keyCode==67) { c_pressed=0; }
			if(event.keyCode==78) { n_pressed=0; }
			if(event.keyCode==86) { v_pressed=0; }
			if(event.keyCode==70) { f_pressed=0; }
			if(event.keyCode==76) { l_pressed=0; }
			if(event.keyCode==84) { t_pressed=0; }
			if(event.keyCode==65) { a_pressed=0; }
			if(event.keyCode==66) { b_pressed=0; }
			if(event.keyCode==91 || event.keyCode==17) cmd_pressed=false;
			if(window.character && K[event.keyCode]) on_skill_up(K[event.keyCode]);
			if(!cmd_pressed && window.stkp) stkp(event);
		}, false
	);
	window.addEventListener(
		"mousemove", function(event){
			if(mm_afk) last_interaction=new Date();
			if(window.options && options.move_with_mouse && character)
			{
				var x=event.pageX,y=event.pageY;
				dx=x-width/2; dy=y-height/2;
				if(manual_centering && character) dx=x-character.x,dy=y-character.y;
				dx/=scale; dy/=scale;
				var mx=character.real_x+dx,my=character.real_y+dy;
				var cm=calculate_move(character,mx,my);
				if(!character.moving || point_distance(character.real_x,character.real_y,cm.x,cm.y)>4 && mssince(last_move)>120) move(cm.x,cm.y);
			}
			//total_mousemoves++;
		}, false
	);
	$(window).blur(function(){
		// cmd_pressed logic can be removed now [20/07/18]
		up_pressed=0,down_pressed=0,left_pressed=0,right_pressed=0,z_pressed=0,x_pressed=0,y_pressed=0,cmd_pressed=0,c_pressed=0,f_pressed=0,n_pressed=0,v_pressed=0,l_pressed=0,t_pressed=0,a_pressed=0,b_pressed=0;
		for(var name in K) if(pressed[name]) on_skill_up(K[event.keyCode]);
	});
	$(window).focus(function(){
		if(window.sounds && window.sounds.empty && sounds.empty.cplaying) sounds.empty.stop(),sounds.empty.play();
	});
}