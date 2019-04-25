const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nanoid = require('nanoid');
const multer = require('multer');

const upload = multer();

const PORT = 3000;

const ORDERS = [];
const INVOICES = [];
const CONTRACTS = [];
const SHIPMENTS = [];
const PROOFS = [];
const DOCS = [];

const clients = [];
const app = express();
const router = express.Router();

router.use(bodyParser.json());
router.use(cors());

router.get('/proofs', (_, res) => {
  res.json(PROOFS);
});

router.get('/shipments', (_, res) => {
  res.json(SHIPMENTS);
});

router.get('/contracts', (_, res) => {
  res.json(CONTRACTS);
});

router.get('/orders', (_, res) => {
  res.json(ORDERS);
});

router.get('/invoices', (_, res) => {
  res.json(INVOICES);
});

router.post('/uploadDocuments', upload.array('file'), (req, res) => {
  const { files } = req;

  files.forEach(f => DOCS.push(f.originalname));
  res.send('ok');
});

router.get('/documents', (req, res) => {
  setTimeout(() => {
    res.json(DOCS);
  }, 700);
});

router.post('/generateProof', (req, res) => {
  const id = nanoid();
  const proof = Object.assign(req.body, {
    state: 'Generated',
    proofId: id,
    dateCreated: new Date().toISOString()
  });
  PROOFS.push(proof);
  res.send('ok');
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(proof, { type: 'generateProof' }))));
});

router.post('/placeOrder', (req, res) => {
  setTimeout(() => {
    const id = nanoid();
    const order = Object.assign(req.body, {
      orderId: id,
      state: 'New',
      type: 'place',
      dateCreated: new Date().toISOString()
    });
    ORDERS.push(order);
    res.send('ok');
    clients.forEach(c => c.emit('notification', JSON.stringify(order)));
  }, 500);
});

router.post('/requestShipment', (req, res) => {
  const id = nanoid();
  res.send('ok');

  const shipment = Object.assign(req.body, {
    shipmentId: id,
    contractId: req.body.contractId,
    state: 'Requested',
    documents: [
      'Packing list',
      'Phytosanitory certificate',
      'Commercial Invoices',
      'Certificate of origin',
      'Bill of Landing',
      'Export License'
    ]
  });
  SHIPMENTS.push(shipment);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentRequested' }))));
});

router.post('/confirmShipment', (req, res) => {
  res.send('ok');
  const shipment = SHIPMENTS.find(i => i.shipmentId === req.body.shipmentId);

  shipment.state = 'Confirmed';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(shipment, { type: 'shipmentConfirmed' }))));
});

router.post('/validateProof', (req, res) => {
  res.send('ok');
  const proof = PROOFS.find(i => i.proofId === req.body.proofId);

  proof.state = 'Validated';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(proof, { type: 'validateProof' }))));
});

router.post('/updateOrder', (req, res) => {
  res.send('ok');
  const order = ORDERS.find(i => i.orderId === req.body.orderId);

  order.state = 'Accepted';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(order, { type: 'updateOrder' }))));
  const contract = {
    contractId: order.orderId,
    consignorName: 'Buyer',
    consigneeName: 'Supplier',
    totalDue: 'total_due',
    quantity: order.quantity,
    dueDate: 'due_date',
    state: 'New',
    destinationPort: order.destinationPort,
    dateCreated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    documents: 'documents hashes'
  };
  CONTRACTS.push(contract);

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(contract, { type: 'contractCreated' }))));
});

router.post('/placeInvoice', (req, res) => {
  const id = nanoid();
  const newInvoice = Object.assign(req.body, { invoiceId: id, state: 'Awaiting' });
  res.send('ok');

  INVOICES.push(newInvoice);
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(newInvoice, { type: 'placeInvoice' }))));
});

router.post('/placeInvoiceForTrade', (req, res) => {
  res.send('ok');

  const invoice = INVOICES.find(i => i.invoiceId === req.body.invoiceId);

  invoice.state = 'For Sale';
  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'placeInvoiceForTrade' }))));
});

router.post('/placeBid', (req, res) => {
  res.send('ok');
  const id = nanoid();
  const invoice = INVOICES.find(i => i.invoiceId === req.body.invoiceId);

  if (!invoice.bids) {
    invoice.bids = {};
  }
  invoice.bids[id] = {
    factor: req.body.role,
    value: req.body.value
  };

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'placeBid' }))));
});

router.post('/acceptBid', (req, res) => {
  res.send('ok');
  const id = nanoid();
  const invoice = INVOICES.find(i => i.invoiceId === req.body.invoiceId);

  if (!invoice.bids) {
    invoice.bids = {};
  }
  invoice.bids[req.body.role] = req.body.value;
  invoice.state = 'Closed';
  invoice.factor = req.body.factor;
  invoice.value = req.body.value;

  clients.forEach(c => c.emit('notification', JSON.stringify(Object.assign(invoice, { type: 'acceptBid', id }))));
});

router.post('/acceptInvoice', (req, res) => {
  res.send('ok');

  const invoice = INVOICES.find(i => i.invoiceId === req.body.invoiceId);

  invoice.state = 'Accepted';
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
