'use strict'

const React = require('react')
const { PureComponent } = React
const { Toolbar, ToolbarLeft, ToolGroup } = require('../toolbar')
const { IconButton } = require('../button')
const { Slider } = require('../slider')
const { arrayOf, bool, func, number, string } = require('prop-types')
const throttle = require('lodash.throttle')

const { TOOL, MODE } = require('../../constants/esper')

const {
  ESPER: {
    ZOOM_SLIDER_PRECISION,
    ZOOM_SLIDER_STEPS
  }
} = require('../../constants/sass')

const {
  IconArrow,
  IconSelection,
  IconRotate,
  // IconNut,
  IconHand,
  IconMirror,
  IconMinusCircle,
  IconPlusCircle,
  IconFit,
  IconFill
} = require('../icons')


class EsperToolbar extends PureComponent {
  get isZoomToFill() {
    return this.props.mode === MODE.FILL
  }

  get isZoomToFit() {
    return this.props.mode === MODE.FIT
  }

  isToolActive(tool) {
    return this.props.tool === tool
  }

  handleRotate = () => {
    this.props.onRotationChange(-90)
  }

  handleZoomChange = throttle((zoom, reason) => {
    this.props.onZoomChange({ zoom }, reason === 'button')
  }, 15)

  setZoomToFit = () => {
    this.props.onModeChange(this.isZoomToFit ? MODE.ZOOM : MODE.FIT)
  }

  setZoomToFill = () => {
    this.props.onModeChange(this.isZoomToFill ? MODE.ZOOM : MODE.FILL)
  }

  setArrowTool = () => {
    this.props.onToolChange(TOOL.ARROW)
  }

  setPanTool = () => {
    this.props.onToolChange(TOOL.PAN)
  }

  setSelectTool = () => {
    this.props.onToolChange(TOOL.SELECT)
  }

  render() {
    return (
      <Toolbar isDraggable={false}>
        <ToolbarLeft>
          <ToolGroup>
            <IconButton
              noFocus
              icon={<IconArrow/>}
              isActive={this.isToolActive(TOOL.ARROW)}
              isDisabled={this.props.isDisabled}
              onClick={this.setArrowTool}/>
            <IconButton
              noFocus
              icon={<IconSelection/>}
              title="esper.tool.select"
              isActive={this.isToolActive(TOOL.SELECT)}
              isDisabled={this.props.isDisabled || this.props.isSelectionActive}
              onClick={this.setSelectTool}/>
          </ToolGroup>
          <ToolGroup>
            <IconButton
              noFocus
              icon={<IconRotate/>}
              title="esper.tool.rotate"
              isDisabled={this.props.isDisabled}
              onClick={this.handleRotate}/>
            <IconButton
              noFocus
              icon={<IconMirror/>}
              title="esper.tool.mirror"
              isDisabled={this.props.isDisabled}
              onClick={this.props.onMirrorChange}/>
            {/*<IconButton
              noFocus
              icon={<IconNut/>}
              isDisabled/>*/}
          </ToolGroup>
          <ToolGroup>
            <IconButton
              noFocus
              icon={<IconHand/>}
              title="esper.tool.pan"
              isActive={this.isToolActive(TOOL.PAN)}
              onClick={this.setPanTool}/>
            <IconButton
              noFocus
              icon={<IconFill/>}
              title="esper.mode.fill"
              isDisabled={this.props.isDisabled}
              isActive={this.isZoomToFill}
              onClick={this.setZoomToFill}/>
            <IconButton
              noFocus
              icon={<IconFit/>}
              title="esper.mode.fit"
              isDisabled={this.props.isDisabled}
              isActive={this.isZoomToFit}
              onClick={this.setZoomToFit}/>
          </ToolGroup>
          <ToolGroup>
            <Slider
              noFocus
              value={this.props.zoom}
              min={this.props.minZoom}
              max={this.props.maxZoom}
              precision={this.props.zoomPrecision}
              showCurrentValue
              steps={this.props.zoomSteps}
              minIcon={<IconMinusCircle/>}
              maxIcon={<IconPlusCircle/>}
              isDisabled={this.props.isDisabled}
              tabIndex={null}
              onChange={this.handleZoomChange}/>
          </ToolGroup>
        </ToolbarLeft>
      </Toolbar>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    isSelectionActive: bool.isRequired,
    mode: string.isRequired,
    tool: string.isRequired,
    zoom: number.isRequired,
    zoomPrecision: number.isRequired,
    zoomSteps: arrayOf(number).isRequired,
    minZoom: number.isRequired,
    maxZoom: number.isRequired,
    onMirrorChange: func.isRequired,
    onModeChange: func.isRequired,
    onToolChange: func.isRequired,
    onRotationChange: func.isRequired,
    onZoomChange: func.isRequired
  }

  static defaultProps = {
    zoomPrecision: ZOOM_SLIDER_PRECISION,
    zoomSteps: ZOOM_SLIDER_STEPS
  }
}

module.exports = {
  EsperToolbar
}
