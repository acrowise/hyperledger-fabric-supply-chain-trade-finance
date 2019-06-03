const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const axios = require('axios');
const socketIO = require('socket.io');
const mime = require('mime-types');
const ipfsClient = require('ipfs-http-client');

const clients = [];
// let connectedToWS = false;

const {
  PORT, API_ENDPOINT, ROLE, IPFS_PORT, ORG
} = process.env;

const roles = {
  buyer: 'buyer',
  supplier: 'supplier',
  auditor_1: 'ggcb',
  auditor_2: 'uscts',
  factor_1: 'factor 1',
  factor_2: 'factor 2',
  transporter: 'transporter'
};

const ipfs = ipfsClient({
  host: `ipfs.${ORG}.example.com`
});

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
    return await retry(url, n - 1);
  }
};

const emitEvent = (client, data, type) => {
  client.emit('notification', JSON.stringify({ data, type }));
};

const listenSocket = () => {
  const ws = new WebSocket(`ws://${API_ENDPOINT}/api/notifications`);

  const heartbeat = () => {
    setInterval(() => {
      ws.send('ping');
    }, 10000);
  };

  const subscribe = () => {
    ws.send(
      JSON.stringify({
        event: 'cc_event',
        channel: 'common',
        chaincode: 'supply-chain-chaincode'
      })
    );
    ws.send(
      JSON.stringify({
        event: 'cc_event',
        channel: 'common',
        chaincode: 'trade-finance-chaincode'
      })
    );
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
    // connectedToWS = true;
    console.info('ws message: ', message);
    const event = JSON.parse(message);
    if (event && event.payload) {
      const chaincode = event.payload.EventName.split('.')[1];
      const eventName = event.payload.EventName.split('.')[2];
      const eventId = event.payload.EventName.split('.')[3];

      console.info('chaincode:', chaincode);
      console.info('eventName:', eventName);
      console.info('eventId:', eventId);

      try {
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
      } catch (e) {
        console.error(e);
      }

      setTimeout(() => {
        if (eventName === 'acceptOrder') {
          clients.forEach(c => emitEvent(c, {}, 'contractCreated'));
        }
        if (eventName === 'verifyProof') {
          clients.forEach(c => emitEvent(c, {}, 'reportGenerated'));
        }
      }, 1250);
    }
  });
};

const app = express();
const router = express.Router();

const getDocument = hash => new Promise((resolve, reject) => {
  ipfs.get(hash, (err, files) => {
    if (err) {
      reject(err);
    }
    resolve(files[0].content);
  });
});

router.get('/getDocument', async (req, res) => {
  const t = {
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
        'Content-type': mime.contentType(Object.keys(t).find(i => t[i] === req.query.type))
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
  const data = { ipfs_port: IPFS_PORT, role: roles[ROLE], org: ORG };
  return res.send(html(data));
};

if (process.env.FAKE_API) {
  const registerFakeRoutes = require('./fake-routes'); // eslint-disable-line global-require
  registerFakeRoutes(router, clients);
}

router.use('*', renderer);
app.use(router);

const server = app.listen(port, () => {
  console.log(`listening on port: ${PORT}`);
  try {
    listenSocket();
  } catch (e) {
    process.exit(1);
  }
});

// setTimeout(() => {
//   if (!connectedToWS) {
//     console.info('restart');
//     process.exit(1);
//   }
// }, 60000);

const io = socketIO(server);

io.on('connection', (client) => {
  clients.push(client);
});
