import { useAsyncEndpoint } from './hooks';

const newApi = process.env.api;

// eslint-disable-next-line import/prefer-default-export
export const post = method => () => useAsyncEndpoint(data => ({
  url: newApi
    ? 'http://localhost:3000/api/channels/common/chaincodes/supply-chain-chaincode'
    : `http://localhost:3000/${method}`,
  method: 'POST',
  data
}));
