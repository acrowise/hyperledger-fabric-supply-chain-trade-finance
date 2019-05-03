import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Label
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { post } from '../../helper/api';

import ActionCompleted from '../../components/ActionCompleted';

import { INPUTS } from '../../constants';

import { formReducer } from '../../reducers';

const OrderForm = ({ dialogIsOpen, setDialogOpenState }) => {
  const initialState = {
    productName: '',
    quantity: 0,
    price: 0,
    destination: '',
    dueDate: new Date(),
    paymentDate: new Date()
  };
  const [formState, dispatch] = useReducer(formReducer, initialState);

  const [newOrder, placeOrder, reset] = post('placeOrder')();

  if (!newOrder.pending) {
    if (newOrder.complete) {
      setTimeout(() => {
        setDialogOpenState(false);
        reset();
      }, 1500);
    }
  }

  const handleOverlayClose = () => setDialogOpenState(false);

  return (
    <Overlay usePortal canOutsideClickClose isOpen={dialogIsOpen} onClose={handleOverlayClose}>
      <Card className="modal" style={{ width: '550px' }}>
        <ActionCompleted res={newOrder} action="New Order Purchased" result="Accepted" />
        {!newOrder.pending && !newOrder.complete && !newOrder.data ? (
          <>
            <div className="modal-header">New order</div>
            <div className="modal-body">
              {INPUTS.NEW_PURCHASE_ORDER.map(({
                label, type, placeholder, field
              }) => (
                <FormGroup key={label} label={label}>
                  <InputGroup
                    type={type}
                    placeholder={placeholder}
                    value={formState[field]}
                    onChange={({ target: { value } }) => dispatch({
                      type: 'change',
                      payload: {
                        field,
                        value
                      }
                    })
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
                    dispatch({
                      type: 'change',
                      payload: {
                        field: 'dueDate',
                        value: date
                      }
                    });
                  }}
                  timePrecision={undefined}
                  parseDate={str => new Date(str)}
                  placeholder={'D/M/YYYY'}
                />
              </Label>
            </div>
            <div className="modal-footer">
              <Button
                large
                intent="primary"
                className="btn-modal"
                onClick={() => {
                  placeOrder({
                    fcn: 'placeOrder',
                    args: [
                      '0',
                      formState.productName,
                      formState.quantity.toString(),
                      formState.price.toString(),
                      formState.destination,
                      formState.dueDate.getTime().toString(),
                      formState.paymentDate.getTime().toString(), // TODO: PaymentDate
                      'a' // TODO: buyer Id
                    ]
                  });
                  dispatch({ type: 'reset', payload: initialState });
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
    </Overlay>
  );
};

OrderForm.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default OrderForm;
