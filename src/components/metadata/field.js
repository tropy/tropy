'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Editable } = require('../editable')
const { FormattedMessage } = require('react-intl')
const { parse } = require('url')
const { basename } = require('path')
const { pluck } = require('../../common/util')
const cx = require('classnames')
const { arrayOf, bool, func, number, oneOfType, shape, string } = PropTypes
const { isArray } = Array


class Field extends PureComponent {
  get defaultLabel() {
    const parts = parse(this.name)

    return parts.hash ?
      parts.hash.slice(1) : basename(parts.pathname)
  }

  get label() {
    return this.props.property.label || this.defaultLabel
  }

  get name() {
    return this.props.property.uri
  }

  get details() {
    return pluck(this.props.property, ['uri', 'definition', 'comment'])
  }

  get value() {
    return this.props.data[this.name]
  }

  get type() {
    return this.value ?
      this.value.type : this.props.property.type || 'text'
  }

  get classes() {
    return {
      'metadata-field': true,
      'extra': this.props.isExtra,
      [this.type]: true
    }
  }

  get editKey() {
    return isArray(this.props.data.id) ? 'bulk' : this.props.data.id
  }

  handleClick = () => {
    this.props.onEdit({
      field: {
        [this.props.property.uri]: this.editKey
      }
    })
  }

  handleChange = (text) => {
    this.props.onChange({
      id: this.props.data.id,
      data: {
        [this.name]: { text, type: this.type }
      }
    })
  }

  render() {
    const { isEditing, isDisabled, onEditCancel } = this.props
    const { value, label, classes,  details } = this

    return (
      <li className={cx(classes)}>
        <label title={details.join('\n\n')}>{label}</label>
        <div className="value" onClick={this.handleClick}>
          <Editable
            value={value ? value.text : null}
            isDisabled={isDisabled}
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }



  static propTypes = {
    data: shape({
      id: oneOfType([number, arrayOf(number)])
    }).isRequired,

    property: shape({
      uri: string.isRequired,
      label: string,
      type: string,
      definition: string,
      comment: string
    }),

    isEditing: bool,
    isDisabled: bool,
    isExtra: bool,

    onEdit: func,
    onEditCancel: func,
    onChange: func.isRequired,
    onContextMenu: func
  }

  static defaultProps = {
    data: {}
  }
}


const StaticField = ({ type, label, value }) => (
  <li className={cx({ 'metadata-field': true, 'static': true, [type]: true })}>
    <label><FormattedMessage id={label}/></label>
    <div className="value static">{value}</div>
  </li>
)

StaticField.propTypes = {
  label: string.isRequired,
  type: string.isRequired,
  value: oneOfType([string, number]).isRequired
}

module.exports = {
  Field,
  StaticField
}
