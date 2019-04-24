import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { AppToaster } from '../toaster';
import { useFetch } from '../hooks';

import TransportRequestForm from './TransportRequestForm';

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
      <table className="bp3-html-table .modifier">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Contract ID</th>
            <th>Sate</th>
            <th>Date Created</th>
            <th>Last Updated</th>
            {role === 'supplier' ? <th>Action</th> : <></>}
          </tr>
        </thead>
        <tbody>
          {data.map(contract => (
            <tr key={contract.orderId}>
              <td>{contract.orderId}</td>
              <td>{contract.contractId}</td>
              <td>{contract.state}</td>
              <td>{contract.dateCreated}</td>
              <td>{contract.lastUpdated}</td>
              {role === 'supplier' ? (
                <td>
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
                </td>
              ) : (
                <></>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Contracts.propTypes = {
  role: PropTypes.string
};

export default Contracts;
