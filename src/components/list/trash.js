'use strict'

const React = require('react')
const { Component, PropTypes } = React
const cn = require('classnames')
const { IconTrash } = require('../icons')
const { FormattedMessage } = require('react-intl')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')


class TrashListItem extends Component {

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'trash', {})
  }

  handleClick = () => {
    if (!this.props.isSelected) {
      this.props.onSelect({ trash: true })
    }
  }

  render() {
    const { dt, isSelected, isOver } = this.props

    return dt(
      <li
        className={cn({ active: isSelected, over: isOver })}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconTrash/>
        <div className="title">
          <FormattedMessage id="sidebar.trash"/>
        </div>
      </li>
    )
  }

  static propTypes = {
    isSelected: PropTypes.bool,
    isOver: PropTypes.bool,

    dt: PropTypes.func.isRequired,

    onContextMenu: PropTypes.func,
    onSelect: PropTypes.func,
    onDropItem: PropTypes.func
  }
}

module.exports = {
  TrashListItem: DropTarget(DND.ITEM, {
    drop(props, monitor) {
      props.onDropItem(monitor.getItem())
    }
  },
  (connect, monitor) => ({
    dt: connect.dropTarget(),
    isOver: monitor.isOver()
  }))(TrashListItem)
}
