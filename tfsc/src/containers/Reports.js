import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { useFetch } from '../hooks';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';
import VerifyProof from './Forms/VerifyProof';

import { filterData } from '../helper/utils';

const Reports = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
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

  // FIXME:
  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData
      .map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.REPORT[i.value.state] }))
      .filter(i => i.factor.toLowerCase() === role);

    if (dataForFilter.length === 0 && filteredData.length !== 0) {
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
                  // setSelectedProof(item);
                  // setVpDialogOpenState(true);
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
