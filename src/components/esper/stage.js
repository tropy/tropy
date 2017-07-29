'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, string } = require('prop-types')
const { append, bounds, on, off } = require('../../dom')
const PIXI = require('pixi.js')
const { Sprite } = PIXI
const { TextureCache, skipHello } = PIXI.utils
const { PI, abs, min } = Math


class EsperStage extends PureComponent {
  componentDidMount() {
    const { width, height } = bounds(this.container)

    skipHello()

    this.pixi = new PIXI.Application({
      transparent: true,
      width,
      height
    })

    this.pixi.loader.onError.add(this.handleLoadError)
    this.pixi.loader.onLoad.add(this.handleLoadProgress)
    this.pixi.ticker.add(this.update)
    this.pixi.renderer.autoResize = true

    append(this.pixi.view, this.container)

    on(window, 'resize', this.resize)
    this.handlePropsChange(this.props)
  }

  componentWillUnmount() {
    off(window, 'resize', this.resize)
    this.pixi.destroy(true)
  }

  componentWillReceiveProps(props) {
    if (props !== this.props) {
      this.handlePropsChange(props)
    }
  }

  shouldComponentUpdate() {
    return false
  }

  handlePropsChange(props, reset = false) {
    if (reset || this.props.src !== props.src) {
      this.reset(props)
    }

    this.zoom(props)
    this.rotate(props)

    if (props.isVisible) {
      this.pixi.start()
    } else {
      this.pixi.stop()
    }
  }

  reset(props = this.props) {
    const oldImage = this.image
    this.image = null

    if (props.src != null) {
      this.image = new Sprite()
      this.image.anchor.set(0.5)

      this.load(props.src, this.image)
      this.pixi.stage.addChildAt(this.image, 0)
    }

    if (oldImage != null) {
      this.pixi.stage.removeChild(oldImage)
    }

  }

  load(url, sprite) {
    if (TextureCache[url]) {
      sprite.texture = TextureCache[url]
    } else {
      this.pixi.loader.reset().add(url).load(() => {
        sprite.texture = this.pixi.loader.resources[url].texture
      })
    }
  }

  resize = () => {
    const { width, height } = bounds(this.container)
    this.pixi.renderer.resize(width, height)
    this.zoom()
  }

  zoom(props = this.props) {
    if (props.scale != null) {
      return this.scale = props.scale
    }

    if (props.width === 0) {
      return this.scale = 1
    }

    return this.scale = this.pixi.screen.width / props.width
  }

  rotate(props = this.props.angle) {
    return this.rotation = (props.angle / 180) * PI
  }

  update = (delta) => {
    if (this.isDirty()) {
      const { image, rotation, scale } = this

      image.x = this.pixi.screen.width / 2
      image.y = this.pixi.screen.height / 2

      image.scale.set(scale)


      const diff = abs(image.rotation - rotation)

      if (diff < 0.25) {
        image.rotation = rotation
      } else {
        const step = min(diff, 0.25 * delta)

        let next = image.rotation - step
        if (next < 0) next = (2 * PI) - next

        image.rotation = next
      }
    }
  }


  isDirty() {
    const { image, scale, rotation } = this

    if (image == null) return false
    if (image.scale.x !== scale) return true
    if (image.rotation !== rotation) return true

    return false
  }

  get isLoading() {
    return this.pixi.loader.loading
  }


  setContainer = (container) => {
    this.container = container
  }

  handleLoadProgress = () => {
  }

  handleLoadError = (loader, resource) => {
    if (this.props.onLoadError) {
      this.props.onLoadError(resource.url)
    }
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
    angle: number.isRequired,
    width: number.isRequired,
    height: number.isRequired,
    onLoadError: func
  }
}

module.exports = {
  EsperStage
}
