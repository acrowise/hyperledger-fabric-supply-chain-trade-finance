import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Spinner
} from '@blueprintjs/core';

import { useAsyncEndpoint } from '../hooks';

const defaultFormState = {
  productName: '',
  quantity: 0,
  price: 0,
  destinationPort: '',
  dueDate: ''
};

const postNewOrder = () => useAsyncEndpoint(data => ({
  url: 'http://localhost:3000/placeOrder',
  method: 'POST',
  data
}));

const OrderForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [newOrder, placeOrder, r] = postNewOrder();

  if (!newOrder.pending && (newOrder.complete || newOrder.error)) {
    setDialogOpenState(false);
    r();
  }

  const FORM_FIELDS = [
    {
      label: 'Product Name',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'productName'
    },
    {
      label: 'Price',
      placeholder: 'Placeholder text',
      type: 'number',
      field: 'price'
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
    },
    {
      label: 'Destination Port',
      placeholder: 'Placeholder text',
      type: 'text',
      field: 'destinationPort'
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
          {newOrder.pending && !newOrder.complete ? (
            <Spinner large intent='primary' />
          ) : (
            <>
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
                    setFormState(defaultFormState);
                    placeOrder(formState);
                  }}
                >
                  Order
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </Overlay>
  );
};

OrderForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default OrderForm;
