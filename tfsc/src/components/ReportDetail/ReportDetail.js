import React from 'react';
import PropTypes from 'prop-types';
import { Overlay, Button, Card } from '@blueprintjs/core';
import './reportDetail.scss';

import { STATUSES, REVIEWERS } from '../../constants';
import { cropId } from '../../helper/utils';

const ReportDetail = ({ dialogIsOpen, setDialogOpenState, report }) => (report ? (
    <Overlay usePortal isOpen={dialogIsOpen}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '550px' }}>
          <div className="modal-header">Report {cropId(report.key.id)}</div>

          <div className="modal-body">
            <table className="proof-detail-table">
              <tbody>
                <tr>
                  <th>Report ID</th>
                  <td>{cropId(report.key.id)}</td>
                </tr>
                <tr>
                  <th>Agency</th>
                  <td>{REVIEWERS.find(i => i.id === report.value.owner).title}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td
                    style={{
                      backgroundColor: report.value && report.value.state === 2 ? '#FF8A80' : '#D3F3E8'
                    }}
                  >
                    {STATUSES.REPORT[report.value.state]}
                  </td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td>{report.value.description}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <Button
              text="Close"
              intent="primary"
              className="btn-modal"
              onClick={() => {
                setDialogOpenState(false);
              }}
            />
          </div>
        </Card>
      </div>
    </Overlay>
) : (
    <></>
));

ReportDetail.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func,
  report: PropTypes.object
};

export default ReportDetail;
