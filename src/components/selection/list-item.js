import React from 'react'
import { SelectionIterable } from './iterable.js'
import { Editable } from '../editable.js'
import { injectIntl } from 'react-intl'
import { createClickHandler } from '../util.js'
import { testFocusChange } from '../../dom.js'
import cx from 'classnames'
import { TranscriptionIcon } from '../transcription/icon.js'


class SelectionListItem extends SelectionIterable {
  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  get placeholder() {
    return this.props.intl.formatMessage({
      id: 'panel.photo.selection'
    })
  }

  get title() {
    const { data, selection, title } = this.props
    return data?.[selection.id]?.[title]?.text
  }

  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
  }

  handleSingleClick = () => {
    if (!(this.props.isDisabled || this.props.isDragging)) {
      this.props.onEdit({ selection: this.props.selection.id })
    }
  }

  handleClick = createClickHandler({
    onClick: () => {
      const { isActive } = this.props
      this.select()
      return !isActive || this.hasFocusChanged()
    },

    onSingleClick: this.handleSingleClick,

    onDoubleClick: () => {
      if (!this.props.isItemOpen) this.open()
      else this.handleSingleClick()
    }
  })

  handleChange = (text) => {
    const { selection, title, onChange, onEditCancel } = this.props

    onChange({
      id: selection.id,
      data: {
        [title]: { text, type: 'text' }
      }
    })

    onEditCancel()
  }

  render() {
    const { title } = this

    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.container}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>
        <div className="thumbnail-container">
          {this.renderThumbnail()}
        </div>
        <div className="title">
          <Editable
            display={title || this.placeholder}
            value={title}
            resize
            isActive={this.props.isEditing}
            isDisabled={this.props.isDisabled}
            onCancel={this.props.onEditCancel}
            onChange={this.handleChange}/>
        </div>
        <div className="icon-container">
          <TranscriptionIcon id={this.props.selection.transcriptions?.at(-1)}/>
        </div>
      </li>
    )
  }
}

const SelectionListItemContainer =
  injectIntl(SelectionListItem.withDragAndDrop())

export {
  SelectionListItemContainer as SelectionListItem
}
