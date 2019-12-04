'use strict'

const { refine } = require('../common/util')

const {
  DndProvider,
  DragLayer,
  DragSource,
  DropTarget
} = require('react-dnd-cjs')

const {
  default: createHTML5Backend,
  NativeTypes,
  getEmptyImage
} = require('react-dnd-html5-backend-cjs')

const NativeDragSources =
  require('react-dnd-html5-backend-cjs/lib/NativeDragSources')

refine(NativeDragSources,
  'createNativeDragSource',
  ([, dataTransfer], dragSource) => {
    if (dataTransfer) {
      dragSource.item.types =
        Array.from(dataTransfer.items, (item) => item.type)
    }

    return dragSource
  })

module.exports = {
  DndProvider,
  DragLayer,
  DragSource,
  DropTarget,
  ElectronBackend: createHTML5Backend,
  NativeTypes,
  getEmptyImage
}
