import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, Icon } from '@blueprintjs/core';
import { useSocket } from 'use-socketio';
import Nav from './Nav';

import Orders from './Orders';
import Invoices from './Invoices';
import Contracts from './Contracts';
import ShippingDocuments from './ShippingDocuments';
import Proofs from './Proofs';
import Filter from '../components/Filter';

const tabs = props => [
  {
    name: 'Orders',
    actors: ['buyer', 'supplier'],
    panel: (
      <Filter statuses={['New', 'Accepted', 'Cancelled']} {...props}>
        <Orders {...props} />
      </Filter>
    )
  },
  {
    name: 'Contracts',
    actors: ['buyer', 'supplier', 'ggcb', 'uscts', 'transporter'],
    panel: (
      <Filter statuses={['Signed', 'Completed']} {...props}>
        <Contracts {...props} />
      </Filter>
    )
  },
  {
    name: 'Invoices',
    actors: ['buyer', 'supplier', 'ggcb', 'uscts', 'factor-1', 'factor-2'],
    panel: (
      <Filter statuses={['Created', 'Signed', 'For Sale', 'Sold']} {...props}>
        <Invoices {...props} />
      </Filter>
    )
  },
  {
    name: 'Shipping Documents',
    actors: ['buyer', 'supplier', 'transporter'],
    panel: (
      <Filter statuses={[]} {...props}>
        <ShippingDocuments {...props} />
      </Filter>
    )
  },
  {
    name: 'Proofs',
    actors: ['ggcb', 'uscts'],
    panel: (
      <Filter statuses={[]} {...props}>
        <Proofs {...props} />
      </Filter>
    )
  }
];

const Title = ({ title, notification }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    {notification === title ? (
      <Icon style={{ marginBottom: '9px' }} icon="symbol-circle" intent={'danger'} />
    ) : (
      <></>
    )}
    <p>{title}</p>
  </div>
);

const Dashboard = ({ location: { state } }) => {
  const [test, setTest] = useState('');
  useSocket('notification', (message) => {
    const notification = JSON.parse(message);
    setTest('Orders');
  });

  const userTabs = tabs(state)
    .filter(i => i.actors.includes(state.role))
    .map(({ name, panel }) => (
      <Tab id={name} key={name} title={Title({ title: name, notification: test })} panel={panel} />
    ));

  const [activeTab, changeTab] = useState(userTabs[0].id);

  return (
    <div style={{ marginTop: '60px' }}>
      <Tabs
        renderActiveTabPanelOnly
        large
        animate
        id="TabsExample"
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
    <>
      <Nav {...props} />
      <Dashboard {...props} />
    </>
  );
}

export default Wrapper;
