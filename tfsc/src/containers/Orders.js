import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import OrderPurchaseForm from './Forms/OrderPurchase';

import { post } from '../helper/api';

import Table from '../components/Table/Table';
import { TABLE_MAP } from '../constants';

const Orders = ({ role, filter, search }) => {
  const [dialogIsOpen, setDialogOpenState] = useState(false);
  const [data, loading, setData] = useFetch('orders');
  const [, updateOrder] = post('updateOrder')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'place') {
      const newState = { result: data.result.concat(notification) };
      setData(newState);
    }

    if (notification.type === 'updateOrder') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.orderId === notification.orderId);
      newState[itemToUpdateIndex] = notification;
      setData({ result: newState });
    }
  };

  useSocket('notification', onMessage);

  let filteredData = data.result;

  if (!loading) {
    if (filter) {
      filteredData = filteredData.filter(item => item.state === filter);
    }
    if (search) {
      filteredData = filteredData.filter(item => item.productName.toLowerCase().includes(search));
    }
  }

  return loading ? (
    <>Loading...</>
  ) : (
    <div>
      <OrderPurchaseForm dialogIsOpen={dialogIsOpen} setDialogOpenState={setDialogOpenState} />
      {role === 'buyer' ? (
        <Button
          icon="add"
          onClick={() => {
            setDialogOpenState(true);
          }}
        >
          New Order
        </Button>
      ) : (
        <></>
      )}
      <Table
        fields={TABLE_MAP.ORDERS}
        data={filteredData}
        actions={item => (role === 'supplier' && item.state === 'New' ? (
            <div>
              <Button
                onClick={() => {
                  updateOrder({ orderId: item.orderId });
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
        ))
        }
      />
      {role === 'buyer' && (
        <Button
          icon="add"
          onClick={() => {
            setDialogOpenState(true);
          }}
        >
          New Order
        </Button>
      )}
    </div>
  );
};

Orders.propTypes = {
  role: PropTypes.string
};

export default Orders;
