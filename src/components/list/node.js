import { memo, useMemo, useRef, useState } from 'react'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useDropItems } from '../../hooks/use-drag-drop-items.js'
import { useDragDropNode } from '../../hooks/use-drag-drop-node.js'
import { useEvent } from '../../hooks/use-event.js'
import { Node } from '../tree/node.js'
import { Collapse } from '../fx.js'
import cx from 'classnames'

import { SASS } from '../../constants/index.js'
const { INDENT, PADDING } = SASS.LIST


const mdd = (month, day, d = new Date) =>
  d.getMonth() === month - 1 && d.getDate() === day

export const ListNode = memo(({
  children,
  depth = 0,
  isDraggingParent,
  isEditing,
  isExpanded,
  isHolding,
  isLastChild,
  isReadOnly,
  isSelected,
  list,
  minDropDepth,
  onClick,
  onCollapse,
  onContextMenu,
  onDrop,
  onDropFiles,
  onDropItems,
  onDropOutside,
  onEditCancel,
  onExpand,
  onSave,
  position
}) => {
  let node = useRef(null)

  let [halloween] = useState(mdd(10, 31))
  let [random] = useState(Math.random)

  let icon = useMemo(() => (
    (halloween && depth && Math.round(random * depth) > (depth * 0.666))
      ? 'Ghost'
      : 'Folder'
  ), [halloween, random, depth])

  let handleDropItems = useEvent((items) => {
    onDropItems({ list: list.id, items })
  })

  let handleDropFiles = useEvent((files) => {
    onDropFiles({ list: list.id, ...files })
  })

  let [{ canDrop, dropIndicator, isDragging, isOver }, dnd] = useDragDropNode(node, {
    depth,
    icon,
    indent: INDENT,
    isDraggingParent,
    isExpanded,
    isLastChild,
    isReadOnly,
    minDropDepth,
    node: list,
    onDrop,
    onDropOutside,
    padding: PADDING,
    position
  })

  let [di, dropItems] = useDropItems({
    isReadOnly,
    onDrop: handleDropItems
  })

  let [df, dropFiles] = useDropPhotoFiles({
    isReadOnly,
    onDrop: handleDropFiles
  })

  canDrop = canDrop || df.canDrop || di.canDrop
  isOver = isOver || df.isOver || di.isOver

  let handleContextMenu = useEvent((event) => {
    if (!isEditing) {
      if (!isSelected) {
        onClick(list)
      }
      onContextMenu(event, 'list', {
        id: list.id
      })
    }
  })

  return (
    <li className={cx('list-node', {
      active: isSelected,
      dragging: isDragging,
      expanded: isExpanded,
      holding: isHolding
    })}>
      <Node
        className={[dropIndicator, {
          over: isOver && canDrop
        }]}
        ref={dropItems(dropFiles(dnd))}
        icon={icon}
        id={list.id}
        isDisabled={isReadOnly || isDragging}
        isEditing={isEditing}
        isExpanded={isExpanded}
        name={list.name}
        onCancel={onEditCancel}
        onClick={onClick}
        onCollapse={onCollapse}
        onContextMenu={handleContextMenu}
        onExpand={onExpand}
        onSave={onSave}/>
      <Collapse in={isExpanded}>
        {children(isDragging)}
      </Collapse>
    </li>
  )
})
