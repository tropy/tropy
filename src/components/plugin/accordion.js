'use strict'

const React = require('react')
const { arrayOf, func, object } = require('prop-types')
const { Accordion } = require('../accordion')
const { Button, ButtonGroup } = require('../button')
const { PluginInstance } = require('./instance')
const { FormattedMessage } = require('react-intl')
const { entries } = Object


const NoInfo = () => (
  <div className="no-info">
    <FormattedMessage id="prefs.plugins.noInfo"/>
  </div>
)

class PluginAccordion extends Accordion {
  handleHomepageClick = (event) => {
    event.stopPropagation()
    this.props.onOpenLink(this.props.spec.homepage)
  }

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


  get classes() {
    return [super.classes, {
      disabled: this.isDisabled
    }]
  }

  get description() {
    <p className="description">
      {this.props.spec.description}
    </p>
  }

  get heading() {
    return (
      <h1 className="panel-heading">
        {`${this.props.spec.label || this.props.spec.name} `}
        <small className="version">{this.props.spec.version}</small>
      </h1>
    )
  }

  get hooks() {
    return (
      <ul className="hooks">
        {entries(this.props.spec.hooks).map(hk => (
          <li key={hk[0]} className={!hk[1] ? 'disabled' : null}>
            <FormattedMessage id={`plugin.hooks.${hk[0]}`}/>
          </li>
        ))}
      </ul>
    )
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

  get isDisabled() {
    return !this.configs.length
  }

  get isLocalPlugin() {
    return this.props.spec.source === 'local'
  }

  renderHeader() {
    return super.renderHeader(
      <div className="panel-header-container">
        {this.hooks}
        {this.heading}
        {this.description}
        <div className="flex-row center">
          {this.info}
          <ButtonGroup>
            <Button
              isDefault
              text={`prefs.plugins.${this.isDisabled ? 'enable' : 'disable'}`}
              onClick={this.toggleEnabled}/>
            {this.isLocalPlugin &&
              <Button
                isDefault
                text="prefs.plugins.uninstall"
                onClick={this.handleUninstall}/>}
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
    onUninstall: func.isRequired
  }
}

module.exports = {
  PluginAccordion
}
