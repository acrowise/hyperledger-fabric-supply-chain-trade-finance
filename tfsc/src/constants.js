const CHANNEL = 'common';
const SUPPLY_CHAIN_CHAINCODE = 'supply-chain-chaincode';
const TRADE_FINANCE_CHAINCODE = 'trade-finance-chaincode';

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
    0: 'Unknown',
    1: 'New',
    2: 'Accepted',
    3: 'Cancelled'
  },
  CONTRACT: {
    0: 'Unknown',
    1: 'Signed',
    2: 'Processed',
    3: 'Completed'
  },
  INVOICE: {
    0: 'Unknown',
    1: 'Issued',
    2: 'Signed',
    3: 'For Sale',
    4: 'Sold',
    5: 'Removed'
  },
  SHIPMENT: {
    0: 'Unknown',
    1: 'Requested',
    2: 'Confirmed',
    3: 'Delivered'
  },
  PROOF: {
    0: 'Unknown',
    1: 'Generated',
    2: 'Validated'
  },
  REPORT: {
    0: 'Unknown',
    1: 'Accepted',
    2: 'Declined'
  },
  BID: {
    0: 'Unknown',
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
    id: 'cMSP',
    title: 'Government Goods Control Bureau'
  },
  {
    id: 'dMSP',
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
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'bank']
  },
  {
    ccMethod: 'updateOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'bank']
  },
  {
    ccMethod: 'cancelOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'bank']
  },
  {
    ccMethod: 'acceptOrder',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'bank']
  },
  {
    ccMethod: 'requestShipment',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter']
  },
  {
    ccMethod: 'confirmShipment',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter']
  },
  {
    ccMethod: 'confirmDelivery',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter']
  },
  {
    ccMethod: 'uploadDocument',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'auditor_1', 'auditor_2']
  },
  {
    ccMethod: 'generateProof',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'auditor_1', 'auditor_2']
  },
  {
    ccMethod: 'verifyProof',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'auditor_1', 'auditor_2']
  },
  {
    ccMethod: 'updateProof',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'auditor_1', 'auditor_2']
  },
  {
    ccMethod: 'submitReport',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'acceptInvoice',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'rejectInvoice',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'listOrders',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listContracts',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listProofs',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listProofsByOwner',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listReports',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listShipments',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'getDocument',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'getEventPayload',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'getByQuery',
    chaincode: SUPPLY_CHAIN_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'registerInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'transporter', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'placeInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'removeInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'acceptInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'rejectInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['buyer', 'supplier', 'factor_1', 'factor_2', 'bank']
  },
  {
    ccMethod: 'placeBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['supplier', 'factor_1', 'factor_2']
  },
  {
    ccMethod: 'updateBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['supplier', 'factor_1', 'factor_2']
  },
  {
    ccMethod: 'cancelBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['supplier', 'factor_1', 'factor_2']
  },
  {
    ccMethod: 'acceptBid',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL,
    actors: ['supplier', 'factor_1', 'factor_2']
  },
  {
    ccMethod: 'listInvoices',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listBidsForInvoice',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL
  },
  {
    ccMethod: 'listBids',
    chaincode: TRADE_FINANCE_CHAINCODE,
    channel: CHANNEL
  }
];

const NOTIFICATIONS_TAB = {
  placeOrder: 'orders',
  acceptOrder: 'orders',
  cancelOrder: 'orders',
  editOrder: 'orders',

  requestShipment: 'shipments',
  confirmShipment: 'shipments',
  uploadDocument: 'shipments',
  confirmDelivery: 'shipments',

  verifyProof: 'proofs',
  generateProof: 'proofs',

  contractCreated: 'contracts',
  contractUpdated: 'contracts',
  contractCompleted: 'contracts',

  placeInvoice: 'invoices',
  acceptInvoice: 'invoices',

  updateBid: 'bids',
  placeBid: 'bids',
  acceptBid: 'bids',
  cabcelBid: 'bids',

  invoiceRegistered: 'invoices',
  removeInvoice: 'invoices',

  submitReport: 'reports'
  // submitReport: 'reports'
};

const EVENTS_MAP = {
  placeOrder: 'Order Created',
  acceptOrder: 'Order Accepted',
  cancelOrder: 'Order Cancelled',
  editOrder: 'Order Updated',
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
  contractUpdated: 'Contract Updated'
  // submitReport: 'Report Submitted'
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
    statuses: ['Generated', 'Validated']
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
