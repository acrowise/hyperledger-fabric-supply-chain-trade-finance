import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, TextArea, Label
} from '@blueprintjs/core';
import uuid from 'uuid/v4';

import { post } from '../../helper/api';

import FileUploader from '../../components/FileUploader';

import { INPUTS } from '../../constants';

import { formReducer } from '../../reducers';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

const initialState = {
  shipFrom: '',
  shipTo: '',
  transport: '',
  description: '',
  touched: {
    shipFrom: false,
    shipmTo: false,
    transport: false
  }
};

const TransportRequestForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [files, setFiles] = useState([]);
  const [hash, setHash] = useState(null);
  const [shipmentRequestRes, requestShipment, reset] = post('requestShipment')();
  const [fileRequired, setFileRequired] = useState(false);

  const errors = {
    shipFrom: formState.shipFrom.length === 0,
    shipTo: formState.shipTo.length === 0,
    transport: formState.transport.length === 0,
    description: formState.description.length === 0
  };

  if (!shipmentRequestRes.pending) {
    if (shipmentRequestRes.complete) {
      setTimeout(() => {
        setDialogOpenState({
          isOpen: false,
          item: {}
        });
        setFileRequired(false);
        reset();
      }, 1500);
    }
  }

  const shouldShowError = (field) => {
    const hasError = errors[field];
    const shouldShow = formState.touched[field];

    return hasError ? shouldShow : false;
  };

  const onBlur = field => () => {
    dispatch({
      type: 'touch',
      fields: [field]
    });
  };

  return (
    <Overlay usePortal isOpen={dialogIsOpen.state}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '720px' }}>
          <ActionCompleted res={shipmentRequestRes} action="New Shipment" result="Confirmed" />
          {!shipmentRequestRes.pending
          && !shipmentRequestRes.complete
          && !shipmentRequestRes.data ? (
            <>
              <div className="modal-header">New shipment</div>
              <div className="modal-body">
                {/* <Label>ContractId: {dialogIsOpen.item.contractId}</Label> */}
                <div className="row">
                  <div className="col-6">
                    {INPUTS.TRANSPORT_REQUEST.map(({
                      label, type, placeholder, field
                    }) => (
                      <FormGroup key={label} label={label}>
                        <InputGroup
                          className={shouldShowError(field) ? 'bp3-intent-danger' : ''}
                          onBlur={onBlur(field)}
                          type={type}
                          placeholder={placeholder}
                          value={formState[field]}
                          onChange={({ target: { value } }) => dispatch({
                            type: 'change',
                            payload: {
                              field,
                              value
                            }
                          })
                          }
                        />
                      </FormGroup>
                    ))}
                  </div>
                  <div className="col-6">
                    <Label>
                      Description
                      <TextArea
                        className="textarea"
                        value={formState.description}
                        onChange={({ target: { value } }) => dispatch({
                          type: 'change',
                          payload: {
                            field: 'description',
                            value
                          }
                        })
                        }
                      />
                    </Label>
                    <Label>
                      Packing List
                      <div style={{ marginTop: 5 }}>
                        <FileUploader
                          files={files}
                          setFiles={setFiles}
                          hash={hash}
                          setHash={setHash}
                          error={fileRequired}
                        />
                      </div>
                    </Label>
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
                      state: false,
                      item: {}
                    });
                    setFileRequired(false);
                    dispatch({ type: 'reset', payload: initialState });
                    setFiles([]);
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
                    if (files.length === 0 || !hash) {
                      setFileRequired(true);
                    }
                    if (!hasErrors && files.length !== 0) {
                      requestShipment({
                        fcn: 'requestShipment',
                        args: [
                          uuid(),
                          dialogIsOpen.item.id,
                          formState.shipFrom,
                          formState.shipTo,
                          formState.transport,
                          formState.description,
                          // dialogIsOpen.item.dueDate.toString(), // Delivery Date
                          hash.hash,
                          hash.type,
                          'Packing List'
                        ]
                      });
                      setFiles([]);
                      dispatch({ type: 'reset', payload: initialState });
                    } else {
                      dispatch({
                        type: 'touch',
                        fields: Object.keys(errors).filter(j => errors[j])
                      });
                    }
                  }}
                >
                  Request
                </Button>
              </div>
            </>
            ) : (
            <></>
            )}
        </Card>
      </div>
    </Overlay>
  );
};

export default TransportRequestForm;

TransportRequestForm.propTypes = {
  dialogIsOpen: PropTypes.object,
  setDialogOpenState: PropTypes.func
};
