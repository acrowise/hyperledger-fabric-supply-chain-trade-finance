import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { useFetch } from '../hooks';

import VerifyProof from './Forms/VerifyProof';
import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';

import { filterData } from '../helper/utils';

const Proofs = ({
  role, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [vpDialogIsOpen, setVpDialogOpenState] = useState(false);
  const [data, loading, setData] = useFetch('listProofs');

  const [selectedProof, setSelectedProof] = useState({});
  const onNotification = (message) => {
    const notification = JSON.parse(message);

    if (notification.type === 'proofGenerated') {
      const newState = data.result.concat(notification.data);
      setData({ result: newState });
    }

    if (notification.type === 'validateProof') {
      const newState = data.result.concat([]);
      const itemToUpdateIndex = newState.findIndex(i => i.key.id === notification.data.key.id);
      newState[itemToUpdateIndex] = notification.data;
      setData({ result: newState });
    }
  };

  useSocket('notification', onNotification);

  let filteredData = data.result;

  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData
      .map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.PROOF[i.value.state] }))
      .filter(i => i.agency.id === role);

    if (dataForFilter.length === 0 && filteredData.length !== 0) {
      setDataForFilter(filteredData);
    }

    filteredData = filterData({
      type: 'id',
      status: filter,
      search,
      filterOptions,
      tableData: filteredData
    });
  }

  return loading ? (
    <>Loading...</>
  ) : (
    <div>
      <VerifyProof
        dialogIsOpen={vpDialogIsOpen}
        setDialogOpenState={setVpDialogOpenState}
        proof={selectedProof}
        role={role}
      />
      <Table
        fields={TABLE_MAP.PROOFS}
        data={filteredData}
        actions={item => (item.state === 'Generated' ? (
            <div>
              <Button
                onClick={() => {
                  setSelectedProof(item);
                  setVpDialogOpenState(true);
                }}
                style={{ marginRight: '5px' }}
                intent="primary"
              >
                Verify {role === 'uscts' ? 'Commertial Trade' : 'Goods'}
              </Button>
            </div>
        ) : (
            <></>
        ))
        }
      />
    </div>
  );
};

export default Proofs;

Proofs.propTypes = {
  role: PropTypes.string
};
