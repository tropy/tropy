'use strict'

const React = require('react')
const { Fragment, PureComponent } = React
const { Select } = require('../select')
const { Highlight } = require('../completions')
const { FormattedMessage } = require('react-intl')
const collate = require('../../collate')
const { titlecase } = require('../../common/util')

const {
  bool, func, number, object, oneOfType, shape, string
} = require('prop-types')


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
    match: (res, query) => (
      match(res, ...query.split(':', 2).reverse())
    ),
    tabIndex: -1,
    toText: (value, { matchData } = {}) => (
      <Fragment>
        <Label resource={value} matchData={matchData}/>
        <Id resource={value} matchData={matchData}/>
      </Fragment>
    )
  }
}


const Label = ({ resource, matchData }) => (
  <span className="truncate">
    {resource.label ?
      <Highlight
        text={resource.label}
        matchData={matchData && matchData.label}/> :
      <Highlight
        text={titlecase(resource.name)}
        matchData={matchData && matchData.name}/>}
  </span>
)

Label.propTypes = {
  resource: shape({
    name: string,
    label: string
  }).isRequired,
  matchData: oneOfType([bool, object])
}


const Id = ({ resource, matchData }) => (
  <span className="mute truncate">
    {(!resource.prefix || !resource.name) ? resource.id : (
      <Fragment>
        <Highlight
          text={resource.prefix}
          matchData={matchData && matchData.prefix}/>
        {':'}
        <Highlight
          text={resource.name}
          matchData={matchData && matchData.name}/>
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
  matchData: oneOfType([bool, object])
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
  let matchData = collate.match(String(res[prop]), query, at)
  return (matchData == null) ? null : { [prop]: matchData }
}

module.exports = {
  Id,
  Label,
  ResourceSelect,
}
