'use strict'

const React = require('react')
const { WindowContext } = require('../main')
const { Titlebar, Toolbar, ToolGroup } = require('../toolbar')
const { Button } = require('../button')
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
  IconRotateLeft,
  IconRotateRight,
  IconHand,
  IconSliders,
  IconMirror,
  IconMinusCircle,
  IconPlusCircle,
  IconFit,
  IconFill
} = require('../icons')


class EsperToolbar extends React.PureComponent {
  get isZoomToFill() {
    return this.props.mode === MODE.FILL
  }

  get isZoomToFit() {
    return this.props.mode === MODE.FIT
  }

  isToolActive(tool) {
    return this.props.tool === tool
  }

  handlePanelToggle = () => {
    this.props.onPanelChange(!this.props.isPanelVisible)
  }

  handleRotateLeft = () => {
    this.props.onRotationChange(-90)
  }

  handleRotateRight = () => {
    this.props.onRotationChange(90)
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
      <Titlebar>
        <Toolbar.Left>
          <ToolGroup>
            <Button
              noFocus
              icon={<IconArrow/>}
              isActive={this.isToolActive(TOOL.ARROW)}
              isDisabled={this.props.isDisabled}
              onClick={this.setArrowTool}/>
            <Button
              noFocus
              icon={<IconSelection/>}
              title="esper.tool.select"
              isActive={this.isToolActive(TOOL.SELECT)}
              isDisabled={this.props.isDisabled || this.props.isSelectionActive}
              onClick={this.setSelectTool}/>
          </ToolGroup>
          <ToolGroup>
            <Button
              noFocus
              icon={<IconRotateLeft/>}
              title="esper.tool.rotate_left"
              isDisabled={this.props.isDisabled}
              onClick={this.handleRotateLeft}/>
            <Button
              noFocus
              icon={<IconRotateRight/>}
              title="esper.tool.rotate_right"
              isDisabled={this.props.isDisabled}
              onClick={this.handleRotateRight}/>
            <Button
              noFocus
              icon={<IconMirror/>}
              title="esper.tool.mirror"
              isDisabled={this.props.isDisabled}
              onClick={this.props.onMirrorChange}/>
          </ToolGroup>
          <ToolGroup>
            <Button
              noFocus
              icon={<IconHand/>}
              title="esper.tool.pan"
              isActive={this.isToolActive(TOOL.PAN)}
              onClick={this.setPanTool}/>
            <Button
              noFocus
              icon={<IconFill/>}
              title="esper.mode.fill"
              isDisabled={this.props.isDisabled}
              isActive={this.isZoomToFill}
              onClick={this.setZoomToFill}/>
            <Button
              noFocus
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
              resolution={this.props.resolution * 100}
              showCurrentValue
              stopOnMouseLeave={this.context.state.frameless}
              steps={this.props.zoomSteps}
              minIcon={<IconMinusCircle/>}
              maxIcon={<IconPlusCircle/>}
              isDisabled={this.props.isDisabled}
              onChange={this.handleZoomChange}/>
          </ToolGroup>
        </Toolbar.Left>
        <Toolbar.Right>
          <ToolGroup>
            <Button
              noFocus
              icon={<IconSliders/>}
              title="esper.tool.edit"
              isActive={this.props.isPanelVisible}
              onClick={this.handlePanelToggle}/>
          </ToolGroup>
        </Toolbar.Right>
      </Titlebar>
    )
  }

  static propTypes = {
    isDisabled: bool.isRequired,
    isSelectionActive: bool.isRequired,
    isPanelVisible: bool.isRequired,
    mode: string.isRequired,
    resolution: number.isRequired,
    tool: string.isRequired,
    zoom: number.isRequired,
    zoomPrecision: number.isRequired,
    zoomSteps: arrayOf(number).isRequired,
    minZoom: number.isRequired,
    maxZoom: number.isRequired,
    onMirrorChange: func.isRequired,
    onModeChange: func.isRequired,
    onPanelChange: func.isRequired,
    onToolChange: func.isRequired,
    onRotationChange: func.isRequired,
    onZoomChange: func.isRequired
  }

  static contextType = WindowContext

  static defaultProps = {
    zoomPrecision: ZOOM_SLIDER_PRECISION,
    zoomSteps: ZOOM_SLIDER_STEPS
  }
}

module.exports = {
  EsperToolbar
}
