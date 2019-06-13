import React from 'react';
import PropTypes from 'prop-types';
import { Overlay, Button, Card } from '@blueprintjs/core';
import './proofDetail.scss';

import { STATUSES, REVIEWERS } from '../../constants';
import { cropId } from '../../helper/utils';

const colors = {
  1: 'white',
  2: '#D3F3E8',
  3: 'white',
  4: '#FF8A80'
};

const ProofDetail = ({ dialogIsOpen, setDialogOpenState, proof }) => (proof ? (
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
          <div className="modal-header">Proof {proof.key ? cropId(proof.key.id) : 'No Data'}</div>

          <div className="modal-body">
            <table className="proof-detail-table">
              <tbody>
                <tr>
                  <th>Proof ID</th>
                  <td>{proof.key ? cropId(proof.key.id) : 'No data'}</td>
                </tr>
                <tr>
                  <th>Agency</th>
                  <td>
                    {proof.value
                      ? REVIEWERS.find(i => i.id === proof.value.owner).title
                      : 'No data'}
                  </td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td
                    style={{
                      backgroundColor: colors[proof.value.state]
                    }}
                  >
                    {proof.value ? STATUSES.PROOF[proof.value.state] : 'No data'}
                  </td>
                </tr>
              </tbody>
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
) : (
    <></>
));

ProofDetail.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func,
  proof: PropTypes.object
};

export default ProofDetail;
