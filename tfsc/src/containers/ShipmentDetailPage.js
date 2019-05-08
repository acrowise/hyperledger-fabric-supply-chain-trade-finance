import React, { useState } from 'react';
import { Icon, Button } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import GenerateProofForm from './Forms/GenerateProof';
import ConfirmDeliveryForm from './Forms/ConfirmDelivery';
import Proofs from '../components/Proofs';
import Timeline from '../components/Timeline/Timeline';
import CollapsiblePanel from '../components/CollapsiblePanel/CollapsiblePanel';

import ConfirmShipmentForm from './Forms/ConfirmShipment';

const EVENTS = [
  {
    id: 1,
    date: '10 april 2019',
    action: 'ShipmentConfirmed',
    user: 'Supplier'
  },
  {
    id: 2,
    date: '20 april 2019',
    action: 'ShipmentConfirmed',
    user: 'Supplier'
  },
  {
    id: 3,
    date: '23 april 2019',
    action: 'ShipmentConfirmed',
    user: 'Supplier'
  },
  {
    id: 4,
    date: '25 april 2019',
    action: 'ShipmentConfirmed',
    user: 'Supplier'
  },
  {
    id: 5,
    date: '28 april 2019',
    action: 'ShipmentConfirmed',
    user: 'Supplier'
  }
];

const HISTORY = [
  {
    id: 'VGUIX234',
    date: '10 april 2019',
    action: 'Create Shipment',
    type: 'Commercial Invoices'
  },
  {
    id: 'VGUIX235',
    date: '10 april 2019',
    action: 'Create Shipment',
    type: 'Commercial Invoices'
  },
  {
    id: 'VGUIX236',
    date: '10 april 2019',
    action: 'Create Shipment',
    type: 'Commercial Invoices'
  }
];

const ShipmentDetailPage = (props) => {
  // const [data, loading] = useFetch('documents');
  const [proofs, loadingProofs, setData] = useFetch('listProofs');

  const [gpDialogIsOpen, setGpDialogOpenState] = useState(false);
  const [cdDialogIsOpen, setCdDialogOpenState] = useState(false);
  const [csDialogIsOpen, setCsDialogOpenState] = useState(false);

  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'generateProof') {
      const newState = proofs.concat(notification);
      setData(newState);
    }

    if (notification.type === 'validateProof') {
      const newState = proofs.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.proofId === notification.proofId);
      newState[itemToUpdateIndex] = notification;
      setData(newState);
    }
  };

  useSocket('notification', onNotification);

  return (
    <div>
      <ConfirmShipmentForm
        dialogIsOpen={csDialogIsOpen}
        setDialogOpenState={setCsDialogOpenState}
        shipment={props}
      />
      <GenerateProofForm dialogIsOpen={gpDialogIsOpen} setDialogOpenState={setGpDialogOpenState} />
      <ConfirmDeliveryForm
        dialogIsOpen={cdDialogIsOpen}
        setDialogOpenState={setCdDialogOpenState}
        shipment={props}
      />
      <div
        style={{ display: 'flex', flexDirection: 'row' }}
        onClick={() => {
          props.showShipmentDetail(null);
          props.setContent(false);
        }}
      >
        <Icon icon="arrow-left" />
        <p>Back</p>
      </div>

      <div className="layout-container">
        <div className="layout-main">
          <h3>Shipment Number: {props.id.slice(0, 7).toUpperCase()}</h3>
          {props.role === 'buyer' ? (
            <div>
              <Button
                intent="primary"
                onClick={() => {
                  setCdDialogOpenState(true);
                }}
              >
                Confirm Delivery
              </Button>
              {/* <Button>Cancel Delivery</Button> */}
            </div>
          ) : (
            <></>
          )}
          {props.role === 'transporter' && props.state === 'Requested' ? (
            <div>
              <Button
                intent="primary"
                onClick={() => {
                  setCsDialogOpenState(true);
                }}
              >
                Confirm Shipment
              </Button>
            </div>
          ) : (
            <></>
          )}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ship From</th>
                  <th>Ship To</th>
                  <th>Due Date</th>
                  <th>Vehicle/Transport</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{props.shipmentFrom}</td>
                  <td>{props.shipmentTo}</td>
                  <td>{new Date().toISOString()}</td>
                  <td>{props.transport}</td>
                  <td>{props.state}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Timeline events={EVENTS} />
          <CollapsiblePanel history={HISTORY} />
        </div>

        <div className="layout-aside">
          {props.state === 'Confirmed' && props.role === 'supplier' && (
            <Button
              onClick={(e) => {
                setGpDialogOpenState(true);
                e.stopPropagation();
              }}
              intent="primary"
              className="btn-generate-proof"
            >
              Generate Proof &nbsp;&nbsp;&nbsp;
              <Icon icon="confirm" />
            </Button>
          )}

          {proofs.length > 0 && (
            <div>{loadingProofs ? <div>Loading...</div> : <Proofs data={proofs} />}</div>
          )}

          <div className="sidebar-panel">
            <div className="sidebar-panel-header">
              <h4>Documents</h4>
            </div>
            <div className="sidebar-panel-body">
              {/* {loading ? (
                <div>Loading...</div>
              ) : ( */}
              {props.documents
                && props.documents.map((doc, i) => (
                  <div key={i.toString()} style={{ display: 'flex', flexDirection: 'row' }}>
                    <Icon icon="document" />
                    <div style={{ marginLeft: '10px' }}>{doc}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailPage;
