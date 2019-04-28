import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, Checkbox, Card, MenuItem
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { post } from '../helper/api';

const reviewers = [
  {
    id: 'agency-1',
    title: 'Government Goods Control Bureau'
  },
  {
    id: 'agency-2',
    title: 'US Commercial Trade Service'
  }
];

const GenerateProofForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const defaultFormState = {
    contractId: false,
    consignorName: false,
    totalDue: false,
    quantity: false,
    destination: false,
    dueDate: false,
    paymentDay: false,
    doc1: false,
    reviewer: null
  };
  const [formState, setFormState] = useState(defaultFormState);
  const [proofRes, generateProof] = post('generateProof')();

  const FORM_FIELDS = [
    {
      label: 'Contract_Id',
      field: 'contractId'
    },
    {
      label: 'Consignor_Name',
      field: 'consignorName'
    },
    {
      label: 'Total_Due',
      field: 'totalDue'
    },
    {
      label: 'Quantity',
      field: 'quantity'
    },
    {
      label: 'Destination',
      field: 'destination'
    },
    {
      label: 'Due_Date',
      field: 'dueDate'
    },
    {
      label: 'Payment_Date',
      field: 'paymentDay'
    },
    {
      label: 'doc1',
      field: 'doc'
    },
    {
      label: 'Reviewer (GGCB)',
      field: 'ggcb'
    },
    {
      label: 'Reviewer (USCTS)',
      field: 'uscts'
    }
  ];

  return (
    <Overlay usePortal isOpen={dialogIsOpen}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card style={{ width: '20vw' }}>
          {FORM_FIELDS.map(({ label, field }) => (
            <Checkbox
              key={label}
              label={label}
              value={formState[field]}
              onChange={({ target }) => setFormState(
                Object.assign({}, formState, {
                  [field]: !formState[field]
                })
              )
              }
            />
          ))}
          <Select
            onItemSelect={(reviewer) => {
              setFormState(
                Object.assign({}, formState, {
                  reviewer
                })
              );
            }}
            itemRenderer={(item, { handleClick }) => (
              <MenuItem text={item.title} onClick={handleClick} />
            )}
            items={reviewers}
            filterable={false}
            popoverProps={{ minimal: true }}
          >
            <Button
              text={(formState.reviewer && formState.reviewer.title) || 'Select Reviewer'}
              rightIcon="double-caret-vertical"
            />
          </Select>
          <div style={{ paddingTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
            <Button
              large
              intent="danger"
              onClick={() => {
                setDialogOpenState(false);
                setFormState(defaultFormState);
              }}
            >
              Cancel
            </Button>
            <Button
              large
              intent="primary"
              onClick={() => {
                setDialogOpenState(false);
                generateProof(formState);
                console.log(formState);
                setFormState(defaultFormState);
              }}
            >
              Generate
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

GenerateProofForm.propTypes = {
  role: PropTypes.string,
  invoiceId: PropTypes.string,
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default GenerateProofForm;
