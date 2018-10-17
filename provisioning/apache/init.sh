#!/bin/bash

echo "############## Provisioning: apache/init.sh"
apt-get install -y apache2
rm -rf /var/www/html
ln -fs /vagrant/public /var/www/html
cp /vagrant/provisioning/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
a2enmod rewrite
service apache2 restart
