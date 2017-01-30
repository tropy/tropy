'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { Thumbnail } = require('./thumbnail')
const { PhotoDragSource } = require('./dnd')
const { getEmptyImage } = require('react-dnd-html5-backend')
const cn = require('classnames')


class PhotoListItem extends Component {

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get classes() {
    return {
      photo: true,
      active: this.props.isSelected,
      context: this.props.isContext
    }
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      this.props.onClick(this.props.photo, event)
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


  render() {
    const {
      ds,
      photo,
      cache,
      title,
      isEditing,
      isDisabled,
      onCancel
    } = this.props

    const value = photo.data[title] && photo.data[title].value

    return ds(
      <li
        className={cn(this.classes)}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>

        <Thumbnail cache={cache} photo={photo} size={24}/>

        <div className="title">
          <Editable
            value={value}
            isEditing={isEditing}
            isDisabled={isDisabled}
            onCancel={onCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    title: PropTypes.string.isRequired,

    isContext: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,

    cache: PropTypes.string,

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.object,
    }).isRequired,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,
    isDragging: PropTypes.bool,

    onCancel: PropTypes.func,
    onChange: PropTypes.func,

    onContextMenu: PropTypes.func,
    onClick: PropTypes.func,
    onSingleClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  }
}


module.exports = {
  PhotoListItem: PhotoDragSource()(PhotoListItem)
}
