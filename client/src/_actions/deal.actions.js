// @flow
import {dealConstants} from '../_constants';
import {dealService} from '../_services';
import {alertActions} from './';
import type {Action, ThunkAction, Dispatch, ErrorAction, Deal} from '../_types';
import type {ListResponse} from '../_types/Response';


export const dealActions = {
  add,
  edit,
  getAll,
  getByPeriod,
  getForCreatorByPeriod
};

type DealsAction = Action & {deals: ListResponse<Deal>};

function add(deal: Deal): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request());
    dealService.add(deal)
      .then(
        _ => {
          dispatch(success());
          dispatch(alertActions.success('Deal was added'));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(): Action {
    return {type: dealConstants.ADD_REQUEST}
  }

  function success(): Action {
    return {type: dealConstants.ADD_SUCCESS}
  }

  function failure(error: string): ErrorAction {
    return {type: dealConstants.ADD_FAILURE, error}
  }
}

function edit(deal: Deal): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request());
    dealService.edit(deal)
      .then(
        _ => {
          dispatch(success());
          dispatch(alertActions.success('Deal was updated'));
        },
        error => {
          dispatch(failure(error.toString()));
          dispatch(alertActions.error(error.toString()));
        }
      );
  };

  function request(): Action {
    return {type: dealConstants.EDIT_REQUEST}
  }

  function success(): Action {
    return {type: dealConstants.EDIT_SUCCESS}
  }

  function failure(error: string): ErrorAction {
    return {type: dealConstants.EDIT_FAILURE, error}
  }
}

function getAll(shadowMode: boolean = false): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request(shadowMode));

    dealService.getAll()
      .then(
        deals => {
          dispatch(success(deals));
        },
        error => dispatch(failure(error.toString()))
      );
  };

  function request(shadowMode: boolean): Action {
    return {type: dealConstants.GETALL_REQUEST, shadowMode}
  }

  function success(deals: ListResponse<Deal>): DealsAction {
    return {type: dealConstants.GETALL_SUCCESS, deals}
  }

  function failure(error: string): ErrorAction {
    return {type: dealConstants.GETALL_FAILURE, error}
  }
}

function getByPeriod(period: string[]): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request(period));

    dealService.getByPeriod(period)
      .then(
        products => {
          dispatch(success(products));
        },
        error => dispatch(failure(error.toString()))
      );
  };

  function request(period: string[]): Action {
    return {type: dealConstants.GETBYPERIOD_REQUEST, period}
  }

  function success(deals: ListResponse<Deal>): DealsAction {
    return {type: dealConstants.GETBYPERIOD_SUCCESS, deals}
  }

  function failure(error: string): ErrorAction {
    return {type: dealConstants.GETBYPERIOD_FAILURE, error}
  }
}

function getForCreatorByPeriod(period: string[]): ThunkAction {
  return (dispatch: Dispatch) => {
    dispatch(request(period));

    dealService.getForCreatorByPeriod(period)
      .then(
        deals => {
          dispatch(success(deals));
        },
        error => dispatch(failure(error.toString()))
      );
  };

  function request(period: string[]): Action {
    return {type: dealConstants.GETFORCREATORBYPERIOD_REQUEST, period}
  }

  function success(deals: ListResponse<Deal>): DealsAction {
    return {type: dealConstants.GETFORCREATORBYPERIOD_SUCCESS, deals}
  }

  function failure(error: string): ErrorAction {
    return {type: dealConstants.GETFORCREATORBYPERIOD_FAILURE, error}
  }
}
