const express = require('express');
// const proxy = require('http-proxy-middleware');
const path = require('path');
const WebSocket = require('ws');
const axios = require('axios');
const socketIO = require('socket.io');

const clients = [];

const services = {
  buyer: {
    port: 30001,
    role: 'buyer',
    org: 'a'
  },
  supplier: {
    port: 30002,
    role: 'supplier',
    org: 'b'
  },
  auditor_1: {
    port: 30003,
    role: 'ggcb',
    org: 'c'
  },
  auditor_2: {
    port: 30004,
    role: 'uscts',
    org: 'd'
  },
  factor_1: {
    port: 30005,
    role: 'factor 1',
    org: 'e'
  },
  factor_2: {
    port: 30006,
    role: 'factor 2',
    org: 'f'
  },
  transporter: {
    port: 30007,
    role: 'transporter',
    org: 'g'
  }
};

const {
  PORT, API_ENDPOINT, ROLE, IPFS_PORT, ORG
} = process.env;

console.info('API_ENDPOINT', API_ENDPOINT);
console.info('ROLE', ROLE);
console.info('ORG', ORG);

const port = process.env.PORT || services[ROLE].port;

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

const listenSocket = () => new Promise((resolve, reject) => {
  const ws = new WebSocket(`ws:///${API_ENDPOINT}/api/notifications`);

  function heartbeat() {
    setInterval(() => {
      ws.send('ping');
    }, 10000);
  }

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
    resolve();
  });

  ws.on('error', (e) => {
    console.error(e);
  });

  ws.on('close', () => {
    reject(Error('ws closed'));
  });

  ws.on('message', async (message) => {
    console.info('ws message: ', message);
    const event = JSON.parse(message);
    if (event && event.payload) {
      const chaincode = event.payload.EventName.split('.')[1];
      const eventName = event.payload.EventName.split('.')[2];
      const eventId = event.payload.EventName.split('.')[3];

      console.info('eventName:', eventName);
      console.info('eventId:', eventId);

      try {
        const res = await retry(
          `http://${API_ENDPOINT}/api/channels/common/chaincodes/${chaincode}?fcn=getEventPayload&args=${eventId}`,
          3
        );

        console.log(res.data.result);

        clients.forEach(c => c.emit(
          'notification',
          JSON.stringify({
            data: {
              key: { id: res.data.result.value.entityID },
              value: res.data.result.value.other
            },
            type: eventName
          })
        ));
      } catch (e) {
        console.error(e);
      }
    }
  });
});

const connectToWebSockets = async (n) => {
  const timeout = 10000;
  try {
    await listenSocket();
  } catch (e) {
    if (n !== 0) {
      console.log(n);
      setTimeout(async () => {
        connectToWebSockets(n - 1);
      }, timeout);
    }
  }
};

const app = express();
const router = express.Router();

// router.use(
//   '/api',
//   proxy({
//     target: `http://${API_ENDPOINT}`,
//     changeOrigin: true,
//     logLevel: 'debug',
//     onProxyReq: async (proxyReq, req, res) => {
//       console.info('proxyReq.path', proxyReq.path);
//     },
//     onProxyRes: async (proxyRes, req, res) => {
//       let body = Buffer.from('');
//       proxyRes.on('data', (data) => {
//         body = Buffer.concat([body, data]);
//       });
//       proxyRes.on('end', () => {
//         body = body.toString();
//         // console.info('res from fabric-rest-api-go', body);
//       });
//     }
//   })
// );

app.use(express.static(path.join(__dirname, '../dist/client')));

const html = require('./html');

const renderer = async (req, res) => {
  const data = Object.assign({ ipfs_port: IPFS_PORT, role: services[ROLE].role, org: services[ROLE].org });

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
  // Waiting for nginx container
  connectToWebSockets(6);
});

const io = socketIO(server);

io.on('connection', (client) => {
  clients.push(client);
});
