import React, { useState } from 'react';
import { Icon, Button } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { format } from 'date-fns';

import { get } from '../helper/api';

import { cropId } from '../helper/utils';

import GenerateProofForm from './Forms/GenerateProof';
import ConfirmDeliveryForm from './Forms/ConfirmDelivery';
import Proofs from '../components/Proofs';
import Timeline from '../components/Timeline/Timeline';
import CollapsiblePanel from '../components/CollapsiblePanel/CollapsiblePanel';

import ConfirmShipmentForm from './Forms/ConfirmShipment';

import Icons from '../components/Icon/Icon';

import { EVENTS_MAP } from '../constants';

const ShipmentDetailPage = ({
  role, shipment, showShipmentDetail, setContent
}) => {
  const [proofs, loadingProofs, setData] = get('listProofs'); // ?id=${shipment.id} FIXME:

  const [gpDialogIsOpen, setGpDialogOpenState] = useState(false);
  const [cdDialogIsOpen, setCdDialogOpenState] = useState(false);
  const [csDialogIsOpen, setCsDialogOpenState] = useState(false);

  const [docs, setDocs] = useState(shipment.documents);
  const [events, setEvents] = useState(
    shipment.timeline
      ? Object.keys(shipment.timeline)
        .reduce((res, value) => {
          if (shipment.timeline[value]) {
            return res.concat(shipment.timeline[value]);
          }
          return res.concat([]);
        }, [])
        .map(({ key, value }) => ({
          id: value.eventId || key.id,
          date: value.timestamp,
          action: EVENTS_MAP[value.action],
          user: value.creator
        }))
      : []
  );
  const updateEvents = (notification) => {
    const newEvents = events.concat([
      {
        id: notification.data.value.eventId || notification.data.key.id,
        date: notification.data.value.timestamp,
        action: EVENTS_MAP[notification.type],
        user: notification.data.value.creator
      }
    ]);
    setEvents(newEvents);
  };

  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'generateProof') {
      const newState = proofs.result.concat(Object.assign({}, notification.data, { new: true }));
      setData({ result: newState });

      updateEvents(notification);
    }

    if (notification.type === 'verifyProof') {
      const newState = proofs.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.data.key.id);
      newState[itemToUpdateIndex].value = notification.data.value;
      setData({ result: newState });

      updateEvents(notification);
    }

    if (notification.type === 'uploadDocument') {
      if (notification.data.value.contractID === shipment.contractID) {
        setDocs(docs.concat(Object.assign({}, notification.data, { new: true })));

        updateEvents(notification);
      }
    }

    if (notification.type === 'confirmShipment' || notification.type === 'confirmDelivery') {
      if (notification.data.value.contractID === shipment.contractID) {
        updateEvents(notification);
      }
    }
  };

  useSocket('notification', onNotification);

  return (
    <div>
      <ConfirmShipmentForm
        dialogIsOpen={csDialogIsOpen}
        setDialogOpenState={setCsDialogOpenState}
        shipment={shipment}
      />
      <GenerateProofForm
        dialogIsOpen={gpDialogIsOpen}
        setDialogOpenState={setGpDialogOpenState}
        shipment={shipment}
      />
      <ConfirmDeliveryForm
        dialogIsOpen={cdDialogIsOpen}
        setDialogOpenState={setCdDialogOpenState}
        shipment={shipment}
      />
      <div
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline' }}
        onClick={() => {
          showShipmentDetail(null);
          setContent(false);
        }}
      >
        <Icons name="left-arrow" />
        <p
          style={{
            marginLeft: '10px',
            color: '#3FBEA5',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Return to Shipments
        </p>
      </div>

      <div className="layout-container">
        <div className="layout-main">
          <h3>Shipment Number: {cropId(shipment.id)}</h3>
          <div className="table-wrap" style={{ paddingBottom: '0px' }}>
            <table className="table shipment-info-table">
              <thead>
                <tr style={{ backgroundColor: '#F8F9FA' }}>
                  <th>Ship From</th>
                  <th>Ship To</th>
                  <th>Delivery Date</th>
                  <th>Vehicle/Transport</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{shipment.shipFrom}</td>
                  <td>{shipment.shipTo}</td>
                  <td>{format(shipment.deliveryDate, 'DD MMM YYYY')}</td>
                  <td>{shipment.transport}</td>
                  <td>{shipment.state}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ paddingTop: 15, paddingBottom: 18 }}>
              {role === 'transporter' || role === 'supplier' || role === 'transport_agency' ? (
                <div style={{ fontSize: 16 }}>
                  <p
                    style={{
                      paddingTop: 8,
                      paddingBottom: 8,
                      paddingLeft: 10,
                      paddingRight: 10,
                      fontWeight: 'bold',
                      backgroundColor: '#F8F9FA'
                    }}
                  >
                    Description:
                  </p>
                  <p style={{ marginLeft: 10 }}>{shipment.description}</p>
                </div>
              ) : (
                <></>
              )}
              {role === 'buyer' && shipment.state !== 'Delivered' ? (
                <div>
                  <Button
                    style={{ paddingLeft: 30, paddingRight: 30 }}
                    intent="primary"
                    onClick={() => {
                      setCdDialogOpenState(true);
                    }}
                  >
                    Accept Delivery
                  </Button>
                </div>
              ) : (
                <></>
              )}
              {role === 'transporter' && shipment.state === 'Requested' ? (
                <div>
                  <Button
                    style={{ paddingLeft: 30, paddingRight: 30 }}
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
            </div>
          </div>

          <Timeline shipment={shipment} events={events} />
          <CollapsiblePanel history={shipment.timeline ? events.concat([]) : []} />
        </div>

        <div className="layout-aside">
          {shipment.state === 'Confirmed' && role === 'supplier' && (
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

          {proofs && proofs.result && proofs.result.length > 0 && (
            <div>{loadingProofs ? <div>Loading...</div> : <Proofs data={proofs.result} />}</div>
          )}

          {docs && docs.length !== 0 ? (
            <div className="sidebar-panel">
              <div className="sidebar-panel-header">
                <h4>Documents</h4>
              </div>
              <div className="sidebar-panel-body">
                {docs
                  && docs.map((doc, i) => (
                    <div
                      key={i.toString()}
                      style={{ display: 'flex', flexDirection: 'row', marginTop: '5px' }}
                    >
                      <Icons name="proof-document" />
                      <a
                        style={{ marginLeft: '10px', marginTop: '2px', color: '#1B263C' }}
                        href={`/getDocument?hash=${doc.value.documentHash}&type=${
                          doc.value.documentType
                        }`}
                        target="_blank"
                      >
                        {doc.value.documentMeat}
                      </a>
                      {doc.new ? (
                        <div
                          style={{
                            marginLeft: '3px',
                            marginBottom: '7px',
                            borderRadius: '100%',
                            height: '8px',
                            width: '8px',
                            backgroundColor: '#69D7BC'
                          }}
                        />
                      ) : (
                        <></>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetailPage;
