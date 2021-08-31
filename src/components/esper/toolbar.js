import React from 'react'
import { WindowContext } from '../window'
import { Titlebar, Toolbar, ToolGroup } from '../toolbar'
import { Button } from '../button'
import { Slider } from '../slider'
import { arrayOf, bool, func, number, string } from 'prop-types'
import throttle from 'lodash.throttle'

import {
  IconArrow,
  IconSelection,
  IconRotate,
  IconHand,
  IconSliders,
  IconMirror,
  IconMinusCircle,
  IconPlusCircle,
  IconFit,
  IconFill
} from '../icons'

import { ESPER, SASS } from '../../constants'

const {
  TOOL,
  MODE
} = ESPER

const {
  ZOOM_SLIDER_PRECISION,
  ZOOM_SLIDER_STEPS
} = SASS.ESPER


export class EsperToolbar extends React.PureComponent {
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

  handleRotate = (event) => {
    this.props.onRotationChange(event.altKey ? 90 : -90)
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
              isDisabled={
                this.props.isSelectionActive ||
                this.props.isReadOnly}
              onClick={this.setSelectTool}/>
          </ToolGroup>
          <ToolGroup>
            <Button
              noFocus
              icon={<IconRotate/>}
              title="esper.tool.rotate"
              isDisabled={this.props.isReadOnly}
              onClick={this.handleRotate}/>
            <Button
              noFocus
              icon={<IconMirror/>}
              title="esper.tool.mirror"
              isActive={this.props.mirror}
              isDisabled={this.props.isReadOnly}
              onClick={this.props.onMirrorChange}/>
          </ToolGroup>
          <ToolGroup>
            <Button
              noFocus
              icon={<IconHand/>}
              title="esper.tool.pan"
              isActive={this.isToolActive(TOOL.PAN)}
              isDisabled={this.props.isDisabled}
              onClick={this.setPanTool}/>
            <Button
              noFocus
              icon={<IconFill/>}
              title="esper.mode.fill"
              isActive={this.isZoomToFill}
              isDisabled={this.props.isDisabled}
              onClick={this.setZoomToFill}/>
            <Button
              noFocus
              icon={<IconFit/>}
              title="esper.mode.fit"
              isActive={this.isZoomToFit}
              isDisabled={this.props.isDisabled}
              onClick={this.setZoomToFit}/>
          </ToolGroup>
          <ToolGroup>
            <Slider
              isDisabled={this.props.isDisabled}
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
              isDisabled={this.props.isDisabled}
              onClick={this.handlePanelToggle}/>
          </ToolGroup>
        </Toolbar.Right>
      </Titlebar>
    )
  }

  static propTypes = {
    isDisabled: bool,
    isReadOnly: bool,
    isSelectionActive: bool,
    isPanelVisible: bool,
    mode: string.isRequired,
    mirror: bool,
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
    mode: MODE.ZOOM,
    resolution: 1,
    tool: TOOL.ARROW,
    zoom: 1,
    zoomPrecision: ZOOM_SLIDER_PRECISION,
    zoomSteps: ZOOM_SLIDER_STEPS
  }
}
