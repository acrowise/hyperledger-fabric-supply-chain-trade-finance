export const actors = [
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
  { role: 'admin', description: 'system administrator' }
];

export const STATUSES = {
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

export const INPUTS = {
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

export const REVIEWERS = [
  {
    id: 'cMSP',
    title: 'Government Goods Control Bureau'
  },
  {
    id: 'dMSP',
    title: 'US Commercial Trade Service'
  }
];

export const TABLE_MAP = {
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

export const METHODS_MAP = [
  {
    ccMethod: 'placeOrder',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'updateOrder',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'cancelOrder',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'acceptOrder',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'requestShipment',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'confirmShipment',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'confirmDelivery',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'uploadDocument',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'generateProof',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'verifyProof',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'updateProof',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'submitReport',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'acceptInvoice',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'rejectInvoice',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listOrders',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listContracts',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listProofs',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listProofsByOwner',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listReports',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listShipments',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'getDocument',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'getEventPayload',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'getByQuery',
    chaincode: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'registerInvoice',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'placeInvoice',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'removeInvoice',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'acceptInvoice',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'rejectInvoice',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'placeBid',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'updateBid',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'cancelBid',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'acceptBid',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listInvoices',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listBidsForInvoice',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  },
  {
    ccMethod: 'listBids',
    chaincode: 'trade-finance-chaincode',
    channel: 'common'
  }
];
