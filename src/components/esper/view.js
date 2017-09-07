'use strict'

const React = require('react')
const { PureComponent } = React
const { array, func, string } = require('prop-types')
const { append, bounds, createDragHandler } = require('../../dom')
const { restrict } = require('../../common/util')
const { rad } = require('../../common/math')
const { linux } = require('../../common/os')
const PIXI = require('pixi.js/dist/pixi.min.js')
const { Graphics, Sprite, Rectangle } = PIXI
const { TextureCache, skipHello } = PIXI.utils
const TWEEN = require('@tweenjs/tween.js')
const { Tween } = TWEEN
const { Cubic } = TWEEN.Easing

const { TOOL, CURSOR } = require('../../constants/esper')

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
    addCursorStyles(this.pixi.renderer.plugins.interaction)

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
    if (this.drag.current) this.drag.stop()
  }

  componentWillReceiveProps(props) {
    if (this.image != null) {
      this.image.cursor = props.tool
    }
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

  get isDragging() {
    return this.drag.current != null
  }

  get bounds() {
    return this.pixi.screen
  }

  async reset(props) {
    this.fadeOut(this.image)
    this.image = null
    this.g = null

    if (props.src != null) {
      this.image = new Sprite()
      this.image.anchor.set(0.5)

      this.s = new Graphics()
      this.s.pivot.set(props.width / 2, props.height / 2)
      this.image.addChild(this.s)

      this.g = new Graphics()
      this.image.addChild(this.g)

      try {
        this.image.texture = await this.load(props.src, this.image)

      } catch (_) {
        this.image.width = props.width
        this.image.height = props.height
      }

      this.rotate(props)

      const { mirror, x, y, zoom } = props
      this.image.scale.x = mirror ? -zoom : zoom
      this.image.scale.y = zoom

      this.image.position.set(x, y)
      constrain(this.image.position, this.image, null, this.bounds)

      this.makeInteractive(this.image)
      this.image.cursor = props.tool

      this.pixi.stage.addChildAt(this.image, 0)
      this.persist()
    }
  }


  makeInteractive(sprite) {
    if (sprite == null || sprite.interactive) return

    sprite.interactive = true
    sprite.on('mousedown', this.handleDragStart)
  }

  drawSelection(g, ...selections) {
    g.lineStyle(2, 0x5c93e5, 1)
    g.beginFill(0xcedef7, 0.5)

    for (let { x, y, width, height } of selections) {
      if (width && height) g.drawRect(x, y, width, height)
    }

    g.endFill()
  }

  resize({ width, height, zoom, mirror }) {
    this.pixi.renderer.resize(width, height)

    if (this.image != null && zoom !== this.image.scale.y) {
      constrain(this.image.position, this.image, zoom, { width, height })
      this.image.scale.set(mirror ? -zoom : zoom, zoom)
      this.persist()
    }
  }

  move({ x, y }, duration = 0) {
    const { position } = this.image
    const next = constrain({ x, y }, this.image, null, this.bounds)

    if (equal(position, next)) return

    this
      .animate(position, 'move', this.persist)
      .to(next, duration)
      .start()
  }

  scale({ mirror, zoom }, duration = 0, { x, y } = {}) {
    const { scale, position } = this.image
    const viewport = this.bounds

    const zx = mirror ? -1 : 1
    const dz = zoom / scale.y

    x = x == null ? viewport.width / 2 : x
    y = y == null ? viewport.height / 2 : y

    const dx = (x - position.x)
    const dy = (y - position.y)

    const next = constrain({
      x: position.x + dx - dx * dz,
      y: position.y + dy - dy * dz,
      zoom
    }, this.image, zoom, viewport)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'zoom', this.persist)
      .to(next, duration)
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
        .onComplete(() => { this.image.rotation = tgt })
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

    this.animate(sprite, null, () => void sprite.destroy())
      .to({ alpha: 0 }, duration)
      .start()
  }

  animate(thing, scope, done) {
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

    if (typeof done === 'function') {
      tween
        .onComplete(done)
        .onStop(done)
    }

    return tween
  }


  load(url) {
    return new Promise((resolve, reject) => {
      if (TextureCache[url]) {
        return resolve(TextureCache[url])
      }

      this.pixi.loader
        .reset()
        .add(url)
        .load((_, { [url]: res }) => {
          if (res == null) return reject()
          if (res.error) return reject(res.error)

          // Loading typically happens on item open while
          // the view transition is in progress: this
          // adds a slight delay but improves the overall
          // smoothness of the transition!
          requestIdleCallback(() => resolve(res.texture), { timeout: 500 })
        })
    })
  }

  update = () => {
    this.tweens.update(performance.now())

    if (this.image != null) {
      this.g.clear()

      if (this.isDragging) {
        const { selection } = this.drag.current

        if (selection != null) {
          this.drawSelection(this.g, selection)
        }
      }

      this.s.clear()

      if (this.props.selections.length > 0) {
        this.drawSelection(this.s, ...this.props.selections)
      }
    }
  }

  persist = () => {
    this.props.onChange({
      x: this.image.x,
      y: this.image.y,
      zoom: this.image.scale.y
    })
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

    if (this.isDragging) this.drag.stop()
    if (!data.isPrimary) return

    target.cursor = `${this.props.tool}-active`

    this.drag.start()
    this.drag.current = {
      data,
      target,
      tool: this.props.tool,
      origin: {
        pos: { x: target.x, y: target.y },
        mov: data.getLocalPosition(target.parent)
      },
      selection: data.getLocalPosition(target),
      limit: getMovementBounds(target, null, this.bounds)
    }
  }

  handleDragStop = () => {
    try {
      if (!this.isDragging) return
      const { selection, target, tool } = this.drag.current

      target.cursor = tool

      switch (tool) {
        case TOOL.PAN:
          this.persist()
          break

        case TOOL.SELECT: {
          let { x, y, width, height } = selection
          if (!width || !height) break

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

    } finally {
      this.drag.current = null
    }
  }

  handleDrag = () => {
    if (!this.isDragging) return
    const { data, limit, origin, target, tool } = this.drag.current

    switch (tool) {
      case TOOL.PAN: {
        const { pos, mov } = origin
        const { top, right, bottom, left } = limit
        const { x, y } = data.getLocalPosition(target.parent)
        target.x = restrict(pos.x + (x - mov.x), left, right)
        target.y = restrict(pos.y + (y - mov.y), top, bottom)
        break
      }

      case TOOL.SELECT: {
        const { selection } = this.drag.current
        const { x, y } = data.getLocalPosition(target)
        selection.width = x - selection.x
        selection.height = y - selection.y
        break
      }
    }
  }

  drag = createDragHandler(this)

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
    selections: array.isRequired,
    onChange: func.isRequired,
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

function constrain(point, ...args) {
  const limit = getMovementBounds(...args)
  point.x = restrict(point.x, limit.left, limit.right)
  point.y = restrict(point.y, limit.top, limit.bottom)
  return point
}

function equal(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y
}

function act(name) {
  return `${name}-active`
}

function cursorStyle(name) {
  return CURSOR.STYLE.replace(/%\{name\}/g, name)
}

function addCursorStyle(styles, tool, cursor = CURSOR[tool]) {
  styles[tool] = cursorStyle(cursor)
  styles[act(tool)] = cursorStyle(act(cursor))
}

function addCursorStyles({ cursorStyles: styles }) {
  addCursorStyle(styles, TOOL.PAN)
  addCursorStyle(styles, TOOL.SELECT)
}

module.exports = {
  EsperView
}
