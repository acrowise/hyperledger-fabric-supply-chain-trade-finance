import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import ProofDetail from './ProofDetail/ProofDetail';

const Proofs = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const [dialogIsOpen, setDialogOpenState] = useState(false);
  const [selectedProof, setSelectedProof] = useState({});

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
              key={proof.key.id}
              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            >
              <p>Proof: {proof.value.agency.id.toUpperCase()}</p>
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
