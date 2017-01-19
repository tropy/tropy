'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const { noop } = require('../../common/util')
const { DragSource } = require('react-dnd')
const { DND } = require('../../constants')
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

  render() {
    const { ds, list, isEditing, onEditCancel } = this.props

    return ds(
      <li
        className={cn(this.classes)}
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
    isDragging: PropTypes.bool,

    ds: PropTypes.func,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onSelect: PropTypes.func,
    onSave: PropTypes.func
  }

  static defaultProps = {
    onContextMenu: noop,
    onSelect: noop
  }
}

const dsSpec = {
  beginDrag({ list }) {
    return { id: list.id }
  }
}

const dsCollect = (connect, monitor) => ({
  ds: connect.dragSource(),
  isDragging: monitor.isDragging()
})


module.exports = {
  ListNode:
    DragSource(DND.LIST, dsSpec, dsCollect)(ListNode)
}
