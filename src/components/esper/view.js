'use strict'

const React = require('react')
const { array, func, number, object, string } = require('prop-types')

const {
  bounds,
  createDragHandler,
  on,
  off
} = require('../../dom')

const { restrict } = require('../../common/util')
const { darwin } = require('../../common/os')
const { rad } = require('../../common/math')
const { constrain, Picture } = require('./picture')
const { Selection  } = require('./selection')
const TWEEN = require('@tweenjs/tween.js')
const { TOOL } = require('../../constants/esper')
const debounce = require('lodash.debounce')
const { PI, floor, round } = Math
const { Esper, setScaleMode } = require('../../esper')

const {
  ESPER: { FADE_DURATION }
} = require('../../constants/sass')


class EsperView extends React.Component {
  componentDidMount() {
    const { width, height } = bounds(this.container)

    this.tweens = new TWEEN.Group()

    this.esper = new Esper({
      resolution: this.props.resolution,
      width,
      height
    })

    this.esper.on('load.error', this.handleLoadError)
    this.esper.on('load', this.handleLoadProgress)
    this.esper.on('tick', this.update)

    this.esper.mount(this.container)

    on(this.container, 'wheel', this.handleWheel, { passive: true })
  }

  componentWillUnmount() {
    this.stop.flush()
    this.tweens.removeAll()
    this.esper.destroy()
    off(this.container, 'wheel', this.handleWheel, { passive: true })
    if (this.drag.current) this.drag.stop()
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (this.image != null) {
      this.image.overlay.sync(props)
      this.image.selections.sync(props)
      this.image.cursor = props.tool
      this.esper.render()
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
    this.esper.start()
  }

  stop = debounce(() => {
    this.esper.stop()
  }, 5000)

  resume = () => {
    this.start()
    this.stop()
  }

  get resolution() {
    return this.esper.app.renderer.resolution
  }

  get screen() {
    return this.esper.app.screen
  }

  get isStarted() {
    return !!this.esper.app.ticker.started
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
        let texture = await this.esper.load(props.src)

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

      setScaleMode(this.image.bg.texture, zoom)
      this.image.scale.x = mirror ? -zoom : zoom
      this.image.scale.y = zoom

      this.image.position.set(x, y)
      this.image.constrain(this.screen)
      this.image.cursor = props.tool

      this.esper.app.stage.addChildAt(this.image, 0)
      this.persist()
      this.esper.render()
    }
  }

  sync(props, duration = 0) {
    if (this.image == null) return

    const { angle, mirror, x, y, zoom } = props
    const { position, scale } = this.image

    setScaleMode(this.image.bg.texture, zoom)
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

  resize({ width, height, zoom, mirror }) {
    width = round(width)
    height = round(height)

    this.esper.app.renderer.resize(width, height)
    this.esper.render()

    if (this.image == null || zoom == null) return

    this.image.constrain({ width, height }, zoom)
    setScaleMode(this.image.bg.texture, zoom)
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

    setScaleMode(bg.texture, zoom)

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
      let cur = this.image.rotation
      let tgt = rad(angle)
      let tmp = tgt

      // To maintain rotation orientation during the transition,
      // we need to keep temporary values exceeding [0, 2π], because
      // a single animation can go round the circle many times.
      // For clockwise rotation we always need to count upwards;
      // downwards for counter-clockwise rotations.
      if (clockwise) {
        while (tmp < cur) tmp += (2 * PI)
      } else {
        while (tmp > cur) tmp -= (2 * PI)
      }

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
      this.esper.render()
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
    this.esper.render()
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
      this.esper.app.renderer.resolution = resolution
      this.esper.app.renderer.plugins.interaction.resolution = resolution

      if (this.esper.app.renderer.rootRenderTarget) {
        this.esper.app.renderer.rootRenderTarget.resolution = resolution
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

module.exports = {
  EsperView
}
