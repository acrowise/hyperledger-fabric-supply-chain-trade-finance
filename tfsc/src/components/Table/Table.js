import React from 'react';
import PropTypes from 'prop-types';
import './table.scss';

const Table = ({
  fields, data, actions, onSelect
}) => (
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
          <tr className="no-data-cell"><td colSpan="100%">No Data</td></tr>
        ) : (
          data.map(i => (
            <tr key={i.toString()}>
              {Object.keys(fields).map(j => (
                <td
                  onClick={() => {
                    if (onSelect) {
                      onSelect(i);
                    }
                  }}
                  key={j.toString()}
                >
                  {j === 'dueDate' || j === 'dateCreated' || j === 'lastUpdated'
                    ? new Date(i[j]).toLocaleDateString()
                    : i[j]}
                </td>
              ))}
              <td>{actions(i)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

Table.propTypes = {
  fields: PropTypes.object,
  data: PropTypes.array,
  actions: PropTypes.func,
  onSelect: PropTypes.func
};

export default Table;
