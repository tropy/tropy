'use strict'

const React = require('react')
const { array, func, number, object, string } = require('prop-types')

const {
  append,
  bounds,
  createDragHandler,
  on,
  off
} = require('../../dom')

const css = require('../../css')
const { restrict } = require('../../common/util')
const { darwin } = require('../../common/os')
const { rad } = require('../../common/math')
const { info } = require('../../common/log')
const PIXI = require('pixi.js')
const { TextureCache, skipHello } = PIXI.utils
const { constrain, Picture } = require('./picture')
const { Selection  } = require('./selection')
const TWEEN = require('@tweenjs/tween.js')
const { TOOL } = require('../../constants/esper')
const debounce = require('lodash.debounce')
const { PI, floor, round } = Math

const {
  ESPER: {
    CURSOR,
    FADE_DURATION,
    ZOOM_LINEAR_MAX
  }
} = require('../../constants/sass')

PIXI.settings.RETINA_PREFIX = /@2x!/

class EsperView extends React.Component {
  componentDidMount() {
    const { width, height } = bounds(this.container)

    this.tweens = new TWEEN.Group()

    skipHello()

    this.pixi = new PIXI.Application({
      antialias: false,
      forceCanvas: !ARGS.webgl,
      roundPixels: false,
      resolution: this.props.resolution,
      transparent: true,
      width,
      height
    })

    this.pixi.loader.onError.add(this.handleLoadError)
    this.pixi.loader.onLoad.add(this.handleLoadProgress)
    this.pixi.ticker.add(this.update)
    this.pixi.renderer.autoResize = true

    for (let name in TOOL) {
      addCursorStyle(
        this.pixi.renderer.plugins.interaction.cursorStyles, TOOL[name]
      )
    }

    append(this.pixi.view, this.container)

    on(this.container, 'wheel', this.handleWheel, { passive: true })

    info(`esper using ${
      this.pixi.renderer instanceof PIXI.WebGLRenderer ? 'webgl' : 'canvas'
    } renderer`)
  }

  componentWillUnmount() {
    this.stop.flush()
    this.tweens.removeAll()
    this.pixi.destroy(true)
    off(this.container, 'wheel', this.handleWheel, { passive: true })
    if (this.drag.current) this.drag.stop()
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (this.image != null) {
      this.image.overlay.sync(props)
      this.image.selections.sync(props)
      this.image.cursor = props.tool
      this.pixi.render()
    }

    if (props.resolution !== this.resolution) {
      this.handleResolutionChange(props.resolution)
    }
  }

  shouldComponentUpdate() {
    return false
  }

  start = () => {
    this.stop.cancel()
    this.pixi.start()
  }

  stop = debounce(() => {
    this.pixi.stop()
  }, 5000)

  resume = () => {
    this.start()
    this.stop()
  }

  get resolution() {
    return this.pixi.renderer.resolution
  }

  get screen() {
    return this.pixi.screen
  }

  get isStarted() {
    return !!this.pixi.ticker.started
  }

  get isDragging() {
    return this.drag.current != null
  }

  getInnerBounds(...args) {
    return this.image.getInnerBounds(this.screen, ...args)
  }

  isDoubleClick(time = Date.now(), threshold = 350) {
    try {
      return this.isDoubleClickSupported() &&
        (time - this.lastClickTime) <= threshold
    } finally {
      this.lastClickTime = time
    }
  }

  isDoubleClickSupported(tool = this.props.tool) {
    return tool === TOOL.PAN || tool === TOOL.ARROW
  }

  async reset(props) {
    this.fadeOut(this.image)
    this.image = null

    if (props.src != null) {
      let image = this.image = new Picture(props)

      try {
        let texture = await this.load(props.src)

        // Subtle: if the view was reset while we were loading
        // the texture, abort!
        if (this.image !== image) return

        this.image = new Picture(props)
        this.image.bg.texture =  texture
        this.image.interactive = true
        this.image.on('mousedown', this.handleMouseDown)

      } catch (_) {
        this.props.onPhotoError(props.photo)
      }

      this.adjust(props)
      this.rotate(props)
      let { mirror, x, y, zoom } = props

      this.setScaleMode(this.image.bg.texture, zoom)
      this.image.scale.x = mirror ? -zoom : zoom
      this.image.scale.y = zoom

      this.image.position.set(x, y)
      this.image.constrain(this.screen)
      this.image.cursor = props.tool

      this.pixi.stage.addChildAt(this.image, 0)
      this.persist()
      this.pixi.render()
    }
  }

  sync(props, duration = 0) {
    if (this.image == null) return

    const { angle, mirror, x, y, zoom } = props
    const { position, scale } = this.image

    this.setScaleMode(this.image.bg.texture, zoom)
    this.adjust(props)

    const zx = mirror ? -1 : 1
    const next = constrain({ x, y, zoom }, this.getInnerBounds(zoom))

    // TODO fixate, change pivot and rotate after move and scale!
    this.image.scale.x = scale.y * zx
    this.image.rotation = rad(angle)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'sync', { complete: this.persist })
      .to(next, duration * 0.67)
      .onUpdate(m => {
        this.image.scale.x = m.zoom * zx
        this.image.scale.y = m.zoom
        this.image.x = m.x
        this.image.y = m.y
      })
      .start()
  }


  makeInteractive(sprite) {
    if (sprite == null || sprite.interactive) return
  }

  setScaleMode(texture, zoom, renderer = this.pixi.renderer) {
    if (texture == null) return

    let { baseTexture } = texture
    let crisp = (zoom > ZOOM_LINEAR_MAX) || (zoom === 1)
    let scaleMode = crisp ?
      PIXI.SCALE_MODES.NEAREST :
      PIXI.SCALE_MODES.LINEAR

    if (baseTexture.scaleMode !== scaleMode) {
      baseTexture.scaleMode = scaleMode

      // HACK: Updating scale mode dynamically is broken in Pixi v4.
      // See Pixi #4096.
      let glTexture = baseTexture._glTextures[renderer.CONTEXT_UID]

      if (glTexture) {
        glTexture.bind()
        glTexture[`enable${crisp ? 'Nearest' : 'Linear'}Scaling`]()
      }
    }
  }

  resize({ width, height, zoom, mirror }) {
    width = round(width)
    height = round(height)

    this.pixi.renderer.resize(width, height)
    this.pixi.render()

    if (this.image == null || zoom == null) return

    this.image.constrain({ width, height }, zoom)
    this.setScaleMode(this.image.bg.texture, zoom)
    this.image.scale.set(mirror ? -zoom : zoom, zoom)
    this.persist()
    this.resume()
  }

  move({ x, y }, duration = 0) {
    const { position } = this.image
    const next = constrain({ x, y }, this.getInnerBounds())

    if (equal(position, next)) return

    this
      .animate(position, 'move', { complete: this.persist })
      .to(next, duration)
      .start()
  }

  scale({ mirror, zoom }, duration = 0, { x, y } = {}) {
    const { scale, position, bg } = this.image
    const { screen } = this

    const zx = mirror ? -1 : 1
    const dz = zoom / scale.y

    x = x == null ? screen.width / 2 : x
    y = y == null ? screen.height / 2 : y

    const dx = (x - position.x)
    const dy = (y - position.y)

    const next = constrain({
      x: position.x + dx - dx * dz,
      y: position.y + dy - dy * dz,
      zoom
    }, this.getInnerBounds(zoom))

    this.setScaleMode(bg.texture, zoom)

    this
      .animate({
        x: position.x,
        y: position.y,
        zoom: scale.y
      }, 'zoom', { complete: this.persist })
      .to(next, duration)
      .onUpdate(m => {
        this.image.scale.x = m.zoom * zx
        this.image.scale.y = m.zoom
        this.image.x = m.x
        this.image.y = m.y
      })
      .start()
  }

  rotate({ angle }, duration = 0, clockwise = false) {
    if (duration > 0) {
      const cur = this.image.rotation
      const tgt = rad(angle)

      // Maintain rotation orientation when transitioning between 0 and value
      const clockwiseTmp = (tgt < cur) ? 2 * PI : tgt
      const counterTmp = (tgt > cur) ? cur - (2 * PI - tgt) : tgt
      const tmp = clockwise ? clockwiseTmp : counterTmp

      this.animate(this.image, 'rotate', {
        done: () => {
          this.image.rotation = tgt
          this.persist()
        }
      })
        .to({ rotation: tmp }, duration)
        .start()

    } else {
      this.image.rotation = rad(angle)
      this.pixi.render()
    }
  }

  adjust({ brightness, contrast, hue, negative, saturation, sharpen }) {
    this.image
      .brightness(brightness)
      .contrast(contrast)
      .hue(hue)
      .negative(negative)
      .saturation(saturation)
      .sharpen(sharpen)
    this.pixi.render()
  }

  fadeOut(thing, duration = FADE_DURATION) {
    if (thing == null) return
    thing.interactive = false
    // if (!this.isStarted) return thing.destroy()
    this
      .animate(thing, null, { done: () => thing.destroy() })
      .to({ alpha: 0 }, duration)
      .start()
  }

  animate(thing, scope, { stop, complete, done } = {}) {
    const tween = new TWEEN.Tween(thing, this.tweens)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onStart(() => {
        if (scope != null) {
          const current = this.tweens[scope]
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
    if (this.image == null) return

    if (this.image.selections.visible) {
      this.image.selections.update(this.drag.current)
    }

    if (this.image.overlay.visible) {
      this.image.overlay.update()
    }
  }

  persist = () => {
    this.props.onChange({
      x: this.image.x,
      y: this.image.y,
      zoom: this.image.scale.y
    })

    this.handleResolutionChange()
  }

  setContainer = (container) => {
    this.container = container
  }

  handleResolutionChange(resolution = this.props.resolution) {
    let { image } = this

    // On low-res screens, we render at 2x resolution
    // when zooming out to improve quality. See #218
    if (resolution < 2 && image != null && image.scale.y < 1) {
      resolution = 2
    }

    if (resolution !== this.resolution) {
      this.pixi.renderer.resolution = resolution
      this.pixi.renderer.plugins.interaction.resolution = resolution

      if (this.pixi.renderer.rootRenderTarget) {
        this.pixi.renderer.rootRenderTarget.resolution = resolution
      }

      if (image != null) {
        image.handleResolutionChange(resolution)
      }

      this.resize(bounds(this.container))
    }
  }

  handleLoadProgress = () => {
  }

  handleLoadError = (loader, resource) => {
    if (this.props.onLoadError) {
      this.props.onLoadError({ resource })
    }
  }

  handleWheel = (e) => {
    e.stopPropagation()
    this.props.onWheel(coords(e))
    this.resume()
  }

  handleMouseDown = (event) => {
    const { data, target } = event

    if (this.isDragging) this.drag.stop()
    if (!data.isPrimary) return

    this.resume()

    if (target instanceof Selection) {
      return this.props.onSelectionActivate(target.data)
    }

    if (this.isDoubleClick()) {
      return this.props.onDoubleClick(coords(data.originalEvent))
    }

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
      limit: this.getInnerBounds()
    }
  }

  handleDragStop = (_, wasCancelled) => {
    try {
      if (this.isDragging) {
        const { origin, target, tool } = this.drag.current
        target.cursor = this.props.tool

        switch (tool) {
          case TOOL.ARROW:
          case TOOL.PAN:
            this.handlePanStop()
            break
          case TOOL.SELECT:
            this.handleSelectStop(wasCancelled)
            break
          case TOOL.ZOOM_IN:
            if (!wasCancelled) this.props.onZoomIn(origin.mov)
            break
          case TOOL.ZOOM_OUT:
            if (!wasCancelled) this.props.onZoomOut(origin.mov)
            break
        }
      }

    } finally {
      this.drag.current = undefined
    }
  }

  handleDrag = () => {
    if (this.isDragging) {
      switch (this.drag.current.tool) {
        case TOOL.ARROW:
        case TOOL.PAN:
          this.handlePanMove()
          break
        case TOOL.SELECT:
          this.handleSelectMove()
          break
      }
    }
  }

  handlePanMove() {
    const { data, limit, origin, target } = this.drag.current
    const { pos, mov } = origin
    const { top, right, bottom, left } = limit
    const { x, y } = data.getLocalPosition(target.parent)
    target.x = floor(restrict(pos.x + (x - mov.x), left, right))
    target.y = floor(restrict(pos.y + (y - mov.y), top, bottom))
  }

  handlePanStop() {
    this.persist()
  }

  handleSelectMove() {
    const { data, target } = this.drag.current
    const { selection } = this.drag.current
    const { x, y } = data.getLocalPosition(target)
    selection.width = x - selection.x
    selection.height = y - selection.y
  }

  handleSelectStop(wasCancelled) {
    let { x, y, width, height } = this.drag.current.selection

    if (wasCancelled || !width || !height) return
    if (this.props.selection != null) return

    if (width < 0) {
      x = x + width
      width = -width
    }

    if (height < 0) {
      y = y + height
      height = -height
    }

    this.props.onSelectionCreate({
      x: round(x),
      y: round(y),
      width: round(width),
      height: round(height)
    })
  }

  drag = createDragHandler(this)

  render() {
    return (
      <div ref={this.setContainer} className="esper-view"/>
    )
  }

  static propTypes = {
    resolution: number.isRequired,
    selection: object,
    selections: array.isRequired,
    tool: string.isRequired,
    onChange: func.isRequired,
    onDoubleClick: func.isRequired,
    onLoadError: func,
    onPhotoError: func.isRequired,
    onSelectionCreate: func.isRequired,
    onSelectionActivate: func.isRequired,
    onWheel: func.isRequired,
    onZoomIn: func.isRequired,
    onZoomOut: func.isRequired
  }
}


function coords(e) {
  return {
    x: e.offsetX,
    y: e.offsetY,
    dx: e.deltaX,
    dy: e.deltaY,
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    pinch: isPinchToZoom(e)
  }
}

function isPinchToZoom(e) {
  return darwin &&
    e.type === 'wheel' &&
    e.ctrlKey &&
    !(e.metaKey || e.shiftKey)
}

function equal(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y
}


function svg(name) {
  return [`${name}@1x.svg`, `${name}@2x.svg`]
}

function addCursorStyle(styles, name, cursor = CURSOR[name]) {
  if (cursor == null) return

  styles[name] = css.cursor(svg(cursor.default), cursor)
  styles[`${name}-active`] = css.cursor(svg(cursor.active), cursor)
}

module.exports = {
  EsperView
}
