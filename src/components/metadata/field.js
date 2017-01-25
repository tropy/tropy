'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Editable } = require('../editable')
const { FormattedMessage } = require('react-intl')
const { noop } = require('../../common/util')
const cn = require('classnames')


class Field extends Component {
  get label() {
    return this.props.property.label
  }

  get name() {
    return this.props.property.uri
  }

  get value() {
    return this.props.data[this.name]
  }

  get type() {
    return this.value ?
      this.value.type : this.props.property.type || 'text'
  }

  handleClick = () => {
    this.props.onActivate(this.name)
  }

  handleChange = (value) => {
    this.props.onChange({
      [this.name]: { value, type: this.type }
    })
  }

  render() {
    const { isEditing, isDisabled, onCancel } = this.props
    const { value, type, label, handleClick, handleChange } = this

    return (
      <li className={cn({ 'metadata-field': true, [type]: true })}>
        <label>{label}</label>
        <div className="value" onClick={handleClick}>
          <Editable
            value={value ? value.value : null}
            isDisabled={isDisabled}
            isEditing={isEditing}
            onCancel={onCancel}
            onChange={handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,

    property: PropTypes.shape({
      uri: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
    }),

    data: PropTypes.object.isRequired,

    onActivate: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onActivate: noop, onCancel: noop, onChange: noop
  }
}


const StaticField = ({ type, label, value }) => (
  <li className={cn({ 'metadata-field': true, 'static': true, [type]: true })}>
    <label><FormattedMessage id={label}/></label>
    <div className="value static">{value}</div>
  </li>
)

StaticField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  value: PropTypes.onOf([
    PropTypes.string,
    PropTypes.number
  ]).isRequired
}

module.exports = {
  Field,
  StaticField
}
