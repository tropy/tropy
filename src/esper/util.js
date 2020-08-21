import * as css from '../css'
import { SCALE_MODES } from 'pixi.js'
import { restrict } from '../common/util'
import { darwin } from '../common/os'
import { ESPER, SASS } from '../constants'

const { CURSOR, ZOOM_LINEAR_MAX } = SASS.ESPER

export function constrain(pos, { left, top, bottom, right }) {
  pos.x = Math.floor(restrict(pos.x, left, right))
  pos.y = Math.floor(restrict(pos.y, top, bottom))

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

const equal = (p1, p2) =>
  p1.x === p2.x && p1.y === p2.y

export const center = ({ x = 0, y = 0, width, height }) => ({
  x: Math.round(x + width / 2),
  y: Math.round(y + height / 2)
})

export function setScaleMode(texture, zoom) {
  if (texture == null) return

  let { baseTexture } = texture
  let crisp = (zoom > ZOOM_LINEAR_MAX) || (zoom === 1)
  let scaleMode = crisp ?
    SCALE_MODES.NEAREST :
    SCALE_MODES.LINEAR

  if (baseTexture.scaleMode !== scaleMode) {
    baseTexture.scaleMode = scaleMode
  }
}

const svg = (name) =>
  [`${name}@1x.svg`, `${name}@2x.svg`]

export function addCursorStyle(styles, name, cursor = CURSOR[name]) {
  if (cursor == null) return

  styles[name] = css.cursor(svg(cursor.default), cursor)
  styles[`${name}-active`] = css.cursor(svg(cursor.active), cursor)
}
