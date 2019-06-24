import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Overlay, FormGroup, InputGroup, Card
} from '@blueprintjs/core';
import uuid from 'uuid/v4';

import { post } from '../../helper/api';

import { INPUTS } from '../../constants';

import ActionCompleted from '../../components/ActionCompleted/ActionCompleted';

import { capitalize } from '../../helper/utils';

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
  const [actionText, setActionText] = useState('Placed');

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
            <ActionCompleted res={postRes} action="Bid" result={actionText} />
          ) : (
            <>
              <div className="modal-header">{capitalize(formState.action)} Bid</div>
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
                        setActionText(dialog.state.action === 'update' ? 'Updated' : 'Placed');
                        postAction({
                          fcn: `${dialog.state.action}Bid`,
                          args: [
                            dialog.state.action === 'place' ? uuid() : formState.id,
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
