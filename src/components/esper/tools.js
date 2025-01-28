import React from 'react'
import { useArgs } from '../../hooks/use-args.js'
import { useEvent } from '../../hooks/use-event.js'
import { useResolution } from '../../hooks/use-resolution.js'
import { useThrottle } from '../../hooks/use-debounce.js'
import { ToolButton, ToolGroup } from '../toolbar.js'
import { MaximizeButton } from '../settings/maximize.js'
import { Button } from '../button.js'
import { Slider } from '../slider.js'
import { ESPER } from '../../constants/index.js'

export const Tool = ({
  current,
  isDisabled,
  isReadOnly,
  isSelectionActive,
  onChange
}) => (
  <ToolGroup>
    <ToolButton
      current={current}
      icon="IconArrow"
      isDisabled={isDisabled}
      onChange={onChange}
      value={ESPER.TOOL.ARROW}/>
    <ToolButton
      current={current}
      icon="IconSelection"
      isDisabled={isDisabled || isReadOnly || isSelectionActive}
      onChange={onChange}
      title="esper.tool.select"
      value={ESPER.TOOL.SELECT}/>
    <ToolButton
      current={current}
      icon="IconHand"
      isDisabled={isDisabled}
      onChange={onChange}
      title="esper.tool.pan"
      value={ESPER.TOOL.PAN}/>
  </ToolGroup>
)

export const Rotation = ({
  isDisabled,
  mirror,
  onMirrorChange,
  onRotationChange
}) => {
  let handleRotate = useEvent((event) => {
    onRotationChange(event.altKey ? 90 : -90)
  })

  return (
    <ToolGroup>
      <Button
        icon="IconRotate"
        isDisabled={isDisabled}
        noFocus
        onClick={handleRotate}
        title="esper.tool.rotate"/>
      <Button
        icon="IconMirror"
        isActive={mirror}
        isDisabled={isDisabled}
        noFocus
        onClick={onMirrorChange}
        title="esper.tool.mirror"/>
    </ToolGroup>
  )
}

export const Mode = ({
  current,
  isDisabled,
  onChange
}) => (
  <ToolGroup>
    <ToolButton
      current={current}
      defaultValue={ESPER.MODE.ZOOM}
      icon="IconFill"
      isDisabled={isDisabled}
      name="mode"
      onChange={onChange}
      title="esper.mode.fill"
      value={ESPER.MODE.FILL}/>
    <ToolButton
      current={current}
      defaultValue={ESPER.MODE.ZOOM}
      icon="IconFit"
      isDisabled={isDisabled}
      name="mode"
      onChange={onChange}
      title="esper.mode.fit"
      value={ESPER.MODE.FIT}/>
  </ToolGroup>
)

export const Zoom = ({
  current,
  isDisabled,
  max,
  min,
  onChange,
  precision = 1000,
  steps = [0.5, 1, 2, 3]
}) => {
  let isWindowFrameless = useArgs('frameless')
  let resolution = useResolution()

  let handleChange = useThrottle((zoom, reason) => {
    onChange({ zoom }, reason === 'button')
  }, { wait: 25 })

  return (
    <ToolGroup>
      <Slider
        isDisabled={isDisabled}
        max={max}
        maxIcon="IconPlusCircle"
        min={min}
        minIcon="IconMinusCircle"
        onChange={handleChange}
        precision={precision}
        resolution={resolution * 100}
        showCurrentValue
        steps={steps}
        stopOnMouseLeave={isWindowFrameless}
        value={current}/>
    </ToolGroup>
  )
}

export const Layout = ({
  isAltLayout = false,
  isDisabled,
  onChange,
  overlay,
  overlayPanel,
  panel
}) => {
  let altButtons = []

  if (panel != null)
    altButtons.push(
      <ToolButton
        key="panel"
        current={panel}
        defaultValue={false}
        icon="IconSliders"
        isDisabled={isDisabled}
        name="panel"
        onChange={onChange}
        title="esper.tool.edit"
        value={true}/>
    )

  if (overlayPanel != null)
    altButtons.push(
      <ToolButton
        key="overlayPanel"
        current={overlayPanel}
        defaultValue={false}
        icon="IconTranscriptionVersions"
        isDisabled={isDisabled}
        name="overlayPanel"
        onChange={onChange}
        title="esper.overlay.panel"
        value={true}/>
    )

  if (isAltLayout)
    return (
      <ToolGroup>{altButtons}</ToolGroup>
    )

  return (
    <ToolGroup>
      <ToolButton
        current={overlay}
        defaultValue={ESPER.OVERLAY.NONE}
        icon="IconTranscriptionLarge"
        isDisabled={isDisabled}
        name="overlay"
        onChange={onChange}
        title="esper.overlay.full"
        value={ESPER.OVERLAY.FULL}/>
      <ToolButton
        current={overlay}
        defaultValue={ESPER.OVERLAY.NONE}
        icon="IconTranscriptionSplitView"
        isDisabled={isDisabled}
        name="overlay"
        onChange={onChange}
        title="esper.overlay.split"
        value={ESPER.OVERLAY.SPLIT}/>
      {altButtons}
      <MaximizeButton
        isDisabled={isDisabled}
        name="esper"/>
    </ToolGroup>
  )
}
