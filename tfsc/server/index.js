const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
// const proxy = require('http-proxy-middleware');
const uuid = require('uuid/v4');
const fs = require('fs');

const upload = multer();

const PORT = process.env.PORT || 3000;
// const API_PORT = process.env.API_PORT || 4002;

const db = {
  orders: [],
  invoices: [],
  bids: [],
  contracts: [],
  shipments: [],
  proofs: [],
  reports: []
};

const get = (field, id) => db[field].find(i => i.key.id === id);

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
//     target: `http://localhost:${API_PORT}`,
//     changeOrigin: true,
//     logLevel: 'debug'
//   })
// );

router.use(bodyParser.json());

router.get('/listProofs', (_, res) => {
  res.json({ result: db.proofs });
});

router.get('/shipments', (_, res) => {
  res.json({ result: db.shipments });
});

router.get('/listContracts', (_, res) => {
  res.json({ result: db.contracts });
});

router.get('/listOrders', (_, res) => {
  res.json({ result: db.orders });
});

router.get('/listInvoices', (_, res) => {
  res.json({ result: db.invoices });
});

router.get('/listBids', (_, res) => {
  res.json({ result: db.bids });
});

router.get('/listReports', (_, res) => {
  res.json({ result: db.reports });
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
    const shipment = db.shipments.find(i => i.value.contractId === doc.contractId);
    shipment.value.documents.push(doc);
    const event = {
      id: uuid(),
      date: new Date().getTime(),
      action: `${req.body.type} uploaded`,
      user: req.body.user,
      type: 'document',
      shipmentId: shipment.key.id
    };
    shipment.value.events.push(event);

    clients.forEach(c => c.emit('notification', JSON.stringify({ data: doc, event, type: 'documentUploaded' })));
  });

  res.end('ok');
});

router.post('/generateProof', (req, res) => {
  const proof = {
    key: { id: uuid() },
    value: {
      state: 1,
      shipmentId: req.body.shipmentId,
      agency: req.body.reviewer,
      fields: req.body.data,
      contract: get('contracts', req.body.contractId)
    }
  };
  const shipment = get('shipments', req.body.shipmentId);
  shipment.value.events.push({
    id: uuid(),
    date: new Date().getTime(),
    action: 'Proof generated',
    user: req.body.user || 'Supplier'
  });
  db.proofs.push(proof);
  clients.forEach(c => c.emit(
    'notification',
    JSON.stringify(Object.assign({ data: proof, shipment, type: 'proofGenerated' }))
  ));
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
      buyerId: req.body.args[7]
    },
    type: 'place'
  };
  db.orders.push(order);
  clients.forEach(c => c.emit('notification', JSON.stringify(order)));
  res.end('ok');
});

router.post('/requestShipment', (req, res) => {
  const shipment = Object.assign(req.body, {
    key: { id: uuid() },
    value: {
      state: 1,
      contractId: req.body.args[1],
      shipmentFrom: req.body.args[2],
      shipmentTo: req.body.args[3],
      transport: req.body.args[4],
      description: req.body.args[5],
      timestamp: new Date().getTime(),
      documents: [],
      events: [
        {
          id: uuid(),
          date: new Date().getTime(),
          action: 'ShipmentRequested',
          user: 'Supplier'
        }
      ]
    }
  });
  db.shipments.push(shipment);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentRequested' }))));
  res.end('ok');
});

const registerInvoice = (contract) => {
  db.invoices.push({
    key: { id: uuid() },
    value: {
      contractId: contract.key.id,
      debtor: 'Buyer',
      beneficiary: 'Supplier',
      totalDue: contract.value.totalDue,
      dueDate: contract.value.dueDate,
      owner: 'Supplier',
      state: 2
    }
  });
};

router.post('/confirmDelivery', (req, res) => {
  const shipment = db.shipments.find(i => i.key.id === req.body.shipmentId);
  shipment.value.state = 4;
  shipment.value.events.push({
    id: uuid(),
    date: new Date().getTime(),
    action: 'Shipment Delivered',
    user: req.body.user || 'Buyer'
  });
  clients.forEach(c => c.emit('notification', JSON.stringify({ data: shipment, type: 'shipmentDelivered' })));

  const contract = db.contracts.find(i => i.key.id === shipment.value.contractId);
  registerInvoice(contract);
  clients.forEach(c => c.emit('notification', JSON.stringify({ data: contract, type: 'invoiceRegistered' })));

  res.end('ok');
});

router.post('/confirmShipment', (req, res) => {
  const shipment = get('shipments', req.body.args[0]);

  shipment.value.state = 2;
  shipment.value.events.push({
    id: uuid(),
    action: 'Shipment Confirmed',
    date: new Date().getTime(),
    user: 'Transporter'
  });
  clients.forEach(c => c.emit('notification', JSON.stringify({ data: shipment, type: 'shipmentConfirmed' })));
  res.end('ok');
});

router.post('/validateProof', (req, res) => {
  const proof = get('proofs', req.body.args[0]);

  proof.value.state = 2;
  clients.forEach(c => c.emit('notification', JSON.stringify({ data: proof, type: 'validateProof' })));

  db.reports.push({
    key: { id: uuid() },
    value: {
      state: 1,
      shipmentId: req.body.shipmentId,
      proofId: proof.key.id,
      description: req.body.description,
      contract: get('contracts', req.body.contractId)
    }
  });
  if (req.body.shipmentId) {
    const shipment = get('shipments', req.body.shipmentId);
    shipment.value.events.push({
      id: uuid(),
      date: new Date().getTime(),
      action: 'Proof Validated',
      user: req.body.user
    });
  }
  res.end('ok');
});

router.post('/acceptOrder', async (req, res) => {
  const order = get('orders', req.body.args[0]);

  order.value.state = 1;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(order, { type: 'acceptOrder' }))));
  const contract = {
    key: {
      id: order.key.id
    },
    value: {
      consignorName: 'Buyer',
      consigneeName: 'Supplier',
      totalDue: order.value.price * order.value.quantity, // FIXME
      quantity: order.value.quantity,
      dueDate: order.value.dueDate,
      state: 1,
      destination: order.value.destination,
      timestamp: new Date().getTime(),
      paymentDate: order.value.paymentDate
    }
  };
  db.contracts.push(contract);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(contract, { type: 'contractCreated' }))));
  res.end('ok');
});

router.post('/placeInvoice', (req, res) => {
  const invoice = get('invoices', req.body.args[0]);

  invoice.value.state = 3;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'placeInvoice' }))));
  res.end('ok');
});

router.post('/placeBid', (req, res) => {
  const invoice = get('invoices', req.body.args[3]);

  const bid = {
    key: { id: uuid() },
    value: {
      factor: req.body.args[2],
      rate: req.body.args[1],
      invoiceID: req.body.args[3],
      totalDue: invoice.value.totalDue,
      dueDate: invoice.value.dueDate,
      debtor: invoice.value.debtor,
      beneficiary: invoice.value.beneficiary,
      state: 1
    }
  };

  db.bids.push(bid);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(bid, { type: 'placeBid' }))));
  res.end('ok');
});

router.post('/acceptBid', (req, res) => {
  const bid = get('bids', req.body.id);

  bid.value.state = 2;

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(bid, { type: 'acceptBid' }))));
  res.end('ok');
});

router.post('/acceptInvoice', (req, res) => {
  const invoice = get('invoices', req.body.args[0]);

  invoice.value.state = 2;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'acceptInvoice' }))));
  res.end('ok');
});

app.use(express.static('./dist/client'));
app.use(router);

const server = app.listen(PORT, () => {
  console.log(`listening on port: ${PORT}`);
});

const io = require('socket.io')(server);

io.on('connection', (client) => {
  clients.push(client);
});
