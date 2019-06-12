import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, Card, TextArea, FormGroup, Label
} from '@blueprintjs/core';

import FileUploader from '../../components/FileUploader';
import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

import { post } from '../../helper/api';

const ConfirmDeliveryForm = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
  const [files, setFiles] = useState([]);
  const [hash, setHash] = useState(null);
  const [confirmDeliveryRes, confirmDelivery, resetConfirmDelivery] = post('confirmDelivery')();

  const [fileRequired, setFileRequired] = useState(false);

  if (!confirmDeliveryRes.pending) {
    if (confirmDeliveryRes.complete) {
      setTimeout(() => {
        setDialogOpenState(false);
        resetConfirmDelivery();
      }, 1500);
    }
  }

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
        <Card className="modal" style={{ width: '600px' }}>
          {confirmDeliveryRes.pending || confirmDeliveryRes.complete || confirmDeliveryRes.data ? (
            <ActionCompleted res={confirmDeliveryRes} action="Shipment" result="Delivered" />
          ) : (
            <>
              <div className="modal-header">Upload Delivery Acceptance Form</div>
              <div className="modal-body">
                <Label>
                  <div style={{ marginBottom: 5 }}>Delivery Acceptance Form</div>
                  <FileUploader
                    withPreview
                    files={files}
                    setFiles={setFiles}
                    hash={hash}
                    setHash={setHash}
                    error={fileRequired}
                  />
                  <FormGroup label="Description">
                    <TextArea growVertically={true} large={true} />
                  </FormGroup>
                </Label>
              </div>
              <div className="modal-footer">
                <Button
                  large
                  intent="none"
                  className="btn-modal btn-default"
                  onClick={() => {
                    setDialogOpenState(false);
                    setFileRequired(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  large
                  className="btn-modal"
                  intent="primary"
                  onClick={() => {
                    if (files.length === 0) {
                      setFileRequired(true);
                    } else {
                      confirmDelivery({
                        fcn: 'confirmDelivery',
                        args: [
                          shipment.id,
                          '0',
                          '0',
                          '0',
                          '0',
                          '0',
                          hash.hash,
                          hash.type,
                          'Delivery Acceptance Form'
                        ]
                      });
                      setFileRequired(false);
                      setFiles([]);
                      setHash(null);
                      // setDialogOpenState(false);
                    }
                  }}
                >
                  Submit
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </Overlay>
  );
};

export default ConfirmDeliveryForm;

ConfirmDeliveryForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func,
  shipment: PropTypes.object
};
