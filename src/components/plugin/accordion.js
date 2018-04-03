'use strict'

const React = require('react')
const {
  arrayOf, bool, number, object, oneOf, oneOfType, shape, string
} = require('prop-types')
const cx = require('classnames')
const { Accordion } = require('../accordion')

class PluginAccordion extends Accordion {
  /* getValue({ field, default: defaultValue }) {
   *   const { options } = this.props.config
   *   const value = get(options, field)
   *   return typeof value !== 'undefined' ? value : defaultValue
   * }

   * handleChange = (data) => {
   *   let config = this.props.config
   *   for (const field in data) {
   *     set(config, field, data[field])
   *   }
   *   if (config.disabled === false) delete config.disabled
   *   this.props.onChange(this.props.index, config)
   *   this.forceUpdate()
   * }

   * handleDelete = () => this.props.onDelete(this.props.index)

   * toggleEnabled = () => {
   *   this.handleChange({ disabled: !this.props.config.disabled })
   * }
  */

  get headerClasses() {
    return {
      'panel-header-container': true,
    }
  }

  renderHeader() {
    return super.renderHeader(
      <div className={cx(this.headerClasses)}>
        <h1 className="panel-heading">
          {this.props.label || this.props.name}
          <span className="version">{this.props.version}</span>
        </h1>
        <div className="description">{this.props.description}</div>
      </div>
    )
  }

  renderBody() {
    return super.renderBody(<div>Hello</div>)
  }

  static propTypes = {
    name: string.isRequired,
    label: string,
    version: string,
    description: string,
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
