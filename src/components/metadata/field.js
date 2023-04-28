import React from 'react'
import { useDispatch } from 'react-redux'
import { arrayOf, bool, func, number, string, oneOfType } from 'prop-types'
import { useDragDropMetadata } from '../../hooks/use-drag-drop-metadata.js'
import { useEvent } from '../../hooks/use-event.js'
import cx from 'classnames'
import { MetadataLabel } from './label.js'
import { MetadataValue } from './value.js'
import actions from '../../actions/metadata.js'


export const MetadataField = ({
  id,
  isExtra,
  isDisabled,
  isReadOnly,
  isMixed,
  label,
  onContextMenu,
  onChange,
  onClick,
  onEdit,
  onEditCancel,
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
    isDisabled: isDisabled || isStatic,
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
      onEditCancel()
    else
      handleChange(text, hasChanged)
  })

  let handleClick = useEvent(() => {
    if (!(isDisabled || isReadOnly))
      onEdit?.(property)
  })

  let handleContextMenu = useEvent((event) => {
    onContextMenu(event, {
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

      <MetadataLabel id={property}>
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
        isReadOnly={isReadOnly}
        onCancel={isStatic ? null : handleCancel}
        onChange={isStatic ? null : handleChange}/>
    </li>
  )
}

MetadataField.propTypes = {
  ...MetadataValue.propTypes,
  id: arrayOf(number),
  isDisabled: bool,
  isExtra: bool,
  isMixed: bool,
  isReadOnly: bool,
  label: string,
  onChange: func,
  onClick: func,
  onCopy: func,
  onEdit: func,
  onEditCancel: func,
  property: string,
  text: oneOfType([string, number]),
  type: string
}
