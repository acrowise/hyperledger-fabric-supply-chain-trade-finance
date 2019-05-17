import { notifications as types } from '../mocks';

const notifications = (state = [], message, tab) => {
  const notification = JSON.parse(message);

  if (types[notification.type] === tab) {
    switch (notification.type) {
      case 'placeOrder':
      case 'contractCreated':
      case 'placeBid':
      case 'proofGenerated':
      case 'reportGenerated':
      case 'shipmentRequested':
        return { result: state.concat(notification.data) };
      case 'placeInvoice':
      case 'acceptOrder':
      case 'cancelOrder':
      case 'updateOrder':
      case 'acceptBid':
      case 'cancelBid':
      case 'editBid':
      case 'acceptInvoice':
      case 'invoiceRemoved':
      case 'validateProof':
      case 'shipmentConfirmed':
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
        console.log('notification', notification);
        console.log('itemToUpdate', itemToUpdate);
        itemToUpdate.value.documents.push(notification.data);
        itemToUpdate.value.events.push(notification.event);
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
