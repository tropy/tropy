import { NodeContainer } from './node-container.js'
import { Editable } from '../editable.js'
import { useEvent } from '../../hooks/use-event.js'

export const Node = ({
  id,
  isDisabled,
  isEditing,
  isExpanded,
  name,
  onCancel,
  onClick,
  onCollapse,
  onExpand,
  onSave,
  ...props
}) => {
  let isNew = id == null
  let isExpandable = onExpand && onCollapse

  let handleChange = useEvent((newName) => {
    onSave(newName)
  })

  let handleClick = useEvent(() => {
    if (!(isEditing || isNew)) {
      onClick?.(id)
    }
  })

  let handleExpandButtonClick = useEvent(() => {
    (isExpanded ? onCollapse : onExpand)(id)
  })

  return (
    <NodeContainer
      {...props}
      onClick={handleClick}
      onExpandButtonClick={isExpandable && handleExpandButtonClick}>
      <div className="name">
        <Editable
          isActive={isEditing || isNew}
          isDisabled={isDisabled}
          isRequired
          onCancel={onCancel}
          onChange={handleChange}
          resize
          value={name}/>
      </div>
    </NodeContainer>
  )
}
