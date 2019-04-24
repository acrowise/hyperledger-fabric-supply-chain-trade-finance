import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, FormGroup, InputGroup, Card, TextArea, Label
} from '@blueprintjs/core';

import { useAsyncEndpoint } from '../hooks';

import FileUploader from '../components/FileUploader';

const defaultFormState = {
  shipFrom: '',
  shipTo: '',
  transport: '',
  description: '',
  file: 'Choose file...'
};

const postShipmentRequest = () => useAsyncEndpoint(data => ({
  url: 'http://localhost:3000/requestShipment',
  method: 'POST',
  data
}));

const postUploadDocumentsRequest = () => useAsyncEndpoint(data => ({
  url: 'http://localhost:3000/uploadDocuments',
  method: 'POST',
  data
}));

const TransportRequestForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [files, setFiles] = useState([]);
  const [shipmentRequest, requestShipment] = postShipmentRequest();
  const [documentsRequest, uploadDocs] = postUploadDocumentsRequest();

  const FORM_FIELDS = [
    {
      label: 'Ship From',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'shipFrom'
    },
    {
      label: 'Ship To',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'shipTo'
    },
    {
      label: 'Transport',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'transport'
    }
    // {
    //   label: 'Description',
    //   placeholder: 'Placeholder text',
    //   type: 'text',
    //   field: 'description'
    // }
  ];

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
          {FORM_FIELDS.map(({
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
                setDialogOpenState(false);
                setFormState(defaultFormState);
              }}
            >
              Cancel
            </Button>
            <Button
              large
              intent="primary"
              onClick={() => {
                setDialogOpenState(false);
                requestShipment(formState);
                setFormState(defaultFormState);

                const form = new FormData();
                files.forEach((f) => {
                  form.append('file', f);
                });
                uploadDocs(form);
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
