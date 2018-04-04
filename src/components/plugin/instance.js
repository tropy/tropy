'use strict'

const React = require('react')
const { PureComponent } = require('react')
const {
  arrayOf, bool, func, number, oneOf, object, oneOfType, shape, string
} = require('prop-types')
const { FormField, FormToggle } = require('../form')
const { get } = require('../../common/util')
const { IconPlusCircle, IconMinusCircle } = require('../icons')
const { Button } = require('../button')


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
    return (this.props.index + 1) * 100
  }

  handleInsert = () => {
    this.props.onInsert(this.props.plugin, this.props.index)
  }

  handleRemove = () => {
    this.props.onDelete(this.props.plugin, this.props.index)
  }

  render() {
    return (
      <li className="plugin-instance">
        <fieldset>
          <FormField
            id="plugin.name"
            name="name"
            value={this.props.name}
            tabIndex={this.idx}
            onChange={this.handleChange}/>
          {this.props.guiOptions.map((option, idx) =>
            this.renderField(option, this.idx + idx + 1))}
        </fieldset>
        <div className="btn-group">
          <Button
            icon={<IconMinusCircle/>}
            onClick={this.handleRemove}/>
          <Button
            icon={<IconPlusCircle/>}
            onClick={this.handleInsert}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    plugin: string,
    name: string,
    index: number,
    options: object,
    onDelete: func.isRequired,
    onInsert: func.isRequired,
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
