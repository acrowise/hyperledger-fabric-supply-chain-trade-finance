import React from 'react';
import { Redirect } from 'react-router-dom';
import {
  Button, Overlay, FormGroup, InputGroup, Card, Label
} from '@blueprintjs/core';

import { AuthConsumer } from './context/auth';
import { actors } from './constants';
import Nav from './containers/Nav';
import Icon from './components/Icon/Icon';

const Login = () => (
  <AuthConsumer>
    {({ isAuth, login }) => (!isAuth ? (
      <>
      <Nav />
      <div className="login">
        <Card className="modal" style={{ width: '670px' }}>
          <div className="modal-header">
            Log in
          </div>
          <div className="modal-body">
            <div className="role-list">
              {actors.map(({ role, description }) => (
                <div
                  key={role.toString()}
                  className="role-item"
                  title={description}
                  onClick={() => {
                    login(role.toLowerCase());
                  }}
                >
              <span className="role-item-icon">
                <Icon name={role}/>
              </span>
                  <div className="role-item-txt">
                    {role}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <Button
              large
              intent="primary"
              className="btn-modal"
            >
              Log in
            </Button>
          </div>
        </Card>
      </div>
      </>
    ) : (
        <Redirect to="/dashboard" />
    ))
    }
  </AuthConsumer>
);

export default Login;
