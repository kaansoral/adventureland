// process.env.TMPDIR="/var/folders/s5/sd0cnc0j6kqgmhp05yc_h_nr0000gn/T/x/"; //"/Users/kaan/test/";
const {app, BrowserWindow, Menu} = require('electron');
var electron=require('electron');
var Store=require('electron-store'),store=new Store();
var path=require('path');
var ipcMain=require('electron').ipcMain;

var main=null,sub=null,loader=null;
var platform="steam";
var osf=100;
try{osf=parseFloat(require('os').release());}catch(e){};
var dev=1;
var recording_mode=0;
var screenshot_mode=0;
var closing=false;
var build="b260621";
var url="https://adventure.land/";

if(dev)
{
	url="http://thegame.com/";
}

var width=1440,height=900; // perfect resolution
if(recording_mode)
{
	if(!screenshot_mode) width=1320,height=820;
	url=url+"?recording_mode=true";
}

if(platform=="steam")
{
	if(process.platform == 'win32') app.commandLine.appendSwitch("in-process-gpu"); // For Shift+Tab to work
	try{
		greenworks = require('./greenworks');
		if (greenworks.init())
		{
			console.log('Steam API has been initalized.');			
			greenworks.getEncryptedAppTicket('adventurelandticketv0', function(ticket) {
				console.log('Steam ticket loaded');
				var ticket=ticket.toString('hex');
				store.set('ticket',ticket);
			}, function(err) {
				electron.dialog.showErrorBox("Adventure Land","Steam Ticket Failed: "+err);
				console.log(err);
			});
		}
	}catch(e){
		electron.dialog.showErrorBox("Adventure Land","Steam Integration Failed: "+e);
	}
}

// app.commandLine.appendSwitch('limit-fps', 20);

ipcMain.on('create_subwindow',function(event){
	create_subwindow();
});

ipcMain.on('show_subwindow',function(event){
	//main.hide();
	//sub.show();
	sub.moveTop();
});

ipcMain.on('show_mainwindow',function(event){
	//sub.hide();
	//main.show();
	main.moveTop();
});

function add_window_events(bwindow)
{
	if(process.platform == 'win32') bwindow.removeMenu();
	
	bwindow.webContents.on('will-navigate', (e,wurl) => {
		if(!is_url_safe(wurl)){
			e.preventDefault();
			electron.dialog.showErrorBox("Adventure Land","External url blocked. The game window can't be navigated elsewhere for security reasons.");
		}
	});

	bwindow.webContents.on('new-window', (event, wurl, frameName, disposition, options, additionalFeatures) => {
		event.preventDefault();
		if(!recording_mode && !is_url_safe(wurl))
		{
			electron.dialog.showErrorBox("Adventure Land","External window blocked. The game can't open external webpages for security reasons.");
			return;
		}
		if(recording_mode) wurl=wurl+"?recording_mode=true";
		Object.assign(options,{
			parent: null,
			width:width,
			height:height+22,
			sideWindow:true,
			webPreferences:{
				backgroundThrottling:false,
				webSecurity:false,
				nodeIntegration:true,
				contextIsolation:false,
				nodeIntegrationInSubFrames:true,
				enableRemoteModule:true,
			},
		});
		var char = new BrowserWindow(options);
		char.cdata={
			platform:platform,
			build:build
		}
		add_window_events(char);
		char.loadURL(wurl);
		// event.newGuest=char;
	});
}

function is_url_safe(wurl)
{
	return wurl.replace("https","").replace("http","").startsWith(url.replace("https","").replace("http",""));
}

function create_subwindow()
{
	sub=new BrowserWindow({
		show:false,
		width:width,
		height:height+22,
		backgroundColor:'#000000',
		disableAutoHideCursor:true, //awesome, doesn't hide the mouse on keypress
		webPreferences:{
			backgroundThrottling:false,
			webSecurity:false,
			nodeIntegration:true,
			contextIsolation:false,
			nodeIntegrationInSubFrames:true,
			enableRemoteModule:true,
		},
		parent:main,
		modal:true,
	});
	sub.cdata={
		platform:platform,
		build:build
	}
	sub.loadURL(url+'?buildid='+build+'-'+process.platform);
	0 && sub.webContents.once('dom-ready',function(){
		setTimeout(function(){
			sub.show();
			//main.hide();
		},600);
	});
	add_window_events(sub);
	sub.on('closed', () => {
		sub=null;
	});
}

function create_window()
{
	// electron.dialog.showErrorBox("Adventure Land",process.env.TMPDIR);
	main=new BrowserWindow({
		show:false,
		width:width,
		height:height+22,
		backgroundColor:'#000000',
		disableAutoHideCursor:true, //awesome, doesn't hide the mouse on keypress
		webPreferences:{
			backgroundThrottling:false,
			webSecurity:false,
			nodeIntegration:true,
			contextIsolation:false,
			nodeIntegrationInSubFrames:true,
			enableRemoteModule:true,
		},
	});
	main.cdata={
		platform:platform,
		build:build
	}

	loader=new BrowserWindow({
		show:false,
		width:width,
		height:height+22,
		backgroundColor:'#000000',
		//frame:false
	});

	var w7=(process.platform=="win32")&&(osf<=6.3)
	if(w7 && !store.get("win7v2"))
	{
		loader.loadURL('file://'+path.resolve(app.getAppPath(),'./resources/w7loader.html'));
		store.set("win7v2",1);
	}
	else if(w7)
	{
		loader.loadURL('file://'+path.resolve(app.getAppPath(),'./resources/w7rloader.html'));
	}
	else loader.loadURL('file://'+path.resolve(app.getAppPath(),'./resources/loader.html'));

	main.loadURL(url+'?buildid='+build+'-'+process.platform);

	loader.once('show',function(){
		// create_window();
	});

	loader.on('closed', () => {
		loader=null;
	});

	if(process.platform == 'win32') loader.removeMenu();

	loader.webContents.once('dom-ready',function(){
		loader.show();
	});

	main.webContents.once('dom-ready',function(){
		setTimeout(function(){
			if(loader)
			{
				main.show();
				loader.hide();
				loader.close();
			}
			else
			{
				closing=true;
				main.close();
			}
		},600);
	});


	// if(dev) main.webContents.openDevTools();

	add_window_events(main);

	// Emitted when the window is closed.
	main.on('closed', () => {
		main=null;
	});

	main.on('close', function(e){
		// return;
		if(closing) return;
		var choice = require('electron').dialog.showMessageBoxSync(this,{
			type: 'question',
			buttons: ['Yes', 'No'],
			title: 'Confirm',
			message: 'Are you sure you want to close Adventure Land?'
		});
		if(choice==1)
		{
			e.preventDefault();
		}
	});
	if(process.platform == 'darwin')
	{
		try{
			var menu = Menu.buildFromTemplate(darwin_menu);
			Menu.setApplicationMenu(menu);
		}catch(e){
			// require('electron').dialog.showErrorBox("Adventure Land","Menu error: "+e);
		}
	}
}

var darwin_menu=[
	{
		label: app.getName(),
		submenu: [
			{role: 'about'},
			{type: 'separator'},
			{role: 'hide'},
			{role: 'hideothers'},
			{role: 'unhide'},
			{type: 'separator'},
			{role: 'quit'}
		]
	},
	{
		label: 'Edit',
		submenu: [
			{role: 'undo'},
			{role: 'redo'},
			{type: 'separator'},
			{role: 'cut'},
			{role: 'copy'},
			{role: 'paste'},
			{role: 'pasteandmatchstyle'},
			{role: 'delete'},
			{role: 'selectall'}
		]
	},
	{
		label: 'Tools',
		submenu: [
			{label:"Inspector",role: 'toggledevtools'},
			{type: 'separator'},
			{role: 'reload'},
			{type: 'separator'},
			{role: 'resetzoom'},
			{role: 'zoomin'},
			{role: 'zoomout'},
			{type: 'separator'},
			{role: 'togglefullscreen'}
		]
	},
];

var got_the_lock=1;
if(process.platform=="win32") got_the_lock=app.requestSingleInstanceLock();

if(store.get("http_mode")) url=url.replace("https","http"); // for testing

if(!got_the_lock) app.quit();
else
{
	if(process.platform=="win32")
		app.on('second-instance', (event, commandLine, workingDirectory) => {
			if (main) {
				if (main.isMinimized()) main.restore();
				main.focus()
			}
		});

	app.on('ready',create_window);

	// Quit when all windows are closed.
	app.on('window-all-closed',function(){
		if(process.platform !== 'darwin' || 1) 
		{
			app.quit()
		}
	});

	app.on('activate',function(){
		if(main===null) create_window();
	})
}