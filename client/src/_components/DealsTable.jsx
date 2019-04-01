// @flow
import React from 'react';
import ReactTable from 'react-table';
import {connect} from 'react-redux';

import type {Deal} from '../_types';
import {dealActions} from '../_actions';
import {formatter} from '../_helpers';
import {commonConstants} from '../_constants';

type Props = {
  dispatch: Function,
  deals: { items: Deal[] },
  columns: any[],
  refreshData: Function
};
type State = {};

const DEFAULT_COLUMNS = [{
  Header: 'Lender',
  id: 'value.lender',
  accessor: (rec: Deal) => formatter.org(rec.value.lender)
}, {
  Header: 'Borrower',
  id: 'value.borrower',
  accessor: (rec: Deal) => formatter.org(rec.value.borrower)
}, {
  Header: 'Amount, ' + commonConstants.CURRENCY_SIGN,
  id: 'value.amount',
  accessor: (rec: Deal) => formatter.number(rec.value.amount)
}, {
  Header: 'Rate, ' + commonConstants.RATE_SIGN,
  id: 'value.rate',
  accessor: (rec: Deal) => formatter.rate(rec.value.rate)
}, {
  Header: 'Date',
  id: 'value.timestamp',
  accessor: (rec: Deal) => formatter.time(new Date(rec.value.timestamp * 1000))
}];

class DealsTable extends React.Component<Props, State> {
  refreshData: Function;

  constructor(props) {
    super(props);

    const {refreshData} = this.props;

    (this: any).refreshData = refreshData ? refreshData.bind(this) : this.refreshDataDefault;
  }

  componentDidMount() {
    this.refreshData();
  }

  refreshDataDefault() {
    this.props.dispatch(dealActions.getAll());
  }

  render() {
    const {deals, columns} = this.props;

    if (!deals || !deals.items) {
      return null;
    }

    return (
      <ReactTable
        columns={columns || DEFAULT_COLUMNS}
        data={deals.items || []}
        className="-striped -highlight"
        defaultPageSize={10}
        minWidth={60}
        filterable={true}
        defaultSorted={[
          {
            id: "value.timestamp",
            desc: true
          }
        ]}
      />
    );
  }
}

function mapStateToProps(state) {
  const {deals} = state;
  return {
    deals
  };
}

const connected = connect(mapStateToProps)(DealsTable);
export {connected as DealsTable};
