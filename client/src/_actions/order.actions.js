
import {orderConstants} from '../_constants';
import {orderService} from '../_services';
import {alertActions} from './';
import type {Action, ThunkAction, Dispatch, ErrorAction, Order, ListResponse} from '../_types';

export const orderActions = {
  getAll,
  add,
  edit,
  accept,
  cancel
};

type OrdersAction = Action & {orders: ListResponse<Order>};

function getAll(shadowMode: boolean = false): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request(shadowMode));
    orderService.getAll()
      .then(
         requests => {
          dispatch(success(requests));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(shadowMode: boolean) {
    return {type: orderConstants.GET_ALL_REQUEST, shadowMode}
  }

  function success(orders: ListResponse<Order>): OrdersAction {
    return {type: orderConstants.GET_ALL_SUCCESS, orders}
  }

  function failure(error: string): ErrorAction {
    return {type: orderConstants.GET_ALL_FAILURE, error}
  }
}

function add(order: Order, comment: string): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request());
    orderService.add(order, comment)
      .then(
        _ => {
          dispatch(success());
          dispatch(alertActions.success('Order was added'));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(): Action {
    return {type: orderConstants.ADD_REQUEST}
  }

  function success(): Action {
    return {type: orderConstants.ADD_SUCCESS}
  }

  function failure(error): ErrorAction {
    return {type: orderConstants.ADD_FAILURE, error}
  }
}

function edit(order: Order): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request());
    orderService.edit(order)
      .then(
        _ => {
          dispatch(success());
          dispatch(alertActions.success('Order was updated'));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(): Action {
    return {type: orderConstants.EDIT_REQUEST}
  }

  function success(): Action {
    return {type: orderConstants.EDIT_SUCCESS}
  }

  function failure(error): ErrorAction {
    return {type: orderConstants.EDIT_FAILURE, error}
  }
}

function accept(order: Order): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request());
    orderService.accept(order)
      .then(
        _ => {
          dispatch(success());
          dispatch(alertActions.success('Order was accepted'));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(): Action {
    return {type: orderConstants.ACCEPT_REQUEST}
  }

  function success(): Action {
    return {type: orderConstants.ACCEPT_SUCCESS}
  }

  function failure(error): ErrorAction {
    return {type: orderConstants.ACCEPT_FAILURE, error}
  }
}

function cancel(order: Order): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request());
    orderService.cancel(order)
      .then(
        _ => {
          dispatch(success());
          dispatch(alertActions.success('Order was cancelled'));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(): Action {
    return {type: orderConstants.CANCEL_REQUEST}
  }

  function success(): Action {
    return {type: orderConstants.CANCEL_SUCCESS}
  }

  function failure(error): ErrorAction {
    return {type: orderConstants.CANCEL_FAILURE, error}
  }
}