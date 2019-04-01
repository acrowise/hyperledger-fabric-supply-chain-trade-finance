.PHONY: up down generate clear docker build-client

help:
	@echo "FSupply Demo"
	@echo ""
	@echo "generate: generate artifacts with crypto material, configs and dockercompose templates"
	@echo "          build docker Fabric Rest API Go container and web client."
	@echo "up: bring up the network"
	@echo "down: clear the network"
	@echo "clear: remove docker containers and volumes"
	@echo "build-client: build web client (building occurs inside docker container, no Node dependency)"
	@echo ""

generate: build-client
	./scripts/docker-frag.sh
	./network.sh -m generate

up:
	./network.sh -m up

down:
	./network.sh -m down

clear:
	./network.sh -m clean

build-client:
	./scripts/build-client.sh

