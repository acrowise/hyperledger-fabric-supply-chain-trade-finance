import { usePost, useGet } from './hooks';
import { METHODS_MAP } from '../constants';

const mockApi = process.env.api;

console.log('process.env.api', process.env.api);

export const post = method => () => {
  const params = METHODS_MAP.find(i => i.ccMethod === method);

  return usePost(data => ({
    url: mockApi
      ? `/${params.ccMethod}`
      : `/api/channels/${params.channel}/chaincodes/${params.chaincode}`,
    method: 'POST',
    data
  }));
};

export const get = (method) => {
  const params = METHODS_MAP.find(i => i.ccMethod === method);

  return useGet(
    mockApi ? `/${params.ccMethod}` : `/api/channels/${params.channel}/chaincodes/${params.chaincode}?fcn=${params.ccMethod}`
  );
};
