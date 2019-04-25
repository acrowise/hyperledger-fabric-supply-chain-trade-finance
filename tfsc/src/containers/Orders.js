import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import OrderForm from './OrderForm';

import { post } from '../helper/api';

import Table from '../components/Table';

const Orders = ({ role, filter, search }) => {
  const [dialogIsOpen, setDialogOpenState] = useState(false);
  const [data, loading, setData] = useFetch('orders');
  const [updatedOrder, updateOrder] = post('updateOrder')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'place') {
      const newState = data.concat(notification);
      setData(newState);
    }

    if (notification.type === 'updateOrder') {
      const newState = data.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.orderId === notification.orderId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
    }
  };

  useSocket('notification', onMessage);

  let filteredData = data;

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
      <OrderForm dialogIsOpen={dialogIsOpen} setDialogOpenState={setDialogOpenState} />
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
        fields={{
          orderId: 'Order ID',
          productName: 'Name',
          quantity: 'Quantity',
          price: 'Price',
          destinationPort: 'Destination Port',
          dueDate: 'Due Date',
          dateCreated: 'Date Created',
          state: 'State'
        }}
        data={data}
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
    </div>
  );
};

Orders.propTypes = {
  role: PropTypes.string
};

export default Orders;
