import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';

import './collapsiblePanel.scss';

const CollapsiblePanel = ({ title, data }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="collapsible-panel-ntwk">
      <div
        onClick={() => {
          setExpanded(!expanded);
        }}
        className="collapsible-panel-header-ntwk"
      >
        <strong>{title}</strong>
        <Icon icon={expanded ? 'caret-up' : 'caret-down'} iconSize="18" />
      </div>
      {expanded && (
        <div className="collapsible-panel-body-ntwk">
          <>Content</>
        </div>
      )}
    </div>
  );
};

CollapsiblePanel.propTypes = {
  data: PropTypes.array
};

export default CollapsiblePanel;
