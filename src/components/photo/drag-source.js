'use strict'

const { DragSource } = require('react-dnd')
const { DND } = require('../../constants')

const spec = {
  beginDrag({ photo }) {
    return { id: photo.id }
  },

  canDrag({ isDisabled }) {
    return !isDisabled
  }
}

const collect = (connect, monitor) => ({
  ds: connect.dragSource(),
  dp: connect.dragPreview(),
  isDragging: monitor.isDragging()
})

const PhotoDragSource = () =>
  DragSource(DND.PHOTO, spec, collect)


module.exports = {
  PhotoDragSource
}
