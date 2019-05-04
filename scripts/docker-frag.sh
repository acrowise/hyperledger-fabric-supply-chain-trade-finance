#!/usr/bin/env bash

echo "Cloning fabric-rest-api-go into ./.tmp folder and build frag:otc docker container"

mkdir -p .tmp

cd .tmp

git clone git@gitlab.altoros.com:intprojects/fabric-rest-api-go.git

cd fabric-rest-api-go

git checkout dev

# Compatibility reasons
#git checkout 8457988087cf99a8335565b5df2695d4bc4c1e98

docker build -t frag:latest .
