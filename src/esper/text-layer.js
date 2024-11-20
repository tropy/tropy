import { Container, Graphics, Rectangle } from 'pixi.js'
import { BLANK } from '../common/util.js'
import { ESPER } from '../constants/index.js'
import { normalizeRectangle } from './util.js'


export class TextLayer extends Container {
  constructor() {
    super()
    this.liveSelection = new TextSelection()
    this.addChild(this.liveSelection)
  }

  clear() {
    if (this.children.length > 1) {
      for (let block of this.removeChildren(1)) {
        block.destroy()
      }
    }
  }

  destroy() {
    super.destroy({ children: true })
  }

  sync(props, state) {
    console.log('TextLayer#sync')

    // this.visible
    // this.eventMode

    let document = state.alto
    this.clear()

    if (document) {
      for (let string of document.strings()) {
        this.addChild(new TextBox(string))
      }
    }
  }

  update({ selection } = {}) {
    let scale = 1 / this.parent.scale.y

    if (selection)
      selection = normalizeRectangle(selection)

    for (let child of this.children) {
      child.update(scale, selection)
    }
  }
}

export class TextSelection extends Graphics {
  update(scale = 1, { x, y, width, height } = {}) {
    this.clear()

    if (!width || !height) return

    this
      .rect(x, y, width, height)
      .fill({ color: 0x000000, alpha: 0.5 })
      .stroke({ width: scale, color: 0xffffff, alpha: 1 })
  }
}


export class TextBox extends Graphics {
  fillStyle = { color: 0x000000, alpha: 0.125 }
  strokeStyle = ({ color: 0xffffff, alpha: 1 })

  constructor(node) {
    super()
    this.sync(node)
  }

  destroy() {
    super.destroy(true)
  }

  sync(node) {
    this.data = normalizeRectangle(node.bounds())

  }

  update(scale) {
    let { x, y, width, height } = this.data

    this.clear()
    if (!width || !height) return

    // hover
    // selected

    this
      .rect(x, y, width, height)
      .fill(this.fillStyle)
      .stroke({ width: scale, ...this.strokeStyle })
  }
}
