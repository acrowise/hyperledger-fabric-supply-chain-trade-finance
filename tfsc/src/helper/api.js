import { usePost, useGet } from './hooks';

const mockApi = process.env.api;

console.log('process.env.api', process.env.api);

export const post = method => () => usePost(data => ({
  url: mockApi ? `/${method}` : '/api/channels/common/chaincodes/supply-chain-chaincode',
  method: 'POST',
  data
}));

export const get = method => useGet(mockApi ? `/${method}` : `/api/channels/common/chaincodes/supply-chain-chaincode?fcn=${method}`);
