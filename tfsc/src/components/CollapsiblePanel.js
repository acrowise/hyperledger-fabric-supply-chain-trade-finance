import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';
// import ProofDetail from './ProofDetail/ProofDetail';

import { capitalize } from '../helper/utils';
import { AUDITORS } from '../constants';

const CollapsiblePanel = ({ data, setDialogOpenState, setItem, type }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="sidebar-panel">
      <div
        onClick={() => {
          setExpanded(!expanded);
        }}
        className="sidebar-panel-header"
      >
        <h4>{`${capitalize(type)}s`}</h4>
        <Icon icon={expanded ? 'caret-up' : 'caret-down'} />
      </div>
      {expanded ? (
        <div className="sidebar-panel-body">
          {data.map(item => (
            <div
              onClick={() => {
                setDialogOpenState(true);
                setItem(item);
              }}
              key={item.key.id}
              style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }}
            >
              <p>
                {capitalize(type)}: {AUDITORS[item.value.owner].toUpperCase()}
              </p>
              {item.new ? <div className="new-dot-notification" /> : <></>}
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

CollapsiblePanel.propTypes = {
  type: PropTypes.string,
  setDialogOpenState: PropTypes.func,
  dialogIsOpen: PropTypes.bool,
  setItem: PropTypes.func,
  data: PropTypes.array
};

export default CollapsiblePanel;
