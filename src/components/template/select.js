'use strict'

const React = require('react')
const { PureComponent } = React
const { injectIntl, intlShape } = require('react-intl')
const { bool, array, func, number, string } = require('prop-types')

class TemplateSelect extends PureComponent {
  get hasPlaceholder() {
    return !this.props.isRequired && this.props.placeholder != null
  }

  get placeholder() {
    return this.props.intl.formatMessage({ id: this.props.placeholder })
  }

  handleChange = ({ target }) => {
    this.props.onChange(
      this.props.templates.find(t => t.id === target.value)
    )
  }

  renderPlaceholder() {
    return this.hasPlaceholder && <option>{this.placeholder}</option>
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
        {this.renderPlaceholder()}
        {this.props.templates.map(({ id, name }) =>
          <option key={id} value={id}>{name}</option>)}
      </select>
    )
  }

  static propTypes = {
    intl: intlShape,
    isRequired: bool,
    placeholder: string,
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
  TemplateSelect: injectIntl(TemplateSelect)
}
