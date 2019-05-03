import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import ShipmentDetailPage from './ShipmentDetailPage';

import Table from '../components/Table/Table';

import { TABLE_MAP } from '../constants';

const ShippingDocuments = ({ role, content, setContent }) => {
  const [selectedShipment, setSelectedShipment] = useState({});
  const [shipment, showShipmentDetail] = useState(content);

  const [shipments, loading, setData] = useFetch('shipments');

  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'shipmentConfirmed') {
      const newState = shipments.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.shipmentId === notification.shipmentId);
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
      role={role}
    />
  ) : (
    <div>
      <Table
        fields={TABLE_MAP.SHIPMENTS}
        data={shipments}
        onSelect={(item) => {
          setContent(item);
        }}
      />
    </div>
  );
};

export default ShippingDocuments;

ShippingDocuments.propTypes = {
  role: PropTypes.string
};
