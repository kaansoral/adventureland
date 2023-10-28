#!/bin/bash
curdir=$(pwd)
apt update
apt upgrade -y

apt install python2.7 git nodejs npm -y

wget https://bootstrap.pypa.io/pip/2.7/get-pip.py
sudo python2.7 get-pip.py
pip2.7 check
pip2.7 install lxml

#Install appengine
cd $curdir
mkdir appengine
cd appengine
wget https://chromium.googlesource.com/external/googleappengine/python/+archive/69de4b85b39dc737634b0150a8e412730b8ed9e2.tar.gz
tar -xf 69de4b85b39dc737634b0150a8e412730b8ed9e2.tar.gz
#fixes an issue where RAND_egd can't be found, hacky but it works
sed 's/RAND_egd, //' -i google/appengine/dist27/socket.py

#Download server
cd $curdir
git clone https://github.com/NexusNull/adventureland
cd adventureland/node/
npm install

#Install DB
cd $curdir
mkdir storage
cd storage
wget https://raw.githubusercontent.com/kaansoral/adventureland-appserver/main/storage/db.rdbms
