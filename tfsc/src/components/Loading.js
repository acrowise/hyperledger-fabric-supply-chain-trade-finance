import React from 'react';
import { Spinner } from '@blueprintjs/core';

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', height: '45vh' }}>
    <Spinner large intent="primary" size={80} />
  </div>
);

export default Loading;
