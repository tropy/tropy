import { Container, Graphics } from 'pixi.js'
import { BLANK } from '../common/util.js'
import { ESPER } from '../constants/index.js'
import { move, normalizeRectangle } from './util.js'


export class TextLayer extends Container {
  constructor() {
    super()
  }

  clear() {
    if (this.children.length)
      for (let block of this.removeChildren()) {
        block.destroy()
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
        this.addChild(new TextBox(string, props.selection))
      }
    }
  }

  update({ selection } = BLANK) {
    let scale = 1 / this.parent.scale.y

    if (selection)
      selection = normalizeRectangle(selection)

    for (let child of this.children) {
      child.update(scale, selection)
    }
  }
}


export class TextBox extends Graphics {
  constructor(node, selection) {
    super()
    this.blendMode = 'color'
    this.setFillStyle(ESPER.COLOR.textLayer.fill)
    this.sync(node, selection)
  }

  destroy() {
    super.destroy(true)
  }

  sync(node, offset) {
    this.data = normalizeRectangle(node.bounds())

    if (offset) {
      move(this.data, offset)
    }
  }

  update() {
    let { x, y, width, height } = this.data

    this.clear()
    if (!width || !height) return

    // hover
    // selected

    this
      .rect(x, y, width, height)
      .fill()
  }
}
