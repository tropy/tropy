import { Container, Graphics } from 'pixi.js'
import { ESPER } from '../constants/index.js'
import { textBounds } from './util.js'


export class TextLayer extends Container {
  clear () {
    if (this.children.length)
      for (let block of this.removeChildren()) {
        block.destroy()
      }
  }

  destroy () {
    super.destroy({ children: true })
  }

  isVisible (document) {
    return document != null
  }

  sync (props, state) {
    let document = state.text
    let offset = props.selection

    this.clear()
    this.visible = this.isVisible(document)

    if (document) {
      // TODO rotation
      for (let string of document.strings()) {
        this.addChild(new TextBox(string, offset))
      }
    }
  }

  update (dragState, textSelection) {
    for (let child of this.children) {
      child.update(textSelection)
    }
  }
}


export class TextBox extends Graphics {
  constructor (node, offset) {
    super({
      blendMode: 'multiply' // TODO doesn't work
    })
    this.setFillStyle(ESPER.COLOR.textLayer.fill)
    this.sync(node, offset)
  }

  destroy () {
    this.node = null
    this.data = null
    super.destroy(true)
  }

  sync (node, offset) {
    this.node = node
    this.data = textBounds(node, offset)
  }

  update (selection) {
    let selected = !!selection?.get(this.node)
    if (selected === this.selected)
      return

    this.selected = selected
    this.clear()

    if (!selected || this.data == null)
      return

    let { x, y, width, height } = this.data

    if (!width || !height)
      return

    this
      .rect(x, y, width, height)
      .fill()
  }
}
