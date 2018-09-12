'use strict'

const React = require('react')
const { Fragment, PureComponent } = React
const { Select } = require('../select')
const { Highlight } = require('../completions')
const { FormattedMessage } = require('react-intl')
const collate = require('../../collate')
const { titlecase } = require('../../common/util')
const { array, func, number, shape, string } = require('prop-types')

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
          <Label resource={res} matchData={mData}/>
          <Id resource={res} matchData={mData}/>
        </Fragment>
      )
    }
  }
}


const Label = ({ resource, matchData }) => (
  <span className="truncate">
    {
      hl(resource.label, matchData, 'label') ||
        hl(titlecase(resource.name), matchData, 'name')
    }
  </span>
)

Label.propTypes = {
  resource: shape({
    name: string,
    label: string
  }).isRequired,
  matchData: array
}


const Id = ({ resource, matchData }) => (
  <span className="mute truncate">
    {(!resource.prefix || !resource.name) ? resource.id : (
      <Fragment>
        {hl(resource.prefix, matchData, 'prefix')}
        {':'}
        {hl(resource.name, matchData, 'name')}
      </Fragment>
    )}
  </span>
)

Id.propTypes = {
  resource: shape({
    id: string.isRequired,
    name: string,
    prefix: string
  }).isRequired,
  matchData: array
}

const hl = (text, mData, which) =>
  <Highlight
    text={text}
    matchData={mData && mData.which === which ? mData : null}/>

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
  Id,
  Label,
  ResourceSelect,
}
