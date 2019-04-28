import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Overlay, Card } from '@blueprintjs/core';

import FileUploader from '../components/FileUploader';

import { post } from '../helper/api';

const ConfirmDeliveryForm = ({ dialogIsOpen, setDialogOpenState, shipment }) => {
  const [files, setFiles] = useState([]);
  const [deliveryRes, confirmDelivery] = post('confirmDelivery')();
  const [documentsRes, uploadDocs] = post('uploadDocument')();

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
              intent="primary"
              onClick={() => {
                setDialogOpenState(false);
                confirmDelivery({ shipmentId: shipment.shipmentId });

                const form = new FormData();
                files.forEach((f) => {
                  form.append('file', f);
                });
                uploadDocs(form);
                setFiles([]);
              }}
            >
              Confirm Shipment
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
