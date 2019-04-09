#!/usr/bin/env bash

ARCH=$(uname -s | grep Darwin)


docker run -it --rm \
    -v $(pwd)/client:/usr/src/app \
    node:8 \
    bash -c "cd /usr/src/app && npm install && npm run build"