import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card
} from '@blueprintjs/core';

import { post } from '../helper/api';

const defaultFormState = {
  consignor: '',
  consignee: '',
  totalDue: '',
  quantity: '',
  dueDate: ''
};

const InvoiceForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [newInvoice, placeInvoice] = post('placeInvoice')();

  const FORM_FIELDS = [
    {
      label: 'Consignor',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'consignor'
    },
    {
      label: 'Consignee',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'consignee'
    },
    {
      label: 'Total Due',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'totalDue'
    },
    {
      label: 'Quantity',
      placeholder: 'Placeholder text',
      type: 'number',
      field: 'quantity'
    },
    {
      label: 'Due Date',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'dueDate'
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
          {FORM_FIELDS.map(({
            label, type, placeholder, field
          }) => (
            <FormGroup key={label} label={label}>
              <InputGroup
                type={type}
                placeholder={placeholder}
                value={formState[field]}
                onChange={({ target }) => setFormState(
                  Object.assign({}, formState, {
                    [field]: target.value
                  })
                )
                }
              />
            </FormGroup>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                placeInvoice(formState);
                setFormState(defaultFormState);
              }}
            >
              Create Invoice
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

InvoiceForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default InvoiceForm;
