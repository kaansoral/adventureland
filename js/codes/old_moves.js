// This is draivin's calculate_move - it's well thought, as he introduced going_down and going_right, realising that approach direction matters, this is what probably inpired me to introduce the new simplified system 1.5 years later, where lines are duplicated, so approach direction doesn't need to be introduced in the calculation logic, which complicates things too much [17/07/18]
// [17/07/18 17:25] Sad realization - line duplication can never work, even if lines are increased in length to intersect - there are orphan lines on fences etc.
// [18/07/18 14:22] Latest iteration of movement logic, calculate 4 corners, select the minimal move, simple, easy to calculate


function calculate_move(map,cur_x,cur_y,target_x,target_y) // v4, tries to move back, but, if you are moving at a very very high angle, moving 7px back from an x_line, doesn't really move you 7px back in the y-direction, it's more like 0.1px, trial and error ... :)
{
	var o=move_distance(cur_x,cur_y,target_x,target_y);
	var f=move_further(cur_x,cur_y,target_x,target_y,7.1288);
	var move=calculate_movex(map, cur_x, cur_y, f.x, f.y); // move 4px forward instead, so line logic triggers
	var n=move_distance(cur_x,cur_y,move.x,move.y);
	console.log((n-o)+" target_x,y: "+target_x+","+target_y+" move.x,y: "+move.x+","+move.y);
	if(n-o>=7.1288-EPS) return calculate_move_v2(map, cur_x, cur_y, target_x, target_y); // didn't clash with a line, return normal move
	else
	{
		console.log((o-n+7.1288)+" further");
		var fx=move_further(cur_x,cur_y,target_x,target_y,-(o-n+7.1288));
		var move=calculate_movex(map, cur_x, cur_y, fx.x, fx.y); 
	}
	return move;
}

function move_further(x0,y0,x1,y1,dt) // Some of the earlier ideas involved trying to move forward and backtracking, imperfect and complex [19/07/18]
{
	var distance=Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
	if(!dt || !distance) return {x:x1,y:y1};
	var a=(y1-y0)/distance,b=(x1-x0)/distance;
	return {x:x0+b*(distance+dt),y:y0+a*(distance+dt)};
}

function move_exact(x0,y0,x1,y1,dt)
{
	var distance=Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
	if(!dt || !distance) return {x:x1,y:y1};
	var a=(y1-y0)/distance,b=(x1-x0)/distance;
	return {x:x0+b*(dt),y:y0+a*(dt)};
}

function calculate_movex(map, cur_x, cur_y, target_x, target_y) {
	if(target_x==Infinity) target_x=CINF;
	if(target_y==Infinity) target_y=CINF;
	//console.log(cur_x+" "+cur_y+" "+target_x+" "+target_y);
	var going_down = cur_y < target_y;
	var going_right = cur_x < target_x;

	var x_lines = map.x_lines || [];
	var y_lines = map.y_lines || [];

	var min_x = min(cur_x, target_x);
	var max_x = max(cur_x, target_x);
	var min_y = min(cur_y, target_y);
	var max_y = max(cur_y, target_y);

	var dx = target_x - cur_x;
	var dy = target_y - cur_y;

	var dydx = dy / (dx + EPS);
	//console.log(dydx);
	var dxdy = 1 / dydx;

	var N_SPC=0; // Tested 2, doesn't work, jail with test_movement.js [16/07/18]

	for (var i = 0; i < x_lines.length; i++) {
		var line = x_lines[i];
		var line_x = line[0];
		if (max_x < line_x-N_SPC || min_x > line_x+N_SPC || max_y < line[1]-N_SPC || min_y > line[2]+N_SPC) {
			continue;
		}

		var y_intersect = cur_y + (line_x - cur_x) * dydx;

		if (y_intersect < line[1]-N_SPC || y_intersect > line[2]+N_SPC) {
			continue;
		}

		if (going_down) {
			target_y = min(target_y, y_intersect);
			max_y = target_y;
		} else {
			target_y = max(target_y, y_intersect);
			min_y = target_y;
		}

		if (going_right) {
			target_x = min(target_x, line_x - 3);
			max_x = target_x;
		} else {
			target_x = max(target_x, line_x + 3);
			min_x = target_x;
		}
	}

	for (var i = 0; i < y_lines.length; i++) {
		var line = y_lines[i];
		var line_y = line[0];
		if (max_y < line_y-N_SPC || min_y > line_y+N_SPC || max_x < line[1]-N_SPC || min_x > line[2]+N_SPC) {
			continue;
		}

		var x_intersect = cur_x + (line_y - cur_y) * dxdy;

		if (x_intersect < line[1]-N_SPC || x_intersect > line[2]+N_SPC) {
			continue;
		}

		if (going_right) {
			target_x = min(target_x, x_intersect);
			max_x = target_x;
		} else {
			target_x = max(target_x, x_intersect);
			min_x = target_x;
		}

		if (going_down) {
			target_y = min(target_y, line_y - 3);
			max_y = target_y;
		} else {
			target_y = max(target_y, line_y + 7);
			min_y = target_y;
		}
	}

	//console.log(target_x+" "+target_y);
	return {
		x: target_x,
		y: target_y
	};
}

// This was a bugged version of applying the "Smooth Movement" - if you hit a line, this routine lets you walk as if you slide over the line you hit
function calculate_movev1(map, cur_x, cur_y, target_x, target_y) // improved, v1
{
	var move=calculate_movex(map, cur_x, cur_y, target_x, target_y);
	if(move.x!=target_x && move.y!=target_y)
	{
		var move2=calculate_movex(map, move.x,move.y, target_x, move.y);
		if(move2.x==move.x)
		{
			var move2=calculate_movex(map, move2.x,move2.y, move2.x, target_y);
		}
		return move2;
	}
	return move;
}

// Pre-perfection versions, introduced binary search in [16/07/18] - and quickly re-wrote the entire system and simplified things
function bsearch_start(arr,value)
{
	var start=0,end=arr.length-1,current;
	while(start<end-1)
	{
		current=parseInt((start+end)/2);
		if(arr[current][0]<value) start=current;
		else end=current-1;
	}
	// while(start<arr.length && arr[start][0]<value) start++;
	return start;
}

function can_move(monster)
{
	// An XY-tree would be ideal, but the current improvements should be enough [16/07/18]
	var M=G.maps[monster.map].data||{};
	var x0=monster.x,y0=monster.y,x1=monster.going_x,y1=monster.going_y,next,mx=min(x0,x1),my=min(y0,y1);
	for(var i=bsearch_start(M.x_lines||[],mx);i<(M.x_lines||[]).length;i++)
	{
		var line=M.x_lines[i];
		if(line[0]-0.2<=x1 && line[0]+0.2>=x1 && line[1]-0.2<=y1 && line[2]+0.2>=y1) return false; // 2 instead of 0.2 causes jailing issues
		if(mx>line[0]) continue; // can be commented out with: while(start<arr.length && arr[start][0]<value) start++;
		if(x0+1<line[0] && x1+1<line[0]) break; // performance improvement, we moved past our range [16/07/18]
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+EPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue; // Fixed EPS [16/07/18]
		return false;
	}
	for(var i=bsearch_start(M.y_lines||[],my);i<(M.y_lines||[]).length;i++)
	{
		var line=M.y_lines[i];
		if(line[0]-0.2<=y1 && line[0]+0.2>=y1 && line[1]-0.2<=x1 && line[2]+0.2>=x1) return false;
		if(my>line[0]) continue;
		if(y0+1<line[0] && y1+1<line[0]) break;
		next=x0+(x1-x0)*(line[0]-y0)/(y1-y0+EPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue;
		return false;
	}
	return true;
}


// This is the very first calculate_move - it had issues, at that time, when the first Reddit post blew the game in a small scale, there were a lot of coders interested in helping, draivin thankfully wrote the new one, while I concentrated on other things
function calculate_move_original(M,x0,y0,x1,y1)
{
	// #GTODO: Inner corners are problematic, the entire "line" routine could use an overhaul
	var next,y0sy1=y0<y1,x0sx1=x0<x1;
	for(var i=0;i<(M.x_lines||[]).length;i++)
	{
		var line=M.x_lines[i];
		if(!(x0<=line[0] && line[0]<=x1 || x1<=line[0] && line[0]<=x0)) continue;
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+EPS);
		if(!(line[1]<=next && next<=line[2])) continue;
		//console.log(round(x0)+","+round(y0)+" to "+round(x1)+","+round(y1));

		if(y0sy1) y1=min(y1,next);
		else y1=max(y1,next);

		if(x0sx1) x1=min(x1,line[0]-3);
		else x1=max(x1,line[0]+3);
		//console.log("became "+round(x0)+","+round(y0)+" to "+round(x1)+","+round(y1)+" with ["+line[0]+","+line[1]+","+line[2]+"]");
	}
	for(var i=0;i<(M.y_lines||[]).length;i++)
	{
		var line=M.y_lines[i];
		if(!(y0<=line[0] && line[0]<=y1 || y1<=line[0] && line[0]<=y0)) continue;
		next=x0+(x1-x0)*(line[0]-y0)/(y1-y0+EPS);
		if(!(line[1]<=next && next<=line[2])) continue;

		if(x0sx1) x1=min(x1,next);
		else x1=max(x1,next);

		if(y0sy1) y1=min(y1,line[0]-3);
		else y1=max(y1,line[0]+7);
	}
	for(var i=0;i<(M.x_lines||[]).length;i++) // extremely dirty-fix, the worst part is, don't even know why it works :( [03/10/16]
	{
		var line=M.x_lines[i];
		if(!(x0<=line[0] && line[0]<=x1 || x1<=line[0] && line[0]<=x0)) continue;
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+EPS);
		if(!(line[1]<=next && next<=line[2])) continue;
		//console.log(round(x0)+","+round(y0)+" to "+round(x1)+","+round(y1));

		if(y0sy1) y1=min(y1,next);
		else y1=max(y1,next);

		if(x0sx1) x1=min(x1,line[0]-3);
		else x1=max(x1,line[0]+3);
		//console.log("became "+round(x0)+","+round(y0)+" to "+round(x1)+","+round(y1)+" with ["+line[0]+","+line[1]+","+line[2]+"]");
	}
	return {x:x1,y:y1};
}

// This was an attempt to apply the move 5px forward, if you don't hit a line, move the original distance logic, later on, applied it to calculate_move, it worked well, so this one was left as it is
function calculate_move_new(map,x0,y0,x1,y1)
{
	// Incomplete - and no need
	var M=map||{};
	var distance=Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0)); if(!distance) return {x:x1,y:y1};
	var mx=min(x0,x1),my=min(y0,y1);
	for(var i=bsearch_start(M.x_lines||[],mx);i<(M.x_lines||[]).length;i++)
	{
		var line=M.x_lines[i];
		if(line[0]-0.2<=x1 && line[0]+0.2>=x1 && line[1]-0.2<=y1 && line[2]+0.2>=y1) return false; // 2 instead of 0.2 causes jailing issues
		if(mx>line[0]) continue; // can be commented out with: while(start<arr.length && arr[start][0]<value) start++;
		if(x0+1<line[0] && x1+1<line[0]) break; // performance improvement, we moved past our range [16/07/18]
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+EPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue; // Fixed EPS [16/07/18]
		return false;
	}
	for(var i=bsearch_start(M.y_lines||[],my);i<(M.y_lines||[]).length;i++)
	{
		var line=M.y_lines[i];
		if(line[0]-0.2<=y1 && line[0]+0.2>=y1 && line[1]-0.2<=x1 && line[2]+0.2>=x1) return false;
		if(my>line[0]) continue;
		if(y0+1<line[0] && y1+1<line[0]) break;
		next=x0+(x1-x0)*(line[0]-y0)/(y1-y0+EPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue;
		return false;
	}
	return true;
}

// Used this can_move, for the longest time, it just worked
function can_move_original(monster) // used at server, .going_x + .going_y is pre-set [14/08/16]
{
	// Issue: When a Citizen lands right on top of a line, s/he can't move up or down, basically, equality shouldn't return false, it happens on ["main",-152,152] near the fence [19/07/17]
	var M=G.maps[monster.map].data||{};
	var x0=monster.x,y0=monster.y,x1=monster.going_x,y1=monster.going_y,next;
	// if(simple_distance({x:x0,y:y0},{x:x1,y:y1})<10) return true; // not sure if this is needed [14/08/16]
	// ^^ Removed, seems like a huge oversight, especially after the line violations are added [19/07/17]
	// can_move({map:"main",x:-10,y:152,going_x:-160,going_y:152}) - you can move onto a line from it's parallel
	// can_move({map:"main",x:-152,y:152,going_x:-152,going_y:160}) - yet you can't move vertically away from the line
	for(var i=0;i<(M.x_lines||[]).length;i++)
	{
		var line=M.x_lines[i];
		if(!(x0<=line[0] && line[0]<=x1 || x1<=line[0] && line[0]<=x0)) continue;
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+EPS);
		if(!(line[1]<=next && next<=line[2])) continue;
		return false;
	}
	for(var i=0;i<(M.y_lines||[]).length;i++)
	{
		var line=M.y_lines[i];
		if(!(y0<=line[0] && line[0]<=y1 || y1<=line[0] && line[0]<=y0)) continue;
		next=x0+(x1-x0)*(line[0]-y0)/(y1-y0+EPS);
		if(!(line[1]<=next && next<=line[2])) continue;
		return false;
	}
	return true;
}


function bsearch_start2(arr,value,d)
{
	var start=0,end=arr.length-1,current;
	while(start<end-1)
	{
		current=parseInt((start+end)/2);
		if(arr[current][0]<value-d) start=current;
		else end=current-1;
	}
	return start;
}

function can_move_170718(monster)
{
	// #IMPORTANT: While trying to apply the rectangle logic here, realised that it's best to just add new lines for rectangle's edges, and just duplicating each line was enough, this gave birth to G.geometry, it was a small monumental change [17/07/18]

	// This version is similar to calculate_movex, depending on the approach angle, the shape of the rectangle that each single line form changes
	var M=G.maps[monster.map].data||{};
	var x0=monster.x,y0=monster.y,x1=monster.going_x,y1=monster.going_y,next,mx=min(x0,x1),my=min(y0,y1),going_left=false,going_up=false,x_disp=-3,y_disp=-3;
	if(x1<x0) going_left=true,x_disp=3;
	if(y1<y0) going_up=true,y_disp=7;
	for(var i=bsearch_start2(M.x_lines||[],mx,3);i<(M.x_lines||[]).length;i++)
	{
		var line=M.x_lines[i];
		if(line[0]-3<=x1 && line[0]+3>=x1 && line[1]-7<=y1 && line[2]+3>=y1) return false;
		if(mx>line[0]) continue; 
		if(x0+1<line[0] && x1+1<line[0]) break;
		next=y0+(y1-y0)*(line[0]-x0)/(x1-x0+EPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue;
		return false;
	}
	for(var i=bsearch_start(M.y_lines||[],my);i<(M.y_lines||[]).length;i++)
	{
		var line=M.y_lines[i];
		if(line[0]-3<=y1 && line[0]+3>=y1 && line[1]-7<=x1 && line[2]+3>=x1) return false;
		if(my>line[0]) continue;
		if(y0+1<line[0] && y1+1<line[0]) break;
		next=x0+(x1-x0)*(line[0]-y0)/(y1-y0+EPS);
		if(!(line[1]-EPS<=next && next<=line[2]+EPS)) continue;
		return false;
	}
	return true;
}


function can_movex(map, cur_x, cur_y, target_x, target_y) { // draivin's can_move - didn't use for a long while - don't remember whether it had issues
	if(target_x==Infinity) target_x=CINF;
	if(target_y==Infinity) target_y=CINF;
	//console.log(cur_x+" "+cur_y+" "+target_x+" "+target_y);
	var going_down = cur_y < target_y;
	var going_right = cur_x < target_x;

	var x_lines = map.x_lines || [];
	var y_lines = map.y_lines || [];

	var min_x = min(cur_x, target_x);
	var max_x = max(cur_x, target_x);
	var min_y = min(cur_y, target_y);
	var max_y = max(cur_y, target_y);

	var dx = target_x - cur_x;
	var dy = target_y - cur_y;

	var dydx = dy / (dx + EPS);
	//console.log(dydx);
	var dxdy = 1 / dydx;

	for (var i = 0; i < x_lines.length; i++) {
		var line = x_lines[i];
		var line_x = line[0];
		if (max_x < line_x || min_x > line_x || max_y < line[1] || min_y > line[2]) {
			continue;
		}

		var y_intersect = cur_y + (line_x - cur_x) * dydx;

		if (y_intersect < line[1] || y_intersect > line[2]) {
			continue;
		}

		return false;
	}

	for (var i = 0; i < y_lines.length; i++) {
		var line = y_lines[i];
		var line_y = line[0];
		if (max_y < line_y || min_y > line_y || max_x < line[1] || min_x > line[2]) {
			continue;
		}

		var x_intersect = cur_x + (line_y - cur_y) * dxdy;

		if (x_intersect < line[1] || x_intersect > line[2]) {
			continue;
		}

		return false;
	}

	return true;
}