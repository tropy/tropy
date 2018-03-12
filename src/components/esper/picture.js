'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Sprite, Rectangle } = PIXI
const { ColorMatrixFilter } = PIXI.filters
const { AdjustmentFilter } = require('@pixi/filter-adjustment')
const { SelectionLayer, SelectionOverlay } = require('./selection')
const { restrict } = require('../../common/util')
const { deg, isHorizontal } = require('../../common/math')

const NEGATIVE = [
  -1, 0, 0, 1, 0, 0, -1,  0, 1, 0, 0, 0, -1, 1, 0, 0, 0,  0, 1, 0
]


class Picture extends Container {
  constructor({ width, height }) {
    super()

    this.WIDTH = width
    this.HEIGHT = height

    this.pivot.set(width / 2, height / 2)

    this.bg = new Sprite()
    this.addChild(this.bg)

    this.bg.filters = [
      new AdjustmentFilter(),
      new ColorMatrixFilter()
    ]


    this.selections = new SelectionLayer()
    this.addChild(this.selections)

    this.overlay = new SelectionOverlay({ width, height })
    this.addChild(this.overlay)
  }

  get isHorizontal() {
    return isHorizontal(deg(this.rotation))
  }

  get adjust() {
    return this.bg.filters[0]
  }

  get colors() {
    return this.bg.filters[1]
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

  brightness(value = 0) {
    if (value >= 0) {
      this.adjust.brightness = 1 + value / 100
      this.adjust.gamma = 1
    } else {
      this.adjust.brightness = 1
      this.adjust.gamma = 1 + value / 100
    }

    return this
  }

  contrast(value = 0) {
    this.adjust.contrast = 1 + value / 100
    return this
  }

  constrain(screen, scale) {
    constrain(this.position, this.getInnerBounds(screen, scale))
  }

  destroy() {
    super.destroy({ children: true })
  }

  hue(value = 0) {
    this.colors.hue((360 + value) % 360, false)
    return this
  }

  // Subtle: apply after hue, if you need both!
  negative(negative = false) {
    if (negative) {
      // this.colors.negative()
      this.colors.matrix =
        this.colors._multiply([], this.colors.matrix, NEGATIVE)
    }

    return this
  }

  saturation(value = 0) {
    this.adjust.saturation = 1 + value / 100
    return this
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
