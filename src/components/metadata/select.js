'use strict'

const React = require('react')
const { PropTypes } = require('prop-types')
const { into, map, filter, compose } = require('transducers.js')

const templates = (props) => {
  return into(
    [],
    compose(
      map(kv => kv[1]),
      filter(t => t.type === props.type),
      map(({ uri, name }) =>
        <option key={uri} value={uri}>{name}</option>
      )
    ),
    props.templates)
}

const TemplateSelect = (props) => {
  const { selected, onChange } = props

  return (
    <select
      tabIndex="-1"
      name="template-select"
      className="template-select form-control"
      required
      value={selected}
      onChange={onChange}>
      {templates(props)}
    </select>
  )
}

TemplateSelect.propTypes = {
  templates: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['item', 'photo']),
  selected: PropTypes.string,
  onChange: PropTypes.func
}

TemplateSelect.defaultProps = {
  type: 'item'
}

module.exports = {
  TemplateSelect
}
