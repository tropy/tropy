'use strict'

const React = require('react')
const { ResourceSelect } = require('../resource/select')
const { Popup } = require('../popup')
const { arrayOf, func, object, shape } = require('prop-types')

const ColumnContextMenu = ({ columns, onClose, style, ...props }) => (
  <Popup
    autofocus
    className="column-context-menu"
    onResize={onClose}
    style={style}>
    <ColumnSelect
      {...props}
      onClose={onClose}
      options={columns.available}
      value={columns.active.map(col => col.id)}/>
  </Popup>
)

ColumnContextMenu.propTypes = {
  columns: shape({
    active: arrayOf(object).isRequired,
    available: arrayOf(object).isRequired
  }).isRequired,
  onClose: func.isRequired,
  style: object.isRequired
}

const ColumnSelect = (props) => (
  <ResourceSelect
    className="column-select"
    placeholder="select.column.placeholder"
    hideClearButton
    isRequired
    isStatic
    isValueHidden
    {...props}/>
)

module.exports = {
  ColumnContextMenu,
  ColumnSelect
}
