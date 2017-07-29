'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, string } = require('prop-types')
const { append, bounds, on, off } = require('../../dom')
const PIXI = require('pixi.js')
const { Sprite } = PIXI
const { TextureCache, skipHello } = PIXI.utils


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
  }

  scale(width = this.pixi.view.width) {
    return this.props.width > 0 ? (width / this.props.width) : 1
  }

  update = () => {
    if (this.image != null) {
      this.image.anchor.x = 0.5
      this.image.anchor.y = 0.5
      this.image.x = this.pixi.view.width / 2
      this.image.y = this.pixi.view.height / 2
      this.image.scale.x = this.scale()
      this.image.scale.y = this.image.scale.x

      //this.image.rotation = (props.angle / 180) * Math.PI
    }
  }


  get isLoading() {
    return this.pixi.loader.loading
  }


  setContainer = (container) => {
    this.container = container
  }

  handleLoadProgress = (loader, resource) => {
    console.log(`loading ${resource.url}... ${loader.progress}`)
  }

  handleLoadError = (loader, resource) => {
    console.log('failed to load ', resource.url)
    if (this.props.onLoadError) {
      this.props.onLoadError()
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
