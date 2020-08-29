import React from 'react'
import { SelectionIterable } from './iterable'
import { Editable } from '../editable'
import { injectIntl } from 'react-intl'
import { createClickHandler } from '../util'
import { testFocusChange } from '../../dom'
import cx from 'classnames'
import { bool, func, object, string } from 'prop-types'


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
    const { selection, title, onChange } = this.props

    onChange({
      id: selection.id,
      data: {
        [title]: { text, type: 'text' }
      }
    })
  }

  render() {
    const { title } = this

    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}
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
      </li>
    )
  }

  static propTypes = {
    ...SelectionIterable.propTypes,
    intl: object.isRequired,
    title: string.isRequired,
    data: object.isRequired,
    isEditing: bool.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}

const SelectionListItemContainer =
  injectIntl(SelectionListItem.withDragAndDrop())

export {
  SelectionListItemContainer as SelectionListItem
}
