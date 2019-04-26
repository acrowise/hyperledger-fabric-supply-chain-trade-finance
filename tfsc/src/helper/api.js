import { useAsyncEndpoint } from './hooks';

// eslint-disable-next-line import/prefer-default-export
export const post = (method, v2) => () => useAsyncEndpoint(data => ({
  url: v2
    ? 'http://localhost:3000/api/channels/common/chaincodes/trade-finance-chaincode'
    : `http://localhost:3000/${method}`,
  method: 'POST',
  data
}));
