'use strict'

const React = require('react')
const { PropTypes } = React
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { PhotoIterable } = require('./iterable')
const { get } = require('../../common/util')
const cn = require('classnames')


class PhotoListItem extends PhotoIterable {

  get title() {
    return get(this.props.photo, ['data', this.props.title, 'value'])
  }

  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  handleClick = createClickHandler({
    onClick: (event, cancel) => {
      const { photo, isSelected, onSelect } = this.props

      if (!isSelected) {
        cancel()
      }

      onSelect(photo, event)
    },

    onSingleClick: () => {
      if (!this.props.isDisabled) {
        this.props.onEdit(this.props.photo.id)
      }
    },

    onDoubleClick: () => {
      this.props.onItemOpen(this.props.photo)
    }
  })


  handleChange = (value) => {
    const { photo, title, onChange } = this.props

    onChange({
      id: photo.id,
      data: {
        [title]: { value, type: 'text' }
      }
    })
  }


  render() {
    const { isEditing, isDisabled, onEditCancel, onClick } = this.props

    return this.connect(
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onMouseDown={this.handleClick}
        onClick={onClick}
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
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,

    title: PropTypes.string.isRequired,

    isEditing: PropTypes.bool,

    onChange: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onEditCancel: PropTypes.func.isRequired
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
