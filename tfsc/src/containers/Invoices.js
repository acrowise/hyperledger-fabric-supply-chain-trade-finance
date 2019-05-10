import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';
import BidForm from './Forms/Bid';

import { post } from '../helper/api';
import { STATUSES, TABLE_MAP } from '../constants';

import Table from '../components/Table/Table';

const Invoices = ({ role, filter, search }) => {
  const [invoiceBidDialogIsOpen, setInvoiceBidDialogOpenState] = useState({
    isOpen: false,
    action: null
  });

  const [data, loading, setData] = useFetch('listInvoices');

  // BUYER
  const [acceptedInvoiceRes, acceptInvoice] = post('acceptInvoice')();
  // SUPPLIER

  const [forSaleInvoiceRes, placeForTradeInvoice] = post('placeInvoice')();
  const [removeInvoiceRes, removeInvoice] = post('removeInvoice')();
  // const [acceptedBidRes, acceptBid] = post('acceptBid')();
  // const [cancelBidRes, cancelBid] = post('cancelBid')();

  // FACTOR
  // const [editBidRes, editBid] = post('editBid')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'acceptInvoice' || notification.type === 'placeInvoice') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.key.id);
      newState[itemToUpdateIndex].value.state = notification.value.state;
      setData({ result: newState });
    }

    // if (notification.type === 'placeInvoice') {
    //   setData({ result: data.result.concat(notification) });
    // }
  };

  useSocket('notification', onMessage);

  let dataToDisplay = [];
  if (data.result) {
    dataToDisplay = data.result;
  }

  if (filter) {
    dataToDisplay = dataToDisplay.filter(item => STATUSES.INVOICE[item.state] === filter);
  }

  // FIXME:
  dataToDisplay = dataToDisplay.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.INVOICE[i.value.state] }));

  return loading ? (
    <>Loading...</>
  ) : (
    <Table
      fields={TABLE_MAP.INVOICES}
      data={dataToDisplay}
      actions={item => (
        <div>
          {role === 'buyer' && item.state === 'Issued' ? (
            <div className="nowrap">
              <Button
                style={{ marginRight: '5px' }}
                intent="primary"
                onClick={() => {
                  acceptInvoice({
                    fcn: 'acceptInvoice',
                    args: [item.id, '0', '0', '0', '0', '0', '0']
                  });
                }}
              >
                Sign
              </Button>
              <Button intent="danger">Reject</Button>
            </div>
          ) : (
            <></>
          )}
          {role === 'supplier' && item.state === 'Signed' ? (
            <div>
              <Button
                style={{ marginRight: '5px' }}
                intent="primary"
                onClick={() => {
                  placeForTradeInvoice({
                    fcn: 'placeInvoice',
                    args: [
                      item.id,
                      'a', // Buyer Id
                      'b', // SupplierId
                      '123.65', // Total Due,
                      item.dueDate,
                      '0',
                      'b'
                    ]
                  });
                }}
              >
                Place for Trade
              </Button>
              <Button
                style={{ marginRight: '5px' }}
                intent="danger"
                onClick={() => {
                  removeInvoice({
                    fcn: 'removeInvoice',
                    args: [
                      item.id, // InvoiceId
                      '0',
                      '0',
                      '0',
                      '0',
                      '0',
                      '0'
                    ]
                  });
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <></>
          )}
          {(role === 'factor-1' || role === 'factor-2') && item.state === 'For Sale' ? (
            <div>
              <BidForm
                dialogIsOpen={invoiceBidDialogIsOpen}
                setDialogOpenState={setInvoiceBidDialogOpenState}
                invoiceId={item.id}
                role={role}
                rate={item.rate}
              />
              <Button
                style={{ marginRight: '5px' }}
                intent="primary"
                onClick={() => {
                  setInvoiceBidDialogOpenState({
                    isOpen: true,
                    action: 'place'
                  });
                }}
              >
                Place Bid
              </Button>
              <Button
                intent="primary"
                onClick={() => {
                  setInvoiceBidDialogOpenState({
                    isOpen: true,
                    action: 'edit'
                  });
                }}
              >
                Edit Bid
              </Button>
            </div>
          ) : (
            <></>
          )}
          {role === 'supplier' && item.state === 'For Sale' ? (
            <div>
              <Button
                intent="danger"
                onClick={() => {
                  // TODO:
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <></>
          )}
        </div>
      )}
    />
  );
};

Invoices.propTypes = {
  role: PropTypes.string
};

export default Invoices;
