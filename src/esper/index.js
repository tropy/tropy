import { EventEmitter } from 'node:events'
import { Application, RenderTexture, Ticker } from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'
import debounce from 'lodash.debounce'
import {
  append,
  createDragHandler,
  on,
  off,
  onResolutionChange,
  getResolution,
  remove
} from '../dom.js'
import { debug, error, info, warn } from '../common/log.js'
import { isClockwise, isHorizontal, deg, rad } from '../common/math.js'
import { delay, restrict } from '../common/util.js'
import { Photo, FILTERS } from './photo.js'
import { Selection } from './selection.js'
import { Loader } from './loader.js'
import { ESPER, SASS } from '../constants/index.js'
import ARGS from '../args.js'
import { isMeta } from '../keymap.js'

import {
  addCursorStyle,
  center,
  constrain,
  coords,
  equal,
  isDoubleClickSupported,
  normalizeRectangle,
  setScaleMode
} from './util.js'

const {
  FADE_DURATION,
  SYNC_DURATION,
  ZOOM_PINCH_BOOST,
  ZOOM_WHEEL_FACTOR,
  ZOOM_MODIFIER
} = SASS.ESPER

const LARGE_TEXTURE = 3500 * 3500

Ticker.shared.autoStart = false
Ticker.shared.stop()

export {
  FILTERS
}

export default class Esper extends EventEmitter {
  static #INSTANCE = null

  static get instance() {
    if (!Esper.#INSTANCE) {
      Esper.#INSTANCE = new Esper()
    }

    return Esper.#INSTANCE
  }

  #lastClickTime = 0
  #isInitialized = false

  constructor() {
    super()

    this.tweens = [
      new TWEEN.Group(),
      new TWEEN.Group()
    ]

    this.app = new Application()
  }

  async init(opts) {
    if (this.#isInitialized)
      return this

    await this.app.init({
      autoStart: false,
      sharedTicker: true,
      preference: ARGS.rendererPreference || 'webgl',
      antialias: false,
      autoDensity: true,
      backgroundAlpha: 0,
      powerPreference: 'low-power',
      resolution: getResolution(),
      roundPixels: false,
      ...opts
    })

    for (let name in ESPER.TOOL)
      addCursorStyle(
        this.app.renderer.events.cursorStyles,
        ESPER.TOOL[name])

    this.app.ticker.add(this.update)
    this.loader = new Loader()

    this.removeResolutionListener = onResolutionChange(this.handleResolutionChange)
    this.on('change', this.handleResolutionChange)

    on(this.app.canvas, 'wheel', this.handleWheel, { passive: true })

    info({
      renderer: this.app.renderer.name,
      resolution: this.resolution
    }, `Esper.instance initialized with ${this.app.renderer.name} renderer`)

    this.#isInitialized = true
    return this
  }

  halt() {
    for (let tweens of this.tweens)
      tweens.removeAll()

    this.clear()
    this.stop.flush()

    if (this.drag.current)
      this.drag.stop()
  }

  destroy = () => {
    this.halt()

    off(this.app.canvas, 'wheel', this.handleWheel, { passive: true })

    this.removeResolutionListener()
    this.removeResolutionListener = null

    this.app.destroy(true, true)
    this.removeAllListeners()

    if (Esper.#INSTANCE === this) {
      Esper.#INSTANCE = null
    }
  }

  mount(element) {
    append(this.app.canvas, element)
    return this
  }

  unmount() {
    this.halt()
    remove(this.app.canvas)
  }

  extract = async (src, props) => {
    try {
      let photo = new Photo({
        ...props,
        resolution: 1
      })

      let { width, height } = props
      let { renderer } = this.app

      photo.bg.texture = await this.loader.loadTexture(src)
      photo.filter(props)
      photo.rotation = rad(props.angle)
      photo.scale.set(props.mirror ? -1 : 1, 1)

      if (!isHorizontal(props.angle)) {
        width = props.height
        height = props.width
      }

      photo.position.set(width / 2, height / 2)

      var renderTexture = RenderTexture.create({
        width,
        height,
        resolution: 1
      })

      renderer.render(photo, { clear: false, renderTexture })
      let { pixels } = renderer.extract.pixels(renderTexture)

      return {
        buffer: Buffer.from(pixels),
        channels: 4,
        premultiplied: true,
        width,
        height
      }


    } finally {
      renderTexture?.destroy(true)
    }
  }

  clear(duration = 0) {
    if (duration)
      this.fadeOut(this.photo, duration)
    else
      this.photo?.destroy()

    this.photo = null
    this.emit('texture-change', false)

    this.render()
  }

  async reset(props, state, duration = 0) {
    this.clear(FADE_DURATION)

    if (state.src != null) {
      // Subtle: avoid race conditions because of async loading!
      // The first sync must not override other syncs, coming
      // in while the photo is still loading.
      let tmp = this.photo = new Photo({
        width: state.width,
        height: state.height,
        resolution: this.resolution
      })

      this.sync(props, state, 0)

      try {
        let texture = await this.loadTexture(state.src, duration)

        // Subtle: if the view was reset during load, abort!
        if (this.photo !== tmp) return

        this.photo.bg.texture = texture
        this.emit('texture-change', true)

        this.photo.eventMode = 'static'
        this.photo.addEventListener('mousedown', this.handleMouseDown)

        if (state.width !== texture.width || state.height !== texture.height)
          this.emit('photo-error', props.photo, false)


      } catch (e) {
        warn({ stack: e.stack }, `esper: failed loading ${state.src}`)
        this.emit('photo-error', props.photo, true)
      }

      this.app.stage.addChildAt(this.photo, 0)

      this.emit('change')
      this.render()
    }
  }

  async loadTexture(url, duration = 0) {
    let loadTime = Date.now()
    let texture = await this.loader.loadTexture(url)

    loadTime = Date.now() - loadTime
    duration = duration - loadTime

    // Subtle: resets typically happen because Esper has become
    // visible by sliding in; when a new texture gets rendered
    // for the first time, it will be uploaded to the GPU. For
    // large textures this task can affect the view transition
    // and, therefore, we may want to artificially delay the
    // texture loading here. Additionally, we don't want to
    // render the texture immediately if loading took so long
    // that the rendering would happen while the transition
    // is already far advanced: in this case it looks better
    // to wait until the transition is complete.
    if (duration > 0 && (
      loadTime > duration ||
      texture.width * texture.height > LARGE_TEXTURE
    )) {
      debug(`delaying texture load by ${duration}ms`)
      await delay(duration)
    }

    debug(`loadTexture took ${loadTime}ms`)

    return texture
  }

  sync(props, state, duration = SYNC_DURATION) {
    this.tweens[0].removeAll()

    let { photo } = this
    if (photo == null) return

    let { angle, mirror, zoom } = state
    let { x, y } = this.getDefaultPosition(props)

    setScaleMode(photo.bg.texture, zoom)
    photo.sync(props, state)

    let next = {
      pivot: center(props.selection || state),
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
      if (rotate && props.mode === ESPER.MODE.ZOOM) {
        setIntermediatePosition(next, photo, this.app.screen)
      }

      this.filter(state, {
        duration: rotate ? duration * 2 : duration
      })

      this.move(next, {
        duration,
        skipConstrain: true,
        complete: () => {
          if (next.rotation !== photo.rotation) {
            this.rotate({ angle }, {
              duration,
              fixate: props.mode === ESPER.MODE.ZOOM
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

  render = () => {
    this.app.render()
  }

  resume = () => {
    this.start()
    this.stop()
  }

  start() {
    this.stop.cancel()
    Ticker.system.stop()
    this.app.start()
    this.app.ticker.start()
  }

  stop = debounce(() => {
    this.app.stop()
    this.app.ticker.stop()
    Ticker.system.stop()
  }, 5000)

  update = () => {
    try {
      let now = performance.now()

      for (let tween of this.tweens)
        tween.update(now)

      this.photo?.update(this.drag.current, this.textSelection)

    } catch (e) {
      this.halt()
      error({ stack: e.stack }, 'esper: update cycle failed, halting!')
    }
  }

  get resolution() {
    return this.app.renderer.resolution
  }

  set resolution(resolution) {
    let { renderer } = this.app

    if (resolution !== renderer.resolution) {
      renderer.resolution = resolution
      renderer.events.resolution = resolution

      if (renderer.rootRenderTarget)
        renderer.rootRenderTarget.resolution = resolution

      this.photo?.handleResolutionChange(resolution)
      this.resize()

      this.emit('resolution-change')
      debug({ resolution }, `esper: resolution changed to ${resolution}`)
    }
  }

  get x() {
    return this.photo?.x ?? 0
  }

  get y() {
    return this.photo?.y ?? 0
  }

  handleResolutionChange = debounce(() => {
    let resolution = getResolution()

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
      case ESPER.MODE.FIT:
        return center(this.app.screen)

      case ESPER.MODE.FILL:
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


  animate(thing, scope, { stop, complete, done, gid = 0 } = {}) {
    let group = this.tweens[gid]
    let tween = new TWEEN.Tween(thing, group)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onStart(() => {
        if (scope != null) {
          group[scope]?.stop()
          group[scope] = tween
        }
      })
      .onStop(() => {
        if (scope != null) group[scope] = null
        if (typeof stop === 'function') stop()
        if (typeof done === 'function') done()
      })
      .onComplete(() => {
        if (scope != null) group[scope] = null
        if (typeof complete === 'function') complete()
        if (typeof done === 'function') done()
        this.emit('change')
      })

    this.resume()

    return tween
  }

  fadeOut(thing, duration = FADE_DURATION) {
    if (thing == null) return
    thing.eventMode = 'none'
    this
      .animate(thing, null, { gid: 1, done: () => thing.destroy() })
      .to({ alpha: 0 }, duration)
      .start()
  }

  filter(next, { duration = 0, ...opts } = {}) {
    if (duration > 0) {
      let { photo } = this

      photo.filter({
        ...photo.current,
        negative: next.negative
      })

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
    this.tweens[0].rotate?.stop()

    let { photo } = this
    let rotation = rad(angle)

    mirror = mirror ?? photo.mirror
    zoom = zoom ?? photo.scale.y

    if (deg(photo.rotation) === (angle % 360))
      return opts.done?.()

    if (duration > 0) {
      let current = {
        rotation: photo.rotation,
        zoom: photo.scale.y
      }

      let next = {
        rotation,
        zoom
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

    setScaleMode(bg.texture, zoom)

    let current = {
      x: position.x,
      y: position.y,
      zoom: scale.y
    }

    let next = this.constrain({
      x: position.x + dx - dx * dz,
      y: position.y + dy - dy * dz,
      zoom
    }, { zoom })

    this
      .animate(current, 'zoom', opts)
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
    let modifier = event.shiftKey ? 'SHIFT' : isMeta(event) ? 'META' : null

    if (this.isDoubleClick(tool)) {
      let { x, y, shift } = coords(data.originalEvent)
      return this.emit(`zoom-${shift ? 'out' : 'in'}`, { x, y }, true)
    }

    target.cursor = `${tool}-active`

    this.drag.start()
    this.drag.current = {
      data,
      modifier,
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
      case ESPER.TOOL.PAN:
        this.handlePanMove()
        break
      case ESPER.TOOL.ARROW:
      case ESPER.TOOL.SELECT:
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
        case ESPER.TOOL.PAN:
          this.handlePanStop()
          break
        case ESPER.TOOL.ARROW:
        case ESPER.TOOL.SELECT:
          this.handleSelectStop()
          break
        case ESPER.TOOL.ZOOM_IN:
          this.emit('zoom-in', origin.mov, false)
          break
        case ESPER.TOOL.ZOOM_OUT:
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
    let { data, modifier, target, selection, tool } = this.drag.current
    let { x, y } = data.getLocalPosition(target)
    selection.width = x - selection.x
    selection.height = y - selection.y

    switch (tool) {
      case ESPER.TOOL.ARROW:
        this.emit('select-text', selection, modifier)
        break
    }
  }

  handleSelectStop() {
    let { modifier, selection, tool } = this.drag.current
    selection = normalizeRectangle(selection, true)

    switch (tool) {
      case ESPER.TOOL.ARROW:
        this.emit('select-text', selection, modifier)
        break
      case ESPER.TOOL.SELECT:
        if (selection.width && selection.height)
          this.emit('selection-create', selection)
        break
    }
  }

  handleWheel = (event) => {
    event.stopPropagation()

    let { x, y, dy, dx, ctrl, pinch } = coords(event)

    let modifier = (event.shiftKey) ?
      ZOOM_WHEEL_FACTOR / ZOOM_MODIFIER :
      ZOOM_WHEEL_FACTOR

    if (ctrl) {
      // Chromium maps vertical to horizontal scrolling for
      // some devices with Cmd/Ctrl + Shift!
      if (event.shiftKey && dy === 0) dy = dx

      if (pinch) dy = Math.round(dy * ZOOM_PINCH_BOOST)

      this.emit('wheel-zoom', {
        x,
        y,
        by: dy * modifier
      })

    } else {
      this.emit('wheel-pan', {
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
