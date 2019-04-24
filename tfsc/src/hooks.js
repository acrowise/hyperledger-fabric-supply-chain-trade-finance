import { useState, useEffect } from 'react';
import fetch from 'isomorphic-fetch';

// eslint-disable-next-line import/prefer-default-export
export const useFetch = (url) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchUrl() {
    fetch(`http://localhost:3000/${url}`).then((res) => {
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
