FROM node:16

# update base image and get latest packages
RUN apt-get update && apt-get upgrade -y

# get the dev version of python2 to install the reqs lower
RUN apt-get install python2-dev -y

# curl used to download pip
RUN apt-get install curl -y

# git used to donwload the app server
RUN apt-get install git -y

# cloning the app server into the docker container
RUN git clone https://github.com/kaansoral/adventureland-appserver appserver

# fixing the internal IP address range that wizard put serious limitations on
# for example, you could have 192.168.1.125 but not 192.168.0.1 /shrug
RUN sed -i 's/192.168.1\\..?.?.?/192\\.168\\.(0\\.([1-9]|[1-9]\\d|[12]\\d\\d)|([1-9]|[1-9]\\d|[12]\\d\\d)\\.([1-9]?\\d|[12]\\d\\d))/' /appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py
RUN sed -i 's/allowed_ips=\[/allowed_ips=["^172\\.(16\\.0\\.([1-9]|[1-9]\\d|[12]\\d\\d)|16\\.([1-9]|[1-9]\\d|[12]\\d\\d)\\.([1-9]?\\d|[12]\\d\\d)|(1[7-9]|2\\d|3[01])(\\.([1-9]?\\d|[12]\\d\\d)){2})$",/g'  /appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py

# get the pip like we discussed
RUN curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py

# use python to install pip
RUN python2 get-pip.py

# wizard told us to install lxml but python2 can't handle it out with
# supplimentary libraries
RUN apt-get install libxml2-dev libxslt-dev

# install lxml
# TODO: remove lxml since it's not used
# Imported, not used in config.py: from lxml import etree as lxmletree
RUN pip install lxml

# make the AL directory, and enter it
RUN mkdir adventureland && cd adventureland

# copy from the current location to our AL folder
COPY . /adventureland
# COPY ./secrets.py /adventureland/secrets.py
# COPY ./node/variables.js /adventureland/node/variables.js
# COPY ./node/live_variables.js /adventureland/node/live_variables.js

RUN pip install flask -t /adventureland/lib

# npm install performs from the workdir. why? idk. it's stupid
WORKDIR /adventureland/scripts

# install the scripts
RUN npm install

# see why it's stupid? gotta change the workdir to install something else
WORKDIR /adventureland/node

# install the something else
RUN npm install

# i don't think we need all of these. need to do more research
EXPOSE 8082
EXPOSE 8083
EXPOSE 43291
EXPOSE 8000

# add execution perms to the entrypoints
RUN chmod +x /adventureland/docker/central-server-entrypoint.sh
RUN chmod +x /adventureland/docker/game-server-entrypoint.sh

# set the default entry point
ENTRYPOINT ["/adventureland/docker/central-server-entrypoint.sh"]