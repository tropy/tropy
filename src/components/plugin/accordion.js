'use strict'

const React = require('react')
const {
  arrayOf, bool, func, number, object, oneOf, oneOfType, shape, string
} = require('prop-types')
const cx = require('classnames')
const { Accordion } = require('../accordion')
const { Button, ButtonGroup } = require('../button')
const { set } = require('../../common/util')
const { PluginInstance } = require('./instance')


class PluginAccordion extends Accordion {
  handleUninstall = (event) =>  {
    this.props.onUninstall(this.props.plugin)
    event.stopPropagation()
  }

  handleChange = (data) => {
    let config = this.props.config
    for (const field in data) {
      set(config, field, data[field])
    }
    if (config.disabled === false) delete config.disabled
    this.props.onChange(this.props.index, config)
    this.forceUpdate()
  }

  toggleEnabled = (event) => {
    let disabled = this.isDisabled
    this.props.configs.map((config, idx) => {
      let newConfig = config
      if (disabled) {
        delete newConfig.disabled
      } else {
        newConfig.disabled = true
      }
      this.props.onChange(this.props.name, idx, newConfig)
    })

    if (disabled && !this.configs.length) {
      this.props.onInsert(this.props.name, -1)
    }

    event.stopPropagation()
  }

  get headerClasses() {
    return {
      'panel-header-container': true,
    }
  }

  get configs() {
    return this.props.configs.filter(c => !c.disabled)
  }

  get isDisabled() {
    return !this.configs.length
  }

  get classes() {
    return {
      ...super.classes,
      enabled: !this.isDisabled
    }
  }

  renderHeader() {
    const { isDisabled } = this
    return super.renderHeader(
      <div className={cx(this.headerClasses)}>
        <h1 className="panel-heading">
          {this.props.label || this.props.name}
          <span className="version">{this.props.version}</span>
        </h1>
        <div className="description">{this.props.description}</div>
        <ButtonGroup>
          <Button
            isDefault
            text={'prefs.plugins.' + (isDisabled ? 'enable' : 'disable')}
            isActive={isDisabled}
            onClick={this.toggleEnabled}/>
          <Button
            isDefault
            text="prefs.plugins.uninstall"
            onClick={this.handleUninstall}/>
        </ButtonGroup>
      </div>
    )
  }

  renderBody() {
    return super.renderBody(
      <div>
        <hr/>
        <ul>
          {this.configs.map(
             (config, idx) =>
               <PluginInstance
                 key={idx}
                 index={idx}
                 guiOptions={this.props.options}
                 name={config.name}
                 options={config.options}
                 onDelete={this.props.onDelete}
                 onInsert={this.props.onInsert}
                 plugin={config.plugin} />
          )}
        </ul>
      </div>
    )
  }

  static propTypes = {
    name: string.isRequired,
    label: string,
    version: string,
    description: string,
    onChange: func.isRequired,
    onDelete: func.isRequired,
    onInsert: func.isRequired,
    onUninstall: func.isRequired,
    configs: arrayOf(object),
    options: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      default: oneOfType([string, bool, number]),
      hint: string,
      type: oneOf(['string', 'bool', 'boolean', 'number']),
      label: string.isRequired
    })),
    hooks: object
  }
  static defaultProps = {
    ...Accordion.defaultProps,
    version: '',
    options: [],
    hooks: {}
  }
}

module.exports = {
  PluginAccordion
}
