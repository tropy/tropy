'use strict'

const React = require('react')
const { PureComponent } = React
const { Toolbar, ToolbarLeft, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { Slider } = require('../slider')
const { arrayOf, bool, func, number, string } = require('prop-types')
const throttle = require('lodash.throttle')

const {
  IconArrow,
  IconSelection,
  IconRotate,
  IconNut,
  IconHand,
  IconMirror,
  IconMinusCircle,
  IconPlusCircle,
  IconFit,
  IconFill
} = require('../icons')

class EsperToolbar extends PureComponent {
  get isZoomToFill() {
    return this.props.mode === 'fill'
  }

  get isZoomToFit() {
    return this.props.mode === 'fit'
  }

  handleRotate = () => {
    this.props.onRotationChange(-90)
  }

  handleZoomChange = throttle((zoom) => {
    this.props.onZoomChange(zoom)
  }, 15)

  setZoomToFit = () => {
    this.props.onModeChange(this.isZoomToFit ? 'zoom' : 'fit')
  }

  setZoomToFill = () => {
    this.props.onModeChange(this.isZoomToFill ? 'zoom' : 'fill')
  }

  render() {
    return (
      <Toolbar>
        <ToolbarLeft>
          <ToolGroup>
            <IconButton
              icon={<IconArrow/>}
              isDisabled={this.props.isDisabled}/>
            <IconButton
              icon={<IconSelection/>}
              isDisabled={this.props.isDisabled}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              icon={<IconRotate/>}
              isDisabled={this.props.isDisabled}
              onClick={this.handleRotate}/>
            <IconButton
              icon={<IconMirror/>}
              isDisabled={this.props.isDisabled}
              onClick={this.props.onMirrorChange}/>
            <IconButton
              icon={<IconNut/>}
              isDisabled={this.props.isDisabled}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              icon={<IconHand/>}/>
            <IconButton
              icon={<IconFill/>}
              title="esper.mode.fill"
              isDisabled={this.props.isDisabled}
              isActive={this.isZoomToFill}
              onClick={this.setZoomToFill}/>
            <IconButton
              icon={<IconFit/>}
              title="esper.mode.fit"
              isDisabled={this.props.isDisabled}
              isActive={this.isZoomToFit}
              onClick={this.setZoomToFit}/>
          </ToolGroup>
          <ToolGroup>
            <Slider
              value={this.props.zoom}
              min={this.props.minZoom}
              max={this.props.maxZoom}
              precision={this.props.zoomPrecision}
              steps={this.props.zoomSteps}
              minIcon={<IconMinusCircle/>}
              maxIcon={<IconPlusCircle/>}
              isDisabled={this.props.isDisabled}
              onChange={this.handleZoomChange}/>
          </ToolGroup>
        </ToolbarLeft>
      </Toolbar>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    mode: string.isRequired,
    zoom: number.isRequired,
    zoomPrecision: number.isRequired,
    zoomSteps: arrayOf(number).isRequired,
    minZoom: number.isRequired,
    maxZoom: number.isRequired,
    onMirrorChange: func.isRequired,
    onModeChange: func.isRequired,
    onRotationChange: func.isRequired,
    onZoomChange: func.isRequired
  }

  static defaultProps = {
    zoomPrecision: 100,
    zoomSteps: [1, 2, 3]
  }
}

module.exports = {
  EsperToolbar
}
