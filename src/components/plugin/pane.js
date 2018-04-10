'use strict'

const React = require('react')
const { Component } = React
const { ipcRenderer: ipc } = require('electron')
const { PrefPane } = require('../prefs/pane')
const { Button } = require('../button')
const { bool, func, object, string } = require('prop-types')
const { AccordionGroup } = require('../accordion')
const { PluginAccordion } = require('./accordion')
const { keys, values } = Object

class PluginsPane extends Component {
  constructor(props) {
    super(props)
    this.state = {
      config: props.plugins.config,
      spec: props.plugins.spec
    }
  }

  componentWillReceiveProps(props) {
    this.setState({
      config: props.plugins.config,
      spec: props.plugins.spec
    })
  }

  onChange = (plugin, index, newConfig) => {
    let { config } = this.state
    config[this.idx(plugin, index)] = newConfig
    this.setState({ config })
    this.props.onChange(config)
    this.ensureOpen(plugin)
  }

  ensureOpen = (plugin) => {
    this.accordion.setState({
      open: keys(this.state.spec).indexOf(plugin)
    })
  }

  onInsert = (plugin, index) => {
    let { config } = this.state
    config.splice(this.idx(plugin, index) + 1, 0, {
      plugin,
      options: {}
    })
    this.setState({ config })
    this.props.onChange(config)
    this.ensureOpen(plugin)
  }

  idx = (plugin, index) => {
    let cfg = this.state.config
      .filter(c => c.plugin === plugin)[index]
    return this.state.config.findIndex(c => c === cfg)
  }

  onDelete = (plugin, index) => {
    let { config } = this.state
    config.splice(this.idx(plugin, index), 1)
    this.setState({ config })
    this.props.onChange(config)
  }

  installPlugin = () => ipc.send('cmd', 'app:install-plugin')

  setAccordion = (accordion) => {
    this.accordion = accordion
  }

  configs = (name) => {
    return this.props.plugins.config
      .filter(c => c.plugin === name)
  }

  render() {
    return (
      <PrefPane
        name={this.props.name}
        isActive={this.props.isActive}>
        <div className="scroll-container">
          <AccordionGroup
            ref={this.setAccordion}
            className="form-horizontal">
            {values(this.props.plugins.spec).map(
               (spec, idx) => {
                 return (
                   <PluginAccordion
                     name={spec.name}
                     label={spec.label}
                     description={spec.description}
                     homepage={spec.homepage}
                     version={spec.version}
                     hooks={spec.hooks}
                     options={spec.options}
                     repository={spec.repository}
                     source={spec.source}
                     configs={this.configs(spec.name)}
                     onChange={this.onChange}
                     onDelete={this.onDelete}
                     onInsert={this.onInsert}
                     onUninstall={this.props.onPluginUninstall}
                     key={idx}/>)
               })
            }
          </AccordionGroup>
        </div>
        <footer className="plugins-footer">
          <Button
            isDefault
            text="prefs.plugins.install"
            onClick={this.installPlugin}/>
        </footer>
      </PrefPane>
    )
  }

  static propTypes = {
    isActive: bool,
    name: string.isRequired,
    plugins: object.isRequired,
    onChange: func.isRequired,
    onPluginUninstall: func.isRequired
  }
}

module.exports = {
  PluginsPane
}
