#!/usr/bin/env bash

echo "Building web-application"

cd tfsc/
docker build -t tsupply-app:latest .
