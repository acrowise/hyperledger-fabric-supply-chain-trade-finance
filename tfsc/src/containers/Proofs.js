import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import VerifyProofForm from './VerifyProofForm';
import Table from '../components/Table/Table';
import { TABLE_MAP } from '../constants';

const Proofs = ({ role }) => {
  const [vpDialogIsOpen, setVpDialogOpenState] = useState(false);
  const [proofs, loading, setData] = useFetch('proofs');

  const [selectedProof, setSelectedProof] = useState({});
  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'proof') {
      const newState = proofs.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.contractId === notification.contractId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
    }

    if (notification.type === 'validateProof') {
      const newState = proofs.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.proofId === notification.proofId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
    }
  };

  useSocket('notification', onNotification);

  return (
    <div>
      <VerifyProofForm
        dialogIsOpen={vpDialogIsOpen}
        setDialogOpenState={setVpDialogOpenState}
        proof={selectedProof}
      />
      <Table
        fields={TABLE_MAP.PROOFS}
        data={proofs}
        actions={item => (
          <div>
            <Button
              onClick={() => {
                setSelectedProof(item);
                setVpDialogOpenState(true);
              }}
              style={{ marginRight: '5px' }}
              intent="primary"
            >
              Accept
            </Button>
            <Button intent="danger">Decline</Button>
          </div>
        )}
      />
    </div>
  );
};

export default Proofs;

Proofs.propTypes = {
  role: PropTypes.string
};
