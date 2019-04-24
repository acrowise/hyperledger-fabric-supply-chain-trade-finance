import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { AppToaster } from '../toaster';
import { useFetch } from '../hooks';

import TransportRequestForm from './TransportRequestForm';
import Table from '../components/Table';

const Contracts = ({ role }) => {
  const [data, loading, setData] = useFetch('contracts');
  const [tsrDialogIsOpen, setTsrDialogOpenState] = useState(false);

  const onMessage = (message) => {
    const notification = JSON.parse(message);
    if (notification.type === 'contractCreated') {
      AppToaster.show({
        icon: 'tick',
        intent: 'success',
        message: `New Order: ${notification.orderId}`
      });
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
        fields={{
          orderId: 'Order ID',
          contractId: 'Contract ID',
          state: 'Satus',
          dateCreated: 'Date Created',
          lastUpdated: 'Last Updated'
        }}
        data={data}
        actions={() => (
          <div>
            <Button
              onClick={() => {
                setTsrDialogOpenState(true);
              }}
              style={{ marginRight: '5px' }}
              intent="primary"
            >
              New Shipment
            </Button>
          </div>
        )}
      />
    </div>
  );
};

Contracts.propTypes = {
  role: PropTypes.string
};

export default Contracts;
