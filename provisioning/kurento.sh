#!/bin/bash

echo "############## Provisioning: kurento.sh"

DISTRO="trusty"

sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83

sudo tee "/etc/apt/sources.list.d/kurento.list" >/dev/null <<EOF
# Kurento Media Server - Release packages
deb [arch=amd64] http://ubuntu.openvidu.io/6.8.1 $DISTRO kms6
EOF

sudo apt-get -y update
sudo apt-get -y install kurento-media-server

sudo service kurento-media-server start

echo "add security credentials at https://doc-kurento.readthedocs.io/en/stable/features/security.html"