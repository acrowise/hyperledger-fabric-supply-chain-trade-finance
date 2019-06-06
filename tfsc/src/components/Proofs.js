import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import ProofDetail from './ProofDetail/ProofDetail';

const Proofs = ({ data }) => {
  const [expanded, setExpanded] = useState(true);
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
              style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }}
            >
              <p>Proof: {proof.value.owner.toUpperCase()}</p>
              {proof.new ? (
                <div
                  style={{
                    marginLeft: '3px',
                    marginBottom: '7px',
                    borderRadius: '100%',
                    height: '8px',
                    width: '8px',
                    backgroundColor: '#69D7BC'
                  }}
                />
              ) : (
                <></>
              )}
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
  data: PropTypes.array
};

export default Proofs;
