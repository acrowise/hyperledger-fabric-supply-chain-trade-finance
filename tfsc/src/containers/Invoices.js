import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';
import InvoiceForm from './InvoiceForm';
import PlaceBidForm from './PlaceBidForm';
import { AppToaster } from '../toaster';

import { post } from '../helper/api';

const statuses = {
  0: 'Unknown',
  1: 'Issued',
  2: 'Signed',
  3: 'For Sale',
  5: 'Sold',
  6: 'Removed'
};

const Invoices = ({ role }) => {
  const [invoiceDialogIsOpen, setInvoiceDialogOpenState] = useState(false);
  const [invoiceBidDialogIsOpen, setInvoiceBidDialogOpenState] = useState(false);

  const [data, loading, setData] = useFetch('listInvoices', true);
  const [bids, bidsLoading, setBidsData] = useFetch('listBids', true);

  const [dataToDisplay, setDataToDisplay] = useState([]);

  const [acceptedInvoice, acceptInvoice] = post('acceptInvoice')();
  const [forSaleInvoice, placeForTradeInvoice] = post('placeInvoiceForTrade')();
  const [acceptedBid, acceptBid] = post('acceptBid', true)();

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

  if (data.result && bids.result) {
    const a = data.result.concat([]);
    bids.result.forEach((bid) => {
      const invoice = a.find(i => i.key.id === bid.value.invoiceID);
      if (!invoice.bids) {
        invoice.bids = [];
      }
      invoice.bids.push(Object.assign({}, bid.value, { bidId: bid.key.id }));
    });
    setDataToDisplay(a);
    console.log(a);
    setData({});
  }

  return loading && bidsLoading ? (
    <>Loading...</>
  ) : (
    <div>
      <InvoiceForm
        dialogIsOpen={invoiceDialogIsOpen}
        setDialogOpenState={setInvoiceDialogOpenState}
      />
      {/* {role === 'supplier' ? (
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
      )} */}
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
          {dataToDisplay.map(({ key, value, bids }) => (
            <tr key={key.id}>
              <td>{key.id}</td>
              <td>{value.debtor}</td>
              <td>{value.beneficiary}</td>
              <td>{value.totalDue}</td>
              <td>{value.dueDate}</td>
              <td>{value.owner}</td>
              <td>{statuses[value.state]}</td>
              {role === 'supplier' && value.state === 3 && bids ? (
                <>
                  <td style={{ paddingTop: '10px' }}>
                    {bids.map(i => (
                      <div style={{ paddingTop: '5px' }} key={i.bidId}>
                        {i.rate}
                      </div>
                    ))}
                  </td>
                  <td style={{ paddingTop: '10px' }}>
                    {bids.map(i => (
                      <div style={{ paddingTop: '5px' }} key={i.bidId}>
                        {i.factor}
                      </div>
                    ))}
                  </td>
                </>
              ) : (
                <></>
              )}

              {role === 'supplier' && value.state === 4 && bids ? (
                <>
                  <td style={{ paddingTop: '10px' }}>{value.value}</td>
                  <td style={{ paddingTop: '10px' }}>{value.factor}</td>
                </>
              ) : (
                <></>
              )}

              {role === 'supplier' && value.state === 3 && bids ? (
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {bids.map(i => (
                      <Button
                        key={i.bidId}
                        // style={{ marginRight: '5px' }}
                        intent="primary"
                        onClick={() => {
                          // console.log({
                          //   fcn: 'acceptBid',
                          //   args: [i.bidId, '0', '0', '0']
                          // });
                          acceptBid({
                            fcn: 'acceptBid',
                            args: [i.bidId, '0', '0', '0']
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
              {role === 'buyer' && value.state === 1 ? (
                <td>
                  <div>
                    <Button
                      style={{ marginRight: '5px' }}
                      intent="primary"
                      onClick={() => {
                        acceptInvoice({ invoiceId: key.id });
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
              {role === 'supplier' && value.state === 2 ? (
                <td>
                  <div>
                    <Button
                      style={{ marginRight: '5px' }}
                      intent="primary"
                      onClick={() => {
                        placeForTradeInvoice({ invoiceId: key.id });
                      }}
                    >
                      Place for Trade
                    </Button>
                  </div>
                </td>
              ) : (
                <></>
              )}
              {(role === 'factor-1' || role === 'factor-2') && value.state === 3 ? (
                <td>
                  <div>
                    <PlaceBidForm
                      dialogIsOpen={invoiceBidDialogIsOpen}
                      setDialogOpenState={setInvoiceBidDialogOpenState}
                      invoiceId={key.id}
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
