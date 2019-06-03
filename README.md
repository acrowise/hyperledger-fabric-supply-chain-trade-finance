# Trade-Supply Demo with Hyperledger Fabric 1.4, local deployment version

*Based on "Starter Application for Hyperledger Fabric 1.4"*

Generate artifacts with crypto material, configs and dockercompose templates.
Build docker [Fabric Rest API Go](https://gitlab.altoros.com/intprojects/fabric-rest-api-go) container and web client:
```
make generate
```

Bring up local development network:
```
make up
```

Take down local development network:
```
make down
```

Remove docker containers and volumes:
```
make clear
```


## Members and Components

Network consortium consists of:

- Orderer organization `example.com`
- Peer organization org1 `a` 
- Peer organization org2 `b` 
- Peer organization org3 `c`
- Peer organization org4 `d`
- Peer organization org5 `e`
- Peer organization org6 `f`
- Peer organization org7 `g`
- Peer organization org8 `h`

They transact with each other on the following channel:
- `common` involving all members and with chaincode `reference` deployed

Each organization starts several docker containers:

- **peer0** (ex.: `peer0.a.example.com`) with the anchor [peer](https://github.com/hyperledger/fabric/tree/release/peer) runtime
- **peer1** `peer1.a.example.com` with the secondary peer
- **ca** `ca.a.example.com` with certificate authority server [fabri-ca](https://github.com/hyperledger/fabric-ca)
- **api** `api.a.example.com` with [Fabric Rest API Go](https://gitlab.altoros.com/intprojects/fabric-rest-api-go) API server
- **www** `www.a.example.com` nginx server to serve web client and reverse proxy to API
- **cli** `cli.a.example.com` with tools to run commands during setup

## Local deployment

Deploy docker containers of all member organizations to one host, for development and testing of functionality. 

After all containers are up, web interfaces will be at:

- org1 [http://localhost:3001](http://localhost:3001/)
- org2 [http://localhost:3002](http://localhost:3002/)
- org3 [http://localhost:3003](http://localhost:3003/)
- org4 [http://localhost:3004](http://localhost:3004/)
- org5 [http://localhost:3005](http://localhost:3005/)
- org6 [http://localhost:3006](http://localhost:3006/)
- org7 [http://localhost:3007](http://localhost:3007/)
- org8 [http://localhost:3008](http://localhost:3008/)

- Blockchain explorer [http://localhost:8080](http://localhost:8080/)

## How it works

The script [network.sh](network.sh) uses substitution of values and names to create config files out of templates:

- [cryptogentemplate-orderer.yaml](artifacts/cryptogentemplate-orderer.yaml) 
and [cryptogentemplate-peer.yaml](artifacts/cryptogentemplate-peer.yaml) for `cryptogen.yaml` to drive 
[cryptogen](https://github.com/hyperledger/fabric/tree/release/common/tools/cryptogen) tool to generate members' crypto material: 
private keys and certificates
- [configtxtemplate.yaml](artifacts/configtxtemplate.yaml) for `configtx.yaml` with definitions of 
the consortium and channels to drive [configtx](https://github.com/hyperledger/fabric/tree/release/common/configtx) tool to generate 
genesis block file to start the orderer, and channel config transaction files to create channels
- [docker-composetemplate-orderer.yaml](ledger/docker-composetemplate-orderer.yaml) 
and [docker-composetemplate-peer.yaml](ledger/docker-composetemplate-peer.yaml) for `docker-compose.yaml` files for 
each member organization to start docker containers

During setup the same script uses `cli` docker containers to create and join channels, install and instantiate chaincodes.

And finally it starts members' services via the generated `docker-compose.yaml` files.
 
## Testing

Use postman collections
- supply-chain-chaincode [https://www.getpostman.com/collections/d35ed7890f4699795018]
- trade-finance-chaincode [https://www.getpostman.com/collections/942834442b14876c9b44]