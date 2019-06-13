import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { useSocket } from 'use-socketio';
import { get } from '../helper/api';

import VerifyProof from './Forms/VerifyProof';
import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';

import { filterData } from '../helper/utils';

import notifications from '../helper/notification';
import Loading from '../components/Loading';

const Proofs = ({
  actor, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [vpDialogIsOpen, setVpDialogOpenState] = useState(false);
  const [data, loading, setData] = get('listProofsByOwner');

  const [selectedProof, setSelectedProof] = useState({});

  useSocket('notification', (message) => {
    setData(notifications(data.result, message, 'proofs'));
  });

  let filteredData = data.result;

  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData
      .map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.PROOF[i.value.state] }));

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
    <Loading />
  ) : (
    <div>
      <VerifyProof
        dialogIsOpen={vpDialogIsOpen}
        setDialogOpenState={setVpDialogOpenState}
        proof={selectedProof}
        role={actor.role}
      />
      <Table
        fields={TABLE_MAP.PROOFS}
        data={filteredData}
        actions={item => (item.state === 'Generated' || item.state === 'Updated' ? (
            <div>
              <Button
                onClick={() => {
                  setSelectedProof(item);
                  setVpDialogOpenState(true);
                }}
                style={{ marginRight: '5px' }}
                intent="primary"
              >
                Verify {actor.role === 'uscts' ? 'Commertial Trade' : 'Goods'}
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
