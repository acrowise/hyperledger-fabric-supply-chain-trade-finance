import { useAsyncEndpoint } from './hooks';

const DEV = process.env.development;
// eslint-disable-next-line import/prefer-default-export
export const post = method => () => useAsyncEndpoint(data => ({
  url: !DEV
    ? 'http://localhost:3000/api/channels/common/chaincodes/trade-finance-chaincode'
    : `http://localhost:3000/${method}`,
  method: 'POST',
  data
}));
