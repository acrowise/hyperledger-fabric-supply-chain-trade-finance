import React from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import { post } from '../helper/api';

import Table from '../components/Table/Table';
import { TABLE_MAP } from '../constants';

const Orders = ({ role, filter, search }) => {
  const [data, loading, setData] = useFetch('listOrders');
  const [, acceptOrder] = post('acceptOrder')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'place') {
      const newState = { result: data.result.concat(notification) };
      setData(newState);
    }

    if (notification.type === 'acceptOrder') {
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
      <Table
        fields={TABLE_MAP.ORDERS}
        data={filteredData}
        actions={item => (role === 'supplier' && item.state === 'New' ? (
            <div>
              <Button
                onClick={() => {
                  acceptOrder({ fcn: 'acceptOrder', args: [item.orderId, '0', '0', '0', '0', '0', '0', '0'] });
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
