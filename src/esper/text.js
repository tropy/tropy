import { Container, Graphics } from 'pixi.js'

export class TextLayer extends Container {
  constructor() {
    super()
    this.visible = false
  }

  destroy() {
    super.destroy({ children: true })
  }

  sync(props) {
    // check if alto changed
    // re-create text blocks
  }

  udpate(dragState) {
    // update children: visible if under selected rectangle
  }
}

export class TextBlock extends Graphics {
  constructor() {
    super()
  }

  destroy() {
    super.destroy({ children: true })
  }

  sync() {
  }

  update() {
  }
}
