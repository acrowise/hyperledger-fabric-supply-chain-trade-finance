import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, FormGroup, InputGroup, Card, TextArea, Label
} from '@blueprintjs/core';

import { post } from '../../helper/api';

import FileUploader from '../../components/FileUploader';

import { INPUTS } from '../../constants';

import { formReducer } from '../../reducers';

import ActionCompleted from '../../components/ActionCompleted';

const initialState = {
  shipFrom: '',
  shipTo: '',
  transport: '',
  description: ''
};

const TransportRequestForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, dispatch] = useReducer(formReducer, initialState);
  // const [formState, setFormState] = useState(defaultFormState);
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
        <Card style={{ width: '20vw' }}>
          <ActionCompleted res={shipmentRequestRes} action="Shipment Requested" result="Accepted" />
          {!shipmentRequestRes.pending
          && !shipmentRequestRes.complete
          && !shipmentRequestRes.data ? (
            <>
              <Label>ContractId: {dialogIsOpen.item.contractId}</Label>
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
              <FileUploader files={files} setFiles={setFiles} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  large
                  intent="danger"
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
                  onClick={() => {
                    requestShipment(
                      Object.assign({ contractId: dialogIsOpen.item.contractId }, formState)
                    );
                    dispatch({ type: 'reset', payload: initialState });

                    const form = new FormData();
                    files.forEach((f) => {
                      form.append('file', f);
                    });
                    uploadDocs(form);
                    setFiles([]);
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
