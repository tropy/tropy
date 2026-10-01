import React from 'react'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { NodeContainer } from '../tree/node-container.js'
import { useDropItems } from '../../hooks/use-drag-drop-items.js'


export const TrashListNode = React.memo(({
  isSelected,
  onClick,
  onContextMenu,
  onDropItems
}) => {

  let [{ isOver }, drop] = useDropItems({
    onDrop: onDropItems
  })

  return (
    <li
      ref={drop}
      className={cx({
        active: isSelected,
        over: isOver
      })}
      onClick={onClick}
      onContextMenu={(event) => {
        onContextMenu(event, 'trash', {})
      }}>
      <NodeContainer icon="Trash">
        <div className="name">
          <div className="truncate">
            <FormattedMessage id="sidebar.trash"/>
          </div>
        </div>
      </NodeContainer>
    </li>
  )
})
