import React from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import Table from '../components/Table/Table';
import { TABLE_MAP } from '../constants';

const Reports = ({ role, filter, search }) => {
  const [data, loading, setData] = useFetch('listReports');

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'reportGenerated') {
      const newState = { result: data.result.concat(notification) };
      setData(newState);
    }

    if (notification.type === 'reportValidated') {
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
  }

  return loading ? (
    <>Loading...</>
  ) : (
    <div>
      <Table
        fields={TABLE_MAP.REPORTS}
        data={filteredData}
        actions={() => (role === 'ggcb' || role === 'uscts' ? (
            <div>
              <Button
                onClick={() => { }}
                style={{ marginRight: '5px' }}
                intent="primary"
              >
                Update Report
              </Button>
            </div>
        ) : (
            <></>
        ))
        }
      />
    </div>
  );
};

Reports.propTypes = {
  role: PropTypes.string
};

export default Reports;
