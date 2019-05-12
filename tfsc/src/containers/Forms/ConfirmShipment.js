import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, Card, Label, InputGroup, TextArea
} from '@blueprintjs/core';

import FileUploader from '../../components/FileUploader';
import { cropId } from '../../helper/utils';
import { post } from '../../helper/api';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

const ConfirmShipmentForm = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
  const [files, setFiles] = useState([]);
  const [shipmentRes, confirmShipment, reset] = post('confirmShipment')();
  const [, uploadDocs] = post('uploadDocuments')();

  if (!shipmentRes.pending) {
    if (shipmentRes.complete) {
      setTimeout(() => {
        setDialogOpenState(false);
        reset();
      }, 1500);
    }
  }

  const fields = {
    id: 'Shipment ID',
    contractId: 'Contract ID',
    shipmentFrom: 'From',
    shipmentTo: 'To',
    transport: 'Transport'
  };

  const ids = ['id', 'contractId'];

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
        <Card className="modal" style={{ width: '720px' }}>
          <ActionCompleted res={shipmentRes} action="Shipment Confirmed" result="Accepted" />
          {!shipmentRes.pending && !shipmentRes.complete && !shipmentRes.data ? (
            <>
              <div className="modal-header">Confirm Shipment</div>
              <div className="modal-body">
                <div className="row">
                  {Object.keys(fields).map(field => (
                    <Label className="col-6" key={field}>
                      {fields[field]}
                      <InputGroup
                        type="text"
                        value={ids.includes(field) ? cropId(shipment[field]) : shipment[field]}
                        disabled
                      />
                    </Label>
                  ))}
                  <Label className="col-6">
                    Description
                    <TextArea
                      growVertically={true}
                      large={true}
                      value={shipment.description}
                      disabled
                    />
                  </Label>
                  <Label className="col-6">
                    Upload Bill of Lading
                    <FileUploader files={files} setFiles={setFiles} />
                  </Label>
                </div>
              </div>
              <div className="modal-footer">
                <Button
                  large
                  intent="none"
                  className="btn-modal btn-default"
                  onClick={() => {
                    setDialogOpenState(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  large
                  intent="primary"
                  className="btn-modal"
                  onClick={() => {
                    confirmShipment({
                      fcn: 'confirmShipment',
                      args: [shipment.id]
                    });
                    setTimeout(() => {
                      const form = new FormData();
                      form.append('contractId', shipment.contractId);
                      form.append('type', 'Bill of Lading');
                      files.forEach((f) => {
                        form.append('file', f);
                      });
                      uploadDocs(form);
                    }, 600);
                  }}
                >
                  Confirm
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

export default ConfirmShipmentForm;

ConfirmShipmentForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};
