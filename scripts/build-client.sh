#!/usr/bin/env bash

ARCH=$(uname -s | grep Darwin)

if [ "$ARCH" == "Darwin" ]; then

docker run -it --rm \
    -v $(pwd)/client:/usr/src/app \
    node:8 \
    bash -c "cd /usr/src/app && npm install && npm run build"

else

docker run -it --rm \
    -v $(pwd)/client:/usr/src/app \
    -u $(id -u ${USER}) \
    node:8 \
    bash -c "cd /usr/src/app && npm install && npm run build"
fi