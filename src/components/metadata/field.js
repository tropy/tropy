'use strict'

const React = require('react')
const { PureComponent } = React
const { Editable } = require('../editable')
const { FormattedMessage } = require('react-intl')
const { pluck } = require('../../common/util')
const { getLabel } = require('../../common/ontology')
const { IconLock, IconWarning } = require('../icons')
const cx = require('classnames')
const { TYPE } = require('../../constants')
const { auto } = require('../../format')
const {
  arrayOf, bool, func, number, oneOfType, shape, string
} = require('prop-types')


class MetadataField extends PureComponent {
  get classes() {
    return {
      'metadata-field': true,
      'extra': this.props.isExtra,
      'mixed': this.props.isMixed,
      [this.props.type]: true
    }
  }

  get isBlank() {
    return this.props.text == null || this.props.text === ''
  }

  get isInvalid() {
    return this.props.isRequired && this.isBlank
  }

  get label() {
    return this.props.property.label || getLabel(this.props.property.id)
  }

  get property() {
    return this.props.property.id
  }

  get details() {
    return pluck(this.props.property, ['id', 'description', 'comment'])
  }

  handleClick = () => {
    if (!this.props.isDisabled && !this.props.isReadOnly) {
      this.props.onEdit(this.props.id, this.property)
    }
  }

  handleChange = (text) => {
    this.props.onChange({
      id: this.props.id,
      data: {
        [this.property]: { text, type: this.props.type }
      }
    })
  }

  handleCancel = (isCommitUnchanged) => {
    if (isCommitUnchanged) {
      return this.handleChange(this.props.text)
    }

    this.props.onEditCancel()
  }

  render() {
    const { classes, details, label } = this

    return (
      <li className={cx(classes)}>
        <label title={details.join('\n\n')}>{label}</label>
        <div className="value" onClick={this.handleClick}>
          <Editable
            value={this.props.text}
            display={auto(this.props.text, this.props.type)}
            placeholder={this.props.placeholder}
            isEditing={this.props.isEditing}
            isRequired={this.props.isRequired}
            onCancel={this.handleCancel}
            onChange={this.handleChange}/>
          {this.isInvalid && <IconWarning/>}
          {this.props.isReadOnly && <IconLock/>}
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
    isRequired: bool,
    isReadOnly: bool,

    property: shape({
      id: string.isRequired,
      label: string,
      type: string,
      description: string,
      comment: string
    }),

    placeholder: string,
    text: string,
    type: string.isRequired,

    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onChange: func.isRequired
  }

  static defaultProps = {
    type: TYPE.TEXT
  }
}


class StaticField extends PureComponent {
  get classes() {
    return [
      'metadata-field',
      'static',
      { clickable: this.props.onClick != null }
    ]
  }

  render() {
    return this.props.value && (
      <li className={cx(this.classes)}>
        <label>
          <FormattedMessage id={this.props.label}/>
        </label>
        <div
          className="value static"
          onClick={this.props.onClick}>
          {this.props.value}
        </div>
      </li>
    )
  }

  static propTypes = {
    label: string.isRequired,
    value: oneOfType([string, number]).isRequired,
    onClick: func
  }
}


module.exports = {
  MetadataField,
  StaticField
}
