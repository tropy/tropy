'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Editable } = require('../editable')
const { FormattedMessage } = require('react-intl')
const { parse } = require('url')
const { basename } = require('path')
const { pluck } = require('../../common/util')
const cn = require('classnames')


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

  handleClick = () => {
    this.props.onEdit({
      field: { [this.props.data.id]: this.name }
    })
  }

  handleChange = (text) => {
    this.props.onMetadataSave({
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
      <li className={cn(classes)}>
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
    data: PropTypes.shape({
      id: PropTypes.number
    }).isRequired,

    property: PropTypes.shape({
      uri: PropTypes.string.isRequired,
      label: PropTypes.string,
      type: PropTypes.string,
      definition: PropTypes.string,
      comment: PropTypes.string
    }),

    isEditing: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isExtra: PropTypes.bool,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onMetadataSave: PropTypes.func,
    onContextMenu: PropTypes.func
  }

  static defaultProps = {
    data: {}
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
