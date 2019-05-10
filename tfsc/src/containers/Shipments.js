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

    if (notification.type === 'shipmentConfirmed') {
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
            state: STATUSES.SHIPMENT[notification.data.value.state],
            events: notification.data.value.events
          })
        );
      }
    }

    if (notification.type === 'shipmentRequested') {
      const newState = shipments.result.concat(notification);
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
