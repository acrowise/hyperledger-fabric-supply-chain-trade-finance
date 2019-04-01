// @flow
export type Order = {
  key: {
    id?: string
  };
  value: {
    type: number,
    amount?: string,
    rate?: string,
    status?: number,
    creator?: string
  }
};