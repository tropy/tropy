'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { PhotoIterable } = require('./iterable')
const { SelectionList } = require('./selection-list')
const { get } = require('../../common/util')
const cx = require('classnames')
const { bool, func, object, string } = require('prop-types')


class PhotoListItem extends PhotoIterable {

  get title() {
    return get(this.props, ['data', this.props.title, 'text'])
  }

  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      const cancel = !this.props.isSelected
      this.props.onSelect(this.props.photo, event)
      return cancel
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


  renderSelections() {
    if (!this.hasSelections || !this.props.isOpen) return null

    const { photo } = this.props

    return (
      <SelectionList
        selections={photo.selections}/>
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
        ref={this.setContainer}
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

        {this.renderSelections()}
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,
    title: string.isRequired,
    data: object.isRequired,
    isEditing: bool,
    isOpen: bool,
    onChange: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired
  }

  static defaultProps = {
    ...PhotoIterable.defaultProps,
    data: {}
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
