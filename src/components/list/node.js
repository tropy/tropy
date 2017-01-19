'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const { noop } = require('../../common/util')
const { DragSource, DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { bounds } = require('../../dom')
const cn = require('classnames')


class ListNode extends Component {

  get classes() {
    return {
      list: true,
      active: this.props.isSelected,
      context: this.props.isContext,
      dragging: this.props.isDragging
    }
  }

  sortable(element) {
    const { ds, dt, isSortable } = this.props
    return isSortable ? ds(dt(element)) : element
  }

  handleChange = (name) => {
    const { list: { id, parent }, onSave } = this.props
    onSave(id ? { id, name } : { parent, name })
  }

  handleClick = () => {
    const { list, isSelected, onEdit, onSelect } = this.props

    if (isSelected) {
      onEdit({ list: { id: list.id } })
    } else {
      onSelect({ list: list.id })
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'list', this.props.list.id)
  }

  setContainer = (container) => {
    this.container = container
  }

  render() {
    const { list, isEditing, onEditCancel } = this.props

    return this.sortable(
      <li
        className={cn(this.classes)}
        ref={this.setContainer}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconFolder/>
        <div className="name">
          <Editable
            value={list.name}
            isRequired
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }


  static propTypes = {
    list: PropTypes.shape({
      id: PropTypes.number,
      parent: PropTypes.number,
      name: PropTypes.string
    }),

    isContext: PropTypes.bool,
    isSelected: PropTypes.bool,
    isEditing: PropTypes.bool,
    isSortable: PropTypes.bool,

    isDragging: PropTypes.bool,
    isOver: PropTypes.bool,

    ds: PropTypes.func,
    dt: PropTypes.func.isRequired,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onSelect: PropTypes.func,
    onSave: PropTypes.func,
    onMove: PropTypes.func,
    onMoveReset: PropTypes.func,
    onMoveCommit: PropTypes.func
  }

  static defaultProps = {
    onContextMenu: noop,
    onSelect: noop
  }
}

const dsSpec = {
  beginDrag({ list }) {
    return { id: list.id }
  },

  endDrag({ onMoveReset, onMoveCommit }, monitor) {
    if (monitor.didDrop()) {
      onMoveCommit()
    } else {
      onMoveReset()
    }
  }
}

const dsCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})

const dtSpec = {
  hover({ list, onMove }, monitor, { container }) {
    const item = monitor.getItem()

    if (item.id === list.id) return

    const { top, height } = bounds(container)
    const offset = Math.round((monitor.getClientOffset().y - top) / height)

    onMove(item.id, list.id, offset)
  }
}

const dtCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})

module.exports = {
  ListNode:
    DragSource(DND.LIST, dsSpec, dsCollect)(
      DropTarget(DND.LIST, dtSpec, dtCollect)(ListNode))
}
