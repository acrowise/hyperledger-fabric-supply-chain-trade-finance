import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Overlay, Button, Card } from '@blueprintjs/core';
import './proofDetail.scss';

import { STATUSES } from '../../constants';

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
      <Card className="modal" style={{ width: '550px' }}>
        <div className="modal-header">Proof {proof.key ? proof.key.id : 'No Data'}</div>

        <div className="modal-body">
          <table className="proof-detail-table">
            <tr>
              <th>ProofId</th>
              <td>{proof.key ? proof.key.id : 'No data'}</td>
            </tr>
            <tr>
              <th>Agency</th>
              <td>{proof.value ? proof.value.agency.title : 'No data'}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>{proof.value ? STATUSES.PROOF[proof.value.state] : 'No data'}</td>
            </tr>
          </table>
        </div>
        <div className="modal-footer">
          <Button
            text="Close"
            intent="primary"
            className="btn-modal"
            onClick={() => {
              setDialogOpenState(false);
            }}
          />
        </div>
      </Card>
    </div>
  </Overlay>
);

ProofDetail.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default ProofDetail;
