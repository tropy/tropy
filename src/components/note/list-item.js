import React from 'react'
import cx from 'classnames'
import { bool, func, number, shape, string } from 'prop-types'
import { createClickHandler } from '../util'


export class NoteListItem extends React.PureComponent {
  container = React.createRef()

  componentDidUpdate(props) {
    if (this.props.isSelected && !props.isSelected) {
      this.container.current.scrollIntoViewIfNeeded(false)
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

  render() {
    return (
      <li
        ref={this.container}
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
