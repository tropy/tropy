'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const cx = require('classnames')
const { bool, func, number, shape, string } = PropTypes
const { createClickHandler } = require('../util')


class NoteListItem extends PureComponent {

  handleContextMenu = (event) => {
    const { note, isDisabled, isSelected, onContextMenu, onSelect } = this.props

    if (!isDisabled) {
      if (!isSelected) onSelect(note)

      onContextMenu(event, 'note', {
        notes: [note.id], item: note.item, photo: note.photo
      })
    }
  }

  handleClick = createClickHandler({
    onClick: () => {
      this.props.onSelect(this.props.note)
    },

    onDoubleClick: () => {
      this.props.onOpen(this.props.note)
    }
  })

  render() {
    const { note, isSelected } = this.props

    return (
      <li
        className={cx({ note: true, active: isSelected })}
        onMouseDown={this.handleClick}
        onContextMenu={this.handleContextMenu}>
        <div className="css-multiline-truncate">
          {note.text.slice(0, 280)}
        </div>
      </li>
    )
  }

  static propTypes = {
    note: shape({
      id: number.isRequired,
      text: string.isRequired
    }).isRequired,

    isDisabled: bool,
    isSelected: bool,

    onContextMenu: func.isRequired,
    onOpen: func.isRequired,
    onSelect: func.isRequired
  }
}

module.exports = {
  NoteListItem
}
