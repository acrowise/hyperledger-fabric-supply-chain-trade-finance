const stages = ['request', 'success', 'failure'];
const actions = ['login', 'getall', 'add', 'edit', 'history', 'getbyperiod', 'getforcreatorbyperiod'];

export const dealConstants = {};
actions.forEach(action => {
  stages.forEach(stage => {
    const key = `${action.toUpperCase()}_${stage.toUpperCase()}`;
    dealConstants[key] = 'DEAL_' + key;
  });
});
