// @flow
import * as apiService from './api.service';
import type {Deal, ListResponse} from '../_types';

export const dealService = {
  getAll,
  getByPeriod,
  getForCreatorByPeriod
};

const ACTIONS = {
  getAll: 'queryDeals',
  getByPeriod: 'queryDealsByPeriod',
  getForCreatorByPeriod: 'queryDealsForCreatorByPeriod'
};

const CHAINCODES = {
  reference: 'reference'
};

const CHANNELS = {
  common: 'common'
};

async function getAll(): Promise<ListResponse<Deal>> {
  return await apiService.query(
      CHANNELS.common,
      CHAINCODES.reference,
      ACTIONS.getAll);
}

async function getByPeriod(period: string[]): Promise<ListResponse<Deal>> {
  return await apiService.query(
      CHANNELS.common,
      CHAINCODES.reference,
      ACTIONS.getByPeriod,
      period);
}

async function getForCreatorByPeriod(period: string[]): Promise<ListResponse<Deal>> {
  return await apiService.query(
      CHANNELS.common,
      CHAINCODES.reference,
      ACTIONS.getForCreatorByPeriod,
      period);
}
