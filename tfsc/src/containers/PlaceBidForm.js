import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Spinner
} from '@blueprintjs/core';

import { useAsyncEndpoint } from '../hooks';

const placeBidRequest = () => useAsyncEndpoint(data => ({
  url: 'http://localhost:3000/placeBid',
  method: 'POST',
  data
}));

const PlaceBidForm = ({
  dialogIsOpen, setDialogOpenState, invoiceId, role
}) => {
  const defaultFormState = { value: 0, invoiceId, role };
  const [formState, setFormState] = useState(defaultFormState);
  const [newBid, placeBid] = placeBidRequest();

  const FORM_FIELDS = [
    {
      label: 'Bid Value',
      placeholder: 'Placeholder text',
      type: 'number',
      field: 'value'
    }
  ];

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
                setFormState(defaultFormState);
                placeBid(formState);
              }}
            >
              Order
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
