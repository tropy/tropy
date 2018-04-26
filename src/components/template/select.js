'use strict'

const React = require('react')
const { PureComponent } = React
const { Select } = require('../select')
const { injectIntl, intlShape } = require('react-intl')
const { bool, array, func, number, string } = require('prop-types')

class TemplateSelect extends PureComponent {
  get placeholder() {
    return this.props.placeholder != null &&
      this.props.intl.formatMessage({ id: this.props.placeholder })
  }

  render() {
    return (
      <Select
        className="template-select form-control"
        tabIndex={this.props.tabIndex}
        isRequired={this.props.isRequired}
        isDisabled={this.props.isDisabled}
        options={this.props.templates}
        placeholder={this.placeholder}
        value={this.props.selected}
        onChange={this.props.onChange}/>
    )
  }

  static propTypes = {
    intl: intlShape,
    isDisabled: bool,
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
