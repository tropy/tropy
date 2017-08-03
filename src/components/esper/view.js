'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func } = require('prop-types')
const { append, bounds } = require('../../dom')
const { shallow } = require('../../common/util')
const { rad } = require('../../common/math')
const PIXI = require('pixi.js')
const { Sprite } = PIXI
const { TextureCache, skipHello } = PIXI.utils
const TWEEN = require('@tweenjs/tween.js')
const { Tween } = TWEEN
const { Cubic } = TWEEN.Easing


class EsperView extends PureComponent {
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
    if (!shallow(props, this.props)) {
      this.handlePropsChange(props)
    }
  }

  shouldComponentUpdate() {
    return false
  }

  handlePropsChange({ isVisible }) {
    this.pixi[isVisible ? 'start' : 'stop']()
  }

  get bounds() {
    return this.pixi.screen
  }

  reset(props) {
    this.fadeOut(this.image)
    this.image = null

    if (props.src != null) {
      this.image = new Sprite()
      this.image.anchor.set(0.5)

      this.center()
      this.rotate(props)
      this.scale(props)

      this.load(props.src, this.image)
      this.pixi.stage.addChildAt(this.image, 0)
    }
  }

  animate(thing, scope) {
    const tween = new Tween(thing, this.tweens)
      .easing(Cubic.InOut)

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

  center({ width, height } = this.bounds) {
    this.image.x = width / 2
    this.image.y = height / 2
  }


  resize({ width, height, zoom, mirror }) {
    this.pixi.renderer.resize(width, height)

    if (this.image != null) {
      this.image.x = width / 2
      this.image.y = height / 2
      this.image.scale.set(mirror ? -zoom : zoom, zoom)
    }
  }

  move({ x, y }, duration = 0) {
    if (duration > 0) {
      this.animate(this.image.position, 'move')
        .to({ x, y }, duration)

    } else {
      this.image.position.set(x, y)
    }
  }

  scale({ zoom, mirror }, duration = 0) {
    const x = mirror ? -zoom : zoom
    const y = zoom

    if (duration > 0) {
      this.animate(this.image.scale, 'zoom')
        .to({ x, y }, duration)
        .start()

    } else {
      this.image.scale.set(x, y)
    }
  }

  rotate({ angle }, duration = 0) {
    if (duration > 0) {
      const cur = this.image.rotation
      const tgt = rad(angle)

      // Always rotate counter-clockwise!
      const tmp = (tgt > cur) ? cur - (2 * Math.PI - tgt) : tgt

      this.animate(this.image, 'rotate')
        .to({ rotation: tmp }, duration)
        .onComplete(() => this.image.rotation = tgt)
        .start()

    } else {
      this.image.rotation = rad(angle)
    }
  }

  fadeOut(sprite, duration = 250) {
    if (sprite == null) return

    this.animate(sprite)
      .to({ alpha: 0 }, duration)
      .onStop(() => this.remove(sprite))
      .onComplete(() => this.remove(sprite))
      .start()
  }

  remove(sprite) {
    this.pixi.stage.removeChild(sprite)
  }

  load(url, sprite) {
    if (TextureCache[url]) {
      sprite.texture = TextureCache[url]

    } else {
      this.pixi.loader
        .reset()
        .add(url)
        .load(() => {
          sprite.texture = TextureCache[url]
        })
    }
  }

  update = () => {
    this.tweens.update(performance.now())
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
      <div ref={this.setContainer} className="esper-view"/>
    )
  }

  static propTypes = {
    isVisible: bool.isRequired,
    onLoadError: func
  }
}

module.exports = {
  EsperView
}
