'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { PhotoIterable } = require('./iterable')
const { SelectionList } = require('../selection/list')
const { get } = require('../../common/util')
const cx = require('classnames')
const { bool, func, object, string } = require('prop-types')
const { IconSelection, IconChevron9 } = require('../icons')
const { IconButton } = require('../button')

class PhotoListItem extends PhotoIterable {

  get title() {
    const { data, photo, title } = this.props
    return get(data, [photo.id, title, 'text'])
  }

  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      if (!this.props.isSelected) {
        this.select(event)
        return true
      }
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

    const { photo } = this.props

    return (
      <SelectionList
        cache={this.props.cache}
        data={this.props.data}
        edit={this.props.edit}
        isDisabled={this.props.isDisabled}
        photo={photo}
        active={this.props.activeSelection}
        selections={this.selections}
        size={this.props.size}
        onEdit={this.props.onEdit}
        onEditCancel={this.props.onEditCancel}
        onChange={this.props.onChange}
        onSelect={this.props.onSelect}/>
    )
  }

  renderTwistyButton() {
    return this.hasSelections && (
      <div className="twisty-container">
        <IconButton
          icon={<IconChevron9/>}
          onClick={this.handleTwistyButtonClick}/>
      </div>
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
    title: string.isRequired,
    data: object.isRequired,
    isEditing: bool.isRequired,
    isExpanded: bool.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
