'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func, shape, string } = require('prop-types')
const { FormField, FormToggle } = require('../form')


class PluginOption extends PureComponent {
  get attrs() {
    return {
      id: this.props.spec.field,
      label: this.props.spec.label,
      title: this.props.spec.hint,
      tabIndex: 0,
      name: this.props.spec.field,
      onChange: this.handleChange,
      value: this.value,
      isCompact: true,
      isRequired: this.props.spec.required
    }
  }

  get value() {
    switch (this.props.spec.type) {
      case 'number':
        return Number(this.props.value).toString()
      default:
        return this.props.value
    }
  }

  format(value) {
    switch (this.props.spec.type) {
      case 'number':
        return Number(value)
      default:
        return value
    }
  }

  handleChange = ({ [this.props.spec.field]: value }) => {
    this.props.onChange(this.props.spec.field, this.format(value))
  }

  render() {
    switch (this.props.spec.type) {
      case 'bool':
      case 'boolean':
        return <FormToggle {...this.attrs}/>
      default:
        return <FormField {...this.attrs}/>
    }
  }

  static propTypes = {
    onChange: func.isRequired,
    spec: shape({
      field: string.isRequired,
      hint: string,
      label: string.isRequired,
      required: bool
    }).isRequired,
    value: string
  }
}

module.exports = {
  PluginOption
}
