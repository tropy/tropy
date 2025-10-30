import React from 'react'
import { useDispatch } from 'react-redux'
import { useDragDropMetadata } from '../../hooks/use-drag-drop-metadata.js'
import { useEvent } from '../../hooks/use-event.js'
import cx from 'classnames'
import { MetadataLabel } from './label.js'
import { MetadataValue } from './value.js'
import actions from '../../actions/metadata.js'


export const MetadataField = React.memo(({
  hint,
  id,
  isEditing,
  isExtra,
  isDisabled,
  isReadOnly,
  isMixed,
  label,
  onCancel,
  onContextMenu,
  onChange,
  onClick,
  onEdit,
  property,
  text,
  type,
  ...props
}) => {
  let dispatch = useDispatch()
  let isStatic = onChange == null

  let onDragEnd = useEvent(({ property: to, dropEffect }) => {
    // TODO handle copy/move across different items
    dispatch(actions.copy({
      id,
      from: property,
      to
    }, { cut: dropEffect === 'move' }))
  })

  let [{ isOver }, dnd] = useDragDropMetadata({
    id,
    isDisabled: isDisabled || isStatic || isEditing,
    isMixed,
    isReadOnly,
    property,
    text,
    type,
    onDragEnd
  })

  let handleChange = useEvent((value, hasChanged, hasBeenForced) => {
    onChange({
      [property]: {
        text: value,
        type
      }
    }, hasChanged, hasBeenForced)
  })

  let handleCancel = useEvent((hasChanged, hasBeenForced) => {
    if (hasBeenForced)
      onCancel()
    else
      handleChange(text, hasChanged)
  })

  let handleClick = useEvent(() => {
    if (!(isDisabled || isReadOnly))
      onEdit?.(property)
  })

  let handleContextMenu = useEvent((event) => {
    onContextMenu?.(event, {
      isDisabled,
      isExtra,
      isReadOnly,
      property
    })
  })

  return (
    <li
      className={cx('metadata-field', {
        extra: isExtra,
        mixed: isMixed,
        over: isOver,
        static: isStatic,
        clickable: onClick != null
      })}
      onContextMenu={handleContextMenu}>

      <MetadataLabel id={property} hint={hint}>
        {label}
      </MetadataLabel>

      <MetadataValue
        {...props}
        ref={dnd}
        onClick={onClick || handleClick}
        property={property}
        text={text}
        type={type}
        isDisabled={isDisabled}
        isEditing={isEditing}
        isReadOnly={isReadOnly}
        onCancel={isStatic ? null : handleCancel}
        onChange={isStatic ? null : handleChange}/>
    </li>
  )
})
