import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import ProofDetail from './ProofDetail/ProofDetail';

const Proofs = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const [dialogIsOpen, setDialogOpenState] = useState(false);
  const [selectedProof, setSelectedProof] = useState(false);

  return (
    <div className="sidebar-panel">
      <ProofDetail
        dialogIsOpen={dialogIsOpen}
        setDialogOpenState={setDialogOpenState}
        proof={selectedProof}
      />
      <div
        onClick={() => {
          setExpanded(!expanded);
        }}
        className="sidebar-panel-header"
      >
        <h4>Proofs</h4>
        <Icon icon={expanded ? 'caret-up' : 'caret-down'} />
      </div>
      {expanded ? (
        <div className="sidebar-panel-body">
          {data.map(proof => (
            <div
              onClick={() => {
                setDialogOpenState(true);
                setSelectedProof(proof);
              }}
              key={proof.proofId}
              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            >
              <p>ProofId: {proof.proofId}</p>
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

Proofs.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default Proofs;
