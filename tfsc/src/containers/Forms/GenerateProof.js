import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, Checkbox, Card, MenuItem
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { post } from '../../helper/api';
import { formReducer } from '../../reducers';
import { INPUTS, REVIEWERS } from '../../constants';

const GenerateProof = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
  const initialState = {
    contractId: false,
    consignorName: false,
    consigneeName: false,
    totalDue: false,
    quantity: false,
    destination: false,
    dueDate: false,
    paymentDate: false,
    reviewer: null,
    touched: {
      reviewer: false
    }
  };

  if (shipment.documents) {
    shipment.documents.forEach(doc => (initialState[doc.type] = false));
  }

  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [, generateProof] = post('generateProof')();

  const errors = {
    reviewer: formState.reviewer === null
  };

  const onBlur = field => () => {
    dispatch({
      type: 'touch',
      fields: [field]
    });
  };

  const shouldShowError = (field) => {
    const hasError = errors[field];
    const shouldShow = formState.touched[field];

    return hasError ? shouldShow : false;
  };

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
        <Card className="modal" style={{ width: '720px' }}>
          <div className="modal-header">Generate Proof</div>
          <div
            className="modal-body"
            style={{
              paddingLeft: '60px'
            }}
          >
            <div className="row">
              <div className="col-6">
                <div className="row">
                  {INPUTS.GENERATE_PROOF.map(({ label, field }, i) => (
                    <Checkbox
                      key={label}
                      label={label}
                      className={'col-6'}
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
                </div>
              </div>
              <div className="col-6" style={{ flex: 1, padding: 0 }}>
                <div>
                  {shipment.documents
                    && shipment.documents.map(doc => (
                      <Checkbox
                        key={doc.type}
                        label={doc.type}
                        className="col-4 margin-right-auto"
                        value={formState[doc.field]}
                        onChange={() => dispatch({
                          type: 'change',
                          payload: {
                            field: doc.type,
                            value: !formState[doc.type]
                          }
                        })
                        }
                      />
                    ))}
                </div>
              </div>
              <div className="col-4">
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
                    style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      border: shouldShowError('reviewer')
                        ? '1px solid #db3737'
                        : '1px solid #D3DAE0',
                      color: '#1B263C',
                      font: '300 14px "Proxima Nova", sans-serif',
                      borderRadius: 2,
                      cursor: 'pointer'
                    }}
                    onBlur={onBlur('reviewer')}
                    text={(formState.reviewer && formState.reviewer.title) || 'Select Reviewer'}
                    rightIcon="double-caret-vertical"
                  />
                </Select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button
              large
              intent="none"
              className="btn-modal btn-default"
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
              className="btn-modal"
              onClick={() => {
                const hasErrors = Object.keys(errors).find(i => errors[i] === true);
                if (!hasErrors) {
                  generateProof({
                    fcn: 'generateProof',
                    user: 'supplier',
                    shipmentId: shipment.id,
                    data: formState,
                    reviewer: formState.reviewer,
                    contractId: shipment.contractId
                  });
                  setDialogOpenState(false);
                  dispatch({ type: 'reset', payload: initialState });
                } else {
                  dispatch({
                    type: 'touch',
                    fields: Object.keys(errors).filter(j => errors[j])
                  });
                }
              }}
            >
              Submit
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

GenerateProof.propTypes = {
  role: PropTypes.string,
  invoiceId: PropTypes.string,
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default GenerateProof;
