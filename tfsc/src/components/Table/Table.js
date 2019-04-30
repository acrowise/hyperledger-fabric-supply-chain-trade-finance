import React from 'react';
import PropTypes from 'prop-types';
import './table.scss';

const Table = ({
  fields, data, actions, onSelect
}) => {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {Object.keys(fields).map(i => (
              <th key={i.toString()}>{fields[i]}</th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr className="no-data-cell">
              <td colSpan="100%">No Data</td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index}>
                {Object.keys(fields).map(j => (
                  <td
                    onClick={() => {
                      if (onSelect) {
                        onSelect(item);
                      }
                    }}
                    key={j.toString()}
                  >
                    {j === 'dueDate' || j === 'dateCreated' || j === 'lastUpdated'
                      ? new Date(item[j]).toLocaleDateString()
                      : item[j]}
                  </td>
                ))}
                <td>{actions(item)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  fields: PropTypes.object,
  data: PropTypes.array,
  actions: PropTypes.func,
  onSelect: PropTypes.func
};

export default Table;
