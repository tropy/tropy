'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Graphics, Rectangle } = PIXI
const BLANK = Object.freeze({})


class SelectionPool extends Container {
  constructor({ width, height }) {
    super()
    this.pivot.set(width / 2, height / 2)
    this.addChild(new Selection())
  }

  draw({ selection } = BLANK) {
    if (!this.children.length) return

    const scale = 1 / this.parent.scale.y
    let i = 0

    for (; i < this.children.length - 1; ++i) {
      this.children[i].draw(scale)
    }

    this.children[i].draw(scale, selection, true)
  }

  destroy() {
    super.destroy({ children: true })
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
  constructor(state = BLANK) {
    super()
    this.update(state)

    this.on('mouseover', this.handleMouseOver)
    this.on('mouseout', this.handleMouseOut)
  }

  get isBlank() {
    return this.state === BLANK
  }

  destroy() {
    this.state = null
    super.destroy({ children: true })
  }

  draw(
    scale = 1,
    { x, y, width, height } = this.state,
    isActive = this.isActive
  ) {
    this.clear()
    if (!width || !height) return

    this.lineStyle(scale, 0x5c93e5, 1)
    this.beginFill(0xcedef7, isActive ? 0.8 : 0.4)
    this.drawRect(x, y, width, height)
    this.endFill()
  }

  update(state) {
    this.state = state

    if (this.isBlank) {
      this.interactive = false
      this.hitArea = null
    } else {
      this.interactive = true
      this.hitArea = new Rectangle(
        state.x, state.y, state.width, state.height
      )
    }
  }

  handleMouseOver = (event) => {
    event.stopPropagation()
    this.isActive = true
  }

  handleMouseOut = (event) => {
    event.stopPropagation()
    this.isActive = false
  }
}


module.exports = {
  Selection,
  SelectionPool
}
