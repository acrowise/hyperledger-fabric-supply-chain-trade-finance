import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';
import BidForm from './Forms/Bid';

import { post } from '../helper/api';
import { STATUSES } from '../constants';

const Invoices = ({ role, filter, search }) => {
  const [invoiceBidDialogIsOpen, setInvoiceBidDialogOpenState] = useState({
    isOpen: false,
    action: null
  });

  const [data, loading, setData] = useFetch('listInvoices');
  const [bids, bidsLoading, setBidsData] = useFetch('listBids');

  // BUYER
  const [acceptedInvoiceRes, acceptInvoice] = post('acceptInvoice')();
  // SUPPLIER

  const [forSaleInvoiceRes, placeForTradeInvoice] = post('placeInvoiceForTrade')();
  const [removeInvoiceRes, removeInvoice] = post('removeInvoice')();
  const [acceptedBidRes, acceptBid] = post('acceptBid')();
  const [cancelBidRes, cancelBid] = post('cancelBid')();

  // FACTOR
  const [editBidRes, editBid] = post('editBid')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

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

  let dataToDisplay = [];
  if (data.result) {
    dataToDisplay = data.result;
  }

  if (filter) {
    dataToDisplay = dataToDisplay.concat([]);
    console.log('filter1', filter);
    if (filter) {
      console.log('filter11');
      dataToDisplay = dataToDisplay.filter(item => STATUSES.INVOICE[item.value.state] === filter);
    }
  }

  if (bids.result) {
    if (dataToDisplay.length > 0) {
      const a = dataToDisplay.concat([]);
      bids.result.forEach((bid) => {
        const invoice = a.find(i => i.key.id === bid.value.invoiceID);
        if (invoice) {
          if (!invoice.bids) {
            invoice.bids = [];
          }
          invoice.bids.push(Object.assign({}, bid.value, { bidId: bid.key.id }));
        }
      });
      dataToDisplay = a;
    }
  }

  return loading && bidsLoading ? (
    <>Loading...</>
  ) : (
    <div className="table-wrap">
      <table className="bp3-html-table table ">
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Debtor</th>
            <th>Beneficiary</th>
            <th>Total Due</th>
            <th>Due Date</th>
            <th>Invoice Owner</th>
            <th>Sate</th>
            {role === 'supplier' || role === 'factor-1' || role === 'factor-2' ? (
              <th>Bid</th>
            ) : (
              <></>
            )}
            {role === 'supplier' || role === 'factor-1' || role === 'factor-2' ? (
              <th>Factor</th>
            ) : (
              <></>
            )}
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
              <td>{STATUSES.INVOICE[value.state]}</td>
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
                        {i.factorID}
                      </div>
                    ))}
                  </td>
                </>
              ) : (
                <></>
              )}

              {role === 'supplier'
              || role === 'factor-1'
              || (role === 'factor-2' && value.state === 4 && bids) ? (
                <>
                  <td style={{ paddingTop: '10px' }}>{bids.rate}</td>
                  <td style={{ paddingTop: '10px' }}>{value.factorID}</td>
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
                        acceptInvoice({
                          fcn: 'acceptInvoice',
                          args: [key.id, '0', '0', '0', '0', '0', '0']
                        });
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
                        placeForTradeInvoice({
                          fcn: 'placeInvoice',
                          args: [
                            key.id,
                            'a', // Buyer Id
                            'b', // SupplierId
                            '123.65', // Total Due,
                            value.dueDate.toString(),
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
                            key.id, // InvoiceId
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
                </td>
              ) : (
                <></>
              )}
              {(role === 'factor-1' || role === 'factor-2') && value.state === 3 ? (
                <td>
                  <div>
                    <BidForm
                      dialogIsOpen={invoiceBidDialogIsOpen}
                      setDialogOpenState={setInvoiceBidDialogOpenState}
                      invoiceId={key.id}
                      role={role}
                      rate={value.rate}
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
