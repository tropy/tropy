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

const FieldDragPreview = ({ field, isOver }) => (
  <div className="metadata-field drag-preview">
    <div className={'drag-preview-container' + (isOver && 'is-over')}>
      {field.value}
      {field.isMixed && <span>+</span>}
    </div>
    {field.id.length &&
      <div className="badge">{field.id.length}</div>
    }
  </div>
)

FieldDragPreview.propTypes = {
  isOver: bool,
  field: shape({
    id: oneOfType([number, arrayOf(number)]).isRequired,
    isMixed: bool,
    value: string
  }).isRequired,
}

module.exports = {
  FieldDragPreview
}
