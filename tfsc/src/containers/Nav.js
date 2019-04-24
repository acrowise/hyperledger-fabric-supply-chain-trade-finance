import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Navbar, Alignment, Button, Popover, Icon
} from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { AppToaster } from '../toaster';

const Nav = ({ location: { state } }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setNewNotification] = useState(false);

  useSocket('notification', (message) => {
    AppToaster.show({
      icon: 'tick',
      intent: 'success',
      message
    });
    setNotifications(notifications.concat(JSON.parse(message)));
    setNewNotification(true);
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
    <Navbar fixedToTop>
      <Navbar.Group align={Alignment.LEFT}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Navbar.Heading>Trade Finance & Supply Chain Demo</Navbar.Heading>
        </Link>
        <Navbar.Divider />
      </Navbar.Group>
      <Navbar.Group align={Alignment.RIGHT}>
        <Popover
          onClose={() => {
            setShowNotifications(false);
          }}
          isOpen={showNotifications}
          content={<Notifications />}
          target={
            <div>
              <Icon
                icon="symbol-circle"
                intent={hasNewNotifications ? 'danger' : 'none'}
                onClick={() => {
                  setShowNotifications(true);
                }}
              />
              <Button
                className="bp3-minimal"
                style={{ textTransform: 'capitalize' }}
                onClick={() => {
                  setShowNotifications(true);
                }}
              >
                Notifications
              </Button>
            </div>
          }
        />

        <Button className="bp3-minimal" icon="user" style={{ textTransform: 'capitalize' }}>
          {state.role}
        </Button>
      </Navbar.Group>
    </Navbar>
  );
};

Nav.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      role: PropTypes.string
    })
  })
};

export default Nav;
