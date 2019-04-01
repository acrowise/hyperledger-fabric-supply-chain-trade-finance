// @flow
import * as apiService from './api.service';
import type {Order, ListResponse} from '../_types';
export const orderService = {
  getAll,
  add,
  edit,
  accept,
  cancel
};

const ACTIONS = {
  getAll: 'queryBids',
  add: 'placeBid',
  edit: 'editBid',
  accept: 'makeDeal',
  cancel: 'cancelBid'
};

const CHAINCODES = {
  reference: 'reference'
};

const CHANNELS = {
  common: 'common'
};

async function getAll(): Promise<ListResponse<Order>> {
  return apiService.query(
    CHANNELS.common,
    CHAINCODES.reference,
    ACTIONS.getAll);
}

async function add(order: Order): Promise<any> {
  return apiService.invoke(
    CHANNELS.common,
    CHAINCODES.reference,
    ACTIONS.add,
    [order.value.type, order.value.amount, order.value.rate]
  );
}

async function edit(order: Order): Promise<any> {
  return apiService.invoke(
    CHANNELS.common,
    CHAINCODES.reference,
    ACTIONS.edit,
    [order.key.id, 0, order.value.amount, order.value.rate]
  );
}

async function accept(order: Order): Promise<any> {
  return apiService.invoke(
    CHANNELS.common,
    CHAINCODES.reference,
    ACTIONS.accept,
    [order.key.id]
  );
}

async function cancel(order: Order): Promise<any> {
  return apiService.invoke(
    CHANNELS.common,
    CHAINCODES.reference,
    ACTIONS.cancel,
    [order.key.id]
  );
}
