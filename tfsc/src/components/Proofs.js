import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import ProofDetail from './ProofDetail';

const Proofs = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const [dialogIsOpen, setDialogOpenState] = useState(false);
  const [selectedProof, setSelectedProof] = useState(false);

  return (
    <div>
      <ProofDetail
        dialogIsOpen={dialogIsOpen}
        setDialogOpenState={setDialogOpenState}
        proof={selectedProof}
      />
      <div
        onClick={() => {
          setExpanded(!expanded);
        }}
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        <h3>Proofs</h3>
        <Icon icon={expanded ? 'caret-up' : 'caret-down'} />
      </div>
      {expanded ? (
        <div>
          {data.map(proof => (
            <div
              onClick={() => {
                setDialogOpenState(true);
                setSelectedProof(proof);
              }}
              key={proof.proofId}
              style={{ display: 'flex', flexDirection: 'column' }}
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
