import React, { useState } from 'react';

import { Icon, InputGroup } from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { TABLE_MAP } from '../constants';

const TITLES = Object.assign(
  Object.keys(TABLE_MAP).reduce((res, a) => Object.assign(res, TABLE_MAP[a]), {}),
  {
    shipmentId: 'Shipment ID'
  }
);

const getFilterType = (type) => {
  const types = {
    date: ['dueDate', 'paymentDate'],
    select: [
      'destination',
      'transport',
      'shipmentFrom',
      'shipmentTo',
      'consignorName',
      'consigneeName',
      'debtor',
      'beneficiary',
      'owner'
    ],
    range: ['totalDue', 'rate']
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

const FilterBy = ({ type, data, setFilter }) => {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);

  return (
    <div className="sidebar-panel">
      <div
        onClick={() => {
          if (expanded) {
            setSelected(false);
            setFilter(false);
          }
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
            [...new Set(data)].map((item, i) => (
              <div
                onClick={() => {
                  setFilter(item);
                  setSelected(item);
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
                <p className="filter-range-item">{'from'}</p>
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
                  onChange={(date) => {
                    setFilter({ from: date.getTime() });
                  }}
                  timePrecision={undefined}
                  parseDate={str => new Date(str)}
                  placeholder={'MM/DD/YYYY'}
                />
              </div>
              <div className="filter-range">
                <p className="filter-range-item">{'to'}</p>
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
                  onChange={(date) => {
                    setFilter({ to: date.getTime() });
                  }}
                  timePrecision={undefined}
                  parseDate={str => new Date(str)}
                  placeholder={'MM/DD/YYYY'}
                />
              </div>
            </div>
          ) : (
            <></>
          )}
          {getFilterType(type) === 'range' ? (
            <div>
              <div className="filter-range">
                <p className="filter-range-item">{'from'}</p>
                <InputGroup
                  type="number"
                  placeholder={'from'}
                  onChange={({ target }) => {
                    setFilter({ from: target.value });
                  }}
                />
              </div>
              <div className="filter-range">
                <p className="filter-range-item">{'to'}</p>
                <InputGroup
                  type="number"
                  placeholder={'to'}
                  onChange={({ target }) => {
                    setFilter({ to: target.value });
                  }}
                />
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
