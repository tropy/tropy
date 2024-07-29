import React from 'react'
import { PluginOption } from './option.js'
import { FormField } from '../form.js'
import { get, set } from '../../common/util.js'
import { IconPlusCircle, IconMinusCircle } from '../icons.js'
import { Button, ButtonGroup } from '../button.js'

export class PluginInstance extends React.PureComponent {
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
            onChange={this.handleNameChange}/>
          {this.props.specs.map((spec) => (
            <PluginOption
              key={spec.field}
              spec={spec}
              value={get(this.props.config.options, spec.field, spec.default)}
              onChange={this.handleOptionsChange}/>
          ))}
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

  static defaultProps = {
    specs: []
  }
}
