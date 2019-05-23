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
    3: 'Approved',
    4: 'Delivered'
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
    id: 'ggcb',
    title: 'Government Goods Control Bureau'
  },
  {
    id: 'uscts',
    title: 'US Commercial Trade Service'
  }
];

export const TABLE_MAP = {
  SHIPMENTS: {
    id: 'Shipment Id',
    contractId: 'Contract ID',
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
    shipmentId: 'Shipment ID',
    consignorName: 'Consignor',
    // reportId: 'Report ID',
    state: 'Status'
  },
  BIDS: {
    invoiceID: 'Invoice ID',
    debtor: 'Debtor',
    beneficiary: 'Beneficiary',
    // factor: 'Factor',
    rate: 'Rate, %',
    totalDue: 'Amount, $',
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
    shipmentId: 'Shipment ID',
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
    apiMethodName: 'placeOrder',
    ccMethodName: 'placeOrder',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: '',
    ccMethodName: 'editOrder',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'cancelOrder',
    ccMethodName: 'cancelOrder',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'acceptOrder',
    ccMethodName: 'acceptOrder',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'requestShipment',
    ccMethodName: 'requestShipment',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'confirmShipment',
    ccMethodName: 'confirmShipment',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'uploadDocuments',
    ccMethodName: 'uploadDocument',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'generateProof',
    ccMethodName: 'generateProof',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'validateProof',
    ccMethodName: 'verifyProof',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: '',
    ccMethodName: 'submitReport',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: '',
    ccMethodName: 'acceptInvoice',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: '',
    ccMethodName: 'rejectInvoice',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'listOrders',
    ccMethodName: 'listOrders',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'listContracts',
    ccMethodName: 'listContracts',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'listProofs',
    ccMethodName: 'listProofs',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'listReports',
    ccMethodName: 'listReports',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'shipments',
    ccMethodName: 'listShipments',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: 'document',
    ccMethodName: 'getDocument',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: '',
    ccMethodName: 'getEventPayload',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  },
  {
    apiMethodName: '',
    ccMethodName: 'getByQuery',
    chaincodeName: 'supply-chain-chaincode',
    channel: 'common'
  }
];
