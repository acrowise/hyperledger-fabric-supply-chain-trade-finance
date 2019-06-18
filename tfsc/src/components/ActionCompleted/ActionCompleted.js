import React from 'react';
import { Icon, Spinner } from '@blueprintjs/core';
import './actionCompleted.scss';

import Icons from '../Icon/Icon';

const ActionCompleted = ({ res, action, result }) => {
  const getIcon = () => {
    if (res.complete) {
      if (res.error) {
        return <Icon icon="cross" intent="danger" iconSize="42" className="action-error-icon" />;
      }
      return <Icons name="complete" />;
    }
    return <></>;
  };

  if (!res.pending && !res.complete && !res.data) {
    return <></>;
  }

  if (res.error) {
    return (
      <div className="action-completed">
        {getIcon()}
        <p>{res.error.message}</p>
      </div>
    );
  }

  return (
    <div className="action-completed">
      {res.pending ? (
        <Spinner large />
      ) : (
        <>
          {getIcon()}
          <p>{action}</p>
          <div className="action-completed-result">{result}</div>
        </>
      )}
    </div>
  );
};

export default ActionCompleted;
