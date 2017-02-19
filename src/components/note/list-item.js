'use strict'

const React = require('react')
const { PropTypes } = React
const cx = require('classnames')
const { bool } = PropTypes

const NoteListItem = ({ isSelected }) => (
  <li className={cx({ note: true, active: isSelected })}>
    <div className="css-multiline-truncate">
      {'note content'}
    </div>
  </li>
)

NoteListItem.propTypes = {
  isSelected: bool
}

module.exports = {
  NoteListItem
}
