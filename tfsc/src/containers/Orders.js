import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import OrderForm from './OrderForm';

import { AppToaster } from '../toaster';

import { post } from '../helper/api';

console.log(post);
const Orders = ({ role, filter, search }) => {
  const [dialogIsOpen, setDialogOpenState] = useState(false);
  const [data, loading, setData] = useFetch('orders');
  const [updatedOrder, updateOrder] = post('updateOrder')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'place') {
      if (role === 'supplier') {
        AppToaster.show({
          icon: 'tick',
          intent: 'success',
          message: `New Order: ${notification.orderId}`
        });
      }
      const newState = data.concat(notification);
      setData(newState);
    }

    if (notification.type === 'updateOrder') {
      if (role === 'buyer') {
        AppToaster.show({
          icon: 'tick',
          intent: 'success',
          message: `Order Updated: ${notification.orderId}`
        });
      }
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
      <table className="bp3-html-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Destination Port</th>
            <th>Due Date</th>
            <th>Date Created</th>
            <th>State</th>
            {role === 'supplier' ? <th>Action</th> : <></>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <>No Data</>
          ) : (
            filteredData.map(order => (
              <tr key={order.orderId}>
                <td>{order.orderId}</td>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.price}</td>
                <td>{order.destinationPort}</td>
                <td>{order.dueDate}</td>
                <td>{order.dateCreated}</td>
                <td>{order.state}</td>
                {role === 'supplier' && order.state === 'New' ? (
                  <td>
                    <div>
                      <Button
                        onClick={() => {
                          updateOrder({ orderId: order.orderId });
                        }}
                        style={{ marginRight: '5px' }}
                        intent="primary"
                      >
                        Accept
                      </Button>
                      <Button intent="danger">Decline</Button>
                    </div>
                  </td>
                ) : (
                  <></>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

Orders.propTypes = {
  role: PropTypes.string
};

export default Orders;
