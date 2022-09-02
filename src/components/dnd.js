import { useMemo } from 'react'

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

const isProjectOrTemplateFile = ({ kind, type }) =>
  kind === 'file' && (MIME.TPY === type || MIME.TTP === type)

const hasProjectFiles = (item) =>
  !!Array.from(item.items || []).find(isProjectOrTemplateFile)

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

function useDropPhotoFiles({ onDrop, isReadOnly = false }) {
  let spec = useMemo(() => ({
    accept: [DND.FILE, DND.URL],

    drop(item) {
      let photos = getDroppedFiles(item)

      if (photos) {
        onDrop(photos)
        return photos
      }
    },

    canDrop(item, monitor) {
      if (isReadOnly)
        return false

      switch (monitor.getItemType()) {
        case DND.FILE:
          return hasPhotoFiles(item)
        case DND.URL:
          // Currently, Tropy only support importing photos via URLs,
          // so here we don't inspecting it further.
          return true
        default:
          return false
      }
    },

    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [onDrop, isReadOnly])

  return useDrop(spec)
}


export {
  DND,
  DndProvider,
  useDragLayer,
  useDrag,
  useDrop,
  useDropPhotoFiles,
  DragSource,
  DropTarget,
  HTML5Backend as ElectronBackend,
  getDroppedFiles,
  getEmptyImage,
  hasProjectFiles,
  hasPhotoFiles
}
