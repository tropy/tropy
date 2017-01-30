'use strict'

const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')


const spec = {
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})


const ItemDropTarget = () =>
  DropTarget(DND.PHOTO, spec, collect)


module.exports = {
  ItemDropTarget
}
