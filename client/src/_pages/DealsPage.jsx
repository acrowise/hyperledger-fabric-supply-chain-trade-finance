import React from 'react';
import {connect} from 'react-redux';

import {Chart, DealsTable, FilterContainer} from '../_components';
import {dealActions} from '../_actions';
import {formatter} from '../_helpers';
import {commonConstants} from '../_constants';
import moment from 'moment';
import {socketService} from '../_services';

const parametersMap = {
  from: "fromDate",
  to: "toDate",
  creator: "myDeals"
};

const columns = [{
  Header: 'Lender',
  id: 'value.lender',
  accessor: rec => formatter.org(rec.value.lender)
}, {
  Header: 'Borrower',
  id: 'value.borrower',
  accessor: rec => formatter.org(rec.value.borrower)
}, {
  Header: 'Amount, ' + commonConstants.CURRENCY_SIGN,
  id: 'value.amount',
  accessor: rec => formatter.number(rec.value.amount)
}, {
  Header: 'Rate, ' + commonConstants.RATE_SIGN,
  id: 'value.rate',
  accessor: rec => formatter.rate(rec.value.rate)
}, {
  Header: 'Date & Time',
  id: 'value.timestamp',
  accessor: rec => formatter.datetime(new Date(rec.value.timestamp * 1000))
}];

const itemsFilterContainer = [
  {
    type: "DatePicker",
    label: "From",
    state: {nameProp: "selected", name: parametersMap.from, value: moment()},
    defaultValue: '0',
    properties: {
      isClearable: "true",
      autoComplete: "off"
    }
  },
  {
    type: "DatePicker",
    label: "To",
    state: {nameProp: "selected", name: parametersMap.to, value: moment()},
    defaultValue: '0',
    properties: {
      isClearable: "true",
      autoComplete: "off"
    }
  },
  {
    type: "CheckBox",
    label: "",
    state: {nameProp: "checked", name: parametersMap.creator, value: false},
    defaultValue: false,
    properties: {
      label: "Only my Deals"
    }
  }
];

class DealsPage extends React.Component {

  constructor(props) {
    super(props);

    socketService.subscribe(() => this.refreshData());
  }

  handleSubmit(params, event = null) {
    event || event.preventDefault();

    const fnName = params[parametersMap.creator] ? 'getForCreatorByPeriod' : 'getByPeriod';
    this.props.dispatch(dealActions[fnName]([params[parametersMap.from], params[parametersMap.to]]));
  }

  setParams(params) {
    this.filterParams = params;
  }

  refreshData() {
    if (this.filterParams && this.filterParams[parametersMap.creator] !== 'undefined') {
      const fnName = this.filterParams[parametersMap.creator] ? 'getForCreatorByPeriod' : 'getByPeriod';
      this.props.dispatch(dealActions[fnName]([this.filterParams[parametersMap.from], this.filterParams[parametersMap.to]]));
    } else {
      this.props.dispatch(dealActions.getAll());
    }
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col">
            <FilterContainer items={itemsFilterContainer}
                             handleSubmit={this.handleSubmit.bind(this)}
                             setParams={this.setParams.bind(this)}/>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <DealsTable columns={columns} refreshData={this.refreshData.bind(this)}/>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <Chart formatXAxis={formatter.datetime} lineType="liner"/>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {deals, authentication} = state;
  const {user} = authentication;
  return {
    user,
    deals
  };
}

const connected = connect(mapStateToProps)(DealsPage);
export {connected as DealsPage};
