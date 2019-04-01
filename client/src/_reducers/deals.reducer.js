import {dealConstants} from '../_constants';

export function deals(state = {}, action) {
  const today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);

  switch (action.type) {
    case dealConstants.GETALL_REQUEST:
      return {...state, ...{
        loading: true,
        adding: undefined
      }};
    case dealConstants.GETALL_SUCCESS:
      const result = action.deals && action.deals.result &&
        action.deals.result.filter(r => r.value.timestamp * 1000 > today.getTime());

      return {...state, ...{
        items: result,
        loading: false
      }};
    case dealConstants.GETALL_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    case dealConstants.GETBYPERIOD_REQUEST:
      return {...state, ...{
          loading: true,
          adding: undefined
        }};
    case dealConstants.GETBYPERIOD_SUCCESS:
      const resultGetByPeriod = action.deals && action.deals.result &&
        action.deals.result.filter(r => r.value.timestamp * 1000 > today.getTime());

      return {...state, ...{
        items: resultGetByPeriod,
        loading: false
      }};
    case dealConstants.GETBYPERIOD_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    case dealConstants.GETFORCREATORBYPERIOD_REQUEST:
      return {...state, ...{
          loading: true,
          adding: undefined
        }};
    case dealConstants.GETFORCREATORBYPERIOD_SUCCESS:
      const resultGetForCreatorByPeriod = action.deals && action.deals.result &&
        action.deals.result.filter(r => r.value.timestamp * 1000 > today.getTime());

      return {...state, ...{
        items: resultGetForCreatorByPeriod,
        loading: false
      }};
    case dealConstants.GETFORCREATORBYPERIOD_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};
    case dealConstants.ADD_REQUEST:
      return {...state, ...{
        adding: true
      }};
    case dealConstants.ADD_SUCCESS:
      return {...state, ...{
        adding: false
      }};
    case dealConstants.ADD_FAILURE:
      return {...state, ...{
        error: action.error
      }};
    case dealConstants.EDIT_REQUEST:
      return {...state, ...{
        adding: true
      }};
    case dealConstants.EDIT_SUCCESS:
      return {...state, ...{
        adding: false
      }};
    case dealConstants.EDIT_FAILURE:
      return {...state, ...{
        error: action.error
      }};
    case dealConstants.HISTORY_REQUEST:
      return {...state, ...{
        loading: true
      }};
    case dealConstants.HISTORY_SUCCESS:
      return {...state, ...{
        history: {
          //[action.product.key.name]: action.history.result
        },
        loading: false
      }};
    case dealConstants.HISTORY_FAILURE:
      return {...state, ...{
        error: action.error,
        loading: false
      }};

    default:
      return state;
  }
}
