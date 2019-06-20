import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

import './table.scss';

import { cropId } from '../../helper/utils';

const ids = ['id', 'contractId', 'contractID', 'shipmentId', 'shipmentID', 'invoiceID', 'proofID']; // FIXME:
const dates = ['dueDate', 'date', 'timestamp', 'paymentDate'];
const amount = ['price', 'totalDue', 'amount'];
const quantity = ['quantity'];
// const users = ['factor'];

const Table = ({
  fields, data, actions, onSelect
}) => (
  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr style={{ backgroundColor: '#F8F9FA' }}>
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
          data
          && data.map((item, index) => (
            <tr key={index}>
              {Object.keys(fields).map((j) => {
                let value = item[j];
                // if (users.includes(j)) {
                //   value = capitalize(value);
                // }
                if (dates.includes(j)) {
                  value = format(value, 'DD MMM YYYY');
                }
                if (ids.includes(j)) {
                  value = cropId(value);
                }
                if (quantity.includes(j)) {
                  value = value.toLocaleString('en-us');
                }
                if (amount.includes(j) && value) {
                  const price = value.toLocaleString('en-us', {
                    style: 'currency',
                    currency: 'USD'
                  });
                  value = price.slice(1, price.length);
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
