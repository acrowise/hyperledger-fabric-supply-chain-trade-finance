import React from 'react';
import { render } from 'react-dom';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { ClientSocket } from 'use-socketio';
import App from './App';
import Dashboard from './containers/Dashboard';
import { AuthProvider } from './context/auth';

console.log('process.env.ROLE', process.env.ROLE);
console.log('process.env.PORT', process.env.PORT);

const routing = (
  <Router>
    <AuthProvider>
      <ClientSocket url={'http://0.0.0.0:3000'}>
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