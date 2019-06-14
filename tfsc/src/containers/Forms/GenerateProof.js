import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, Checkbox, Card, MenuItem
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import uuid from 'uuid/v4';

import { post } from '../../helper/api';
import { formReducer } from '../../reducers';
import { INPUTS, REVIEWERS } from '../../constants';
import Icons from '../../components/Icon/Icon';
import { cropId } from '../../helper/utils';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

const GenerateProof = ({
  dialogIsOpen, setDialogOpenState, shipment, docs
}) => {
  const contractFields = [
    'consignorName',
    'consigneeName',
    'totalDue',
    'quantity',
    'destination',
    'dueDate',
    'paymentDate'
  ];
  const initialState = {
    contractId: false,
    consignorName: false,
    consigneeName: false,
    totalDue: false,
    quantity: false,
    destination: false,
    dueDate: false,
    paymentDate: false,
    reviewer: REVIEWERS.find(i => i.id === dialogIsOpen.owner)
      ? REVIEWERS.find(i => i.id === dialogIsOpen.owner)
      : null,
    'Bill of Lading': false,
    'Packing List': false,
    'CMSP Report': false,
    'DMSP Report': false,
    touched: {
      reviewer: false
    }
  };

  if (docs.length > 0) {
    docs.forEach(doc => (initialState[doc.value.documentMeat] = false));
  }

  const [formState, dispatch] = useReducer(formReducer, initialState);

  const [generateProofRes, generateProof, resetGenerateProof] = post(
    dialogIsOpen.id ? 'updateProof' : 'generateProof'
  )();

  useEffect(() => {
    dispatch({ type: 'reset', payload: initialState });
  }, [dialogIsOpen]);

  if (!generateProofRes.pending) {
    if (generateProofRes.complete) {
      setTimeout(() => {
        setDialogOpenState({
          isOpen: false
        });
        resetGenerateProof();
      }, 1500);
    }
  }

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
    <Overlay usePortal isOpen={dialogIsOpen.isOpen}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '720px' }}>
          {generateProofRes.pending || generateProofRes.complete || generateProofRes.data ? (
            <ActionCompleted res={generateProofRes} action="Proof" result="Generated" />
          ) : (
            <>
              <div className="modal-header">
                {dialogIsOpen.id ? `Update Proof: ${cropId(dialogIsOpen.id)}` : 'Generate Proof '}
              </div>
              <div
                className="modal-body"
                style={{
                  paddingLeft: '60px'
                }}
              >
                <div className="row">
                  <div className="col-8">
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
                      {docs
                        && docs.length
                        && docs.map((doc, i) => (
                          <div
                            className="col-6"
                            key={i}
                            style={{ display: 'flex', paddingLeft: 0, alignItems: 'center' }}
                          >
                            <Checkbox
                              style={{ marginBottom: 3 }}
                              value={formState[doc.value.documentMeat]}
                              checked={formState[doc.value.documentMeat]}
                              onChange={() => dispatch({
                                type: 'change',
                                payload: {
                                  field: doc.value.documentMeat,
                                  value: !formState[doc.value.documentMeat]
                                }
                              })
                              }
                            />
                            <div
                              style={{
                                cursor: 'pointer',
                                marginRight: 5,
                                display: 'flex',
                                paddingLeft: 0,
                                alignItems: 'center'
                              }}
                              onClick={() => {
                                dispatch({
                                  type: 'change',
                                  payload: {
                                    field: doc.value.documentMeat,
                                    value: !formState[doc.value.documentMeat]
                                  }
                                });
                              }}
                            >
                              <div style={{ marginRight: 5 }}>
                                <Icons name="proof-document" />
                              </div>
                              {doc.value.documentMeat}
                            </div>
                          </div>
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
                    setDialogOpenState({
                      isOpen: false
                    });
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
                      const attributes = contractFields.map(i => ({
                        AttributeName: i,
                        AttributeValue: shipment.contract.value[i].toString(),
                        AttributeDisclosure: formState[i] ? 1 : 0
                      }));
                      if (formState.contractId) {
                        attributes.push({
                          AttributeName: 'contractId',
                          AttributeValue: shipment.contract.key.id,
                          AttributeDisclosure: 1
                        });
                      }
                      docs.forEach((document) => {
                        if (formState[document.value.documentMeat]) {
                          attributes.push({
                            AttributeName: document.value.documentMeat,
                            AttributeValue: document.value.documentHash,
                            AttributeDisclosure: 1
                          });
                        }
                      });
                      generateProof({
                        fcn: dialogIsOpen.id ? 'updateProof' : 'generateProof',
                        args: [
                          dialogIsOpen.id || uuid(),
                          JSON.stringify(attributes),
                          formState.reviewer.id,
                          shipment.id
                        ]
                      });
                      dispatch({ type: 'reset', payload: initialState });
                      // setDialogOpenState(false);
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
            </>
          )}
        </Card>
      </div>
    </Overlay>
  );
};

GenerateProof.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func,
  shipment: PropTypes.object,
  docs: PropTypes.array
};

export default GenerateProof;
