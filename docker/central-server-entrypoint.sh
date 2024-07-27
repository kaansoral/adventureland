#!/bin/bash

python2 /appserver/sdk/dev_appserver.py --storage_path=/appserver/storage/ --blobstore_path=/appserver/storage/blobstore/ --datastore_path=/appserver/storage/db.rdbms --admin_host=0.0.0.0 --host=0.0.0.0 --port=8083 /adventureland/ --require_indexes --skip_sdk_update_check
