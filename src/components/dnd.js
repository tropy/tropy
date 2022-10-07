import {
  DndProvider,
  useDragLayer,
  useDrag,
  useDrop,
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
} from '../constants/index.js'

import {
  blank
} from '../common/util.js'

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

// Subtle: we cannot reliably detect folders while dragging;
// they are `kind` file and have an empty string as type
// which also matches other files without extensions.
const projectMimeTypes = [MIME.TPY, MIME.MTPY, MIME.TTP, '']

const isProjectOrTemplateFile = ({ kind, type }) =>
  kind === 'file' && projectMimeTypes.includes(type)

const hasProjectFiles = (item) =>
  !!item.items.find(isProjectOrTemplateFile)

// Subtle: we assume that there are photo files, if we don't see
// any project files. This is because we cannot reliably see all
// files (e.g., in a directory) before the drop event.
const hasPhotoFiles = (item) =>
  !hasProjectFiles(item)


const getDroppedFiles = (item) => {
  let files = item.files?.map(f => f.path)
  let urls = item.urls

  if (!blank(files) || !blank(urls))
    return { files, urls }
}

export {
  DND,
  DndProvider,
  useDragLayer,
  useDrag,
  useDrop,
  DragSource,
  DropTarget,
  HTML5Backend as ElectronBackend,
  getDroppedFiles,
  getEmptyImage,
  hasProjectFiles,
  hasPhotoFiles
}
