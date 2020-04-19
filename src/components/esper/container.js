'use strict'

const React = require('react')
const debounce = require('lodash.debounce')
const throttle = require('lodash.throttle')
const cx = require('classnames')
const { Esper } = require('../../esper')
const { EsperToolbar } = require('./toolbar')
const { EsperPanel } = require('./panel')
const { get, restrict, shallow } = require('../../common/util')
const { Cache } = require('../../common/cache')
const { isHorizontal, rotate, round } = require('../../common/math')
const { Rotation } = require('../../common/iiif')
const { on, off } = require('../../dom')
const { match } = require('../../keymap')
const { assign } = Object
const { floor, min } = Math

const {
  arrayOf, bool, func, number, object, shape, string
} = require('prop-types')

const { TABS } = require('../../constants')
const { TOOL, MODE } = require('../../constants/esper')

const {
  ESPER: {
    MAX_ZOOM,
    MIN_ZOOM,
    PAN_DURATION,
    PAN_STEP_SIZE,
    ROTATE_DURATION,
    SYNC_DURATION,
    ZOOM_DURATION,
    ZOOM_STEP_SIZE,
    ZOOM_PRECISION
  }
} = require('../../constants/sass')

const IMAGE_PARAMS = [
  'brightness',
  'contrast',
  'hue',
  'negative',
  'saturation',
  'sharpen'
]

class EsperContainer extends React.PureComponent {

  #IO = new IntersectionObserver(([el]) => {
    requestIdleCallback(
      this[`handleSlide${el.intersectionRatio > 0 ? 'In' : 'Out'}`]
    )
  }, { threshold: [0] })

  #RO = new ResizeObserver(([el]) => {
    this.handleResize(el.contentRect)
  })

  container = React.createRef()
  view = React.createRef()

  state = this.getEmptyState(this.props)

  componentDidMount() {
    this.esper = new Esper()
    this.esper
      .on('change', this.handleViewChange)
    // .on('photo.error', this.handlePhotoError)
    // .on('loader.error', this.handleLoadError)
      .on('selection-activate', this.handleSelectionActivate)
      .on('selection-create', this.handleSelectionCreate)
      .on('wheel.zoom', this.handleWheelZoom)
      .on('wheel.pan', this.handleWheelPan)
      .on('zoom-in', this.handleZoomIn)
      .on('zoom-out', this.handleZoomOut)
      .mount(this.view.current)

    this.#RO.observe(this.view.current)
    this.#IO.observe(this.view.current)


    on(this.container.current, 'tab:focus', this.handleTabFocus)

    this.setState(this.getStateFromProps(), () => {
      this.esper.reset(this.state)
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selection !== this.props.selection ||
      prevProps.selections !== this.props.selections ||
      prevProps.tool !== this.props.tool) {
      this.esper.photo?.sync(this.props)
    }
  }

  componentWillUnmount() {
    this.#IO.disconnect()
    this.#RO.disconnect()

    this.persist.flush()
    this.update.flush()

    off(this.container.current, 'tab:focus', this.handleTabFocus)

    this.esper.destroy()
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (!shallow(props, this.props)) {
      const state = this.getStateFromProps(props)

      switch (true) {
        case (this.shouldViewReset(props, state)):
          state.quicktool = null
          this.esper.reset(state)
          break
        case (this.shouldViewSync(props, state)):
          this.esper.sync(state, SYNC_DURATION)
          break
      }

      if (this.shouldToolReset(props)) {
        this.handleToolChange(EsperContainer.defaultProps.tool)
      }

      this.setState(state)
    }
  }

  shouldViewReset(props, state) {
    return (state.src !== this.state.src) ||
      hasPhotoChanged(props.photo, this.props.photo)
  }

  shouldViewSync(props, state) {
    return (props.selection !== this.props.selection) ||
      !shallow(state, this.state, ['angle', 'mirror', ...IMAGE_PARAMS])
  }

  shouldToolReset(props) {
    if (props.selection == null) return false
    if (props.tool !== TOOL.SELECT) return false
    return true
  }

  get classes() {
    return {
      'overlay-mode': this.props.hasOverlayToolbar,
      'panel-visible': this.props.isPanelVisible,
      'tab-focus': this.state.hasTabFocus
    }
  }

  get isEmpty() {
    return this.props.photo == null || this.props.photo.pending === true
  }

  get isDisabled() {
    return this.props.isDisabled || this.isEmpty || !this.state.isVisible
  }

  get isSelectionActive() {
    return this.props.selection != null
  }

  get tabIndex() {
    return (this.props.isItemOpen) ? this.props.tabIndex : -1
  }

  getActiveImageId() {
    return get(this.props.selection, ['id']) || get(this.props.photo, ['id'])
  }

  getEmptyState(props = this.props) {
    return {
      mode: props.mode,
      zoom: props.zoom,
      minZoom: props.minZoom / (this.esper?.dpx || 1),
      width: 0,
      height: 0,
      src: null,
      x: props.x,
      y: props.y,
      hasTransformations: false,
      ...this.getOriginalPhotoState(props)
    }
  }

  getStateFromProps(props = this.props) {
    const state = this.getEmptyState(props)
    const { photo, selection } = props
    const { screen } = this.esper.app

    if (photo != null && !photo.pending) {
      const image = selection || photo

      assign(state, {
        photo: photo.id,
        src: Cache.url(props.cache, 'full', photo),
        width: photo.width,
        height: photo.height
      })

      if (image.angle !== 0) {
        state.hasTransformations = true
        state.angle = (state.angle + image.angle) % 360
      }

      for (let prop of ['mirror', ...IMAGE_PARAMS]) {
        if (state[prop] !== image[prop]) {
          state.hasTransformations = true
          state[prop] = image[prop]
        }
      }
    }

    if (state.x == null || state.mode !== 'zoom') {
      state.x = screen.width / 2
    }

    if (state.y == null || state.mode === 'fit') {
      state.y = screen.height / 2
    }

    assign(state, this.getZoomBounds(screen, state, props))

    return state
  }

  getZoomToFill(screen, { width } = this.state, props = this.props) {
    return round(min(props.maxZoom, screen.width / width), ZOOM_PRECISION)
  }

  getZoomToFit(
    screen,
    { width, height } = this.state,
    { minZoom } = this.props
  ) {
    return round(
      min(minZoom / this.esper.dpx,
        min(screen.width / width, screen.height / height)
    ), ZOOM_PRECISION)
  }

  getZoomBounds(
    screen = this.esper.app.screen,
    state = this.state,
    props = this.props
  ) {
    let { angle, zoom, width, height } = state
    let minZoom = props.minZoom / this.esper.dpx
    let zoomToFill = minZoom

    if (width > 0 && height > 0) {
      if (!isHorizontal(angle)) {
        [width, height] = [height, width]
      }

      minZoom = this.getZoomToFit(screen, { width, height }, props)
      zoomToFill = this.getZoomToFill(screen, { width }, props)

      switch (state.mode) {
        case 'fill':
          zoom = zoomToFill
          break
        case 'fit':
          zoom = minZoom
          break
      }

      if (minZoom > zoom) zoom = minZoom
    }

    return { minZoom, zoom, zoomToFill }
  }

  getImageState() {
    const { x, y, zoom } = this.state
    return this.wrapImageState({
      x: round(x),
      y: round(y),
      zoom
    })
  }

  wrapImageState(state) {
    const id = this.getActiveImageId()
    return (id == null) ? null : { [id]: state }
  }

  getPhotoState() {
    const id = this.getActiveImageId()
    const { angle, mirror } = this.getRelativeRotation()
    const {
      brightness, contrast, hue, negative, saturation, sharpen
    } = this.state

    return (id == null) ? null : {
      id,
      data: {
        angle, brightness, contrast, hue, mirror, negative, saturation, sharpen
      }
    }
  }

  getOrientationState({ angle, mirror }, orientation) {
    return Rotation
      .fromExifOrientation(orientation)
      .add({ angle, mirror })
      .toJSON()
  }

  getOriginalPhotoState({ photo } = this.props) {
    const state = {
      angle: 0,
      brightness: 0,
      contrast: 0,
      hue: 0,
      negative: false,
      mirror: false,
      saturation: 0,
      sharpen: 0
    }

    if (photo != null) {
      assign(state, this.getOrientationState(state, photo.orientation))
    }

    return state
  }

  getRelativeRotation(
    { angle, mirror } = this.state,
    orientation = this.props.photo.orientation
  ) {
    return new Rotation({ angle, mirror })
      .subtract(Rotation.fromExifOrientation(orientation))
  }

  handleSlideIn = () => {
    this.setState({ isVisible: true })
    this.esper.resume()
  }

  handleSlideOut = () => {
    this.setState({ isVisible: false })
    this.esper.stop()
    this.esper.stop.flush()
  }

  handleResize = throttle((rect) => {
    this.resize(rect)
  }, 50)

  resize = ({ width, height }) => {
    width = round(width || this.esper.app.screen.width)
    height = round(height || this.esper.app.screen.height)

    let { minZoom, zoom, zoomToFill } = this.getZoomBounds({ width, height })

    this.esper.resize({
      width, height, zoom, mirror: this.state.mirror
    })

    this.setState({ minZoom, zoom, zoomToFill })
  }

  persist = debounce(() => {
    this.props.onChange({
      [this.isSelectionActive ? 'selection' : 'photo']: this.getPhotoState()
    })
  }, 650)

  update = debounce(() => {
    this.props.onChange({ image: this.getImageState() })
  }, 650)

  pan({ x = 0, y = 0 }, animate) {
    this.handlePositionChange({
      x: this.state.x + floor(x),
      y: this.state.y + floor(y)
    }, animate)
  }

  zoom(by, animate) {
    this.handleZoomChange({ zoom: this.state.zoom + by }, animate)
  }

  handleRevertToOriginal = () => {
    const { photo } = this.props
    if (photo == null) return

    const state = {
      ...this.getOriginalPhotoState(),
      width: photo.width,
      height: photo.height,
      zoom: this.state.zoom
    }

    assign(state, this.getZoomBounds(this.esper.app.screen, state))

    this.setState(state)

    this.esper.rotate(state, ROTATE_DURATION)
    this.esper.scale(state, ROTATE_DURATION)
    this.esper.adjust(state)

    this.persist()
    this.container.current.focus()
  }

  handleRotationChange = (by) => {
    const state = {
      ...this.state,
      angle: rotate(this.state.angle, by),
      width: this.props.photo.width,
      height: this.props.photo.height
    }

    assign(state, this.getZoomBounds(this.esper.app.screen, state))

    this.setState(state, () => {
      this.esper.rotate(state, ROTATE_DURATION, by > 0)
      this.esper.scale(state, ROTATE_DURATION)
      this.persist()
    })
  }

  handleZoomChange = ({ x, y, zoom }, animate) => {
    zoom = restrict(zoom, this.state.minZoom, this.props.maxZoom)
    const mode = MODE.ZOOM

    this.setState({ zoom, mode })
    this.esper.scale({
      zoom, mirror: this.state.mirror
    }, animate ? ZOOM_DURATION : 0, { x, y })

    this.props.onChange({ image: this.wrapImageState({ mode }) })
  }

  handlePositionChange(position, animate) {
    if (this.state.mode === 'fit') return

    this.setState(position)
    this.esper.move(position, animate ? PAN_DURATION : 0)
  }

  handleMirrorChange = () => {
    let { angle, zoom, mirror } = this.state

    mirror = !mirror

    if (!isHorizontal(angle)) angle = rotate(angle, 180)

    this.setState({ angle, mirror })

    this.esper.scale({ zoom, mirror })
    this.esper.rotate({ angle })
    this.persist()
  }

  handleModeChange = (mode) => {
    let { minZoom, mirror, zoom, zoomToFill  } = this.state

    switch (mode) {
      case MODE.FILL:
        zoom = zoomToFill
        break
      case MODE.FIT:
        zoom = minZoom
        break
    }

    this.setState({ zoom, mode })
    this.esper.scale({ zoom, mirror }, ZOOM_DURATION)

    this.props.onChange({ image: this.wrapImageState({ mode }) })
  }

  handleToolChange = (tool) => {
    this.esper.tool = tool
    this.props.onChange({ esper: { tool } })
  }

  handlePanelChange = (panel = !this.props.isPanelVisible) => {
    this.props.onChange({ esper: { panel } })
  }

  handleColorChange = (opts) => {
    this.setState(opts, () => {
      this.esper.adjust(this.state)
      this.persist()
    })
  }

  handleWheelPan = ({ x, y }) => {
    this.pan({
      x: this.props.invertScroll ? -x : x,
      y: this.props.invertScroll ? -y : y
    })
  }

  handleWheelZoom = ({ x, y, by }) => {
    this.handleZoomChange({
      x,
      y,
      zoom: this.state.zoom + (this.props.invertZoom ? -by : by)
    })
  }

  handleZoomIn = ({ x, y } = {}, animate = false) => {
    this.handleZoomChange({
      x, y, zoom: this.state.zoom + ZOOM_STEP_SIZE
    }, animate)
  }

  handleZoomOut = ({ x, y } = {}, animate = false) => {
    this.handleZoomChange({
      x, y, zoom: this.state.zoom - ZOOM_STEP_SIZE
    }, animate)
  }

  handleSelectionActivate = (selection) => {
    const { photo } = this.props
    this.props.onSelect({
      photo: photo.id,
      item: photo.item,
      selection: selection.id,
      note: selection.notes[0]
    })
  }

  handleSelectionCreate = (selection) => {
    const { angle, mirror } = this.getRelativeRotation()

    this.props.onSelectionCreate({
      photo: this.props.photo.id,
      angle,
      mirror,
      ...selection
    })
  }

  handleViewChange = (state) => {
    state.zoom = round(state.zoom, ZOOM_PRECISION)
    this.setState(state, this.update)
  }


  handleKeyDown = (event) => {
    if (this.state.quicktool != null) {
      this.handleQuickToolKeyDown(event)
    } else {
      switch (match(this.props.keymap, event)) {
        case 'zoomIn':
          this.handleZoomIn()
          break
        case 'zoomOut':
          this.handleZoomOut()
          break
        case 'zoomToFit':
          this.handleModeChange(MODE.FIT)
          break
        case 'zoomToFill':
          this.handleModeChange(MODE.FILL)
          break
        case 'rotateLeft':
          this.handleRotationChange(-90)
          break
        case 'rotateRight':
          this.handleRotationChange(90)
          break
        case 'up':
          this.pan({ y: PAN_STEP_SIZE * this.state.zoom })
          break
        case 'down':
          this.pan({ y: -PAN_STEP_SIZE * this.state.zoom })
          break
        case 'left':
          this.pan({ x: PAN_STEP_SIZE * this.state.zoom })
          break
        case 'right':
          this.pan({ x: -PAN_STEP_SIZE * this.state.zoom })
          break
        case 'panel':
          this.handlePanelChange()
          break
        case 'quicktool':
          this.setState({ quicktool: TOOL.PAN })
          break
        default:
          return
      }
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  handleKeyUp = (event) => {
    if (this.state.quicktool != null) {
      this.handleQuickToolKeyUp(event)
    }
  }

  handleQuickToolKeyDown({ ctrlKey, metaKey, altKey }) {
    switch (this.state.quicktool) {
      case TOOL.PAN:
        if (ctrlKey || metaKey) {
          this.setState({ quicktool: altKey ? TOOL.ZOOM_OUT : TOOL.ZOOM_IN })
        }
        break
      case TOOL.ZOOM_IN:
        if (altKey) {
          this.setState({ quicktool: TOOL.ZOOM_OUT })
        }
        break
    }
  }

  // Subtle: On macOS pressing the cmd key suppresses all repeats
  // on key-down and all key-up events. To work around this, we clear
  // everything on key-up of cmd/ctrl or by default. The only valid
  // state without cmd/ctrl is just the space key, which will continue
  // to repeat as soon as cmd/ctrl are released, so the quicktool
  // will be initialized straight away on keydown.
  handleQuickToolKeyUp({ key, ctrlKey, metaKey }) {
    switch (key) {
      case ' ':
      case 'Meta':
      case 'Control':
        this.setState({ quicktool: null })
        break
      case 'Alt':
        if (this.state.quicktool === TOOL.ZOOM_OUT) {
          this.setState({ quicktool: TOOL.ZOOM_IN })
        }
        break
      default:
        if (!(ctrlKey || metaKey)) {
          this.setState({ quicktool: null })
        }
        break
    }
  }

  handleContextMenu = (event) => {
    if (!this.isDisabled) {
      this.props.onContextMenu(event, 'esper')
    }
  }

  handleMouseDown = () => {
    if (document.activeElement !== this.container.current) {
      this.container.current.focus()
    }
  }

  handleMouseMove = () => {
    this.esper.resume()
  }

  handleTabFocus = () => {
    this.setState({ hasTabFocus: true })
  }

  handleBlur = () => {
    this.setState({ hasTabFocus: false })
  }


  render() {
    const { isDisabled, isSelectionActive, tabIndex } = this
    const tool = this.state.quicktool || this.props.tool

    if (this.esper) {
      this.esper.tool = tool
    }

    return (
      <section
        ref={this.container}
        tabIndex={tabIndex}
        className={cx('esper', tool, this.classes)}
        onBlur={this.handleBlur}
        onContextMenu={this.handleContextMenu}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}>
        <header className="esper-header">
          <EsperToolbar
            isDisabled={isDisabled}
            isSelectionActive={isSelectionActive}
            isPanelVisible={this.props.isPanelVisible}
            mode={this.state.mode}
            tool={tool}
            resolution={this.esper?.dpx || 1}
            zoom={this.state.zoom}
            minZoom={this.state.minZoom}
            maxZoom={this.props.maxZoom}
            onMirrorChange={this.handleMirrorChange}
            onModeChange={this.handleModeChange}
            onPanelChange={this.handlePanelChange}
            onToolChange={this.handleToolChange}
            onRotationChange={this.handleRotationChange}
            onZoomChange={this.handleZoomChange}/>
        </header>
        <div className="esper-view-container">
          <div className="esper-view" ref={this.view}/>
          <EsperPanel
            brightness={this.state.brightness}
            canRevert={this.state.hasTransformations}
            contrast={this.state.contrast}
            hue={this.state.hue}
            negative={this.state.negative}
            saturation={this.state.saturation}
            sharpen={this.state.sharpen}
            gamma={this.state.gamma}
            isDisabled={isDisabled}
            isVisible={this.props.isPanelVisible}
            onChange={this.handleColorChange}
            onRevert={this.handleRevertToOriginal}/>
        </div>
      </section>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    hasOverlayToolbar: bool,
    invertScroll: bool.isRequired,
    invertZoom: bool.isRequired,
    isDisabled: bool,
    isItemOpen: bool.isRequired,
    isPanelVisible: bool.isRequired,
    keymap: object.isRequired,
    maxZoom: number.isRequired,
    minZoom: number.isRequired,
    mode: string.isRequired,
    onContextMenu: func.isRequired,
    onChange: func.isRequired,
    onPhotoError: func.isRequired,
    onSelect: func.isRequired,
    onSelectionCreate: func.isRequired,
    photo: object,
    tabIndex: number.isRequired,
    tool: string.isRequired,
    selection: object,
    selections: arrayOf(shape({
      id: number.isRequired,
      height: number.isRequired,
      width: number.isRequired,
      x: number.isRequired,
      y: number.isRequired
    })).isRequired,
    x: number,
    y: number,
    zoom: number.isRequired
  }

  static defaultProps = {
    maxZoom: MAX_ZOOM,
    minZoom: MIN_ZOOM,
    tabIndex: TABS.Esper,
    tool: TOOL.ARROW,
    zoom: 1
  }
}

const hasPhotoChanged = (c, p) =>
  c != null && p != null && (c.id !== p.id || (
    c.consolidated && (!p.consolidated || c.consolidated > p.consolidated)
  ))

module.exports = {
  EsperContainer
}
