'use strict'

const assert = require('assert')
const EventEmitter = require('events')
const PIXI = require('pixi.js-legacy')
const TWEEN = require('@tweenjs/tween.js')
const debounce = require('lodash.debounce')
const { append, createDragHandler, on, off } = require('../dom')
const { info } = require('../common/log')
const { rad } = require('../common/math')
const { restrict } = require('../common/util')
const { Photo } = require('./photo')
const { Selection } = require('./selection')
const { TOOL } = require('../constants/esper')

const {
  ESPER: {
    FADE_DURATION,
    ZOOM_PINCH_BOOST,
    ZOOM_WHEEL_FACTOR
  }
} = require('../constants/sass')

const {
  addCursorStyle,
  constrain,
  coords,
  equal,
  setScaleMode
} = require('./util')


PIXI.settings.RETINA_PREFIX = /@2x!/


class Esper extends EventEmitter {
  static #INSTANCE = null

  static get instance() {
    return Esper.#INSTANCE
  }

  #rmq = matchMedia('(max-resolution: 1dppx)')
  #lastClickTime = 0
  #tool = TOOL.ARROW

  constructor(opts) {
    super()

    assert(Esper.#INSTANCE == null, 'old Esper.instance present')
    Esper.#INSTANCE = this

    this.tweens = new TWEEN.Group()

    PIXI.utils.skipHello()

    this.app = new PIXI.Application({
      antialias: false,
      autoDensity: true,
      forceCanvas: !ARGS.webgl,
      powerPreference: 'low-power',
      roundPixels: false,
      sharedLoader: true,
      transparent: true,
      ...opts
    })

    for (let name in TOOL)
      addCursorStyle(
        this.app.renderer.plugins.interaction.cursorStyles,
        TOOL[name])

    this.app.ticker.add(this.update)

    this.app.loader.onError.add((...args) =>
      this.emit('loader.error', ...args))
    this.app.loader.onLoad.add((...args) =>
      this.emit('loader.load', ...args))

    this.#rmq.addListener(this.handleResolutionChange)
    this.on('change', this.handleResolutionChange)

    on(this.app.view, 'wheel', this.handleWheel, { passive: true })

    info(`Esper.instance created using ${
      this.app.renderer instanceof PIXI.CanvasRenderer ? 'canvas' : 'webgl'
    } renderer`)
  }

  destroy() {
    this.tweens.removeAll()
    this.stop.flush()

    if (this.drag.current)
      this.drag.stop()

    off(this.app.view, 'wheel', this.handleWheel, { passive: true })

    this.#rmq.removeListener(this.handleResolutionChange)

    this.app.destroy(true, true)
    this.removeAllListeners()

    assert(Esper.#INSTANCE === this, 'destroyed dangling Esper.instance')
    Esper.#INSTANCE = null
  }

  mount(element) {
    append(this.app.view, element)
    return this
  }


  render() {
    this.app.render()
  }

  resume() {
    this.start()
    this.stop()
  }

  start() {
    this.stop.cancel()
    this.app.start()
  }

  stop = debounce(() => {
    this.app.stop()
  }, 5000)

  update = () => {
    this.tweens.update(performance.now())
    this.photo?.update(this.drag.current)
  }

  commit = () => {
    this.emit('change', {
      x: this.photo?.x || 0,
      y: this.photo?.y || 0,
      zoom: this.photo?.scale.y || 1
    })
  }

  get dpx() {
    return Math.floor(devicePixelRatio) || 1
  }

  get resolution() {
    return this.app.renderer.resolution
  }

  set resolution(resolution) {
    let { renderer } = this.app

    if (resolution !== renderer.resolution) {
      renderer.resolution = resolution
      renderer.plugins.interaction.resolution = resolution

      if (renderer.rootRenderTarget)
        renderer.rootRenderTarget.resolution = resolution

      this.photo?.handleResolutionChange(resolution)

      renderer.resize(renderer.width, renderer.height)
    }
  }

  get tool() {
    return this.#tool
  }

  set tool(tool) {
    this.#tool = tool

    if (this.photo) {
      this.photo.cursor = tool
    }
  }

  handleResolutionChange() {
    let resolution = this.dpx

    // On low-res screens, we render at 2x resolution
    // when zooming out to improve quality. See #218
    if (resolution < 2 && this.photo && this.photo.scale.y < 1) {
      resolution = 2
    }

    this.resolution = resolution
  }

  getInnerBounds(...args) {
    return this.photo.getInnerBounds(this.app.screen, ...args)
  }


  adjust(opts) {
    this.photo
      .brightness(opts.brightness)
      .contrast(opts.contrast)
      .hue(opts.hue)
      .negative(opts.negative)
      .saturation(opts.saturation)
      .sharpen(opts.sharpen)

    this.render()
  }

  animate(thing, scope, { stop, complete, done } = {}) {
    // TODO skip when esper not visible!

    let tween = new TWEEN.Tween(thing, this.tweens)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onStart(() => {
        if (scope != null) {
          let current = this.tweens[scope]
          if (current) current.stop()
          this.tweens[scope] = tween
        }
      })
      .onStop(() => {
        if (scope != null) this.tweens[scope] = null
        if (typeof stop === 'function') stop()
        if (typeof done === 'function') done()
      })
      .onComplete(() => {
        if (scope != null) this.tweens[scope] = null
        if (typeof complete === 'function') complete()
        if (typeof done === 'function') done()
      })

    this.resume()

    return tween
  }

  fadeOut(thing, duration = FADE_DURATION) {
    if (thing == null) return
    thing.interactive = false
    this
      .animate(thing, null, { done: () => thing.destroy() })
      .to({ alpha: 0 }, duration)
      .start()
  }

  load(url) {
    return new Promise((resolve, reject) => {

      if (PIXI.utils.TextureCache[url]) {
        return resolve(PIXI.utils.TextureCache[url])
      }

      this.app.loader
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

  move({ x, y }, duration = 0) {
    let { position } = this.photo
    let next = constrain({ x, y }, this.getInnerBounds())

    if (equal(position, next)) return

    this
      .animate(position, 'move', { complete: this.commit })
      .to(next, duration)
      .start()
  }

  async reset(props) {
    this.fadeOut(this.photo)
    this.photo = null

    if (props.src != null) {
      let photo = this.photo = new Photo(props)

      try {
        let texture = await this.load(props.src)

        // Subtle: if the view was reset while we were loading
        // the texture, abort!
        if (this.photo !== photo) return

        photo.bg.texture =  texture
        photo.interactive = true
        photo.on('mousedown', this.handleMouseDown)

      } catch (_) {
        this.emit('photo.error', props.photo)
      }

      this.adjust(props)
      this.rotate(props)

      let { mirror, x, y, zoom } = props

      setScaleMode(photo.bg.texture, zoom)
      photo.scale.x = mirror ? -zoom : zoom
      photo.scale.y = zoom

      photo.position.set(x, y)
      photo.constrain(this.app.screen)

      // photo.sync(props)
      // this.tool = props.tool
      photo.cursor = this.tool

      this.app.stage.addChildAt(photo, 0)

      this.commit()
      this.render()
    }
  }


  resize({ width, height, zoom, mirror }) {
    width = Math.round(width)
    height = Math.round(height)

    this.app.renderer.resize(width, height)
    this.render()

    if (this.photo == null || zoom == null)
      return

    this.photo.constrain({ width, height }, zoom)
    setScaleMode(this.photo.bg.texture, zoom)
    this.photo.scale.set(mirror ? -zoom : zoom, zoom)

    this.commit()
    this.resume()
  }

  rotate({ angle }, duration = 0, clockwise = false) {
    if (duration > 0) {
      let { photo } = this
      let cur = photo.rotation
      let tgt = rad(angle)
      let tmp = tgt

      // To maintain rotation orientation during the transition,
      // we need to keep temporary values exceeding [0, 2π], because
      // a single animation can go round the circle many times.
      // For clockwise rotation we always need to count upwards;
      // downwards for counter-clockwise rotations.
      if (clockwise) {
        while (tmp < cur) tmp += (2 * Math.PI)
      } else {
        while (tmp > cur) tmp -= (2 * Math.PI)
      }

      this
        .animate(photo, 'rotate', {
          done: () => {
            photo.rotation = tgt
            this.commit()
          }
        })
        .to({ rotation: tmp }, duration)
        .start()

    } else {
      this.photo.rotation = rad(angle)
      this.render()
    }
  }

  sync(props, duration = 0) {
    if (this.photo == null) return

    let { photo } = this
    let { angle, mirror, x, y, zoom } = props
    let { position, scale } = photo

    setScaleMode(photo.bg.texture, zoom)
    this.adjust(props)

    let zx = mirror ? -1 : 1
    let next = constrain({ x, y, zoom }, this.getInnerBounds(zoom))

    // TODO fixate, change pivot and rotate after move and scale!
    scale.x = scale.y * zx
    photo.rotation = rad(angle)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'sync', { complete: this.persist })
      .to(next, duration / 2)
      .onUpdate(m => {
        scale.x = m.zoom * zx
        scale.y = m.zoom
        photo.x = m.x
        photo.y = m.y
      })
      .start()

    // photo.sync(props)
  }

  scale({ mirror, zoom }, duration = 0, { x, y } = {}) {
    let { photo } = this
    let { scale, position, bg } = photo
    let { screen } = this.app

    let zx = mirror ? -1 : 1
    let dz = zoom / scale.y

    x = x == null ? screen.width / 2 : x
    y = y == null ? screen.height / 2 : y

    let dx = (x - position.x)
    let dy = (y - position.y)

    let next = constrain({
      x: position.x + dx - dx * dz,
      y: position.y + dy - dy * dz,
      zoom
    }, this.getInnerBounds(zoom))

    setScaleMode(bg.texture, zoom)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'zoom', { complete: this.commit })
      .to(next, duration)
      .onUpdate(m => {
        scale.x = m.zoom * zx
        scale.y = m.zoom
        photo.x = m.x
        photo.y = m.y
      })
      .start()
  }


  isDoubleClick(time = Date.now(), threshold = 350) {
    try {
      return this.isDoubleClickSupported() &&
        (time - this.#lastClickTime) <= threshold
    } finally {
      this.#lastClickTime = time
    }
  }

  isDoubleClickSupported(tool = this.tool) {
    return tool === TOOL.PAN || tool === TOOL.ARROW
  }

  handleMouseDown = (event) => {
    let { data, target } = event

    if (this.drag.current) this.drag.stop()
    if (!data.isPrimary) return

    this.resume()

    if (target instanceof Selection) {
      return this.emit('selection-activate', event.target.data)
    }

    if (this.isDoubleClick()) {
      let { x, y, shift } = coords(data.originalEvent)
      return this.emit(`zoom-${shift ? 'out' : 'in'}`, { x, y }, true)
    }

    target.cursor = `${this.tool}-active`

    this.drag.start()
    this.drag.current = {
      data,
      target,
      tool: this.tool,
      origin: {
        pos: { x: target.x, y: target.y },
        mov: data.getLocalPosition(target.parent)
      },
      selection: data.getLocalPosition(target),
      limit: this.getInnerBounds()
    }
  }

  handleDrag = () => {
    switch (this.drag.current?.tool) {
      case TOOL.ARROW:
      case TOOL.PAN:
        this.handlePanMove()
        break
      case TOOL.SELECT:
        this.handleSelectMove()
        break
    }
  }

  handleDragStop = (event, wasCancelled) => {
    try {
      let { origin, target, tool } = this.drag.current
      target.cursor = this.tool

      if (wasCancelled) return

      switch (tool) {
        case TOOL.ARROW:
        case TOOL.PAN:
          this.handlePanStop()
          break
        case TOOL.SELECT:
          this.handleSelectStop()
          break
        case TOOL.ZOOM_IN:
          this.emit('zoom-in', origin.mov, false)
          break
        case TOOL.ZOOM_OUT:
          this.emit('zoom-out', origin.mov, false)
          break
      }

    } finally {
      this.drag.current = undefined
    }
  }

  drag = createDragHandler(this)

  handlePanMove() {
    let { data, limit, origin, target } = this.drag.current
    let { pos, mov } = origin
    let { top, right, bottom, left } = limit
    let { x, y } = data.getLocalPosition(target.parent)
    target.x = Math.floor(restrict(pos.x + (x - mov.x), left, right))
    target.y = Math.floor(restrict(pos.y + (y - mov.y), top, bottom))
  }

  handlePanStop() {
    this.commit()
  }

  handleSelectMove() {
    let { data, target, selection } = this.drag.current
    let { x, y } = data.getLocalPosition(target)
    selection.width = x - selection.x
    selection.height = y - selection.y
  }

  handleSelectStop() {
    let { x, y, width, height } = this.drag.current.selection

    if (!width || !height) return

    if (width < 0) {
      x = x + width
      width = -width
    }

    if (height < 0) {
      y = y + height
      height = -height
    }

    this.emit('selection-create', {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    })
  }

  handleWheel = (event) => {
    event.stopPropagation()

    let { x, y, dy, dx, ctrl, pinch } = coords(event)

    if (ctrl) {
      if (pinch) dy = Math.round(dy * ZOOM_PINCH_BOOST)

      this.emit('wheel.zoom', {
        x,
        y,
        by: dy * ZOOM_WHEEL_FACTOR
      })

    } else {
      this.emit('wheel.pan', {
        x: Math.floor(dx),
        y: Math.floor(dy)
      })
    }
  }
}


module.exports = {
  Esper
}
