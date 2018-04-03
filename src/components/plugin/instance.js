'use strict'

const React = require('react')
const { PureComponent } = require('react')
const {
  arrayOf, bool, number, oneOf, object, oneOfType, shape, string
} = require('prop-types')
const { FormField, FormToggle } = require('../form')
const { get } = require('../../common/util')

class PluginInstance extends PureComponent {
  getValue({ field, default: defaultValue }) {
    const value = get(this.props.options, field)
    return typeof value !== 'undefined' ? value : defaultValue
  }

  renderField(option, idx) {
    const { field, label, hint } = option
    const common = {
      id: field,
      label,
      title: hint,
      key: idx,
      tabIndex: idx,
      name: `options.${field}`,
      onChange: this.handleChange,
      value: this.getValue(option)
    }
    switch (option.type) {
      case 'number':
        return (
          <FormField {...common}
            value={this.getValue(option).toString()}/>)
      case 'bool':
      case 'boolean':
        return <FormToggle {...common}/>
      default: // 'string' implied
        return <FormField {...common}/>
    }
  }

  get idx() {
    return this.props.index * 100
  }

  render() {
    return (
      <fieldset>
        <FormField
          id="plugin.name"
          name="name"
          value={this.props.name}
          tabIndex={this.idx}
          onChange={this.handleChange}/>
        {this.props.guiOptions.map((option, idx) =>
          this.renderField(option, this.idx + idx + 1))}
      </fieldset>)
  }

  static propTypes = {
    plugin: string,
    name: string,
    index: number,
    options: object,
    guiOptions: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      default: oneOfType([string, bool, number]),
      hint: string,
      type: oneOf(['string', 'bool', 'boolean', 'number']),
      label: string.isRequired
    })),
  }

  static defaultProps = {
    name: '',
    guiOptions: [],
    options: {}
  }
}

module.exports = {
  PluginInstance
}
