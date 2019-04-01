// @flow
export type Deal = {
  key: {
    id: string
  };
  value: {
    lender: string,
    borrower: string,
    amount: number,
    rate: number,
    timestamp: number
  }
}