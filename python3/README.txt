Install google-cloud-sdk from: https://cloud.google.com/sdk/docs/install

Replace app.yaml with the python3 one

python3 CLOUD_SDK_ROOT/bin/dev_appserver.py OPTION yaml_path FILES

The python3 dev_appserver uses Java objects, test it according to your needs and performance expectations, I personally favor Python2 still [27/01/24]

Useful: https://cloud.google.com/appengine/docs/standard/tools/local-devserver-command?tab=python

Useful for testing, creates a copy: node ~/gscripts/create_python3_copy.js 

alias run_thegame3="python3.11 /Users/kaan/Desktop/APPENGINE/google-cloud-sdk/bin/dev_appserver.py --storage_path=/Users/kaan/Desktop/DEPLOY/python3/storage/ --blobstore_path=/Users/kaan/Desktop/DEPLOY/python3/storage/blobstore/ --datastore_path=/Users/kaan/Desktop/DEPLOY/python3/storage/new_db.bin --host=0.0.0.0 --port=8083 /Users/kaan/Desktop/DEPLOY/python3/thegame/ --require_indexes --enable_host_checking=False"

Suggestions:
1) Invoke /admin/make with your email put in admin.py
2) From /admin/executor - call empty_fill_maps()
3) After getting rid of the initial errors, figure out the rest

Useful for pulling logs: gcloud app logs tail -v 20240206t194907