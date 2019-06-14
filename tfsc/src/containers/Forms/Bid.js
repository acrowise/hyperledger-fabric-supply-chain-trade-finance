import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card
} from '@blueprintjs/core';

import { post } from '../../helper/api';

import { INPUTS } from '../../constants';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

const PlaceBidForm = ({ dialog, setDialog }) => {
  const defaultFormState = Object.assign(
    {},
    {
      rate: 0,
      action: '',
      role: '',
      invoiceId: '',
      touched: { rate: false }
    },
    dialog.state
  );

  const [formState, setFormState] = useState(defaultFormState);
  const [postRes, postAction, resetPost] = post(`${formState.action}Bid`)();

  useEffect(() => {
    setFormState(defaultFormState);
  }, [dialog.state]);

  const errors = {
    rate: formState.rate <= 0 || formState.rate >= 100
  };

  const shouldShowError = (field) => {
    const hasError = errors[field];
    const shouldShow = formState.touched[field];

    return hasError ? shouldShow : false;
  };

  const onBlur = () => {
    setFormState(Object.assign({}, formState, { touched: { rate: true } }));
  };

  if (!postRes.pending) {
    if (postRes.complete) {
      setTimeout(() => {
        setDialog({
          isOpen: false,
          state: null
        });
        resetPost();
      }, 1500);
    }
  }

  return (
    <Overlay usePortal isOpen={dialog.isOpen}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '400px' }}>
          {postRes.pending || postRes.complete || postRes.data ? (
            <ActionCompleted res={postRes} action="Bid" result="Placed" />
          ) : (
            <>
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
                          fcn: `${dialog.state.action}Bid`,
                          args: [
                            dialog.state.action === 'place' ? '0' : formState.id,
                            formState.rate,
                            dialog.state.actorId,
                            formState.invoiceId
                          ]
                        });
                        // setDialog({
                        //   isOpen: false,
                        //   state: null
                        // });
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
                      setDialog({
                        isOpen: false,
                        state: null
                      });
                      setFormState(defaultFormState);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </Overlay>
  );
};

PlaceBidForm.propTypes = {
  dialog: PropTypes.object,
  setDialog: PropTypes.func
};

export default PlaceBidForm;
