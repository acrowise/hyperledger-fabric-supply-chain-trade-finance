import React from 'react';
import { Icon, Spinner } from '@blueprintjs/core';
import './actionCompleted.scss';

import Icons from '../Icon/Icon';

const ActionCompleted = ({ res, action, result }) => {
  const getIcon = res.complete ? (
    <Icons name="complete" />
  ) : (
    <Icon icon="cross" intent="danger" iconSize="42" className="action-completed-icon" />
  );

  if (!res.pending && !res.complete && !res.data) {
    return <></>;
  }

  return (
    <div className="action-completed">
      {res.pending ? (
        <Spinner large />
      ) : (
        <>
          {getIcon}
          <p>{action}</p>
          <div className="action-completed-result">{result}</div>
        </>
      )}
    </div>
  );
};

export default ActionCompleted;
