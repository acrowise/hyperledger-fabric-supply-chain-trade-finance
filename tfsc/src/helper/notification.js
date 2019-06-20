import { NOTIFICATIONS_TAB as types } from '../constants';

const notifications = (state = [], message, tab) => {
  const notification = JSON.parse(message);

  if (types[notification.type] === tab) {
    switch (notification.type) {
      // case 'contractCreated':
      case 'placeOrder':
      case 'placeBid':
      case 'generateProof':
      case 'submitReport':
      case 'registerInvoice':
        return {
          result: state.concat(
            state.find(i => i.key.id === notification.data.key.id) ? [] : notification.data
          )
        };
      case 'placeInvoice':
      case 'acceptOrder':
      case 'cancelOrder':
      case 'updateOrder':
      case 'cancelBid':
      case 'updateBid':
      case 'acceptInvoice':
      case 'removeInvoice':
      case 'verifyProof':
      case 'updateProof':
      case 'updateReport':
      case 'guarenteeOrder':
      case 'contractUpdated': {
        const newState = state.concat([]);
        const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.data.key.id);
        newState[itemToUpdateIndex] = notification.data;
        return { result: newState };
      }
      case 'contractCompleted':
        if (tab === 'contracts') {
          const newState = state.concat([]);
          const itemToUpdateIndex = newState.findIndex(
            i => i.key.id === notification.contract.key.id
          );
          newState[itemToUpdateIndex] = notification.contract;
          return { result: newState };
        }
        return state;
      case 'uploadDocument': {
        const newState = state.concat([]);
        const itemToUpdate = newState.find(
          i => i.value.contract.key.id === notification.data.value.contractID
        );
        itemToUpdate.value.contract.value.documents.push(notification.data);

        if (itemToUpdate.value.timeline && !itemToUpdate.value.timeline.documentsUploaded) {
          itemToUpdate.value.timeline.documentsUploaded = [];
        }

        itemToUpdate.value.timeline.documentsUploaded.push({
          key: { id: notification.data.key.id },
          value: {
            action: notification.type,
            creator: notification.data.value.creator,
            entityID: notification.data.key.id,
            entityType: 'Shipment',
            other: notification.data.value,
            timestamp: notification.data.value.timestamp
          }
        });

        return { result: newState };
      }
      case 'acceptBid': {
        const newState = state.concat([]);
        newState.forEach((i) => {
          if (i.key.id !== notification.data.key.id) {
            if (i.value.invoiceID === notification.data.value.invoiceID) {
              i.value.state = 3;
            }
          } else {
            i.value.state = notification.data.value.state;
          }
        });
        return { result: newState };
      }
      case 'requestShipment': {
        return {
          result: state.concat(
            Object.assign({}, notification.data, {
              value: Object.assign({}, notification.data.value, {
                timeline: {
                  shipmentRequested: [
                    {
                      key: { id: notification.data.value.eventId },
                      value: {
                        action: notification.type,
                        creator: notification.data.value.creator,
                        entityID: notification.data.key.id,
                        entityType: 'Shipment',
                        other: {},
                        timestamp: notification.data.value.timestamp
                      }
                    }
                  ]
                },
                contract: {
                  key: { id: notification.data.value.contractID },
                  value: {
                    documents: []
                  }
                  // TODO: add item to timeline }
                }
              })
            })
          )
        };
      }
      case 'confirmDelivery':
      case 'confirmShipment': {
        // const events = {
        //   confirmDelivery: 'shipmentDelivered',
        //   confirmShipment: 'shipmentConfirmed'
        // };
        const newState = state.concat([]);
        const itemToUpdate = newState.find(
          i => i.value.contract.key.id === notification.data.value.contractID
        );

        itemToUpdate.value.state = notification.data.value.state;

        // if (
        //   itemToUpdate.value.timeline
        //   && !itemToUpdate.value.timeline[events[notification.type]]
        // ) {
        //   itemToUpdate.value.timeline[events[notification.type]] = [];
        // }

        // itemToUpdate.value.timeline[events[notification.type]].push({
        //   key: { id: notification.data.key.id },
        //   value: {
        //     action: notification.type,
        //     creator: notification.data.value.creator,
        //     entityID: notification.data.key.id,
        //     entityType: 'Shipment',
        //     other: notification.data.value,
        //     timestamp: notification.data.value.timestamp
        //   }
        // });
        return { result: newState };
      }
      default:
        return { result: state };
    }
  } else {
    return { result: state };
  }
};

export default notifications;
