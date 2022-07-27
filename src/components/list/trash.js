import React from 'react'
import { FormattedMessage } from 'react-intl'
import cx from 'classnames'
import { bool, func } from 'prop-types'
import { IconTrash } from '../icons.js'
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
      <div className="list-node-container">
        <IconTrash/>
        <div className="name">
          <div className="truncate">
            <FormattedMessage id="sidebar.trash"/>
          </div>
        </div>
      </div>
    </li>
  )
})

TrashListNode.propTypes = {
  isSelected: bool,
  onClick: func.isRequired,
  onContextMenu: func.isRequired,
  onDropItems: func.isRequired
}
