import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { useFetch } from '../hooks';

import TransportRequestForm from './Forms/TransportRequest';
import Table from '../components/Table/Table';

import Icon from '../components/Icon/Icon';

import { filterData } from '../helper/utils';

import { TABLE_MAP, STATUSES } from '../constants';

const Contracts = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [data, loading, setData] = useFetch('listContracts');
  const [tsrDialogIsOpen, setTsrDialogOpenState] = useState({
    state: false,
    item: {}
  });

  const onMessage = (message) => {
    const notification = JSON.parse(message);
    if (notification.type === 'contractCreated') {
      const newState = data.result.concat(notification);
      setData({ result: newState });
    }

    if (notification.type === 'shipmentRequested' || notification.type === 'contractCompleted') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.contract.key.id);
      newState[itemToUpdateIndex] = notification.contract;
      setData({ result: newState });
    }
  };

  useSocket('notification', onMessage);

  let filteredData = data.result;

  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.CONTRACT[i.value.state] }));

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
      <TransportRequestForm
        dialogIsOpen={tsrDialogIsOpen}
        setDialogOpenState={setTsrDialogOpenState}
      />
      <Table
        fields={TABLE_MAP.CONTRACTS}
        data={filteredData}
        actions={item => (role === 'supplier' && item.state === 'Signed' ? (
            <div>
              <Button
                onClick={() => {
                  setTsrDialogOpenState({ state: true, item });
                }}
                style={{ marginRight: '5px', padding: '6px 15px' }}
                intent="primary"
              >
                <Icon name="transport" />
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

Contracts.propTypes = {
  role: PropTypes.string
};

export default Contracts;
