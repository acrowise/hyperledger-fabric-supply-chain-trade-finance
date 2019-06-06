import { notifications as types } from '../mocks';

const notifications = (state = [], message, tab) => {
  const notification = JSON.parse(message);

  if (types[notification.type] === tab) {
    switch (notification.type) {
      // case 'contractCreated':
      case 'placeOrder':
      case 'placeBid':
      case 'generateProof':
      case 'reportGenerated':
        return { result: state.concat(notification.data) };
      case 'placeInvoice':
      case 'acceptOrder':
      case 'cancelOrder':
      case 'editOrder':
      // case 'acceptBid':
      case 'cancelBid':
      case 'updateBid':
      case 'acceptInvoice':
      case 'removeInvoice':
      case 'verifyProof':
      // case 'confirmShipment':
      // case 'confirmDelivery':
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
      case 'documentUploaded': {
        const newState = state.concat([]);
        const itemToUpdate = newState.find(i => i.key.id === notification.event.shipmentID);
        itemToUpdate.value.contract.value.documents.push(notification.data);
        itemToUpdate.value.events.push(notification.event);
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
      case 'confirmDelivery':
      case 'requestShipment': {
        return {
          result: state.concat(
            Object.assign({}, notification.data, {
              value: Object.assign({}, notification.data.value, {
                contract: {
                  key: { id: notification.data.value.contractID },
                  value: { documents: [] }
                }
              })
            })
          )
        };
      }
      case 'confirmShipment': {
        const newState = state.concat([]);
        const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.data.key.id);
        newState[itemToUpdateIndex] = Object.assign({}, notification.data, {
          value: Object.assign({}, notification.data.value, {
            contract: {
              key: { id: notification.data.value.contractID },
              value: { documents: [] }
            }
          })
        });
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
