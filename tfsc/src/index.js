import React from 'react';
import { render } from 'react-dom';
import { Route, BrowserRouter as Router } from 'react-router-dom';
import { ClientSocket } from 'use-socketio';

import App from './App';
import Dashboard from './containers/Dashboard';

const routing = (
  <Router>
    <ClientSocket url={'http://localhost:3000'}>
        <Route exact path="/" component={App} />
        <Route path="/dashboard" component={Dashboard} />
    </ClientSocket>
  </Router>
);

function renderApp() {
  render(routing, document.getElementById('root'));
}

renderApp();

if (module.hot) {
  module.hot.accept(renderApp);
}
