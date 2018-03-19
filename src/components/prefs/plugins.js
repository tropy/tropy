'use strict'

const React = require('react')
const { Component } = React
const { object } = require('prop-types')
const { AccordionGroup } = require('../accordion')
const { PluginAccordion } = require('./plugin-accordion')


class Plugins extends Component {
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

  onChange = (index, data) => {
    let { config } = this.state
    config[index] = data
    this.setState({ config })
  }

  render() {
    return (
      <div className="scroll-container">
        <AccordionGroup className="form-horizontal">
          {this.state.config.map(
             (config, idx) =>
               <PluginAccordion
                 config={config}
                 version={this.state.spec[idx].version}
                 options={this.state.spec[idx].options}
                 onChange={this.onChange}
                 index={idx}
                 key={idx}/>)}
        </AccordionGroup>
      </div>
    )
  }

  static propTypes = {
    plugins: object.isRequired
  }
}

module.exports = {
  Plugins
}
