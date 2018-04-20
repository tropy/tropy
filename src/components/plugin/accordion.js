'use strict'

const React = require('react')
const { arrayOf, func, object } = require('prop-types')
const { Accordion } = require('../accordion')
const { Button, ButtonGroup } = require('../button')
const { PluginInstance } = require('./instance')
const { FormattedMessage, injectIntl, intlShape } = require('react-intl')
const { keys } = Object


const NoInfo = () => (
  <div className="no-info">
    <FormattedMessage id="prefs.plugins.noInfo"/>
  </div>
)

class PluginAccordion extends Accordion {
  handleUninstall = (event) =>  {
    event.stopPropagation()
    this.props.onUninstall(this.props.spec.name)
  }

  toggleEnabled = (event) => {
    let disabled = this.isDisabled
    const { name } = this.props.spec
    this.props.configs.map((config, idx) => {
      let newConfig = config
      if (disabled) {
        delete newConfig.disabled
      } else {
        newConfig.disabled = true
      }
      this.props.onChange(name, idx, newConfig)
    })

    if (disabled && !this.configs.length) {
      this.props.onInsert(name, -1)
    }

    event.stopPropagation()
  }

  get configs() {
    return this.props.configs.filter(c => !c.disabled)
  }

  get isDisabled() {
    return !this.configs.length
  }

  get isLocalPlugin() {
    return this.props.spec.source === 'local'
  }

  get classes() {
    return [super.classes, {
      disabled: this.isDisabled
    }]
  }

  get label() {
    return this.props.spec.label || this.props.spec.name
  }

  renderHook(hook) {
    const { formatMessage: t } = this.props.intl
    return <li key={hook}>{t({ id: `prefs.plugins.hooks.${hook}` })}</li>
  }

  handleHomepageClick = (event) => {
    event.stopPropagation()
    this.props.onOpenLink(this.props.spec.homepage)
  }

  get info() {
    return (this.props.spec.homepage == null) ? <NoInfo/> : (
      <div className="info">
        <a onClick={this.handleHomepageClick}>
          <FormattedMessage id="prefs.plugins.homepage"/>
        </a>
      </div>
    )
  }

  renderHeader() {
    const { isDisabled } = this
    return super.renderHeader(
      <div className="panel-header-container">
        <ul className="hooks">
          {keys(this.props.spec.hooks).map(h => this.renderHook(h))}
        </ul>
        <h1 className="panel-heading">
          {this.label}
          {' '}
          <small className="version">{this.props.spec.version}</small>
        </h1>
        <p className="description">
          {this.props.spec.description}
        </p>
        <div className="flex-row center">
          {this.info}
          <ButtonGroup>
            <Button
              isDefault
              text={`prefs.plugins.${isDisabled ? 'enable' : 'disable'}`}
              isActive={isDisabled}
              onClick={this.toggleEnabled}/>
            <Button
              isDefault
              isDisabled={!this.isLocalPlugin}
              text="prefs.plugins.uninstall"
              onClick={this.handleUninstall}/>
          </ButtonGroup>
        </div>
      </div>
    )
  }

  renderBody() {
    return super.renderBody(
      <ul>
        {this.configs.map(
           (config, idx) =>
             <PluginInstance
               key={idx}
               index={idx}
               config={config}
               guiOptions={this.props.spec.options}
               onChange={this.props.onChange}
               onDelete={this.props.onDelete}
               onInsert={this.props.onInsert} />
        )}
      </ul>
    )
  }

  static propTypes = {
    spec: object.isRequired,
    onChange: func.isRequired,
    onDelete: func.isRequired,
    onInsert: func.isRequired,
    configs: arrayOf(object),
    intl: intlShape.isRequired,
    onUninstall: func.isRequired
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
