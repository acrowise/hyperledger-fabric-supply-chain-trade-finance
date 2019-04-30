import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Overlay, Card } from '@blueprintjs/core';

import FileUploader from '../../components/FileUploader';

import { post } from '../../helper/api';

import ActionCompleted from '../../components/ActionCompleted';

const ConfirmShipmentForm = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
  const [files, setFiles] = useState([]);
  const [shipmentRes, confirmShipment, reset] = post('confirmShipment')();
  const [, uploadDocs] = post('uploadDocument')();

  if (!shipmentRes.pending) {
    if (shipmentRes.complete) {
      setTimeout(() => {
        setDialogOpenState(false);
        reset();
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
        <Card style={{ width: '20vw' }}>
          <ActionCompleted res={shipmentRes} action="Shipment Confirmed" result="Accepted" />
          {!shipmentRes.pending && !shipmentRes.complete && !shipmentRes.data ? (
            <>
              <p>ShipmentId: {shipment.shipmentId}</p>
              <p>ContractId: {shipment.contractId}</p>
              <p>From: {shipment.shipFrom}</p>
              <p>To: {shipment.shipTo}</p>
              <p>Transport: {shipment.transport}</p>
              <p>Description: {shipment.description}</p>
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
                    confirmShipment({ shipmentId: shipment.shipmentId });

                    const form = new FormData();
                    files.forEach((f) => {
                      form.append('file', f);
                    });
                    uploadDocs(form);
                  }}
                >
                  Confirm Shipment
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
