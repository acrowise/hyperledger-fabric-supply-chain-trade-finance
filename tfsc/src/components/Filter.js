import React, { useState } from 'react';
import { RadioGroup, Radio, InputGroup } from '@blueprintjs/core';
// import PropTypes from 'prop-types';

import FilterBy from './FilterBy';

const Filter = ({
  children, statuses, actionComponent, filterBy
}) => {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [content, setContent] = useState(false);

  const [dataForFilter, setDataForFilter] = useState([]);

  const data = {};
  if (dataForFilter) {
    filterBy.forEach((field) => {
      data[field] = dataForFilter.map(i => i[field]);
    });
  }

  const childrenWithProps = React.Children.map(children, child => React.cloneElement(child, {
    content,
    setContent,
    filter,
    search,
    dataForFilter,
    setDataForFilter
  }));

  return content ? (
    childrenWithProps
  ) : (
    <div className="dashboard-panel">
      <div className="dashboard-panel-header dashboard-header">
        <div className="dashboard-header-col-3">
          <RadioGroup
            inline
            selectedValue={filter}
            onChange={({ target }) => {
              setFilter(target.value);
            }}
            className="dashboard-panel-header-radiogroup"
          >
            <Radio label="All" value={''} className="radio-button" />
            {statuses.map(s => (
              <Radio key={s} label={s} value={s} className="radio-button" />
            ))}
          </RadioGroup>
        </div>
        <div className="dashboard-header-col-2">
          <InputGroup
            large
            placeholder="Search"
            value={search}
            className="search-input"
            onChange={({ target }) => {
              setSearch(target.value);
            }}
          />
        </div>
        <div className="dashboard-header-col-btn">{actionComponent || <></>}</div>
      </div>
      <div className="dashboard-panel-body layout-container">
        <aside className="layout-aside">
          <h4>Filter by</h4>
          {filterBy.map(f => (
            <div key={f} className="filter-select-wrap">
              <FilterBy type={f} data={data[f]} />
            </div>
          ))}
        </aside>
        <main className="layout-main">{childrenWithProps}</main>
      </div>
    </div>
  );
};

export default Filter;
