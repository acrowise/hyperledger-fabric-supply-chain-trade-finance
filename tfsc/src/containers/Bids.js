import React, { useState } from 'react';

import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';

import { post, get } from '../helper/api';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';
import { filterData } from '../helper/utils';

import BidForm from './Forms/Bid';
import Loading from '../components/Loading';
import notifications from '../helper/notification';

import LoadingOverlay from '../components/LoadingOverlay';

const Bids = ({
  actor, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [data, loading, setData] = get('listBids');
  const [reqAccept, acceptBid] = post('acceptBid')();
  const [reqCancel, cancelBid] = post('cancelBid')();

  useSocket('notification', (message) => {
    setData(notifications(data.result, message, 'bids'));
  });

  let filteredData = data.result;

  const [dialog, setDialog] = useState({
    isOpen: false,
    state: null
  });

  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.BID[i.value.state] }));

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
      <LoadingOverlay req={reqAccept} action="Bid" result="Accepted" />
      <LoadingOverlay req={reqCancel} action="Bid" result="Cancelled" />
      <BidForm dialog={dialog} setDialog={setDialog} />
      <Table
        fields={
          actor.role === 'factor 1' || actor.role === 'factor 2'
            ? TABLE_MAP.BIDS
            : Object.assign({}, TABLE_MAP.BIDS, { factorID: 'Factor' })
        }
        data={filteredData}
        actions={item => (
          <>
            {actor.role === 'supplier' && item.state === 'Issued' ? (
              <div>
                <Button
                  onClick={() => {
                    acceptBid({
                      fcn: 'acceptBid',
                      args: [item.id, '0', '0', '0']
                    });
                  }}
                  style={{ marginRight: '5px' }}
                  intent="primary"
                >
                  Accept
                </Button>
                <Button intent="danger">Decline</Button>
              </div>
            ) : (
              <></>
            )}

            {actor.id === item.factorID && item.state === 'Issued' ? ( // FIX FACTOR add map ?
              <div>
                <Button
                  onClick={() => {
                    setDialog({
                      isOpen: true,
                      state: {
                        id: item.id,
                        rate: item.rate,
                        amount: item.amount,
                        beneficiary: item.beneficiary,
                        debtor: item.debtor,
                        paymentDate: item.paymentDate,
                        action: 'update',
                        actorId: item.factorID,
                        invoiceId: item.invoiceID
                      }
                    });
                  }}
                  style={{ marginRight: '5px' }}
                  intent="primary"
                >
                  Edit
                </Button>
                <Button
                  intent="danger"
                  onClick={() => {
                    cancelBid({
                      fcn: 'cancelBid',
                      args: [item.id, '0', '0', '0']
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <></>
            )}
          </>
        )}
      />
    </>
  );
};

Bids.propTypes = {
  role: PropTypes.string
};

export default Bids;
