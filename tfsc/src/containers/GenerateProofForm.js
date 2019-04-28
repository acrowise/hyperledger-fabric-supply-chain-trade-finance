import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, Checkbox, Card, MenuItem
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { post } from '../helper/api';
import { formReducer } from '../reducers';
import { INPUTS, REVIEWERS } from '../constants';

const GenerateProofForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const initialState = {
    contractId: false,
    consignorName: false,
    totalDue: false,
    quantity: false,
    destination: false,
    dueDate: false,
    paymentDay: false,
    doc1: false,
    reviewer: null
  };

  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [proofRes, generateProof] = post('generateProof')();

  return (
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
          {INPUTS.GENERATE_PROOF.map(({ label, field }) => (
            <Checkbox
              key={label}
              label={label}
              value={formState[field]}
              onChange={() => dispatch({
                type: 'change',
                payload: {
                  field,
                  value: !formState[field]
                }
              })
              }
            />
          ))}
          <Select
            onItemSelect={(value) => {
              dispatch({
                type: 'change',
                payload: {
                  field: 'reviewer',
                  value
                }
              });
            }}
            itemRenderer={(item, { handleClick }) => (
              <MenuItem text={item.title} onClick={handleClick} />
            )}
            items={REVIEWERS}
            filterable={false}
            popoverProps={{ minimal: true }}
          >
            <Button
              text={(formState.reviewer && formState.reviewer.title) || 'Select Reviewer'}
              rightIcon="double-caret-vertical"
            />
          </Select>
          <div style={{ paddingTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
            <Button
              large
              intent="danger"
              onClick={() => {
                setDialogOpenState(false);
                dispatch({ type: 'reset', payload: initialState });
              }}
            >
              Cancel
            </Button>
            <Button
              large
              intent="primary"
              onClick={() => {
                setDialogOpenState(false);
                generateProof(formState);
                dispatch({ type: 'reset', payload: initialState });
              }}
            >
              Generate
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

GenerateProofForm.propTypes = {
  role: PropTypes.string,
  invoiceId: PropTypes.string,
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default GenerateProofForm;
