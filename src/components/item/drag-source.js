'use strict'

const { DragSource } = require('react-dnd')
const { DND } = require('../../constants')
const { compose, map, filter, into } = require('transducers.js')

const spec = {
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

const collect = (connect, monitor) => ({
  ds: connect.dragSource(),
  dp: connect.dragPreview(),
  isDragging: monitor.isDragging()
})

const ItemDragSource = () =>
  DragSource(DND.ITEMS, spec, collect)


module.exports = {
  ItemDragSource
}
