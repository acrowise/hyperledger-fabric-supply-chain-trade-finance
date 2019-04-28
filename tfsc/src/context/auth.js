import React, { useState } from 'react';

const AuthContext = React.createContext();
const AuthConsumer = AuthContext.Consumer;

const AuthProvider = (props) => {
  const [state, setState] = useState({
    isAuth: false,
    role: null
  });

  const login = (role) => {
    setState({ isAuth: true, role });
  };

  return (
    <AuthContext.Provider
      value={{
        role: state.role,
        isAuth: state.isAuth,
        login
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthConsumer };
