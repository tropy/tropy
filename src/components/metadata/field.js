import React from 'react'
import { useDispatch } from 'react-redux'
import { useDragSource } from '../../hooks/use-drag-source.js'
import { useDropTarget } from '../../hooks/use-drop-target.js'
import { useEvent } from '../../hooks/use-event.js'
import cx from 'classnames'
import { MetadataLabel } from './label.js'
import { MetadataValue } from './value.js'
import { FieldDragPreview } from './drag-preview.js'
import actions from '../../actions/metadata.js'
import { auto } from '../../format.js'
import { blank } from '../../common/util.js'


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

  // A value drags onto another field of the same subjects:
  // moved, or copied with Alt.
  let isDragDisabled = isDisabled || isStatic || isEditing

  let [, drag] = useDragSource({
    isDisabled: isDragDisabled || blank(text) || id == null,
    getData: () => ({
      type: 'field',
      id,
      isMixed,
      property,
      value: auto(text, type)
    }),
    preview: (data) => <FieldDragPreview item={data}/>
  })

  let [{ isOver }, drop] = useDropTarget({
    accept: 'field',
    isDisabled: isDragDisabled || isReadOnly,
    canDrop: (data) => data.id === id && data.property !== property,
    getDropEffect: (data, { altKey }) => altKey ? 'copy' : 'move',
    onDrop: (data, { dropEffect }) => {
      // TODO handle copy/move across different items
      dispatch(actions.copy({
        id,
        from: data.property,
        to: property
      }, { cut: dropEffect === 'move' }))
    }
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
        ref={(node) => {
          drag(node)
          drop(node)
        }}
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
