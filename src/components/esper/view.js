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

      this.makeInteractive(this.image)

      this.load(props.src, this.image)
      this.pixi.stage.addChildAt(this.image, 0)
    }
  }


  makeInteractive(sprite) {
    if (sprite == null || sprite.interactive) return

    sprite.interactive = true
    sprite.cursor = 'grab'

    sprite
      .on('pointerdown', handleDragStart)
      .on('pointerup', handleDragStop)
      .on('pointerupoutside', handleDragStop)
      .on('pointermove', handleDragMove)
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
    this.animate(this.image.position, 'move')
      .to({ x, y }, duration)
      .start()
  }

  scale({ mirror, x, y, zoom }, duration = 0) {
    const { scale, position } = this.image

    const zx = mirror ? -1 : 1
    const dz = zoom / scale.y

    x = x == null ? position.x : x
    y = y == null ? position.y : y

    const dx = (x - position.x)
    const dy = (y - position.y)

    this.animate({ x: position.x, y: position.y, zoom: scale.y }, 'zoom')
      .to({
        x: position.x + dx - dx * dz,
        y: position.y + dy - dy * dz,
        zoom
      }, duration)
      .onUpdate(m => {
        this.image.scale.x = m.zoom * zx
        this.image.scale.y = m.zoom
        this.image.x = m.x
        this.image.y = m.y
      })
      .start()
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
      .onStop(() => sprite.destroy())
      .onComplete(() => sprite.destroy())
      .start()
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

  handleWheel = (e) => {
    e.stopPropagation()

    this.props.onWheel({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
      dx: e.nativeEvent.deltaX,
      dy: e.nativeEvent.deltaY,
    })
  }

  render() {
    return (
      <div
        ref={this.setContainer}
        className="esper-view"
        onWheel={this.handleWheel}/>
    )
  }

  static propTypes = {
    isVisible: bool.isRequired,
    onLoadError: func,
    onWheel: func.isRequired
  }
}

function handleDragStart(event) {
  if (event.data.isPrimary) {
    event.stopPropagation()

    this.origin = {
      pos: { x: this.x, y: this.y },
      mov: event.data.getLocalPosition(this.parent)
    }

    this.data = event.data
    this.isDragging = true

  } else {
    handleDragStop.call(this)
  }
}

function handleDragStop() {
  this.data = null
  this.origin = null
  this.isDragging = false
}

function handleDragMove() {
  if (this.isDragging) {
    const { x, y } = this.data.getLocalPosition(this.parent)

    this.x = this.origin.pos.x + (x - this.origin.mov.x)
    this.y = this.origin.pos.y + (y - this.origin.mov.y)
  }
}


module.exports = {
  EsperView
}
