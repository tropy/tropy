'use strict'

const css = require('../css')
const { restrict } = require('../common/util')
const { darwin } = require('../common/os')
const { SCALE_MODES } = require('pixi.js')
const { TOOL } = require('../constants/esper')

const {
  ESPER: {
    CURSOR,
    ZOOM_LINEAR_MAX
  }
} = require('../constants/sass')


const constrain = (pos, { left, top, bottom, right }) => {
  pos.x = Math.floor(restrict(pos.x, left, right))
  pos.y = Math.floor(restrict(pos.y, top, bottom))

  return pos
}

const coords = (event) => ({
  x: event.offsetX,
  y: event.offsetY,
  dx: event.deltaX,
  dy: event.deltaY,
  ctrl: event.ctrlKey || event.metaKey,
  shift: event.shiftKey,
  pinch: isPinchToZoom(event)
})

const isDoubleClickSupported = (tool) =>
  tool === TOOL.PAN || tool === TOOL.ARROW

const isPinchToZoom = ({ type, ctrlKey, metaKey, shiftKey }) =>
  darwin && type === 'wheel' && ctrlKey && !(metaKey || shiftKey)

const equal = (p1, p2) =>
  p1.x === p2.x && p1.y === p2.y

const setScaleMode = (texture, zoom) => {
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

const addCursorStyle = (styles, name, cursor = CURSOR[name]) => {
  if (cursor == null) return

  styles[name] = css.cursor(svg(cursor.default), cursor)
  styles[`${name}-active`] = css.cursor(svg(cursor.active), cursor)
}


module.exports = {
  addCursorStyle,
  constrain,
  coords,
  equal,
  isDoubleClickSupported,
  setScaleMode
}
