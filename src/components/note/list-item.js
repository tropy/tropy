'use strict'

const React = require('react')
const { PropTypes } = React
const cn = require('classnames')

const NoteListItem = ({ isSelected }) => (
  <li className={cn({ note: true, active: isSelected })}>
    <div className="css-multiline-truncate">
      {'note content'}
    </div>
  </li>
)

NoteListItem.propTypes = {
  isSelected: PropTypes.bool
}

module.exports = {
  NoteListItem
}
