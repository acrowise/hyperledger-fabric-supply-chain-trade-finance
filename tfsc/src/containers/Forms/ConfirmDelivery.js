import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, Card, TextArea, FormGroup, Label
} from '@blueprintjs/core';

import FileUploader from '../../components/FileUploader';

import { post } from '../../helper/api';

const ConfirmDeliveryForm = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
  const [files, setFiles] = useState([]);
  const [, confirmDelivery] = post('confirmDelivery')();
  const [, uploadDocs] = post('uploadDocument')();

  const [fileRequired, setFileRequired] = useState(false);

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
          <div className="modal-header">Upload Delivery Acceptance Form</div>

          {/* <p>ShipmentId: {shipment.shipmentId}</p> */}
          {/* <p>ContractId: {shipment.contractId}</p> */}
          {/* <p>From: {shipment.shipFrom}</p> */}
          {/* <p>To: {shipment.shipTo}</p> */}
          {/* <p>Transport: {shipment.transport}</p> */}
          {/* <p>Description: {shipment.description}</p> */}

          <div className="modal-body">
            <Label>
              <div style={{ marginBottom: 5 }}>Delivery Acceptance Form</div>
              <FileUploader withPreview files={files} setFiles={setFiles} error={fileRequired} />
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
                    args: [shipment.id, '0', '0', '0', '0', '0']
                  });
                  setFileRequired(false);

                  setTimeout(() => {
                    const form = new FormData();
                    form.append('type', 'Delivery Acceptance Form');
                    form.append('contractId', shipment.contractId);
                    files.forEach((f) => {
                      form.append('file', f);
                    });
                    uploadDocs(form);
                    setFiles([]);
                    setDialogOpenState(false);
                  }, 600);
                }
              }}
            >
              Submit
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

export default ConfirmDeliveryForm;

ConfirmDeliveryForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};
