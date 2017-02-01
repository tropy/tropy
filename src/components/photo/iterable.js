'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Thumbnail } = require('./thumbnail')
const { getEmptyImage } = require('react-dnd-html5-backend')
const { pick } = require('../../common/util')
const { keys } = Object
const dnd = require('./dnd')


class PhotoIterable extends Component {
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
      dragging: this.props.isDragging,
      [this.direction]: this.props.isOver
    }
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  handleContextMenu = (event) => {
    const { photo, isDisabled, onContextMenu } = this.props

    if (!isDisabled) {
      onContextMenu(event, 'photo', { id: photo.id })
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  renderThumbnail(props) {
    return (
      <Thumbnail
        {...pick(this.props, keys(Thumbnail.propTypes))}
        {...props}/>
    )
  }

  render() {
    return dnd.connect(this.props, this._render())
  }


  static wrap() {
    return dnd.wrap(this)
  }

  static propTypes = {
    isContext: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isDragging: PropTypes.bool,
    isEditing: PropTypes.bool,
    isOver: PropTypes.bool,
    isSelected: PropTypes.bool,

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired,
      data: PropTypes.object
    }).isRequired,

    cache: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,

    ds: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,

    onContextMenu: PropTypes.func
  }
}

module.exports = {
  PhotoIterable
}
