import React from 'react';
import {connect} from 'react-redux';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import CheckBox from './secondary/CheckBox';
import 'react-datepicker/dist/react-datepicker.css';

const components = {
  DatePicker,
  CheckBox
};

/*
items property example:

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
 */
class FilterContainer extends React.Component {
  constructor(props) {
    super(props);
    const {items, handleSubmit, setParams} = this.props;

    this.items = items || [];

    let filterStates = {};

    this.instruments = this.items.map(
      element => {
        if (typeof components[element.type] !== "undefined") {
          filterStates[element.state.name] = element.state.value;
          return components[element.type]
        } else {
          throw new Error(`There is no such Component ${element.type}`);
        }
      }
    );
    this.state = {filterStates};

    this.handleSubmit = handleSubmit.bind(this);
    this.setParams = setParams.bind(this);

    this.setParams(this.prepareFilterStates(filterStates));
  }

  handleChange(state, value) {
    value = (value && typeof value !== "undefined") ? (typeof value.target !== "undefined" ? (value.target.type === 'checkbox' ? value.target.checked : value) : value) : value;

    this.setState(prevState => ({
      filterStates: {
        ...prevState.filterStates,
        [state]: value
      }
    }));
    let filterStates = this.state.filterStates;
    filterStates = {...filterStates, [state]: value};
    this.setParams(this.prepareFilterStates(filterStates));
  }

  prepareFilterStates(filterStates) {
    let parameters = {};
    this.items.map(
      element => {
        return parameters[element.state.name] = moment.isMoment(filterStates[element.state.name]) ? filterStates[element.state.name].format('X') : filterStates[element.state.name] === null ? element.defaultValue : filterStates[element.state.name];
      }
    );
    return parameters;
  }

  prepareSubmit(event) {
    let parameters = this.prepareFilterStates(this.state.filterStates)
    this.handleSubmit(parameters, event);
  }

  render() {
    if (this.items.length === 0) {
      return null;
    }

    return (
      <form onSubmit={this.prepareSubmit.bind(this)}>
        {this.instruments.map((Instrument, index) => {
          let proporties = this.items[index].properties;
          proporties[this.items[index].state.nameProp] = this.state.filterStates[this.items[index].state.name];

          return (
            <div className="form-group row">
              <label htmlFor={"input" + index}
                     className="col-sm-2 col-form-label">{this.items[index].label}</label>
              <div className="col-sm-10">
                <Instrument
                  id={"input" + index}
                  onChange={this.handleChange.bind(this, this.items[index].state.name)}
                  {...proporties}
                />
              </div>
            </div>
          );
        })}
        <div className="form-group row">
          <div className="col-sm-10">
            <button type="submit" className="btn btn-primary">Apply</button>
          </div>
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  const {deals} = state;
  return {
    deals
  };
}

const connected = connect(mapStateToProps)(FilterContainer);
export {connected as FilterContainer};
