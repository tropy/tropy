'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func } = require('prop-types')
const { append, bounds } = require('../../dom')
const { shallow } = require('../../common/util')
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

  reset(props) {
    this.fadeOut(this.image)
    this.image = null

    if (props.src != null) {
      const { width, height } = this.bounds

      this.image = new Sprite()
      this.image.anchor.set(0.5)
      this.image.position.set(width / 2, height / 2)
      this.image.rotation = rad(props.angle)
      this.image.scale.set(
        props.mirror ? -props.zoom : props.zoom,
        props.zoom)

      this.load(props.src, this.image)
      this.pixi.stage.addChildAt(this.image, 0)
    }
  }

  animate(thing, scope) {
    const tween = new Tween(thing, this.tweens)

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

  resize({ width, height, zoom, mirror }) {
    this.pixi.renderer.resize(width, height)

    if (this.image != null) {
      this.image.x = width / 2
      this.image.y = height / 2
      this.image.scale.set(mirror ? -zoom : zoom, zoom)
    }
  }

  scale({ zoom, mirror }, duration = 0) {
    const x = mirror ? -zoom : zoom
    const y = zoom

    if (duration > 0) {
      this.animate(this.image.scale, 'zoom')
        .to({ x, y }, duration)
        .easing(Cubic.InOut)
        .start()

    } else {
      this.image.scale.set(x, y)
    }
  }

  rotate({ angle }, duration = 0) {
    if (duration > 0) {
      // TODO
      this.image.rotation = rad(angle)
    } else {
      this.image.rotation = rad(angle)
    }
  }

  update = () => {
    this.tweens.update(performance.now())
  }

  get isLoading() {
    return this.pixi.loader.loading
  }

  get bounds() {
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
      <div ref={this.setContainer} className="esper-view"/>
    )
  }

  static propTypes = {
    isVisible: bool.isRequired,
    onLoadError: func
  }
}

function rad(deg) {
  return (deg / 180) * Math.PI
}

module.exports = {
  EsperView
}
