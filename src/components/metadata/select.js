'use strict'

const React = require('react')
const { PropTypes } = React
const { keys } = Object

const TemplateSelect = ({ templates, selected, onChange }) => (
  <select
    name="template-select"
    required
    value={selected}
    onChange={onChange}>
    {keys(templates).map(template =>
      <option key={template} value={template}>{template}</option>)
    }
  </select>
)

TemplateSelect.propTypes = {
  templates: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onChange: PropTypes.func
}

module.exports = {
  TemplateSelect
}
