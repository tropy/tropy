import React from 'react'
import cx from 'classnames'
import { IconTrash } from '../icons'
import { FormattedMessage } from 'react-intl'
import { DND, DropTarget } from '../dnd'
import { bool, func } from 'prop-types'


class TrashListNode extends React.PureComponent {
  get classes() {
    return {
      active: this.props.isSelected,
      over: this.props.isOver
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'trash', {})
  }

  render() {
    const { dt, isSelected, onClick } = this.props

    return dt(
      <li
        className={cx(this.classes)}
        onContextMenu={this.handleContextMenu}
        onClick={isSelected ? null : onClick}>
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
  }

  static propTypes = {
    isOver: bool,
    isSelected: bool,
    dt: func.isRequired,
    onClick: func.isRequired,
    onContextMenu: func.isRequired,
    onDropItems: func.isRequired
  }
}

const spec = {
  drop({ onDropItems }, monitor) {
    onDropItems(monitor.getItem().items)
  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})


const TrashListNodeContainer =
  DropTarget(DND.ITEMS, spec, collect)(TrashListNode)

export {
  TrashListNodeContainer as TrashListNode
}
