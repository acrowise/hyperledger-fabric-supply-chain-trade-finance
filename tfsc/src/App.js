import React from 'react';
import { hot } from 'react-hot-loader';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import './styles/styles.scss';

import Login from './Login';

const App = () => <Login />;

export default (module.hot ? hot(module)(App) : App);
