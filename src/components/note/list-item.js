'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const cx = require('classnames')
const { bool, func, number, shape, string } = PropTypes
const { createClickHandler } = require('../util')


class NoteListItem extends PureComponent {
  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.scrollIntoViewIfNeeded(false)
    }
  }

  handleContextMenu = (event) => {
    const { note, isDisabled, isSelected, onContextMenu, onSelect } = this.props

    if (!isDisabled) {
      if (!isSelected) onSelect(note)

      onContextMenu(event, 'note', {
        notes: [note.id],
        item: note.item,
        photo: note.photo,
        selection: note.selection
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

  setContainer = (container) => {
    this.container = container
  }

  render() {
    return (
      <li
        ref={this.setContainer}
        className={cx('note', { active: this.props.isSelected })}
        onMouseDown={this.handleClick}
        onContextMenu={this.handleContextMenu}>
        <div className="css-multiline-truncate">
          {this.props.note.text.slice(0, 280)}
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
