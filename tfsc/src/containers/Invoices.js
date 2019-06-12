import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import BidForm from './Forms/Bid';

import { post, get } from '../helper/api';
import { STATUSES, TABLE_MAP } from '../constants';
import { filterData } from '../helper/utils';
import notifications from '../helper/notification';

import Table from '../components/Table/Table';
import Loading from '../components/Loading';
import LoadingOverlay from '../components/LoadingOverlay';

const Invoices = ({
  actor, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [bidDialog, setBidDialog] = useState({ isOpen: false });

  const [invoices, invoicesLoading, setData] = get('listInvoices');
  const [bids, bidsLoading, setBids] = get('listBids');

  const [reqPlace, placeForTradeInvoice] = post('placeInvoice')();
  const [reqRemove, removeInvoice] = post('removeInvoice')();

  useSocket('notification', (message) => {
    const notification = JSON.parse(message);
    if (notification.type === 'placeBid') {
      setBids({ result: bids.result.concat(notification.data) });
      return;
    }
    setData(notifications(invoices.result, message, 'invoices'));
  });

  let filteredData = invoices.result;

  if (
    !invoicesLoading
    && !bidsLoading
    && invoices.result
    && bids.result
    && filteredData.length > 0
  ) {
    filteredData.forEach((invoice) => {
      invoice.value.bids = bids.result
        .filter(i => i.value.invoiceID === invoice.key.id)
        .map(i => ({
          id: i.key.id,
          rate: i.value.rate,
          factorID: i.value.factorID,
          state: i.value.state
        }));
    });

    filteredData = filteredData.map(i => Object.assign({}, i.value, {
      id: i.key.id,
      state: STATUSES.INVOICE[i.value.state]
    }));

    if (dataForFilter.length === 0) {
      setDataForFilter(filteredData);
    }

    filteredData = filterData({
      type: 'id',
      status: filter,
      search,
      filterOptions,
      tableData: filteredData
    });
  }

  return invoicesLoading || bidsLoading ? (
    <Loading />
  ) : (
    <>
      <LoadingOverlay req={reqPlace} action="Bid" result="Accepted" />
      <LoadingOverlay req={reqRemove} action="Bid" result="Cancelled" />
      <BidForm dialog={bidDialog} setDialog={setBidDialog} />
      <Table
        fields={TABLE_MAP.INVOICES}
        data={filteredData}
        actions={item => (
          <div>
            {/* {role === 'buyer' && item.state === 'Issued' ? (
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
            )} */}
            {actor.role === 'supplier' && item.state === 'Signed' ? (
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
                        item.totalDue.toString(), // Total Due,
                        item.paymentDate.toString(),
                        '0',
                        'b'
                      ]
                    });
                  }}
                >
                  Place for Trade
                </Button>
              </div>
            ) : (
              <></>
            )}
            {actor.role === 'supplier' && item.state === 'For Sale' ? (
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
            ) : (
              <></>
            )}
            {(actor.role === 'factor 1' || actor.role === 'factor 2')
            && !item.bids.find(i => i.factorID === actor.id)
            && item.state === 'For Sale' ? (
              <div>
                <Button
                  style={{ marginRight: '5px' }}
                  intent="primary"
                  onClick={() => {
                    setBidDialog({
                      isOpen: true,
                      state: { action: 'place', invoiceId: item.id, role: actor.role }
                    });
                  }}
                >
                  Place Bid
                </Button>
              </div>
              ) : (
              <></>
              )}
          </div>
        )}
      />
    </>
  );
};

Invoices.propTypes = {
  actor: PropTypes.object
};

export default Invoices;
