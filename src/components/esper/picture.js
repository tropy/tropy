'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Sprite, Rectangle } = PIXI
const { ColorMatrixFilter } = PIXI.filters
const { SelectionLayer, SelectionOverlay } = require('./selection')
const { restrict } = require('../../common/util')
const { deg, isHorizontal } = require('../../common/math')


class Picture extends Container {
  constructor({ width, height }) {
    super()

    this.WIDTH = width
    this.HEIGHT = height

    this.pivot.set(width / 2, height / 2)

    this.bg = new Sprite()
    this.bg.filters = [new ColorMatrixFilter()]
    this.addChild(this.bg)

    this.selections = new SelectionLayer()
    this.addChild(this.selections)

    this.overlay = new SelectionOverlay({ width, height })
    this.addChild(this.overlay)
  }

  get isHorizontal() {
    return isHorizontal(deg(this.rotation))
  }

  get colors() {
    return this.bg.filters[0]
  }

  getWidth(scale = this.scale.y) {
    return this.WIDTH * scale
  }

  getHeight(scale = this.scale.y) {
    return this.HEIGHT * scale
  }

  getBounds(scale = this.scale.y) {
    const { x, y } = this
    const width = this.getWidth(scale)
    const height = this.getHeight(scale)

    return this.isHorizontal ?
      new Rectangle(x, y, width, height) :
      new Rectangle(x, y, height, width)
  }

  getInnerBounds(screen, scale = this.scale.y) {
    const { width, height } = this.getBounds(scale)

    const dx = Math.max(0, width - screen.width)
    const dy = Math.max(0, height - screen.height)

    return new Rectangle(
      (screen.width - dx) / 2, (screen.height - dy) / 2, dx, dy
    )
  }

  constrain(screen, scale) {
    constrain(this.position, this.getInnerBounds(screen, scale))
  }

  destroy() {
    super.destroy({ children: true })
  }
}

function constrain(position, within) {
  position.x = restrict(position.x, within.left, within.right)
  position.y = restrict(position.y, within.top, within.bottom)
  return position
}

module.exports = {
  Picture,
  constrain
}
