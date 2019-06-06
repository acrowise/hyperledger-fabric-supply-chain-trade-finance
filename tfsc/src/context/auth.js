import React, { useState } from 'react';
import axios from 'axios';
import cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

const AuthContext = React.createContext();
const AuthConsumer = AuthContext.Consumer;

const getActor = () => {
  const token = cookies.get('token');
  return token ? jwt.decode(token) : null;
};

const AuthProvider = (props) => {
  const actor = getActor();

  const [state, setState] = useState({
    isAuth: !!actor,
    actor
  });

  const login = () => {
    axios
      .post('/login')
      .then(({ data }) => {
        cookies.set('token', data.jwt);
        setState({ isAuth: true, actor: jwt.decode(data.jwt) });
      })
      .catch((error) => {
        console.error(error);
        setState({ isAuth: false });
      });
  };

  const logout = () => {
    cookies.remove('token');
    setState({ isAuth: false, actor: null });
  };

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
