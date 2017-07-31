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
      angle: 0,
      zoom: isAutoZoomActive ? this.fitToWidth(props) : 1
    }
  }

  get bounds() {
    return bounds(this.stage.container)
  }

  fitToWidth({ photo } = this.props, width = this.stage.screen.width) {
    return (photo == null || photo.width === 0) ? 1 : width / photo.width
  }

  setStage = (stage) => {
    this.stage = stage
  }

  resize = () => {
    let { width, height } = this.bounds
    let zoom = this.state.zoom

    if (this.state.isAutoZoomActive) {
      zoom = this.fitToWidth(this.props, width)
      this.setState({ zoom })
    }

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
      zoom = this.fitToWidth()
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
