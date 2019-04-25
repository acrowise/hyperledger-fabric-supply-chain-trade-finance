import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { useFetch } from '../hooks';

import TransportRequestForm from './TransportRequestForm';
import Table from '../components/Table';

const Contracts = ({ role }) => {
  const [data, loading, setData] = useFetch('contracts');
  const [tsrDialogIsOpen, setTsrDialogOpenState] = useState({
    state: false, item: {}
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
        fields={{
          contractId: 'Contract ID',
          consignorName: 'Consignor',
          consigneeName: 'Consignee',
          totalDue: 'Total Due',
          dateCreated: 'Date Created',
          lastUpdated: 'Last Updated',
          dueDate: 'Due Date',
          destinationPort: 'Destination',
          quantity: 'Quantity',
          state: 'Satus'
        }}
        data={data}
        actions={item => (role === 'supplier' ? (
            <div>
              <Button
                onClick={() => {
                  console.log('item', item);
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
