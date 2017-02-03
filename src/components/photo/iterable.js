'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Thumbnail } = require('./thumbnail')
const { DragSource, DropTarget } = require('react-dnd')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { bounds } = require('../../dom')
const { pick } = require('../../common/util')
const { keys } = Object
const { DND } = require('../../constants')


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
      'photo': true,
      'drag-source': true,
      'drop-target': true,
      'active': this.props.isSelected,
      'context': this.props.isContext,
      'over': this.props.isOver,
      'dragging': this.props.isDragging,
      [this.props.orientation]: true,
      [this.direction]: this.props.isOver
    }
  }

  get direction() {
    return this.state.offset ? 'after' : 'before'
  }

  get isVertical() {
    return this.props.orientation === 'vertical'
  }


  handleContextMenu = (event) => {
    const { photo, isDisabled, onContextMenu } = this.props

    if (!isDisabled) {
      onContextMenu(event, 'photo', {
        id: photo.id, item: photo.item, path: photo.path
      })
    }
  }

  setContainer = (container) => {
    this.container = container
  }


  connect(element) {
    return this.props.isDisabled ?
      element : this.props.ds(this.props.dt(element))
  }

  renderThumbnail(props) {
    return (
      <Thumbnail
        {...pick(this.props, keys(Thumbnail.propTypes))}
        {...props}/>
    )
  }


  static DragSourceSpec = {
    beginDrag({ photo }) {
      return { id: photo.id, item: photo.item }
    },

    canDrag({ isDisabled }) {
      return !isDisabled
    }
  }

  static DragSourceCollect = (connect, monitor) => ({
    ds: connect.dragSource(),
    dp: connect.dragPreview(),
    isDragging: monitor.isDragging()
  })


  static DropTargetSpec = {
    hover({ photo, onOver }, monitor, component) {
      const { top, left, width, height } = bounds(component.container)
      const { x, y } = monitor.getClientOffset()

      const offset = Math.round(
        component.isVertical ? ((y - top) / height) : ((x - left) / width)
      )

      component.setState({ offset })
    },

    drop({ photo, onDropPhoto }, monitor, { state }) {
      const item = monitor.getItem()

      onDropPhoto({
        id: item.id, to: photo.id, offset: state.offset
      })
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver(),
  })

  static wrap() {
    return DragSource(
      DND.PHOTO, this.DragSourceSpec, this.DragSourceCollect
    )(DropTarget(
      DND.PHOTO, this.DropTargetSpec, this.DropTargetCollect
    )(this))
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

    orientation: PropTypes.oneOf(['horizontal', 'vertical']),

    cache: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,

    ds: PropTypes.func.isRequired,
    dt: PropTypes.func.isRequired,
    dp: PropTypes.func.isRequired,

    onContextMenu: PropTypes.func.isRequired,
    onItemOpen: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }

  static defaultProps = {
    orientation: 'vertical'
  }
}

module.exports = {
  PhotoIterable
}
