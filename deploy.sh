#!/bin/bash

FILE="$1"
COMMAND="$2"

echo "sudo cp -rf ./* /var/www/html/${FILE}"
sudo cp -rf ./* /var/www/html/${FILE}

echo "$COMMAND"
$COMMAND


