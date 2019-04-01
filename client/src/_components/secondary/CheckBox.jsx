import React from 'react';

class CheckBox extends React.Component {
  render() {
    const {id, label, checked, onChange} = this.props;

    return (
      <div className="form-check">
        <input className="form-check-input" type="checkbox" checked={checked} id={id} onChange={onChange}/>
        <label className="form-check-label" htmlFor={id}>
          {label}
        </label>
      </div>
    );
  }
}

export default CheckBox;
