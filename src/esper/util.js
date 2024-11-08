import * as css from '../css.js'
import { restrict } from '../common/util.js'
import { darwin } from '../common/os.js'
import { ESPER, SASS } from '../constants/index.js'

const { CURSOR, ZOOM_LINEAR_MAX } = SASS.ESPER

export function constrain(pos, { left, top, bottom, right }) {
  pos.x = (restrict(pos.x, left, right))
  pos.y = (restrict(pos.y, top, bottom))

  return pos
}

export const coords = (event) => ({
  x: event.offsetX,
  y: event.offsetY,
  dx: event.deltaX,
  dy: event.deltaY,
  ctrl: event.ctrlKey || event.metaKey,
  shift: event.shiftKey,
  pinch: isPinchToZoom(event)
})

export const isDoubleClickSupported = (tool) =>
  tool === ESPER.TOOL.PAN || tool === ESPER.TOOL.ARROW

const isPinchToZoom = ({ type, ctrlKey, metaKey, shiftKey }) =>
  darwin && type === 'wheel' && ctrlKey && !(metaKey || shiftKey)

export const equal = (p1, p2) =>
  p1.x === p2.x && p1.y === p2.y

export const center = ({ x = 0, y = 0, width, height }) => ({
  x: Math.round(x + width / 2),
  y: Math.round(y + height / 2)
})

export function setScaleMode(texture, zoom) {
  if (texture == null) return

  let { source } = texture
  let crisp = (zoom > ZOOM_LINEAR_MAX) || (zoom === 1)
  let scaleMode = crisp ? 'nearest' : 'linear'

  if (source.scaleMode !== scaleMode) {
    source.scaleMode = scaleMode
  }
}

const svg = (name) =>
  [`${name}@1x.svg`, `${name}@2x.svg`]

export function addCursorStyle(styles, name, cursor = CURSOR[name]) {
  if (cursor == null) return

  styles[name] = css.cursor(svg(cursor.default), cursor)
  styles[`${name}-active`] = css.cursor(svg(cursor.active), cursor)
}

export function normalizeRectangle({
  x = 0, y = 0, width = 0, height = 0
}, round = false) {

  if (width < 0) {
    x = x + width
    width = -width
  }

  if (height < 0) {
    y = y + height
    height = -height
  }

  if (round) {
    x = Math.round(x)
    y = Math.round(y)
    width = Math.round(width)
    height = Math.round(height)
  }

  return {
    x, y, width, height
  }
}
