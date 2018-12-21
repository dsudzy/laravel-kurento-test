#!/bin/bash

FILE="$1"
COMMAND="$2"

if [ -n "$FILE" ]; then
    echo "sudo cp -rf ./$FILE /var/www/html/"
    sudo cp -rf ./$FILE /var/www/html/
else
    echo "sudo cp -rf ./* /var/www/html/"
    sudo cp -rf ./* /var/www/html/
fi

echo "$COMMAND"
$COMMAND


