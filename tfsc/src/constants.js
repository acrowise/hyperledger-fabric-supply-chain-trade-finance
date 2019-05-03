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
  INVOICE: {
    0: 'Unknown',
    1: 'Issued',
    2: 'Signed',
    3: 'For Sale',
    4: 'Sold',
    5: 'Removed'
  }
};

export const INPUTS = {
  NEW_PURCHASE_ORDER: [
    {
      label: 'Product Name',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'productName'
    },
    {
      label: 'Price',
      placeholder: 'Placeholder text',
      type: 'number',
      field: 'price'
    },
    {
      label: 'Quantity',
      placeholder: 'Placeholder text',
      type: 'number',
      field: 'quantity'
    },
    {
      label: 'Destination',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'destination'
    }
  ],
  TRANSPORT_REQUEST: [
    {
      label: 'Ship From',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'shipFrom'
    },
    {
      label: 'Ship To',
      placeholder: 'Placeholder text',
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
      label: 'Contract_Id',
      field: 'contractId'
    },
    {
      label: 'Consignor_Name',
      field: 'consignorName'
    },
    {
      label: 'Total_Due',
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
      label: 'Due_Date',
      field: 'dueDate'
    },
    {
      label: 'Payment_Date',
      field: 'paymentDay'
    },
    {
      label: 'doc1',
      field: 'doc'
    }
  ],
  PLACE_BID: [
    {
      label: 'Bid Value',
      placeholder: 'Placeholder text',
      type: 'number',
      field: 'rate'
    }
  ]
};

export const REVIEWERS = [
  {
    id: 'agency-1',
    title: 'Government Goods Control Bureau'
  },
  {
    id: 'agency-2',
    title: 'US Commercial Trade Service'
  }
];

export const TABLE_MAP = {
  SHIPMENTS: {
    shipmentId: 'Shipment Id',
    contractId: 'Contract ID',
    shipFrom: 'From',
    shipTo: 'To',
    transport: 'Transport',
    state: 'Status'
  },
  CONTRACTS: {
    contractId: 'Contract ID',
    consignorName: 'Consignor',
    consigneeName: 'Consignee',
    totalDue: 'Total Due',
    dateCreated: 'Date Created',
    lastUpdated: 'Last Updated',
    dueDate: 'Due Date',
    destination: 'Destination',
    quantity: 'Quantity',
    state: 'Satus'
  },
  ORDERS: {
    orderId: 'Order ID',
    productName: 'Name',
    quantity: 'Quantity',
    price: 'Price',
    destination: 'Destination',
    dueDate: 'Due Date',
    dateCreated: 'Date Created',
    state: 'State'
  },
  PROOFS: {
    shipmentId: 'Shipment ID',
    proofId: 'Proof ID',
    reportId: 'Report ID',
    state: 'Status'
  },
  BIDS: {
    invoiceId: 'Invoice ID',
    debtor: 'Debtor',
    factor: 'Factor ID',
    rate: 'Rate',
    totalDue: 'Total',
    state: 'Status'
  },
  INVOICES: {
    id: 'Invoice ID',
    debtor: 'Debtor',
    beneficiary: 'Beneficiary',
    totalDue: 'Total',
    dueDate: 'Due Date',
    state: 'Status',
    owner: 'Owner'
  },
  REPORTS: {
    shipmentId: 'Shipment ID',
    proofId: 'Proof ID',
    reportId: 'Report ID',
    state: 'Status'
  }
};
