import React from 'react';
import {NavLink} from 'react-router-dom';
import {connect} from 'react-redux';
import logo from '../static/AltorosLogo_mini1.png';

import {formatter} from '../_helpers';

class Header extends React.Component {
  render() {
    const {user} = this.props;
    return (
      <nav className="navbar navbar-light navbar-expand">
        <div className="navbar-brand"><img src={logo} alt="logo"/></div>
        {user && <div className="container-fluid">
          <div className='ml-5'>Hi, <b>{user.name}</b> from <i>{formatter.org(user.org)}</i></div>
          <ul className="nav navbar-nav pull-xs-right">

            <li className="nav-item">
              <NavLink exact to='/' className="nav-link">
                Dashboard
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to='/deals' className="nav-link">
                Deals
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to='/summary' className="nav-link">
                Summary
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to='login' className="nav-link">
                Logout
              </NavLink>
            </li>
          </ul>
        </div>}
      </nav>
    );
  }
}

function mapStateToProps(state) {
  const {user} = state.authentication;
  return {
    user
  };
}

const connected = connect(mapStateToProps)(Header);
export {connected as Header};
