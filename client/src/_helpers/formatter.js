// @flow
import {orgConstants} from '../_constants';

export const formatter = {
  rate: (val: string | number) => Number(val).toFixed(3),
  number: (val: string| number) => Number(val).toLocaleString(),
  date: (date: Date) => date.toLocaleDateString(),
  time: (date: Date) => date.toLocaleTimeString(),
  org: (orgKey: string) => orgConstants[orgKey] || '###',
  datetime: (date: Date) => date.toLocaleString()
};
