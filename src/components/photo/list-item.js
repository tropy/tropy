'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { PhotoIterable } = require('./iterable')
const { SelectionList } = require('../selection/list')
const { get, pluck } = require('../../common/util')
const cx = require('classnames')
const { bool, func, object, string } = require('prop-types')
const { IconSelection, IconChevron9 } = require('../icons')
const { IconButton } = require('../button')

class PhotoListItem extends PhotoIterable {
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

  handleClick = createClickHandler({
    onClick: () => {
      const { isSelected } = this.props
      this.select()
      return !isSelected
    },

    onSingleClick: () => {
      const { photo, isDisabled, isDragging, onEdit } = this.props

      if (!(isDisabled || isDragging)) {
        onEdit(photo.id)
      }
    },

    onDoubleClick: () => {
      this.props.onItemOpen(this.props.photo)
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
    if (!this.hasSelections || !this.props.isExpanded) return null

    return (
      <SelectionList
        cache={this.props.cache}
        active={this.props.activeSelection}
        data={this.props.data}
        edit={this.props.edit}
        isDisabled={this.props.isDisabled}
        onChange={this.props.onChange}
        onEdit={this.props.onEdit}
        onEditCancel={this.props.onEditCancel}
        onSelect={this.props.onSelect}
        photo={this.props.photo}
        selections={this.selections}
        size={this.props.size}/>
    )
  }

  renderTwistyButton() {
    return this.hasSelections && (
      <IconButton
        icon={<IconChevron9/>}
        onClick={this.handleTwistyButtonClick}/>
    )
  }

  render() {
    const {
      isEditing,
      isDisabled,
      onEditCancel
    } = this.props

    return this.connect(
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        <div
          className="photo-container"
          onClick={this.handleClick}
          onContextMenu={this.handleContextMenu}>
          {this.renderTwistyButton()}
          {this.renderThumbnail()}
          <div className="title">
            <Editable
              value={this.title}
              isEditing={isEditing}
              isDisabled={isDisabled}
              onCancel={onEditCancel}
              onChange={this.handleChange}/>
          </div>
          {this.hasSelections && <IconSelection/>}
        </div>
        {this.renderSelectionList()}
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,
    data: object.isRequired,
    isEditing: bool.isRequired,
    isExpanded: bool.isRequired,
    selections: object.isRequired,
    title: string.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
