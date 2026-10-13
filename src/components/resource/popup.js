import { useState } from 'react'
import { ResourceSelect } from './select.js'
import { Popup } from '../popup.js'
import { SASS } from '../../constants/index.js'
import { viewport } from '../../dom.js'
import { useEventHandler } from '../../hooks/use-event-handler.js'

const { OPTION, PANEL } = SASS

const getHeight = (rows, maxRows) =>
  OPTION.HEIGHT * (Math.min(rows || 1, maxRows) + 1) + OPTION.LIST_MARGIN

function fitToViewport ({ left, top, width, height }) {
  let bounds = viewport()

  if (left + width > bounds.width && left > width) left -= width
  if (top + height > bounds.height && top > height) top -= height

  return { left, top }
}

export const PopupSelect = ({
  left,
  maxRows = 10,
  top,
  width = PANEL.MIN_WIDTH,
  onClose,
  ...props
}) => {
  let [height, setHeight] = useState(() =>
    getHeight(props.options.length, maxRows))

  let [position] = useState(() =>
    fitToViewport({ left, top, width, height }))

  // The position is fixed, so close on window resize.
  useEventHandler(window, 'resize', onClose)

  let handleResize = ({ rows }) => {
    setHeight(getHeight(rows, maxRows))
  }

  return (
    <Popup
      className="popup-select"
      style={{ ...position, width, height }}>
      <ResourceSelect
        {...props}
        autofocus
        canClearByBackspace={false}
        hideClearButton
        isRequired
        isStatic
        isValueHidden
        maxRows={maxRows}
        onClose={onClose}
        onResize={handleResize}/>
    </Popup>
  )
}
