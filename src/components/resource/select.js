'use strict'

const React = require('react')
const { PureComponent } = React
const { Select } = require('../select')
const { FormattedMessage } = require('react-intl')
const { startsWith } = require('../../collate')
const { titlecase } = require('../../common/util')
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
        maxRows={this.props.maxRows}
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
    maxRows: number,
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
    match: (res, query) => {
      let q = query.split(':', 2)
      if (q.length > 1) {
        return (q[0] === res.prefix) && (
          (res.name && res.name.startsWith(q[1])) ||
          (res.label && startsWith(res.label, q[1])))
      }
      return (res.prefix && res.prefix.startsWith(query)) ||
        (res.name && res.name.startsWith(query)) ||
        (res.label && startsWith(res.label, query))
    },
    tabIndex: -1,
    toText: (res) => (
      <span>
        {res.label || titlecase(res.name)}
        <small>{res.prefix ? `${res.prefix}:${res.name}` : res.id}</small>
      </span>
    ),
    toValue: (res) => res.label || titlecase(res.name)
  }
}

module.exports = {
  ResourceSelect
}

