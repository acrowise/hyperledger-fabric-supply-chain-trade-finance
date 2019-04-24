import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';
import InvoiceForm from './InvoiceForm';
import PlaceBidForm from './PlaceBidForm';
import { AppToaster } from '../toaster';

import { post } from '../helper/api';

const Invoices = ({ role }) => {
  const [invoiceDialogIsOpen, setInvoiceDialogOpenState] = useState(false);
  const [invoiceBidDialogIsOpen, setInvoiceBidDialogOpenState] = useState(false);
  const [data, loading, setData] = useFetch('invoices');
  // const [notifications, setNotifications] = useState([]);
  const [acceptedInvoice, acceptInvoice] = post('acceptInvoice')();
  const [forSaleInvoice, placeForTradeInvoice] = post('placeInvoiceForTrade')();
  const [acceptedBid, acceptBid] = post('acceptBid')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);
    AppToaster.show({ message: `Invoices: ${notification}` });

    if (notification.type === 'acceptInvoice' || notification.type === 'placeInvoiceForTrade') {
      const newState = data.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.invoiceId === notification.invoiceId);
      newState[itemToUpdateIndex].state = notification.state;
      setData(newState);
      return;
    }

    if (
      notification.type === 'placeInvoiceForTrade'
      || notification.type === 'acceptBid'
      || notification.type === 'placeBid'
    ) {
      const newState = data.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.invoiceId === notification.invoiceId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
      return;
    }
    if (notification.type === 'placeInvoice') {
      console.log('placeInvoice', notification);
      setData(data.concat(notification));
    }
  };

  useSocket('notification', onMessage);

  return loading ? (
    <>Loading...</>
  ) : (
    <div>
      <InvoiceForm
        dialogIsOpen={invoiceDialogIsOpen}
        setDialogOpenState={setInvoiceDialogOpenState}
      />
      {role === 'supplier' ? (
        <Button
          icon="add"
          onClick={() => {
            setInvoiceDialogOpenState(true);
          }}
        >
          New Invoice
        </Button>
      ) : (
        <></>
      )}
      <table className="bp3-html-table .modifier">
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Debtor</th>
            <th>Beneficiary</th>
            <th>Total Due</th>
            <th>Due Date</th>
            <th>Invoice Owner</th>
            <th>Sate</th>
            {role === 'supplier' ? <th>Bid</th> : <></>}
            {role === 'supplier' ? <th>Factor</th> : <></>}
            {role === 'buyer'
            || role === 'supplier'
            || role === 'factor-1'
            || role === 'factor-2' ? (
              <th>Action</th>
              ) : (
              <></>
              )}
          </tr>
        </thead>
        <tbody>
          {data.map(invoice => (
            <tr key={invoice.invoiceId}>
              <td>{invoice.invoiceId}</td>
              <td>{invoice.debtor}</td>
              <td>{invoice.beneficiary}</td>
              <td>{invoice.totalDue}</td>
              <td>{invoice.dueDate}</td>
              <td>{invoice.invoiceOwner}</td>
              <td>{invoice.state}</td>
              {role === 'supplier' && invoice.state === 'For Sale' && invoice.bids ? (
                <>
                  <td style={{ paddingTop: '10px' }}>
                    {Object.keys(invoice.bids).map(i => (
                      <div style={{ paddingTop: '5px' }} key={i.toString()}>
                        {invoice.bids[i].value}
                      </div>
                    ))}
                  </td>
                  <td style={{ paddingTop: '10px' }}>
                    {Object.keys(invoice.bids).map(i => (
                      <div style={{ paddingTop: '5px' }} key={i.toString()}>
                        {invoice.bids[i].factor}
                      </div>
                    ))}
                  </td>
                </>
              ) : (
                <></>
              )}

              {role === 'supplier' && invoice.state === 'Closed' && invoice.bids ? (
                <>
                  <td style={{ paddingTop: '10px' }}>
                    {invoice.value}
                  </td>
                  <td style={{ paddingTop: '10px' }}>
                    {invoice.factor}
                  </td>
                </>
              ) : (
                <></>
              )}

              {role === 'supplier' && invoice.state === 'For Sale' && invoice.bids ? (
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {Object.keys(invoice.bids).map(i => (
                      <Button
                        key={i}
                        // style={{ marginRight: '5px' }}
                        intent="primary"
                        onClick={() => {
                          acceptBid({
                            invoiceId: invoice.invoiceId,
                            bidId: i,
                            factor: invoice.bids[i].factor,
                            value: invoice.bids[i].value
                          });
                        }}
                      >
                        Accept Bid
                      </Button>
                    ))}
                  </div>
                </td>
              ) : (
                <></>
              )}
              {role === 'buyer' && invoice.state === 'Awaiting' ? (
                <td>
                  <div>
                    <Button
                      style={{ marginRight: '5px' }}
                      intent="primary"
                      onClick={() => {
                        acceptInvoice({ invoiceId: invoice.invoiceId });
                      }}
                    >
                      Sign
                    </Button>
                    <Button intent="danger">Reject</Button>
                  </div>
                </td>
              ) : (
                <></>
              )}
              {role === 'supplier' && invoice.state === 'Accepted' ? (
                <td>
                  <div>
                    <Button
                      style={{ marginRight: '5px' }}
                      intent="primary"
                      onClick={() => {
                        placeForTradeInvoice({ invoiceId: invoice.invoiceId });
                      }}
                    >
                      Place for Trade
                    </Button>
                  </div>
                </td>
              ) : (
                <></>
              )}
              {(role === 'factor-1' || role === 'factor-2') && invoice.state === 'For Sale' ? (
                <td>
                  <div>
                    <PlaceBidForm
                      dialogIsOpen={invoiceBidDialogIsOpen}
                      setDialogOpenState={setInvoiceBidDialogOpenState}
                      invoiceId={invoice.invoiceId}
                      role={role}
                    />
                    <Button
                      style={{ marginRight: '5px' }}
                      intent="primary"
                      onClick={() => {
                        setInvoiceBidDialogOpenState(true);
                      }}
                    >
                      Place Bid
                    </Button>
                  </div>
                </td>
              ) : (
                <></>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Invoices.propTypes = {
  role: PropTypes.string
};

export default Invoices;
