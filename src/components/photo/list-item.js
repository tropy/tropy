'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { PhotoIterable } = require('./iterable')
const { SelectionList } = require('../selection/list')
const { get, pluck } = require('../../common/util')
const cx = require('classnames')
const { testFocusChange } = require('../../dom')
const { bool, func, object, string } = require('prop-types')
const { IconSelection, IconChevron9, IconWarning } = require('../icons')
const { IconButton } = require('../button')


class PhotoListItem extends PhotoIterable {
  get classes() {
    return [...super.classes, { active: this.isActive }]
  }

  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  get selections() {
    return pluck(this.props.selections, this.props.photo.selections)
  }

  get title() {
    const { data, photo, title } = this.props
    return get(data, [photo.id, title, 'text'])
  }

  handleMouseDown = () => {
    this.hasFocusChanged = testFocusChange()
  }

  handleSingleClick = () => {
    if (!(this.props.isDisabled || this.props.isDragging)) {
      this.props.onEdit(this.props.photo)
    }
  }

  handleClick = createClickHandler({
    onClick: () => {
      const { isActive } = this
      this.select()
      return !isActive || this.hasFocusChanged()
    },

    onSingleClick: this.handleSingleClick,

    onDoubleClick: () => {
      if (!this.props.isItemOpen) {
        this.props.onItemOpen(this.props.photo)
      } else {
        this.handleSingleClick()
      }
    }
  })


  handleChange = (text) => {
    const { photo, title, onChange } = this.props

    onChange({
      id: photo.id,
      data: {
        [title]: { text, type: 'text' }
      }
    })
  }

  handleTwistyButtonClick = (event) => {
    event.stopPropagation()

    if (this.props.isExpanded) this.contract()
    else this.expand()
  }


  renderSelectionList() {
    if (!this.props.isExpanded) return null

    return (
      <SelectionList
        cache={this.props.cache}
        active={this.props.selection}
        data={this.props.data}
        edit={this.props.edit.selection}
        isDisabled={this.props.isDisabled}
        isItemOpen={this.props.isItemOpen}
        onChange={this.props.onChange}
        onContextMenu={this.props.onContextMenu}
        onEdit={this.props.onEdit}
        onEditCancel={this.props.onEditCancel}
        onItemOpen={this.props.onItemOpen}
        onSelect={this.props.onSelect}
        onSort={this.props.onSelectionSort}
        photo={this.props.photo}
        selections={this.selections}
        size={this.props.size}/>
    )
  }

  renderTwistyButton() {
    return this.props.isExpandable && (
      <IconButton
        icon={<IconChevron9/>}
        onClick={this.handleTwistyButtonClick}/>
    )
  }

  render() {
    const {
      isDisabled,
      isEditing,
      isExpandable,
      onEditCancel,
      photo
    } = this.props

    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        <div
          className="photo-container"
          onClick={this.handleClick}
          onContextMenu={this.handleContextMenu}
          onMouseDown={this.handleMouseDown}>
          {this.renderTwistyButton()}
          {this.renderThumbnail()}
          <div className="title">
            <Editable
              value={this.title}
              resize
              isActive={isEditing}
              isDisabled={isDisabled}
              onCancel={onEditCancel}
              onChange={this.handleChange}/>
          </div>
          <div className="icon-container">
            {photo.broken && <IconWarning/>}
            {isExpandable && <IconSelection/>}
          </div>
        </div>
        {this.renderSelectionList()}
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,
    data: object.isRequired,
    edit: object.isRequired,
    isEditing: bool.isRequired,
    isExpanded: bool.isRequired,
    selections: object.isRequired,
    title: string.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onSelectionSort: func.isRequired
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
