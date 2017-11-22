'use strict'


const React = require('react')
const { SelectionIterable } = require('./iterable')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { testFocusChange } = require('../../dom')
const cx = require('classnames')
const { get } = require('../../common/util')
const { bool, func, object, string } = require('prop-types')


class SelectionListItem extends SelectionIterable {
  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  get title() {
    const { data, selection, title } = this.props
    return get(data, [selection.id, title, 'text'])
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
        {this.renderThumbnail()}
        <div className="title">
          <Editable
            display={title || 'Selection'}
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
    title: string.isRequired,
    data: object.isRequired,
    isEditing: bool.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}

module.exports = {
  SelectionListItem: SelectionListItem.withDragAndDrop()
}
