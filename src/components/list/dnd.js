'use strict'

const { DragSource, DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')

const DS = {
  spec: {
    beginDrag({ list }) {
      return { id: list.id }
    },

    endDrag({ onSort, onSortReset }, monitor) {
      if (monitor.didDrop()) {
        onSort()
      } else {
        onSortReset()
      }
    }
  },

  collect(connect, monitor) {
    return {
      ds: connect.dragSource(),
      isDragging: monitor.isDragging()
    }
  }
}


const DT = {
  spec: {
    hover({ list, onSortPreview }, monitor, { container }) {
      const type = monitor.getItemType()
      const item = monitor.getItem()

      switch (type) {
        case DND.LIST:
          if (item.id === list.id) break

          var { top, height } = bounds(container)
          var offset = Math.round((monitor.getClientOffset().y - top) / height)

          onSortPreview(item.id, list.id, offset)
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
  },

  collect(connect, monitor) {
    return {
      dt: connect.dropTarget(),
      isOver: monitor.isOver(),
      dtType: monitor.getItemType()
    }
  }
}


module.exports = {
  connect({ isSortable, ds, dt }, element) {
    return isSortable ? ds(dt(element)) : element
  },

  wrap(Component) {
    return DragSource(DND.LIST, DS.spec, DS.collect)(
      DropTarget([DND.LIST, DND.ITEMS], DT.spec, DT.collect)(Component))
  }
}
