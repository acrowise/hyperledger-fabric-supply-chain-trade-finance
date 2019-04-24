import React, { useState } from 'react';
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
    <div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flex: 1 }}>
              <RadioGroup
                inline
                selectedValue={filter}
                onChange={({ target }) => {
                  setFilter(target.value);
                }}
              >
                <Radio label="All" value={''} />
                {props.statuses.map(s => (
                  <Radio key={s} label={s} value={s} />
                ))}
              </RadioGroup>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
              <div style={{ flex: 1 }}>
                <InputGroup
                  large
                  placeholder="Search"
                  value={search}
                  onChange={({ target }) => {
                    setSearch(target.value);
                  }}
                />
              </div>
              <Button large text="Search" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div>
              {fields.map(f => (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    height: '50px',
                    width: '200px',
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
                  <Icon icon="caret-down" />
                </div>
              ))}
            </div>
            <div style={{ marginLeft: '20px' }}>{childrenWithProps}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
