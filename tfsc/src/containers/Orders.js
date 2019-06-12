import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button, Overlay, Card } from '@blueprintjs/core';
import PropTypes from 'prop-types';

import { post, get } from '../helper/api';

import { filterData } from '../helper/utils';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';

import OrderPurchaseForm from './Forms/OrderPurchase';
import Loading from '../components/Loading';
import ActionCompleted from '../components/ActionCompleted/ActionCompleted';

import notifications from '../helper/notification';

const Orders = ({
  actor, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [data, loading, setData] = get('listOrders');
  const [reqAccept, acceptOrder] = post('acceptOrder')();
  const [reqCancel, cancelOrder] = post('cancelOrder')();
  const [reqGuarentee, guarenteeOrder] = post('guarenteeOrder')();

  const [dialog, setDialog] = useState({ state: null, isOpen: false });

  useSocket('notification', (message) => {
    setData(notifications(data.result.concat([]), message, 'orders'));
  });

  let filteredData = data.result;

  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.ORDER[i.value.state] }));

    if (dataForFilter.length === 0) {
      setDataForFilter(filteredData);
    }

    filteredData = filterData({
      type: 'productName',
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
      <Overlay usePortal isOpen={reqAccept.pending || reqCancel.pending}>
        <div className="loading-overlay-container">
          <Card className="modal" style={{ width: '720px' }}>
            <ActionCompleted res={reqAccept} action="Order" result="Accepted" />
            <ActionCompleted res={reqCancel} action="Order" result="Cancelled" />
          </Card>
        </div>
      </Overlay>
      <OrderPurchaseForm dialog={dialog} setDialog={setDialog} />
      <Table
        fields={TABLE_MAP.ORDERS}
        data={filteredData}
        actions={item => (
          <>
            {actor.role === 'bank' && item.state === 'New' ? (
              <div className="nowrap">
                <Button
                  onClick={() => {
                    guarenteeOrder({
                      fcn: 'guarenteeOrder',
                      args: [item.id, '0', '0', '0', '0', '0', '0', '0'],
                      peers: [`${actor.org}/peer0`]
                    });
                  }}
                  style={{ marginRight: '5px' }}
                  intent="primary"
                >
                  Guarantee
                </Button>
              </div>
            ) : (
              <></>
            )}
            {actor.role === 'supplier' && item.state === 'New' ? (
              <div className="nowrap">
                <Button
                  onClick={() => {
                    acceptOrder({
                      fcn: 'acceptOrder',
                      args: [item.id, '0', '0', '0', '0', '0', '0', '0'],
                      peers: [`${actor.org}/peer0`]
                    });
                  }}
                  style={{ marginRight: '5px' }}
                  intent="primary"
                >
                  Accept
                </Button>
                {/* <Button intent="danger">Decline</Button> */}
              </div>
            ) : (
              <></>
            )}
            {actor.role === 'buyer' && item.state === 'New' ? (
              <div className="nowrap">
                <Button
                  style={{ marginRight: '5px' }}
                  intent="primary"
                  onClick={() => {
                    setDialog({
                      state: item,
                      isOpen: true
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  intent="danger"
                  onClick={() => {
                    cancelOrder({
                      fcn: 'cancelOrder',
                      args: [item.id, '0', '0', '0', '0', '0', '0', '0'],
                      peers: [`${actor.org}/peer0`]
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

Orders.propTypes = {
  role: PropTypes.string
};

export default Orders;
