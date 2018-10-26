#!/bin/bash

COMMAND="$1"

echo "sudo cp -rf ./* /var/www/html/"
sudo cp -rf ./* /var/www/html/

echo "$COMMAND"
$COMMAND


