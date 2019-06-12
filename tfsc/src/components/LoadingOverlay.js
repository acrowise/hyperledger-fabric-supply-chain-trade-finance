import React from 'react';
import { Overlay, Card } from '@blueprintjs/core';

import ActionCompleted from './ActionCompleted/ActionCompleted';

const LoadingOverlay = ({ req, action, result }) => (
  <Overlay usePortal isOpen={req.pending}>
    <div className="loading-overlay-container">
      <Card className="modal" style={{ width: '720px' }}>
        <ActionCompleted res={req} action={action} result={result} />
      </Card>
    </div>
  </Overlay>
);

export default LoadingOverlay;
