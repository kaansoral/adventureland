#!/bin/bash
export SERVER_SOFTWARE="Dev"

# If not yet cloned, clone the repository. Means first time ran.
if [ ! -d "appserver" ]; then
    echo "Cloning appserver"
    git clone https://github.com/kaansoral/adventureland-appserver.git appserver
fi

echo "Patching appserver"
sed -i 's/allowed_ips=\[[^]].*\]/allowed_ips=["^(?:::f{4}:)?(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:::)?(?:[0-9a-f]{1,4}:){1,7}[0-9a-f]{1,4}$"]/g' appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py
sed -i 's/: logging\.info("External Allowed IP Tried to Ha/ and gg == 0: logging\.info("External Allowed IP Tried to Ha/g' appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py


echo "Setting up server secrets & variables"
cp ./useful/template.secrets.py ./secrets_data.py && \
cp ./useful/template.variables.js ./node/variables.js && \
cp ./useful/template.live_variables.js ./node/live_variables.js


npm install --silent ./scripts/

exec python appserver/sdk/dev_appserver.py --storage_path=appserver/storage/ --blobstore_path=appserver/storage/blobstore/ --datastore_path=appserver/storage/db.rdbms --admin_host=0.0.0.0 --host=0.0.0.0 --port=8080 ./ --require_indexes --skip_sdk_update_check