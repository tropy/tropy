import { isProjectFile, isTemplateFile } from '../common/project-file.js'
import { MIME } from '../constants/index.js'
import { restrict } from '../common/util.js'

export {
  draggable,
  dropTargetForElements
} from '#pdnd/adapter/element-adapter.js'
export {
  setCustomNativeDragPreview
} from '#pdnd/public-utils/element/custom-native-drag-preview/set-custom-native-drag-preview.js'

export const isAppDrag = ({ types }) =>
  types.includes('application/vnd.pdnd')

const projectTypes = [MIME.TPY, MIME.MTPY, MIME.TTP]

const isFile = (item) =>
  item.kind === 'file'

export const hasProjectFiles = (items) =>
  items.some(it => isFile(it) && (
    it.type === '' || projectTypes.includes(it.type)))

export const hasPhotoFiles = (items) =>
  items.some(isFile)
    ? !hasProjectFiles(items)
    : items.some(it => it.type === 'text/uri-list')

export const hasText = (items) =>
  !items.some(isFile) &&
  items.some(it => it.type === 'text/plain' || it.type === 'text/uri-list')

export const hasProjectPaths = ({ files }) =>
  files.some(path => isProjectFile(path) || isTemplateFile(path))

export function getDropPosition ({ x, y }, { top, left, width, height }, {
  isGrid = false,
  on = false
} = {}) {
  let f = isGrid ? (x - left) / width : (y - top) / height

  if (on)
    return (f < 1 / 3) ? 'before' : (f > 2 / 3) ? 'after' : 'on'
  else
    return (f < 0.5) ? 'before' : 'after'
}

export const isNoopMove = (position, { id, target, adjacent: [prev, next] }) =>
  id === target ||
  (position === 'after' && target === prev) ||
  (position === 'before' && target === next)

export const getDropDepth = ({ x }, { left }, { depth, indent, padding = 0 }) =>
  restrict(Math.round((x - left - padding) / indent), 0, depth)
