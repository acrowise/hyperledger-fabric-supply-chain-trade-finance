import React, { useState, useReducer } from 'react';
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

import { formReducer } from '../../reducers';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

const ValidateProof = ({
  dialogIsOpen, setDialogOpenState, proof, role, type
}) => {
  const [files, setFiles] = useState([]);
  const [hash, setHash] = useState(null);
  const [verifyProofRes, verifyProof, resetVerifyProofRes] = post('verifyProof')();

  const [fileRequired, setFileRequired] = useState(false);

  const initialState = { description: '' };

  const [formState, dispatch] = useReducer(formReducer, initialState);

  if (!proof || !proof.dataForVerification) {
    return <></>;
  }

  if (!verifyProofRes.pending) {
    if (verifyProofRes.complete) {
      setTimeout(() => {
        setDialogOpenState(false);
        resetVerifyProofRes();
      }, 1500);
    }
  }

  const requestedInputs = {};
  const requestedFields = proof.dataForVerification.ipk.attribute_names;
  requestedFields.forEach((item, index) => {
    if (proof.dataForVerification.attributeValues[index].length > 0) {
      requestedInputs[item] = proof.dataForVerification.attributeValues[index];
    }
  });

  const documentsToVerify = [];
  const documentsTypes = ['Bill of Lading', 'Packing List', 'CMSP Report', 'DMSP Report'];

  Object.keys(requestedInputs).forEach((input) => {
    if (documentsTypes.includes(input)) {
      documentsToVerify.push({
        hash: requestedInputs[input],
        type: input
      });
    }
  });

  const handleOverlayClose = () => {
    setDialogOpenState(false);
    setHash(null);
    setFiles([]);
  };

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
          {verifyProofRes.pending || verifyProofRes.complete || verifyProofRes.data ? (
            <ActionCompleted res={verifyProofRes} action="Proof" result="Verified" />
          ) : (
            <>
              <div className="modal-header">
                {type === 'update'
                  ? 'Update Report'
                  : `Verify ${role === 'uscts' ? 'Commercial Trade' : 'Goods'}`}
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-6">
                    {Object.keys(requestedInputs).map((field) => {
                      if (field === 'contractId') {
                        return (
                          <FormGroup className="form-group-horizontal" label="Contract ID">
                            <InputGroup disabled value={cropId(requestedInputs[field])} />
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
                                value={format(parseInt(requestedInputs[field], 10), 'DD MMM YYYY')}
                              />
                            </FormGroup>
                          );
                        }
                        return (
                          <FormGroup className="form-group-horizontal" label={proofField.label}>
                            <InputGroup disabled value={requestedInputs[field]} />
                          </FormGroup>
                        );
                      }
                      return <></>;
                    })}
                    {documentsToVerify.map((d, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'row', margin: '5px' }}>
                        <Icon name="proof-document" />
                        <a
                          style={{ marginLeft: '10px', marginTop: '2px', color: '#1B263C' }}
                          href={`/getDocument?hash=${d.hash}&type=1`} // FIXME: type
                          target="_blank"
                        >
                          {d.type}
                        </a>
                      </div>
                    ))}
                    <br />
                  </div>
                  <div className="col-6">
                    <FormGroup className="form-group-horizontal" label="Shipment number">
                      <InputGroup disabled value={cropId(proof.shipmentID)} />
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
                        style={{ width: '240px' }}
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
                          verifyProof({
                            fcn: 'verifyProof',
                            args: [
                              proof.id,
                              '1',
                              formState.description,
                              hash.hash,
                              hash.type,
                              `${role.toUpperCase()} Report`
                            ]
                          });
                          // setDialogOpenState(false);
                          setFileRequired(false);
                          setHash(null);
                          setFiles([]);
                          dispatch({ type: 'reset', payload: initialState });
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
                          verifyProof({
                            fcn: 'verifyProof',
                            args: [
                              proof.id,
                              '2',
                              formState.description, // FIXME: add description
                              hash.hash,
                              hash.type,
                              `${role.toUpperCase()} Report`
                            ]
                          });
                          // setDialogOpenState(false);
                          setFileRequired(false);
                          setHash(null);
                          setFiles([]);
                          dispatch({ type: 'reset', payload: initialState });
                        }
                      }}
                    >
                      {role === 'uscts' ? 'Trade ' : 'Goods'} prohibited
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </Overlay>
  );
};

export default ValidateProof;

ValidateProof.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func,
  proof: PropTypes.object,
  role: PropTypes.string,
  type: PropTypes.string
};
