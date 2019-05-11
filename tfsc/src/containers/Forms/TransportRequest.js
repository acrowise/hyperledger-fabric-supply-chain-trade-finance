import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, FormGroup, InputGroup, Card, TextArea, Label
} from '@blueprintjs/core';

import { post } from '../../helper/api';

import FileUploader from '../../components/FileUploader';

import { INPUTS } from '../../constants';

import { formReducer } from '../../reducers';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

const initialState = {
  shipmentFrom: '',
  shipmentTo: '',
  transport: '',
  description: ''
};

const TransportRequestForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [files, setFiles] = useState([]);
  const [shipmentRequestRes, requestShipment, reset] = post('requestShipment')();
  const [, uploadDocs] = post('uploadDocuments')();

  if (!shipmentRequestRes.pending) {
    if (shipmentRequestRes.complete) {
      setTimeout(() => {
        setDialogOpenState({
          isOpen: false,
          item: {}
        });
        reset();
      }, 1500);
    }
  }

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
                        growVertically={true}
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
                        <FileUploader files={files} setFiles={setFiles} />
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
                    requestShipment({
                      fcn: 'requestShipment',
                      args: [
                        '0',
                        dialogIsOpen.item.id,
                        formState.shipmentFrom,
                        formState.shipmentTo,
                        formState.transport,
                        formState.description
                      ]
                    });
                    const form = new FormData();
                    form.append('contractId', dialogIsOpen.item.id);
                    form.append('type', 'Packing List');
                    files.forEach((f) => {
                      form.append('file', f);
                    });
                    uploadDocs(form);
                    setFiles([]);
                    dispatch({ type: 'reset', payload: initialState });
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
