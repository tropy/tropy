import { useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { ListNode, NewListNode } from './node.js'
import { Collapse } from '../fx.js'
import { getListHoldIndex } from '../../selectors/index.js'

const hasNewListNode = (edit, parent) =>
  edit && edit.id == null && edit.parent === parent

export const ListTree = ({
  depth = 0,
  isDraggingParent = false,
  lists = {},
  minDropDepth = 0,
  parent,
  ...props
}) => {

  // TODO move recursion to Tree component so these hooks only exist once at the root!

  let holdIndex = useSelector(getListHoldIndex)
  let expanded = useSelector(state => state.sidebar.expand)

  let handleDrop = useEvent((...args) => {
    console.log('drop')
    props.onMove(...args) // TODO dispatch
  })

  let handleDropOutside = useEvent((drop) => {
    console.log('drop outside')
    // TODO move to action? and dispatch
    let target = lists[drop.parent]
    let prev

    for (let dd = drop.depth; dd > 0 && target.parent != null; --dd) {
      prev = target.id
      target = lists[target.parent]
      if (target.children.at(-1) !== prev) break
    }

    let idx = (prev == null)
      ? target.children.length
      : target.children.indexOf(prev) + 1

    let pos = target.children.indexOf(drop.id)
    if (pos >= 0 && pos < idx) idx--

    props.onMove({
      id: drop.id,
      parent: target.id
    }, { idx })
  })

  return (
    <ol className="list-tree">
      {parent.children.map((id, idx, all) => {
        if (id in lists) {
          let list = lists[id]
          let newListNode = hasNewListNode(props.edit, id)
          let isExpandable = newListNode || list.children.length > 0
          let isExpanded = newListNode || expanded[id]
          let isLastChild = idx === all.length - 1

          return (
            <ListNode
              key={id}
              depth={depth}
              isDraggingParent={isDraggingParent}
              isEditing={props.edit?.id === id}
              isExpandable={isExpandable}
              isExpanded={isExpandable && isExpanded}
              isHolding={holdIndex[id]}
              isLastChild={isLastChild}
              isReadOnly={props.isReadOnly}
              isSelected={props.selection === id}
              list={list}
              minDropDepth={minDropDepth}
              onClick={props.onClick}
              onCollapse={props.onCollapse}
              onContextMenu={props.onContext}
              onDrop={handleDrop}
              onDropFiles={props.onDropFiles}
              onDropItems={props.onDropItems}
              onDropOutside={handleDropOutside}
              onEditCancel={props.onEditCancel}
              onExpand={props.onExpand}
              onSave={props.onSave}
              position={idx}>
              {(isDragging) => (
                <ListTree
                  {...props}
                  depth={1 + depth}
                  minDropDepth={isLastChild ? minDropDepth : depth}
                  isDraggingParent={isDraggingParent || isDragging}
                  lists={lists}
                  parent={list}/>
              )}
            </ListNode>
          )
        }
      })}
      <Collapse
        tagName="li"
        className="list-node"
        in={hasNewListNode(props.edit, parent.id)}>
        <NewListNode
          parent={props.edit?.parent}
          onCancel={props.onEditCancel}
          onSave={props.onSave}/>
      </Collapse>
    </ol>
  )
}
