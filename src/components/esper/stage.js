'use strict'

const React = require('react')
const PIXI = require('pixi.js')
const { PureComponent } = React
const { bool, number, string } = require('prop-types')
const { append, bounds, on, off } = require('../../dom')


class EsperStage extends PureComponent {
  componentDidMount() {
    const { width, height } = this.bounds

    this.pixi = new PIXI.Application({
      transparent: true,
      width,
      height
    })

    this.pixi.renderer.autoResize = true

    this.image = new PIXI.Sprite()
    this.pixi.stage.addChild(this.image)

    append(this.pixi.view, this.container)

    on(window, 'resize', this.handleResize)
  }

  componentWillUnmount() {
    off(window, 'resize', this.handleResize)
    this.pixi.destroy(true)
  }

  componentWillReceiveProps(props) {
    if (props !== this.props) this.update(props)
  }

  shouldComponentUpdate() {
    return false
  }

  setContainer = (container) => {
    this.container = container
  }

  handleResize = () => {
    const { width, height } = this.bounds

    this.pixi.renderer.resize(width, height)

    this.image.scale.x = this.scale(width)
    this.image.scale.y = this.image.scale.x

    this.image.x = 0
    this.image.y = this.offset(height)
  }

  get bounds() {
    return bounds(this.container)
  }

  scale(width = this.pixi.view.width) {
    return this.props.width > 0 ? (width / this.props.width) : 1
  }

  offset(height = this.pixi.view.height) {
    return this.props.height > 0 ?
      (height - (this.props.height * this.image.scale.y)) / 2 :
      0
  }

  reset(src) {
    if (src != null) {
      this.image.texture = PIXI.Texture.fromImage(src)
      this.image.visible = true
      this.image.scale.x = this.scale()
      this.image.scale.y = this.image.scale.x
      this.image.x = 0
      this.image.y = this.offset()
    } else {
      this.image.visible = false
    }
  }

  update(props) {
    if (props.src !== this.props.src) {
      this.reset(props.src)
    }

    this.pixi[props.isVisible ? 'start' : 'stop']()
  }

  render() {
    return (
      <div ref={this.setContainer} className="esper-stage"/>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    isVisible: bool.isRequired,
    src: string,
    width: number.isRequired,
    height: number.isRequired
  }
}

module.exports = {
  EsperStage
}
