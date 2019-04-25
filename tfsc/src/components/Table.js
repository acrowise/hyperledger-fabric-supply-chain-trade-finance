import React from 'react';
import PropTypes from 'prop-types';

const Table = ({
  fields, data, actions, onSelect
}) => (
  <table className="bp3-html-table">
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
        <>No Data</>
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
                {i[j]}
              </td>
            ))}

            <td>{actions(i)}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

Table.propTypes = {
  fields: PropTypes.object,
  data: PropTypes.array,
  actions: PropTypes.func,
  onSelect: PropTypes.func
};

export default Table;
