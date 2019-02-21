'use strict'

const React = require('react')
const { Select } = require('../select')
const { Highlight } = require('../completions')
const { FormattedMessage } = require('react-intl')
const collate = require('../../collate')
const { titlecase } = require('../../common/util')

const {
  bool, func, number, object, oneOfType, shape, string
} = require('prop-types')


class ResourceSelect extends React.PureComponent {
  select = React.createRef()

  get placeholder() {
    return this.props.placeholder != null &&
      <FormattedMessage id={this.props.placeholder}/>
  }

  focus = () => {
    if (this.select.current) this.select.current.focus()
  }

  render() {
    return (
      <Select {...this.props}
        placeholder={this.placeholder}
        ref={this.select}/>
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
      <>
        <Label resource={value} matchData={matchData}/>
        <Id resource={value} matchData={matchData}/>
      </>
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
        text={
          titlecase(resource.name || String(resource).split(/(#|\/)/).pop())
        }
        matchData={matchData && matchData.name}/>}
  </span>
)

Label.propTypes = {
  resource: oneOfType([string, shape({
    name: string,
    label: string
  })]).isRequired,
  matchData: oneOfType([bool, object])
}


const Id = ({ resource, matchData }) => (
  <span className="mute truncate">
    {(!resource.prefix || !resource.name) ?
      (resource.id || String(resource)) : (
        <>
          <Highlight
            text={resource.prefix}
            matchData={matchData && matchData.prefix}/>
          {':'}
          <Highlight
            text={resource.name}
            matchData={matchData && matchData.name}/>
        </>
      )}
  </span>
)

Id.propTypes = {
  resource: oneOfType([string, shape({
    id: string.isRequired,
    name: string,
    prefix: string
  })]).isRequired,
  matchData: oneOfType([bool, object])
}

function match(res, query, prefix) {
  if (prefix != null) {
    return (prefix === res.prefix.toLowerCase()) &&
      matchByNameAndLabel(res, query)
  }

  let [first, ...rest] = query.split(' ')
  let mdp = m(res, first, 'prefix')

  if (mdp == null) {
    return matchByNameAndLabel(res, query)
  }

  if (rest.length === 0) {
    return mdp
  }

  let mdr = matchByNameAndLabel(res, rest.join(' '))

  if (mdr == null) {
    return null
  }

  return Object.assign(mdp, mdr)
}

function matchByNameAndLabel(res, query) {
  let [first, ...rest] = query.split(' ')
  let mdn = m(res, first, 'name')

  if (mdn == null) {
    return m(res, query, 'label', /\b\w/g)
  }

  if (rest.length === 0) {
    return mdn
  }

  let mdl = m(res, rest.join(' '), 'label', /\b\w/g)

  if (mdl == null) {
    return null
  }

  return Object.assign(mdn, mdl)
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
