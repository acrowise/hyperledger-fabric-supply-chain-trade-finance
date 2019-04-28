import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, FormGroup, InputGroup, Card, TextArea, Label
} from '@blueprintjs/core';

import { post } from '../helper/api';

import FileUploader from '../components/FileUploader';

import { INPUTS } from '../constants';

const defaultFormState = {
  shipFrom: '',
  shipTo: '',
  transport: '',
  description: ''
};

const TransportRequestForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [files, setFiles] = useState([]);
  const [shipmentRequest, requestShipment] = post('requestShipment')();
  const [documentsRequest, uploadDocs] = post('uploadDocuments')();

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
          <Label>ContractId: {dialogIsOpen.item.contractId}</Label>
          {INPUTS.TRANSPORT_REQUEST.map(({
            label, type, placeholder, field
          }) => (
            <FormGroup key={label} label={label}>
              <InputGroup
                type={type}
                placeholder={placeholder}
                value={formState[field]}
                onChange={({ target }) => setFormState(
                  Object.assign({}, formState, {
                    [field]: target.value
                  })
                )
                }
              />
            </FormGroup>
          ))}
          <Label>
            Description
            <TextArea
              growVertically={true}
              value={formState.description}
              onChange={(e) => {
                setFormState(
                  Object.assign({}, formState, {
                    description: e.target.value
                  })
                );
              }}
            />
          </Label>

          {/* <FileInput
            text={formState.file}
            onInputChange={(e) => {
              console.log(e.target.files[0]);
              setFormState(
                Object.assign({}, formState, {
                  file: e.target.files[0].name
                })
              );
            }}
          /> */}
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
                setFormState(defaultFormState);
                setFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              large
              intent="primary"
              onClick={() => {
                setDialogOpenState({
                  state: false,
                  item: {}
                });
                requestShipment(
                  Object.assign({ contractId: dialogIsOpen.item.contractId }, formState)
                );
                setFormState(defaultFormState);

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
        </Card>
      </div>
    </Overlay>
  );
};

export default TransportRequestForm;

TransportRequestForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};
