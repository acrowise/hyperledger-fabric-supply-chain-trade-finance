import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Spinner
} from '@blueprintjs/core';

import { post } from '../../helper/api';

import { INPUTS } from '../../constants';

const PlaceBidForm = ({
  dialogIsOpen, setDialogOpenState, invoiceId, role, rate = 0
}) => {
  const defaultFormState = {
    rate,
    invoiceId,
    role,
    touched: { rate: false }
  };
  const [formState, setFormState] = useState(defaultFormState);
  const [postRes, postAction] = post(`${dialogIsOpen.action}Bid`)();

  const errors = {
    rate: formState.rate <= 0
  };

  const shouldShowError = (field) => {
    const hasError = errors[field];
    const shouldShow = formState.touched[field];

    return hasError ? shouldShow : false;
  };

  const onBlur = () => {
    setFormState(Object.assign({}, formState, { touched: { rate: true } }));
  };

  return (
    <Overlay usePortal isOpen={dialogIsOpen.isOpen}>
      {postRes.pending ? <Spinner /> : <></>}
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '400px' }}>
          <div className="modal-header">Place Bid</div>
          <div className="modal-body">
            {INPUTS.PLACE_BID.map(({
              label, type, placeholder, field
            }) => (
              <FormGroup key={label} label={label}>
                <InputGroup
                  className={shouldShowError(field) ? 'bp3-intent-danger' : ''}
                  onBlur={onBlur}
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
                intent="primary"
                onClick={() => {
                  const hasErrors = Object.keys(errors).find(i => errors[i] === true);

                  if (!hasErrors) {
                    postAction({
                      fcn: `${dialogIsOpen.action}Bid`,
                      args: ['0', formState.rate, role, invoiceId]
                    }); // FIXME:  'f' === factor-id
                    setDialogOpenState({
                      isOpen: false,
                      action: null
                    });
                    setFormState(defaultFormState);
                  } else {
                    setFormState(Object.assign({}, formState, { touched: { rate: true } }));
                  }
                }}
              >
                Confirm
              </Button>
              <Button
                large
                intent="danger"
                onClick={() => {
                  setDialogOpenState({
                    isOpen: false,
                    action: null
                  });
                  setFormState(defaultFormState);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

PlaceBidForm.propTypes = {
  rate: PropTypes.number,
  action: PropTypes.string,
  role: PropTypes.string,
  invoiceId: PropTypes.string,
  dialogIsOpen: PropTypes.object,
  setDialogOpenState: PropTypes.func
};

export default PlaceBidForm;
