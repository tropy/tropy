'use strict'

const React = require('react')
const cx = require('classnames')

const {
  arrayOf,
  bool,
  number,
  oneOfType,
  shape,
  string
} = require('prop-types')

const FieldDragPreview = ({ field, isOver }) => (
  <div className={cx('metadata-field drag-preview', {isOver: 'over'})}>
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
