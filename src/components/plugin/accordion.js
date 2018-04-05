'use strict'

const React = require('react')
const {
  arrayOf, bool, func, number, object, oneOf, oneOfType, shape, string
} = require('prop-types')
const { shell } = require('electron')
const { Accordion } = require('../accordion')
const { Button, ButtonGroup } = require('../button')
const { PluginInstance } = require('./instance')
const { injectIntl } = require('react-intl')

class PluginAccordion extends Accordion {
  handleUninstall = (event) =>  {
    this.props.onUninstall(this.props.plugin)
    event.stopPropagation()
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

  get repoLink() {
    let repo = this.props.repository
    if (typeof repo === 'object' && repo.url) return repo.url
    if (typeof repo !== 'string') return
    if (repo.startsWith('http')) return repo
    return repo
      .replace(/^github:/, 'https://github.com/')
      .replace(/^gitlab:/, 'https://gitlab.com/')
      .replace(/^bitbucket:/, 'https://bitbucket.org/')
  }

  renderLink(id, url, ...options) {
    const { intl } = this.props
    const title = intl.formatMessage(
      { id: `prefs.plugins.${id}` }, ...options)
    return (
      // eslint-disable-next-line react/jsx-no-bind
      <a onClick={() => shell.openExternal(url)}>{title}</a>
    )
  }

  renderHeader() {
    const { isDisabled } = this
    return super.renderHeader(
      <div className="panel-header-container">
        <h1 className="panel-heading">
          {this.props.label || this.props.name}
          <span className="version">{this.props.version}</span>
        </h1>
        <div className="description">{this.props.description}</div>
        {this.repoLink && this.renderLink('repository', this.repoLink)}
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
                 config={config}
                 name={config.name}
                 options={config.options}
                 onChange={this.props.onChange}
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
    repository: oneOfType([string, object]),
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
  PluginAccordion: injectIntl(PluginAccordion)
}
