import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, Card, Label, TextArea, FormGroup, InputGroup
} from '@blueprintjs/core';

import { format } from 'date-fns';

import { post } from '../../helper/api';
import { cropId } from '../../helper/utils';
import FileUploader from '../../components/FileUploader';

import Icon from '../../components/Icon/Icon';

import { INPUTS } from '../../constants';

const ValidateProof = ({
  dialogIsOpen, setDialogOpenState, proof, role, type
}) => {
  const [files, setFiles] = useState([]);
  const [hash, setHash] = useState(null);
  const [, verifyProof] = post('verifyProof')();

  const [fileRequired, setFileRequired] = useState(false);

  if (!proof || !proof.dataForVerification) {
    return <></>;
  }

  const requestedFields = proof.dataForVerification.ipk.attribute_names;
  const requestedInputs = [];
  // const requestedDocs = proof.documents;

  requestedFields.forEach((f) => {
    if (INPUTS.GENERATE_PROOF.find(i => i.field === f)) {
      requestedInputs.push(f);
    }
  });

  const handleOverlayClose = () => setDialogOpenState(false);

  return (
    <Overlay usePortal isOpen={dialogIsOpen} onClose={handleOverlayClose}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '720px' }}>
          <div className="modal-header">
            {type === 'update'
              ? 'Update Report'
              : `Verify ${role === 'uscts' ? 'Commercial Trade' : 'Goods'}`}
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-6">
                {requestedInputs.map((field) => {
                  if (field === 'contractId') {
                    return (
                      <FormGroup className="form-group-horizontal" label="Contract ID">
                        <InputGroup disabled value={''} />
                        {/* cropId(proof.contract.key.id) */}
                      </FormGroup>
                    );
                  }
                  const proofField = INPUTS.GENERATE_PROOF.find(i => i.field === field);
                  if (proofField) {
                    if (field === 'dueDate' || field === 'paymentDate') {
                      return (
                        <FormGroup className="form-group-horizontal" label={proofField.label}>
                          <InputGroup
                            disabled
                            value={''} // format(proof.contract.value[field], 'DD MMM YYYY')
                          />
                        </FormGroup>
                      );
                    }
                    return (
                      <FormGroup className="form-group-horizontal" label={proofField.label}>
                        <InputGroup disabled value={''} />
                        {/* proof.contract.value[field] */}
                      </FormGroup>
                    );
                  }
                  return <></>;
                })}
                {/* {requestedDocs.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'row', margin: '5px' }}>
                    <Icon name="proof-document" />
                    <a
                      style={{ marginLeft: '10px', marginTop: '2px', color: '#1B263C' }}
                      href={`/getDocument?contractId=${d.contractId}&name=${d.name}`}
                      target="_blank"
                    >
                      {d.type}
                    </a>
                  </div>
                ))} */}
                <br />
              </div>
              <div className="col-6">
                <FormGroup className="form-group-horizontal" label="Shipment number">
                  <InputGroup disabled value={cropId(proof.shipmentId)} />
                </FormGroup>
                <Label>Add report</Label>
                <FileUploader
                  files={files}
                  setFiles={setFiles}
                  hash={hash}
                  setHash={setHash}
                  error={fileRequired}
                />
                <Label>
                  Description
                  <TextArea
                    value={proof.description}
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
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {type === 'update' ? (
              <Button large intent="primary" className="btn-modal" onClick={handleOverlayClose}>
                Update Report
              </Button>
            ) : (
              <>
                <Button
                  large
                  intent="primary"
                  className="btn-modal"
                  onClick={() => {
                    if (files.length === 0) {
                      setFileRequired(true);
                    } else {
                      setDialogOpenState(false);
                      setFileRequired(false);
                      verifyProof({
                        fcn: 'verifyProof',
                        args: [
                          proof.id,
                          '1',
                          '', // FIXME: add description
                          hash.hash,
                          hash.type
                        ]
                      });
                    }
                  }}
                >
                  {role === 'uscts' ? 'Trade permitted' : 'Goods approved'}
                </Button>
                <Button
                  large
                  intent="none"
                  className="btn-modal btn-default"
                  onClick={() => {
                    if (files.length === 0) {
                      setFileRequired(true);
                    } else {
                      setDialogOpenState(false);
                      setFileRequired(false);
                      verifyProof({
                        fcn: 'verifyProof',
                        args: [
                          proof.id,
                          '2',
                          '', // FIXME: add description
                          hash.hash,
                          hash.type
                        ]
                      });
                    }
                  }}
                >
                  {role === 'uscts' ? 'Trade ' : 'Goods'} prohibited
                </Button>
              </>
            )}
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
