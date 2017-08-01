'use strict'

const React = require('react')
const { PureComponent } = React
const { Toolbar, ToolbarLeft, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { Slider } = require('../slider')
const { bool, func, number, string } = require('prop-types')
const throttle = require('lodash.throttle')

const {
  IconArrow,
  IconSelection,
  IconRotate,
  IconNut,
  IconHand,
  IconMinusCircle,
  IconPlusCircle,
  IconFit
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
  }, 100)

  setZoomToFit = () => {
    this.props.onModeChange('fit')
  }

  setZoomToFill = () => {
    this.props.onModeChange('fill')
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
              icon={<IconNut/>}
              isDisabled={this.props.isDisabled}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              icon={<IconHand/>}/>
          </ToolGroup>
          <ToolGroup>
            <Slider
              value={this.props.zoom}
              min={this.props.minZoom}
              max={this.props.maxZoom}
              precision={this.props.zoomPrecision}
              size="sm"
              minIcon={<IconMinusCircle/>}
              maxIcon={<IconPlusCircle/>}
              isDisabled={this.props.isDisabled}
              onChange={this.handleZoomChange}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              icon={<IconFit/>}
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
        </ToolbarLeft>
      </Toolbar>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    mode: string.isRequired,
    zoom: number.isRequired,
    zoomPrecision: number.isRequired,
    minZoom: number.isRequired,
    maxZoom: number.isRequired,
    onModeChange: func.isRequired,
    onRotationChange: func.isRequired,
    onZoomChange: func.isRequired
  }

  static defaultProps = {
    zoomPrecision: 100
  }
}

module.exports = {
  EsperToolbar
}
