# Adventure Land - The Open Source CODE MMORPG

https://adventure.land

The Source Code is now available to anyone, even for commercial use! (License applies)

**Please consider supporting Adventure Land on Patreon: https://www.patreon.com/AdventureLand**

## Discussion

Consider using the #development channel on Discord or messaging me directly on Discord as it's an easy way to communicate: https://discord.gg/hz25Kz9FsH

## Installation

Clone the game files into the adventureland folder:

```sh
git clone https://github.com/kaansoral/adventureland adventureland
```

Clone a modified copy of Python2 App Engine Local App Server into the python folder along with an initialized database with map files:

```sh
git clone https://github.com/kaansoral/adventureland-appserver appserver
```

Set up secrets files and remember to change secret keys!

```sh
cp adventureland/useful/template.secrets.py adventureland/secrets.py
cp adventureland/useful/template.variables.js adventureland/node/variables.js
cp adventureland/useful/template.live_variables.js adventureland/node/live_variables.js
```

You'll need to download Python2.7 and use the command that comes along with it - it could be ./python or python.exe depending on your setup method
Here's the download page: https://www.python.org/downloads/release/python-2718/
For Linux:

```sh
apt update
apt upgrade -y

apt install python2.7 git -y

wget https://bootstrap.pypa.io/pip/2.7/get-pip.py
sudo python2.7 get-pip.py
pip2.7 check
```

For MacOS pyenv makes sense as it prevents clash between Python versions and allows local versioning by just adding a .python-version to the folder https://github.com/pyenv/pyenv

Make sure to install lxml afterwards:

```sh
pip2.7 install lxml
```

Run the Python2.7 backend - includes an HTTP server, datastore, various utilities - emulates Google App Engine:

```sh
python2.7 appserver/sdk/dev_appserver.py --storage_path=appserver/storage/ --blobstore_path=appserver/storage/blobstore/ --datastore_path=appserver/storage/db.rdbms --host=0.0.0.0 --port=80 adventureland/ --require_indexes --skip_sdk_update_check
```

Set up the NodeJS game server:

```sh
npm install adventureland/node/
```

Edit the paths in `adventureland/node/variables.js` if you want to run the server from any path

Enter the path of the NodeJS server:

```sh
cd adventureland/node
```

Run a server:

```sh
node server.js EU I 8022
```

You should be able to access the game at: http://0.0.0.0/

If you're on Windows and have issues with `0.0.0.0` - replace them with `127.0.0.1` and use http://127.0.0.1/

The **useful/** folder has useful commands

## Network

Add these to your /etc/hosts file:

```sh
0.0.0.0         thegame.com
0.0.0.0         www.thegame.com
```

And setup nginx with a conf such as:

```sh
worker_processes  3;

events {
	worker_connections  2048;
}

http {
	include mime.types;
	default_type application/octet-stream;

	sendfile on;

	keepalive_timeout 0;
	proxy_read_timeout 200;
	proxy_connect_timeout 30;
	proxy_send_timeout 200;

	server {
		listen 8080;
		server_name thegame.com;
		location / {
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
			proxy_set_header X-Forwarded-Proto $scheme;
			proxy_set_header Host $http_host;
			proxy_redirect off;
			proxy_pass http://localhost:8083;
			expires -1;
		}
	}

	include servers/*;
}
```

This way you can run multiple different projects at once and reach them using a local url of your choice, my choice was thegame.com

If you choose to go live with the development server, make sure to block external access to every `login: admin` url you see in **app.yaml**. You could do this via a custom authentication or via nginx etc.

## How to Contribute

This repository is the live version of the game. Any changes made will be live when the game is updated. Please create a Discord discussion in the **#development** channel before working on any big changes so your efforts aren't wasted or clash with the efforts of another contributor. Alternatively you can create a Github Issue if you don't use Discord.

Content additions are very welcome, if you inspect the map data, there are many zones created yet not integrated. I'd be very happy to guide potential contributors in adopting and authoring a new zone, a new event, a new monster, a new mechanic and so on.

I will include graphical assets, new item images manually. Please email them to hello@adventure.land

## Suggestions

I suggest you go live with this development codebase and approach development in a very agile manner, you can then move onto cloud if you wish to. My suggestion is to never move onto cloud and building a custom infrastructure using cheap dedicated servers with unlimited bandwidths.

The main problem with traditional MMORPG's is people seeking power and while an offline game can provide this for everyone, an online game cannot. Pretty soon new players will avoid such MMORPG's and existing players will also dwindle. In my opinion there are 2 solutions, you could introduce a decay mechanic to overcome this, or concentrate your innovations and additions to make a more social game rather than a game for power hungry people. Originally I intended to add a lot more social integrations, for example browser notifications integrated to the social hub of the game and easy drop ins to friends playing the game etc. So making a more idle and more social game, with new custom art and a new direction could also be a good option, it's definitely the more serene option that anyone can pursue.

## Code formatting

This project uses [Eslint](https://eslint.org/) and [Prettier](https://prettier.io/).  
For now, this is only used inside the game servers (`/node/` folder).  
If you use VSCode, please install the recommended extensions for [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode). The formatting will be automatically done on save.  
If you have suggestions regarding the formatting, feel free to open an issue or discuss it on Discord. [Here is the history](https://discord.com/channels/238332476743745536/1163453037126357074) of the conversation regarding the formatting.  
As you might notice, several eslint rules have been marked as warnings instead of errors. This is to allow a smooth and iterative transition. Make sure your new code respects the rules, even the warnings. If you want to submit a PR to fix a specific warning in a specific part of the code, feel free to do so.

## Freelancers

Adventure Land's map designer is available for freelance work or for hire. Contact: markjlacandula@gmail.com

I'm also available for working freelance on an hourly basis. Contact: hello@adventure.land

If you have specific requirements, for example a unique cloud architecture in mind, I can help you find someone within our community that can handle the job. If you are an artist/designer and looking for a programmer to work on a game with, our Discord is also a good place to find someone!

## License

https://github.com/kaansoral/adventureland/blob/master/LICENSE
