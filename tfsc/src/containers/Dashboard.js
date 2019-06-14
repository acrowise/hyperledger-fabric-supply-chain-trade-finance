import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, Button } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import { Redirect } from 'react-router-dom';

import Nav from './Nav';

import Orders from './Orders';
import Invoices from './Invoices';
import Contracts from './Contracts';
import Shipments from './Shipments';
import Proofs from './Proofs';
import Filter from '../components/Filter';
import Reports from './Reports';
import Bids from './Bids';

import OrderPurchaseForm from './Forms/OrderPurchase';

import { AuthConsumer } from '../context/auth';
import { NOTIFICATIONS_TAB } from '../constants';

const NewPurchaseOrder = ({ actor }) => {
  const [dialog, setDialog] = useState({
    isOpen: false
  });

  return actor.role === 'buyer' ? (
    <>
      <OrderPurchaseForm dialog={dialog} setDialog={setDialog} />
      <Button
        intent="primary"
        className="btn-new-order"
        onClick={() => {
          setDialog({ isOpen: true });
        }}
      >
        New Purchase Order
      </Button>
    </>
  ) : (
    <></>
  );
};

const tabs = actor => [
  {
    name: 'Orders',
    actors: ['buyer', 'supplier', 'bank'],
    panel: (
      <Filter tab="orders" actionComponent={<NewPurchaseOrder actor={actor} />}>
        <Orders actor={actor} />
      </Filter>
    )
  },
  {
    name: 'Contracts',
    actors: ['buyer', 'supplier'],
    panel: (
      <Filter tab="contracts">
        <Contracts role={actor.role} />
      </Filter>
    )
  },
  {
    name: 'Invoices',
    actors: ['buyer', 'supplier', 'factor 1', 'factor 2', 'bank'],
    panel: (
      <Filter tab="invoices">
        <Invoices actor={actor} />
      </Filter>
    )
  },
  {
    name: 'Shipments',
    actors: ['buyer', 'supplier', 'transporter', 'transport_agency'],
    panel: (
      <Filter tab="shipments">
        <Shipments role={actor.role} />
      </Filter>
    )
  },
  {
    name: 'Proofs',
    actors: ['ggcb', 'uscts'],
    panel: (
      <Filter tab="proofs">
        <Proofs actor={actor} />
      </Filter>
    )
  },
  {
    name: 'Reports',
    actors: ['ggcb', 'uscts'],
    panel: (
      <Filter tab="reports">
        <Reports actor={actor} />
      </Filter>
    )
  },
  {
    name: 'Bids',
    actors: ['factor 1', 'factor 2', 'supplier'],
    panel: (
      <Filter tab="bids">
        <Bids actor={actor} />
      </Filter>
    )
  }
];

const Title = ({ title, notification }) => (
  <div className="dashboard-tabs-tab">
    <p>{title}</p>
    {NOTIFICATIONS_TAB[notification] === title.toLowerCase() ? (
      <div className="new-dot-notification" />
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

const Dashboard = ({ actor }) => {
  const [tabNotifications, setNotifications] = useState('');
  useSocket('notification', (message) => {
    const notification = JSON.parse(message);
    setNotifications(notification.type);
  });

  const userTabs = tabs(actor)
    .filter(i => i.actors.includes(actor.role))
    .map(({ name, panel }) => (
      <Tab
        id={name}
        key={name}
        title={Title({ title: name, notification: tabNotifications })}
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
          setNotifications(false);
        }}
      >
        {userTabs}
      </Tabs>
    </div>
  );
};

function Wrapper(props) {
  return (
    <AuthConsumer>
      {({ isAuth, logout, actor }) => (isAuth ? (
          <>
            <Nav role={actor.role} logout={logout} {...props} />
            <Dashboard isAuth={isAuth} actor={actor} {...props} />
          </>
      ) : (
          <Redirect to="/" />
      ))
      }
    </AuthConsumer>
  );
}

Dashboard.propTypes = {
  actor: PropTypes.shape({
    role: PropTypes.string
  })
};

NewPurchaseOrder.propTypes = {
  actor: PropTypes.shape({
    role: PropTypes.string
  })
};

Title.propTypes = {
  title: PropTypes.string,
  notification: PropTypes.string
};

Panel.propTypes = {
  panel: PropTypes.element
};

export default Wrapper;
