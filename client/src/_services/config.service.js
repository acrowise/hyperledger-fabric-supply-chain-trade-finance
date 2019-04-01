// @flow
import {config} from './api.service';
import type {Config} from '../_types';

export const configService = {
  load,
  get,
  update,
  getPeers
};

let localConfig: Config = {
  org: ''
};
let isFetching: boolean = false;
let reqPromise: Promise<Config>;

function get(): Config {
  return localConfig;
}

function load(): Promise<Config> {
  if (isFetching) {
    return reqPromise;
  }
  isFetching = true;

  reqPromise = config()
      .then(res => {
        localConfig = res;
        return localConfig;
      });

  return reqPromise;
}

// load secured information, like chaincodes, channels
function update(): Promise<any> {
  return Promise.all([]);
}

function getPeers(): string[] {
  return ['peer0'];
}
