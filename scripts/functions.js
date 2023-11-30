//var execsync=require('sync-exec');
var child_process=require('child_process');
var compressor=require("node-minify"),util=require("util"),fs=require("fs"),request=require('request');
var really_old=new Date(0);

function replace_all(str, find, replace)
{
	return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
}

function cdate(time) // custom date/time format [12/06/15]
{
	var time_str="",current=new Date(),arr=[current.getHours(),current.getMinutes(),current.getDate(),current.getMonth()+1,current.getYear()];
	for(var i=0;i<arr.length;i++)
	{
		if(arr[i]<10) arr[i]="0"+arr[i];
		else arr[i]=""+arr[i];
	}
	arr[4]=arr[4].substr(1,5);
	if(time) time_str="["+arr[0]+":"+arr[1]+"]";
	return time_str+"["+arr[2]+"/"+arr[3]+"/"+arr[4]+"]";
}

function string_to_int(s)
{
	unique=0
	for(var i=0;i<s.length;i++) unique=(unique*150 + s.charCodeAt(i))%123126580007
	return unique;
}

function download(source,destination)
{
	execso("wget "+source+" -O "+destination);
}

function add_log(storage,log)
{
	logs=storage.getItem("logs");
	if(!logs) logs=[];
	logs.push({date:new Date(),message:log});
	console.log("[add_log] "+log);
	if(logs.length>1000) logs=logs.slice(4,1200);
	storage.setItem("logs",logs);
}

function report_logs(storage)
{
	logs=storage.getItem("logs");
	if(!logs) logs=[];
	for(var i=0;i<logs.length;i++)
	{
		console.log("["+logs[i].date+"]: "+logs[i].message);
	}
}

function in_between_from_file(file,prefix,suffix)
{
	return read_file(file.replace("~",process.env.HOME)).split(prefix)[1].split(suffix)[0];
}

function lib_version(cur)
{
	return in_between_from_file(cur.file,cur.prefix,cur.suffix);
}

function fetch(url,success,errorf)
{
	request(url, function (error, response, content) {
		if(!error && response.statusCode == 200)
		{
			success(content);
		}
		else
		{
			errorf(error);
		}
	});
}

function endswith(s,suffix)
{
	return s.indexOf(suffix, s.length - suffix.length) !== -1;
}

function execs(code)
{
	try{
		//output=execsync(code);
		//if(output.stderr) console.log("execs.Error: "+output.stderr);
		//return output.stdout;
		output=child_process.execSync(code);
		if(output.toString) output=output.toString();
		return output;
	}
	catch(e){console.log("execs.Error: "+e)} 
}
function sleep(n){
	execs("sleep "+n);
}

function color(message,color)
{
	color={"black":"0;30","gray":"1;30","blue":"0;34","lblue":"1;34","green":"0;32","lgreen":"1;32","cyan":"0;36","lcyan":"1;36",
	"red":"0;31","lred":"1;31","purple":"0;35","lpurple":"1;35","orange":"0;33","yellow":"1;33","lgray":"0;37","white":"1;37"}[color];
	return red="\033["+color+"m"+message+"\033[0m";
}

function ccolor(a1,a2,a3)
{
	if(!a2 && !a3) return color(a1,"orange");
	if(a1!=a2 && a1!=a3) return color(a1,"red");
	return color(a1,"green");
}

function execso(code)
{
	try{ 
		//var output=execsync(code);
		//if(output.stdout) console.log(output.stdout);
		//if(output.stderr) console.log("execs.Error: "+output.stderr);
		output=child_process.execSync(code);
		if(output.toString) output=output.toString();
		console.log(output);
	}
	catch(e){console.log("execso.Error: "+e);} 
}

function minify_all(path,files)
{
	path=path.replace("~",process.env.HOME);
	for(var sub_path in files)
	{
		for(var i=0;i<files[sub_path].length;i++)
		{
			var type='sqwish',file=files[sub_path][i],the_path=path+"/"+sub_path+"/"; // previously 'yui-css' but requires Java [16/06/20]
			if(sub_path=="-") the_path=path+"/"; //[17/10/15]
			console.log("Minifying "+the_path+file);
			if(endswith(file,".js")) type='gcc'; // previously 'yui-js' - but can't minify es6 :/ [02/06/20]
			var promise=compressor.minify({
				compressor: type,
				sync:true,
				input: the_path+file,
				output: the_path+file});
			a=function(the_path,file){
				promise.then(function(){
					console.log("Minification complete: "+the_path+file);
				}).catch(function(err){
					console.log("Minification exception: "+the_path+file);
					console.log(err);
				});
			}
			a(the_path,file);
		}
	}
}

function in_args(strs)
{
	if(typeof strs == "string") strs=[strs];
	for(var j=0;j<strs.length;j++)
	{
		str=strs[j];
		for(var i=0;i<process.argv.length;i++)
			if(process.argv[i]==str) return true;
	}
	return false;
}

function get_arg(num)
{
	if(process.argv.length>num) return process.argv[num];
	return false;
}

function is_production()
{
	if(in_args("live") || in_args("production")) return " production ";
	return "";
}

function is_sdk(){ return !is_production(); }

function ch(path)
{
	path=path.replace("~",process.env.HOME);
	process.chdir(path);
}

function read_file(path)
{
	path=path.replace("~",process.env.HOME);
	return fs.readFileSync(path,{encoding:'utf-8'});
}

function write_file(path,content)
{
	path=path.replace("~",process.env.HOME);
	fs.writeFileSync(path,content);
}

function mssince(t,ref)
{
	if(!ref) ref=new Date();
	return ref.getTime() - t.getTime();
}
function ssince(t,ref) { return mssince(t,ref)/1000.0; }
function msince(t,ref) { return mssince(t,ref)/60000.0; }
function hsince(t,ref) { return mssince(t,ref)/3600000.0; }

module.exports={
	util:util, format:util.format,
	execs:execs,
	execso:execso,
	minify_all:minify_all,
	is_production:is_production,
	is_sdk:is_sdk,
	ch:ch,
	in_args:in_args,
	get_arg:get_arg,
	read_file:read_file,
	write_file:write_file,
	color:color,
	ccolor:ccolor,
	fetch:fetch,
	in_between_from_file:in_between_from_file,
	lib_version:lib_version,
	mssince:mssince,ssince:ssince,msince:msince,hsince:hsince,
	add_log:add_log,report_logs:report_logs,
	really_old:really_old,
	download:download,
	string_to_int:string_to_int,
	cdate:cdate,
	sleep:sleep,
	replace_all:replace_all,
}