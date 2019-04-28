import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Spinner, Label
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { post } from '../helper/api';

import ActionCompleted from '../components/ActionCompleted';

const defaultFormState = {
  productName: '',
  quantity: 0,
  price: 0,
  destinationPort: '',
  dueDate: new Date()
};

const OrderForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const [formState, setFormState] = useState(defaultFormState);
  const [newOrder, placeOrder, r] = post('placeOrder')();

  if (!newOrder.pending) {
    if (newOrder.complete) {
      setTimeout(() => {
        setDialogOpenState(false);
        r();
      }, 1500);
      // r();
    }
    if (newOrder.error) {
      // TODO:
    }
    // setTimeout(() => {
    //   setDialogOpenState(false);
    // }, 1500);

    // r();
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
          {newOrder.complete && newOrder.data ? (
            <ActionCompleted action="New Order Purchased" result="Accepted" />
          ) : (
            <></>
          )}
          {newOrder.pending && !newOrder.complete ? <Spinner large intent="primary" /> : <></>}
          {!newOrder.pending && !newOrder.complete && !newOrder.data ? (
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
              <Label>
                Due Date
                <DateInput
                  value={formState.dueDate}
                  formatDate={date => date.toLocaleDateString()}
                  onChange={(date) => {
                    console.log(date);
                    setFormState(
                      Object.assign({}, formState, {
                        dueDate: date
                      })
                    );
                  }}
                  timePrecision={undefined}
                  parseDate={str => new Date(str)}
                  placeholder={'D/M/YYYY'}
                />
              </Label>
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
          ) : (
            <></>
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
