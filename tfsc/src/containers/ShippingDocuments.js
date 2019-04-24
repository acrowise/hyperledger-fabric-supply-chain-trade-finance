import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch, useAsyncEndpoint } from '../hooks';

import GenerateProofForm from './GenerateProofForm';
import ConfirmShipmentForm from './ConfirmShipmentForm';
import ShipmentDetailPage from './ShipmentDetailPage';

const ShippingDocuments = ({ role, content, setContent }) => {
  const [selectedShipment, setSelectedShipment] = useState({});
  const [shipment, showShipmentDetail] = useState(content);
  const [confirmDialogIsOpen, setConfirmDialogOpenState] = useState(false);

  const [shipments, loading, setData] = useFetch('shipments');
  const [gpDialogIsOpen, setGpDialogOpenState] = useState(false);

  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'shipmentConfirmed') {
      const newState = shipments.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.contractId === notification.contractId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
    }

    if (notification.type === 'shipmentRequested') {
      const newState = shipments.concat(notification);
      setData(newState);
    }
  };

  useSocket('notification', onNotification);

  return shipment ? (
    <ShipmentDetailPage
      showShipmentDetail={showShipmentDetail}
      setContent={setContent}
      {...shipment}
    />
  ) : (
    <div>
      <GenerateProofForm dialogIsOpen={gpDialogIsOpen} setDialogOpenState={setGpDialogOpenState} />
      <ConfirmShipmentForm
        dialogIsOpen={confirmDialogIsOpen}
        setDialogOpenState={setConfirmDialogOpenState}
        shipment={selectedShipment}
      />
      {/* {role === 'supplier' ? (
        <Button
          icon="add"
          onClick={() => {
            setTsrDialogOpenState(true);
          }}
        >
          New Shipment
        </Button>
      ) : (
        <></>
      )} */}
      <table className="bp3-html-table .modifier">
        <thead>
          <tr>
            <th>Contarct ID</th>
            <th>From</th>
            <th>To</th>
            <th>Transport</th>
            <th>Status</th>
            {role === 'transporter' || role === 'supplier' ? <th>Action</th> : <></>}
          </tr>
        </thead>
        <tbody>
          {shipments.map(s => (
            <tr
              onClick={() => {
                showShipmentDetail(s);
                setContent(s);
              }}
              key={s.contractId}
            >
              <td>{s.contractId}</td>
              <td>{s.shipFrom}</td>
              <td>{s.shipTo}</td>
              <td>{s.transport}</td>
              <td>{s.state}</td>
              {role === 'transporter' && s.state === 'Requested' ? (
                <td>
                  <div>
                    <Button
                      onClick={(e) => {
                        setSelectedShipment(s);
                        setConfirmDialogOpenState(true);
                        e.stopPropagation();
                      }}
                      style={{ marginRight: '5px' }}
                      intent="primary"
                    >
                      Confirm
                    </Button>
                    {/* <Button intent="danger">Decline</Button> */}
                  </div>
                </td>
              ) : (
                <></>
              )}
              {role === 'supplier' && s.state === 'Confirmed' ? (
                <td>
                  <div>
                    <Button
                      onClick={(e) => {
                        setSelectedShipment(s);
                        setGpDialogOpenState(true);
                        e.stopPropagation();
                      }}
                      style={{ marginRight: '5px' }}
                      intent="primary"
                    >
                      Generate Proof
                    </Button>
                    {/* <Button intent="danger">Decline</Button> */}
                  </div>
                </td>
              ) : (
                <></>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShippingDocuments;

ShippingDocuments.propTypes = {
  role: PropTypes.string
};
