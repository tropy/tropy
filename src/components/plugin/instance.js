import React from 'react'
import { PluginOption } from './option'
import { FormField } from '../form'
import { get, set } from '../../common/util'
import { IconPlusCircle, IconMinusCircle } from '../icons'
import { Button, ButtonGroup } from '../button'

import {
  arrayOf, bool, func, number, object, oneOfType, shape, string
} from 'prop-types'


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
          {this.props.specs.map((spec) =>
            <PluginOption
              key={spec.field}
              spec={spec}
              templates={this.props.templates}
              properties={this.props.properties}
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
    templates: object.isRequired,
    properties: object.isRequired,
    onRemove: func.isRequired,
    onInsert: func.isRequired,
    onChange: func.isRequired,
    specs: arrayOf(shape({
      field: string.isRequired,
      default: oneOfType([string, bool, number])
    })).isRequired
  }

  static defaultProps = {
    specs: []
  }
}
