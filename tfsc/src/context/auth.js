import React, { useState } from 'react';

const AuthContext = React.createContext();
const AuthConsumer = AuthContext.Consumer;

const AuthProvider = (props) => {
  const [state, setState] = useState({
    isAuth: false,
    actor: null
  });

  const login = (actor) => {
    setState({ isAuth: true, actor });
  };

  const logout = () => setState({ isAuth: false, actor: null });

  return (
    <AuthContext.Provider
      value={{
        actor: state.actor,
        isAuth: state.isAuth,
        login,
        logout
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthConsumer };
