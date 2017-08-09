'use strict'

const React = require('react')
const { PureComponent } = React
const { EsperView } = require('./view')
const { EsperToolbar } = require('./toolbar')
const { bool, func, node, number, object, string } = require('prop-types')
const { bounds, on, off } = require('../../dom')
const { win } = require('../../window')
const { get, restrict, shallow } = require('../../common/util')
const { isHorizontal, rotate } = require('../../common/math')
const { Rotation } = require('../../common/iiif')
const { assign } = Object
const debounce = require('lodash.debounce')


class Esper extends PureComponent {
  constructor(props) {
    super(props)
    this.state = this.getEmptyState(props)
  }

  componentDidMount() {
    on(window, 'resize', this.resize)
    win.on('show', this.resize)
    this.resize()
  }

  componentWillUnmount() {
    off(window, 'resize', this.resize)
    win.removeEventListener('show', this.resize)
  }

  componentWillReceiveProps(props) {
    if (!shallow(props, this.props)) {
      const state = this.getStateFromProps(props)

      if (this.shouldViewReset(props, state)) {
        this.view.reset(state)
      }

      this.setState(state)
    }
  }

  shouldViewReset(props, state) {
    if (state.src !== this.state.src) return true
    if (get(props.photo, ['id']) !== get(this.props.photo, ['id'])) return true

    if (state.angle !== this.state.angle) return true
    if (state.mirror !== this.state.mirror) return true

    return false
  }

  get isEmpty() {
    return this.props.photo == null || this.props.photo.pending === true
  }

  get isDisabled() {
    return this.props.isDisabled || this.isEmpty
  }

  get isVisible() {
    return this.props.isVisible && !this.isEmpty
  }

  get bounds() {
    return this.view.bounds
  }

  getEmptyState(props = this.props) {
    return {
      mode: props.mode,
      zoom: props.zoom,
      minZoom: props.minZoom,
      angle: 0,
      mirror: false,
      width: 0,
      height: 0,
      aspect: 0,
      src: null
    }
  }

  getStateFromProps(props) {
    const state = this.getEmptyState(props)
    const { photo } = props

    if (photo != null && !photo.pending) {
      state.src = `${photo.protocol}://${photo.path}`

      assign(state, this.getOrientationState(photo))
      assign(state, this.getAngleBounds({
        angle: state.angle,
        width: photo.width,
        height: photo.height
      }))
    }

    assign(state, this.getZoomBounds(this.view.bounds, state, props))

    return state
  }


  getZoomToFill(screen, state, props = this.props) {
    return Math.min(props.maxZoom, screen.width / state.width)
  }

  getZoomToFit(screen, state, props) {
    return Math.min(props.minZoom,
      Math.min(screen.width / state.width, screen.height / state.height))
  }

  getZoomBounds(
    screen = this.view.bounds,
    state = this.state,
    props = this.props
  ) {
    let { zoom, width, height } = state
    let { minZoom } = props
    let zoomToFill = minZoom

    if (width > 0 && height > 0) {
      minZoom = this.getZoomToFit(screen, state, props)
      zoomToFill = this.getZoomToFill(screen, state, props)

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

  getAngleBounds({ angle, width, height }) {
    if (width === 0 || height === 0) {
      return {
        width: 0, height: 0, aspect: 0
      }
    }

    if (isHorizontal(angle)) {
      return {
        width, height, aspect: width / height
      }
    }

    return {
      width: height, height: width, aspect: height / width
    }
  }

  getOrientationState({ angle, mirror, orientation }) {
    return Rotation
      .fromExifOrientation(orientation)
      .add({ angle, mirror })
      .toJSON()
  }

  setView = (view) => {
    this.view = view
  }

  resize = () => {
    const { width, height } = bounds(this.view.container)
    const { minZoom, zoom, zoomToFill } = this.getZoomBounds({ width, height })

    this.view.resize({
      width, height, zoom, mirror: this.state.mirror
    })

    this.setState({ minZoom, zoom, zoomToFill })
  }

  persist = debounce(() => {
    const { angle, mirror } = this.state

    this.props.onPhotoSave({
      id: this.props.photo.id,
      data: { angle, mirror }
    })
  }, 1000)

  handleRotationChange = (by) => {
    const state = {
      ...this.state,
      angle: rotate(this.state.angle, by),
      width: this.props.photo.width,
      height: this.props.photo.height
    }

    assign(state, this.getAngleBounds(state))
    assign(state, this.getZoomBounds(this.view.bounds, state))

    this.setState(state)

    this.view.rotate(state, 250)
    this.view.scale(state, 250)

    this.persist()
  }

  handleZoomChange = ({ x, y, zoom }, animate) => {
    zoom = restrict(zoom, this.state.minZoom, this.props.maxZoom)

    this.setState({ zoom, mode: 'zoom' })
    this.view.scale({
      x, y, zoom, mirror: this.state.mirror
    }, animate ? 300 : 0)
  }

  handleMirrorChange = () => {
    let { angle, zoom, mirror } = this.state

    mirror = !mirror

    if (!isHorizontal(angle)) angle = rotate(angle, 180)

    this.setState({ angle, mirror })

    this.view.scale({ zoom, mirror })
    this.view.rotate({ angle })

    this.persist()
  }

  handleModeChange = (mode) => {
    let { minZoom, mirror, zoom, zoomToFill  } = this.state

    switch (mode) {
      case 'fill':
        zoom = zoomToFill
        break
      case 'fit':
        zoom = minZoom
        break
    }

    this.setState({ zoom, mode })
    this.view.scale({ zoom, mirror }, 300)
  }

  handleWheel = ({ x, y, dy, dx, ctrl }) => {
    if (ctrl) {
      this.handleZoomChange({
        x, y, zoom: this.state.zoom + dy / 500
      })
    } else {
      this.view.move({
        x: this.view.image.x - dx,
        y: this.view.image.y - dy
      })
    }
  }

  handleDoubleClick = ({ x, y, shift }) => {
    this.handleZoomChange({
      x, y, zoom: this.state.zoom + (shift ? -0.5 : 0.5)
    }, 250)
  }

  render() {
    const { isDisabled, isVisible } = this

    return (
      <section className="esper">
        <EsperHeader>
          <EsperToolbar
            isDisabled={isDisabled}
            mode={this.state.mode}
            zoom={this.state.zoom}
            minZoom={this.state.minZoom}
            maxZoom={this.props.maxZoom}
            onMirrorChange={this.handleMirrorChange}
            onModeChange={this.handleModeChange}
            onRotationChange={this.handleRotationChange}
            onZoomChange={this.handleZoomChange}/>
        </EsperHeader>
        <EsperView
          ref={this.setView}
          isVisible={isVisible}
          onDoubleClick={this.handleDoubleClick}
          onWheel={this.handleWheel}/>
      </section>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isVisible: bool,
    maxZoom: number.isRequired,
    minZoom: number.isRequired,
    zoom: number.isRequired,
    mode: string.isRequired,
    photo: object,
    onPhotoSave: func.isRequired
  }

  static defaultProps = {
    maxZoom: 4,
    minZoom: 1,
    zoom: 1,
    mode: 'fit',
    isVisible: false
  }
}


const EsperHeader = ({ children }) => (
  <header className="esper-header draggable">{children}</header>
)

EsperHeader.propTypes = {
  children: node
}


module.exports = {
  EsperHeader,
  Esper
}
