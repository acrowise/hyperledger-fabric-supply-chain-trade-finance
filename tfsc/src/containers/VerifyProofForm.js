import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Overlay, Card } from '@blueprintjs/core';

import { useAsyncEndpoint } from '../hooks';

import FileUploader from '../components/FileUploader';

const validateProofRequest = () => useAsyncEndpoint(data => ({
  url: 'http://localhost:3000/validateProof',
  method: 'POST',
  data
}));

const postUploadDocumentsRequest = () => useAsyncEndpoint(data => ({
  url: 'http://localhost:3000/uploadDocuments',
  method: 'POST',
  data
}));

const ValidateProofForm = ({ dialogIsOpen, setDialogOpenState, proof }) => {
  const [files, setFiles] = useState([]);
  const [shipmentRequest, validateProof] = validateProofRequest();
  const [documentsRequest, uploadDocs] = postUploadDocumentsRequest();

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
          <p>Upload Bill of Lading</p>
          <FileUploader files={files} setFiles={setFiles} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              large
              intent="danger"
              onClick={() => {
                setDialogOpenState(false);
              }}
            >
              Cancel
            </Button>
            <Button
              large
              intent="primary"
              onClick={() => {
                setDialogOpenState(false);
                validateProof({ proofId: proof.proofId });

                const form = new FormData();
                files.forEach((f) => {
                  form.append('file', f);
                });
                uploadDocs(form);
              }}
            >
              Validate
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

export default ValidateProofForm;

ValidateProofForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};
