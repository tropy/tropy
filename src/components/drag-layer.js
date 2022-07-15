import React from 'react'
import { DND, useDragLayer } from './dnd.js'
import { useDropEffect } from '../hooks/use-drop-effect.js'
import { ItemDragPreview } from './item/drag-preview.js'
import { PhotoDragPreview } from './photo/drag-preview.js'
import { ListDragPreview } from './list/drag-preview.js'
import { FieldDragPreview } from './metadata/drag-preview.js'
import { shapes } from './util.js'
import { bool, element, object, string } from 'prop-types'


export function DragPreviewPositioner({
  children,
  cursor,
  isRelative,
  origin,
  position
}) {
  let style = {}
  let { x, y } = position

  let offset = {
    x: cursor.x - origin.x,
    y: cursor.y - origin.y
  }

  if (isRelative) {
    style['--offset-x'] = `${offset.x}px`
    style['--offset-y'] = `${offset.y}px`
    x -= offset.x
    y -= offset.y
  }

  style.transform = `translate(${x}px, ${y}px)`

  return (
    <div className="drag-preview-positioner" style={style}>
      {children}
    </div>
  )
}

DragPreviewPositioner.propTypes = {
  children: element.isRequired,
  cursor: shapes.point.isRequired,
  isRelative: bool,
  origin: shapes.point.isRequired,
  position: shapes.point.isRequired
}


const dragPreview = {
  [DND.ITEMS]: ItemDragPreview,
  [DND.PHOTO]: PhotoDragPreview,
  [DND.SELECTION]: PhotoDragPreview,
  [DND.LIST]: ListDragPreview,
  [DND.FIELD]: FieldDragPreview
}


export function DragLayer(props) {
  let dropEffect = useDropEffect()

  let { cursor, isDragging, item, origin, position, type } =
    useDragLayer(monitor => ({
      cursor: monitor.getInitialClientOffset(),
      isDragging: monitor.isDragging(),
      item: monitor.getItem(),
      origin: monitor.getInitialSourceClientOffset(),
      position: monitor.getClientOffset(),
      type: monitor.getItemType()
    }))

  let DragPreview = dragPreview[type]

  if (!isDragging || !DragPreview)
    return null

  return (
    <div className={`drag-layer on-drop-${dropEffect}`}>
      <DragPreviewPositioner
        cursor={cursor}
        isRelative={item.position === 'relative'}
        origin={origin}
        position={position}>
        <DragPreview {...props} item={item}/>
      </DragPreviewPositioner>
    </div>
  )
}

DragLayer.propTypes = {
  cache: string.isRequired,
  tags: object.isRequired
}
