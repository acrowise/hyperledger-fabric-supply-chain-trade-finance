import { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';

// eslint-disable-next-line import/prefer-default-export
export const useFetch = (method, v2) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchUrl() {
    fetch(
      v2
        ? `api/channels/common/chaincodes/trade-finance-chaincode?fcn=${method}`
        : `http://localhost:3000/${method}`
    ).then((res) => {
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
