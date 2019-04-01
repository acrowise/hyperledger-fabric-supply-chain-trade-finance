import {combineReducers} from 'redux';

import {authentication} from './authentication.reducer';
import {alert} from './alert.reducer';
import {config} from './config.reducer';
import {loading} from './loading.reducer';
import {deals} from './deals.reducer';
import {orders} from './orders.reducer';
import {modals} from './modals.reducer';

const rootReducer = combineReducers({
  authentication,
  alert,
  loading,
  deals,
  config,
  orders,
  modals
});

export default rootReducer;