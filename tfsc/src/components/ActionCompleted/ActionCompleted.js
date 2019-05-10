import React from 'react';
import {Icon, Spinner} from '@blueprintjs/core';
import './actionCompleted.scss';

const ActionCompleted = ({res, action, result}) => {
  const getIcon = res.complete ? (
    <svg
      width='42'
      height='42'
      viewBox='0 0 42 42'
      fill='none'
      className="action-completed-icon"
    >
      <circle cx='21' cy='21' r='20' stroke='#69D7BC' strokeWidth='2'/>
      <path d='M14 22.4483L18.4211 27L28 16' stroke='#69D7BC' strokeWidth='4'
            strokeLinecap='round' strokeLinejoin='round'/>
    </svg>
  ) : (
    <Icon
      icon='cross'
      intent="danger"
      iconSize="42"
      className="action-completed-icon"
    />
  );

  if (!res.pending && !res.complete && !res.data) {
    return <></>;
  }
  return (
    <div className="action-completed">
      {res.pending ? (
        <Spinner
          large
          intent="primary"
        />
      ) : (
        <>
        {getIcon}
        <p>{action}</p>
        <div className="action-completed-result">
          {result}
        </div>
        </>
      )}
    </div>
  );
};

export default ActionCompleted;
