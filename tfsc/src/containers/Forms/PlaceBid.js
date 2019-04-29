import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Spinner
} from '@blueprintjs/core';

import { post } from '../../helper/api';

import { INPUTS } from '../../constants';

const PlaceBidForm = ({
  dialogIsOpen, setDialogOpenState, invoiceId, role
}) => {
  const defaultFormState = { rate: 0, invoiceId, role };
  const [formState, setFormState] = useState(defaultFormState);
  const [newBid, placeBid] = post('placeBid', true)();

  return (
    <Overlay usePortal isOpen={dialogIsOpen}>
      {newBid.pending ? <Spinner /> : <></>}
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card style={{ width: '20vw' }}>
          {INPUTS.PLACE_BID.map(({
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
                placeBid({
                  fcn: 'placeBid',
                  args: ['0', formState.rate.toString(), 'f', invoiceId]
                }); // FIXME:  f- factor-id
                setDialogOpenState(false);
                setFormState(defaultFormState);
              }}
            >
              Place
            </Button>
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

PlaceBidForm.propTypes = {
  role: PropTypes.string,
  invoiceId: PropTypes.string,
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default PlaceBidForm;
