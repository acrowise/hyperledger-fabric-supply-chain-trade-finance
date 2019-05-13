// eslint-disable-next-line
export const formReducer = (state, action) => {
  switch (action.type) {
    case 'change':
      return Object.assign({}, state, {
        [action.payload.field]: action.payload.value
      });
    case 'reset':
      return action.payload;
    default:
      throw new Error();
  }
};
