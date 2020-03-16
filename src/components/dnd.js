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

const isProjectOrTemplateFile = ({ kind, type }) =>
  kind === 'file' && (MIME.TPY === type || MIME.TTP === type)

const hasProjectFiles = (monitor) =>
  !!Array.from(monitor.getItem().items || []).find(isProjectOrTemplateFile)

// Subtle: we assume that there are photo files, if we don't see
// any project files. This is because we cannot reliably see all
// files (e.g., in a directory) before the drop event.
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
