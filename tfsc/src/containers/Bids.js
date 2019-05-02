import React from 'react';

import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import { post } from '../helper/api';

import Table from '../components/Table/Table';
import { TABLE_MAP } from '../constants';

const Bids = ({ role, filter, search }) => {
  const [data, loading, setData] = useFetch('listBids');
  const [, acceptBid] = post('acceptBid')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'place') {
      const newState = { result: data.result.concat(notification) };
      setData(newState);
    }

    if (notification.type === 'acceptBid') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.key.id);
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
        fields={TABLE_MAP.BIDS}
        data={filteredData}
        actions={item => (role === 'supplier' && item.state === 'New' ? (
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
        ))
        }
      />
    </div>
  );
};

Bids.propTypes = {
  role: PropTypes.string
};

export default Bids;
