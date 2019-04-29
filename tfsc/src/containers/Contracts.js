import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { useFetch } from '../hooks';

import TransportRequestForm from './Forms/TransportRequest';
import Table from '../components/Table/Table';

import { TABLE_MAP } from '../constants';

const Contracts = ({ role }) => {
  const [data, loading, setData] = useFetch('contracts');
  const [tsrDialogIsOpen, setTsrDialogOpenState] = useState({
    state: false,
    item: {}
  });

  const onMessage = (message) => {
    const notification = JSON.parse(message);
    if (notification.type === 'contractCreated') {
      const newState = data.concat(notification);
      setData(newState);
    }
  };

  useSocket('notification', onMessage);

  return (
    <div>
      <TransportRequestForm
        dialogIsOpen={tsrDialogIsOpen}
        setDialogOpenState={setTsrDialogOpenState}
      />
      <Table
        fields={TABLE_MAP.CONTRACTS}
        data={data}
        actions={item => (role === 'supplier' ? (
            <div>
              <Button
                onClick={() => {
                  setTsrDialogOpenState({ state: true, item });
                }}
                style={{ marginRight: '5px' }}
                intent="primary"
              >
                New Shipment
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
