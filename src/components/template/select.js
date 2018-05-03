'use strict'

const React = require('react')
const { PureComponent } = React
const { Select } = require('../select')
const { injectIntl, intlShape } = require('react-intl')
const { startsWith } = require('../../collate')
const { bool, array, func, number, string } = require('prop-types')

class TemplateSelect extends PureComponent {
  get placeholder() {
    return this.props.placeholder != null &&
      this.props.intl.formatMessage({ id: this.props.placeholder })
  }

  focus = () => {
    if (this.select != null) this.select.focus()
  }

  setSelect = (select) => {
    this.select = select
  }

  render() {
    return (
      <Select
        className="template-select form-control"
        isDisabled={this.props.isDisabled}
        isRequired={this.props.isRequired}
        match={this.props.match}
        onBlur={this.props.onBlur}
        onChange={this.props.onChange}
        onFocus={this.props.onFocus}
        options={this.props.options}
        placeholder={this.placeholder}
        ref={this.setContainer}
        tabIndex={this.props.tabIndex}
        value={this.props.value}/>
    )
  }

  static propTypes = {
    intl: intlShape,
    isDisabled: bool,
    isRequired: bool,
    match: func.isRequired,
    options: array.isRequired,
    onBlur: func,
    onChange: func.isRequired,
    onFocus: func,
    placeholder: string,
    tabIndex: number.isRequired,
    value: string,
  }

  static defaultProps = {
    match: (template, query) => (
      startsWith(template.name, query) || template.id.includes(query)
    ),
    tabIndex: -1
  }
}

module.exports = {
  TemplateSelect: injectIntl(TemplateSelect)
}
