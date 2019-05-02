import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { Redirect } from 'react-router-dom';

import Nav from './Nav';

import Orders from './Orders';
import Invoices from './Invoices';
import Contracts from './Contracts';
import ShippingDocuments from './ShippingDocuments';
import Proofs from './Proofs';
import Filter from '../components/Filter';
import Reports from './Reports';
import Bids from './Bids';

import { AuthConsumer } from '../context/auth';
import { notifications } from '../mocks';

const tabs = role => [
  {
    name: 'Orders',
    actors: ['buyer', 'supplier'],
    panel: (
      <Filter statuses={['New', 'Accepted', 'Cancelled']}>
        <Orders role={role} />
      </Filter>
    )
  },
  {
    name: 'Contracts',
    actors: ['buyer', 'supplier', 'ggcb', 'uscts'],
    panel: (
      <Filter statuses={['Signed', 'Completed']}>
        <Contracts role={role} />
      </Filter>
    )
  },
  {
    name: 'Invoices',
    actors: ['buyer', 'supplier', 'factor-1', 'factor-2'],
    panel: (
      <Filter statuses={['Issued', 'Signed', 'For Sale', 'Sold']}>
        <Invoices role={role} />
      </Filter>
    )
  },
  {
    name: 'Shipments',
    actors: ['buyer', 'supplier', 'transporter'],
    panel: (
      <Filter statuses={[]}>
        <ShippingDocuments role={role} />
      </Filter>
    )
  },
  {
    name: 'Proofs',
    actors: ['ggcb', 'uscts'],
    panel: (
      <Filter statuses={[]}>
        <Proofs role={role} />
      </Filter>
    )
  },
  {
    name: 'Reports',
    actors: ['ggcb', 'uscts'],
    panel: (
      <Filter statuses={['Generated', 'Validated']}>
        <Reports role={role} />
      </Filter>
    )
  },
  {
    name: 'Bids',
    actors: ['factor-1', 'factor-2'],
    panel: (
      <Filter statuses={['Accepted']}>
        <Bids role={role} />
      </Filter>
    )
  }
];

const Title = ({ title, notification }) => (
  <div className="dashboard-tabs-tab">
    <p>{title}</p>
    {notifications[notification] === title.toLowerCase() ? (
      <div
        style={{
          marginLeft: '5px',
          marginBottom: '7px',
          borderRadius: '100%',
          height: '8px',
          width: '8px',
          backgroundColor: '#69D7BC'
        }}
      />
    ) : (
      <></>
    )}
  </div>
);

const Panel = ({ panel }) => (
  <div className="dashboard-tabs-panel">
    <div className="container">{panel}</div>
  </div>
);

const Dashboard = ({ role }) => {
  const [test, setTest] = useState('');
  useSocket('notification', (message) => {
    const notification = JSON.parse(message);
    setTest(notification.type);
  });

  const userTabs = tabs(role)
    .filter(i => i.actors.includes(role))
    .map(({ name, panel }) => (
      <Tab
        id={name}
        key={name}
        title={Title({ title: name, notification: test })}
        panel={Panel({ panel })}
      />
    ));

  const [activeTab, changeTab] = useState(userTabs[0].id);

  return (
    <div className="dashboard">
      <Tabs
        renderActiveTabPanelOnly
        large
        animate
        id="TabsExample"
        className="dashboard-tabs"
        selectedTabId={activeTab}
        onChange={(id) => {
          changeTab(id);
          setTest(false);
        }}
      >
        {userTabs}
      </Tabs>
    </div>
  );
};

Dashboard.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      role: PropTypes.string
    })
  })
};

function Wrapper(props) {
  return (
    <AuthConsumer>
      {({ isAuth, logout, role }) => (isAuth ? (
          <>
            <Nav role={role} logout={logout} {...props} />
            <Dashboard isAuth={isAuth} role={role} {...props} />
          </>
      ) : (
          <Redirect to="/" />
      ))
      }
    </AuthConsumer>
  );
}

export default Wrapper;
