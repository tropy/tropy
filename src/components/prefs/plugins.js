'use strict'

const React = require('react')
const { Component } = React
const { PrefPane } = require('../prefs/pane')
const { Button } = require('../button')
const { IconPlus } = require('../icons')
const { bool, object, string } = require('prop-types')
const { AccordionGroup } = require('../accordion')
const { PluginAccordion } = require('./plugin-accordion')
const { values } = Object
const { uniq } = require('../../common/util')

class PluginsPane extends Component {
  constructor(props) {
    super(props)
    this.state = {
      config: props.plugins.config
    }
  }

  componentWillReceiveProps(props) {
    this.setState({
      config: props.plugins.config
    })
    this.pluginOptions = ['']
      .concat(
        uniq(
          values(this.props.plugins.spec)
          .map(s => s.name)))
  }

  onChange = (index, data) => {
    let { config } = this.state
    config[index] = data
    this.setState({ config })
  }

  addPlugin = () => {
    this.setState({
      config: this.state.config.concat({})
    })
    this.accordion.setState({ open: this.state.config.length })
  }

  setAccordion = (accordion) => {
    this.accordion = accordion
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
            {this.state.config.map(
              (config, idx) => {
                let spec = this.props.plugins.spec[idx] || {}
                let { version, options } = spec
                return (
                  <PluginAccordion
                    config={config}
                    version={version}
                    options={options}
                    onChange={this.onChange}
                    pluginOptions={this.pluginOptions}
                    index={idx}
                    key={idx}/>)
              })
            }
          </AccordionGroup>
        </div>
        <footer className="plugins-footer">
          <Button
            icon={<IconPlus/>}
            onClick={this.addPlugin}/>
        </footer>
      </PrefPane>
    )
  }

  static propTypes = {
    isActive: bool,
    name: string.isRequired,
    plugins: object.isRequired,
  }
}

module.exports = {
  PluginsPane
}
