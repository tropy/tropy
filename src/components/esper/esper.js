'use strict'

const React = require('react')
const { PureComponent } = React
const { EsperStage } = require('./stage')
const { EsperToolbar } = require('./toolbar')
const { bool, node, object } = require('prop-types')
const { bounds, on, off } = require('../../dom')

class Esper extends PureComponent {
  constructor(props) {
    super(props)
    this.state = this.getStateFromProps(props)
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

  getStateFromProps(props) {
    const { photo, isVisible, isDisabled, isAutoZoomActive } = props

    if (photo == null || photo.pending) {
      return {
        isAutoZoomActive,
        isDisabled: true,
        isVisible: false,
        src: null,
        width: 0,
        height: 0,
        angle: 0,
        minZoom: 1,
        maxZoom: 1,
        zoom: 1
      }
    }

    return {
      isAutoZoomActive,
      isDisabled,
      isVisible,
      src: `${photo.protocol}://${photo.path}`,
      width: photo.width,
      height: photo.height,
      angle: photo.angle,
      minZoom: this.getZoomToFit(this.stage.screen, photo),
      maxZoom: 4,
      zoom: isAutoZoomActive ? this.getZoomToFill(props) : 1
    }
  }

  get bounds() {
    return bounds(this.stage.container)
  }

  get isZoomToFill() {
  }

  get isZoomToFit() {
  }

  getZoomToFill({ photo } = this.props, width = this.stage.screen.width) {
    return (photo == null || photo.width === 0) ? 1 : width / photo.width
  }

  getZoomToFit(screen = this.stage.screen, state = this.state) {
    const { width, height } = this.getAngleBounds(state)

    return Math.min(0.8,
      Math.min(screen.width / width, screen.height / height))
  }

  getAngleBounds({ angle, width, height } = this.state) {
    return isHorizontal(angle) ?
      { width, height } :
      { width: height, height: width }
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    const { width, height } = this.bounds
    let { zoom } = this.state

    const minZoom = this.getZoomToFit({ width, height })

    if (this.state.isAutoZoomActive) {
      zoom = this.getZoomToFill(this.props, width)
    }

    if (minZoom > zoom) zoom = minZoom

    this.setState({ zoom, minZoom })

    this.stage.resize({ width, height, zoom })
  }

  handleRotationChange = (by) => {
    this.setState({
      angle: (360 + (this.state.angle + by)) % 360
    })
  }

  handleZoomChange = (zoom) => {
    this.setState({ zoom, isAutoZoomActive: false })
    this.stage.zoom(zoom)
  }

  handleZoomToggle = () => {
    let { zoom, isAutoZoomActive } = this.state

    isAutoZoomActive = !isAutoZoomActive

    if (isAutoZoomActive) {
      zoom = this.getZoomToFill()
    }

    this.setState({ zoom, isAutoZoomActive })
    this.stage.zoom(zoom)
  }

  render() {
    return (
      <section className="esper">
        <EsperHeader>
          <EsperToolbar
            isAutoZoomActive={this.state.isAutoZoomActive}
            isDisabled={this.state.isDisabled}
            zoom={this.state.zoom}
            minZoom={this.state.minZoom}
            maxZoom={this.state.maxZoom}
            onRotationChange={this.handleRotationChange}
            onZoomChange={this.handleZoomChange}
            onZoomToggle={this.handleZoomToggle}/>
        </EsperHeader>
        <EsperStage
          ref={this.setStage}
          isDisabled={this.state.isDisabled}
          isVisible={this.state.isVisible}
          src={this.state.src}
          angle={this.state.angle}
          width={this.state.width}
          height={this.state.height}
          zoom={this.state.zoom}/>
      </section>
    )
  }

  static propTypes = {
    isAutoZoomActive: bool,
    isDisabled: bool,
    isVisible: bool,
    photo: object
  }

  static defaultProps = {
    isAutoZoomActive: true,
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
