'use strict'

const React = require('react')
const { PureComponent } = React
const { PropTypes } = require('prop-types')
const cx = require('classnames')
const { IconTrash } = require('../icons')
const { FormattedMessage } = require('react-intl')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { bool, func } = PropTypes


class TrashListNode extends PureComponent {
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
        <IconTrash/>
        <div className="name">
          <FormattedMessage id="sidebar.trash"/>
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


module.exports = {
  TrashListNode: DropTarget(DND.ITEMS, spec, collect)(TrashListNode)
}
