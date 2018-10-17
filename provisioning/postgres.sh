#!/bin/bash

echo "############## Provisioning: postgres.sh"
apt-get install -y postgresql postgresql-contrib php7.2-pgsql

sudo -u postgres createuser -s vagrant
sudo -u vagrant createdb vagrant
sudo sed -i 's/\(host.*all.*all.*127\.0\.0\.1.*\)md5/\1trust/g' /etc/postgresql/$(ls /etc/postgresql)/main/pg_hba.conf
/etc/init.d/postgresql restart
service apache2 restart
