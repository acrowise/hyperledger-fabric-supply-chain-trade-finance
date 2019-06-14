const SUPPLY_CHAIN_CHAINCODE = 'supply-chain-chaincode';
const TRADE_FINANCE_CHAINCODE = 'trade-finance-chaincode';
const STATUS_UNKNOWN = 'Unknown';

const actors = [
  { role: 'Buyer', description: 'an organization which orders and purchases goods' },
  {
    role: 'Supplier',
    description:
      ' an organization to provide goods and consequentially issue an invoice and organize transportation flow'
  },
  {
    role: 'Transporter',
    description:
      'a company which transports goods and provides the necessary documents regarding the transportation'
  },
  {
    role: 'GGCB',
    description: 'Government Goods Control Bureau (GGCB)'
  },
  {
    role: 'USCTS',
    description: 'US Commercial Trade Service (USCTS)'
  },
  { role: 'Factor 1', description: 'a bank to acquire a debt of buyer' },
  { role: 'Factor 2', description: 'a bank to acquire a debt of buyer' },
  { role: 'Bank', description: 'bank' }
];

const STATUSES = {
  ORDER: {
    0: STATUS_UNKNOWN,
    1: 'New',
    2: 'Accepted',
    3: 'Cancelled'
  },
  CONTRACT: {
    0: STATUS_UNKNOWN,
    1: 'Signed',
    2: 'Processed',
    3: 'Completed'
  },
  INVOICE: {
    0: STATUS_UNKNOWN,
    1: 'Issued',
    2: 'Signed',
    3: 'For Sale',
    4: 'Sold',
    5: 'Removed'
  },
  SHIPMENT: {
    0: STATUS_UNKNOWN,
    1: 'Requested',
    2: 'Confirmed',
    3: 'Delivered'
  },
  PROOF: {
    0: STATUS_UNKNOWN,
    1: 'Generated',
    2: 'Validated',
    3: 'Updated',
    4: 'Declined'
  },
  REPORT: {
    0: STATUS_UNKNOWN,
    1: 'Accepted',
    2: 'Declined'
  },
  BID: {
    0: STATUS_UNKNOWN,
    1: 'Issued',
    2: 'Accepted',
    3: 'Cancelled',
    4: 'Removed'
  }
};

const INPUTS = {
  NEW_PURCHASE_ORDER: [
    {
      label: 'Product Name',
      placeholder: 'Product Name',
      type: 'text',
      field: 'productName'
    },
    {
      label: 'Quantity',
      placeholder: 'Quantity',
      type: 'number',
      field: 'quantity'
    },
    {
      label: 'Price',
      placeholder: 'Price',
      type: 'number',
      field: 'price'
    },

    {
      label: 'Destination',
      placeholder: 'Destination',
      type: 'text',
      field: 'destination'
    }
  ],
  TRANSPORT_REQUEST: [
    {
      label: 'Ship From',
      placeholder: 'Ship From',
      type: 'text',
      field: 'shipFrom'
    },
    {
      label: 'Ship To',
      placeholder: 'Ship To',
      type: 'text',
      field: 'shipTo'
    },
    {
      label: 'Transport',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'transport'
    }
  ],
  GENERATE_PROOF: [
    {
      label: 'Contract ID',
      field: 'contractId'
    },
    {
      label: 'Consignor Name',
      field: 'consignorName'
    },
    {
      label: 'Consignee Name',
      field: 'consigneeName'
    },
    {
      label: 'Total Due',
      field: 'totalDue'
    },
    {
      label: 'Quantity',
      field: 'quantity'
    },
    {
      label: 'Destination',
      field: 'destination'
    },
    {
      label: 'Delivery Date',
      field: 'dueDate'
    },
    {
      label: 'Payment Date',
      field: 'paymentDate'
    },
    {
      label: 'Product Name',
      field: 'productName'
    }
  ],
  PLACE_BID: [
    {
      label: 'Rate, %',
      placeholder: 'Rate',
      type: 'number',
      field: 'rate'
    }
  ]
};

const REVIEWERS = [
  {
    id: 'Auditor-1',
    title: 'Government Goods Control Bureau'
  },
  {
    id: 'Auditor-2',
    title: 'US Commercial Trade Service'
  }
];

const TABLE_MAP = {
  SHIPMENTS: {
    id: 'Shipment Id',
    contractID: 'Contract ID',
    shipFrom: 'From',
    shipTo: 'To',
    transport: 'Transport',
    state: 'Status'
  },
  CONTRACTS: {
    id: 'Contract ID',
    consignorName: 'Consignor',
    consigneeName: 'Consignee',
    productName: 'Product',
    quantity: 'Quantity',
    price: 'Price, $',
    totalDue: 'Amount, $',
    // timestamp: 'Last Updated',
    destination: 'Destination',
    dueDate: 'Delivery Date',
    paymentDate: 'Payment Date',
    state: 'Status'
  },
  ORDERS: {
    id: 'Order ID',
    productName: 'Product',
    quantity: 'Quantity',
    price: 'Price, $',
    amount: 'Amount, $',
    destination: 'Destination',
    dueDate: 'Delivery Date',
    paymentDate: 'Payment Date',
    state: 'Status'
  },
  PROOFS: {
    id: 'Proof ID',
    shipmentID: 'Shipment ID',
    consignorName: 'Consignor',
    // reportId: 'Report ID',
    state: 'Status'
  },
  BIDS: {
    invoiceID: 'Invoice ID',
    debtor: 'Debtor',
    beneficiary: 'Beneficiary',
    // factorID: 'Factor',
    rate: 'Rate, %',
    amount: 'Amount, $',
    paymentDate: 'Payment Date',
    state: 'Status'
  },
  INVOICES: {
    id: 'Invoice ID',
    debtor: 'Debtor',
    beneficiary: 'Beneficiary',
    totalDue: 'Amount, $',
    paymentDate: 'Payment Date',
    owner: 'Owner',
    state: 'Status'
  },
  REPORTS: {
    id: 'Report ID',
    proofId: 'Proof ID',
    consignorName: 'Consignor',
    shipmentID: 'Shipment ID',
    state: 'Status'
  },
  SHIPMENT_DETAIL: {
    date: 'Date',
    action: 'Action',
    user: 'User'
  }
};

const METHODS_MAP = [
  {
    ccMethod: 'placeOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Bank']
  },
  {
    ccMethod: 'updateOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Bank']
  },
  {
    ccMethod: 'cancelOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Bank']
  },
  {
    ccMethod: 'acceptOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Bank']
  },
  {
    ccMethod: 'requestShipment',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter']
  },
  {
    ccMethod: 'confirmShipment',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter']
  },
  {
    ccMethod: 'confirmDelivery',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter']
  },
  {
    ccMethod: 'uploadDocument',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter']
  },
  {
    ccMethod: 'generateProof',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Auditor-1', 'Auditor-2']
  },
  {
    ccMethod: 'verifyProof',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Auditor-1', 'Auditor-2']
  },
  {
    ccMethod: 'updateProof',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Auditor-1', 'Auditor-2']
  },
  {
    ccMethod: 'submitReport',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Auditor-1', 'Auditor-2']
  },
  {
    ccMethod: 'acceptInvoice',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'rejectInvoice',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'listOrders',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listContracts',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listProofs',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listProofsByShipment',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listProofsByOwner',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listReports',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listReportsByShipment',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'listShipments',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'getDocument',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'getEventPayload',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'getByQuery',
    chaincode: SUPPLY_CHAIN_CHAINCODE
  },
  {
    ccMethod: 'updateReport',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Auditor-1', 'Auditor-2']
  },
  {
    ccMethod: 'registerInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Transporter', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'placeInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'removeInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'acceptInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'rejectInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Buyer', 'Supplier', 'Factor-1', 'Factor-2', 'Bank']
  },
  {
    ccMethod: 'placeBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Supplier', 'Factor-1', 'Factor-2']
  },
  {
    ccMethod: 'updateBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Supplier', 'Factor-1', 'Factor-2']
  },
  {
    ccMethod: 'cancelBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Supplier', 'Factor-1', 'Factor-2']
  },
  {
    ccMethod: 'acceptBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    actors: ['Supplier', 'Factor-1', 'Factor-2']
  },
  {
    ccMethod: 'listInvoices',
    chaincode: TRADE_FINANCE_CHAINCODE
  },
  {
    ccMethod: 'listBidsForInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE
  },
  {
    ccMethod: 'listBids',
    chaincode: TRADE_FINANCE_CHAINCODE
  }
].map(i => Object.assign(i, { channel: 'common' }));

const NOTIFICATIONS_TAB = {
  placeOrder: 'orders',
  acceptOrder: 'orders',
  cancelOrder: 'orders',
  updateOrder: 'orders',

  requestShipment: 'shipments',
  confirmShipment: 'shipments',
  uploadDocument: 'shipments',
  confirmDelivery: 'shipments',

  verifyProof: 'proofs',
  generateProof: 'proofs',
  updateProof: 'proofs',

  contractCreated: 'contracts',
  contractUpdated: 'contracts',
  contractCompleted: 'contracts',

  placeInvoice: 'invoices',
  acceptInvoice: 'invoices',

  updateBid: 'bids',
  placeBid: 'bids',
  acceptBid: 'bids',
  cabcelBid: 'bids',

  registerInvoice: 'Invoice Registered',
  removeInvoice: 'invoices',

  submitReport: 'reports'
  // submitReport: 'reports'
};

const EVENTS_MAP = {
  placeOrder: 'Order Created',
  acceptOrder: 'Order Accepted',
  cancelOrder: 'Order Cancelled',
  updateOrder: 'Order Updated',
  requestShipment: 'Shipment Requested',
  confirmShipment: 'Shipment Confirmed',
  confirmDelivery: 'Shipment Delivered',
  verifyProof: 'Proof Validated',
  generateProof: 'Proof Generated',
  contractCreated: 'Contract Created',
  acceptInvoice: 'Invoice Accepted',
  placeBid: 'Bid Placed',
  acceptBid: 'Bid Accepted',
  updateBid: 'Bid Updated',
  uploadDocument: 'Document Uploaded',
  invoiceRegistered: 'Invoice Registered',
  cancelBid: 'Bid Cancelled',
  placeInvoice: 'Invoice Signed',
  submitReport: 'Report Created',
  removeInvoice: 'Invoice Removed',
  contractCompleted: 'Contract Completed',
  contractUpdated: 'Contract Updated',
  registerInvoice: 'Invoice Registered',
  updateProof: 'Proof Updated',
  updateReport: 'Report Updated'
};

const FILTERS = {
  orders: {
    filterBy: ['totalDue', 'destination', 'dueDate', 'paymentDate'],
    statuses: ['New', 'Accepted', 'Cancelled']
  },
  contracts: {
    filterBy: ['consignorName', 'consigneeName', 'totalDue', 'dueDate', 'paymentDate'],
    statuses: ['Signed', 'Processed', 'Completed']
  },
  invoices: {
    filterBy: ['debtor', 'beneficiary', 'paymentDate', 'owner'],
    statuses: ['Issued', 'Signed', 'For Sale', 'Sold', 'Removed']
  },
  shipments: {
    filterBy: ['shipFrom', 'shipTo', 'transport'],
    statuses: ['Requested', 'Confirmed', 'Delivered']
  },
  proofs: {
    filterBy: ['consignorName', 'shipmentID'],
    statuses: ['Generated', 'Validated', 'Updated']
  },
  reports: {
    filterBy: ['consignorName', 'shipmentID'],
    statuses: ['Accepted', 'Declined']
  },
  bids: {
    filterBy: ['debtor', 'beneficiary', 'rate', 'paymentDate'],
    statuses: ['Issued', 'Accepted', 'Cancelled', 'Removed']
  }
};

module.exports = {
  actors,
  REVIEWERS,
  STATUSES,
  INPUTS,
  TABLE_MAP,
  METHODS_MAP,
  SUPPLY_CHAIN_CHAINCODE,
  TRADE_FINANCE_CHAINCODE,
  EVENTS_MAP,
  NOTIFICATIONS_TAB,
  FILTERS
};
