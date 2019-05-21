const express = require('express');
const proxy = require('http-proxy-middleware');
const path = require('path');
const WebSocket = require('ws');
const axios = require('axios');
const socketIO = require('socket.io');

const clients = [];

const services = {
  buyer: {
    port: 30001,
    api_port: 3001
  },
  supplier: {
    port: 30002,
    api_port: 3002
  },
  transporter: {
    port: 30003,
    api_port: 3003
  }
};

const PORT = process.env.PORT || services[process.env.ROLE].port;

const API_PORT = process.env.API_PORT || services[process.env.ROLE].api_port;

const ws = new WebSocket(`ws://localhost:${API_PORT}/api/notifications`);

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
  heartbeat();
};

ws.on('open', () => {
  subscribe();
});

ws.on('error', (e) => {
  console.error(e);
});

ws.on('close', () => {
  console.info('ws closed');
});

ws.on('message', async (message) => {
  console.info('ws message: ', message);
  const event = JSON.parse(message);
  if (event && event.payload) {
    const eventName = event.payload.EventName.split('.')[2];
    const eventId = event.payload.EventName.split('.')[3];

    const res = await axios.get(
      `http://localhost:${API_PORT}/api/channels/common/chaincodes/supply-chain-chaincode?fcn=getEventPayload&args=${eventId}`
    );

    clients.forEach(c => c.emit(
      'notification',
      JSON.stringify({
        data: { key: { id: res.data.result.value.entityID }, value: res.data.result.value.other },
        type: eventName
      })
    ));
  }
});

const app = express();
const router = express.Router();

router.use(
  '/api',
  proxy({
    target: `http://0.0.0.0:${API_PORT}`,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: async (proxyReq, req, res) => {
      console.info('proxyReq.path', proxyReq.path);
    },
    onProxyRes: async (proxyRes, req, res) => {
      let body = Buffer.from('');
      proxyRes.on('data', (data) => {
        body = Buffer.concat([body, data]);
      });
      proxyRes.on('end', () => {
        body = body.toString();
        // console.info('res from fabric-rest-api-go', body);
      });
    }
  })
);

app.use(express.static(path.join(__dirname, '../dist/client')));

const html = require('./html');

const renderer = async (req, res) => {
  const data = { role: process.env.ROLE };

  return res.send(html(data));
};

if (process.env.FAKE_API) {
  const registerFakeRoutes = require('./fake-routes');
  registerFakeRoutes(router, clients);
}

router.use('*', renderer);
app.use(router);

const server = app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});

const io = socketIO(server);

io.on('connection', (client) => {
  clients.push(client);
});
