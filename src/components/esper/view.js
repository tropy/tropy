'use strict'

const React = require('react')
const { PureComponent } = React
const { func, string } = require('prop-types')
const { append, bounds } = require('../../dom')
const { restrict } = require('../../common/util')
const { rad } = require('../../common/math')
const { linux } = require('../../common/os')
const PIXI = require('pixi.js')
const { Graphics, Sprite, Rectangle } = PIXI
const { TextureCache, skipHello } = PIXI.utils
const TWEEN = require('@tweenjs/tween.js')
const { Tween } = TWEEN
const { Cubic } = TWEEN.Easing

const { TOOL } = require('../../constants/esper')

const {
  ESPER: {
    FADE_DURATION
  }
} = require('../../constants/sass')


class EsperView extends PureComponent {
  componentDidMount() {
    const { width, height } = bounds(this.container)

    this.tweens = new TWEEN.Group()

    skipHello()

    this.pixi = new PIXI.Application({
      antialias: true,
      resolution: window.devicePixelRatio,
      transparent: true,
      legacy: linux,
      width,
      height
    })

    this.pixi.loader.onError.add(this.handleLoadError)
    this.pixi.loader.onLoad.add(this.handleLoadProgress)
    this.pixi.ticker.add(this.update)
    this.pixi.renderer.autoResize = true

    append(this.pixi.view, this.container)

    this.io = new IntersectionObserver(([e]) => {
      requestIdleCallback(e.intersectionRatio > 0 ? this.start : this.stop)
    }, { threshold: [0] })

    this.io.observe(this.container)
  }

  componentWillUnmount() {
    this.tweens.removeAll()
    this.pixi.destroy(true)
    this.io.disconnect()
  }

  shouldComponentUpdate() {
    return false
  }

  start = () => {
    this.pixi.start()
  }

  stop = () => {
    this.pixi.stop()
  }


  get isStarted() {
    return !!this.pixi.ticker.started
  }

  get bounds() {
    return this.pixi.screen
  }

  reset(props) {
    this.fadeOut(this.image)
    this.image = null
    this.g = null

    if (props.src != null) {
      this.image = new Sprite()
      this.image.anchor.set(0.5)

      const { width, height } = this.bounds

      this.move({ x: width / 2, y: height / 2 })
      this.rotate(props)
      this.scale(props)

      this.makeInteractive(this.image)
      this.load(props.src, this.image)

      this.g = new Graphics()
      this.image.addChild(this.g)

      this.pixi.stage.addChildAt(this.image, 0)
    }
  }


  makeInteractive(sprite) {
    if (sprite == null || sprite.interactive) return

    sprite.interactive = true
    sprite.cursor = 'grab'

    sprite
      .on('pointerdown', this.handleDragStart)
      .on('pointerup', this.handleDragStop)
      .on('pointerupoutside', this.handleDragStop)
      .on('pointermove', this.handleDragMove)
  }

  resize({ width, height, zoom, mirror }) {
    this.pixi.renderer.resize(width, height)

    if (this.image != null) {
      const limit = getMovementBounds(this.image, zoom, { width, height })

      this.image.x = restrict(this.image.x, limit.left, limit.right)
      this.image.y = restrict(this.image.y, limit.top, limit.bottom)

      this.image.scale.set(mirror ? -zoom : zoom, zoom)
    }
  }

  move({ x, y }, duration = 0) {
    const { position } = this.image
    const limit = getMovementBounds(this.image, null, this.bounds)

    this.animate(position, 'move')
      .to({
        x: restrict(x, limit.left, limit.right),
        y: restrict(y, limit.top, limit.bottom)
      }, duration)
      .start()
  }

  scale({ mirror, x, y, zoom }, duration = 0) {
    const { scale, position } = this.image
    const viewport = this.bounds

    const zx = mirror ? -1 : 1
    const dz = zoom / scale.y

    x = x == null ? viewport.width / 2 : x
    y = y == null ? viewport.height / 2 : y

    const dx = (x - position.x)
    const dy = (y - position.y)

    const limit = getMovementBounds(this.image, zoom, viewport)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'zoom')

      .to({
        x: restrict(position.x + dx - dx * dz, limit.left, limit.right),
        y: restrict(position.y + dy - dy * dz, limit.top, limit.bottom),
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

  fadeOut(sprite, duration = FADE_DURATION) {
    if (sprite == null) return

    sprite.interactive = false

    if (!this.isStarted) {
      sprite.destroy()
      return
    }

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

    if (this.image != null) {
      this.g.clear()

      if (this.image.selection != null) {
        const { x, y, width, height } = this.image.selection

        this.g.lineStyle(2, 0x5c93e5, 1)
        this.g.beginFill(0xcedef7, 0.5)
        this.g.drawRect(x, y, width, height)
        this.g.endFill()
      }
    }
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
      ctrl: e.nativeEvent.ctrlKey || e.nativeEvent.metaKey
    })
  }

  handleDoubleClick = (e) => {
    e.stopPropagation()

    this.props.onDoubleClick({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
      shift: e.nativeEvent.shiftKey
    })
  }

  handleDragStart = (event) => {
    const { data, target } = event

    if (data.isPrimary) {

      target.origin = {
        pos: { x: target.x, y: target.y },
        mov: data.getLocalPosition(target.parent)
      }

      target.selection = data.getLocalPosition(target)

      target.limit = getMovementBounds(target, null, this.bounds)

      target.data = event.data
      target.drag = this.props.tool

    } else {
      this.handleDragStop(event)
    }
  }

  handleDragStop = ({ target }) => {
    if (target == null) return

    switch (target.drag) {
      case TOOL.SELECT: {
        let { x, y, width, height } = target.selection

        x = x + target.texture.orig.width / 2
        y = y + target.texture.orig.height / 2

        if (width < 0) {
          x = x + width
          width = -width
        }

        if (height < 0) {
          y = y + height
          height = -height
        }

        this.props.onSelectionCreate({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height)
        })

        break
      }
    }

    target.selection = null
    target.data = null
    target.origin = null
    target.limit = null
    target.drag = null
  }

  handleDragMove = ({ target }) => {
    if (target == null) return

    switch (target.drag) {
      case TOOL.PAN: {
        const { pos, mov } = target.origin
        const { top, right, bottom, left } = target.limit
        const { x, y } = target.data.getLocalPosition(target.parent)

        target.x = restrict(pos.x + (x - mov.x), left, right)
        target.y = restrict(pos.y + (y - mov.y), top, bottom)

        break
      }

      case TOOL.SELECT: {
        const { selection } = target
        const { x, y } = target.data.getLocalPosition(target)

        selection.width = x - selection.x
        selection.height = y - selection.y

        break
      }
    }
  }

  render() {
    return (
      <div
        ref={this.setContainer}
        className="esper-view"
        onDoubleClick={this.handleDoubleClick}
        onWheel={this.handleWheel}/>
    )
  }

  static propTypes = {
    tool: string.isRequired,
    onLoadError: func,
    onDoubleClick: func.isRequired,
    onSelectionCreate: func.isRequired,
    onWheel: func.isRequired
  }
}


function isVertical(angle) {
  if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) return true
  if (angle > Math.PI * 1.25 && angle < Math.PI * 1.75) return true
  return false
}

function getSpriteBounds(sprite, scale) {
  let { x, y, width, height, rotation, texture } = sprite

  if (scale != null) {
    width = texture.orig.width * scale
    height = texture.orig.height * scale
  }

  return isVertical(rotation) ?
    new Rectangle(x, y, height, width) :
    new Rectangle(x, y, width, height)
}

function getMovementBounds(sprite, scale, viewport) {
  const { width, height } = getSpriteBounds(sprite, scale)

  const dx = Math.max(0, width - viewport.width)
  const dy = Math.max(0, height - viewport.height)

  return new Rectangle(
    (viewport.width - dx) / 2, (viewport.height - dy) / 2, dx, dy
  )
}

module.exports = {
  EsperView
}
