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


// TODO remove
export const NewListNode = (props) => (
  <Node className="list new-list" {...props}/>
)

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


// class ListNode extends React.PureComponent {
//   state = {
//     depth: null,
//     offset: null
//   }

//   get direction() {
//     let { props, state } = this
//     return (!this.isOver || state.offset == null) ? null :
//         (state.offset < 1) ? 'before' :
//             (props.isLast && !props.isExpanded && state.depth < props.depth) ?
//                 ['after', `depth-${props.depth - this.getDropDepth()}`] : 'after'
//   }


//   get isOver() {
//     return this.props.isOver && this.props.canDrop
//   }

//   get isDragSource() {
//     return !(
//       this.props.isReadOnly ||
//       this.props.isEditing ||
//       this.props.isDraggingParent
//     )
//   }

//   get isDropTarget() {
//     return !(
//       this.props.isReadOnly ||
//       this.props.isDragging ||
//       this.props.isDraggingParent
//     )
//   }

//   getDropDepth(depth = this.state.depth) {
//     return restrict(depth, this.props.minDropDepth, this.props.depth)
//   }

//   getDropOutsidePosition(depth = 1, other) {
//     let { lists, list } = this.props
//     let prev

//     for (; depth > 0 && list.parent != null; --depth) {
//       prev = list.id
//       list = lists[list.parent]
//       if (list.children.at(-1) !== prev) break
//     }

//     let idx = (prev == null) ?
//       list.children.length :
//       list.children.indexOf(prev) + 1

//     let pos = list.children.indexOf(other.id)
//     if (pos >= 0 && pos < idx) idx--

//     return { parent: list.id, idx }
//   }

//   getDropPosition(other) {
//     let { offset } = this.state
//     let { list, isExpanded, isLast, position } = this.props

//     if (offset == null || (offset === 1 && isExpanded)) {
//       return {
//         parent: list.id,
//         idx: 0
//       }
//     }

//     let depth = this.getDropDepth()
//     if (isLast && offset === 1 && depth < this.props.depth) {
//       return this.getDropOutsidePosition(1 + this.props.depth - depth, other)
//     }

//     return {
//       parent: list.parent,
//       idx: (list.parent !== other.parent || position < other.idx) ?
//         position + offset :
//         position - 1 + offset
//     }
//   }

//   connect(element) {
//     if (this.isDragSource) {
//       element = this.props.connectDragSource(element)
//     }
//     if (this.isDropTarget) {
//       element = this.props.connectDropTarget(element)
//     }
//     return element
//   }

//   get classes() {
//     return ['list-node', {
//       active: this.props.isSelected,
//       dragging: this.props.isDragging,
//       expandable: this.props.isExpandable,
//       expanded: this.props.isExpanded,
//       holding: this.props.isHolding
//     }]
//   }



// const DragSourceSpec = {
//   beginDrag({ list, depth, position }) {
//     return {
//       ...list,
//       idx: position,
//       padding: PADDING + INDENT * depth,
//       position: 'relative'
//     }
//   }
// }

// const DragSourceCollect = (connect, monitor) => ({
//   connectDragSource: connect.dragSource(),
//   connectDragPreview: connect.dragPreview(),
//   isDragging: monitor.isDragging()
// })

// const DropTargetSpec = {
//   hover({ depth }, monitor, node) {
//     let type = monitor.getItemType()

//     switch (type) {
//       case DND.LIST: {
//         let { left, top, height } = bounds(node.container)
//         let { x, y } = monitor.getClientOffset()
//         let offset = (y - top) / height

//         node.setState({
//           depth: restrict(Math.round((x - left - PADDING) / INDENT), 0, depth),
//           offset: offset < 0.33 ? 0 : offset > 0.67 ? 1 : null
//         })
//         break
//       }
//       default:
//         if (node.state.offset != null) {
//           node.setState({ detph: null, offset: null })
//         }
//     }
//   },

//   canDrop(props, monitor) {
//     switch (monitor.getItemType()) {
//       case DND.FILE:
//         return hasPhotoFiles(monitor.getItem())
//       case DND.LIST:
//         return !(props.isDragging || props.isDraggingParent)
//       default:
//         return true
//     }
//   },

//   drop({ list, ...props }, monitor, node) {
//     try {
//       let type = monitor.getItemType()
//       let item = monitor.getItem()

//       switch (type) {
//         case DND.LIST: {
//           let { parent, idx } = node.getDropPosition(item)
//           props.onMove({ id: item.id, parent }, { idx })
//           break
//         }
//         case DND.ITEMS:
//           props.onDropItems({
//             list: list.id,
//             items: item.items
//           })
//           break
//         case DND.FILE:
//         case DND.URL: {
//           let files = getDroppedFiles(item)
//           if (files) {
//             props.onDropFiles({ list: list.id, ...files })
//           }
//           return files
//         }
//       }

//     } finally {
//       node.setState({ detph: null, offset: null })
//     }
//   }
// }

// const DropTargetCollect = (connect, monitor) => ({
//   connectDropTarget: connect.dropTarget(),
//   isOver: monitor.isOver(),
//   canDrop: monitor.canDrop()
// })


// const ListNodeContainer =
//   DragSource(DND.LIST, DragSourceSpec, DragSourceCollect)(
//     DropTarget([
//       DND.LIST, DND.ITEMS, DND.FILE, DND.URL],
//     DropTargetSpec,
//     DropTargetCollect)(ListNode))

// export {
//   ListNodeContainer as ListNode,
//   NewListNode
// }

