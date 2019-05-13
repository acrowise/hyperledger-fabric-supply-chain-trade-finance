import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';
import VerifyProof from './Forms/VerifyProof';

const Reports = ({ role, filter, search }) => {
  const [vpDialogIsOpen, setVpDialogOpenState] = useState(false);
  const [data, loading, setData] = useFetch('listReports');
  const [selectedProof, setSelectedProof] = useState({});

  const onMessage = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'reportGenerated') {
      setData({ result: data.result.concat(notification.data) });
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

  if (filteredData) {
    filteredData = filteredData.filter(i => i.value.factor.toLowerCase() === role).map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.REPORT[i.value.state] }));
  }

  console.log('reports', filteredData);

  if (!loading) {
    if (filter) {
      filteredData = filteredData.filter(item => item.state === filter);
    }
  }

  return loading ? (
    <>Loading...</>
  ) : (
    <div>
      <VerifyProof
        dialogIsOpen={vpDialogIsOpen}
        setDialogOpenState={setVpDialogOpenState}
        proof={selectedProof}
        role={role}
        type="update"
      />
      <Table
        fields={TABLE_MAP.REPORTS}
        data={filteredData}
        actions={item => (role === 'ggcb' || role === 'uscts' ? (
            <div>
              <Button
                onClick={() => {
                  return;
                  setSelectedProof(item);
                  setVpDialogOpenState(true);
                }}
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
