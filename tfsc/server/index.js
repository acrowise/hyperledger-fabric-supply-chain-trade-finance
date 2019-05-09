const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nanoid = require('nanoid');
const multer = require('multer');
const proxy = require('http-proxy-middleware');
const axios = require('axios');
const uuid = require('uuid/v4');

const upload = multer();

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 4002;

const ORDERS = {
  result: []
};

const INVOICES = { result: [] };
const BIDS = { result: [] };
const CONTRACTS = { result: [] };
const SHIPMENTS = { result: [] };
const PROOFS = { result: [] };
// {
//   reportId: 'FDDSA',
//   shipmentId: 'GSNJF',
//   ProofId: 'MCDSEDF',
//   state: 'Generated',
//   contractId: 'contract-id',
//   consignore: 'Buyer',
//   consignee: 'Supplier',
//   documents: ['Phytosanitory certificate', 'Export License', 'Packing List']
// },
// {
//   reportId: 'ASDADSA',
//   shipmentId: 'LLDSF',
//   ProofId: 'KDSAD',
//   state: 'Validated',
//   contractId: 'contract-id',
//   consignore: 'Buyer',
//   consignee: 'Supplier',
//   documents: ['Phytosanitory certificate', 'Export License', 'Packing List']
// }
const DOCS = [];
const REPORTS = {
  result: [
    // {
    //   reportId: 'FDDSA',
    //   shipmentId: 'GSNJF',
    //   ProofId: 'MCDSEDF',
    //   state: 'Generated'
    // },
    // {
    //   reportId: 'ASDADSA',
    //   shipmentId: 'LLDSF',
    //   ProofId: 'KDSAD',
    //   state: 'Validated'
    // }
  ]
};

const clients = [];
const app = express();
const router = express.Router();

router.use(cors());

router.use((_, __, next) => {
  setTimeout(() => {
    next();
  }, 850);
});

router.use(
  '/api',
  proxy({
    target: `http://localhost:${API_PORT}`,
    changeOrigin: true,
    logLevel: 'debug'
  })
);

router.use(bodyParser.json());

router.get('/listProofs', (_, res) => {
  res.json(PROOFS);
});

router.get('/shipments', (_, res) => {
  res.json(SHIPMENTS);
});

router.get('/listContracts', (_, res) => {
  res.json(CONTRACTS);
});

router.get('/listOrders', (_, res) => {
  res.json(ORDERS);
});

router.get('/listInvoices', (_, res) => {
  res.json(INVOICES);
});

router.get('/listBids', (_, res) => {
  res.json(BIDS);
});

router.get('/listReports', (_, res) => {
  res.json(REPORTS);
});

router.post('/uploadDocuments', upload.array('file'), (req, res) => {
  const { files } = req;

  files.forEach(f => DOCS.push(f.originalname));

  if (req.body.shipmentId) {
    const shipment = SHIPMENTS.result.find(i => i.key.id === req.body.shipmentId);
    shipment.value.documents.concat(DOCS);
    shipment.value.events.push({
      id: uuid(),
      date: new Date().getTime(),
      action: 'uploadDocument',
      user: req.body.user
    });
  }

  res.end('ok');
});

router.get('/documents', (req, res) => {
  res.json(DOCS);
});

router.post('/generateProof', (req, res) => {
  const id = uuid();
  const proof = {
    key: { id },
    value: {
      state: 1,
      dateCreated: new Date().getTime(),
      agency: req.body.reviewer,
      fields: req.body.data
    }
  };
  if (req.body.shipmentId) {
    const shipment = SHIPMENTS.result.find(i => i.key.id === req.body.shipmentId);
    shipment.value.events.push({
      id: uuid(),
      date: new Date().getTime(),
      action: 'generateProof',
      user: req.body.user
    });
  }
  PROOFS.result.push(proof);
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(proof, { type: 'generateProof' }))));
  res.end('ok');
});

router.post('/placeOrder', (req, res) => {
  const id = uuid();
  const order = {
    key: {
      id
    },
    value: {
      state: 0,
      dateCreated: new Date().getTime(),
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
  ORDERS.result.push(order);
  res.send('ok');
  clients.forEach(c => c.emit('notification', JSON.stringify(order)));
});

router.post('/requestShipment', (req, res) => {
  const id = uuid();

  const shipment = Object.assign(req.body, {
    key: {
      id
    },
    value: {
      state: 1,
      contractId: req.body.args[1],
      shipmentFrom: req.body.args[2],
      shipmentTo: req.body.args[3],
      transport: req.body.args[4],
      description: req.body.args[5],
      documents: [
        'Packing list',
        'Phytosanitory certificate',
        'Commercial Invoices',
        'Certificate of origin',
        'Bill of Landing',
        'Export License'
      ],
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
  SHIPMENTS.result.push(shipment);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentRequested' }))));
  res.end('ok');
});

router.post('/confirmDelivery', (req, res) => {
  const id = nanoid();
  const newInvoice = Object.assign(req.body, { state: 2 });

  INVOICES.result.push({
    key: {
      id
    },
    value: newInvoice
  });

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(newInvoice, { type: 'placeInvoice' }))));

  const shipment = SHIPMENTS.result.find(i => i.key.id === req.body.shipmentId);
  shipment.value.state = 4;
  shipment.value.events.push({
    id: uuid(),
    date: new Date().getTime(),
    action: 'generateProof',
    user: req.body.user
  });
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentDelivered' }))));

  res.send('ok');
});

router.post('/confirmShipment', (req, res) => {
  const shipment = SHIPMENTS.result.find(i => i.key.id === req.body.args[0]);

  shipment.value.state = 2;
  shipment.value.events.push({
    id: uuid(),
    action: 'ShipmentConfirmed',
    date: new Date().getTime(),
    user: 'Transporter'
  });
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentConfirmed' }))));
  res.end('ok');
});

router.post('/validateProof', (req, res) => {
  const proof = PROOFS.result.find(i => i.key.id === req.body.args[0]);

  proof.value.state = 2;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(proof, { type: 'validateProof' }))));

  REPORTS.result.push({
    key: {
      id: uuid()
    },
    value: {
      shipmentId: '',
      proofId: proof.id,
      contractId: '',
      consignee: '',
      consignor: '',
      state: 1,
      description: req.body.description
    }
  });
  // if (req.body.shipmentId) {
  //   const shipment = SHIPMENTS.result.find(i => i.key.id === req.body.shipmentId);
  //   shipment.value.events.push({
  //     id: uuid(),
  //     date: new Date().getTime(),
  //     action: 'validateProof',
  //     user: req.body.user
  //   });
  // }
  res.end('ok');
});

const registerInvoice = ({ totalDue, dueDate }) => {
  const id = uuid();
  INVOICES.result.push({
    key: { id },
    value: {
      debtor: 'a',
      beneficiary: 'b',
      totalDue,
      dueDate,
      owner: 'b',
      state: 1
    }
  });
};

router.post('/acceptOrder', async (req, res) => {
  const order = ORDERS.result.find(i => i.key.id === req.body.args[0]);

  order.value.state = 1;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(order, { type: 'acceptOrder' }))));
  const contract = {
    key: {
      id: order.key.id
    },
    value: {
      consignorName: 'Buyer',
      consigneeName: 'Supplier',
      totalDue: '123', // FIXME
      quantity: order.value.quantity,
      dueDate: order.value.paymentDate,
      state: 1,
      destination: order.value.destination,
      dateCreated: new Date().getTime(),
      timestamp: new Date().getTime(),
      documents: ['dasasd', 'asdas', 'asdasd']
    }
  };

  registerInvoice(contract);

  // try {
  //   const result = await axios.post(
  //     'http://localhost:4002/api/channels/common/chaincodes/trade-finance-chaincode',
  //     {
  //       fcn: 'registerInvoice',
  //       args: [
  //         order.orderId, // contractId
  //         'a',
  //         'b',
  //         contract.totalDue,
  //         contract.dueDate,
  //         '0',
  //         'b'
  //       ]
  //     }
  //   );
  //   console.log(result.data);
  // } catch (e) {
  //   console.error(e);
  // }

  CONTRACTS.result.push(contract);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(contract, { type: 'contractCreated' }))));
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(contract, { type: 'invoiceRegistered' }))));
  res.send('ok');
});

router.post('/placeInvoice', (req, res) => {
  res.send('ok');

  const invoice = INVOICES.result.find(i => i.key.id === req.body.args[0]);

  invoice.value.state = 3;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'placeInvoice' }))));
});

router.post('/placeBid', (req, res) => {
  res.send('ok');
  const id = nanoid();

  const bid = {
    id,
    factor: req.body.args[2],
    rate: req.body.args[1],
    invoiceID: req.body.args[3]
  };

  BIDS.result.push(bid);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(bid, { type: 'placeBid' }))));
});

router.post('/acceptBid', (req, res) => {
  res.send('ok');
  const bid = BIDS.result.find(i => i.id === req.body.id);

  bid.state = 'Closed';

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(bid, { type: 'acceptBid' }))));
});

router.post('/acceptInvoice', (req, res) => {
  res.send('ok');

  const invoice = INVOICES.result.find(i => i.key.id === req.body.args[0]);

  invoice.value.state = 2;
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'acceptInvoice' }))));
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
