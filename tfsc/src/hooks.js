import { useState, useEffect } from 'react';
// import fetch from 'isomorphic-fetch';
import axios from 'axios';
import * as mock from './mocks';

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

export const useAsyncEndpoint = (fn) => {
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
    if (!req) {
      return;
    }
    setRes({
      data: null,
      pending: true,
      error: false,
      complete: false
    });
    axios(req)
      .then(resp => setRes({
        data: resp.data,
        pending: false,
        error: false,
        complete: true
      }))
      .catch(() => setRes({
        data: null,
        pending: false,
        error: true,
        complete: true
      }));
  }, [req]);

  return [res, (...args) => setReq(fn(...args)), r];
};
