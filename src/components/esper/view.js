'use strict'

const React = require('react')
const { array, func, number, object, string } = require('prop-types')

const { bounds } = require('../../dom')
const { Esper } = require('../../esper')


class EsperView extends React.Component {
  componentDidMount() {
    let { width, height } = bounds(this.container)

    this.esper = new Esper({
      resolution: this.props.resolution,
      width,
      height
    })

    this.esper
      .on('change', this.persist)
      .on('double-click', this.handleDoubleClick)
      .on('photo.error', this.handlePhotoError)
      .on('loader.error', this.handleLoadError)
      .on('loader.load', this.handleLoadProgress)
      .on('selection-activate', this.handleSelectionActivate)
      .on('selection-create', this.handleSelectionCreate)
      .on('wheel', this.handleWheel)
      .on('zoom-in', this.handleZoomIn)
      .on('zoom-out', this.handleZoomOut)
      .mount(this.container)
  }

  componentWillUnmount() {
    this.esper.destroy()
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.esper.photo?.sync(props)
    this.esper.render()

    if (props.resolution !== this.esper.resolution) {
      this.handleResolutionChange(props.resolution)
    }
  }

  shouldComponentUpdate() {
    return false
  }

  persist = () => {
    this.props.onChange(this.esper.position)
    this.handleResolutionChange()
  }

  setContainer = (container) => {
    this.container = container
  }

  handleResolutionChange(resolution = this.props.resolution) {
    let { photo } = this.esper

    // On low-res screens, we render at 2x resolution
    // when zooming out to improve quality. See #218
    if (resolution < 2 && photo != null && photo.scale.y < 1) {
      resolution = 2
    }

    if (resolution !== this.esper.resolution) {
      this.esper.resolution = resolution

      // TODO is this necessary?
      this.esper.resize(bounds(this.container))
    }
  }

  handleLoadProgress = () => {
  }

  handleLoadError = (loader, resource) => {
    if (this.props.onLoadError) {
      this.props.onLoadError({ resource })
    }
  }

  handlePhotoError = (url) => {
    this.props.onPhotoError(url)
  }

  handleWheel = (event, coords) => {
    event.stopPropagation()
    this.props.onWheel(coords)
  }

  handleDoubleClick = (event, coords) => {
    this.props.onDoubleClick(coords)
  }

  handleSelectionActivate = (event) => {
    this.props.onSelectionActivate(event.target.data)
  }

  handleSelectionCreate = (event, selection) => {
    this.props.onSelectionCreate(selection)
  }

  handleZoomIn = (event, coords) => {
    this.props.onZoomIn(coords)
  }

  handleZoomOut = (event, coords) => {
    this.props.onZoomIn(coords)
  }

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


module.exports = {
  EsperView
}
