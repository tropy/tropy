'use strict'

const { DragSource, DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')

const DS = {
  spec: {
    beginDrag({ photo }) {
      return { id: photo.id, item: photo.item }
    },

    canDrag({ isDisabled }) {
      return !isDisabled
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
    return DragSource(DND.PHOTO, DS.spec, DS.collect)
  }
}

const DT = {
  spec: {
    hover({ photo, onOver }, monitor, component) {
      const { top, height } = bounds(component.container)
      const offset = Math.round((monitor.getClientOffset().y - top) / height)

      component.setState({ offset })
    }
  },

  collect(connect, monitor) {
    return {
      dt: connect.dropTarget(),
      isOver: monitor.isOver(),
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
