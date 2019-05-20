const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
// const proxy = require('http-proxy-middleware');
const uuid = require('uuid/v4');
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');
const WebSocket = require('ws');
const axios = require('axios');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

const upload = multer();

const PORT = process.env.PORT || 3000;

const API_PORT = process.env.API_PORT || 3001;

const ws = new WebSocket(`ws://localhost:${API_PORT}/api/notifications`);

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      event: 'cc_event',
      channel: 'common',
      chaincode: 'supply-chain-chaincode'
    })
  );
});

ws.on('error', (e) => {
  console.error(e);
});

ws.on('message', async (message) => {
  const event = JSON.parse(message);
  if (event && event.payload) {
    const eventId = event.payload.EventName.split('.')[3];

    const res = await axios.get(
      `http://localhost:${API_PORT}/api/channels/common/chaincodes/supply-chain-chaincode?fcn=getEventPayload&args=${eventId}`
    );

    console.log(res.data);
  }
});

const documents = [
  'Bill of Lading',
  'Delivery Acceptance Form',
  'Packing List',
  'USCTS Report',
  'GGCB Report'
];

const capitalize = str => str[0].toUpperCase() + str.substring(1);

db.defaults({
  orders: [],
  invoices: [],
  bids: [],
  contracts: [],
  shipments: [],
  proofs: [],
  reports: []
}).write();

const get = (field, id) => db
  .get(field)
  .value()
  .find(i => i.key.id === id);

const clients = [];
const app = express();
const router = express.Router();

router.use(cors());

router.use((_, __, next) => {
  setTimeout(() => {
    next();
  }, 650);
});

// router.use(
//   '/api',
//   proxy({
//     target: `http://0.0.0.0:${API_PORT}`,
//     changeOrigin: true,
//     logLevel: 'debug'
//   })
// );

router.use(bodyParser.json());

router.get('/document', (req, res) => {
  if (req.query && req.query.contractId && req.query.name) {
    res.set({ 'Content-type': mime.contentType(req.query.name) });
    res.sendFile(path.resolve(`./.docs/${req.query.contractId}/${req.query.name}`));
    return;
  }
  res.end(500);
});

router.get('/listProofs', (req, res) => {
  if (req.query && req.query.id) {
    const shipmentId = req.query.id;
    res.json({
      result: db
        .get('proofs')
        .value()
        .filter(i => i.value.shipmentId === shipmentId)
    });
    return;
  }

  res.json({
    result: db.get('proofs').value()
  });
});

router.get('/listShipments', (_, res) => {
  res.json({ result: db.get('shipments').value() });
});

router.get('/listContracts', (_, res) => {
  res.json({ result: db.get('contracts').value() });
});

router.get('/listOrders', (_, res) => {
  res.json({ result: db.get('orders').value() });
});

router.get('/listInvoices', (_, res) => {
  res.json({ result: db.get('invoices').value() });
});

router.get('/listBids', (_, res) => {
  res.json({ result: db.get('bids').value() });
});

router.get('/listReports', (_, res) => {
  res.json({ result: db.get('reports').value() });
});

router.post('/uploadDocuments', upload.array('file'), (req, res) => {
  const { files } = req;

  files.forEach((f) => {
    try {
      fs.mkdirSync('./.docs');
    } catch (e) {}
    try {
      fs.mkdirSync(`./.docs/${req.body.contractId}`);
    } catch (e) {}
    fs.writeFileSync(`./.docs/${req.body.contractId}/${f.originalname}`, f.buffer);
    const doc = {
      contractId: req.body.contractId,
      name: f.originalname,
      type: req.body.type
    };
    const shipments = db.get('shipments').value();
    const shipment = shipments.find(i => i.value.contractId === doc.contractId);

    shipment.value.documents.push(doc);

    const event = {
      id: uuid(),
      date: new Date().getTime(),
      action: `${req.body.type} Uploaded`,
      user: req.body.user ? capitalize(req.body.user) : '',
      type: 'document',
      shipmentId: shipment.key.id
    };
    shipment.value.events.push(event);

    db.set('shipments', shipments).write();

    setTimeout(() => {
      clients.forEach(c => c.emit('notification', JSON.stringify({ data: doc, event, type: 'documentUploaded' })));
    }, 500);
  });

  res.end('ok');
});

router.post('/generateProof', (req, res) => {
  const shipments = db.get('shipments').value();
  const shipment = shipments.find(i => i.key.id === req.body.shipmentId);

  const requestedDocuments = [];
  documents.forEach((d) => {
    if (req.body.data[d]) {
      requestedDocuments.push(shipment.value.documents.find(i => i.type === d));
    }
  });

  const contract = db
    .get('contracts')
    .value()
    .find(i => i.key.id === req.body.contractId);
  const proof = {
    key: { id: uuid() },
    value: {
      state: 1,
      shipmentId: req.body.shipmentId,
      agency: req.body.reviewer,
      fields: req.body.data,
      documents: requestedDocuments,
      contract,
      consigneeName: contract.value.consigneeName,
      consignorName: contract.value.consignorName,
      timestamp: new Date().getTime(),
      lastUpdated: new Date().getTime()
    }
  };

  // const shipment = get('shipments', req.body.shipmentId);

  shipment.value.events.push({
    id: uuid(),
    date: new Date().getTime(),
    action: 'Proof generated',
    user: req.body.user || 'Supplier'
  });

  db.set('shipments', shipments).write();
  db.get('proofs')
    .push(proof)
    .write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: proof, shipment, type: 'proofGenerated' })));
  res.end('ok');
});

router.post('/placeOrder', (req, res) => {
  const order = {
    key: { id: uuid() },
    value: {
      state: 0,
      productName: req.body.args[1],
      quantity: req.body.args[2],
      price: req.body.args[3],
      destination: req.body.args[4],
      dueDate: req.body.args[5],
      paymentDate: req.body.args[6],
      buyerId: req.body.args[7],
      totalDue: req.body.args[2] * req.body.args[3],
      timestamp: new Date().getTime(),
      lastUpdated: new Date().getTime()
    }
  };
  db.get('orders')
    .push(order)
    .write();
  clients.forEach(c => c.emit('notification', JSON.stringify({ data: order, type: 'placeOrder' })));
  res.end('ok');
});

router.post('/updateOrder', (req, res) => {
  console.log(req.body);
  const orders = db.get('orders').value();
  const order = orders.find(i => i.key.id === req.body.id);

  order.value.productName = req.body.args[1];
  order.value.quantity = req.body.args[2];
  order.value.price = req.body.args[3];
  order.value.destination = req.body.args[4];
  order.value.dueDate = req.body.args[5];
  order.value.paymentDate = req.body.args[6];
  order.value.buyerId = req.body.args[7];
  order.value.totalDue = req.body.args[2] * req.body.args[3];
  order.value.lastUpdated = new Date().getTime();

  db.set('orders', orders).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: order, type: 'updateOrder' })));
  res.end('ok');
});

router.post('/requestShipment', (req, res) => {
  const contracts = db.get('contracts').value();
  const contract = contracts.find(i => i.key.id === req.body.args[1]);

  const shipment = {
    key: { id: uuid() },
    value: {
      state: 1,
      contractId: req.body.args[1],
      shipFrom: req.body.args[2],
      shipTo: req.body.args[3],
      transport: req.body.args[4],
      description: req.body.args[5],
      timestamp: new Date().getTime(),
      lastUpdated: new Date().getTime(),
      dueDate: contract.value.dueDate,
      documents: [],
      events: [
        {
          id: uuid(),
          date: new Date().getTime(),
          action: 'Shipment Requested',
          user: 'Supplier'
        }
      ]
    }
  };
  db.get('shipments')
    .push(shipment)
    .write();

  contract.value.state = 2;

  db.set('contracts', contracts).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: contract, type: 'contractUpdated' })));

  setTimeout(() => {
    clients.forEach(c => c.emit(
      'notification',
      JSON.stringify({ data: shipment, contract, type: 'shipmentRequested' })
    ));
  }, 500);

  res.end('ok');
});

const registerInvoice = (contract) => {
  db.get('invoices')
    .push({
      key: { id: uuid() },
      value: {
        contractId: contract.key.id,
        debtor: 'Buyer',
        beneficiary: 'Supplier',
        totalDue: contract.value.totalDue,
        dueDate: contract.value.dueDate,
        paymentDate: contract.value.paymentDate,
        owner: 'Supplier',
        state: 2,
        timestamp: new Date().getTime(),
        lastUpdated: new Date().getTime()
      }
    })
    .write();
};

router.post('/confirmDelivery', (req, res) => {
  const shipments = db.get('shipments').value();
  const shipment = shipments.find(i => i.key.id === req.body.shipmentId);

  shipment.value.state = 4;
  shipment.value.events.push({
    id: uuid(),
    date: new Date().getTime(),
    action: 'Shipment Delivered',
    user: req.body.user ? capitalize(req.body.user) : 'Buyer'
  });

  db.set('shipments', shipments).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: shipment, type: 'shipmentDelivered' })));

  const contracts = db.get('contracts').value();
  const contract = contracts.find(i => i.key.id === shipment.value.contractId);

  registerInvoice(contract);

  contract.value.state = 3;

  db.set('contracts', contracts).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ contract, type: 'contractCompleted' })));

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: contract, type: 'invoiceRegistered' })));

  res.end('ok');
});

router.post('/confirmShipment', (req, res) => {
  // const shipment = get('shipments', req.body.args[0]);

  const shipments = db.get('shipments').value();
  const shipment = shipments.find(i => i.key.id === req.body.args[0]);

  shipment.value.state = 2;
  shipment.value.events.push({
    id: uuid(),
    action: 'Shipment Confirmed',
    date: new Date().getTime(),
    user: 'Transporter'
  });

  db.set('shipments', shipments).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: shipment, type: 'shipmentConfirmed' })));
  res.end('ok');
});

router.post('/validateProof', (req, res) => {
  const proofs = db.get('proofs').value();

  const proof = proofs.find(i => i.key.id === req.body.args[0]); // get('proofs', req.body.args[0]);

  proof.value.state = 2;
  db.set('proofs', proofs).write();

  const contract = get('contracts', req.body.contractId);
  const report = {
    key: { id: uuid() },
    value: {
      state: 1,
      shipmentId: req.body.shipmentId,
      proofId: proof.key.id,
      description: req.body.description,
      contract,
      factor: req.body.user ? req.body.user.toUpperCase() : 'Auditor',
      consigneeName: contract.value.consigneeName,
      consignorName: contract.value.consignorName,
      timestamp: new Date().getTime(),
      lastUpdated: new Date().getTime()
    }
  };
  db.get('reports')
    .push(report)
    .write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: report, type: 'reportGenerated' })));

  // if (req.body.shipmentId) {
  const shipments = db.get('shipments').value();
  const shipment = shipments.find(i => i.key.id === req.body.shipmentId);

  shipment.value.events.push({
    id: uuid(),
    date: new Date().getTime(),
    action: 'Proof Validated',
    user: req.body.user ? req.body.user.toUpperCase() : 'Auditor'
  });
  db.set('shipments', shipments).write();
  // }

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: proof, shipment, type: 'validateProof' })));

  res.end('ok');
});

router.post('/cancelOrder', async (req, res) => {
  const orders = db.get('orders').value();
  const order = orders.find(i => i.key.id === req.body.args[0]);

  order.value.state = 2;

  db.set('orders', orders).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: order, type: 'cancelOrder' })));
  res.end('ok');
});

router.post('/removeInvoice', async (req, res) => {
  const invoices = db.get('invoices').value();
  const invoice = invoices.find(i => i.key.id === req.body.args[0]);

  invoice.value.state = 5;

  db.set('invoices', invoices).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: invoice, type: 'invoiceRemoved' })));
  res.end('ok');
});

router.post('/acceptOrder', async (req, res) => {
  const orders = db.get('orders').value();
  const order = orders.find(i => i.key.id === req.body.args[0]);

  order.value.state = 1;

  db.set('orders', orders).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: order, type: 'acceptOrder' })));

  const contract = {
    key: {
      id: order.key.id
    },
    value: {
      consignorName: 'Supplier',
      consigneeName: 'Buyer',
      totalDue: order.value.price * order.value.quantity, // FIXME
      price: order.value.price,
      quantity: order.value.quantity,
      dueDate: order.value.dueDate,
      state: 1,
      destination: order.value.destination,
      timestamp: new Date().getTime(),
      paymentDate: order.value.paymentDate,
      productName: order.value.productName,
      lastUpdated: new Date().getTime()
    }
  };

  db.get('contracts')
    .push(contract)
    .write();

  setTimeout(() => {
    clients.forEach(c => c.emit('notification', JSON.stringify({ data: contract, type: 'contractCreated' })));
  }, 500);

  res.end('ok');
});

router.post('/placeInvoice', (req, res) => {
  const invoices = db.get('invoices').value();
  const invoice = invoices.find(i => i.key.id === req.body.args[0]);

  invoice.value.state = 3;

  db.set('invoices', invoices).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: invoice, type: 'placeInvoice' })));
  res.end('ok');
});

router.post('/placeBid', (req, res) => {
  const invoices = db.get('invoices').value();
  const invoice = invoices.find(i => i.key.id === req.body.args[3]);

  const bid = {
    key: { id: uuid() },
    value: {
      factor: req.body.args[2],
      rate: req.body.args[1],
      invoiceID: req.body.args[3],
      totalDue: invoice.value.totalDue,
      paymentDate: invoice.value.paymentDate,
      debtor: invoice.value.debtor,
      beneficiary: invoice.value.beneficiary,
      state: 1,
      timestamp: new Date().getTime(),
      lastUpdated: new Date().getTime()
    }
  };

  db.get('bids')
    .push(bid)
    .write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: bid, type: 'placeBid' })));
  res.end('ok');
});

router.post('/cancelBid', (req, res) => {
  const bids = db.get('bids').value();
  const bid = bids.find(i => i.key.id === req.body.args[0]);

  bid.value.state = 3;

  db.set('bids', bids).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: bid, type: 'cancelBid' })));
  res.end('ok');
});

router.post('/editBid', (req, res) => {
  const bids = db.get('bids').value();
  const bid = bids.find(i => i.key.id === req.body.id);

  bid.value.rate = req.body.args[1];

  db.set('bids', bids).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: bid, type: 'editBid' })));
  res.end('ok');
});

router.post('/acceptBid', (req, res) => {
  const bids = db.get('bids').value();
  const bid = bids.find(i => i.key.id === req.body.id);

  const invoices = db.get('invoices').value();
  const invoice = invoices.find(i => i.key.id === bid.value.invoiceID);

  bid.value.state = 2;
  invoice.value.state = 4;
  invoice.value.owner = capitalize(bid.value.factor);

  db.set('bids', bids).write();
  db.set('invoices', invoices).write();

  clients.forEach(c => c.emit('notification', JSON.stringify({ data: bid, type: 'acceptBid' })));

  try {
    const bidsToCancel = db
      .get('bids')
      .value()
      .filter(i => i.value.invoiceID === bid.value.invoiceID && i.value.state === 1);

    setTimeout(() => {
      bidsToCancel.forEach((i) => {
        i.value.state = 3;
        // clients.forEach(c => c.emit('notification', JSON.stringify({ data: i, type: 'cancelBid' })));
      });
    }, 500);
  } catch (e) {}

  db.set('bids', bids).write();

  res.end('ok');
});

router.post('/acceptInvoice', (req, res) => {
  const invoices = db.get('invoices').value();
  const invoice = invoices.find(i => i.key.id === req.body.args[0]);
  // const invoice = get('invoices', req.body.args[0]);

  invoice.value.state = 2;
  db.set('invoices', invoices).write();
  clients.forEach(c => c.emit('notification', JSON.stringify({ data: invoice, type: 'acceptInvoice' })));
  res.end('ok');
});

app.use(express.static(path.join(__dirname, '../dist/client')));

const html = require('./html');

const renderer = async (req, res) => {
  const data = { role: process.env.ROLE };

  return res.send(html(data));
};

router.use('*', renderer);

app.use(router);

const server = app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});

const io = require('socket.io')(server);

io.on('connection', (client) => {
  clients.push(client);
});
