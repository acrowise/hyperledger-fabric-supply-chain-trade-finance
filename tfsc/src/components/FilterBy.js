import React, { useState } from 'react';

import { Icon, InputGroup } from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { TABLE_MAP } from '../constants';

const TITLES = Object.assign(
  Object.keys(TABLE_MAP).reduce((res, a) => Object.assign(res, TABLE_MAP[a]), {}),
  {
    proofId: 'Proof ID',
    shipmentId: 'Shipment ID',
    reportId: 'Report ID'
  }
);

const getFilterType = (type) => {
  const types = {
    date: ['dueDate', 'paymentDate'],
    select: ['destination', 'transport', 'shipmentFrom', 'shipmentTo'],
    range: ['price', 'totalDue']
  };
  let filter = null;
  Object.keys(types).forEach((t) => {
    if (types[t].includes(type)) {
      filter = t;
    }
    return null;
  });
  return filter;
};

const FilterBy = ({ type, data }) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);

  console.log('FilterBy', data);

  return (
    <div className="sidebar-panel">
      <div
        onClick={() => {
          setExpanded(!expanded);
        }}
        className="sidebar-panel-header"
        style={{
          backgroundColor: expanded ? '#69D7BC' : 'white',
          color: '#1B263C',
          fontWeight: '300'
        }}
      >
        <h4 style={{ fontWeight: '300', fontSize: '16px' }}>
          {selected ? `${TITLES[type]}: ${selected}` : TITLES[type]}
        </h4>
        <Icon icon={expanded ? 'caret-up' : 'caret-down'} />
      </div>
      {expanded ? (
        <div className="sidebar-panel-body">
          {getFilterType(type) === 'select' ? (
            data.map((item, i) => (
              <div
                onClick={() => {
                  setSelected(item);
                  setExpanded(!expanded);
                }}
                key={i}
                style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }}
              >
                <p>{item}</p>
              </div>
            ))
          ) : (
            <></>
          )}
          {getFilterType(type) === 'date' ? (
            <div>
              <div className="filter-range">
                <p className="filter-range-item">{'min'}</p>
                <DateInput
                  minDate={new Date()}
                  maxDate={
                    new Date(
                      new Date().getFullYear() + 2,
                      new Date().getMonth(),
                      new Date().getDate()
                    )
                  }
                  formatDate={date => date.toLocaleDateString()}
                  onChange={(date) => {}}
                  timePrecision={undefined}
                  parseDate={str => new Date(str)}
                  placeholder={'D/M/YYYY'}
                />
              </div>
              <div className="filter-range">
                <p className="filter-range-item">{'max'}</p>
                <DateInput
                  minDate={new Date()}
                  maxDate={
                    new Date(
                      new Date().getFullYear() + 2,
                      new Date().getMonth(),
                      new Date().getDate()
                    )
                  }
                  formatDate={date => date.toLocaleDateString()}
                  onChange={(date) => {}}
                  timePrecision={undefined}
                  parseDate={str => new Date(str)}
                  placeholder={'D/M/YYYY'}
                />
              </div>
            </div>
          ) : (
            <></>
          )}
          {getFilterType(type) === 'range' ? (
            <div>
              <div className="filter-range">
                <p className="filter-range-item">{'min'}</p>
                <InputGroup type="number" placeholder={'min'} onChange={({ target }) => {}} />
              </div>
              <div className="filter-range">
                <p className="filter-range-item">{'max'}</p>
                <InputGroup type="number" placeholder={'max'} onChange={({ target }) => {}} />
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default FilterBy;
