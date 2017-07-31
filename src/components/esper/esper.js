'use strict'

const React = require('react')
const { PureComponent } = React
const { EsperStage } = require('./stage')
const { EsperToolbar } = require('./toolbar')
const { bool, node, object, string } = require('prop-types')
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
    const { photo, isVisible, isDisabled, mode } = props

    if (photo == null || photo.pending) {
      return {
        isDisabled: true,
        isVisible: false,
        mode,
        src: null,
        width: 0,
        height: 0,
        angle: 0,
        minZoom: 1,
        maxZoom: 1,
        zoom: 1
      }
    }

    const minZoom = this.getZoomToFit(this.stage.screen, photo)
    const zoom = (mode === 'fit') ?  minZoom :
      (mode === 'fill') ? this.getZoomToFill(props) : 1

    return {
      isDisabled,
      isVisible,
      mode,
      src: `${photo.protocol}://${photo.path}`,
      width: photo.width,
      height: photo.height,
      angle: photo.angle,
      minZoom,
      maxZoom: 4,
      zoom
    }
  }

  get bounds() {
    return bounds(this.stage.container)
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

    switch (this.state.mode) {
      case 'fill':
        zoom = this.getZoomToFill(this.props, width)
        break
      case 'fit':
        zoom = minZoom
        break
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
    this.setState({ zoom, mode: 'zoom' })
    this.stage.zoom(zoom)
  }

  handleModeChange = (mode) => {
    let { zoom, minZoom  } = this.state

    switch (mode) {
      case 'fill':
        zoom = this.getZoomToFill()
        break
      case 'fit':
        zoom = minZoom
        break
    }

    this.setState({ zoom, mode })
    this.stage.zoom(zoom)
  }

  render() {
    return (
      <section className="esper">
        <EsperHeader>
          <EsperToolbar
            isDisabled={this.state.isDisabled}
            mode={this.state.mode}
            zoom={this.state.zoom}
            minZoom={this.state.minZoom}
            maxZoom={this.state.maxZoom}
            onModeChange={this.handleModeChange}
            onRotationChange={this.handleRotationChange}
            onZoomChange={this.handleZoomChange}/>
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
    isDisabled: bool,
    isVisible: bool,
    mode: string.isRequired,
    photo: object
  }

  static defaultProps = {
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
