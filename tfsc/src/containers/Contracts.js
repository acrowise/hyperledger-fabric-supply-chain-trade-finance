import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { get } from '../helper/api';

import TransportRequestForm from './Forms/TransportRequest';
import Table from '../components/Table/Table';

import Icon from '../components/Icon/Icon';
import Loading from '../components/Loading';

import { filterData } from '../helper/utils';
import notifications from '../helper/notification';

import { TABLE_MAP, STATUSES } from '../constants';

const Contracts = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [data, loading, setData] = get('listContracts');
  const [tsrDialogIsOpen, setTsrDialogOpenState] = useState({
    state: false,
    item: {}
  });

  useSocket('notification', (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'requestShipment') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(
        i => i.key.id === notification.data.value.contractID
      );
      newState[itemToUpdateIndex].value.state = 2;
      setData({ result: newState });
      return;
    }
    setData(notifications(data.result, message, 'contracts'));
  });

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
    <Loading />
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
