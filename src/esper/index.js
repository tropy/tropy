'use strict'

const EventEmitter = require('events')
const PIXI = require('pixi.js-legacy')
const TWEEN = require('@tweenjs/tween.js')
const debounce = require('lodash.debounce')
const { append, createDragHandler, on, off } = require('../dom')
const { info } = require('../common/log')
const { isClockwise, isHorizontal, deg, rad } = require('../common/math')
const { restrict } = require('../common/util')
const { Photo } = require('./photo')
const { Selection } = require('./selection')
const { MODE, TOOL } = require('../constants/esper')

const {
  ESPER: {
    FADE_DURATION,
    SYNC_DURATION,
    ZOOM_PINCH_BOOST,
    ZOOM_WHEEL_FACTOR
  }
} = require('../constants/sass')

const {
  addCursorStyle,
  center,
  constrain,
  coords,
  equal,
  isDoubleClickSupported,
  setScaleMode
} = require('./util')


PIXI.settings.RETINA_PREFIX = /@2x!/


class Esper extends EventEmitter {
  static #INSTANCE = null

  static get instance() {
    if (!Esper.#INSTANCE) {
      Esper.#INSTANCE = new Esper()
    }

    return Esper.#INSTANCE
  }

  static get devicePixelRatio() {
    return Math.floor(devicePixelRatio) || 1
  }

  #rmq = matchMedia('(max-resolution: 1dppx)')
  #lastClickTime = 0

  constructor(opts) {
    super()

    this.tweens = new TWEEN.Group()

    PIXI.utils.skipHello()

    this.app = new PIXI.Application({
      antialias: false,
      autoDensity: true,
      forceCanvas: !ARGS.webgl,
      powerPreference: 'low-power',
      resolution: Esper.devicePixelRatio,
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

    this.app.loader.onError.add((e, _, res) =>
      this.emit('loader.error', e, res?.url))
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

    if (Esper.#INSTANCE === this) {
      Esper.#INSTANCE = null
    }
  }

  mount(element) {
    append(this.app.view, element)
    return this
  }

  extract = async (src, props) => {
    try {
      let photo = new Photo(props)
      let { width, height } = props
      let { renderer } = this.app

      photo.bg.texture = await this.load(src)
      photo.filter(props)

      if (!isHorizontal(props.angle)) {
        width = props.height
        height = props.width
      }

      var texture = new PIXI.RenderTexture.create(width, height)

      photo.rotation = rad(props.angle)
      photo.scale.set(props.mirror ? -1 : 1, 1)
      photo.position.set(width / 2, height / 2)

      renderer.render(photo, texture)

      return {
        buffer: Buffer.from(renderer.plugins.extract.pixels(texture)),
        channels: 4,
        width,
        height
      }


    } finally {
      texture?.destroy()
    }
  }

  async reset(props, state) {
    this.fadeOut(this.photo)
    this.photo = null

    if (state.src != null) {
      // Subtle: race conditions because of async loading!
      // The first sync must not override other syncs, coming
      // in while the photo is still loading.
      let tmp = this.photo = new Photo(props.photo)
      this.sync(props, state, 0)

      try {
        let texture = await this.load(state.src)

        // Subtle: if the view was reset during load, abort!
        if (this.photo !== tmp) return

        this.photo.bg.texture =  texture
        this.photo.interactive = true
        this.photo.on('mousedown', this.handleMouseDown)

      } catch (_) {
        this.emit('photo.error', props.photo)
      }

      this.app.stage.addChildAt(this.photo, 0)

      this.emit('change')
      this.render()
    }
  }

  sync(props, state, duration = SYNC_DURATION) {
    let { photo } = this
    let { angle, mirror, zoom } = state
    let { x, y } = this.getDefaultPosition(props)

    setScaleMode(photo.bg.texture, zoom)
    photo.sync(props, state)

    let next = {
      pivot: center(props.selection || props.photo),
      rotation: rad(angle),
      x,
      y,
      zoom
    }

    this.constrain(next, next)

    if (duration && photo.parent) {
      if (mirror !== photo.mirror) {
        this.flip()
      }

      photo.fixate(photo.toGlobal(next.pivot, null, true), false)

      let rotate = next.rotation !== photo.rotation
      if (rotate && props.mode === MODE.ZOOM) {
        setIntermediatePosition(next, photo, this.app.screen)
      }

      this.filter(state, {
        duration: rotate ? duration * 2 : duration
      })

      this.move(next, {
        duration,
        skipConstrain: true,
        done: () => {
          if (next.rotation !== photo.rotation) {
            this.rotate({ angle }, {
              duration,
              fixate: props.mode === MODE.ZOOM
            })
          }
        }
      })

    } else {
      this.photo.rotation = next.rotation
      this.photo.scale.set(mirror ? -zoom : zoom, zoom)
      this.photo.pivot.copyFrom(next.pivot)
      this.photo.position.copyFrom(next)
      this.photo.filter(state)
      this.render()
    }
  }

  resize({ width, height, zoom, mirror } = {}) {
    width = Math.round(width ?? this.app.screen.width)
    height = Math.round(height ?? this.app.screen.height)

    this.app.renderer.resize(width, height)
    this.render()

    if (this.photo == null)
      return

    zoom = zoom ?? this.photo.scale.y
    mirror = mirror ?? this.photo.mirror

    this.photo.constrain(this.app.screen, { zoom })

    if (zoom !== this.photo.scale.y) {
      setScaleMode(this.photo.bg.texture, zoom)
      this.photo.scale.set(mirror ? -zoom : zoom, zoom)
    }

    this.emit('change')
    this.resume()
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
      this.resize()

      this.emit('resolution-change')
    }
  }

  get x() {
    return this.photo?.x ?? 0
  }

  get y() {
    return this.photo?.y ?? 0
  }


  handleResolutionChange = debounce(() => {
    let resolution = Esper.devicePixelRatio

    // On low-res screens, we render at 2x resolution
    // when zooming out to improve quality. See #218
    if (resolution < 2 && this.photo && this.photo.scale.y < 1) {
      resolution = 2
    }

    this.resolution = resolution
  }, 500)

  constrain(position = this.photo.position, ...args) {
    return constrain(position, this.getPanLimits(...args))
  }

  getPanLimits(...args) {
    return this.photo.getPanLimits(this.app.screen, ...args)
  }

  getDefaultPosition({ x, y, mode }) {
    switch (mode) {
      case MODE.FIT:
        return center(this.app.screen)

      case MODE.FILL:
        return {
          x: this.app.screen.width / 2,
          y: y ?? this.app.screen.height / 2
        }
      default: {
        return {
          x: x ?? this.app.screen.width / 2,
          y: y ?? this.app.screen.height / 2
        }
      }
    }
  }


  animate(thing, scope, { stop, complete, done } = {}) {
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
        this.emit('change')
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

  filter(next, { duration = 0, ...opts } = {}) {
    if (duration > 0) {
      let { photo } = this

      this
        .animate(photo.current, 'filter', opts)
        .to(next, duration)
        .onUpdate((m) => {
          photo.filter(m)
        })
        .start()

    } else {
      this.photo.filter(next)
      this.render()
    }
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

  move({ x, y, zoom }, {
    duration = 0,
    skipConstrain = false,
    ...opts
  } = {}) {
    let { photo } = this
    let { mirror } = photo

    let current = {
      x: photo.x,
      y: photo.y,
      zoom: photo.scale.y
    }

    let next = {
      x,
      y,
      zoom: zoom ?? current.zoom
    }

    if (!skipConstrain)
      this.constrain(next, next)

    if (equal(current, next) && current.zoom === next.zoom)
      return opts.done?.()

    this
      .animate(current, 'move', opts)
      .to(next, duration)
      .onUpdate(m => {
        photo.x = m.x
        photo.y = m.y
        photo.scale.x = mirror ? -m.zoom : m.zoom
        photo.scale.y = m.zoom
      })
      .start()
  }

  flip() {
    this.photo.flip(center(this.app.screen))
    this.render()
  }

  rotate({ angle, mirror, zoom }, {
    duration = 0,
    clockwise,
    fixate,
    ...opts
  } = {}) {
    let { photo } = this
    let rotation = rad(angle)

    if (deg(photo.rotation) === (angle % 360))
      return opts.done?.()

    if (duration > 0) {
      let current = {
        rotation: photo.rotation,
        zoom: photo.scale.y
      }

      let next = {
        rotation,
        zoom: zoom ?? photo.scale.y
      }

      if (clockwise == null)
        clockwise = isClockwise(deg(current.rotation), angle)

      // To maintain rotation orientation during the transition,
      // we need to keep temporary values exceeding [0, 2π], because
      // a single animation can go round the circle many times.
      // For clockwise rotation we always need to count upwards;
      // downwards for counter-clockwise rotations.
      if (clockwise) {
        while (next.rotation < current.rotation)
          next.rotation += (2 * Math.PI)
      } else {
        while (next.rotation > current.rotation)
          next.rotation -= (2 * Math.PI)
      }

      if (fixate)
        photo.fixate(center(this.app.screen))

      let complete = () => {
        photo.rotation = rotation
        if (fixate) photo.release()
        opts.complete?.()
      }

      this
        .animate(current, 'rotate', { ...opts, complete })
        .to(next, duration)
        .onUpdate(m => {
          photo.rotation = m.rotation
          photo.scale.x = mirror ? -m.zoom : m.zoom
          photo.scale.y = m.zoom
        })
        .start()

    } else {
      photo.rotation = rotation
      photo.scale.x = mirror ? -zoom : zoom
      photo.scale.y = zoom
      this.render()
      opts.done?.()
    }
  }

  scale({ mirror, zoom }, { duration = 0, x, y, ...opts } = {}) {
    let { photo } = this
    let { scale, position, bg } = photo
    let { screen } = this.app

    let zx = mirror ? -1 : 1
    let dz = zoom / scale.y

    x = x ?? screen.width / 2
    y = y ?? screen.height / 2

    let dx = (x - position.x)
    let dy = (y - position.y)

    let next = this.constrain({
      x: position.x + dx - dx * dz,
      y: position.y + dy - dy * dz,
      zoom
    }, { zoom })

    setScaleMode(bg.texture, zoom)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'zoom', opts)
      .to(next, duration)
      .onUpdate(m => {
        scale.x = m.zoom * zx
        scale.y = m.zoom
        photo.x = m.x
        photo.y = m.y
      })
      .start()
  }


  isDoubleClick(tool, time = Date.now(), threshold = 350) {
    try {
      return isDoubleClickSupported(tool) &&
        (time - this.#lastClickTime) <= threshold
    } finally {
      this.#lastClickTime = time
    }
  }

  handleMouseDown = (event) => {
    let { data, target } = event

    if (this.drag.current) this.drag.stop()
    if (!data.isPrimary) return

    this.resume()

    if (target instanceof Selection) {
      return this.emit('selection-activate', event.target.data)
    }

    let tool = this.photo?.tool

    if (this.isDoubleClick(tool)) {
      let { x, y, shift } = coords(data.originalEvent)
      return this.emit(`zoom-${shift ? 'out' : 'in'}`, { x, y }, true)
    }

    target.cursor = `${tool}-active`

    this.drag.start()
    this.drag.current = {
      data,
      target,
      tool,
      origin: {
        pos: { x: target.x, y: target.y },
        mov: data.getLocalPosition(target.parent)
      },
      selection: data.getLocalPosition(target),
      limit: this.getPanLimits()
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
      target.cursor = this.photo?.tool

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
    this.emit('change')
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


const setIntermediatePosition = (next, photo, screen) => {
  // Save current position and rotation
  let rotation = photo.rotation
  let position = photo.position.clone()

  // Set next rotation, position
  photo.rotation = next.rotation
  photo.position.copyFrom(next)

  // Fixate at center of screen, updating transform
  photo.toLocal(center(screen), null, photo.pivot)

  // Restore rotation and update transform
  photo.rotation = rotation
  photo.displayObjectUpdateTransform()

  // Adjust next position
  next.x = photo.x
  next.y = photo.y

  // Restore position and pivot
  photo.position.copyFrom(position)
  photo.pivot.copyFrom(next.pivot)
}

module.exports = {
  Esper
}
