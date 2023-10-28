#!/bin/bash
cd /opt
python2.7 ./appengine/dev_appserver.py \
--storage_path=./storage/ \
--blobstore_path=./storage/blobstore/ \
--datastore_path=./storage/db.rdbms \
--host=0.0.0.0 --port=80 ./adventureland \
--require_indexes --skip_sdk_update_check
