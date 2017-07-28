'use strict'

const React = require('react')
const PIXI = require('pixi.js')
const { PureComponent } = React
const { bool, string } = require('prop-types')
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
  }

  get bounds() {
    return bounds(this.container)
  }

  reset(src) {
    const size = this.pixi.stage.children.length

    if (src != null) {
      this.pixi.stage.addChild(PIXI.Sprite.fromImage(src))
    }

    if (size > 0) {
      this.pixi.stage.removeChildren(0, size)
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
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    isVisible: bool.isRequired,
    src: string
  }
}

module.exports = {
  EsperStage
}
