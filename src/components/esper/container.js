import React from 'react'
import cx from 'classnames'
import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
import Esper from '../../esper'
import { EsperToolbar } from './toolbar'
import { EsperPanel } from './panel'
import { pick, restrict } from '../../common/util'
import { Cache } from '../../common/cache'
import { isHorizontal, rotate, round } from '../../common/math'
import { addOrientation, subOrientation } from '../../common/iiif'
import { match } from '../../keymap'

import {
  arrayOf, bool, func, number, object, shape, string
} from 'prop-types'

import { ESPER, SASS, TABS } from '../../constants'

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


export class EsperContainer extends React.Component {

  #IO = new IntersectionObserver(([el]) => {
    requestIdleCallback(
      el.intersectionRatio > 0 ?
        this.handleSlideIn :
        this.handleSlideOut
    )
  }, { threshold: [0] })

  #RO = new ResizeObserver(([el]) => {
    this.handleResize(el.contentRect)
  })

  #lastImageChangeData

  container = React.createRef()
  view = React.createRef()

  state = {
    dppx: Esper.devicePixelRatio,
    isVisible: false,
    quicktool: null,

    // Derived from props; constrained by photo/selection and resize
    minZoom: EsperContainer.defaultProps.minZoom,
    zoom: EsperContainer.defaultProps.zoom,
    zoomToFill: EsperContainer.defaultProps.minZoom,

    // Derived from photo/selection
    width: 0,
    height: 0,
    ...EsperContainer.defaultImageProps
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
        ...EsperContainer.getDerivedImageStateFromProps(props)
      }
  }

  static getDerivedImageStateFromProps({ photo, selection }) {
    let image = selection || photo
    let state = { ...EsperContainer.defaultImageProps }

    if (image != null) {
      for (let prop in EsperContainer.defaultImageProps) {
        state[prop] = image[prop]
      }

      Object.assign(state, addOrientation(state, photo))
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
      let state = EsperContainer.getDerivedImageStateFromProps(nextProps)
      let duration = !this.state.isVisible ? 0 : undefined //-> default

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

    for (let prop in EsperPanel.defaultProps) {
      if (nextImage[prop] !== image[prop] &&
        nextImage[prop] !== nextState[prop]) {
        return true
      }
    }

    return false
  }

  componentDidMount() {
    this.esper =
      Esper.instance
        .on('change', this.handleViewChange)
        .on('photo.error', this.handlePhotoError)
        .on('dppx-change', this.handleDevicePixelRatioChange)
        .on('resolution-change', this.handleResolutionChange)
        .on('selection-activate', this.handleSelectionActivate)
        .on('selection-create', this.handleSelectionCreate)
        .on('wheel.zoom', this.handleWheelZoom)
        .on('wheel.pan', this.handleWheelPan)
        .on('zoom-in', this.handleZoomIn)
        .on('zoom-out', this.handleZoomOut)
        .mount(this.view.current)

    this.#RO.observe(this.view.current)
    this.#IO.observe(this.view.current)
  }

  componentDidUpdate(prevProps, prevState) {
    let shouldViewReset = this.state.src !== prevState.src
    let shouldViewSync = this.state.id !== prevState.id

    if (this.state.isVisible) {
      shouldViewReset = shouldViewReset || !prevState.isVisible

      if (shouldViewReset || shouldViewSync) {
        let next = getZoomBounds(this.props, this.state, this.screen)
        let state = { ...this.state, ...next }

        this.setState(next)

        if (shouldViewReset)
          this.esper.reset(this.props, state)
        else
          this.esper.sync(this.props, state)


      } else {
        if (this.props.selections !== prevProps.selections ||
          this.tool !== getActiveTool(prevProps, prevState)
        ) {
          this.esper.photo?.sync(this.props, this.state)
        }
      }

    } else {
      if (shouldViewReset) {
        this.esper.clear()
      }
    }
  }

  componentWillUnmount() {
    this.#IO.disconnect()
    this.#RO.disconnect()

    this.handleImageChange.flush()
    this.handleViewChange.flush()

    this.esper.destroy()
  }

  get isDisabled() {
    return this.props.isDisabled ||
      !this.state.isVisible ||
      this.props.photo?.pending === true
  }

  get isSelectionActive() {
    return this.props.selection != null
  }

  get screen() {
    return this.esper?.app.screen
  }

  get tabIndex() {
    return this.isDisabled ? -1 : this.props.tabIndex
  }

  get tool() {
    return getActiveTool(this.props, this.state)
  }

  get hasFocus() {
    return document.activeElement === this.container.current
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

  handlePanelChange = (panel = !this.props.isPanelVisible) => {
    this.props.onChange({
      esper: { panel }
    })
  }

  handleRevertToOriginal = () => {
    if (this.props.isReadOnly) return

    let state = {
      ...this.state,
      ...EsperPanel.defaultProps
    }

    this.esper.filter(state)
    this.setState(state)
    this.focus()
    this.handleImageChange()
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
      this.props.maxZoom)

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

    this.setState({ zoom })
    this.esper.scale({ zoom, mirror }, { duration: ZOOM_DURATION })

    this.props.onChange({
      view: { [this.state.id]: { mode } }
    })
  }

  handleToolChange = (tool) => {
    this.props.onChange({ esper: { tool } })
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
    this.handleToolChange(EsperContainer.defaultProps.tool)
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

  handleMouseDown = () => {
    if (!this.hasFocus && !this.props.isReadOnly) {
      this.focus()
    }
  }

  handleMouseMove = () => {
    this.esper.resume()
  }

  handlePhotoError = (photo) => {
    if (!photo.broken)
      this.props.onPhotoError(photo.id)
  }

  handleSlideIn = debounce(() => {
    if (!this.state.isVisible) {
      this.setState({ isVisible: true })
      this.esper.resume()
    }
  }, 550)

  handleSlideOut = () => {
    if (this.state.isVisible) {
      this.handleSlideIn.cancel()
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

    this.setState(next)
  }, 50)

  handleDevicePixelRatioChange = (dppx) => {
    this.setState({ dppx })
  }

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
          ...pick(this.state, Object.keys(EsperPanel.defaultProps))
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

    return (
      <section
        className={cx('esper', this.tool, {
          'disabled': isDisabled,
          'read-only': this.props.isReadOnly,
          'overlay-mode': this.props.hasOverlayToolbar,
          'panel-visible': this.props.isPanelVisible
        })}
        ref={this.container}
        tabIndex={this.tabIndex}
        onContextMenu={this.handleContextMenu}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}>
        <header className="esper-header">
          <EsperToolbar
            isDisabled={isDisabled}
            isReadOnly={isDisabled || this.props.isReadOnly}
            isSelectionActive={this.isSelectionActive}
            isPanelVisible={this.props.isPanelVisible}
            mode={this.props.mode}
            mirror={this.state.mirror}
            tool={this.tool}
            resolution={this.state.dppx}
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
            contrast={this.state.contrast}
            hue={this.state.hue}
            negative={this.state.negative}
            saturation={this.state.saturation}
            sharpen={this.state.sharpen}
            isDisabled={isDisabled || this.props.isReadOnly}
            isVisible={this.props.isPanelVisible}
            onChange={this.handleFilterChange}
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
    isReadOnly: bool,
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

  static defaultImageProps = {
    angle: 0,
    mirror: false,
    ...EsperPanel.defaultProps
  }
}


const getActiveTool = ({ selection, tool }, { quicktool }) => {
  tool = quicktool || tool

  if (selection && tool === TOOL.SELECT)
    return EsperContainer.defaultProps.tool
  else
    return tool
}

const getZoomBounds = (props, state, screen = {}) => {
  let minZoom = props.minZoom / Esper.devicePixelRatio
  let zoom = state.zoom
  let zoomToFill = minZoom
  let image = props.selection || state

  if (image) {
    let { width, height } = image

    if (!isHorizontal(state.angle)) {
      [width, height] = [height, width]
    }

    minZoom = getZoomToFit(screen, width, height, minZoom)
    zoomToFill = getZoomToFill(screen, width, props.maxZoom)

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

const getZoomToFill = ({ width = MIN_WIDTH }, w, maxZoom) =>
  round(Math.min(maxZoom, width / w), ZOOM_PRECISION)

const getZoomToFit =
  ({ width = MIN_WIDTH, height = MIN_HEIGHT }, w, h, minZoom) =>
    round(
      Math.min(minZoom, Math.min(width / w, height / h)),
      ZOOM_PRECISION)


