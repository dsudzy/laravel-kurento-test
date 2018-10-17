#!/bin/bash

echo "############## Provisioning: setup.sh"
date

sudo apt-get update
sudo apt-get install -y curl git-core lxc s3cmd
echo 'this is a test' >> ~/test.txt
echo 'Host dev.apebble.com' >> ~/.ssh/config
echo '    StrictHostKeyChecking no' >> ~/.ssh/config
echo 'Host github.com' >> ~/.ssh/config
echo '    StrictHostKeyChecking no' >> ~/.ssh/config
#mkdir -p /cgroup
#mount none -t cgroup /cgroup
(crontab -l 2>/dev/null; echo "*/5 * * * * cd /vagrant/public/wordpress; php -q wp-cron.php") | crontab -
