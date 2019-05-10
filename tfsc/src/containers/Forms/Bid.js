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
  const defaultFormState = { rate, invoiceId, role };
  const [formState, setFormState] = useState(defaultFormState);
  const [postRes, postAction] = post(`${dialogIsOpen.action}Bid`)();

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
                  postAction({
                    fcn: `${dialogIsOpen.action}Bid`,
                    args: ['0', formState.rate, role, invoiceId]
                  }); // FIXME:  'f' === factor-id
                  setDialogOpenState({
                    isOpen: false,
                    action: null
                  });
                  setFormState(defaultFormState);
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
