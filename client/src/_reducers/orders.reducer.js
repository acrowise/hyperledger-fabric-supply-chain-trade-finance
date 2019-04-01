import {orderConstants} from '../_constants';

export function orders(state = {}, action) {
  switch (action.type) {
    case orderConstants.GET_ALL_REQUEST:
      return {...state, ...{
        adding: undefined,
        loading: true
      }};
    case orderConstants.GET_ALL_SUCCESS:
      return {...state, ...{
        items: action.orders.result,
        loading: false
      }};
    case orderConstants.GET_ALL_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    case orderConstants.ADD_REQUEST:
      return {...state, ...{
        adding: true
      }};
    case orderConstants.ADD_SUCCESS:
      return {...state, ...{
        adding: false
      }};
    case orderConstants.ADD_FAILURE:
      return {...state, ...{
        error: action.error
      }};
    case orderConstants.EDIT_REQUEST:
      return {...state, ...{
        adding: true
      }};
    case orderConstants.EDIT_SUCCESS:
      return {...state, ...{
        adding: false
      }};
    case orderConstants.EDIT_FAILURE:
      return {...state, ...{
        error: action.error
      }};
    case orderConstants.ACCEPT_REQUEST:
      return {...state, ...{
        loading: true
      }};
    case orderConstants.ACCEPT_SUCCESS:
      return {...state, ...{
        adding: false,
        loading: false
      }};
    case orderConstants.ACCEPT_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    case orderConstants.REJECT_REQUEST:
      return {...state, ...{
        loading: true
      }};
    case orderConstants.REJECT_SUCCESS:
      return {...state, ...{
        adding: false,
        loading: false
      }};
    case orderConstants.REJECT_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    case orderConstants.HISTORY_REQUEST:
      return {...state, ...{
        loading: true
      }};
    case orderConstants.HISTORY_SUCCESS:
      return {...state, ...{
        history: {
          //[action.req.key.productKey]: action.history.result
        },
        loading: false
      }};
    case orderConstants.HISTORY_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    default:
      return state
  }
}