import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
import { format } from 'date-fns';

import classNames from 'classnames';

import './collapsiblePanel.scss';

const CollapsiblePanel = ({ history }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="collapsible-panel">
      <div
        onClick={() => {
          setExpanded(!expanded);
        }}
        className="collapsible-panel-header"
      >
        <strong>View History</strong>
        <Icon
          icon={expanded ? 'caret-up' : 'caret-down'}
          iconSize="30"
        />
      </div>
      {expanded && (
        <div className="collapsible-panel-body">
          <table className="history-table">
            <tbody>
            {history.map(item => (
              <tr key={item.id}>
                <td className="history-table-bullet">
                  <Icon icon="symbol-circle"/>
                </td>
                <td>{format(item.date, 'DD MMMM YYYY')}</td>
                <td>{item.id}</td>
                <td>{item.action}</td>
                <td>{item.type}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

CollapsiblePanel.propTypes = {
  history: PropTypes.array
};

export default CollapsiblePanel;
