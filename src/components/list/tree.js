import { useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { ListNode } from './node.js'
import { Tree } from '../tree/tree.js'
import { getListHoldIndex } from '../../selectors/index.js'

export const ListTree = ({
  lists = {},
  parent,
  isReadOnly,
  selection,
  onClick,
  onCollapse,
  onContextMenu,
  onDropFiles,
  onDropItems,
  onEditCancel,
  onExpand,
  onMove,
  onSave
}) => {
  let edit = useSelector(state => state.edit.list)
  let holdIndex = useSelector(getListHoldIndex)
  let expanded = useSelector(state => state.sidebar.expand)

  let handleDrop = useEvent((...args) => {
    onMove(...args)
  })

  let handleDropOutside = useEvent((drop) => {
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

    onMove({
      id: drop.id,
      parent: target.id
    }, { idx })
  })

  return (
    <Tree
      className="list-tree"
      nodes={lists}
      root={parent}
      edit={edit}
      expanded={expanded}
      onCollapse={onCollapse}
      onEditCancel={onEditCancel}
      onExpand={onExpand}
      onSave={onSave}>
      {(list, treeProps, renderChildren) => (
        <ListNode
          key={list.id}
          {...treeProps}
          isHolding={holdIndex[list.id]}
          isReadOnly={isReadOnly}
          isSelected={selection === list.id}
          list={list}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onDrop={handleDrop}
          onDropFiles={onDropFiles}
          onDropItems={onDropItems}
          onDropOutside={handleDropOutside}
          onEditCancel={onEditCancel}
          onSave={onSave}>
          {renderChildren}
        </ListNode>
      )}
    </Tree>
  )
}
