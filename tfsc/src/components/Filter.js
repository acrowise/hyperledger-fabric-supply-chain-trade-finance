import React, {useState} from 'react';
import {
  RadioGroup, Radio, Icon, InputGroup, Button
} from '@blueprintjs/core';
// import PropTypes from 'prop-types';

const fields = ['Price', 'Date', 'Status'];

const Filter = (props) => {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [content, setContent] = useState(false);

  const childrenWithProps = React.Children.map(props.children, child => React.cloneElement(child, {
    content,
    setContent,
    filter,
    search
  }));

  return content ? (
    childrenWithProps
  ) : (
    <div className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div className="dashboard-panel-header-">
          <RadioGroup
            inline
            selectedValue={filter}
            onChange={({target}) => {
              setFilter(target.value);
            }}
            className="dashboard-panel-header-radiogroup"
          >
            <Radio
              label="All"
              value={''}
              className="radio-button"
            />
            {props.statuses.map(s => (
              <Radio
                key={s}
                label={s}
                value={s}
                className="radio-button"
              />
            ))}
          </RadioGroup>
        </div>
        <div>
          <InputGroup
            large
            placeholder="Search"
            value={search}
            className="search-input"
            onChange={({target}) => {
              setSearch(target.value);
            }}
          />
        </div>
      </div>
      <div className="dashboard-panel-body layout-container">
        <aside className="layout-aside">
          {fields.map(f => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                height: '50px',
                justifyContent: 'space-between',
                backgroundColor: '#f1f1f1',
                marginTop: '7px',
                marginBottom: '7px',
                alignItems: 'center',
                paddingLeft: '7px',
                paddingRight: '7px'
                // paddingTop: '7px'
              }}
              key={f}
            >
              <p>{f}</p>
              <Icon icon="caret-down"/>
            </div>
          ))}
        </aside>
        <main className="layout-main">{childrenWithProps}</main>
      </div>
    </div>
  );
};

export default Filter;
