import React from 'react';

import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import { post } from '../helper/api';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';
import { filterData } from '../helper/utils';

const Bids = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [data, loading, setData] = useFetch('listBids');
  const [, acceptBid] = post('acceptBid')();

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'placeBid') {
      const newState = { result: data.result.concat(notification) };
      setData(newState);
    }

    if (notification.type === 'acceptBid' || notification.type === 'cancelBid') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.data.key.id);
      newState[itemToUpdateIndex] = notification.data;
      setData({ result: newState });
    }
  };

  useSocket('notification', onMessage);

  let filteredData = data.result;

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
    <>Loading...</>
  ) : (
    <div>
      <Table
        fields={
          role === 'factor 1' || role === 'factor 2'
            ? TABLE_MAP.BIDS
            : Object.assign({}, TABLE_MAP.BIDS, { factor: 'Factor' })
        }
        data={filteredData}
        actions={item => (
          <>
            {role === 'supplier' && item.state === 'Issued' ? (
              <div>
                <Button
                  onClick={() => {
                    acceptBid({
                      fcn: 'acceptBid',
                      args: [item.id, '0', '0', '0'],
                      id: item.id, // FIXME:
                      user: role
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
            {role === item.factor && item.state === 'Issued' ? (
              <div>
                <Button onClick={() => {}} style={{ marginRight: '5px' }} intent="primary">
                  Edit
                </Button>
                <Button intent="danger">Cancel</Button>
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

Bids.propTypes = {
  role: PropTypes.string
};

export default Bids;
