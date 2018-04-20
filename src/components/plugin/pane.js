'use strict'

const React = require('react')
const { Component } = React
const { ipcRenderer: ipc } = require('electron')
const { PrefPane } = require('../prefs/pane')
const { Button } = require('../button')
const { array, bool, func, object, shape, string } = require('prop-types')
const { AccordionGroup } = require('../accordion')
const { PluginAccordion } = require('./accordion')
const { keys, values } = Object
const debounce = require('lodash.debounce')


class PluginsPane extends Component {
  constructor(props) {
    super(props)
    this.state = this.getPluginConfigFromProps(props)
  }

  componentDidMount() {
    this.props.plugins.on('change', this.refresh)
  }

  componentWillUnmount() {
    this.persist.flush()
    this.props.plugins.removeListener('change', this.refresh)
  }

  componentWillReceiveProps(props) {
    if (props.plugins !== this.props.plugins) {
      throw Error('plugins changed!') // TODO
    }
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
    this.setState({ config })
    this.persist()
    this.ensureOpen(plugin)
  }

  ensureOpen = (plugin) => {
    this.accordionGroup.setState({
      open: keys(this.props.plugins.spec).indexOf(plugin)
    })
  }

  handleInsert = (plugin, index) => {
    let { config } = this.state
    config.splice(this.idx(plugin, index) + 1, 0, {
      plugin,
      options: {}
    })
    this.setState({ config })
    this.persist()
    this.ensureOpen(plugin)
  }

  idx = (plugin, index) => {
    let cfg = this.state.config
      .filter(c => c.plugin === plugin)[index]
    return this.state.config.findIndex(c => c === cfg)
  }

  handleDelete = (plugin, index) => {
    let { config } = this.state
    config.splice(this.idx(plugin, index), 1)
    this.setState({ config })
    this.persist()
  }

  handleInstall() {
    ipc.send('cmd', 'app:install-plugin')
  }

  setAccordionGroup = (accordionGroup) => {
    this.accordionGroup = accordionGroup
  }

  configs = (name) => {
    return this.state.config
      .filter(c => c.plugin === name)
  }

  render() {
    return (
      <PrefPane
        name={this.props.name}
        isActive={this.props.isActive}>
        <div className="scroll-container">
          <AccordionGroup
            ref={this.setAccordionGroup}
            className="form-horizontal">
            {values(this.props.plugins.spec).map(
               (spec, idx) => {
                 return (
                   <PluginAccordion
                     spec={spec}
                     configs={this.configs(spec.name)}
                     onChange={this.handleChange}
                     onDelete={this.handleDelete}
                     onInsert={this.handleInsert}
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
