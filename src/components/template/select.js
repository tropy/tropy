'use strict'

const React = require('react')
const { array, func, oneOf, string } = require('prop-types')

const TemplateSelect = (props) => {
  const { selected, onChange, templates } = props

  return (
    <select
      tabIndex="-1"
      name="template-select"
      className="template-select form-control"
      required
      value={selected}
      onChange={onChange}>
      {templates.map(({ uri, name }) =>
        <option key={uri} value={uri}>{name}</option>)
      }
    </select>
  )
}

TemplateSelect.propTypes = {
  templates: array.isRequired,
  type: oneOf(['item', 'photo']),
  selected: string,
  onChange: func
}

TemplateSelect.defaultProps = {
  type: 'item'
}

module.exports = {
  TemplateSelect
}
