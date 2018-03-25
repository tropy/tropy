'use strict'

const React = require('react')
const {
  arrayOf, bool, func, number, object, oneOf, oneOfType, shape, string
} = require('prop-types')
const cx = require('classnames')
const { Accordion } = require('../accordion')
const { IconBook16, IconTrash, IconO } = require('../icons')
const { Button, ButtonGroup } = require('../button')
const { FormField, FormToggle, FormSelect } = require('../form')
const { get, set } = require('../../common/util')

class PluginAccordion extends Accordion {
  getValue({ field, default: defaultValue }) {
    const { options } = this.props.config
    const value = get(options, field)
    return typeof value !== 'undefined' ? value : defaultValue
  }

  handleChange = (data) => {
    let config = this.props.config
    for (const field in data) {
      set(config, field, data[field])
    }
    this.props.onChange(this.props.index, config)
    this.forceUpdate()
  }

  handleDelete = () => this.props.onDelete(this.props.index)

  toggleEnabled = () => {
    this.handleChange({ enabled: !this.props.config.enabled })
  }

  renderField(config, option, idx) {
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
        return <FormToggle {...common}/>
      default: // 'string' implied
        return <FormField {...common}/>
    }
  }

  get headerClasses() {
    return {
      'flex-row': true,
      'center': true,
      'panel-header-container': true,
      'disabled': !this.props.config.enabled
    }
  }

  renderHeader() {
    const { enabled } = this.props.config
    return super.renderHeader(
      <div className={cx(this.headerClasses)}>
        <IconBook16/>
        <h1 className="panel-heading">
          {this.props.config.name}
        </h1>
        {this.props.isOpen &&
          <ButtonGroup>
            <Button
              icon={<IconTrash/>}
              onClick={this.handleDelete}/>
            <Button
              icon={<IconO/>}
              title={'prefs.plugins.' + (enabled ? 'disable' : 'enable')}
              isActive={!enabled}
              onClick={this.toggleEnabled}/>
          </ButtonGroup>}
      </div>
    )
  }

  value = () => {
    return this.props.config.plugin || ''
  }

  optLabel(option) {
    return option
  }

  renderBody() {
    const { config, options } = this.props

    return super.renderBody(
      <div className={cx({ disabled: !config.enabled })}>
        <header className="plugins-header">
          <FormField
            id="plugin.name"
            name="name"
            value={config.name}
            tabIndex={null}
            onChange={this.handleChange}/>
          <FormSelect
            id="plugin.plugin"
            name="plugin"
            optLabel={this.optLabel}
            options={this.props.pluginOptions}
            onChange={this.handleChange}
            isDisabled={!!config.plugin}
            value={this.value()}/>
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
    version: string,
    onChange: func.isRequired,
    onDelete: func.isRequired,
    index: number,
    options: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      default: oneOfType([string, bool, number]),
      hint: string,
      type: oneOf(['string', 'bool', 'number']),
      label: string.isRequired
    })),
    pluginOptions: arrayOf(string)
  }

  static defaultProps = {
    ...Accordion.defaultProps,
    options: [],
    version: ''
  }
}

module.exports = {
  PluginAccordion
}
