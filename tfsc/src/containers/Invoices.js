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

const Invoices = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [bidDialog, setBidDialog] = useState({
    isOpen: false
  });

  const [data, loading, setData] = get('listInvoices');

  // BUYER
  const [, acceptInvoice] = post('acceptInvoice')();
  // SUPPLIER

  const [, placeForTradeInvoice] = post('placeInvoice')();
  const [, removeInvoice] = post('removeInvoice')();

  useSocket('notification', (message) => {
    setData(notifications(data.result, message, 'invoices'));
  });

  let filteredData = data.result;

  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.INVOICE[i.value.state] }));

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

  return loading ? (
    <Loading />
  ) : (
    <>
      <BidForm dialog={bidDialog} setDialog={setBidDialog} />
      <Table
        fields={TABLE_MAP.INVOICES}
        data={filteredData}
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
              </div>
            ) : (
              <></>
            )}
            {role === 'supplier' && item.state === 'For Sale' ? (
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
            {(role === 'factor 1' || role === 'factor 2') && item.state === 'For Sale' ? (
              <div>
                <Button
                  style={{ marginRight: '5px' }}
                  intent="primary"
                  onClick={() => {
                    setBidDialog({
                      isOpen: true,
                      state: { action: 'place', invoiceId: item.id, role }
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
  role: PropTypes.string
};

export default Invoices;
