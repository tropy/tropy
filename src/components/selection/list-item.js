import { memo, useEffect, useRef } from 'react'
import cx from 'classnames'
import { useIntl } from 'react-intl'
import { Editable } from '../editable.js'
import { Thumbnail } from '../photo/thumbnail.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useDragDropSelection } from '../../hooks/use-drag-drop-selection.js'
import { useEvent } from '../../hooks/use-event.js'
import { testFocusChange } from '../../dom.js'
import { pick } from '../../common/util.js'


export const SelectionListItem = memo(({
  data,
  getAdjacent,
  isActive,
  isDisabled,
  isEditing,
  isItemOpen,
  isLast,
  isSortable,
  photo,
  selection,
  size = 48,
  title: titleProperty,
  onChange,
  onContextMenu,
  onDropSelection,
  onEdit,
  onEditCancel,
  onItemOpen,
  onSelect
}) => {
  let intl = useIntl()
  let container = useRef()
  let hasFocusChanged = useRef()

  let { isDragging, isOver, offset, drag, drop } = useDragDropSelection({
    container,
    photo,
    selection,
    isVertical: true,
    canDrag: !isDisabled && !isEditing,
    getAdjacent,
    onDropSelection
  })

  useEffect(() => {
    if (isActive) {
      container.current?.scrollIntoViewIfNeeded()
    }
  }, [isActive])

  let select = useEvent(() => {
    onSelect(selection)
  })

  let open = useEvent(() => {
    onItemOpen(selection)
  })

  let handleSingleClick = useEvent(() => {
    if (!(isDisabled || isDragging)) {
      onEdit({ selection: selection.id })
    }
  })

  let handleClick = useClickHandler({
    onClick() {
      hasFocusChanged.current = testFocusChange()
      select()
      return !isActive || hasFocusChanged.current()
    },
    onSingleClick: handleSingleClick,
    onDoubleClick() {
      if (!isItemOpen) open()
      else handleSingleClick()
    }
  })

  let handleMouseDown = useEvent(() => {
    hasFocusChanged.current = testFocusChange()
  })

  let handleContextMenu = useEvent((event) => {
    select()
    onContextMenu(
      event,
      isDisabled ? 'selection-read-only' : 'selection',
      pick(photo, ['id', 'item', 'path', 'protocol'], {
        selection: selection.id
      }))
  })

  let handleChange = useEvent((text) => {
    onChange({
      id: selection.id,
      data: {
        [titleProperty]: { text, type: 'text' }
      }
    })
    onEditCancel()
  })

  let title = data?.[selection.id]?.[titleProperty]?.text
  let placeholder = intl.formatMessage({ id: 'panel.photo.selection' })

  return (
    <li
      ref={drag(drop(container))}
      className={cx({
        'active': isActive,
        'dragging': isDragging,
        'drop-target': isSortable,
        'last': isLast,
        'over': isOver,
        'selection': true,
        [offset ? 'after' : 'before']: isOver && offset != null
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
          orientation={photo.orientation}
          size={size}/>
      </div>
      <div className="title">
        <Editable
          display={title || placeholder}
          value={title}
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
