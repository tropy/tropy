'use strict'

const React = require('react')
const { PureComponent } = require('react')
const { bool, func, shape, string, object } = require('prop-types')
const { FormElement, FormField, FormToggle } = require('../form')
const { TemplateSelect } = require('../template/select')


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
      case 'template':
        if (value && value.id)
          return value.id
        return ''
      default:
        return value
    }
  }

  handleChange = ({ [this.props.spec.field]: value }) => {
    this.props.onChange(this.props.spec.field, this.format(value))
  }

  handleTemplateClear = () => {
    this.props.onChange(this.props.spec.field, '')
  }

  render() {
    switch (this.props.spec.type) {
      case 'bool':
      case 'boolean':
        return <FormToggle {...this.attrs}/>
      case 'template':
        return (
          <FormElement id={this.props.spec.label} isCompact>
            <TemplateSelect {...this.attrs}
              minFilterOptions={4}
              onRemove={this.handleTemplateClear}
              options={[
                ...this.props.templates.item,
                ...this.props.templates.photo,
                ...this.props.templates.selection]}/>
          </FormElement>
        )
      default:
        return <FormField {...this.attrs}/>
    }
  }

  static propTypes = {
    onChange: func.isRequired,
    templates: object.isRequired,
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
