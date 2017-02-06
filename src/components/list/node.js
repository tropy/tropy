'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const { DND } = require('../../constants')
const cn = require('classnames')
const dnd = require('./dnd')


class ListNode extends PureComponent {

  get classes() {
    return {
      list: true,
      active: this.props.isSelected,
      context: this.props.isContext,
      dragging: this.props.isDragging,
      over: this.props.isOver && this.props.dtType === DND.ITEMS
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

  setContainer = (container) => {
    this.container = container
  }

  render() {
    const { list, isEditing, onEditCancel } = this.props

    return dnd.connect(this.props,
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

    ds: PropTypes.func.isRequired,
    dt: PropTypes.func.isRequired,
    dtType: PropTypes.string,

    onEdit: PropTypes.func,
    onEditCancel: PropTypes.func,
    onContextMenu: PropTypes.func.isRequired,
    onDropItems: PropTypes.func,
    onSelect: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    onSort: PropTypes.func.isRequired,
    onSortPreview: PropTypes.func.isRequired,
    onSortReset: PropTypes.func.isRequired
  }

}

module.exports = {
  ListNode: dnd.wrap(ListNode)
}
