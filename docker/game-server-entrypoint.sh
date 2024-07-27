#!/bin/bash

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

# wait a second for the python stuff to come up
sleep 5

echo "Starting $1 $2 on port $3"
node /adventureland/node/server.js $1 $2 $3