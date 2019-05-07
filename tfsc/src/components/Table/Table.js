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
          {actions ? <th>Action</th> : <></>}
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
              {Object.keys(fields).map((j) => {
                let value = item[j];
                if (j === 'dueDate' || j === 'paymentDate' || j === 'timestamp') {
                  value = new Date(item[j]).toLocaleDateString();
                }
                if (j === 'id' || j === 'contractId') {
                  value = item[j].slice(0, 7).toUpperCase();
                }
                return (
                  <td
                    onClick={() => {
                      if (onSelect) {
                        onSelect(item);
                      }
                    }}
                    key={j.toString()}
                  >
                    {value}
                  </td>
                );
              })}
              {actions ? <td>{actions(item)}</td> : <></>}
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
