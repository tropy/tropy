import { Container, Graphics } from 'pixi.js'
import { ESPER } from '../constants/index.js'
import {
  centerOffset, covers, intersects, textBounds, union
} from './util.js'


export class TextLayer extends Container {
  clear () {
    for (let block of this.removeChildren()) {
      block.destroy()
    }
  }

  destroy () {
    super.destroy({ children: true })
  }

  sync (props, state) {
    let alto = state.text
    let offset = props.selection

    this.clear()

    if (alto) {
      this.visible = true

      // TODO rotation
      for (let block of alto.blocks()) {
        this.addChild(new TextBlock(block, offset))
      }
    } else {
      this.visible = false
    }
  }

  update (textSelection) {
    for (let child of this.children) {
      child.update(textSelection)
    }
  }

  select (rect, anchor) {
    let selection = new Map

    if (rect == null)
      return selection

    if (!rect.width && !rect.height) {
      let string = this.getStringAt(rect)

      if (string != null)
        selection.set(string, true)

      return selection
    }

    if (anchor != null) {
      let string = this.getStringAt(anchor)

      if (string != null)
        selection.set(string, true)
    }

    for (let line of this.lines(rect))
      for (let box of line.children) {
        if (box.data != null && covers(rect, box.data))
          selection.set(box.node, true)
      }

    return selection
  }

  // Returns the single string covering the given point.
  // With ALTO overlaps, we resolve the ambiguity along one axis at a time,
  // by horizontal position within each line,
  // then by vertical proximity between the candidate lines.
  getStringAt (point) {
    let string = null
    let min = Infinity

    for (let line of this.lines(point)) {
      let candidate = line.getStringAt(point)
      if (candidate == null)
        continue

      let dy = Math.abs(centerOffset(point, line.data).dy)

      if (dy < min) {
        min = dy
        string = candidate
      }
    }

    return string
  }

  *lines (rect) {
    for (let block of this.children) {
      if (block.data == null || !intersects(rect, block.data))
        continue

      for (let line of block.children) {
        if (line.data != null && intersects(rect, line.data))
          yield line
      }
    }
  }
}


export class TextBlock extends Container {
  constructor (node, offset) {
    super()
    this.sync(node, offset)
  }

  destroy () {
    this.node = null
    this.data = null
    super.destroy({ children: true })
  }

  sync (node, offset) {
    this.node = node
    this.data = null

    for (let line of node.lines()) {
      let child = new TextLine(line, offset)
      this.addChild(child)
      this.data = union(this.data, child.data)
    }
  }

  update (selection) {
    for (let child of this.children) {
      child.update(selection)
    }
  }
}


export class TextLine extends TextBlock {
  sync (node, offset) {
    this.node = node
    this.data = null

    for (let string of node.strings()) {
      let child = new TextBox(string, offset)
      this.addChild(child)
      this.data = union(this.data, child.data)
    }
  }

  // Returns the string covering the given point;
  // with ALTO overlaps, we pick the one the point lies deepest inside.
  getStringAt (point) {
    let string = null
    let min = Infinity

    for (let box of this.children) {
      if (box.data == null || !intersects(point, box.data))
        continue

      let { dx, dy } = centerOffset(point, box.data)
      let d = dx * dx + dy * dy

      if (d < min) {
        min = d
        string = box.node
      }
    }

    return string
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

    if (!selected || !this.data?.width || !this.data?.height)
      return

    let { x, y, width, height } = this.data

    this
      .rect(x, y, width, height)
      .fill()
  }
}
