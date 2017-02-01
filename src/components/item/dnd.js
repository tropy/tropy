'use strict'

const { DragSource, DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { compose, map, filter, into } = require('transducers.js')

const DS = {
  spec: {
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
  },


  collect(connect, monitor) {
    return {
      ds: connect.dragSource(),
      dp: connect.dragPreview(),
      isDragging: monitor.isDragging()
    }
  },

  connect() {
    return DragSource(DND.ITEMS, DS.spec, DS.collect)
  }
}


const DT = {
  spec: {
    drop({ item, onDropPhotos }, monitor) {
      const photo = monitor.getItem()

      onDropPhotos({
        item: item.id, photos: [photo]
      })
    },

    canDrop({ item }, monitor) {
      const photo = monitor.getItem()
      return item.id !== photo.item
    }
  },

  collect(connect, monitor) {
    return {
      dt: connect.dropTarget(),
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    }
  },

  connect() {
    return DropTarget(DND.PHOTO, DT.spec, DT.collect)
  }

}

module.exports = {
  connect({ ds, dt }, element) {
    return ds(dt(element))
  },

  wrap(Component) {
    return DS.connect()(DT.connect()(Component))
  }
}
