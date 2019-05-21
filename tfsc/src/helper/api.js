import { useAsyncEndpoint } from './hooks';

const mockApi = process.env.api;

console.log('process.env.api', process.env.api);

// eslint-disable-next-line import/prefer-default-export
export const post = method => () => useAsyncEndpoint(data => ({
  url: mockApi ? `/${method}` : '/api/channels/common/chaincodes/supply-chain-chaincode',
  method: 'POST',
  data
}));
