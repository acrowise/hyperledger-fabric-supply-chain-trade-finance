// eslint-disable-next-line
export const formReducer = (state, action) => {
  switch (action.type) {
    case 'change':
      return Object.assign({}, state, {
        [action.payload.field]: action.payload.value
      });
    case 'reset':
      return action.payload;
    case 'touch':
      const { fields } = action;
      const touched = Object.assign({}, state.touched);
      fields.forEach((f) => {
        touched[f] = true;
      });
      return Object.assign({}, state, { touched });
    default:
      throw new Error();
  }
};
