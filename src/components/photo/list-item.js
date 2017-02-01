'use strict'

const React = require('react')
const { PropTypes } = React
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { Thumbnail } = require('./thumbnail')
const { PhotoIterable } = require('./iterable')
const cn = require('classnames')


class PhotoListItem extends PhotoIterable {

  handleClick = createClickHandler({
    onClick: (event) => {
      const { photo, isSelected, onClick } = this.props

      if (!isSelected) {
        event.stopPropagation()
      }

      onClick(photo)
    },

    onSingleClick: () => {
      if (!this.props.isDisabled) {
        this.props.onSingleClick(this.props.photo.id)
      }
    },

    onDoubleClick: () => {
      this.props.onDoubleClick(this.props.photo)
    }
  })

  handleContextMenu = (event) => {
    if (!this.props.isDisabled) {
      this.props.onContextMenu(this.props.photo, event)
    }
  }

  handleChange = (value) => {
    const { photo, title, onChange } = this.props
    onChange({ id: photo.id, title }, value)
  }



  _render() {
    const {
      photo,
      cache,
      title,
      size,
      isEditing,
      isDisabled,
      onEditCancel
    } = this.props

    const value = photo.data[title] && photo.data[title].value

    return (
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>

        <Thumbnail cache={cache} photo={photo} size={size}/>

        <div className="title">
          <Editable
            value={value}
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

    onEditCancel: PropTypes.func,
    onChange: PropTypes.func,
    onClick: PropTypes.func,
    onSingleClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  }
}


module.exports = {
  PhotoListItem: PhotoListItem.wrap()
}
