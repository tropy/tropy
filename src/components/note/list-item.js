'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const cx = require('classnames')
const { bool, func, number, shape } = PropTypes


class NoteListItem extends PureComponent {

  handleContextMenu = (event) => {
    const { note, isDisabled, onContextMenu } = this.props

    if (!isDisabled) {
      onContextMenu(event, 'note', {
        notes: [note.id], item: note.item, photo: note.photo
      })
    }
  }

  render() {
    const { note, isSelected } = this.props

    return (
      <li
        className={cx({ note: true, active: isSelected })}
        onContextMenu={this.handleContextMenu}>
        <div className="css-multiline-truncate">
          Note {note.id}
        </div>
      </li>
    )
  }

  static propTypes = {
    note: shape({
      id: number.isRequired
    }).isRequired,

    isDisabled: bool,
    isSelected: bool,

    onContextMenu: func.isRequired
  }
}

module.exports = {
  NoteListItem
}
