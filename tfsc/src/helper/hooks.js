import { useState, useEffect } from 'react';
import axios from 'axios';

const retry = async (options, n) => {
  try {
    return await axios(options);
  } catch (err) {
    if (n === 1) {
      throw err;
    }
    return await retry(options, n - 1);
  }
};

// eslint-disable-next-line import/prefer-default-export
export const usePost = (fn) => {
  const [res, setRes] = useState({
    data: null,
    complete: false,
    pending: false,
    error: false
  });
  const [req, setReq] = useState();
  const r = () => setRes({
    data: null,
    complete: false,
    pending: false,
    error: false
  });
  useEffect(() => {
    const post = async () => {
      try {
        const resp = await retry(req, 3);
        setRes({
          data: resp.data,
          pending: false,
          error: false,
          complete: true
        });
      } catch (e) {
        setRes({
          data: null,
          pending: false,
          error: true,
          complete: true
        });
      }
    };
    if (!req) {
      return;
    }
    setRes({
      data: null,
      pending: true,
      error: false,
      complete: false
    });
    post();
  }, [req]);

  return [res, (...args) => setReq(fn(...args)), r];
};

export const useGet = (url) => {
  const [response, setResponse] = useState({
    data: [],
    pending: true,
    error: false,
    complete: false
  });

  const setData = data => setResponse({
    data,
    complete: false,
    pending: false,
    error: false
  });

  const get = async () => {
    try {
      const resp = await retry(
        {
          method: 'get',
          url
        },
        3
      );
      setResponse({
        data: resp.data,
        pending: false,
        error: false,
        complete: true
      });
    } catch (e) {
      setResponse({
        data: [],
        pending: false,
        error: true,
        complete: true
      });
    }
  };

  useEffect(() => {
    get();
  }, []);

  return [response.data, response.pending, setData];
};
