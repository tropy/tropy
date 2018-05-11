'use strict'

const React = require('react')
const { Fragment, PureComponent } = React
const { Select } = require('../select')
const { FormattedMessage } = require('react-intl')
const { startsWith } = require('../../collate')
const { titlecase } = require('../../common/util')
const { bool, array, func, number, oneOfType, string } = require('prop-types')

class ResourceSelect extends PureComponent {
  get placeholder() {
    return this.props.placeholder != null &&
      <FormattedMessage id={this.props.placeholder}/>
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
        className={this.props.className}
        hideClearButton={this.props.hideClearButton}
        isDisabled={this.props.isDisabled}
        isRequired={this.props.isRequired}
        isStatic={this.props.isStatic}
        isValueHidden={this.props.isValueHidden}
        match={this.props.match}
        maxRows={this.props.maxRows}
        onBlur={this.props.onBlur}
        onChange={this.props.onChange}
        onClose={this.props.onClose}
        onFocus={this.props.onFocus}
        onInsert={this.props.onInsert}
        onOpen={this.props.onOpen}
        onRemove={this.props.onRemove}
        options={this.props.options}
        placeholder={this.placeholder}
        ref={this.setSelect}
        tabIndex={this.props.tabIndex}
        toText={this.props.toText}
        toValue={this.props.toValue}
        value={this.props.value}/>
    )
  }

  static propTypes = {
    className: string.isRequired,
    hideClearButton: bool,
    isDisabled: bool,
    isRequired: bool,
    isStatic: bool,
    isValueHidden: bool,
    match: func.isRequired,
    maxRows: number,
    onBlur: func,
    onChange: func,
    onClose: func,
    onFocus: func,
    onInsert: func,
    onOpen: func,
    onRemove: func,
    options: array.isRequired,
    placeholder: string,
    tabIndex: number.isRequired,
    toText: func.isRequired,
    toValue: func.isRequired,
    value: oneOfType([string, array])
  }

  static defaultProps = {
    className: 'resource-select',
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
      <Fragment>
        <span>{`${res.label || titlecase(res.name)} `}</span>
        <span className="mute">
          {res.prefix ? `${res.prefix}:${res.name}` : res.id}
        </span>
      </Fragment>
    ),
    toValue: (res) => res.label || titlecase(res.name)
  }
}

module.exports = {
  ResourceSelect
}
