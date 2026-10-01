import { memo, useRef } from 'react'
import cx from 'classnames'
import { Editable } from '../editable.js'
import { Thumbnail } from './thumbnail.js'
import { SelectionList } from '../selection/list.js'
import { Icon } from '../icons.js'
import { Button } from '../button.js'
import { TranscriptionIcon } from '../transcription/icon.js'
import { useDragDropPhoto } from '../../hooks/use-drag-drop-photo.js'
import { useClickHandler } from '../../hooks/use-click-handler.js'
import { useEvent } from '../../hooks/use-event.js'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
import { pick, pluck } from '../../common/util.js'
import { testFocusChange } from '../../dom.js'
import { TYPE } from '../../constants/index.js'

export const PhotoListItem = memo(({
  data,
  getAdjacent,
  isDisabled,
  isEditing,
  isExpandable,
  isExpanded,
  isItemOpen,
  isSelected,
  isVertical,
  onChange,
  onConsolidate,
  onContextMenu,
  onContract,
  onDropPhoto,
  onEdit,
  onEditCancel,
  onExpand,
  onItemOpen,
  onSelect,
  onSelectionSort,
  photo,
  selection,
  selections,
  size = 48,
  title
}) => {
  let container = useRef()
  let hasFocusChanged = useRef()

  let isActive = isSelected && selection == null

  let [{ canDrop, direction, isDragging, isOver }, dnd] =
    useDragDropPhoto(container, {
      photo,
      getAdjacent,
      isDisabled: isDisabled || isEditing,
      isVertical,
      onDrop: onDropPhoto
    })

  useScrollIntoView(container, { when: isSelected })

  let select = useEvent(() => {
    if (!isActive)
      onSelect(photo)
  })

  let edit = useEvent(() => {
    if (!(isDisabled || isDragging))
      onEdit(photo)
  })

  let handleMouseDown = useEvent(() => {
    hasFocusChanged.current = testFocusChange()
  })

  let handleClick = useClickHandler({
    onClick () {
      select()
      return !isActive || hasFocusChanged.current?.()
    },

    onSingleClick: edit,

    onDoubleClick () {
      if (!isItemOpen)
        onItemOpen(photo)
      else
        edit()
    }
  })

  let handleChange = useEvent((text) => {
    onChange({
      id: photo.id,
      data: {
        [title]: { text, type: TYPE.TEXT }
      }
    })

    onEditCancel()
  })

  let handleContextMenu = useEvent((event) => {
    select()
    onContextMenu(
      event,
      isDisabled ? 'photo-read-only' : 'photo',
      pick(photo, ['id', 'item', 'path', 'protocol']))
  })

  let handleConsolidate = useEvent((event) => {
    event?.stopPropagation()
    onConsolidate([photo.id], { force: true, prompt: true })
  })

  let handleTwistyButtonClick = useEvent((event) => {
    event.stopPropagation()

    if (isExpanded)
      onContract(photo)
    else
      onExpand(photo)
  })

  return (
    <li
      ref={dnd}
      className={cx('photo', {
        active: isActive,
        dragging: isDragging,
        expandable: isExpandable,
        expanded: isExpanded,
        over: isOver && canDrop,
        [direction]: direction
      })}>
      <div
        className="photo-container"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}>
        {isExpandable && (
          <Button
            noFocus
            icon={<Icon name="Chevron9"/>}
            className="disclosure"
            onClick={handleTwistyButtonClick}/>
        )}
        <div className="thumbnail-container">
          <Thumbnail
            {...pick(photo, Thumbnail.keys)}
            size={size}/>
        </div>
        <div className="title">
          <Editable
            value={data?.[photo.id]?.[title]?.text}
            resize
            isActive={isEditing}
            isDisabled={isDisabled}
            onCancel={onEditCancel}
            onChange={handleChange}/>
        </div>
        <div className="icon-container">
          {photo.broken && (
            <Button
              icon={<Icon name="Warning"/>}
              title="photo.consolidate"
              onClick={handleConsolidate}/>
          )}
          {isExpandable && <Icon name="Selection"/>}
          <TranscriptionIcon id={photo.transcriptions?.at(-1)}/>
        </div>
      </div>
      {isExpanded && (
        <SelectionList
          isDisabled={isDisabled}
          isItemOpen={isItemOpen}
          onChange={onChange}
          onContextMenu={onContextMenu}
          onEdit={onEdit}
          onEditCancel={onEditCancel}
          onItemOpen={onItemOpen}
          onSelect={onSelect}
          onSort={onSelectionSort}
          photo={photo}
          selections={pluck(selections, photo.selections)}/>
      )}
    </li>
  )
})
