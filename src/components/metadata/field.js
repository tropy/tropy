'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Editable } = require('../editable')
const { FormattedMessage } = require('react-intl')
const { parse } = require('url')
const { basename } = require('path')
const { pluck } = require('../../common/util')
const cx = require('classnames')
const {
  arrayOf, bool, func, number, object, oneOfType, shape, string
} = PropTypes


class MetadataField extends PureComponent {
  get classes() {
    return {
      'metadata-field': true,
      'extra': this.props.isExtra,
      'mixed': this.props.isMixed,
      [this.props.type]: true
    }
  }

  get label() {
    return this.props.property.label || this.basename()
  }

  get uri() {
    return this.props.property.uri
  }

  get details() {
    return pluck(this.props.property, ['uri', 'definition', 'comment'])
  }

  basename(uri = this.uri) {
    const parts = parse(uri)

    return parts.hash ?
      parts.hash.slice(1) : basename(parts.pathname)
  }

  handleClick = () => {
    this.props.onEdit(this.props.id, this.uri)
  }

  handleChange = (text) => {
    this.props.onChange({
      id: this.props.id,
      data: {
        [this.uri]: { text, type: this.props.type }
      }
    })
  }

  render() {
    const { classes,  details, label } = this
    const { text, isEditing, isDisabled, onEditCancel } = this.props

    return (
      <li className={cx(classes)}>
        <label title={details.join('\n\n')}>{label}</label>
        <div className="value" onClick={this.handleClick}>
          <Editable
            value={text}
            isDisabled={isDisabled}
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }


  static propTypes = {
    id: oneOfType([number, arrayOf(number)]),

    isEditing: bool,
    isDisabled: bool,
    isExtra: bool,
    isMixed: bool,

    property: shape({
      uri: string.isRequired,
      label: string,
      type: string,
      definition: string,
      comment: string
    }),

    text: string,
    type: string.isRequired,

    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    type: 'text'
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
  MetadataField,
  StaticField
}
