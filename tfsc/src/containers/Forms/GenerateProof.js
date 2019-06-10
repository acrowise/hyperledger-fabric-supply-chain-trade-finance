import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, Checkbox, Card, MenuItem
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { post } from '../../helper/api';
import { formReducer } from '../../reducers';
import { INPUTS, REVIEWERS } from '../../constants';
import Icons from '../../components/Icon/Icon';

const GenerateProof = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
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
    reviewer: null,
    touched: {
      reviewer: false
    }
  };

  if (shipment.documents) {
    shipment.documents.forEach(doc => (initialState[doc.value.documentDescription] = false));
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
                  {shipment
                    && shipment.documents
                    && shipment.documents.map(doc => (
                      <div
                        className="col-6"
                        key={doc.value.documentMeat}
                        style={{ display: 'flex', paddingLeft: 0, alignItems: 'center' }}
                      >
                        <div style={{ marginRight: 5 }}>
                          <Icons name="proof-document" />
                        </div>
                        <Checkbox
                          style={{ marginBottom: 3 }}
                          label={doc.value.documentMeat}
                          value={formState[doc.field]}
                          onChange={() => dispatch({
                            type: 'change',
                            payload: {
                              field: doc.value.documentMeat,
                              value: !formState[doc.value.documentMeat]
                            }
                          })
                          }
                        />
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
                    args: [
                      '0',
                      JSON.stringify(
                        contractFields.map(i => ({
                          AttributeName: i,
                          AttributeValue: shipment.contract.value[i].toString(),
                          AttributeDisclosure: formState[i] ? 1 : 0
                        }))
                      ),
                      formState.reviewer.id,
                      shipment.id
                    ]
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
  setDialogOpenState: PropTypes.func,
  shipment: PropTypes.object
};

export default GenerateProof;
