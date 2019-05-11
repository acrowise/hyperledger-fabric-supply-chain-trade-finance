import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Navbar, Alignment, Button, Popover
} from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import logo from '../logo.svg';
import { title } from '../mocks';
import Profile from '../components/Icon/Profile';

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
        <div key={i.toString()} className="header-notifications-item">
          <svg
            width="18"
            height="15"
            viewBox="0 0 18 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 8.44828L6.42105 13L16 2"
              stroke="#69D7BC"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p style={{ paddingLeft: '5px' }}>{title[n.type]}</p>
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
                      <div className="header-notifications-quantity">{hasNewNotifications}</div>
                    )}
                  </Button>
                </div>
              }
            />

            <Button
              className="bp3-minimal"
              icon={<Profile name={role} />}
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
