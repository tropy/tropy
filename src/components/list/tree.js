import { ListNode, NewListNode } from './node.js'
import { Collapse } from '../fx.js'

const hasNewListNode = (edit, parent) =>
  edit && edit.id == null && edit.parent === parent

export const ListTree = ({
  depth = 0,
  expand = {},
  hold = {},
  lists = {},
  minDropDepth = 0,
  parent,
  ...props
}) => {
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
              hold={hold}
              depth={depth}
              minDropDepth={minDropDepth}
              expand={expand}
              isSelected={props.selection === id}
              isExpandable={isExpandable}
              isExpanded={isExpandable && isExpanded}
              isEditing={props.edit?.id === id}
              isHolding={hold[id]}
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
