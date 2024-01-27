FROM ubuntu:latest
WORKDIR /adventureland

EXPOSE 8080
EXPOSE 8000

RUN set -uex; \
    apt-get update; \
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
     | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    NODE_MAJOR=16; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
     > /etc/apt/sources.list.d/nodesource.list; \
    apt-get -qy update; \
    apt-get -qy install nodejs;


# Install dependencies
RUN apt-get install python2.7 git wget python-setuptools libxml2-dev libxslt-dev python2-dev cmake build-essential zlib1g-dev -y && \
    wget https://bootstrap.pypa.io/pip/2.7/get-pip.py && \
    python2.7 get-pip.py && \
    pip2 check && \
    pip2 install setuptools lxml

# Set python2 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python2 1

COPY . .

ENTRYPOINT [ "./server_entrypoint.sh" ]