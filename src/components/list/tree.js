'use strict'

const React = require('react')
const lazy = require('./node')
const { get } = require('../../common/util')
const { arrayOf, bool, func, number, object, shape } = require('prop-types')


class ListTree extends React.Component {
  isEditing(id) {
    return get(this.props.edit, ['id']) === id
  }

  isExpanded(id) {
    return this.props.expand[id] || this.hasNewListNode(id)
  }

  isSelected(id) {
    return this.props.selection === id
  }

  hasNewListNode(parent = this.props.parent.id) {
    let { edit } = this.props
    return edit && edit.id == null && edit.parent === parent
  }

  mapChildren(fn) {
    return this.props.parent.children.map(id =>
      (id in this.props.lists) && fn(this.props.lists[id])
    )
  }

  render() {
    return (
      <ol className="list-tree" ref={this.setContainer}>
        {this.mapChildren(list =>
          <lazy.ListNode {...this.props}
            key={list.id}
            list={list}
            isSelected={this.isSelected(list.id)}
            isEditing={this.isEditing(list.id)}
            isExpanded={this.isExpanded(list.id)}
            isHolding={this.props.hold[list.id]}/>)}
        {this.hasNewListNode() &&
          <lazy.NewListNode
            parent={this.props.edit.parent}
            onCancel={this.props.onEditCancel}
            onSave={this.props.onSave}/>}
      </ol>
    )
  }

  static propTypes = {
    parent: shape({
      id: number.isRequired,
      children: arrayOf(number).isRequired
    }).isRequired,
    lists: object.isRequired,
    hold: object.isRequired,
    isDraggingParent: bool,
    edit: object,
    expand: object.isRequired,
    selection: number,
    onClick: func.isRequired,
    onCollapse: func.isRequired,
    onContextMenu: func.isRequired,
    onDropFiles: func.isRequired,
    onDropItems: func.isRequired,
    onEditCancel: func.isRequired,
    onExpand: func.isRequired,
    onMove: func.isRequired,
    onSave: func.isRequired
  }
}

module.exports.ListTree = ListTree
