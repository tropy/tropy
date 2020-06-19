'use strict'

const React = require('react')
const { bool, func, shape, string, object } = require('prop-types')
const { FormElement, FormField, FormToggle } = require('../form')
const { TemplateSelect } = require('../template/select')
const { ResourceSelect } = require('../resource/select')
const { get } = require('../../common/util')


class PluginOption extends React.PureComponent {
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
        return get(value, ['id'], '')
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
      case 'template':
        return (
          <FormElement id={this.props.spec.label} isCompact>
            <TemplateSelect {...this.attrs}
              minFilterOptions={4}
              options={[
                ...this.props.templates.item,
                ...this.props.templates.photo,
                ...this.props.templates.selection]}/>
          </FormElement>
        )
      case 'property':
        return (
          <FormElement id={this.props.spec.label} isCompact>
            <ResourceSelect {...this.attrs}
              options={this.props.properties}/>
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

module.exports = {
  PluginOption
}
