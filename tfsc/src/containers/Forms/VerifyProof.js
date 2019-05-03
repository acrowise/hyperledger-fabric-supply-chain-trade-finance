import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, Card, Label, TextArea
} from '@blueprintjs/core';

import { post } from '../../helper/api';

import FileUploader from '../../components/FileUploader';

const ValidateProof = ({ dialogIsOpen, setDialogOpenState, proof }) => {
  const [files, setFiles] = useState([]);
  const [, validateProof] = post('validateProof')();
  const [, uploadDocs] = post('uploadDocuments')();

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
          <p>ContractId: {proof.contractId}</p>
          <p>Consignor: {proof.consignor}</p>
          <p>Consignee: {proof.consignee}</p>
          <p>Shipment number: {proof.shipmentId}</p>
          {proof.documents ? proof.documents.map(i => <p key={i}>{i}</p>) : <></>}
          <Label>
            Description
            <TextArea
              growVertically={true}
              // onChange={({ target: { value } }) => dispatch({
              //   type: 'change',
              //   payload: {
              //     field: 'description',
              //     value
              //   }
              // })
              // }
            />
          </Label>
          <FileUploader files={files} setFiles={setFiles} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
              Trade permitted
            </Button>
            <Button
              large
              intent="danger"
              onClick={() => {
                setDialogOpenState(false);
              }}
            >
              Trade prohibited
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

export default ValidateProof;

ValidateProof.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};
