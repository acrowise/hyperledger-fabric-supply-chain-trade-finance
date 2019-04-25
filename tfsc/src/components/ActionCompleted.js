import React from 'react';
import { Icon } from '@blueprintjs/core';

const ActionCompleted = ({ action, result }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <Icon icon="tick" />
    <p>{action}</p>
    <p>{result}</p>
  </div>
);

export default ActionCompleted;
