'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { Thumbnail } = require('./thumbnail')
const { getEmptyImage } = require('react-dnd-html5-backend')
const cn = require('classnames')
const dnd = require('./dnd')


class PhotoListItem extends Component {
  constructor(props) {
    super(props)

    this.state = {
      offset: 0
    }
  }


  componentDidMount() {
    this.props.dp(getEmptyImage())
  }

  get classes() {
    return {
      photo: true,
      active: this.props.isSelected,
      context: this.props.isContext,
      over: this.props.isOver,
      before: this.props.isOver && !this.state.offset,
      after: this.props.isOver && this.state.offset
    }
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

  handleContextMenu = (event) => {
    if (!this.props.isDisabled) {
      this.props.onContextMenu(this.props.photo, event)
    }
  }

  handleChange = (value) => {
    const { photo, title, onChange } = this.props
    onChange({ id: photo.id, title }, value)
  }

  setContainer = (container) => {
    this.container = container
  }


  render() {
    const {
      photo,
      cache,
      title,
      isEditing,
      isDisabled,
      onEditCancel
    } = this.props

    const value = photo.data[title] && photo.data[title].value

    return dnd.connect(this.props,
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}>

        <Thumbnail cache={cache} photo={photo} size={24}/>

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
    title: PropTypes.string.isRequired,

    isContext: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isEditing: PropTypes.bool,
    isSelected: PropTypes.bool,
    isOver: PropTypes.bool,

    cache: PropTypes.string,

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.object,
    }).isRequired,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,
    isDragging: PropTypes.bool,

    onEditCancel: PropTypes.func,
    onChange: PropTypes.func,

    onContextMenu: PropTypes.func,
    onClick: PropTypes.func,
    onSingleClick: PropTypes.func,
    onDoubleClick: PropTypes.func
  }
}


module.exports = {
  PhotoListItem: dnd.wrap(PhotoListItem)
}
