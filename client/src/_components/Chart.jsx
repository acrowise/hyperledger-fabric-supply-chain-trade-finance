// @flow
import React from 'react';
import {connect} from 'react-redux';
import {ComposedChart, ResponsiveContainer, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from 'recharts';

import type {Deal} from '../_types';
import {formatter} from '../_helpers';
import {commonConstants, DEFAULT_RATES} from '../_constants';

type Props = {
  deals: {items: Deal[]},
  lineType: string,
  formatXAxis: Function
};
type State = {
};

class LineBarAreaComposedChart extends React.Component<Props, State> {
  render () {
    const {deals, formatXAxis = formatter.time, lineType = 'liner'} = this.props;

    if (!deals || !deals.items) {
      return null;
    }

    const data = deals.items.map((r: Deal) => {
        return {
          ...r,
          ts: formatXAxis(new Date(r.value.timestamp * 1000))
        };
      })
      .sort((a, b) => {
        return a.value.timestamp > b.value.timestamp ? 1 : -1;
      });

    return !!data.length && (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}
                       margin={{top: 20, right: 20, bottom: 20, left: 20}}>
          <CartesianGrid stroke='#f5f5f5'/>
          <XAxis dataKey="value.ts" name="Time"/>
          <YAxis yAxisId="left" tickFormatter={formatter.rate} unit={commonConstants.RATE_SIGN} interval={0} ticks={DEFAULT_RATES} />
          <YAxis yAxisId="right" tickFormatter={formatter.number} orientation="right" unit={commonConstants.CURRENCY_SIGN}/>
          <Tooltip />
          <Legend />
          <Bar yAxisId="right" dataKey='value.amount' name="Amount" barSize={20} fill='#413ea0' unit={commonConstants.CURRENCY_SIGN} />
          <Line yAxisId="left" dataKey='value.rate' name="Rate" type={lineType} stroke='#ff7300' unit={commonConstants.RATE_SIGN} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
}

function mapStateToProps(state) {
  const {deals} = state;
  return {
    deals
  };
}

const connected = connect(mapStateToProps)(LineBarAreaComposedChart);
export {connected as Chart};
