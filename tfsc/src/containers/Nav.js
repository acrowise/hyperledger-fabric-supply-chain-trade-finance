import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Navbar, Alignment, Button, Popover
} from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import logo from '../logo.svg';

const Nav = ({ role, logout }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setNewNotification] = useState(0);

  useSocket('notification', (message) => {
    setNotifications(notifications.concat(JSON.parse(message)));
    setNewNotification(hasNewNotifications + 1);
  });

  const Notifications = () => (
    <div>
      {notifications.map((n, i) => (
        <p key={i.toString()} style={{ margin: '5px' }}>
          Type: {n.type}
        </p>
      ))}
    </div>
  );

  return (
    <Navbar fixedToTop className="header">
      <div className="container">
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading onClick={logout}>
            <img src={logo} alt="Altoros" className="header-logo" />
          </Navbar.Heading>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <Popover
            onClose={() => {
              setNewNotification(0);
              setShowNotifications(false);
            }}
            isOpen={showNotifications}
            content={<Notifications />}
            target={
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Button
                  className="bp3-minimal"
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => {
                    setShowNotifications(true);
                  }}
                >
                  Notifications
                </Button>
                {hasNewNotifications !== 0 ? (
                  <div
                    style={{
                      borderRadius: '100%',
                      height: '1.5em',
                      width: '1.5em',
                      textAlign: 'center',
                      backgroundColor: '#69D7BC'
                    }}
                  >
                    <p
                      style={{
                        color: 'white',
                        marginTop: '0.2em'
                      }}
                    >
                      {hasNewNotifications}
                    </p>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            }
          />

          <Button className="bp3-minimal" icon="user" style={{ textTransform: 'capitalize' }}>
            {role}
          </Button>
        </Navbar.Group>
      </div>
    </Navbar>
  );
};

Nav.propTypes = {
  role: PropTypes.string,
  logout: PropTypes.func
};

export default Nav;
