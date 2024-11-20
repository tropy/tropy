import { AlphaFilter, Container, Graphics, Rectangle } from 'pixi.js'
import { BLANK } from '../common/util.js'
import { ESPER } from '../constants/index.js'
import { normalizeRectangle } from './util.js'


export class TextLayer extends Container {
  constructor() {
    super()
    this.filters = [new AlphaFilter({
      alpha: ESPER.COLOR.textLayer.fill.alpha,
      blendMode: 'multiply'
    })]
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
    this.sync(node, selection)
  }

  destroy() {
    super.destroy(true)
  }

  sync(node, offset) {
    this.data = normalizeRectangle(node.bounds())

    if (offset) {
      this.data.x += offset.x
      this.data.y += offset.y
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
      .fill(ESPER.COLOR.textLayer.fill.color)
  }
}
