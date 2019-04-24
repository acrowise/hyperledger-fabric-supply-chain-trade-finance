import { useAsyncEndpoint } from './hooks';

// eslint-disable-next-line import/prefer-default-export
export const post = method => () => useAsyncEndpoint(data => ({
  url: `http://localhost:3000/${method}`,
  method: 'POST',
  data
}));
