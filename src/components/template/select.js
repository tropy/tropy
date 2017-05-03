'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, array, func, number, string } = require('prop-types')

class TemplateSelect extends PureComponent {
  get placeholder() {
    return !this.props.isRequired &&
      <option key="placeholder">Select a template</option>
  }

  handleChange = ({ target }) => {
    this.props.onChange(
      this.props.templates.find(t => t.uri === target.value)
    )
  }

  render() {
    return (
      <select
        tabIndex={this.props.tabIndex}
        name="template-select"
        className="template-select form-control"
        required={this.props.isRequired}
        value={this.props.selected}
        onChange={this.handleChange}>
        {this.placeholder}
        {this.props.templates.map(({ uri, name }) =>
          <option key={uri} value={uri}>{name}</option>)
        }
      </select>
    )
  }

  static propTypes = {
    isRequired: bool,
    tabIndex: number.isRequired,
    templates: array.isRequired,
    selected: string,
    onChange: func.isRequired
  }

  static defaultProps = {
    isRequired: true,
    tabIndex: -1
  }
}

module.exports = {
  TemplateSelect
}
