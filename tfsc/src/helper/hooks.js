import { useState, useEffect } from 'react';
import axios from 'axios';

const retry = (options, n) => axios(options).catch((error) => {
  if (n === 0) {
    if (error.response) {
      throw error.response.data;
    }
    if (error.message) {
      throw error.message;
    }
    throw error;
  }
  return retry(options, n - 1);
});

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
    const post = () => {
      retry(req, 5)
        .then((resp) => {
          setRes({
            data: resp.data,
            pending: false,
            error: false,
            complete: true
          });
        })
        .catch((e) => {
          setRes({
            data: null,
            pending: false,
            error: e,
            complete: true
          });
        });
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

  const get = () => {
    retry(
      {
        method: 'get',
        url
      },
      3
    )
      .then((resp) => {
        setResponse({
          data: resp.data,
          pending: false,
          error: false,
          complete: true
        });
      })
      .catch((e) => {
        setResponse({
          data: [],
          pending: false,
          error: true,
          complete: true
        });
      });
  };

  useEffect(() => {
    get();
  }, []);

  return [response.data, response.pending, setData];
};
