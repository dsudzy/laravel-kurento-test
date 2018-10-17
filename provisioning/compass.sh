#!/bin/bash

echo "############## Provisioning: compass.sh"
apt-add-repository ppa:brightbox/ruby-ng
apt-get update
apt-get install -y ruby2.2 ruby2.2-dev
gem install bundler
gem install compass
gem install gem-licenses
cd /vagrant
sudo su - vagrant -c "cd /vagrant; bundle install"
