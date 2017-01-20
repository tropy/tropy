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
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case DND.LIST:
        if (item.id === list.id) break

        var { top, height } = bounds(container)
        var offset = Math.round((monitor.getClientOffset().y - top) / height)

        onMove(item.id, list.id, offset)
        break
    }
  },

  drop({ list, onDropItems }, monitor) {
    const type = monitor.getItemType()
    const item = monitor.getItem()

    switch (type) {
      case DND.ITEMS:
        onDropItems({ list: list.id, items: item.items })
        break
    }
  }
}

const dtCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  dtType: monitor.getItemType()
})


module.exports = {
  connect({ isSortable, ds, dt }, element) {
    return isSortable ? ds(dt(element)) : element
  },

  Sortable(Component) {
    return DragSource(DND.LIST, dsSpec, dsCollect)(
      DropTarget([DND.LIST, DND.ITEMS], dtSpec, dtCollect)(Component))
  }
}
