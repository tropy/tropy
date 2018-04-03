'use strict'

const React = require('react')
const { PureComponent } = require('react')
const {
  arrayOf, bool, number, oneOf, oneOfType, shape, string
} = require('prop-types')

class PluginInstance extends PureComponent {
  render() {
    return <div>Hello, {this.props.plugin}</div>
  }

  static propTypes = {
    plugin: string,
    options: arrayOf(shape({
      field: string.isRequired,
      required: bool,
      default: oneOfType([string, bool, number]),
      hint: string,
      type: oneOf(['string', 'bool', 'boolean', 'number']),
      label: string.isRequired
    })),
    pluginOptions: arrayOf(string)
  }

  static defaultProps = {
    options: [],
    version: ''
  }
}

module.exports = {
  PluginInstance
}
