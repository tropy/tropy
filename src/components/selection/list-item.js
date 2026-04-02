import { memo, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { useDragDropSelection } from '../../hooks/use-drag-drop-selection.js'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useEvent } from '../../hooks/use-event.js'
import { Editable } from '../editable.js'
import { Thumbnail } from '../photo/thumbnail.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { pick } from '../../common/util.js'
import { testFocusChange } from '../../dom.js'
import cx from 'classnames'

export const SelectionListItem = memo(({
  getAdjacent,
  isActive,
  isDisabled,
  isEditing,
  isItemOpen,
  isLast,
  isSortable,
  onChange,
  onContextMenu,
  onDrop,
  onEdit,
  onEditCancel,
  onItemOpen,
  onSelect,
  photo,
  selection,
  size = 48,
  title
}) => {
  let container = useRef()
  let hasFocusChanged = useRef()
  let intl = useIntl()

  let [{ isDragging, isOver, direction }, dnd] =
    useDragDropSelection(container, {
      selection,
      photo,
      getAdjacent,
      isDisabled,
      isEditing,
      isSortable,
      onDrop
    })

  useEffect(() => {
    if (isActive)
      container.current?.scrollIntoViewIfNeeded()
  }, [isActive])

  let handleMouseDown = useEvent(() => {
    hasFocusChanged.current = testFocusChange()
  })

  let handleClick = useClickHandler({
    onClick () {
      onSelect(selection)
      return !isActive || hasFocusChanged.current?.()
    },

    onSingleClick () {
      if (!(isDisabled || isDragging)) {
        onEdit({ selection: selection.id })
      }
    },

    onDoubleClick () {
      if (!isItemOpen)
        onItemOpen(selection)
      else if (!(isDisabled || isDragging)) {
        onEdit({ selection: selection.id })
      }
    }
  })

  let handleChange = useEvent((text) => {
    onChange({
      id: selection.id,
      data: {
        [title]: { text, type: 'text' }
      }
    })
    onEditCancel()
  })

  let handleContextMenu = useEvent((event) => {
    onSelect(selection)
    onContextMenu(
      event,
      isDisabled ? 'selection-read-only' : 'selection',
      pick(photo, ['id', 'item', 'path', 'protocol'], {
        selection: selection.id
      }))
  })

  let titleText = useSelector(state =>
    state.metadata?.[selection.id]?.[title]?.text)
  let placeholder = intl.formatMessage({
    id: 'panel.photo.selection'
  })

  return (
    <li
      ref={dnd}
      className={cx({
        active: isActive,
        dragging: isDragging,
        'drop-target': isSortable,
        last: isLast,
        over: isOver,
        selection: true,
        [direction]: direction
      })}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onMouseDown={handleMouseDown}>
      <div className="thumbnail-container">
        <Thumbnail
          {...pick(selection, Thumbnail.keys)}
          consolidated={photo.consolidated}
          color={photo.color}
          mimetype={photo.mimetype}
          size={size}/>
      </div>
      <div className="title">
        <Editable
          display={titleText || placeholder}
          value={titleText}
          resize
          isActive={isEditing}
          isDisabled={isDisabled}
          onCancel={onEditCancel}
          onChange={handleChange}/>
      </div>
      <div className="icon-container">
        <TranscriptionIcon id={selection.transcriptions?.at(-1)}/>
      </div>
    </li>
  )
})
