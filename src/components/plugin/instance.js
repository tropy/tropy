'use strict'

const React = require('react')
const { PureComponent } = require('react')
const {
  arrayOf, bool, func, number, oneOf, object, oneOfType, shape, string
} = require('prop-types')
const { FormField, FormToggle } = require('../form')
const { get, set } = require('../../common/util')
const { IconPlusCircle, IconMinusCircle } = require('../icons')
const { Button, ButtonGroup } = require('../button')

class PluginInstance extends PureComponent {
  getValue({ field, default: defaultValue }) {
    return get(this.props.config.options, field, defaultValue)
  }

  renderField(option, idx) {
    const { field, label, hint } = option
    const common = {
      id: field,
      label,
      title: hint,
      key: idx,
      tabIndex: idx,
      name: field,
      onChange: this.handleOptionsChange,
      value: this.getValue(option),
      isCompact: true
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
    this.props.onInsert(this.props.config.plugin, this.props.config)
  }

  handleNameChange = (data) => {
    this.props.onChange(this.props.config, data)
  }

  handleOptionsChange = (data) => {
    this.props.onChange(this.props.config, {
      options: set(this.props.config.options, data)
    })
  }

  handleRemove = () => {
    this.props.onRemove(this.props.config)
  }


  render() {
    return (
      <li className="plugin-instance">
        <fieldset>
          <FormField
            id="plugin.name"
            name="name"
            value={this.props.config.name}
            tabIndex={0}
            onChange={this.handleNameChange}
            isCompact/>
          {this.props.guiOptions.map((option, idx) =>
            this.renderField(option, this.idx + idx + 1))}
        </fieldset>
        <ButtonGroup>
          <Button
            icon={<IconMinusCircle/>}
            onClick={this.handleRemove}/>
          <Button
            icon={<IconPlusCircle/>}
            onClick={this.handleInsert}/>
        </ButtonGroup>
      </li>
    )
  }

  static propTypes = {
    index: number,
    config: shape({
      plugin: string.isRequired,
      name: string,
      options: object
    }).isRequired,
    onRemove: func.isRequired,
    onInsert: func.isRequired,
    onChange: func.isRequired,
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
    guiOptions: []
  }
}

module.exports = {
  PluginInstance
}
