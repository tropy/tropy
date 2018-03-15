'use strict'

const React = require('react')
const { object, arrayOf, shape, string, bool, oneOf } = require('prop-types')
const { Accordion } = require('../accordion')
const { IconBook16 } = require('../icons')
const { FormField, FormText, FormToggle } = require('../form')
const { get } = require('../../common/util')

class PluginAccordion extends Accordion {
  handleChange = (data) => {
    console.log(data)
    /* this.props.onSave({ id: this.props.vocab.id, ...data })*/
  }

  renderField(config, option, idx) {
    switch (option.type) {
      case 'string':
        return (
          <FormField
            key={idx}
            id={option.field}
            isCompact
            size={8}
            name={option.field}
            label={option.label}
            value={get(config, option.field)}/>)
      case 'number':
        return (
          <FormField
            key={idx}
            id={option.field}
            isCompact
            name={option.field}
            label={option.label}
            value={get(config, option.field)}/>)
      case 'bool':
        return (
          <FormToggle
            key={idx}
            id={option.field}
            isCompact
            size={8}
            name={option.field}
            label={option.label}
            value={get(config, option.field)}
            onChange={this.handleChange}/>)
      default:
        return
    }
  }

  renderHeader() {
    return super.renderHeader(
      <div className="flex-row center panel-header-container">
        <IconBook16/>
        <h1 className="panel-heading">
          {this.props.config.name}
        </h1>
      </div>
    )
  }

  renderBody() {
    const { config, options } = this.props

    return super.renderBody(
      <div>
        <header className="plugins-header">
          <FormField
            id="plugin.name"
            isCompact
            name="name"
            value={config.name}
            tabIndex={null}
            onChange={this.handleChange}/>
          <FormText
            id="plugin.plugin"
            isCompact
            value={config.plugin}/>
        </header>
        {options.length > 0 &&
        <fieldset>
          {options.map((option, idx) =>
            this.renderField(config, option, idx))}
        </fieldset>}
      </div>
    )
  }

  static propTypes = {
    config: object.isRequired,
    options: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      hint: string,
      type: oneOf(['string', 'bool', 'number']).isRequired,
      label: string.isRequired
    }))
  }

  static defaultProps = {
    ...Accordion.defaultProps,
    options: []
  }
}

module.exports = {
  PluginAccordion
}
