'use strict'

const React = require('react')
const { Fragment, PureComponent } = React
const { Select } = require('../select')
const { FormattedMessage } = require('react-intl')
const { startsWith } = require('../../collate')
const { titlecase } = require('../../common/util')
const { func, number, string } = require('prop-types')

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
      <Select {...this.props}
        placeholder={this.placeholder}
        ref={this.setSelect}/>
    )
  }

  static propTypes = {
    className: string.isRequired,
    match: func.isRequired,
    placeholder: string,
    tabIndex: number.isRequired,
    toText: func.isRequired
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
        <span className="truncate">
          {res.label || titlecase(res.name)}
        </span>
        <span className="mute truncate">
          {res.prefix ? `${res.prefix}:${res.name}` : res.id}
        </span>
      </Fragment>
    )
  }
}

module.exports = {
  ResourceSelect
}
