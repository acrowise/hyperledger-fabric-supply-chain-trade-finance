import React from 'react';
import PropTypes from 'prop-types';
import './table.scss';

import { cropId } from '../../helper/utils';

const ids = ['id', 'contractId', 'shipmentId', 'invoiceID'];
const dates = ['dueDate', 'date', 'timestamp', 'paymentDate'];

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
          {actions ? <th /> : <></>}
        </tr>
      </thead>
      <tbody>
        {data && data.length === 0 ? (
          <tr className="no-data-cell">
            <td colSpan="100%">No Data</td>
          </tr>
        ) : (
          data && data.map((item, index) => (
            <tr key={index}>
              {Object.keys(fields).map((j) => {
                let value = item[j];
                if (dates.includes(j)) {
                  value = new Date(item[j]).toLocaleDateString();
                }
                if (ids.includes(j)) {
                  value = cropId(item[j]);
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
