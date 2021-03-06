import React, { useState } from 'react';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import { get } from '../helper/api';

import Table from '../components/Table/Table';
import { TABLE_MAP, STATUSES } from '../constants';
import VerifyProof from './Forms/VerifyProof';

import { filterData } from '../helper/utils';

import notifications from '../helper/notification';

import Loading from '../components/Loading';

const Reports = ({
  actor, filter, search, dataForFilter, setDataForFilter, filterOptions
}) => {
  const [vpDialogIsOpen, setVpDialogOpenState] = useState(false);
  const [data, loading, setData] = get('listReports');
  const [selectedReport, setSelectedReport] = useState({});

  useSocket('notification', (message) => {
    setData(notifications(data.result, message, 'reports'));
  });

  let filteredData = data.result;

  // FIXME:
  if (!loading && filteredData && filteredData.length > 0) {
    filteredData = filteredData.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.REPORT[i.value.state] }));
    // .filter(i => i.factor.toLowerCase() === role);

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
        proof={selectedReport}
        role={actor.role}
        type="update"
      />
      <Table
        fields={TABLE_MAP.REPORTS}
        data={filteredData}
        // actions={item => (item.owner === actor.id ? (
        //     <div>
        //       <Button
        //         onClick={() => {
        //           // setSelectedReport(item);
        //           // setVpDialogOpenState(true);
        //         }}
        //         style={{ marginRight: '5px' }}
        //         intent="primary"
        //       >
        //         Update Report
        //       </Button>
        //     </div>
        // ) : (
        //     <></>
        // ))
        // }
      />
    </div>
  );
};

Reports.propTypes = {
  role: PropTypes.string
};

export default Reports;
