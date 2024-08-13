import React from 'react'
import cx from 'classnames'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
import { Toolbar } from '../toolbar.js'
import { FILTERS } from '../../esper/index.js'
import { EsperContainer } from './container.js'
import { EsperError } from './error.js'
import { EsperHeader } from './header.js'
import * as ToolGroup from './tools.js'
import { EsperPanel } from './panel.js'
import { EsperOverlay } from './overlay.js'
import { EsperView } from './view.js'
import { pick, restrict } from '../../common/util.js'
import { Cache } from '../../common/cache.js'
import { isHorizontal, rotate, round } from '../../common/math.js'
import { addOrientation, subOrientation } from '../../common/iiif.js'
import { match } from '../../keymap.js'
import { getResolution } from '../../dom.js'
import { ESPER, SASS } from '../../constants/index.js'

const {
  TOOL,
  MODE
} = ESPER

const {
  MAX_ZOOM,
  MIN_WIDTH,
  MIN_HEIGHT,
  MIN_ZOOM,
  PAN_DURATION,
  PAN_STEP_SIZE,
  ROTATE_DURATION,
  ZOOM_DURATION,
  ZOOM_STEP_SIZE,
  ZOOM_PRECISION
} = SASS.ESPER


export class Esper extends React.Component {

  #lastImageChangeData

  container = React.createRef()
  view = React.createRef()

  state = {
    isTextureMissing: false,
    isTextureReady: false,
    isCompact: false,
    isVisible: false,
    over: false,
    quicktool: null,

    // Derived from props; constrained by photo/selection and resize
    minZoom: MIN_ZOOM,
    zoom: 1,
    zoomToFill: MIN_ZOOM,

    // Derived from photo/selection
    width: 0,
    height: 0,
    ...Esper.defaultImageProps
  }

  static getDerivedStateFromProps(props, prevState) {
    let id
    let src

    if (props.photo && !props.photo.pending) {
      id = props.selection?.id ?? props.photo.id
      src = Cache.url(props.cache, 'full', props.photo)
    }

    if (id === prevState.id && src === prevState.src)
      return null
    else
      return {
        ...prevState,
        quicktool: null,
        id,
        src,
        zoom: props.zoom || prevState.zoom,
        ...Esper.getDerivedImageStateFromProps(props)
      }
  }

  static getDerivedImageStateFromProps({ photo, selection }) {
    let image = selection || photo
    let state = { ...Esper.defaultImageProps }

    if (image != null) {
      for (let prop in Esper.defaultImageProps) {
        state[prop] = image[prop]
      }

      Object.assign(state, addOrientation(image, photo))
    }

    return state
  }

  // Subtle: we missappropriate shouldComponentUpdate to detect
  // changes to the active image that happen outside of Esper,
  // for example a rotation via context menu or an undo/redo.
  //
  // All the pertinent image props are in the derived state: but
  // the state acts like a buffer and may deviate when the image
  // is manipulated in Esper. Because we don't want props that
  // change because of manipulations in Esper to overwrite the
  // state (which may be ahead of the props). For this reason,
  // we need a way to detect changes image props which result from
  // actions outside of Esper. The suggested way to do this is
  // to derive all the values a second time so we can compare them
  // in `getDerivedStateFromProps`.
  //
  // We can't do this in componentDidUpdate because the prop
  // changes alone will not cause the component to update. We do
  // this here instead, so as not to pollute the state with
  // duplicates of all image props.

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.src !== nextState.src)
      return true // view going to reset anyway!
    if (this.state.id !== nextState.id)
      return true // view going to sync anyway!

    if (this.didImageChange(nextProps, nextState)) {
      let state = Esper.getDerivedImageStateFromProps(nextProps)
      let duration = !this.state.isVisible ? 0 : undefined // -> default

      this.esper.sync({
        ...nextProps,
        x: this.esper.x,
        y: this.esper.y
      }, { ...nextState, ...state }, duration)

      this.setState(state)
      this.#lastImageChangeData = null
    }

    return true
  }

  // Returns true if any of the image props changed and if the
  // new values are different from next state. The intent is that
  // this flags only changes which happened outside of Esper.
  didImageChange(nextProps, nextState) {
    let image = this.props.selection || this.props.photo
    let nextImage = nextProps.selection || nextProps.photo

    if (nextImage == null || nextImage === image)
      return false

    if (nextImage.mirror !== image.mirror || nextImage.angle !== image.angle) {
      let { angle, mirror } = addOrientation(nextImage, nextProps.photo)

      if (mirror !== nextState.mirror)
        return true

      if (angle !== nextState.angle &&
        nextImage.angle !== this.#lastImageChangeData?.angle)
        return true
    }

    for (let prop in FILTERS) {
      if (nextImage[prop] !== image[prop] &&
        nextImage[prop] !== nextState[prop]) {
        return true
      }
    }

    return false
  }

  componentDidMount() {
    // WIP we assume that the view reference never changes!
    this.esper =
      this.view.current
        .on('change', this.handleViewChange)
        .on('photo.error', this.handlePhotoError)
        .on('resolution-change', this.handleResolutionChange)
        .on('selection-activate', this.handleSelectionActivate)
        .on('selection-create', this.handleSelectionCreate)
        .on('texture-change', this.handleTextureChange)
        .on('wheel.zoom', this.handleWheelZoom)
        .on('wheel.pan', this.handleWheelPan)
        .on('zoom-in', this.handleZoomIn)
        .on('zoom-out', this.handleZoomOut)
  }

  componentDidUpdate(prevProps, prevState) {
    let shouldViewReset = this.state.src !== prevState.src
    let shouldViewSync = this.state.id !== prevState.id
    let hasBecomeVisible = this.state.isVisible && !prevState.isVisible

    if (shouldViewReset || shouldViewSync || hasBecomeVisible) {
      let next = getZoomBounds(this.props, this.state, this.screen)
      let state = { ...this.state, ...next }

      if (this.state.isVisible) {
        shouldViewReset = shouldViewReset || !this.esper.photo

        if (shouldViewReset)
          this.esper.reset(this.props, state, hasBecomeVisible ? 850 : 0)
        else
          this.esper.sync(this.props, state)

      } else {
        this.esper.clear()
      }

      this.setState(next)

    } else {
      if (this.state.isVisible) {
        if (this.props.selections !== prevProps.selections ||
          this.tool !== getActiveTool(prevProps, prevState)
        ) {
          this.esper.photo?.sync(this.props, this.state)
        }
      }
    }
  }

  componentWillUnmount() {
    this.handleImageChange.flush()
    this.handleViewChange.flush()
  }

  get isDisabled() {
    return this.props.isDisabled ||
      !this.state.isVisible ||
      this.state.isTextureMissing || /* TODO should be read-only */
      this.props.photo?.pending === true
  }

  get isSelectionActive() {
    return this.props.selection != null
  }

  get screen() {
    return this.esper?.app.screen
  }

  get tool() {
    return getActiveTool(this.props, this.state)
  }

  focus() {
    this.container.current.focus()
  }

  pan({ x = 0, y = 0 }, animate) {
    if (this.props.mode !== MODE.FIT) {
      this.esper.move({
        x: Math.floor(this.esper.x + x),
        y: Math.floor(this.esper.y + y)
      }, {
        duration: animate ? PAN_DURATION : 0
      })
    }
  }

  handleChange = (esper) => {
    this.props.onChange({ esper })
  }

  handlePanelChange = (panel = !this.props.isPanelVisible) => {
    this.handleChange({ panel })
  }

  handleRevertToOriginal = () => {
    this.handleFilterChange(FILTERS)
    this.focus()
  }

  handleRotationChange = throttle((by) => {
    if (this.props.isReadOnly) return

    let state = {
      ...this.state,
      angle: rotate(this.state.angle, by)
    }

    Object.assign(state, getZoomBounds(this.props, state, this.screen))

    this.esper.rotate(state, {
      duration: ROTATE_DURATION,
      clockwise: by > 0,
      fixate: this.props.mode === MODE.ZOOM
    })

    this.setState(state)
    this.handleImageChange()
  }, ROTATE_DURATION / 2)

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
      x,
      y,
      zoom: this.state.zoom + ZOOM_STEP_SIZE
    }, animate)
  }

  handleZoomOut = ({ x, y } = {}, animate = false) => {
    this.handleZoomChange({
      x,
      y,
      zoom: this.state.zoom - ZOOM_STEP_SIZE
    }, animate)
  }

  handleZoomChange = ({ x, y, zoom }, animate) => {
    zoom = restrict(
      round(zoom, ZOOM_PRECISION),
      this.state.minZoom,
      MAX_ZOOM)

    this.setState({ zoom })

    this.esper.scale({
      zoom,
      mirror: this.state.mirror
    }, {
      duration: animate ? ZOOM_DURATION : 0,
      x,
      y
    })

    this.props.onChange({
      view: {
        [this.state.id]: { mode: MODE.ZOOM }
      }
    })
  }

  handleMirrorChange = () => {
    if (this.props.isReadOnly) return

    this.esper.flip()

    // Subtle: when flipping rotated photos, the angle will
    // change by 180 degrees, so we extract both mirror and
    // angle after the fact.
    this.setState({
      angle: this.esper.photo.angle,
      mirror: this.esper.photo.mirror
    })

    this.handleImageChange()
  }

  handleModeChange = ({ mode }) => {
    let { minZoom, mirror, zoom, zoomToFill } = this.state

    switch (mode) {
      case MODE.FILL:
        zoom = zoomToFill
        break
      case MODE.FIT:
        zoom = minZoom
        break
    }

    this.setState({ zoom })
    this.esper.scale({ zoom, mirror }, { duration: ZOOM_DURATION })

    this.props.onChange({
      view: { [this.state.id]: { mode } }
    })
  }

  handleToolChange = (tool) => {
    this.handleChange({ tool })
  }

  handleFilterChange = (opts) => {
    if (this.props.isReadOnly) return

    this.esper.filter({ ...this.state, ...opts })
    this.setState(opts)
    this.handleImageChange()
  }

  handleSelectionActivate = (selection) => {
    this.props.onSelect({
      photo: this.props.photo.id,
      item: this.props.photo.item,
      selection: selection.id,
      note: selection.notes[0]
    })
    this.handleToolChange(TOOL.ARROW)
  }

  handleSelectionCreate = (selection) => {
    if (this.props.isReadOnly) return

    let { photo } = this.props
    let { angle, mirror } = subOrientation(this.state, photo)

    this.props.onSelectionCreate({
      photo: photo.id,
      angle,
      mirror,
      ...selection
    })
  }

  handleTextureChange = (isTextureReady) => {
    this.setState({
      isTextureReady,
      isTextureMissing: false
    })
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
          this.handleModeChange({ mode: MODE.FIT })
          break
        case 'zoomToFill':
          this.handleModeChange({ mode: MODE.FILL })
          break
        case 'rotateLeft':
          if (this.props.isReadOnly) return
          this.handleRotationChange(-90)
          break
        case 'rotateRight':
          if (this.props.isReadOnly) return
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
    if (!this.props.isReadOnly) {
      this.props.onContextMenu(event, 'esper')
    }
  }

  handleMouseMove = () => {
    this.esper.resume()
  }

  handlePhotoError = (photo, isTextureMissing) => {
    if (!photo.broken)
      this.props.onPhotoError(photo.id)

    this.setState({
      isTextureMissing
    })
  }

  handleSlideIn = () => {
    if (!this.state.isVisible) {
      this.setState({ isVisible: true })
      requestIdleCallback(this.esper.resume)
    }
  }

  handleSlideOut = () => {
    if (this.state.isVisible) {
      this.setState({ isVisible: false })
      this.esper.stop()
      this.esper.stop.flush()
    }
  }

  handleResize = throttle(({ width, height }) => {
    let next = getZoomBounds(this.props, this.state, { width, height })

    this.esper.resize({
      width,
      height,
      zoom: next.zoom,
      mirror: this.state.mirror
    })

    next.isCompact = width < 240 || height < 240

    this.setState(next)
  }, 50)

  handleResolutionChange = () => {
    this.setState({
      ...getZoomBounds(this.props, this.state, this.screen)
    })
  }

  handleImageChange = debounce(() => {
    try {
      if (this.state.id != null) {
        var data = {
          ...subOrientation(this.state, this.props.photo),
          ...pick(this.state, Object.keys(FILTERS))
        }

        this.props.onChange({
          [this.isSelectionActive ? 'selection' : 'photo']: {
            id: this.state.id,
            data
          }
        })
      }
    } finally {
      this.#lastImageChangeData = data
    }
  }, 650)

  handleViewChange = debounce(() => {
    this.props.onChange({
      view: {
        [this.state.id]: {
          x: Math.round(this.esper.x),
          y: Math.round(this.esper.y),
          zoom: this.state.zoom
        }
      }
    })
  }, 650)


  render() {
    let { isDisabled } = this
    let { overlay } = this.props

    let transcriptions =
      (this.props.selection || this.props.photo)?.transcriptions
    let isOverlayVisible =
      overlay && transcriptions?.length > 0

    return (
      <EsperContainer
        className={cx(this.tool, {
          'compact': this.state.isCompact,
          'read-only': this.props.isReadOnly,
          'texture-missing': this.state.isTextureMissing,
          'panel-visible': this.props.isPanelVisible,
          [`text-overlay-${overlay}`]: isOverlayVisible
        })}
        ref={this.container}
        isDisabled={isDisabled}
        hasOverlayToolbar={this.props.hasOverlayToolbar}
        onEnter={this.handleSlideIn}
        onLeave={this.handleSlideOut}
        onContextMenu={this.handleContextMenu}
        onMouseMove={this.handleMouseMove}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}>

        <EsperHeader>
          <Toolbar.Left>
            <ToolGroup.Tool
              current={this.tool}
              isDisabled={isDisabled}
              isReadOnly={this.props.isReadOnly}
              isSelectionActive={this.isSelectionActive}
              onChange={this.handleChange}/>
            <ToolGroup.Rotation
              isDisabled={isDisabled || this.props.isReadOnly}
              mirror={this.state.mirror}
              onMirrorChange={this.handleMirrorChange}
              onRotationChange={this.handleRotationChange}/>
            <ToolGroup.Mode
              current={this.props.mode}
              isDisabled={isDisabled}
              onChange={this.handleModeChange}/>
            <ToolGroup.Zoom
              current={this.state.zoom}
              isDisabled={isDisabled}
              max={MAX_ZOOM}
              min={this.state.minZoom}
              onChange={this.handleZoomChange}/>
          </Toolbar.Left>
          <Toolbar.Right>
            <ToolGroup.Overlay
              current={overlay}
              isDisabled={isDisabled}
              onChange={this.handleChange}/>
            <ToolGroup.Panel
              current={this.props.isPanelVisible}
              isDisabled={isDisabled}
              onChange={this.handleChange}/>
          </Toolbar.Right>
        </EsperHeader>

        <EsperView
          ref={this.view}
          onResize={this.handleResize}>
          {this.state.isTextureMissing &&
            <EsperError photoId={this.props.photo?.id}/>}

          {isOverlayVisible &&
            <EsperOverlay transcriptions={transcriptions}/>}

          <EsperPanel
            brightness={this.state.brightness}
            contrast={this.state.contrast}
            hue={this.state.hue}
            negative={this.state.negative}
            saturation={this.state.saturation}
            sharpen={this.state.sharpen}
            isDisabled={isDisabled || this.props.isReadOnly}
            isVisible={this.props.isPanelVisible}
            onChange={this.handleFilterChange}
            onRevert={this.handleRevertToOriginal}/>
        </EsperView>
      </EsperContainer>
    )
  }

  static defaultProps = {
    tool: TOOL.ARROW,
    zoom: 1
  }

  static defaultImageProps = {
    angle: 0,
    mirror: false,
    ...FILTERS
  }
}


const getActiveTool = ({ selection, tool }, { quicktool }) => {
  tool = quicktool || tool

  if (selection && tool === TOOL.SELECT)
    return TOOL.ARROW
  else
    return tool
}

const getZoomBounds = (props, state, screen = {}) => {
  let minZoom = MIN_ZOOM / getResolution()
  let zoom = state.zoom
  let zoomToFill = minZoom
  let image = props.selection || state

  if (image) {
    let { width, height } = image

    if (!isHorizontal(state.angle)) {
      [width, height] = [height, width]
    }

    minZoom = getZoomToFit(screen, width, height, minZoom)
    zoomToFill = getZoomToFill(screen, width)

    switch (props.mode) {
      case MODE.FILL:
        zoom = zoomToFill
        break
      case MODE.FIT:
        zoom = minZoom
        break
    }

    if (minZoom > zoom) zoom = minZoom
  }

  return { minZoom, zoom, zoomToFill }
}

const getZoomToFill = ({ width = MIN_WIDTH }, w) =>
  round(Math.min(MAX_ZOOM, width / w), ZOOM_PRECISION)

const getZoomToFit =
  ({ width = MIN_WIDTH, height = MIN_HEIGHT }, w, h, minZoom) =>
    round(
      Math.min(minZoom, Math.min(width / w, height / h)),
      ZOOM_PRECISION)
