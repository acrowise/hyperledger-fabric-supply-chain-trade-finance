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

export const notifications = {
  generateProof: 'proofs',
  place: 'orders',
  updateOrder: 'orders',
  shipmentRequested: 'shipping documents',
  shipmentConfirmed: 'shipping documents',
  validateProof: 'proofs',
  contractCreated: 'contracts',
  placeInvoice: 'invoices',
  placeInvoiceForTrade: 'invoices',
  placeBid: 'invoices',
  acceptBid: 'invoices',
  acceptInvoice: 'invoices'
};
