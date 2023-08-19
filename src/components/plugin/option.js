import React from 'react'
import { bool, func, shape, string, object } from 'prop-types'
import { FormElement, FormField, FormToggle } from '../form.js'
import { TemplateSelect } from '../template'
import { PropertySelect } from '../resource/select.js'
import { get } from '../../common/util.js'


export class PluginOption extends React.PureComponent {
  get attrs() {
    return {
      id: this.props.spec.field,
      label: this.props.spec.label,
      title: this.props.spec.hint,
      placeholder: this.props.spec.placeholder,
      tabIndex: 0,
      name: this.props.spec.field,
      onChange: this.handleChange,
      value: this.value,
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
      case 'template':
        return value?.id || ''
      default:
        return value
    }
  }

  handleChange = (data) => {
    let value = get(data, this.props.spec.field)
    this.props.onChange(this.props.spec.field, this.format(value))
  }

  render() {
    switch (this.props.spec.type) {
      case 'bool':
      case 'boolean':
        return <FormToggle {...this.attrs} isCompact/>
      case 'template':
        return (
          <FormElement id={this.props.spec.label} title={this.attrs.title}>
            <TemplateSelect {...this.attrs} minFilterOptions={4}/>
          </FormElement>
        )
      case 'property':
        return (
          <FormElement id={this.props.spec.label} title={this.attrs.title}>
            <PropertySelect {...this.attrs}/>
          </FormElement>
        )
      case 'save-file':
        return (
          <FormField
            {...this.attrs}
            createFile
            type="file"/>
        )
      default:
        return (
          <FormField
            {...this.attrs}
            type={this.props.spec.type}/>
        )
    }
  }

  static propTypes = {
    onChange: func.isRequired,
    templates: object.isRequired,
    properties: object.isRequired,
    spec: shape({
      field: string.isRequired,
      hint: string,
      label: string.isRequired,
      required: bool
    }).isRequired,
    value: string
  }
}
