import React from 'react';
import {connect} from 'react-redux';

import {AddOrder, Chart, OrdersTable, DealsTable, Modal} from '../_components';
import {orderActions, dealActions, modalActions} from '../_actions';
import {modalIds} from '../_constants';
import {NavLink} from 'react-router-dom';
import {socketService} from '../_services';

class HomePage extends React.Component {

  constructor(props) {
    super(props);

    socketService.subscribe(() => this.refreshData());
  }

  componentDidUpdate(prevProps) {
    const {orders, dispatch} = this.props;

    if (orders.adding === false) {
      this.refreshData();
      dispatch(modalActions.hide(modalIds.addOrder));
      dispatch(modalActions.hide(modalIds.editOrder));
    }
  }

  refreshData(shadowMode) {
    this.props.dispatch(dealActions.getAll(shadowMode));
    this.props.dispatch(orderActions.getAll(shadowMode));
  }

  render() {
    return (
      <div>
        <div className="row justify-content-between">
          <button className="btn btn-primary mb-2" onClick={()=>Modal.open(this.props.dispatch, modalIds.addOrder)}>
            Place Order
          </button>
          <NavLink to='/deals' className="btn btn-primary mb-2">
            Deals Details
          </NavLink>
        </div>
        <Modal modalId={modalIds.addOrder} title="Place Order">
          <AddOrder/>
        </Modal>
        <Modal modalId={modalIds.editOrder} title="Edit Order">
          <AddOrder/>
        </Modal>
        <div className="row">
          <div className="col-6">
            <OrdersTable/>
          </div>
          <div className="col-6">
            <DealsTable/>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Chart lineType="liner"/>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {orders, deals, authentication, modals} = state;
  const {user} = authentication;
  return {
    orders,
    user,
    deals,
    modals
  };
}

const connected = connect(mapStateToProps)(HomePage);
export {connected as HomePage};
