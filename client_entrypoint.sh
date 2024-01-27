#!/bin/bash
export SERVER_SOFTWARE="Dev"

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
echo "Starting client"

exec node ./node/server.js $1 $2 $3