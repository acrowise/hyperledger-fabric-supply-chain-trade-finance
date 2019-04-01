// @flow
import React from 'react';
import ReactTable from 'react-table';

type Props = {
  children: any[],
  initData: any[],
  loadData: Function
};
type State = {
};

export class HistoryTable extends React.Component<Props, State> {
  componentDidMount() {
    this.props.loadData(this.props.initData);
  }

  render() {
    const {children, ...rest} = this.props;

    return (
      <ReactTable
        className="-striped -highlight"
        defaultPageSize={10}
        filterable={true}
        {...rest}
      />
    );
  }
}