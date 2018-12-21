#!/bin/bash

FILE="$1"
COMMAND="$2"

if [ -n "$FILE" ]; then
    echo "sudo cp -rf ./$FILE /var/www/html/$FILE"
    sudo cp -rf ./$FILE /var/www/html/$FILE
else
    echo "sudo cp -rf ./* /var/www/html/"
    sudo cp -rf ./* /var/www/html/
fi

echo "$COMMAND"
$COMMAND


