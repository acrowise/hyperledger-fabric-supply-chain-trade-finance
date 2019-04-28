import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Overlay, Button, Card } from '@blueprintjs/core';

const ProofDetail = ({ dialogIsOpen, setDialogOpenState, proof }) => (
  <Overlay usePortal isOpen={dialogIsOpen}>
    <div
      style={{
        display: 'flex',
        width: '100vw',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
    >
      <Card style={{ width: '20vw' }}>
        <p>ProofId: {proof.proofId}</p>
        <p>Agency: {proof.agency}</p>
        <p>Status: {proof.status}</p>
        <Button
          text="Close"
          onClick={() => {
            setDialogOpenState(false);
          }}
        />
      </Card>
    </div>
  </Overlay>
);

ProofDetail.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default ProofDetail;
