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
  // { role: 'Admin', description: 'system administrator' },
  { role: 'Factor-1', description: 'a bank to acquire a debt of buyer' },
  { role: 'Factor-2', description: 'a bank to acquire a debt of buyer' }
];

export const STATUSES = {
  ORDER: {
    0: 'New',
    1: 'Accepted',
    2: 'Cancelled'
  },
  CONTRACT: {
    0: 'Unknown',
    1: 'Signed',
    2: 'Completed'
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
      field: 'shipmentFrom'
    },
    {
      label: 'Ship To',
      placeholder: 'Ship To',
      type: 'text',
      field: 'shipmentTo'
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
      field: 'paymentDay'
    }
  ],
  PLACE_BID: [
    {
      label: 'Rate',
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
    shipmentFrom: 'From',
    shipmentTo: 'To',
    transport: 'Transport',
    state: 'Status'
  },
  CONTRACTS: {
    id: 'Contract ID',
    consignorName: 'Consignor',
    consigneeName: 'Consignee',
    totalDue: 'Total Due',
    paymentDate: 'Payment Date',
    // timestamp: 'Last Updated',
    dueDate: 'Delivery Date',
    destination: 'Destination',
    quantity: 'Quantity',
    state: 'Satus'
  },
  ORDERS: {
    id: 'Order ID',
    productName: 'Name',
    quantity: 'Quantity',
    price: 'Price',
    destination: 'Destination',
    dueDate: 'Delivery Date',
    paymentDate: 'Payment Date',
    state: 'State'
  },
  PROOFS: {
    shipmentId: 'Shipment ID',
    id: 'Proof ID',
    // reportId: 'Report ID',
    state: 'Status'
  },
  BIDS: {
    invoiceID: 'Invoice ID',
    factor: 'Factor',
    rate: 'Rate,%',
    totalDue: 'Amount, USD',
    state: 'Status'
  },
  INVOICES: {
    id: 'Invoice ID',
    debtor: 'Debtor',
    beneficiary: 'Beneficiary',
    totalDue: 'Total',
    dueDate: 'Delivery Date',
    owner: 'Owner',
    state: 'Status'
  },
  REPORTS: {
    shipmentId: 'Shipment ID',
    proofId: 'Proof ID',
    id: 'Report ID',
    state: 'Status'
  },
  SHIPMENT_DETAIL: {
    date: 'Date',
    action: 'Action',
    user: 'User'
  }
};
