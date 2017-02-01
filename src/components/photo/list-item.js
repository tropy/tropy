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
