'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Editable } = require('../editable')
const { FormattedMessage } = require('react-intl')
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
    this.props.onEdit({
      field: { [this.props.id]: this.name }
    })
  }

  handleChange = (value) => {
    this.props.onMetadataSave({
      id: this.props.id,
      data: {
        [this.name]: { value, type: this.type }
      }
    })
  }

  render() {
    const { isEditing, isDisabled, onEditCancel } = this.props
    const { value, type, label } = this

    return (
      <li className={cn({ 'metadata-field': true, [type]: true })}>
        <label>{label}</label>
        <div className="value" onClick={this.handleClick}>
          <Editable
            value={value ? value.value : null}
            isDisabled={isDisabled}
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    id: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired,
    property: PropTypes.shape({
      uri: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
    }),

    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onMetadataSave: PropTypes.func,
    onContextMenu: PropTypes.func
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
  value: PropTypes.oneOf([
    PropTypes.string,
    PropTypes.number
  ]).isRequired
}

module.exports = {
  Field,
  StaticField
}
