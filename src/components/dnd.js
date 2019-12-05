'use strict'

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

const { NativeDragSource } =
  require('react-dnd-html5-backend-cjs/lib/NativeDragSources/NativeDragSource')

const {
  MIME
} = require('../constants')

const DND = {
  ...NativeTypes,
  FIELD: 'field',
  ITEMS: 'items',
  LIST: 'list',
  PHOTO: 'photo',
  SELECTION: 'selection',
  TEMPLATE: {
    FIELD: 'template.field'
  }
}


const { loadDataTransfer } = NativeDragSource.prototype

NativeDragSource.prototype.loadDataTransfer =
  function (dataTransfer, ...args) {
    loadDataTransfer.call(this, dataTransfer, ...args)

    this.item.types =
      Array.from(dataTransfer.items, (item) => item.type)
  }

const isProjectOrTemplate = (type) =>
  MIME.TPY === type || MIME.TTP === type

const hasProjectFiles = (monitor) => {
  let { types } = monitor.getItem()
  return types != null && types.find(isProjectOrTemplate)
}

const hasPhotoFiles = (monitor) =>
  !hasProjectFiles(monitor)

module.exports = {
  DND,
  DndProvider,
  DragLayer,
  DragSource,
  DropTarget,
  ElectronBackend: createHTML5Backend,
  getEmptyImage,
  hasProjectFiles,
  hasPhotoFiles
}
