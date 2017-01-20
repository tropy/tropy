'use strict'

const { DragSource, DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')

const dsSpec = {
  beginDrag({ list }) {
    return { id: list.id }
  },

  endDrag({ onMoveReset, onMoveCommit }, monitor) {
    if (monitor.didDrop()) {
      onMoveCommit()
    } else {
      onMoveReset()
    }
  }
}

const dsCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})

const dtSpec = {
  hover({ list, onMove }, monitor, { container }) {
    const item = monitor.getItem()

    if (item.id === list.id) return

    const { top, height } = bounds(container)
    const offset = Math.round((monitor.getClientOffset().y - top) / height)

    onMove(item.id, list.id, offset)
  }
}

const dtCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})


module.exports = {
  connect({ isSortable, ds, dt }, element) {
    return isSortable ? ds(dt(element)) : element
  },

  Sortable(Component) {
    return DragSource(DND.LIST, dsSpec, dsCollect)(
      DropTarget(DND.LIST, dtSpec, dtCollect)(Component))
  }
}
