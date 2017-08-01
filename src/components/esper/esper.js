'use strict'

const React = require('react')
const { PureComponent } = React
const { EsperStage } = require('./stage')
const { EsperToolbar } = require('./toolbar')
const { bool, node, number, object, string } = require('prop-types')
const { bounds, on, off } = require('../../dom')
const { assign } = Object


class Esper extends PureComponent {
  constructor(props) {
    super(props)
    this.state = this.getEmptyState(props)
  }

  componentDidMount() {
    on(window, 'resize', this.resize)
  }

  componentWillUnmount() {
    off(window, 'resize', this.resize)
  }

  componentWillReceiveProps(props) {
    if (props !== this.props) {
      this.setState(this.getStateFromProps(props))
    }
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

  get screen() {
    return this.stage.screen
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
      src: null
    }
  }

  getStateFromProps(props) {
    const state = this.getEmptyState()
    const { photo } = props

    if (photo != null && !photo.pending) {
      state.src = `${photo.protocol}://${photo.path}`

      // TODO Convert EXIF orientation
      assign(state, this.getAngleBounds(photo))
    }

    assign(state, this.getZoomBounds(this.screen, state, props))

    return state
  }


  getZoomToFill(screen = this.screen, state = this.state, props = this.props) {
    return Math.min(props.maxZoom, screen.width / state.width)
  }

  getZoomToFit(screen = this.screen, state = this.state, props = this.props) {
    return Math.min(props.minZoom,
      Math.min(screen.width / state.width, screen.height / state.height))
  }

  getZoomBounds(screen = this.screen, state = this.state, props = this.props) {
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
      return { width: 0, height: 0, aspect: 0 }
    }

    if (isHorizontal(angle)) {
      return { width, height, aspect: width / height }
    }

    return { width: height, height: width, aspect: height / width }
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    const screen = bounds(this.stage.container)
    const { minZoom, zoom, zoomToFill } = this.getZoomBounds(screen)

    this.stage.resize({ width: screen.width, height: screen.height, zoom })
    this.setState({ minZoom, zoom, zoomToFill })
  }


  handleRotationChange = (by) => {
    const state = {
      angle: (360 + (this.state.angle + by)) % 360,
      mode: this.state.mode,
      zoom: this.state.zoom,
      width: this.props.photo.width,
      height: this.props.photo.height
    }

    assign(state, this.getAngleBounds(state))
    assign(state, this.getZoomBounds(this.screen, state))

    this.setState(state)
    this.stage.zoom(state.zoom)
  }

  handleZoomChange = (zoom) => {
    this.setState({ zoom, mode: 'zoom' })
    this.stage.zoom(zoom)
  }

  handleModeChange = (mode) => {
    const { minZoom, zoomToFill  } = this.state
    const zoom = (mode === 'fill') ? zoomToFill : minZoom

    this.setState({ zoom, mode })
    this.stage.zoom(zoom)
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
            onModeChange={this.handleModeChange}
            onRotationChange={this.handleRotationChange}
            onZoomChange={this.handleZoomChange}/>
        </EsperHeader>
        <EsperStage
          ref={this.setStage}
          isDisabled={isDisabled}
          isVisible={isVisible}
          src={this.state.src}
          angle={this.state.angle}
          zoom={this.state.zoom}/>
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
    photo: object
  }

  static defaultProps = {
    maxZoom: 4,
    minZoom: 1,
    zoom: 1,
    mode: 'fit',
    isVisible: false
  }
}

function isHorizontal(angle) {
  return angle < 45 || angle > 315 || (angle > 135 && angle < 225)
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
