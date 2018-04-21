'use strict'

const React = require('react')
const { Component } = React
const { ipcRenderer: ipc } = require('electron')
const { PrefPane } = require('../prefs/pane')
const { Button } = require('../button')
const { array, bool, func, object, shape, string } = require('prop-types')
const { AccordionGroup } = require('../accordion')
const { PluginAccordion } = require('./accordion')
const { values } = Object
const debounce = require('lodash.debounce')
const { omit } = require('../../common/util')


class PluginsPane extends Component {
  constructor(props) {
    super(props)
    this.state = this.getPluginConfigFromProps(props)
  }

  componentDidMount() {
    // Subtle: we assume `plugins` is a Singleton, therefore
    // it's safe to manage the listeneres in mount/unmount!
    this.props.plugins.on('change', this.refresh)
  }

  componentWillUnmount() {
    this.persist.flush()
    this.props.plugins.removeListener('change', this.refresh)
  }

  getPluginConfigFromProps(props = this.props) {
    return {
      config: props.plugins.config.map(config => ({ ...config }))
    }
  }

  refresh = () => {
    this.setState(this.getPluginConfigFromProps())
  }

  persist = debounce(() => {
    this.props.plugins.store(this.state.config)
  }, 500)

  handleUninstall = (name) => {
    this.props.onUninstall({ name, plugins: this.props.plugins })
  }

  handleChange = (plugin, index, newConfig) => {
    let { config } = this.state
    config[this.idx(plugin, index)] = newConfig
    this.setState({ config }, this.persist)
  }

  handleInsert = (plugin, index) => {
    let { config } = this.state
    config.splice(this.idx(plugin, index) + 1, 0, {
      plugin,
      options: {}
    })
    this.setState({ config }, this.persist)
  }

  idx = (plugin, index) => {
    let cfg = this.state.config
      .filter(c => c.plugin === plugin)[index]
    return this.state.config.findIndex(c => c === cfg)
  }

  handleRemove = (instance) => {
    this.setState({
      config: this.state.config.filter(c => c !== instance)
    }, this.persist)
  }

  handleDisable = (name) => {
    this.setState({
      config: this.state.config.map(cfg =>
        (cfg.plugin !== name) ? cfg : { ...cfg, disabled: true })
    }, this.persist)
  }

  handleEnable = (name) => {
    let k = 0
    let config = this.state.config.map(cfg =>
        (cfg.plugin !== name) ? cfg : (++k, omit(cfg, ['disabled'])))

    if (k === 0) return this.handleInsert(name, -1)
    this.setState({ config }, this.persist)
  }

  handleInstall() {
    ipc.send('cmd', 'app:install-plugin')
  }

  getPluginInstances(name) {
    return this.state.config.filter(c => c.plugin === name && !c.disabled)
  }

  render() {
    return (
      <PrefPane
        name={this.props.name}
        isActive={this.props.isActive}>
        <div className="scroll-container">
          <AccordionGroup
            className="form-horizontal">
            {values(this.props.plugins.spec).map(
               (spec, idx) => {
                 return (
                   <PluginAccordion
                     instances={this.getPluginInstances(spec.name)}
                     spec={spec}
                     onChange={this.handleChange}
                     onDisable={this.handleDisable}
                     onEnable={this.handleEnable}
                     onInsert={this.handleInsert}
                     onRemove={this.handleRemove}
                     onUninstall={this.handleUninstall}
                     onOpenLink={this.props.onOpenLink}
                     key={idx}/>)
               })
            }
          </AccordionGroup>
        </div>
        <footer className="plugins-footer">
          <Button
            isDefault
            text="prefs.plugins.install"
            onClick={this.handleInstall}/>
        </footer>
      </PrefPane>
    )
  }

  static propTypes = {
    isActive: bool,
    name: string.isRequired,
    plugins: shape({
      config: array.isReqired,
      spec: object.isRequired
    }).isRequired,
    onUninstall: func.isRequired,
    onOpenLink: func.isRequired
  }
}

module.exports = {
  PluginsPane
}
