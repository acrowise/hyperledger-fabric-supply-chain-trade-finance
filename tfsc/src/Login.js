import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Card, Elevation } from '@blueprintjs/core';

import { AuthConsumer } from './context/auth';
import { actors } from './constants';

const Login = () => (
  <AuthConsumer>
    {({ isAuth, login }) => (!isAuth ? (
        <div
          style={{
            display: 'flex',
            width: '70vw',
            flexWrap: 'wrap',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingTop: '10vh'
          }}
        >
          {actors.map(({ role, description }) => (
            // <Link
            //   style={{ textDecoration: 'none', color: 'black' }}
            //   key={role.toString()}
            //   to={{ pathname: '/dashboard', state: { role: role.toLowerCase() } }}
            // >
            <Card
              key={role.toString()}
              interactive
              elevation={Elevation.THREE}
              style={{ width: '300px', height: '250px', margin: '10px' }}
              onClick={() => {
                login(role.toLowerCase());
              }}
            >
              <h2>{role}</h2>
              <p style={{ maxWidth: '300px' }}>{description}</p>
            </Card>
            // </Link>
          ))}
        </div>
    ) : (
        <Redirect to="/dashboard" />
    ))
    }
  </AuthConsumer>
);

export default Login;
