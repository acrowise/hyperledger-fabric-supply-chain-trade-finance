import React from 'react';
import { Icon, Spinner } from '@blueprintjs/core';

const ActionCompleted = ({ res, action, result }) => {
  if (!res.pending && !res.complete && !res.data) {
    return <></>;
  }
  return res.pending ? (
    <Spinner large intent="primary" />
  ) : (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Icon icon={res.complete ? 'tick' : 'cross'} />
      <p>{action}</p>
      <p style={{ fontWeight: 'bolder', textTransform: 'uppercase' }}>{result}</p>
    </div>
  );
};
export default ActionCompleted;
