import { Container, Graphics } from 'pixi.js'
import { ESPER } from '../constants/index.js'
import { centerOffset, intersects, textBounds, union } from './util.js'


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

  sync (props, state) {
    let alto = state.text
    let offset = props.selection

    this.clear()

    if (alto) {
      this.visible = true

      // TODO rotation
      for (let block of alto.blocks()) {
        this.addChild(new TextGroup(
          Array.from(block.lines(), (line) => new TextGroup(
            Array.from(line.strings(), (string) => new TextBox(string, offset))
          ))
        ))
      }
    } else {
      this.visible = false
    }
  }

  update (dragState, textSelection) {
    for (let child of this.children) {
      child.update(textSelection)
    }
  }

  select (rect) {
    let selection = new Map

    if (rect == null)
      return selection

    if (!rect.width && !rect.height) {
      let string = this.getStringAt(rect)

      if (string != null)
        selection.set(string, true)

      return selection
    }

    for (let line of this.lines(rect))
      for (let box of line.children) {
        if (box.data != null && intersects(rect, box.data))
          selection.set(box.node, true)
      }

    return selection
  }

  // Returns the single string covering the given point.
  // Where several do, the boxes in the ALTO overlap:
  // we resolve the ambiguity along one axis at a time,
  // by horizontal position within each line,
  // then by vertical proximity between the candidate lines.
  getStringAt (point) {
    let string = null
    let min = Infinity

    for (let line of this.lines(point)) {
      // Subtle: pick the best string of each line
      // before comparing lines,
      // or a line covering the point without any of its
      // strings covering it would shadow the line below!
      let candidate = getString(line, point)

      if (candidate == null)
        continue

      let { dy } = centerOffset(point, line.data)
      dy = Math.abs(dy)

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

const getString = (line, point) => {
  let string = null
  let min = Infinity

  for (let box of line.children) {
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


// A block or line of text; groups its children and covers them.
export class TextGroup extends Container {
  constructor (children) {
    super()

    for (let child of children)
      this.addChild(child)

    this.data = children.reduce((bounds, child) =>
      union(bounds, child.data), null)
  }

  destroy () {
    this.data = null
    super.destroy({ children: true })
  }

  update (selection) {
    for (let child of this.children) {
      child.update(selection)
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
