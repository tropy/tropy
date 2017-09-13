'use strict'

const PIXI = require('pixi.js/dist/pixi.js')
const { Container, Graphics } = PIXI
const BLANK = {}

class SelectionPool extends Container {
  constructor(view) {
    super()
    this.view = view
    this.update()

    this.addChild(new Selection())
  }

  draw(live = BLANK) {
    const scale = 1 / this.parent.scale.y
    this.children[0].draw(scale, live.selection)
  }

  destroy() {
    this.view = null
    super.destroy({ children: true })
  }

  update(props = this.view.props) {
    this.selections = props.selections
  }
}

class Selection extends Graphics {
  constructor(state = {}) {
    super()
    this.update(state)
  }

  destroy() {
    this.state = null
    super.destroy({ children: true })
  }

  draw(scale = 1, { x, y, width, height } = this.state, isActive = false) {
    this.clear()
    if (!width || !height) return

    this.lineStyle(scale, 0x5c93e5, 1)
    this.beginFill(0xcedef7, isActive ? 0.8 : 0.4)
    this.drawRect(x, y, width, height)
    this.endFill()
  }

  update(state) {
    this.state = state
  }

}


module.exports = {
  Selection,
  SelectionPool
}
