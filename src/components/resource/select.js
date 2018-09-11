'use strict'

const React = require('react')
const { Fragment, PureComponent } = React
const { Select } = require('../select')
const { FormattedMessage } = require('react-intl')
const collate = require('../../collate')
const { highlight } = require('../completions')
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
    ...Select.defaultProps,
    className: 'resource-select',
    match(res, query) {
      return match(res, ...query.split(':', 2).reverse())
    },
    tabIndex: -1,
    toText(res, _, mData) {
      return (
        <Fragment>
          <span className="truncate">
            {
              hl(res.label, mData, 'label') ||
                hl(titlecase(res.name), mData, 'name')
            }
          </span>
          <span className="mute truncate">
            {(res.prefix && res.name) ? shortId(res, mData) : res.id}
          </span>
        </Fragment>
      )
    }
  }
}


function shortId(res, mData) {
  return (
    <Fragment>
      {hl(res.prefix, mData, 'prefix')}
      {':'}
      {hl(res.name, mData, 'name')}
    </Fragment>
  )
}

function hl(txt, mData, which) {
  return highlight(txt, mData && mData.which === which ? mData : null)
}

function match(res, query, prefix) {
  if (prefix != null) {
    return (prefix === res.prefix) && (
      m(res, query, 'name') ||
      m(res, query, 'label', /\b\w/g)
    )
  }

  return m(res, query, 'prefix') ||
    m(res, query, 'name') ||
    m(res, query, 'label', /\b\w/g)
}

function m(res, query, prop, at = /^\w/g) {
  let md = collate.match(String(res[prop]), query, at)
  if (md != null) md.which = prop
  return md
}

module.exports = {
  ResourceSelect,
  hl,
  shortId
}
