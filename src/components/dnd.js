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


let currentDataTransfer

refine(NativeDragSources,
  'createNativeDragSource',
  (_, dragSource) => {
    if (currentDataTransfer) {
      dragSource.mutateItemByReadingDataTransfer(currentDataTransfer)
      dragSource.item.types =
        Array.from(currentDataTransfer.items, (item) => item.type)
    }

    return dragSource
  })

const ElectronBackend = (...args) => {
  let backend = createHTML5Backend(...args)

  let {
    handleTopDragEnterCapture,
    handleTopDragStartCapture
  } = backend

  backend.handleTopDragEnterCapture = (event) => {
    try {
      currentDataTransfer = event.dataTransfer
      return handleTopDragEnterCapture.call(backend, event)
    } finally {
      currentDataTransfer = null
    }
  }

  backend.handleTopDragStartCapture = (event) => {
    try {
      currentDataTransfer = event.dataTransfer
      return handleTopDragStartCapture.call(backend, event)
    } finally {
      currentDataTransfer = null
    }
  }

  return backend
}

module.exports = {
  DndProvider,
  DragLayer,
  DragSource,
  DropTarget,
  ElectronBackend,
  NativeTypes,
  getEmptyImage
}
