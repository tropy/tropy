'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Graphics, Rectangle } = PIXI
const BLANK = Object.freeze({})
const { COLOR } = require('../../constants/esper')


class SelectionPool extends Container {
  constructor({ width, height }) {
    super()
    this.pivot.set(width / 2, height / 2)
    this.addChild(new Selection())
    this.interactive = true
    this.on('mousemove', this.handleMouseMove)
  }

  draw({ selection } = BLANK) {
    if (!this.children.length) return

    const scale = 1 / this.parent.scale.y
    let i = 0

    for (; i < this.children.length - 1; ++i) {
      this.children[i].draw(scale)
    }

    this.children[i].draw(scale, selection, 'live')
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

  update({ selections }) {
    for (let i = 0; i < selections.length; ++i) {
      if (i < this.children.length) {
        this.children[i].update(selections[i])
      } else {
        this.addChild(new Selection(selections[i]))
      }
    }

    if (this.children.length <= selections.length) {
      this.addChild(new Selection())
    } else {
      this.children[selections.length].update(BLANK)

      if (this.children.length > selections.length + 1) {
        for (let s of this.removeChildren(selections.length + 1)) {
          s.destroy()
        }
      }
    }
  }
}


class Selection extends Graphics {
  constructor(data = BLANK) {
    super()
    this.update(data)
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

  draw(
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

  update(data) {
    this.data = data

    if (this.isBlank) {
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


module.exports = {
  Selection,
  SelectionPool
}
