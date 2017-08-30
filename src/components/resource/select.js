'use strict'

const React = require('react')
const { PureComponent } = React
const { injectIntl, intlShape } = require('react-intl')
const { bool, array, func, number, string } = require('prop-types')

class ResourceSelect extends PureComponent {
  get hasPlaceholder() {
    return !this.props.isRequired && this.props.placeholder != null
  }

  get placeholder() {
    return this.props.intl.formatMessage({ id: this.props.placeholder })
  }

  handleChange = ({ target }) => {
    this.props.onChange(
      this.props.resources.find(p => p.id === target.value)
    )
  }

  renderPlaceholder() {
    return this.hasPlaceholder && <option>{this.placeholder}</option>
  }

  render() {
    return (
      <select
        tabIndex={this.props.tabIndex}
        name="resource-select"
        className="resource-select form-control"
        disabled={this.props.isDisabled}
        required={this.props.isRequired}
        value={this.props.selected}
        onChange={this.handleChange}>
        {this.renderPlaceholder()}
        {this.props.resources.map(({ id }) =>
          <option key={id} value={id}>{id}</option>)}
      </select>
    )
  }

  static propTypes = {
    intl: intlShape,
    isDisabled: bool,
    isRequired: bool,
    placeholder: string,
    tabIndex: number.isRequired,
    resources: array.isRequired,
    selected: string,
    onChange: func.isRequired
  }

  static defaultProps = {
    isRequired: true,
    tabIndex: -1
  }
}

module.exports = {
  ResourceSelect: injectIntl(ResourceSelect)
}

