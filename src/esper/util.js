'use strict'

const css = require('../css')
const { restrict } = require('../common/util')
const { SCALE_MODES } = require('pixi.js')

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
  setScaleMode
}
