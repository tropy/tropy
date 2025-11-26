import { useSelector } from 'react-redux'
import { ListNode, NewListNode } from './node.js'
import { Collapse } from '../fx.js'
import { getListHoldIndex } from '../../selectors/index.js'

const hasNewListNode = (edit, parent) =>
  edit && edit.id == null && edit.parent === parent

export const ListTree = ({
  depth = 0,
  expand = {},
  lists = {},
  minDropDepth = 0,
  parent,
  ...props
}) => {
  let holdIndex = useSelector(getListHoldIndex)

  return (
    <ol className="list-tree">
      {parent.children.map((id, idx, all) => {
        if (id in lists) {
          let list = lists[id]
          let newListNode = hasNewListNode(props.edit, id)
          let isExpandable = newListNode || list.children.length > 0
          let isExpanded = newListNode || expand[id]

          return (
            <ListNode
              {...props}
              key={id}
              list={list}
              lists={lists}
              depth={depth}
              minDropDepth={minDropDepth}
              expand={expand}
              isSelected={props.selection === id}
              isExpandable={isExpandable}
              isExpanded={isExpandable && isExpanded}
              isEditing={props.edit?.id === id}
              isHolding={holdIndex[id]}
              isLast={idx === all.length - 1}
              position={idx}/>
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
