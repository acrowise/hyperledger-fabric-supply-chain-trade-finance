import React from 'react';
import { render } from 'react-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { ClientSocket } from 'use-socketio';
import App from './App';
import Dashboard from './containers/Dashboard';
import { AuthProvider } from './context/auth';

import '../favicon.ico';

console.log('window.__STATE__', window.__STATE__);

const routing = (
  <Router>
    <AuthProvider>
      <ClientSocket url={`${window.location.origin}`}>
        <Switch>
          <Route exact path="/" component={App} />
          <Route path="/dashboard" component={Dashboard} />
        </Switch>
      </ClientSocket>
    </AuthProvider>
  </Router>
);

function renderApp() {
  render(routing, document.getElementById('root'));
}

renderApp();

if (module.hot) {
  module.hot.accept(renderApp);
}
