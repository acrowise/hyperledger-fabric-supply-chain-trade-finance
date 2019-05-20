import { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';

const newApi = process.env.api;

// eslint-disable-next-line import/prefer-default-export
export const useFetch = (method) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchUrl() {
    const url = newApi
      ? `/api/channels/common/chaincodes/supply-chain-chaincode?fcn=${method}`
      : `/${method}`;
    fetch(url).then((res) => {
      res.json().then((d) => {
        setData(d);
        setLoading(false);
      });
    });
  }

  useEffect(() => {
    fetchUrl();
  }, []);

  return [data, loading, setData];
};
