'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { DragSource, DropTarget } = require('react-dnd')
const { getEmptyImage } = require('react-dnd-electron-backend')
const { compose, map, filter, into } = require('transducers.js')
const { DND } = require('../../constants')
const { bool, func, number, object, shape, oneOf, arrayOf } = PropTypes


class ItemIterable extends PureComponent {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.props.dp(getEmptyImage())
  }


  get isDisabled() {
    return !!this.props.item.deleted
  }

  get classes() {
    return {
      'item': true,
      'drop-target': !this.isDisabled,
      'active': this.props.isSelected,
      'over': this.props.isOver && this.props.canDrop,
      'dragging': this.props.isDragging,
      'last': this.props.isLast,
      [this.props.orientation]: true
    }
  }

  get isVertical() {
    return this.props.orientation === 'vertical'
  }


  handleContextMenu = (event) => {
    const { item, isSelected, onContextMenu, onSelect } = this.props

    if (this.isDisabled) return

    if (!isSelected) onSelect(item, event)

    // TODO needs updated selection
    onContextMenu(event, {
      id: item.id, tags: item.tags, deleted: item.deleted
    })
  }

  setContainer = (container) => {
    this.container = container
  }


  connect(element) {
    return (this.isDisabled) ?
      element : this.props.ds(this.props.dt(element))
  }


  static DragSourceSpec = {
    beginDrag({ item, selection }) {
      return {
        items: into(
          [{ ...item }],
          compose(filter(id => id !== item.id), map(id => ({ id }))),
          selection
        )
      }
    },

    canDrag({ item }) {
      return !item.deleted
    }
  }

  static DragSourceCollect = (connect, monitor) => ({
    ds: connect.dragSource(),
    dp: connect.dragPreview(),
    isDragging: monitor.isDragging()
  })


  static DropTargetSpec = {
    drop({ item, onDropPhotos }, monitor) {
      const photo = monitor.getItem()

      onDropPhotos({
        item: item.id, photos: [photo]
      })
    },

    canDrop({ item }, monitor) {
      const photo = monitor.getItem()

      if (item.deleted) return false
      if (item.id === photo.item) return false

      return true
    }
  }

  static DropTargetCollect = (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })

  static wrap() {
    return DragSource(
      DND.ITEMS, this.DragSourceSpec, this.DragSourceCollect
    )(DropTarget(
      DND.PHOTO, this.DropTargetSpec, this.DropTargetCollect
    )(this))
  }


  static propTypes = {
    isDragging: bool,
    isLast: bool,
    isOver: bool,
    isSelected: bool,
    canDrop: bool,

    item: shape({
      id: number.isRequired,
      data: object,
      deleted: bool,
      photos: arrayOf(number)
    }).isRequired,

    selection: arrayOf(number).isRequired,
    orientation: oneOf(['horizontal', 'vertical']),

    ds: func.isRequired,
    dt: func.isRequired,
    dp: func.isRequired,

    onContextMenu: func.isRequired,
    onDropPhotos: func.isRequired,
    onItemOpen: func.isRequired,
    onSelect: func.isRequired
  }

  static defaultProps = {
    orientation: 'vertical'
  }
}

module.exports = {
  ItemIterable
}
