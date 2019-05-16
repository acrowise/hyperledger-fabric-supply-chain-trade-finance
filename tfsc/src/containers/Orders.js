import React from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import { post } from '../helper/api';

import { filterData } from '../helper/utils';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';

const Orders = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [data, loading, setData] = useFetch('listOrders');
  const [, acceptOrder] = post('acceptOrder')();
  const [, cancelOrder] = post('cancelOrder')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'place') {
      const newState = { result: data.result.concat(notification) };
      setData(newState);
    }

    if (
      notification.type === 'acceptOrder'
      || notification.type === 'cancelOrder'
      || notification.type === 'updateOrder'
    ) {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.key.id);
      newState[itemToUpdateIndex] = notification;
      setData({ result: newState });
    }
  };

  useSocket('notification', onMessage);

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
    <>Loading...</>
  ) : (
    <div>
      <Table
        fields={TABLE_MAP.ORDERS}
        data={filteredData}
        actions={item => (
          <>
            {role === 'supplier' && item.state === 'New' ? (
              <div className="nowrap">
                <Button
                  onClick={() => {
                    acceptOrder({
                      fcn: 'acceptOrder',
                      args: [item.id, '0', '0', '0', '0', '0', '0', '0']
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
            {role === 'buyer' && item.state === 'New' ? (
              <div className="nowrap">
                <Button style={{ marginRight: '5px' }} intent="primary">
                  Edit
                </Button>
                <Button
                  intent="danger"
                  onClick={() => {
                    cancelOrder({
                      fcn: 'cancelOrder',
                      args: [item.id, '0', '0', '0', '0', '0', '0', '0']
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
    </div>
  );
};

Orders.propTypes = {
  role: PropTypes.string
};

export default Orders;
