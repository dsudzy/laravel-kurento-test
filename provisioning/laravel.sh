#!/bin/bash

echo "############## Provisioning: laravel.sh"
composer global require "laravel/installer"
cd /vagrant
#rm -r /vagrant/node_modules
#sudo su - vagrant -c "git clone git@github.com:alipes-inc/laravel-node-modules.git /vagrant/node_modules"
# npm cache clear
php artisan cache:clear
sudo su - vagrant -c "cd /vagrant; composer install --no-progress"
# npm install
php artisan migrate --seed --force
#gulp
cd
