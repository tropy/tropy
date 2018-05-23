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
    match: (res, query) => match(res, ...query.split(':', 2).reverse()),
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


function match(res, query, prefix) {
  return (prefix != null) ?
    (prefix === res.prefix) && m(query, res.name, res.label) :
    m(query, res.prefix, res.name, res.label)
}

function m(q, ...ss) {
  for (let s of ss) { if (s != null && startsWith(s, q)) return true }
}

module.exports = {
  ResourceSelect
}
