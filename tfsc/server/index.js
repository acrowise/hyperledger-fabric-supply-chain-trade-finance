const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const axios = require('axios');
const socketIO = require('socket.io');
const mime = require('mime-types');
const ipfsClient = require('ipfs-http-client');
const jwt = require('jsonwebtoken');

const clients = [];

const {
  PORT, API_ENDPOINT, ROLE, IPFS_PORT, ORG, JWT_SECRET = 'tfsc-secret'
} = process.env;

const {
  METHODS_MAP,
  SUPPLY_CHAIN_CHAINCODE,
  TRADE_FINANCE_CHAINCODE
} = require('../src/constants');

const ACTORS = {
  buyer: { role: 'buyer', id: 'aMSP' },
  supplier: { role: 'supplier', id: 'bMSP' },
  auditor_1: { role: 'ggcb', id: 'cMSP' },
  auditor_2: { role: 'uscts', id: 'dMSP' },
  factor_1: { role: 'factor 1', id: 'eMSP' },
  factor_2: { role: 'factor 2', id: 'fMSP' },
  transporter: { role: 'transporter', id: 'gMSP' },
  bank: { role: 'bank', id: 'hMSP' }
};

const ipfs = ipfsClient({
  host: `ipfs.${ORG}.example.com`
});

const app = express();
const router = express.Router();

console.info('API_ENDPOINT', API_ENDPOINT);
console.info('ROLE', ROLE);
console.info('ORG', ORG);

const port = process.env.PORT || 3000;

const retry = async (url, n) => {
  try {
    return await axios.get(url);
  } catch (err) {
    if (n === 0) {
      throw err;
    }
    return retry(url, n - 1);
  }
};

const emitEvent = (client, data, type) => {
  client.emit('notification', JSON.stringify({ data, type }));
};

const listenSocket = () => {
  const ws = new WebSocket(`ws://${API_ENDPOINT}/api/notifications`);

  const heartbeat = () => {
    setInterval(() => {
      ws.send(JSON.stringify('ping'));
    }, 10000);
  };

  const subscribeMessage = chaincode => JSON.stringify({
    event: 'cc_event',
    channel: 'common',
    chaincode
  });

  const subscribe = () => {
    ws.send(subscribeMessage(SUPPLY_CHAIN_CHAINCODE));
    ws.send(subscribeMessage(TRADE_FINANCE_CHAINCODE));
    heartbeat();
  };

  ws.on('open', () => {
    subscribe();
  });

  ws.on('error', (e) => {
    throw e;
  });

  ws.on('close', () => {
    throw Error('WS closed');
  });

  ws.on('message', async (message) => {
    console.info('ws message: ', message);
    const event = JSON.parse(message);
    if (event && event.payload) {
      try {
        JSON.parse(event.payload.EventName).forEach(async (item) => {
          const payload = item.id.split('.');
          const chaincode = payload[1];
          const eventName = payload[2];
          const eventId = payload[3];

          console.info('eventId:', eventId);
          console.info('chaincode:', chaincode);
          console.info('eventName:', eventName);

          const { actors } = METHODS_MAP.find(i => i.ccMethod === eventName);

          if (actors && actors.includes(ROLE)) {
            const res = await retry(
              `http://${API_ENDPOINT}/api/channels/common/chaincodes/${chaincode}?peer=${ORG}/peer0&fcn=getEventPayload&args=${eventId}`,
              3
            );

            console.log(res.data.result);

            clients.forEach(c => emitEvent(
              c,
              {
                key: { id: res.data.result.value.entityID },
                value: res.data.result.value.other
              },
              eventName
            ));

            setTimeout(() => {
              if (eventName === 'acceptOrder') {
                clients.forEach(c => emitEvent(c, {}, 'contractCreated'));
              }
              if (eventName === 'verifyProof') {
                clients.forEach(c => emitEvent(c, {}, 'reportGenerated'));
              }
            }, 1250);
          } else {
            console.info(`${ROLE} is not subscribed to ${eventName}`);
          }
        });
      } catch (e) {
        console.error(e);
      }
    }
  });
};

const getDocument = hash => new Promise((resolve, reject) => {
  ipfs.get(hash, (err, files) => {
    if (err) {
      reject(err);
    }
    resolve(files[0].content);
  });
});

router.post('/login', async (_, res) => res.json({
  jwt: jwt.sign(
    {
      ipfs_port: IPFS_PORT,
      role: ACTORS[ROLE].role,
      org: ORG,
      id: ACTORS[ROLE].id
    },
    JWT_SECRET
  )
}));

router.get('/getDocument', async (req, res) => {
  const types = {
    'image/jpeg': 1,
    'image/jpg': 1,
    'image/png': 2,
    xls: 3,
    pdf: 4,
    csv: 5,
    'image/gif': 6
  };
  if (req.query && req.query.hash && req.query.type) {
    try {
      const document = await getDocument(req.query.hash);
      res.set({
        'Content-type': mime.contentType(Object.keys(types).find(i => types[i] === req.query.type))
      });
      res.send(document);
      return;
    } catch (e) {
      console.error(e);
      res.end(500);
    }
  }
  res.end(500);
});

app.use(express.static(path.join(__dirname, '../dist/client')));

const html = require('./html');

const renderer = async (req, res) => {
  const data = {
    ipfs_port: IPFS_PORT,
    role: ACTORS[ROLE].role,
    org: ORG,
    id: ACTORS[ROLE].id
  };
  return res.send(html(data));
};

if (process.env.FAKE_API) {
  const registerFakeRoutes = require('./fake-routes'); // eslint-disable-line global-require
  registerFakeRoutes(router, clients);
}

router.use('*', renderer);
app.use(router);

const server = app.listen(port, () => {
  console.info(`listening on port: ${PORT}`);
  try {
    listenSocket();
  } catch (e) {
    process.exit(1);
  }
});

const io = socketIO(server);

io.on('connection', (client) => {
  clients.push(client);

  client.on('disconnect', () => {
    const i = clients.indexOf(client);
    clients.splice(i, 1);
  });
});
