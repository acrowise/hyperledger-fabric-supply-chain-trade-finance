import React from 'react';
import { hot } from 'react-hot-loader';
import { Redirect } from 'react-router-dom';
import {
  Button, Card, FormGroup, InputGroup
} from '@blueprintjs/core';

import { AuthConsumer } from './context/auth';
import { actors } from './constants';
import Nav from './containers/Nav';
import Icon from './components/Icon/Icon';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import './styles/styles.scss';

const state = window.__STATE__; // eslint-disable-line no-underscore-dangle
const actor = actors.find(({ role }) => role.toLowerCase() === state.role);

const App = () => (
  <AuthConsumer>
    {({ isAuth, login }) => (!isAuth ? (
        <>
          <Nav />
          <div className="login">
            <Card className="modal" style={{ width: '670px' }}>
              <div className="modal-header">Log in</div>
              <div
                className="modal-body"
                style={actor ? { display: 'flex', justifyContent: 'center' } : {}}
              >
                <div className="role-list">
                  {actor ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div
                        key={actor.role.toString()}
                        className="role-item"
                        title={actor.description}
                        style={{ margin: 0 }}
                      >
                        <span className="role-item-icon">
                          <Icon name={actor.role} />
                        </span>
                        <div className="role-item-txt">{actor.role}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <FormGroup label="Email" style={{ margin: 10 }}>
                          <InputGroup type="email" placeholder={'Email'} />
                        </FormGroup>
                        <FormGroup label="Password" style={{ margin: 10 }}>
                          <InputGroup type="password" placeholder={'Password'} />
                        </FormGroup>
                      </div>
                    </div>
                  ) : (
                    actors.map(({ role, description }) => (
                      <div
                        key={role.toString()}
                        className="role-item"
                        title={description}
                        onClick={() => {
                          login(state);
                        }}
                      >
                        <span className="role-item-icon">
                          <Icon name={role} />
                        </span>
                        <div className="role-item-txt">{role}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <Button
                  large
                  intent="primary"
                  className="btn-modal"
                  onClick={() => {
                    login(state);
                  }}
                >
                  Log in
                </Button>
              </div>
            </Card>
          </div>
        </>
    ) : (
        <Redirect to={actor && actor.role === 'admin' ? '/admin' : '/dashboard'} />
    ))
    }
  </AuthConsumer>
);

export default (module.hot ? hot(module)(App) : App);
