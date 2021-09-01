import {
  DndProvider,
  DragLayer,
  DragSource,
  DropTarget
} from 'react-dnd'

import {
  HTML5Backend,
  NativeTypes,
  getEmptyImage
} from 'react-dnd-html5-backend'

import {
  MIME
} from '../constants'

import {
  blank
} from '../common/util'

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


const getDroppedFiles = (monitor) => {
  let item = monitor.getItem()
  let files = item.files?.map(f => f.path)
  let urls = item.urls

  if (!blank(files) || !blank(urls))
    return { files, urls }
}

export {
  DND,
  DndProvider,
  DragLayer,
  DragSource,
  DropTarget,
  HTML5Backend as ElectronBackend,
  getDroppedFiles,
  getEmptyImage,
  hasProjectFiles,
  hasPhotoFiles
}
