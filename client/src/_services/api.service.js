// @flow
import {sendRequest} from '../_helpers/request';
import {configService} from './config.service';

type LoginResponse = {
  token: string
}

function _getPeer(): string {
  return configService.getPeers()[0];
}

export function query(channel: string, chaincode: string, fcn: string, args: any[] = []): * {
  const requestOptions = {
    method: 'GET'
  };
  const {org} = configService.get();
  const params = {
    peer: `${org}/${_getPeer()}`,
    fcn,
    args: args.join(",")
  };

  const url = new URL(`${window.location.origin}/api/channels/${channel}/chaincodes/${chaincode}`);

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  return sendRequest(`${url.href}`, requestOptions);
}

export function invoke(channel: string, chaincode: string, fcn: string, args: any[] = []): * {
  const {org} = configService.get();
  args = args.map(arg => arg + '');
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({
      peers: [`${org}/${_getPeer()}`],
      fcn,
      args
    })
  };

  return sendRequest(`/api/channels/${channel}/chaincodes/${chaincode}`, requestOptions);
}

export function login(user: Object, retry?: boolean = true): Promise<LoginResponse> {
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({username: user.name, orgName: user.org})
  };

  return sendRequest(`/api/users`, requestOptions, retry);
}

export function extendConfig(): * {
  return configService.update();
}

export function config(): * {
  const requestOptions = {
    method: 'GET'
  };

  return sendRequest(`/api/config`, requestOptions);
}
