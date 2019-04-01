// @flow
import React from 'react';
import {connect} from 'react-redux';
import Switch from 'rc-switch';
import Creatable from 'react-select/lib/Creatable';
import {components} from 'react-select';

import type {Order} from '../_types';
import {orderActions} from '../_actions';
import {commonConstants, DEFAULT_RATES} from '../_constants';

type Props = {
  dispatch: Function,
  initData: Order | any,
  setSubmitFn: Function
};
type State = {
  order: Order,
  submitted: boolean
};

const rateOptions = DEFAULT_RATES.reverse().map(v => ({
  value: v + '', label: v + ''
}));

class AddOrder extends React.Component<Props, State> {
  amountInput: ?HTMLInputElement;

  constructor(props) {
    super(props);

    const initData = this.props.initData || {
      key: {},
      value: {
        amount: undefined,
        rate: undefined,
        type: 1,
      }
    };

    this.state = {
      order: initData,
      submitted: false
    };

    (this:any).handleChange = this.handleChange.bind(this);
    (this:any).handleSubmit = this.handleSubmit.bind(this);
    (this:any).changeType = this.changeType.bind(this);
    (this:any).changeRate = this.changeRate.bind(this);

    //Modal integration
    this.props.setSubmitFn && this.props.setSubmitFn(this.handleSubmit);
  }

  componentDidMount() {
    const {amountInput} = this;
    amountInput && amountInput.focus();
  }

  changeType(newV: boolean) {
    const {order} = this.state;
    this.setState({
      order: {
        ...order,
        value: {
          ...order.value,
          type: newV === true ? 0 : 1
        }
      }
    });
  }

  changeRate(newV: {value: string}) {
    const {order} = this.state;
    this.setState({
      order: {
        ...order,
        value: {
          ...order.value,
          rate: (newV && newV.value) || ''
        }
      }
    });
  }

  handleChange(event: SyntheticInputEvent<>) {
    const {name, value} = event.target;
    const {order} = this.state;
    this.setState({
      order: {
        ...order,
        value: {
          ...order.value,
          [name]: value
        }
      },
      submitted: false
    });
  }

  handleSubmit(event: SyntheticEvent<>) {
    event.preventDefault();

    this.setState({submitted: true});
    const {order} = this.state;
    if (order.value.amount && order.value.rate) {
      this.props.dispatch(orderActions[order.key.id ? 'edit' : 'add'](order));
    }
  }


  render() {
    const {order, submitted} = this.state;
    return (
      <form name="form" onSubmit={this.handleSubmit}>
        <div className='form-group'>
          <label htmlFor="amount">Amount</label>

          <div className='input-group'>
            <div className="input-group-prepend">
              <span className="input-group-text">{commonConstants.CURRENCY_SIGN}</span>
            </div>
            <input type="text" className={"form-control" + (submitted && !order.value.amount ? ' is-invalid' : '')}
                      name="amount" value={order.value.amount}
                      ref={(input) => { this.amountInput = input; }}
                      onChange={this.handleChange}/>
            {submitted && !order.value.amount && <div className="text-danger invalid-feedback">Amount is required</div>}
          </div>
        </div>
        <Creatable
          name="rate"
          isClearable
          onChange={this.changeRate}
          placeholder="Select or type any value..."
          options={rateOptions}
          value={order.value.rate ? {value: order.value.rate, label: order.value.rate} : undefined}
          components={{ Control: (props) => (
            <div className='form-group'>
              <label htmlFor="rate">Rate</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">{commonConstants.RATE_SIGN}</span>
                </div>
                <components.Control
                  className={"form-control" + (submitted && !order.value.rate ? ' is-invalid' : '')} {...props} />
                {submitted && !order.value.rate && <div className="text-danger invalid-feedback">Rate is required</div>}
              </div>
            </div>
          ) }}
        />

        {!order.key.id && <div>
          <Switch
            name="type"
            onChange={this.changeType}
            checkedChildren={'Lend'}
            unCheckedChildren={'Borrow'}
          />
        </div>}
      </form>
    );
  }
}

function mapStateToProps(state) {
  const {order} = state;

  return {
    order
  }
}

const connected = connect(mapStateToProps)(AddOrder);
export {connected as AddOrder};