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

  isVisible(document, tool) {
    return document != null && (
      tool === ESPER.TOOL.ARROW || tool === ESPER.TOOL.PAN
    )
  }

  getEventModeFor(tool) {
    return tool === ESPER.TOOL.ARROW ? 'static' : 'none'
  }

  sync(props, state) {
    console.log('TextLayer#sync')

    let tool = state.quicktool || props.tool
    let document = state.text
    let offset = props.selection

    this.clear()

    this.visible = this.isVisible(document, tool)
    this.eventMode = this.getEventModeFor(tool)

    if (document) {
      for (let string of document.strings()) {
        this.addChild(new TextBox(string, offset))
      }
    }
  }

  update({ selection } = BLANK, textSelection) {
    if (selection)
      selection = normalizeRectangle(selection)

    for (let child of this.children) {
      child.update(textSelection)
    }
  }
}


export class TextBox extends Graphics {
  constructor(node, offset) {
    super({
      blendMode: 'multiply' // TODO doesn't work
    })
    this.setFillStyle(ESPER.COLOR.textLayer.fill)
    this.sync(node, offset)
  }

  destroy() {
    super.destroy(true)
  }

  sync(node, offset) {
    this.node = node
    this.data = normalizeRectangle(node.bounds())

    if (offset) {
      move(this.data, offset)
    }
  }

  update(selection) {
    this.clear()

    let { x, y, width, height } = this.data

    if (!width || !height || !selection?.get(this.node))
      return

    // hover
    // rotation

    this
      .rect(x, y, width, height)
      .fill()
  }
}
