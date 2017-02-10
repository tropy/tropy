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
    return get(this.props, ['data', this.props.title, 'value'])
  }

  get isDraggable() {
    return !this.props.isEditing && super.isDraggable
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      this.props.onSelect(this.props.photo, event)
      return !this.props.isSelected
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
    const { isEditing, isDisabled, onEditCancel } = this.props

    return this.connect(
      <li
        className={cn(this.classes)}
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
      </li>
    )
  }

  static propTypes = {
    ...PhotoIterable.propTypes,

    title: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,

    isEditing: PropTypes.bool,

    onChange: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onEditCancel: PropTypes.func.isRequired
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
