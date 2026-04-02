import cx from 'classnames'
import { Collapse } from '../fx.js'
import { Node } from './node.js'

export const Tree = ({
  children,
  className,
  depth = 0,
  edit,
  expanded,
  isDraggingParent = false,
  minDropDepth = 0,
  nodes,
  onCollapse,
  onEditCancel,
  onExpand,
  onSave,
  root
}) => (
  <ol className={cx('tree', className)}>
    {(root.children || []).map((id, idx, all) => {
      if (!(id in nodes)) return null
      let node = nodes[id]
      let isLastChild = idx === all.length - 1
      let isEditing = edit?.id === id
      let isNewNode = edit?.id == null && edit?.parent === id
      let isExpandable = isNewNode || node.children?.length > 0
      let isExpanded = isExpandable && (isNewNode || expanded?.[id])

      return children(node, {
        depth,
        isDraggingParent,
        isEditing,
        isExpandable,
        isExpanded,
        isLastChild,
        minDropDepth,
        onCollapse: isExpandable ? onCollapse : null,
        onExpand: isExpandable ? onExpand : null,
        position: idx
      }, (isDragging) => (
        <Tree
          className={className}
          depth={depth + 1}
          edit={edit}
          expanded={expanded}
          isDraggingParent={isDraggingParent || isDragging}
          minDropDepth={isLastChild ? minDropDepth : depth}
          nodes={nodes}
          onCollapse={onCollapse}
          onEditCancel={onEditCancel}
          onExpand={onExpand}
          onSave={onSave}
          root={node}>
          {children}
        </Tree>
      ))
    })}
    {onSave && (
      <Collapse tagName="li" in={edit?.id == null && edit?.parent === root.id}>
        <Node
          className="new-node"
          parent={edit?.parent}
          onCancel={onEditCancel}
          onSave={onSave}/>
      </Collapse>
    )}
  </ol>
)
