import React from 'react';
import { hot } from 'react-hot-loader';
import { Redirect } from 'react-router-dom';
import {
  Button, Card
} from '@blueprintjs/core';

import { AuthConsumer } from './context/auth';
import { actors } from './constants';
import Nav from './containers/Nav';
import Icon from './components/Icon/Icon';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import './styles/styles.scss';

const App = () => (
  <AuthConsumer>
    {({ isAuth, login }) => (!isAuth ? (
        <>
          <Nav />
          <div className="login">
            <Card className="modal" style={{ width: '670px' }}>
              <div className="modal-header">Log in</div>
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
                        <Icon name={role} />
                      </span>
                      <div className="role-item-txt">{role}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <Button large intent="primary" className="btn-modal">
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

export default (module.hot ? hot(module)(App) : App);
