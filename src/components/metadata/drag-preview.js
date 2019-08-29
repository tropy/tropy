'use strict'

const React = require('react')

const {
  arrayOf,
  bool,
  number,
  oneOfType,
  shape,
  string
} = require('prop-types')

const FieldDragPreview = ({ field }) => (
  <div className="metadata-field drag-preview">
    {field.value}
    {field.isMixed && <span>+</span>}
    {field.id.length &&
      <div className="badge">{field.id.length}</div>
    }
  </div>
)

FieldDragPreview.propTypes = {
  field: shape({
    id: oneOfType([number, arrayOf(number)]).isRequired,
    isMixed: bool,
    value: string.isRequired
  }).isRequired,
}

module.exports = {
  FieldDragPreview
}
