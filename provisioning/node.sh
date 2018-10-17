#!/bin/bash

echo "############## Provisioning: node.sh"
echo "apt-getting update"
apt-get update
echo "installing initial nodejs"
apt-get install -y nodejs
echo "curling recent"
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
echo "updating node js"
sudo apt-get install -y nodejs
echo "symlinking"
ln -s /usr/bin/nodejs /usr/bin/node

echo "installing yarn"
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

sudo apt-get update && sudo apt-get install yarn


# echo "npm installing"
# npm install -g gulp
# npm install -g license-checker
# cd /vagrant
# npm install
service apache2 restart
# gulp
echo "nodejs done"
