'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { PluginOption } = require('./option')
const { FormField } = require('../form')
const { get, set } = require('../../common/util')
const { IconPlusCircle, IconMinusCircle } = require('../icons')
const { Button, ButtonGroup } = require('../button')
const {
  arrayOf, bool, func, number, object, oneOfType, shape, string
} = require('prop-types')


class PluginInstance extends PureComponent {
  handleInsert = () => {
    this.props.onInsert(this.props.config.plugin, this.props.config)
  }

  handleNameChange = (data) => {
    this.props.onChange(this.props.config, data)
  }

  handleOptionsChange = (field, value) => {
    this.props.onChange(this.props.config, {
      options: set(this.props.config.options, field, value)
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
          {this.props.specs.map((spec) =>
            <PluginOption
              key={spec.field}
              spec={spec}
              value={get(this.props.config.options, spec.field, spec.default)}
              onChange={this.handleOptionsChange}/>)}
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
    config: shape({
      plugin: string.isRequired,
      name: string,
      options: object
    }).isRequired,
    onRemove: func.isRequired,
    onInsert: func.isRequired,
    onChange: func.isRequired,
    specs: arrayOf(shape({
      field: string.isRequired,
      default: oneOfType([string, bool, number])
    })).isRequired,
  }

  static defaultProps = {
    specs: []
  }
}

module.exports = {
  PluginInstance
}
