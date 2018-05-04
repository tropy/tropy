'use strict'

const React = require('react')
const { PureComponent } = React
const { Select } = require('../select')
const { FormattedMessage } = require('react-intl')
const { startsWith } = require('../../collate')
const { getLabel } = require('../../common/ontology')
const { bool, array, func, number, string } = require('prop-types')

class ResourceSelect extends PureComponent {
  get placeholder() {
    return this.props.placeholder != null &&
      <FormattedMessage id={this.props.placeholder}/>
  }

  render() {
    return (
      <Select
        className="resource-select"
        isDisabled={this.props.isDisabled}
        isRequired={this.props.isRequired}
        match={this.props.match}
        onBlur={this.props.onBlur}
        onChange={this.props.onChange}
        onFocus={this.props.onFocus}
        options={this.props.options}
        placeholder={this.placeholder}
        tabIndex={this.props.tabIndex}
        toText={this.props.toText}
        toValue={this.props.toValue}
        value={this.props.value}/>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isRequired: bool,
    match: func.isRequired,
    onBlur: func,
    onChange: func.isRequired,
    onFocus: func,
    options: array.isRequired,
    placeholder: string,
    tabIndex: number.isRequired,
    toText: func.isRequired,
    toValue: func.isRequired,
    value: string
  }

  static defaultProps = {
    match: (res, query) => (
      // TODO prefix search!
      startsWith(res.label, query) || res.id.includes(query)
    ),
    tabIndex: -1,
    toText: (res) => (
      <span>
        {res.label || getLabel(res.id)}
        <small>{res.id}</small>
      </span>
    ),
    toValue: (res) => res.label || getLabel(res.id)
  }
}

module.exports = {
  ResourceSelect
}

