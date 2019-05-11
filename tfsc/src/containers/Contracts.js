import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from 'use-socketio';
import { Button } from '@blueprintjs/core';

import { useFetch } from '../hooks';

import TransportRequestForm from './Forms/TransportRequest';
import Table from '../components/Table/Table';

import { TABLE_MAP, STATUSES } from '../constants';

const Contracts = ({ role }) => {
  const [data, loading, setData] = useFetch('listContracts');
  const [tsrDialogIsOpen, setTsrDialogOpenState] = useState({
    state: false,
    item: {}
  });

  const onMessage = (message) => {
    const notification = JSON.parse(message);
    if (notification.type === 'contractCreated') {
      const newState = data.result.concat(notification);
      setData({ result: newState });
    }
  };

  useSocket('notification', onMessage);

  let dataToDisplay = data.result;

  if (dataToDisplay) {
    dataToDisplay = dataToDisplay.map(i => Object.assign({}, i.value, { id: i.key.id, state: STATUSES.CONTRACT[i.value.state] }));
  }

  return loading ? (
    <>Loading...</>
  ) : (
    <div>
      <TransportRequestForm
        dialogIsOpen={tsrDialogIsOpen}
        setDialogOpenState={setTsrDialogOpenState}
      />
      <Table
        fields={TABLE_MAP.CONTRACTS}
        data={dataToDisplay}
        actions={item => (role === 'supplier' && item.state === 'Signed' ? (
            <div>
              <Button
                onClick={() => {
                  setTsrDialogOpenState({ state: true, item });
                }}
                style={{ marginRight: '5px', padding: '6px 15px' }}
                intent="primary"
              >
                New Shipment
                <svg
                  style={{margin: '-2px 0 -5px 7px'}}
                  width='31'
                  height='23'
                  viewBox='0 0 31 23'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'>
                  <path fillRule='evenodd' clipRule='evenodd' d='M7.6642 14.9856C7.11192 14.9856 6.6642 14.5379 6.6642 13.9856V8.6642H1.34277C0.790489 8.6642 0.342773 8.21649 0.342773 7.6642C0.342773 7.11192 0.790489 6.6642 1.34277 6.6642H6.6642V1.34277C6.6642 0.790488 7.11192 0.342773 7.6642 0.342773C8.21649 0.342773 8.6642 0.790488 8.6642 1.34277V6.6642H13.9856C14.5379 6.6642 14.9856 7.11192 14.9856 7.6642C14.9856 8.21649 14.5379 8.6642 13.9856 8.6642H8.6642V13.9856C8.6642 14.5379 8.21649 14.9856 7.6642 14.9856ZM12.6428 3.02849C12.6428 2.75235 12.8666 2.52849 13.1428 2.52849H19.0428C19.3189 2.52849 19.5428 2.75235 19.5428 3.02849V8.84992H26.6285C26.8124 8.84992 26.9815 8.95091 27.0687 9.11287L30.0187 14.5914C30.058 14.6643 30.0785 14.7457 30.0785 14.8285V19.8856C30.0785 20.1618 29.8546 20.3856 29.5785 20.3856H26.2071L26.2059 20.3856C26.1643 21.7458 25.0487 22.8356 23.6785 22.8356C22.3083 22.8356 21.1926 21.7458 21.1511 20.3856L21.1499 20.3856H19.0428H12.2999C12.1195 20.3856 11.9614 20.2901 11.8735 20.1468C11.8768 20.1998 11.8785 20.2532 11.8785 20.3071C11.8785 21.7036 10.7464 22.8356 9.34992 22.8356C7.97971 22.8356 6.86406 21.7458 6.82255 20.3856L6.82134 20.3856H2.18563C1.90949 20.3856 1.68563 20.1618 1.68563 19.8856V12.2999C1.68563 12.0238 1.90949 11.7999 2.18563 11.7999C2.46177 11.7999 2.68563 12.0238 2.68563 12.2999V19.3856H6.82134C6.87831 19.3856 6.93305 19.3952 6.98407 19.4127C7.3453 18.4576 8.2683 17.7785 9.34992 17.7785C10.5562 17.7785 11.5651 18.6231 11.8176 19.7532C11.8757 19.5413 12.0696 19.3856 12.2999 19.3856H18.5428V9.34992V3.52849H13.1428C12.8666 3.52849 12.6428 3.30463 12.6428 3.02849ZM26.2071 19.3856C26.1501 19.3856 26.0954 19.3952 26.0443 19.4127C25.6831 18.4576 24.7601 17.7785 23.6785 17.7785C22.5969 17.7785 21.6739 18.4576 21.3126 19.4127C21.2616 19.3952 21.2069 19.3856 21.1499 19.3856H19.5428V9.84992H26.3298L29.0785 14.9545V19.3856H26.2071ZM10.8785 20.3071C10.8785 21.1513 10.1941 21.8356 9.34992 21.8356C8.50571 21.8356 7.82135 21.1513 7.82135 20.3071C7.82135 19.4629 8.50571 18.7785 9.34992 18.7785C10.1941 18.7785 10.8785 19.4629 10.8785 20.3071ZM23.6785 21.8356C24.5227 21.8356 25.2071 21.1513 25.2071 20.3071C25.2071 19.4629 24.5227 18.7785 23.6785 18.7785C22.8343 18.7785 22.1499 19.4629 22.1499 20.3071C22.1499 21.1513 22.8343 21.8356 23.6785 21.8356ZM21.1499 11.3785C20.8738 11.3785 20.6499 11.6023 20.6499 11.8785V14.4071C20.6499 14.6832 20.8738 14.9071 21.1499 14.9071H26.6285C26.8018 14.9071 26.9627 14.8173 27.0538 14.6699C27.1449 14.5225 27.1532 14.3384 27.0757 14.1835L25.8114 11.6549C25.7267 11.4855 25.5536 11.3785 25.3642 11.3785H21.1499ZM21.6499 13.9071V12.3785H25.0552L25.8195 13.9071H21.6499Z'
                        fill='#fff' />
                </svg>
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

Contracts.propTypes = {
  role: PropTypes.string
};

export default Contracts;
