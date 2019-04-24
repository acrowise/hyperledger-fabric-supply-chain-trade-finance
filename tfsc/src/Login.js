import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Elevation } from '@blueprintjs/core';

import { actors } from './mocks';

const Login = () => (
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
      <Link
        style={{ textDecoration: 'none', color: 'black' }}
        key={role.toString()}
        to={{ pathname: '/dashboard', state: { role: role.toLowerCase() } }}
      >
        <Card
          interactive
          elevation={Elevation.THREE}
          style={{ width: '300px', height: '250px', margin: '10px' }}
        >
          <h2>{role}</h2>
          <p style={{ maxWidth: '300px' }}>{description}</p>
        </Card>
      </Link>
    ))}
  </div>
);

export default Login;
