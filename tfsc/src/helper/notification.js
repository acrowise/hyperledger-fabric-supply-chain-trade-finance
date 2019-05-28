import { notifications as types } from '../mocks';

const notifications = (state = [], message, tab) => {
  const notification = JSON.parse(message);

  const orders = ['placeOrder', 'acceptOrder', 'cancelOrder', 'editOrder' ]

  if (types[notification.type] === tab) {
    switch (notification.type) {
      // case 'contractCreated':
      case 'placeOrder':
      case 'placeBid':
      case 'proofGenerated':
      case 'reportGenerated':
      case 'requestShipment':
        return { result: state.concat(notification.data) };
      case 'placeInvoice':
      case 'acceptOrder':
      case 'cancelOrder':
      case 'editOrder':
      // case 'acceptBid':
      case 'cancelBid':
      case 'editBid':
      case 'acceptInvoice':
      case 'invoiceRemoved':
      case 'verifyProof':
      case 'confirmShipment':
      case 'shipmentDelivered':
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
        const itemToUpdate = newState.find(i => i.key.id === notification.event.shipmentId);
        itemToUpdate.value.documents.push(notification.data);
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
      default:
        return { result: state };
    }
  } else {
    return { result: state };
  }
};

export default notifications;
