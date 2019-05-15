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
  role, dataForFilter, setDataForFilter, filterOptions
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

    if (notification.type === 'shipmentRequested') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.contract.key.id);
      newState[itemToUpdateIndex] = notification.contract;
      setData({ result: newState });
    }
  };

  useSocket('notification', onMessage);

  let dataToDisplay = data.result;

  if (dataToDisplay) {
    dataToDisplay = dataToDisplay.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.CONTRACT[i.value.state] }));

    if (dataForFilter.length === 0 && dataToDisplay.length > 0) {
      setDataForFilter(dataToDisplay);
    }

    if (filterOptions) {
      dataToDisplay = filterData(filterOptions, dataToDisplay);
    }
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
        data={dataToDisplay}
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
