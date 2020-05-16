'use strict'

const PIXI = require('pixi.js')
const { Container, Sprite, Rectangle } = PIXI
const { ColorMatrixFilter } = PIXI.filters
const { AdjustmentFilter } = require('@pixi/filter-adjustment')
const { SharpenFilter } = require('./filter')
const { SelectionLayer, SelectionOverlay } = require('./selection')
const { constrain } = require('./util')
const { deg, isHorizontal } = require('../common/math')
const { TOOL } = require('../constants/esper')

const NEGATIVE = [
  -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, -1, 1, 0, 0, 0, 0, 1, 0
]


class Photo extends Container {
  #width
  #height
  #pivot
  #tool = TOOL.ARROW

  constructor({ width, height }) {
    super()

    this.#width = width
    this.#height = height

    this.pivot.set(width / 2, height / 2)

    this.bg = new Sprite()
    this.addChild(this.bg)

    this.bg.filters = [
      new AdjustmentFilter(),
      new SharpenFilter(0, width, height),
      new ColorMatrixFilter()
    ]

    this.handleResolutionChange()

    this.selections = new SelectionLayer()
    this.addChild(this.selections)

    this.overlay = new SelectionOverlay({ width, height })
    this.addChild(this.overlay)
  }

  get adjust() {
    return this.bg.filters[0]
  }

  get angle() {
    return deg(this.rotation)
  }

  get colors() {
    return this.bg.filters[2]
  }

  get mirror() {
    return this.scale.x < 0
  }

  get tool() {
    return this.#tool
  }

  set tool(tool) {
    this.#tool = tool
    this.cursor = tool
  }

  getWidth(zoom = this.scale.y) {
    return this.#width * zoom
  }

  getHeight(zoom = this.scale.y) {
    return this.#height * zoom
  }

  getBoundsProjection({
    zoom = this.scale.y,
    rotation = this.rotation
  } = {}) {
    let width = this.getWidth(zoom)
    let height = this.getHeight(zoom)

    return isHorizontal(deg(rotation)) ?
      new Rectangle(0, 0, width, height) :
      new Rectangle(0, 0, height, width)
  }

  getPanLimits(screen, ...args) {
    let { width, height } = this.getBoundsProjection(...args)

    let dx = Math.max(0, width - screen.width)
    let dy = Math.max(0, height - screen.height)

    return new Rectangle(
      (screen.width - dx) / 2, (screen.height - dy) / 2, dx, dy
    )
  }

  // Mirror the image across the x-axis without changing position
  flip(at, skipUpdate = true) {
    let origin = this.toLocal(at, null, null, skipUpdate)

    if (!isHorizontal(deg(this.rotation)))
      this.rotation += Math.PI

    this.scale.x = -this.scale.x
    this.position.x += at.x - this.toGlobal(origin, null, false).x

    if (!skipUpdate && this.parent)
      this.displayObjectUpdateTransform()
  }

  // Changes pivot without changing position. For temporary pivot
  // changes, release is expected to be called as soon as possible.
  // If multiple fixate() calls come in, the original pivot is the
  // one that will be restored on released!
  fixate(at, isReleasePending = true, skipUpdate = true) {
    if (isReleasePending && this.#pivot == null) {
      this.#pivot = this.pivot.clone()
    }

    this.toLocal(at, null, this.pivot, skipUpdate)
    this.position.copyFrom(at)
  }

  // Restores previous pivot without changing position
  release(skipUpdate = true) {
    if (this.#pivot == null) return

    this.toGlobal(this.#pivot, this.position, skipUpdate)
    this.pivot.copyFrom(this.#pivot)

    this.#pivot = null
  }

  handleResolutionChange(dppx = devicePixelRatio) {
    for (let filter of this.bg.filters) {
      filter.resolution = dppx
    }
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

  constrain(...args) {
    constrain(this.position, this.getPanLimits(...args))
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

  sharpen(intensity = 0) {
    this.bg.filters[1].intensity = intensity
    return this
  }

  sync(props, state) {
    let image = props.selection || props.photo
    this.#width = image.width
    this.#height = image.height

    this.selections.sync(props, state)
    this.overlay.sync(props, state)
    this.tool = state.quicktool || props.tool
  }

  update(dragState) {
    if (this.selections.visible) {
      this.selections.update(dragState)
    }

    if (this.overlay.visible) {
      this.overlay.update()
    }
  }
}


module.exports = {
  Photo
}
