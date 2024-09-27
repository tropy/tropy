import { Container, Graphics, Rectangle } from 'pixi.js'
import { BLANK } from '../common/util.js'
import { ESPER } from '../constants/index.js'
import { normalizeRectangle } from './util.js'


export class TextLayer extends Container {

  constructor() {
    super()
    this.selection = new TextSelection()
    this.addChild(this.selection)
  }

  destroy() {
    super.destroy({ children: true })
  }

  sync(props) {
    // drop/create text objects
  }

  update(props) {
    for (let child of this.children) {
      child.update(props)
    }
  }
}

export class TextSelection extends Graphics {
  destroy() {
    super.destroy({ children: true })
  }

  update() {
    // if there's a text selection draw it. otherwise hide.
  }
}


export class TextBlock extends Container {
  destroy() {
    super.destroy({ children: true })
  }
}

export class TextLine extends Container {
  destroy() {
    super.destroy({ children: true })
  }
}

export class Word extends Graphics {
  destroy() {
    super.destroy({ children: true })
  }
}
