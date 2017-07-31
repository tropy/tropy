'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, string } = require('prop-types')
const { append, bounds } = require('../../dom')
const PIXI = require('pixi.js')
const { Sprite } = PIXI
const { TextureCache, skipHello } = PIXI.utils
const { PI, abs, min } = Math
const TWEEN = require('@tweenjs/tween.js')
const { Tween } = TWEEN
const { Cubic } = TWEEN.Easing


class EsperStage extends PureComponent {
  componentDidMount() {
    const { width, height } = bounds(this.container)

    this.tweens = new TWEEN.Group()

    skipHello()

    this.pixi = new PIXI.Application({
      antialias: true,
      resolution: window.devicePixelRatio,
      transparent: true,
      width,
      height
    })

    this.pixi.loader.onError.add(this.handleLoadError)
    this.pixi.loader.onLoad.add(this.handleLoadProgress)
    this.pixi.ticker.add(this.update)
    this.pixi.renderer.autoResize = true

    append(this.pixi.view, this.container)

    this.handlePropsChange(this.props)
  }

  componentWillUnmount() {
    this.tweens.removeAll()
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

    this.rotate(props)

    if (props.isVisible) {
      this.pixi.start()
    } else {
      this.pixi.stop()
    }
  }

  reset(props = this.props) {
    this.fadeOut(this.image)
    this.image = null

    if (props.src != null) {
      this.image = new Sprite()
      this.image.anchor.set(0.5)
      this.image.x = this.screen.width / 2
      this.image.y = this.screen.height / 2
      this.image.scale.set(props.zoom)

      this.load(props.src, this.image)
      this.pixi.stage.addChildAt(this.image, 0)
    }
  }

  animate(something, scope) {
    const tween = new Tween(something, this.tweens)

    if (scope != null) {
      tween
        .onStart(() => {
          const current = this.tweens[scope]
          if (current) current.stop()

          this.tweens[scope] = tween
        })

        .onComplete(() => this.tweens[scope] = null)
    }

    return tween

  }

  fadeOut(sprite) {
    if (sprite == null) return

    const remove = () => { this.pixi.stage.removeChild(sprite) }

    this.animate(sprite)
      .to({ alpha: 0 }, 250)
      .easing(Cubic.InOut)
      .onStop(remove)
      .onComplete(remove)
      .start()
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

  resize({ width, height, zoom }) {
    this.pixi.renderer.resize(width, height)

    if (this.image != null) {
      this.image.x = width / 2
      this.image.y = height / 2
      this.image.scale.set(zoom)
    }
  }

  zoom(zoom) {
    if (this.image == null) return

    this.animate(this.image.scale, 'zoom')
      .to({ x: zoom, y: zoom }, 200)
      .easing(Cubic.InOut)
      .start()
  }

  rotate(props = this.props.angle) {
    return this.rotation = (props.angle / 180) * PI
  }

  update = (delta) => {
    this.tweens.update(performance.now())

    if (this.isDirty()) {
      const { image, rotation } = this

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
    const { image, rotation } = this

    if (image == null) return false
    if (image.rotation !== rotation) return true

    return false
  }

  get isLoading() {
    return this.pixi.loader.loading
  }

  get screen() {
    return this.pixi.screen
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
