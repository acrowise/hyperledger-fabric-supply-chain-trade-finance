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
  const [hash, setHash] = useState(null);
  const [shipmentRes, confirmShipment, reset] = post('confirmShipment')();
  const [fileRequired, setFileRequired] = useState(false);

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
    contractID: 'Contract ID',
    shipFrom: 'From',
    shipTo: 'To',
    transport: 'Transport'
  };

  const ids = ['id', 'contractID'];

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
          <ActionCompleted res={shipmentRes} action="Shipment" result="Comfirmed" />
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
                      large={true}
                      value={shipment.description}
                      disabled
                    />
                  </Label>
                  <Label className="col-6 margin-right-auto">
                    Upload Bill of Lading
                    <div style={{ marginTop: 5 }}>
                      <FileUploader
                        files={files}
                        setFiles={setFiles}
                        hash={hash}
                        setHash={setHash}
                        error={fileRequired}
                      />
                    </div>
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
                    setFileRequired(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  large
                  intent="primary"
                  className="btn-modal"
                  onClick={() => {
                    if (files.length === 0) {
                      setFileRequired(true);
                    } else {
                      confirmShipment({
                        fcn: 'confirmShipment',
                        args: [shipment.id, '0', '0', '0', '0', '0', hash.hash, hash.type, 'Bill of Lading']
                      });
                      setFileRequired(false);
                      setFiles([]);
                      setHash(null);
                    }
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
