#!/bin/bash

echo "############## Provisioning: php.sh (now with php 7!)"
sudo add-apt-repository ppa:ondrej/php
# sudo add-apt-repository ppa:ondrej/php5-compat
apt-get update
apt-get install software-properties-common
apt-get install python-software-properties
apt-get update
# apt-get install -y php5 libapache2-mod-php5 php5-mcrypt php5-cli php5-curl php5-gd php5.6-mbstring php5.6-dom
apt-get -y install php7.2 libapache2-mod-php7.2 php7.2-mysql php7.2-mbstring php7.2-xml php7.2-curl php7.2-gd php7.2-zip php7.2-dev

curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
sudo su - vagrant -c 'echo '"'"'export PATH="$HOME/config/.composer/vendor/bin:$PATH"'"'"' >> ~/.bashrc'
service apache2 restart

echo "#### Installing tidy-html5 CLI"
apt-get install cmake
git clone git@github.com:htacg/tidy-html5.git
cd tidy-html5/build/cmake
cmake ../.. -DCMAKE_BUILD_TYPE=Release
make
make install
cd ../../..
