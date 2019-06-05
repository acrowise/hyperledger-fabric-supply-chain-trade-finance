import React from 'react';

import Nav from './Nav';
// import { AuthConsumer } from '../context/auth';
import CollapsiblePanel from '../components/Admin/Networks/CollapsiblePanel';
import Table from '../components/Table/Table';

const Admin = () => (
  <>
    <Nav
      role="admin"
      logout={() => {
        window.location.assign('/');
      }}
    />
    <div style={{ paddingTop: '65px' }}>
      <div style={{ width: '100vw', height: 4, backgroundColor: '#687585' }} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          paddingTop: 10,
          paddingLeft: 20,
          paddingRight: 20
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '45%',
            flex: 1
          }}
        >
          <h3 style={{ paddingLeft: '15px' }}>Networks info</h3>
          <CollapsiblePanel title="Peers" />
          <CollapsiblePanel title="Uploaded Chaincodes" />
          <CollapsiblePanel title="Channels" />
          <CollapsiblePanel title="Initiated Chaincodes" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{ paddingLeft: '15px' }}>Notifications</h3>
          <div style={{ marginTop: '15px' }}>
            <Table
              data={[]}
              fields={{
                id: 'Request Number',
                notification: 'Action',
                action: ''
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </>
);

export default Admin;
