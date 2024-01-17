#!/bin/bash

cp ./useful/template.variables.js ./node/variables.js && \
cp ./useful/template.live_variables.js ./node/live_variables.js

if [ -z $1 ]; then
    echo "server name required"
    exit 1
fi

if [ -z $2 ]; then
    echo "server identifier required"
    exit 1
fi

if [ -z $3 ]; then
    echo "server port required"
    exit 1
fi
npm install --silent ./node/
npm install --silent ./scripts/ 
sleep 30
echo "Trying to start client"
node ./node/server.js $1 $2 $3