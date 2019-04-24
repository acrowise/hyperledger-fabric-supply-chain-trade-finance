import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Overlay, Card } from '@blueprintjs/core';

import { post } from '../helper/api';


import FileUploader from '../components/FileUploader';

const ValidateProofForm = ({ dialogIsOpen, setDialogOpenState, proof }) => {
  const [files, setFiles] = useState([]);
  const [shipmentRequest, validateProof] = post('validateProof')();
  const [documentsRequest, uploadDocs] = post('uploadDocuments')();

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
