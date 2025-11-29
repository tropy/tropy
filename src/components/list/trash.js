import React from 'react'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { NodeContainer } from '../tree/node-container.js'
import { DND, useDrop } from '../dnd.js'


export const TrashListNode = React.memo(({
  isSelected,
  onClick,
  onContextMenu,
  onDropItems
}) => {

  let [{ isOver }, drop] = useDrop({
    accept: [DND.ITEMS],

    drop(item) {
      onDropItems(item.items)
    },

    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
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
        <div className="truncate">
          <FormattedMessage id="sidebar.trash"/>
        </div>
      </NodeContainer>
    </li>
  )
})
