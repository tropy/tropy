import React from 'react'

import {
  arrayOf,
  bool,
  number,
  oneOfType,
  shape,
  string
} from 'prop-types'

export const FieldDragPreview = ({ field }) => (
  <div className="metadata-field drag-preview">
    <div className="drag-preview-container">
      {field.value}
      {field.isMixed && <span>+</span>}
    </div>
    {field.id.length &&
      <div className="badge">{field.id.length}</div>
    }
  </div>
)

FieldDragPreview.propTypes = {
  field: shape({
    id: oneOfType([number, arrayOf(number)]).isRequired,
    isMixed: bool,
    value: string
  }).isRequired
}
