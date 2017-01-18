'use strict'

const { DragSource } = require('react-dnd')
const { DND } = require('../../constants')

const spec = {
  beginDrag(props) {
    return {
      items: [{ ...props.item }]
    }
  },

  canDrag(props) {
    return !props.item.deleted
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
