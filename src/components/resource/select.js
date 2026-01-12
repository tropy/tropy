import { useSelector } from 'react-redux'
import { Select } from '../select.js'
import { Highlight } from '../completions.js'
import { useIntl } from 'react-intl'
import * as collate from '../../collate.js'
import { titlecase } from '../../common/util.js'
import { getDatatypeList, getPropertyList } from '../../selectors/index.js'

export const DataTypeSelect = (props) => {
  let options = useSelector(getDatatypeList)
  return (
    <ResourceSelect {...props} options={options}/>
  )
}

export const PropertySelect = (props) => {
  let options = useSelector(getPropertyList)
  return (
    <ResourceSelect {...props} options={options}/>
  )
}

export const ResourceSelect = ({
  className = 'resource-select',
  match = matchResource,
  tabIndex = -1,
  toText = renderResource,
  ...props
}) => {
  let intl = useIntl()
  let placeholder = (props.placeholder) ?
      intl.formatMessage({ id: props.placeholder }) : null

  return (
    <Select
      {...props}
      className={className}
      match={match}
      placeholder={placeholder}
      tabIndex={tabIndex}
      toText={toText}/>
  )
}

export const Label = ({ resource, matchData }) => (
  <span className="truncate">
    {resource.label ? (
      <Highlight
        text={resource.label}
        matchData={matchData && matchData.label}/>
    ) : (
      <Highlight
        text={
          titlecase(resource.name || String(resource).split(/(#|\/)/).pop())
        }
        matchData={matchData && matchData.name}/>
    )}
  </span>
)

export const Id = ({ resource, matchData }) => (
  <span className="mute truncate">
    {(!resource.prefix || !resource.name) ?
        (resource.id || String(resource)) : (
          <>
            <Highlight
              text={resource.prefix}
              matchData={matchData && matchData.prefix}/>
            :
            <Highlight
              text={resource.name}
              matchData={matchData && matchData.name}/>
          </>
        )}
  </span>
)

function renderResource(value, { matchData } = {}) {
  return (
    <>
      <Label resource={value} matchData={matchData}/>
      <Id resource={value} matchData={matchData}/>
    </>
  )
}

function matchResource(res, q) {
  let [query, prefix] = q.split(':', 2).reverse()

  if (prefix != null) {
    return res.prefix &&
      res.prefix.toLowerCase() === prefix &&
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
