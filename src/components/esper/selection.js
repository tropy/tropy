'use strict'

const PIXI = require('pixi.js')
const { Container, Graphics, Rectangle } = PIXI
const BLANK = Object.freeze({})
const { COLOR, TOOL } = require('../../constants/esper')


class SelectionLayer extends Container {
  constructor() {
    super()
    this.on('mousemove', this.handleMouseMove)
    this.visible = false
  }

  update({ selection } = BLANK) {
    if (!this.children.length) return

    const scale = 1 / this.parent.scale.y
    let i = 0

    for (; i < this.children.length - 1; ++i) {
      this.children[i].update(scale)
    }

    this.children[i].update(scale, selection, 'live')
  }

  destroy() {
    super.destroy({ children: true })
  }

  handleMouseMove(event) {
    const { target } = event

    if (target instanceof Selection) {
      event.stopPropagation()
      this.active = target

    } else {
      this.active = null
    }
  }

  isVisible({ selection, tool }) {
    return selection == null && (
      tool === TOOL.ARROW || tool === TOOL.SELECT
    )
  }

  isInteractive({ tool }) {
    return tool === TOOL.ARROW
  }

  sync(props) {
    this.visible = this.isVisible(props)
    this.interactive = this.isInteractive(props)

    const { selections } = props

    for (let i = 0; i < selections.length; ++i) {
      if (i >= this.children.length) {
        this.addChild(new Selection())
      }

      this.children[i].sync(selections[i])
    }

    if (this.children.length <= selections.length) {
      this.addChild(new Selection())
    }

    this.children[selections.length].sync(BLANK)

    if (this.children.length > selections.length + 1) {
      for (let s of this.removeChildren(selections.length + 1)) {
        s.destroy()
      }
    }
  }
}


class Selection extends Graphics {
  constructor() {
    super()
    this.data = BLANK
  }

  get isBlank() {
    return this.data === BLANK
  }

  get isActive() {
    return this === this.parent.active
  }

  destroy() {
    this.data = null
    super.destroy({ children: true })
  }

  update(
    scale = 1,
    { x, y, width, height } = this.data,
    state = this.isActive ? 'active' : 'default'
  ) {
    this.clear()
    if (!width || !height) return

    let colors = COLOR.selection[state]

    this
      .lineStyle(scale, ...colors.line)
      .beginFill(...colors.fill)
      .drawRect(x, y, width, height)
  }

  sync(data = BLANK) {
    this.data = data

    if (this.isBlank || !this.parent.interactive) {
      this.interactive = false
      this.hitArea = null
    } else {
      this.interactive = true
      this.hitArea = new Rectangle(
        data.x, data.y, data.width, data.height
      )
    }
  }
}


class SelectionOverlay extends Graphics {
  constructor({ width, height }) {
    super()

    this.beginFill('0xffffff', 0)
    this.drawRect(0, 0, width, height)

    this.cacheAsBitmap = false
    this.visible = false

    this.addChild(new Graphics(), new Graphics())
  }

  update() {
    this.children[1].clear()
    this.children[0].clear()

    if (this.active == null || this.parent == null) return

    let scale = 1 / this.parent.scale.y
    let { x, y, width, height } = this.active

    this.children[1]
      .lineStyle(scale, ...COLOR.mask.line)
      .beginFill(0, 0)
      .drawRect(x, y, width, height)

    this.children[0]
      .beginFill(...COLOR.mask.fill)
      .drawRect(0, 0, this.width, this.height)
      .beginHole()
      .drawRect(x, y, width, height)
      .endHole()
  }


  sync({ selection }) {
    this.active = selection
    this.children[0].clear()
    this.visible = (selection != null)
  }
}


module.exports = {
  Selection,
  SelectionLayer,
  SelectionOverlay
}
