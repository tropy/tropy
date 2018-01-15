'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Sprite, Rectangle } = PIXI
const { SelectionLayer, SelectionOverlay } = require('./selection')
const { restrict } = require('../../common/util')
const { deg, isHorizontal } = require('../../common/math')


class Picture extends Container {
  constructor(props) {
    super()

    this.WIDTH = props.width
    this.HEIGHT = props.height

    this.bg = new Sprite()
    this.bg.anchor.set(0.5)
    this.addChild(this.bg)

    this.selections = new SelectionLayer(props)
    this.addChild(this.selections)

    this.overlay = new SelectionOverlay(props)
    this.addChild(this.overlay)
  }

  get isHorizontal() {
    return isHorizontal(deg(this.rotation))
  }

  getWidth(scale) {
    return (scale == null) ? this.bg.width : this.WIDTH * scale
  }

  getHeight(scale) {
    return (scale == null) ? this.bg.height : this.HEIGHT * scale
  }

  getBounds(scale) {
    const { x, y } = this
    const width = this.getWidth(scale)
    const height = this.getHeight(scale)

    return this.isHorizontal ?
      new Rectangle(x, y, width, height) :
      new Rectangle(x, y, height, width)
  }

  getInnerBounds(screen, scale) {
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
