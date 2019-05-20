import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Label
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';

import { post } from '../../helper/api';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

import { INPUTS } from '../../constants';

import { formReducer } from '../../reducers';

const OrderForm = ({ dialog, setDialog }) => {
  const orderState = dialog.state;

  const isEdit = dialog.state;

  const initialState = Object.assign(
    {},
    dialog.state || {
      productName: '',
      quantity: 0,
      price: 0,
      destination: ''
    },
    {
      dueDate: orderState ? new Date(orderState.dueDate) : new Date(),
      paymentDate: orderState ? new Date(orderState.paymentDate) : new Date(),
      touched: {
        productName: false,
        destination: false,
        price: false,
        quantity: false
      }
    }
  );

  const [formState, dispatch] = useReducer(formReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'reset', payload: initialState });
  }, [dialog.state]);

  const [newOrder, placeOrder, reset] = post(`${isEdit ? 'update' : 'place'}Order`)();

  const errors = {
    productName: formState.productName.length === 0,
    destination: formState.destination.length === 0,
    price: formState.price <= 0,
    quantity: formState.quantity <= 0
  };

  if (!newOrder.pending) {
    if (newOrder.complete) {
      setTimeout(() => {
        setDialog({
          isOpen: false,
          state: null
        });
        reset();
      }, 1500);
    }
  }

  const shouldShowError = (field) => {
    const hasError = errors[field];
    const shouldShow = formState.touched[field];

    return hasError ? shouldShow : false;
  };

  const onBlur = field => () => {
    dispatch({
      type: 'touch',
      fields: [field]
    });
  };

  const handleOverlayClose = () => {
    setDialog({ isOpen: false, state: null });
    dispatch({ type: 'reset', payload: initialState });
  };

  return (
    <Overlay usePortal canOutsideClickClose isOpen={dialog.isOpen} onClose={handleOverlayClose}>
      <Card className="modal" style={{ width: '720px' }}>
        <ActionCompleted
          res={newOrder}
          action={`${isEdit ? 'Update' : 'New'} Purchase Order`}
          result="Accepted"
        />
        {!newOrder.pending && !newOrder.complete && !newOrder.data ? (
          <>
            <div className="modal-header">{isEdit ? 'Update' : 'New'} Purchase Order</div>
            <div className="modal-body">
              <div className="row">
                {INPUTS.NEW_PURCHASE_ORDER.map(({
                  label, type, placeholder, field
                }) => (
                  <FormGroup className="col-6" key={label} label={label}>
                    <InputGroup
                      onBlur={onBlur(field)}
                      className={shouldShowError(field) ? 'bp3-intent-danger' : ''}
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

                <div className="col-6">
                  <div className="row">
                    <Label className="col-6">
                      Delivery Date
                      <DateInput
                        minDate={new Date()}
                        maxDate={
                          new Date(
                            new Date().getFullYear() + 2,
                            new Date().getMonth(),
                            new Date().getDate()
                          )
                        }
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
                        placeholder={'MM/DD/YYYY'}
                      />
                    </Label>
                    <Label className="col-6">
                      Payment Date
                      <DateInput
                        minDate={new Date()}
                        value={formState.paymentDate}
                        formatDate={date => date.toLocaleDateString()}
                        onChange={(date) => {
                          dispatch({
                            type: 'change',
                            payload: {
                              field: 'paymentDate',
                              value: date
                            }
                          });
                        }}
                        timePrecision={undefined}
                        parseDate={str => new Date(str)}
                        placeholder={'MM/DD/YYYY'}
                      />
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {isEdit ? (
                <Button large intent="danger" className="btn-modal" onClick={handleOverlayClose}>
                  Cancel
                </Button>
              ) : (
                <></>
              )}
              <Button
                large
                intent="primary"
                className="btn-modal"
                onClick={() => {
                  const hasErrors = Object.keys(errors).find(i => errors[i] === true);
                  if (!hasErrors) {
                    placeOrder({
                      fcn: `${isEdit ? 'update' : 'place'}Order`,
                      args: [
                        '0',
                        formState.productName,
                        formState.quantity,
                        formState.price,
                        formState.destination,
                        formState.dueDate.getTime().toString(),
                        formState.paymentDate.getTime().toString(),
                        'a' // FIXME: buyer Id
                      ],
                      peers: 'a/peer0', // FIXME:
                      id: formState.id
                    });
                    dispatch({ type: 'reset', payload: initialState });
                  } else {
                    dispatch({
                      type: 'touch',
                      fields: Object.keys(errors).filter(j => errors[j])
                    });
                  }
                }}
              >
                {isEdit ? 'Update' : 'Submit'}
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
