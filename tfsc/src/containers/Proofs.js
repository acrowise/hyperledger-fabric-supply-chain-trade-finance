import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import VerifyProofForm from './VerifyProofForm';

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
      <table className="bp3-html-table .modifier">
        <thead>
          <tr>
            <th>Contarct ID</th>
            <th>From</th>
            <th>To</th>
            <th>Transport</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {proofs.map(proof => (
            <tr key={proof.contractId}>
              <td>{proof.contractId}</td>
              <td>{proof.shipFrom}</td>
              <td>{proof.shipTo}</td>
              <td>{proof.transport}</td>
              <td>{proof.state}</td>
              <Button
                onClick={() => {
                  setSelectedProof(proof);
                  setVpDialogOpenState(true);
                }}
              >
                Verify Proof
              </Button>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Proofs;

Proofs.propTypes = {
  role: PropTypes.string
};
