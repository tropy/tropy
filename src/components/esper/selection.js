'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Graphics, Rectangle } = PIXI
const BLANK = Object.freeze({})
const { COLOR, TOOL } = require('../../constants/esper')


class SelectionPool extends Container {
  constructor(props) {
    super()
    this.pivot.set(props.width / 2, props.height / 2)
    this.on('mousemove', this.handleMouseMove)
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

  get state() {
    if (this.isActive) return 'active'
    return 'default'
  }

  destroy() {
    this.data = null
    super.destroy({ children: true })
  }

  update(
    scale = 1,
    { x, y, width, height } = this.data,
    state = this.state
  ) {
    this.clear()
    if (!width || !height) return

    const colors = COLOR.selection[state]

    this.lineStyle(scale, ...colors.line)
    this.beginFill(...colors.fill)
    this.drawRect(x, y, width, height)
    this.endFill()
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


class SelectionMask extends Graphics {
  constructor() {
    super()
    this.cacheAsBitmap = true
  }

  update() {
    this.clear()

    if (this.parent == null || this.data == null) return
    const { width, height } = this.parent.texture.orig

    this.pivot.set(width / 2, height / 2)
    this.beginFill(0x000000, 0.2)
    this.drawRect(0, 0, width, height)
    this.endFill()
  }


  sync({ selection }) {
    this.data = selection
    this.visible = (selection != null)
    this.update()
  }
}


module.exports = {
  Selection,
  SelectionMask,
  SelectionPool
}
