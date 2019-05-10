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
    <div className="header-notifications">
      {notifications.map((n, i) => (
        <div
          key={i.toString()}
          className="header-notifications-item"
        >
          Type: {n.type}
        </div>
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
        {role && (
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
                    className="bp3-minimal header-notifications-btn"
                    style={{ textTransform: 'capitalize' }}
                    onClick={() => {
                      setShowNotifications(true);
                    }}
                  >
                    Notifications
                    {hasNewNotifications !== 0 && (
                      <div className="header-notifications-quantity">
                        {hasNewNotifications}
                      </div>
                    )}
                  </Button>
                </div>
              }
            />

            <Button
              className="bp3-minimal"
              icon="user"
              style={{ textTransform: 'capitalize', marginLeft: 50 }}
            >
              {role}
            </Button>
          </Navbar.Group>
        )}
      </div>
    </Navbar>
  );
};

Nav.propTypes = {
  role: PropTypes.string,
  logout: PropTypes.func
};

export default Nav;
