import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Navbar, Alignment, Button, Popover
} from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import logo from '../logo.svg';
import { EVENTS_MAP } from '../constants';
import Profile from '../components/Icon/Profile';
import Icon from '../components/Icon/Icon';

const Nav = ({ role, logout }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogOut, setShowLogOut] = useState(false);
  const [hasNewNotifications, setNewNotification] = useState(0);

  useSocket('notification', (message) => {
    setNotifications(notifications.concat(JSON.parse(message)));
    setNewNotification(hasNewNotifications + 1);
  });

  const Notifications = () => (
    <div className="header-notifications">
      {notifications.map((n, i) => (
        <div key={i.toString()} className="header-notifications-item">
          <Icon name="tick" />
          <p style={{ paddingLeft: '15px' }}>{EVENTS_MAP[n.type]}</p>
        </div>
      ))}
    </div>
  );

  let profileName = role;
  if (role === 'ggcb' || role === 'uscts') {
    profileName = role.toUpperCase();
  }

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
            {role !== 'admin' ? (
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
            ) : (
              <></>
            )}

            <Popover
              // position="auto-end"
              minimal
              onClose={() => {
                setShowLogOut(false);
              }}
              isOpen={showLogOut}
              content={
                <div
                  style={{
                    width: '124px',
                    height: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <a
                    style={{ color: '#1B263C' }}
                    onClick={() => {
                      setShowLogOut(false);
                      logout();
                    }}
                  >
                    Log out
                  </a>
                </div>
              }
              target={
                <Button
                  className="bp3-minimal"
                  icon={<Profile name={role} />}
                  style={{ textTransform: 'capitalize', marginLeft: 50 }}
                  onClick={() => {
                    setShowLogOut(true);
                  }}
                >
                  {profileName}
                </Button>
              }
            />
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
