'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { PhotoIterable } = require('./iterable')
const { SelectionList } = require('../selection/list')
const { get } = require('../../common/util')
const cx = require('classnames')
const { bool, func, object, string } = require('prop-types')


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
        selections={this.selections}
        size={this.props.size}
        onEdit={this.props.onEdit}
        onEditCancel={this.props.onEditCancel}
        onChange={this.props.onChange}
        onSelect={this.props.onSelect}/>
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
          {this.renderThumbnail()}
          <div className="title">
            <Editable
              value={this.title}
              isEditing={isEditing}
              isDisabled={isDisabled}
              onCancel={onEditCancel}
              onChange={this.handleChange}/>
          </div>
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
