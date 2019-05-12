import React, { useState } from 'react';
import PropTypes from 'prop-types';
// import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import ShipmentDetailPage from './ShipmentDetailPage';

import Table from '../components/Table/Table';

import { TABLE_MAP, STATUSES } from '../constants';

const Shipments = ({ role, content, setContent }) => {
  // const [selectedShipment, setSelectedShipment] = useState({});
  const [shipment, showShipmentDetail] = useState(content);
  const [shipments, loading, setData] = useFetch('shipments');

  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'shipmentConfirmed' || notification.type === 'shipmentDelivered') {
      const newState = shipments.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.data.key.id);
      newState[itemToUpdateIndex] = notification.data;
      setData({ result: newState });
      if (
        shipment
        && shipment.state !== shipments.result.find(i => i.key.id === shipment.id).state
      ) {
        showShipmentDetail(
          Object.assign({}, notification.data.value, {
            id: notification.data.key.id,
            state: STATUSES.SHIPMENT[notification.data.value.state]
          })
        );
      }
    }

    if (notification.type === 'proofGenerated' || notification.type === 'validateProof') {
      const newState = shipments.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.shipment.key.id);
      newState[itemToUpdateIndex] = notification.shipment;
      setData({ result: newState });

      showShipmentDetail(
        Object.assign({}, notification.shipment.value, {
          id: notification.shipment.key.id,
          state: STATUSES.SHIPMENT[notification.shipment.value.state]
        })
      );
    }

    if (notification.type === 'shipmentRequested') {
      const newState = shipments.result.concat(notification);
      setData({ result: newState });
    }

    if (notification.type === 'documentUploaded') {
      const newState = shipments.result.concat([]);
      const itemToUpdate = newState.find(i => i.key.id === notification.event.shipmentId);
      itemToUpdate.value.documents.push(notification.data);
      itemToUpdate.value.events.push(notification.event);
      setData({ result: newState });
    }
  };

  useSocket('notification', onNotification);

  let dataToDisplay = shipments.result;

  if (dataToDisplay) {
    dataToDisplay = dataToDisplay.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.SHIPMENT[i.value.state] }));
  }

  if (loading) {
    return <>Loading...</>;
  }

  return shipment ? (
    <ShipmentDetailPage
      showShipmentDetail={showShipmentDetail}
      setContent={setContent}
      {...shipment}
      role={role}
    />
  ) : (
    <div>
      <Table
        fields={TABLE_MAP.SHIPMENTS}
        data={dataToDisplay}
        onSelect={(item) => {
          setContent(item);
        }}
      />
    </div>
  );
};

export default Shipments;

Shipments.propTypes = {
  role: PropTypes.string
};
